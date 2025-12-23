function pad(n) { return String(n).padStart(2, '0'); }
function formatDurationSec(sec) { const m = Math.floor(sec/60); const s = sec%60; return `${pad(m)}:${pad(s)}`; }
function formatTime(ts) { const d = new Date(ts); return `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }

Page({
  data: {
    event: null,
    durationText: '00:00',
    timeText: '',
    comments: [],
    commentDraft: '',
    species: '',
    size: '',
    method: '',
    notes: '',
    canFollow: false,
    following: false
  },
  onLoad(query) {
    const id = query.id;
    const events = wx.getStorageSync('events') || [];
    const event = events.find(e => e.id === id) || null;
    const comments = (wx.getStorageSync(`comments_${id}`) || []);
    if (event) {
      const meId = 'me';
      const canFollow = !!(event.user && event.user.id && event.user.id !== meId);
      let following = false;
      if (canFollow) {
        try {
          const { isFollowing } = require('../../utils/follow');
          following = isFollowing(event.user.id);
        } catch (e) {}
      }
      this.setData({
        event,
        durationText: formatDurationSec(event.durationSec || 0),
        timeText: formatTime(event.startedAt || Date.now()),
        comments,
        species: event.species || '',
        size: event.size || '',
        method: event.method || '',
        notes: event.notes || '',
        canFollow,
        following
      });
    }
  },
  toggleLike() {
    const event = this.data.event;
    if (!event) return;
    const events = wx.getStorageSync('events') || [];
    const idx = events.findIndex(e => e.id === event.id);
    if (idx >= 0) {
      const liked = !events[idx].liked;
      events[idx].liked = liked;
      events[idx].likeCount = (events[idx].likeCount || 0) + (liked ? 1 : -1);
      wx.setStorageSync('events', events);
      this.setData({ event: events[idx] });
    }
  },
  onShareAppMessage() {
    const e = this.data.event;
    return {
      title: `Fish On: ${e?.status || ''} (${this.data.durationText})`,
      path: `/pages/event/event?id=${e?.id}`
    };
  },
  onCommentInput(e) { this.setData({ commentDraft: e.detail.value }); },
  addComment() {
    const text = (this.data.commentDraft || '').trim();
    if (!text) return;
    const id = this.data.event.id;
    const comments = wx.getStorageSync(`comments_${id}`) || [];
    const c = { id: `c_${Date.now()}`, text, createdAt: Date.now() };
    comments.push(c);
    wx.setStorageSync(`comments_${id}`, comments);
    this.setData({ comments, commentDraft: '' });
    // bump commentCount on the event
    const events = wx.getStorageSync('events') || [];
    const idx = events.findIndex(e => e.id === id);
    if (idx >= 0) { events[idx].commentCount = (events[idx].commentCount || 0) + 1; wx.setStorageSync('events', events); }
  },
  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    if (!field) return;
    this.setData({ [field]: value });
  },
  saveChanges() {
    const e = this.data.event;
    if (!e) return;
    const events = wx.getStorageSync('events') || [];
    const idx = events.findIndex(x => x.id === e.id);
    if (idx >= 0) {
      events[idx] = {
        ...events[idx],
        species: this.data.species,
        size: this.data.size,
        method: this.data.method,
        notes: this.data.notes
      };
      wx.setStorageSync('events', events);
      this.setData({ event: events[idx] });
      wx.showToast({ title: 'Saved', icon: 'success' });
    }
  },
  deleteEvent() {
    const e = this.data.event;
    if (!e) return;
    wx.showModal({
      title: 'Delete Event',
      content: 'This will remove the event and its local comments.',
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return;
        const events = wx.getStorageSync('events') || [];
        const rest = events.filter(x => x.id !== e.id);
        wx.setStorageSync('events', rest);
        wx.removeStorageSync(`comments_${e.id}`);
        wx.showToast({ title: 'Deleted', icon: 'success' });
        setTimeout(() => { wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/feed/feed' }) }); }, 300);
      }
    });
  },
  addMoreMedia() {
    const e = this.data.event;
    if (!e) return;
    const current = e.media || [];
    const remaining = Math.max(0, 3 - current.length);
    if (remaining <= 0) { wx.showToast({ title: 'Max 3 media', icon: 'none' }); return; }
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image', 'video'],
      maxDuration: 30,
      sourceType: ['album', 'camera'],
      success: (res) => {
        const added = (res.tempFiles || []).map(f => ({
          type: f.fileType || 'image',
          path: f.tempFilePath || f.tempFilePath,
          duration: f.duration || 0
        }));
        const events = wx.getStorageSync('events') || [];
        const idx = events.findIndex(x => x.id === e.id);
        if (idx >= 0) {
          events[idx].media = (events[idx].media || []).concat(added).slice(0,3);
          wx.setStorageSync('events', events);
          this.setData({ event: events[idx] });
        }
      }
    });
  },
  openLocation() {
    const loc = this.data.event?.location;
    if (!loc) return;
    wx.openLocation({ latitude: loc.latitude, longitude: loc.longitude, name: 'Fish On Location' });
  },
  previewImage(e) {
    const cur = e.currentTarget.dataset.src;
    const imgs = (this.data.event?.media || []).filter(m => m.type === 'image').map(m => m.path);
    if (imgs.length) wx.previewImage({ current: cur, urls: imgs });
  },
  async toggleFollow() {
    const evt = this.data.event;
    if (!evt || !evt.user || !evt.user.id) return;
    const followApi = require('../../utils/follow');
    const notifyApi = require('../../utils/notify');
    if (this.data.following) {
      followApi.unfollowUser(evt.user.id);
      this.setData({ following: false });
      wx.showToast({ title: 'Unfollowed', icon: 'none' });
    } else {
      followApi.followUser(evt.user);
      this.setData({ following: true });
      const res = await notifyApi.requestSubscription();
      wx.showToast({ title: 'Following', icon: 'success' });
    }
  },
  formatTime(ts) { return formatTime(ts); }
});
