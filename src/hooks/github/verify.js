const crypto = require('crypto');

module.exports = async function verify(event) {
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

  const actual = event.headers['X-Hub-Signature'];
  const expected = `sha1=${crypto
    .createHmac('sha1', process.env.GITHUB_SECRET)
    .update(JSON.stringify(event.body))
    .digest('hex')}`;

  if (!crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
    console.log('Invalid signature');
    return false;
  }

  return true;
};
