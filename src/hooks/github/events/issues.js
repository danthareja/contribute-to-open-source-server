const github = require('../../../lib/github');
const comments = require('../../../comments');

module.exports = async function issues({ issue, action }) {
  if (issue.number === 1) {
    console.log('Ignoring issue #1');
    return;
  }

  if (action !== 'opened' && action !== 'reopened') {
    console.log(`Ignoring action: ${action}`);
    return;
  }

  if (action === 'opened') {
    console.log(`Closing and locking issue #${issue.number}`);
    await github.post(`/issues/${issue.number}/comments`, {
      body: comments.issueOpen({ issue })
    });
    await github.patch(`/issues/${issue.number}`, {
      state: 'closed'
    });
    await github.put(`/issues/${issue.number}/lock`, null, {
      headers: {
        'Content-Length': 0
      }
    });
    return {
      success: true
    };
  }

  if (action === 'reopened') {
    console.log(`Closing reopened issue #${issue.number}`);
    await github.patch(`/issues/${issue.number}`, {
      state: 'closed'
    });
    return {
      success: true
    };
  }
};
