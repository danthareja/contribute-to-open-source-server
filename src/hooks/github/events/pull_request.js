const Promise = require('bluebird');
const github = require('../../../lib/github');
const comments = require('../../../comments');

module.exports = Promise.coroutine(function* pullRequest({ number, action }) {
  if (action !== 'opened' && action !== 'synchronize') {
    console.log(`Ignoring action: ${action}`);
    return;
  }

  console.log(`Processing pull request #${number}`);
  const pull = yield github.getPullRequest(number);

  if (pull.base.ref !== pull.user.login) {
    console.log(
      `Pull request #${number} opened against wrong branch (${
        pull.base.ref
      } instead of ${pull.user.login})`
    );

    yield github.post(`/issues/${pull.number}/comments`, {
      body: comments.pullRequestWrongBranch({ pull })
    });

    console.log(`Closing pull request #${number}`);
    return github.patch(`/pulls/${pull.number}`, { state: 'closed' });
  }

  if (!pull.mergeable) {
    console.log(`Pull request #${number} has a merge conflict`);
    yield github.post(`/issues/${pull.number}/comments`, {
      body: comments.pullRequestMergeConflict({ pull })
    });

    console.log(`Closing pull request #${number}`);
    return github.patch(`/pulls/${pull.number}`, { state: 'closed' });
  }

  if (action === 'opened') {
    console.log(`Pull request #${number} opened for the first time`);
    return github.post(`/issues/${pull.number}/comments`, {
      body: comments.pullRequestOpen({ pull })
    });
  }

  if (action === 'synchronize') {
    console.log(`Pull request #${number} synchronized`);
    return github.post(`/issues/${pull.number}/comments`, {
      body: comments.pullRequestSync({ pull })
    });
  }
});
