const Promise = require('bluebird');
const crypto = require('crypto');
const events = require('./events');

/**
 * GitHub verification strategy:
 * https://developer.github.com/webhooks/securing/
 */
const verify = Promise.coroutine(function* verify(event) {
  if (!event.body) {
    throw new Error('No request body');
  }

  if (!event.headers) {
    throw new Error('No request headers');
  }

  if (!event.headers['X-Hub-Signature']) {
    throw new Error('Request not signed');
  }

  const expected = event.headers['X-Hub-Signature'];
  const actual = `sha1=${crypto
    .createHmac('sha1', process.env.GITHUB_SECRET)
    .update(JSON.stringify(event.body))
    .digest('hex')}`;

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
    throw new Error('Signature does not match');
  }
});

const handle = Promise.coroutine(function* handle(event) {
  const type = event.headers['X-GitHub-Event'];
  console.log(`Processing GitHub event: ${type}`);

  if (!events[type]) {
    throw new Error(
      `GitHub event ${type} not implemented. Please uncheck it from webhook settings.`
    );
  }

  return events[type](event.body);
});

module.exports = Promise.coroutine(function* main(event, context, callback) {
  try {
    yield verify(event);
    yield handle(event);
    return callback();
  } catch (e) {
    console.log('Uncaught error');
    console.log(e);
    return callback(e);
  }
});

module.exports.verify = verify;
module.exports.handle = handle;
