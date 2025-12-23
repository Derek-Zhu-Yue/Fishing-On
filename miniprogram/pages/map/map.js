Page({
  data: {
    markers: [],
    center: { latitude: 31.2304, longitude: 121.4737 } // default Shanghai
  },
  onShow() {
    const events = (wx.getStorageSync('events') || []).filter(e => e.location);
    const markers = events.map((e, idx) => ({
      id: idx + 1,
      latitude: e.location.latitude,
      longitude: e.location.longitude,
      width: 28,
      height: 28
    }));
    const center = markers.length > 0 ? { latitude: markers[0].latitude, longitude: markers[0].longitude } : this.data.center;
    this.setData({ markers, center });
  }
});
