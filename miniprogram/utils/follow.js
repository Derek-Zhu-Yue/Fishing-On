function getFollowingIds() {
  return wx.getStorageSync('followingIds') || [];
}

function setFollowingIds(ids) {
  wx.setStorageSync('followingIds', Array.from(new Set(ids)));
}

function isFollowing(userId) {
  const ids = getFollowingIds();
  return ids.includes(userId);
}

function followUser(user) {
  if (!user || !user.id) return false;
  const ids = getFollowingIds();
  if (!ids.includes(user.id)) ids.push(user.id);
  setFollowingIds(ids);
  return true;
}

function unfollowUser(userId) {
  const ids = getFollowingIds().filter(id => id !== userId);
  setFollowingIds(ids);
}

function getKnownUsers() {
  const events = wx.getStorageSync('events') || [];
  const me = wx.getStorageSync('user') || null;
  const map = {};
  if (me) map['me'] = { id: 'me', name: me.nickName, avatar: me.avatarUrl };
  events.forEach(e => { if (e.user && e.user.id) map[e.user.id] = e.user; });
  return Object.values(map);
}

module.exports = { getFollowingIds, setFollowingIds, isFollowing, followUser, unfollowUser, getKnownUsers };
