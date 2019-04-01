const Promise = require('bluebird');
const axios = require('axios');
const rax = require('retry-axios');
const LinkHeader = require('http-link-header');
const parseDiff = require('./parseDiff');

const github = axios.create({
  baseURL: 'https://api.github.com/repos/danthareja/contribute-to-open-source',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    'User-Agent': 'danthareja/contribute-to-open-source-server'
  }
});

github.defaults.raxConfig = {
  instance: github
};
rax.attach(github);

github.getAll = Promise.coroutine(function* getAll(url, options) {
  const response = yield this.get(url, options);

  if (response.headers.link) {
    const link = LinkHeader.parse(response.headers.link);
    if (link.rel('next').length > 0) {
      return response.data.concat(
        yield github.getAll(link.get('rel', 'next')[0].uri)
      );
    }
  }

  return response.data;
});

// Guarantee population of the `mergable` attribute
github.getPullRequest = Promise.coroutine(function*(number) {
  const pull = yield github.get(`/pulls/${number}`).then(res => res.data);
  if (typeof pull.mergeable === 'boolean') {
    return pull;
  }
  yield Promise.delay(500);
  return github.getPullRequest(number);
});

github.getPullRequestDiff = Promise.coroutine(function*(number) {
  return github
    .get(`/pulls/${number}`, {
      headers: {
        Accept: 'application/vnd.github.v3.diff'
      }
    })
    .then(res => parseDiff(res.data));
});

module.exports = github;
