const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { event: evt } = event || {};
  // TODO: lookup followers and their openIds from your database
  // Example expects: followers = [{ openId: 'openid_xxx' }]
  const followers = [];

  const templateId = process.env.SUBSCRIBE_TEMPLATE_ID || 'TEMPLATE_ID_PLACEHOLDER';
  const results = [];
  for (const f of followers) {
    try {
      const res = await cloud.openapi.subscribeMessage.send({
        touser: f.openId,
        page: `/pages/event/event?id=${evt?.id || ''}`,
        templateId,
        data: {
          thing1: { value: `Fish On: ${evt?.status || ''}` },
          time2: { value: new Date(evt?.startedAt || Date.now()).toISOString().slice(0,16).replace('T',' ') },
          thing3: { value: `${Math.floor((evt?.durationSec || 0)/60)}m fight` }
        }
      });
      results.push({ openId: f.openId, ok: true });
    } catch (e) {
      results.push({ openId: f.openId, ok: false, error: e.message });
    }
  }
  return { count: results.length, results };
};
