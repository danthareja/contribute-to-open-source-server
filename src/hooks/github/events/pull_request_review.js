const github = require('../../../lib/github');
const comments = require('../../../comments');

module.exports = async function pullRequestReview({
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

  // Ensure that we only merge pull requests that our bot account reviews
  const authenticatedUser = await github
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
  await github.put(`/pulls/${pull_request.number}/merge`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await github.post(`/issues/${pull_request.number}/comments`, {
    body: comments.pullRequestMerge({ pull: pull_request })
  });
  return {
    success: true
  };
};
