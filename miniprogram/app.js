App({
  onLaunch() {
    const events = wx.getStorageSync('events') || [];
    wx.setStorageSync('events', events);
    try {
      if (wx.cloud) {
        wx.cloud.init({ env: wx.getStorageSync('cloudEnv') || '' });
      }
    } catch (e) {}
  },
  globalData: {
    user: null
  }
});
