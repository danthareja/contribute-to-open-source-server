module.exports = async function verify(event) {
  if (!event.body) {
    console.log('No request body');
    return false;
  }

  if (!event.headers) {
    console.log('No request headers');
    return false;
  }

  if (!event.headers['X-Buildkite-Token']) {
    console.log('Request not signed');
    return false;
  }

  const actual = event.headers['X-Buildkite-Token'];
  const expected = process.env.BUILDKITE_SECRET;

  if (actual !== expected) {
    console.log('Invalid signature');
    return false;
  }

  return true;
};
