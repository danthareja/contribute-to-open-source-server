const Promise = require('bluebird');
const github = require('../../../lib/github');
const comments = require('../../../comments');

module.exports = Promise.coroutine(function* issues({ issue, action }) {
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
    yield github.post(`/issues/${issue.number}/comments`, {
      body: comments.issueOpen({ issue })
    });
    yield github.patch(`/issues/${issue.number}`, {
      state: 'closed'
    });
    return github.put(`/issues/${issue.number}/lock`, null, {
      headers: {
        'Content-Length': 0
      }
    });
  }

  if (action === 'reopened') {
    console.log(`Closing reopened issue #${issue.number}`);
    yield github.patch(`/issues/${issue.number}`, {
      state: 'closed'
    });
  }
});
