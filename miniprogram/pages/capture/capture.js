function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function obfuscate(lat, lng, level = 'coarse') {
  if (!lat || !lng) return null;
  if (level === 'hidden') return null;
  // coarse ~ about 1km precision
  const factor = level === 'coarse' ? 100 : 10; // 2 decimals vs 1
  const oLat = Math.round(lat * factor) / factor;
  const oLng = Math.round(lng * factor) / factor;
  return { latitude: oLat, longitude: oLng, precisionLevel: level };
}

Page({
  data: {
    active: false,
    status: 'Idle',
    startedAt: 0,
    elapsed: '00:00',
    timer: null,
    location: null,
    media: [],
    visibilityOptions: ['Public', 'Followers', 'Private'],
    visibilityIndex: 0,
    locationOptions: ['Hidden', 'Coarse (~1km)', 'Exact'],
    locationIndex: 1
  },
  onUnload() {
    if (this.data.timer) clearInterval(this.data.timer);
  },
  startEvent() {
    const startedAt = Date.now();
    this.setData({ active: true, status: 'Hooked', startedAt });
    const t = setInterval(() => {
      this.setData({ elapsed: formatDuration(Date.now() - this.data.startedAt) });
    }, 1000);
    this.setData({ timer: t });
    this.refreshLocation();
  },
  refreshLocation() {
    const idx = this.data.locationIndex;
    const level = idx === 0 ? 'hidden' : (idx === 1 ? 'coarse' : 'exact');
    if (level === 'hidden') { this.setData({ location: null }); return; }
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: level === 'exact',
      success: (res) => {
        const loc = level === 'exact' ? { latitude: res.latitude, longitude: res.longitude, precisionLevel: 'exact' } : obfuscate(res.latitude, res.longitude, 'coarse');
        this.setData({ location: loc });
      },
      fail: () => { this.setData({ location: null }); }
    });
  },
  onVisibilityChange(e) { this.setData({ visibilityIndex: Number(e.detail.value) }); },
  onLocationChange(e) { this.setData({ locationIndex: Number(e.detail.value) }, () => this.refreshLocation()); },
  addMedia() {
    wx.chooseMedia({
      count: 3,
      mediaType: ['image', 'video'],
      maxDuration: 30,
      sourceType: ['album', 'camera'],
      success: (res) => {
        const media = (res.tempFiles || []).map(f => ({
          type: f.fileType || 'image',
          path: f.tempFilePath || f.tempFilePath,
          duration: f.duration || 0
        }));
        this.setData({ media: this.data.media.concat(media) });
      }
    });
  },
  setOutcome(e) {
    const outcome = e.currentTarget.dataset.outcome || 'Landed';
    this.finishEvent(outcome);
  },
  finishEvent(outcome) {
    if (this.data.timer) clearInterval(this.data.timer);
    const endedAt = Date.now();
    const durationSec = Math.round((endedAt - this.data.startedAt) / 1000);
    const user = wx.getStorageSync('user') || null;
    const me = user ? { id: 'me', name: user.nickName, avatar: user.avatarUrl } : { id: 'me', name: 'Me', avatar: '' };
    const event = {
      id: `e_${endedAt}`,
      status: outcome,
      startedAt: this.data.startedAt,
      endedAt,
      durationSec,
      location: this.data.location,
      media: this.data.media,
      visibility: this.data.visibilityOptions[this.data.visibilityIndex],
      likeCount: 0,
      liked: false,
      commentCount: 0,
      user: me
    };
    const events = wx.getStorageSync('events') || [];
    events.unshift(event);
    wx.setStorageSync('events', events);
    // Optional: trigger cloud notification (will no-op if not configured)
    try {
      const { notifyFollowers } = require('../../utils/notify');
      notifyFollowers({ id: event.id, status: event.status, startedAt: event.startedAt, durationSec: event.durationSec });
    } catch (e) {}
    this.setData({ active: false, status: 'Idle', startedAt: 0, elapsed: '00:00', media: [], timer: null });
    wx.showToast({ title: `Saved: ${outcome}`, icon: 'success' });
    wx.switchTab({ url: '/pages/feed/feed' });
  }
});
