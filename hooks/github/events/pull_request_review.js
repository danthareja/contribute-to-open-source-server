const Promise = require('bluebird');
const github = require('../../../lib/github');
const comments = require('../comments');

module.exports = Promise.coroutine(function* pullRequestReview({ action, pull_request, review }) {
  if (action !== 'submitted') {
    console.log(`Ignoring action: ${action} (expected submitted)`);
    return;
  }

  if (review.state !== 'approved') {
    console.log(`Ignoring review state: ${review.state} (expected approved)`);
    return;
  }

  // a full url overrides the configured baseUrl
  // while still using configured authentication credentials
  const authenticatedUser = yield github
    .get('https://api.github.com/user')
    .then(res => res.data)

  if (review.user.login !== authenticatedUser.login) {
    console.log(`Ignoring review user: ${review.user.login} (expected ${authenticatedUser.login})`);
    return;
  }

  console.log(`Merging pull request #${pull_request.number}`);
  yield github.put(`/pulls/${pull_request.number}/merge`);
  yield Promise.delay(1000);
  return github.post(`/issues/${pull_request.number}/comments`, {
    body: comments.pullRequestMerge({ pull: pull_request })
  });
});
