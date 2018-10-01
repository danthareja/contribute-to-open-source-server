const Promise = require('bluebird');
const crypto = require('crypto');
const bugsnag = require('bugsnag');
const events = require('./events');

const verify = Promise.coroutine(function* verify(event) {
  if (!event.body) {
    console.log('No request body');
    return false;
  }

  if (!event.headers) {
    console.log('No request headers');
    return false;
  }

  if (!event.headers['X-Hub-Signature']) {
    console.log('Request not signed');
    return false;
  }

  const expected = event.headers['X-Hub-Signature'];
  const actual = `sha1=${crypto
    .createHmac('sha1', process.env.GITHUB_SECRET)
    .update(JSON.stringify(event.body))
    .digest('hex')}`;

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
    console.log('Invalid signature');
    return false;
  }

  return true;
});

const handle = Promise.coroutine(function* handle(event) {
  const type = event.headers['X-GitHub-Event'];
  console.log(`Processing GitHub event: ${type}`);

  if (!events[type]) {
    throw new Error(
      `GitHub event ${type} not implemented. Please an implementation in events/ or uncheck it from the repo's webhook settings.`
    );
  }

  return events[type](event.body);
});

module.exports = Promise.coroutine(function* main(event, context, callback) {
  try {
    if (yield verify(event)) {
      yield handle(event);
    }
    return callback(null);
  } catch (e) {
    bugsnag.notify(e, {
      event,
      context,
      severity: 'error'
    });
    return callback(e);
  }
});

module.exports.verify = verify;
module.exports.handle = handle;
