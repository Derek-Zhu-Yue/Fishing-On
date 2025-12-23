Page({
  data: { user: null, eventCount: 0 },
  onShow() {
    const user = wx.getStorageSync('user') || null;
    const events = wx.getStorageSync('events') || [];
    this.setData({ user, eventCount: events.length });
  },
  login() {
    if (this.data.user) return;
    wx.getUserProfile({
      desc: 'Show your avatar and nickname',
      success: (res) => {
        const user = res.userInfo;
        wx.setStorageSync('user', user);
        getApp().globalData.user = user;
        this.setData({ user });
      }
    });
  },
  goCapture() { wx.switchTab({ url: '/pages/capture/capture' }); },
  goPeople() { wx.navigateTo({ url: '/pages/people/people' }); },
  seedDemo() {
    const now = Date.now();
    const user = wx.getStorageSync('user') || { nickName: 'Demo Angler', avatarUrl: '' };
    const me = { id: 'me', name: user.nickName, avatar: user.avatarUrl };
    function ev(offsetMin, status, lat, lng) {
      const startedAt = now - offsetMin*60*1000 - 45000;
      const endedAt = now - offsetMin*60*1000;
      return {
        id: `e_${endedAt}_${status}`,
        status,
        startedAt,
        endedAt,
        durationSec: Math.round((endedAt - startedAt)/1000),
        location: lat && lng ? { latitude: lat, longitude: lng, precisionLevel: 'coarse' } : null,
        media: [],
        visibility: 'Public',
        likeCount: 1,
        liked: false,
        commentCount: 0,
        user: me,
        species: '', size: '', method: '', notes: ''
      };
    }
    const base = { lat: 31.23, lng: 121.47 };
    const events = wx.getStorageSync('events') || [];
    const demos = [
      ev(5, 'Landed', base.lat + 0.01, base.lng + 0.01),
      ev(15, 'Lost', base.lat + 0.02, base.lng - 0.015),
      ev(30, 'Released', null, null)
    ];
    const merged = demos.concat(events);
    wx.setStorageSync('events', merged);
    this.setData({ eventCount: merged.length });
    wx.showToast({ title: 'Seeded 3 events', icon: 'success' });
  },
  clearDemo() {
    wx.removeStorageSync('events');
    wx.removeStorageSync('followingIds');
    // remove all local comments (wildcard not supported; leave as-is)
    this.setData({ eventCount: 0 });
    wx.showToast({ title: 'Cleared local data', icon: 'success' });
  },
  runSmokeTest() {
    const pad = (n) => String(n).padStart(2, '0');
    const nowStr = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
    const randomChoice = (arr) => arr[Math.floor(Math.random()*arr.length)];
    const jitter = (val, max=0.02) => val + (Math.random()*2-1)*max;

    // Step 1: clear
    try {
      const info = wx.getStorageInfoSync();
      (info.keys || []).forEach(k => { if (k.startsWith('comments_')) wx.removeStorageSync(k); });
    } catch (e) {}
    wx.removeStorageSync('events');
    wx.removeStorageSync('followingIds');
    // Step 2: seed 3 events
    const user = wx.getStorageSync('user') || { nickName: 'Demo Angler', avatarUrl: '' };
    const me = { id: 'me', name: user.nickName, avatar: user.avatarUrl };
    const base = { lat: 31.2304, lng: 121.4737 };
    const statuses = ['Landed','Lost','Released'];
    const events = [];
    const now = Date.now();
    for (let i=0;i<3;i++){
      const offsetMin = (i+1)*5;
      const startedAt = now - offsetMin*60*1000 - 45000;
      const endedAt = now - offsetMin*60*1000;
      const withLoc = Math.random() > 0.3;
      events.unshift({
        id: `e_${endedAt}_${i}`,
        status: randomChoice(statuses),
        startedAt, endedAt,
        durationSec: Math.round((endedAt-startedAt)/1000),
        location: withLoc ? { latitude: jitter(base.lat), longitude: jitter(base.lng), precisionLevel: 'coarse' } : null,
        media: [], visibility: 'Public', likeCount: 0, liked: false, commentCount: 0,
        user: me, species: '', size: '', method: '', notes: ''
      });
    }
    wx.setStorageSync('events', events);
    this.setData({ eventCount: events.length });
    wx.showToast({ title: 'Smoke: seeded', icon: 'success' });

    // Step 3: go to Feed, open first event, like, comment, then Map
    setTimeout(() => {
      wx.switchTab({ url: '/pages/feed/feed' });
      setTimeout(() => {
        const id = (wx.getStorageSync('events') || [])[0]?.id;
        if (id) {
          wx.navigateTo({ url: `/pages/event/event?id=${id}` });
          setTimeout(() => {
            const pages = getCurrentPages();
            const curr = pages[pages.length-1];
            if (curr && typeof curr.toggleLike === 'function') curr.toggleLike();
            const commentsKey = `comments_${id}`;
            const cs = wx.getStorageSync(commentsKey) || [];
            cs.push({ id: `c_${Date.now()}`, text: `Smoke OK @ ${nowStr()}`, createdAt: Date.now() });
            wx.setStorageSync(commentsKey, cs);
            if (curr && typeof curr.onLoad === 'function') curr.onLoad({ id });
          }, 400);
          setTimeout(() => { wx.navigateBack({ fail:()=>{} }); }, 900);
          setTimeout(() => { wx.switchTab({ url: '/pages/map/map' }); }, 1400);
        }
      }, 400);
    }, 200);
  }
});
