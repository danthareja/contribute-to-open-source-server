const Promise = require('bluebird');
const crypto = require('crypto');
const bugsnag = require('bugsnag');
const events = require('./events');

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
    throw new Error('Invalid signature');
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
  } catch (e) {
    console.log('Verify error');
    console.log(e);
    bugsnag.notify(e, { event });
    return callback(e);
  }

  try {
    yield handle(event);
  } catch (e) {
    console.log('Handle error');
    console.log(e);
    bugsnag.notify(e, {
      event,
      severity: 'error'
    });
    return callback(e);
  }
});

module.exports.verify = verify;
module.exports.handle = handle;
