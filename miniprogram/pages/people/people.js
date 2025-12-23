const followApi = require('../../utils/follow');

Page({
  data: { users: [] },
  onShow() { this.refresh(); },
  refresh() {
    const list = followApi.getKnownUsers();
    const following = new Set(followApi.getFollowingIds());
    const users = list.map(u => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      following: following.has(u.id),
      followable: u.id !== 'me'
    }));
    this.setData({ users });
  },
  toggleFollow(e) {
    const id = e.currentTarget.dataset.id;
    const idx = e.currentTarget.dataset.index;
    if (id === 'me') return;
    const users = this.data.users.slice();
    const cur = users[idx];
    if (!cur) return;
    if (cur.following) {
      followApi.unfollowUser(id);
      cur.following = false;
      wx.showToast({ title: 'Unfollowed', icon: 'none' });
    } else {
      followApi.followUser({ id, name: cur.name, avatar: cur.avatar });
      cur.following = true;
      wx.showToast({ title: 'Following', icon: 'success' });
    }
    this.setData({ users });
  }
});
