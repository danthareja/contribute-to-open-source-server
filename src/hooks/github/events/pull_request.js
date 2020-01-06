const github = require('../../../lib/github');
const comments = require('../../../comments');

module.exports = async function pullRequest({ number, action }) {
  if (action !== 'opened' && action !== 'synchronize') {
    console.log(`Ignoring action: ${action}`);
    return;
  }

  console.log(`Processing pull request #${number}`);
  const pull = await github.getPullRequest(number);

  if (pull.base.ref !== pull.user.login) {
    console.log(
      `Pull request #${number} opened against wrong branch (${
        pull.base.ref
      } instead of ${pull.user.login})`
    );

    await github.post(`/issues/${pull.number}/comments`, {
      body: comments.pullRequestWrongBranch({ pull })
    });

    console.log(`Closing pull request #${number}`);
    await github.patch(`/pulls/${pull.number}`, { state: 'closed' });
    return {
      success: true
    };
  }

  if (!pull.mergeable) {
    console.log(`Pull request #${number} has a merge conflict`);
    await github.post(`/issues/${pull.number}/comments`, {
      body: comments.pullRequestMergeConflict({ pull })
    });

    console.log(`Closing pull request #${number}`);
    await github.patch(`/pulls/${pull.number}`, { state: 'closed' });
    return {
      success: true
    };
  }

  if (action === 'opened') {
    console.log(`Pull request #${number} opened for the first time`);
    await github.post(`/issues/${pull.number}/comments`, {
      body: comments.pullRequestOpen({ pull })
    });
    return {
      success: true
    };
  }

  if (action === 'synchronize') {
    console.log(`Pull request #${number} synchronized`);
    await github.post(`/issues/${pull.number}/comments`, {
      body: comments.pullRequestSync({ pull })
    });
    return {
      success: true
    };
  }
};
