const TEMPLATE_IDS = ['TEMPLATE_ID_PLACEHOLDER'];

function requestSubscription(templateIds = TEMPLATE_IDS) {
  return new Promise((resolve) => {
    wx.requestSubscribeMessage({ tmplIds: templateIds, success: (res) => resolve(res), fail: () => resolve(null) });
  });
}

async function notifyFollowers(eventSummary) {
  try {
    if (!wx.cloud) return false;
    await wx.cloud.callFunction({ name: 'notifyFollowers', data: { event: eventSummary } });
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { requestSubscription, notifyFollowers, TEMPLATE_IDS };
