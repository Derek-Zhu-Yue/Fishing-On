function pad(n) { return String(n).padStart(2, '0'); }
function formatDurationSec(sec) { const m = Math.floor(sec/60); const s = sec%60; return `${pad(m)}:${pad(s)}`; }
function formatTime(ts) { const d = new Date(ts); return `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function toRad(d) { return d * Math.PI / 180; }
function distanceKm(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371; // km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

Page({
  data: { 
    tabs: ['Global','Nearby','Following'],
    activeTab: 'Global',
    events: [],
    allEvents: [],
    myLocation: null,
    nearbyRadiusKm: 10
  },
  onShow() {
    const events = (wx.getStorageSync('events') || []).map(e => ({
      ...e,
      durationText: formatDurationSec(e.durationSec || 0),
      timeText: formatTime(e.startedAt || Date.now())
    }));
    this.setData({ allEvents: events }, () => this.applyFilter());
  },
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (!tab || tab === this.data.activeTab) return;
    this.setData({ activeTab: tab }, () => this.applyFilter());
  },
  applyFilter() {
    const tab = this.data.activeTab;
    if (tab === 'Global') { this.setData({ events: this.data.allEvents }); return; }
    if (tab === 'Following') {
      const following = wx.getStorageSync('followingIds') || ['me'];
      const filtered = this.data.allEvents.filter(e => (e.user && following.includes(e.user.id)) || (!e.user && following.includes('me')));
      this.setData({ events: filtered });
      return;
    }
    if (tab === 'Nearby') {
      const proceed = (loc) => {
        const filtered = this.data.allEvents.filter(e => e.location && distanceKm(loc, e.location) <= this.data.nearbyRadiusKm);
        this.setData({ events: filtered, myLocation: loc });
      };
      if (this.data.myLocation) { proceed(this.data.myLocation); return; }
      wx.getLocation({ type: 'gcj02', isHighAccuracy: false, success: (res) => proceed({ latitude: res.latitude, longitude: res.longitude }), fail: () => {
        wx.showToast({ title: 'Location unavailable', icon: 'none' });
        this.setData({ events: this.data.allEvents });
      }});
    }
  },
  openEvent(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/event/event?id=${id}` });
  }
});
