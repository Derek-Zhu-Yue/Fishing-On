Page({
  login() {
    wx.getUserProfile({
      desc: 'Show your avatar and nickname',
      success: (res) => {
        const user = res.userInfo;
        wx.setStorageSync('user', user);
        getApp().globalData.user = user;
        wx.switchTab({ url: '/pages/profile/profile' });
      }
    });
  }
});
