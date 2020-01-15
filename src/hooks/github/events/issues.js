const github = require('../../../lib/github');
const comments = require('../../../comments');

module.exports = async function issues({ issue, action }) {
  if (issue.number === 1) {
    console.log('Ignoring issue #1');
    return;
  }

  const allowedActions = ['opened', 'reopened'];

  if (allowedActions.indexOf(action) === -1) {
    console.log(`Ignoring action: ${action}`);
    return;
  }

  if (action === 'opened') {
    console.log(`Closing opened issue #${issue.number}`);
    await github.post(`/issues/${issue.number}/comments`, {
      body: comments.issueOpen({ issue })
    });
  }

  await github.patch(`/issues/${issue.number}`, {
    state: 'closed'
  });

  return {
    success: true
  };
};
