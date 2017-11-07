const Promise = require('bluebird');
const axios = require('axios');
const comments = require('../comments');

const github = axios.create({
  baseURL: 'https://api.github.com/repos/danthareja/contribute-to-open-source',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    'User-Agent': 'danthareja/contribute-to-open-source-server'
  }
});

module.exports = Promise.coroutine(function* issues({ issue, action }) {
  if (action !== 'opened' && action !== 'reopened') {
    console.log(`Ignoring action: ${action}`)
    return
  }

  if (action === 'opened') {
    console.log(`Closing and locking issue #${issue.number}`);
    yield github.post(`/issues/${issue.number}/comments`, {
      body: comments.issueOpen({ issue })
    })
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