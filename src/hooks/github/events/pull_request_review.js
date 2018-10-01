const Promise = require('bluebird');
const github = require('../../../lib/github');
const comments = require('../../../comments');

module.exports = Promise.coroutine(function* pullRequestReview({
  action,
  pull_request,
  review
}) {
  if (action !== 'submitted') {
    console.log(`Ignoring action: ${action} (expected submitted)`);
    return;
  }

  if (review.state !== 'approved') {
    console.log(`Ignoring review state: ${review.state} (expected approved)`);
    return;
  }

  // Ensure that we only merge pull requests made to the correct branch
  // The `pull_request` event will close the PR on GitHub, but the CircleCI build still runs
  // This is an extra safeguard in case the CircleCI hook submits an approved review
  if (pull_request.base.ref !== pull_request.user.login) {
    console.log(
      `Ignoring review for pull request #${
        pull_request.number
      } opened against wrong branch (${pull_request.base.ref} instead of ${
        pull_request.user.login
      })`
    );
    return;
  }

  // Ensure that we only merge pull requests that our bot account reviews
  const authenticatedUser = yield github
    .get('https://api.github.com/user')
    .then(res => res.data);

  if (review.user.login !== authenticatedUser.login) {
    console.log(
      `Ignoring review user: ${review.user.login} (expected ${
        authenticatedUser.login
      })`
    );
    return;
  }

  console.log(`Merging pull request #${pull_request.number}`);
  yield github.put(`/pulls/${pull_request.number}/merge`);
  yield Promise.delay(1000);
  return github.post(`/issues/${pull_request.number}/comments`, {
    body: comments.pullRequestMerge({ pull: pull_request })
  });
});
