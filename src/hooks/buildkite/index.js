const bugsnag = require('bugsnag');

const verify = require('./verify');
const handle = require('./handle');

module.exports = async function handleBuildkiteWebhook(event, context) {
  try {
    if (await verify(event)) {
      return handle(event);
    }
  } catch (e) {
    bugsnag.notify(e, {
      event,
      context,
      severity: 'error'
    });
    throw e;
  }
};

module.exports.verify = verify;
module.exports.handle = handle;
