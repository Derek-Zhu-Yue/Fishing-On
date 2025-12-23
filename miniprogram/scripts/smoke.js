// Paste this file into WeChat DevTools Console, then run: getApp().SMOKE.run()
;(function () {
  function pad(n) { return String(n).padStart(2, '0'); }
  function nowStr() { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }

  function randomChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function jitter(val, max=0.02){ return val + (Math.random()*2-1)*max; }

  function ensureUser(){
    const user = wx.getStorageSync('user') || { nickName: 'Demo Angler', avatarUrl: '' };
    wx.setStorageSync('user', user);
    return { id: 'me', name: user.nickName, avatar: user.avatarUrl };
  }

  function seed(count=3){
    const me = ensureUser();
    const base = { lat: 31.2304, lng: 121.4737 };
    const statuses = ['Landed','Lost','Released'];
    const events = wx.getStorageSync('events') || [];
    const now = Date.now();
    for (let i=0;i<count;i++){
      const offsetMin = (i+1)*5 + Math.floor(Math.random()*5);
      const startedAt = now - offsetMin*60*1000 - 45000;
      const endedAt = now - offsetMin*60*1000;
      const withLoc = Math.random() > 0.3;
      const ev = {
        id: `e_${endedAt}_${i}`,
        status: randomChoice(statuses),
        startedAt, endedAt,
        durationSec: Math.round((endedAt-startedAt)/1000),
        location: withLoc ? { latitude: jitter(base.lat), longitude: jitter(base.lng), precisionLevel: 'coarse' } : null,
        media: [],
        visibility: 'Public', likeCount: 0, liked: false, commentCount: 0,
        user: me,
        species: '', size: '', method: '', notes: ''
      };
      events.unshift(ev);
    }
    wx.setStorageSync('events', events);
    console.log(`[SMOKE ${nowStr()}] Seeded ${count} events (total=${events.length}).`);
    return events;
  }

  function clear(){
    const info = wx.getStorageInfoSync();
    (info.keys || []).forEach(k => { if (k.startsWith('comments_')) wx.removeStorageSync(k); });
    wx.removeStorageSync('events');
    wx.removeStorageSync('followingIds');
    console.log(`[SMOKE ${nowStr()}] Cleared local events, follows, and comments.`);
  }

  function goFeed(){ wx.switchTab({ url: '/pages/feed/feed' }); console.log('[SMOKE] Switched to Feed'); }
  function goMap(){ wx.switchTab({ url: '/pages/map/map' }); console.log('[SMOKE] Switched to Map'); }

  function openFirstEvent(){
    const events = wx.getStorageSync('events') || [];
    if (!events.length) { console.warn('[SMOKE] No events to open'); return; }
    const id = events[0].id;
    wx.navigateTo({ url: `/pages/event/event?id=${id}` });
    console.log('[SMOKE] Opened first event', id);
    return id;
  }

  function likeCurrentEvent(){
    const pages = getCurrentPages();
    const curr = pages[pages.length-1];
    if (curr && typeof curr.toggleLike === 'function') { curr.toggleLike(); console.log('[SMOKE] Toggled like'); return true; }
    console.warn('[SMOKE] toggleLike not available on current page');
    return false;
  }

  function addComment(text='Test comment from SMOKE'){
    const pages = getCurrentPages();
    const curr = pages[pages.length-1];
    const id = curr?.data?.event?.id;
    if (!id) { console.warn('[SMOKE] No event id on current page'); return false; }
    const comments = wx.getStorageSync(`comments_${id}`) || [];
    const c = { id: `c_${Date.now()}`, text, createdAt: Date.now() };
    comments.push(c);
    wx.setStorageSync(`comments_${id}`, comments);
    if (typeof curr.onLoad === 'function') curr.onLoad({ id });
    console.log('[SMOKE] Added comment to', id);
    return true;
  }

  function run(){
    clear();
    seed(3);
    goFeed();
    setTimeout(() => {
      const id = openFirstEvent();
      setTimeout(() => { likeCurrentEvent(); addComment(); }, 400);
      setTimeout(() => { wx.navigateBack({ fail:()=>{} }); }, 900);
      setTimeout(() => { goMap(); }, 1400);
    }, 500);
  }

  const SMOKE = { seed, clear, goFeed, goMap, openFirstEvent, likeCurrentEvent, addComment, run };
  try { getApp().SMOKE = SMOKE; } catch (e) { }
  console.log('[SMOKE] Ready. Run getApp().SMOKE.run()');
})();
