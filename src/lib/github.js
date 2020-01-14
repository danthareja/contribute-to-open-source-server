const axios = require('axios');
const rax = require('retry-axios');
const LinkHeader = require('http-link-header');
const parseDiff = require('./parseDiff');

const github = axios.create({
  baseURL: process.env.IS_OFFLINE
    ? 'https://api.github.com/repos/danthareja/contribute-to-open-source-dev'
    : 'https://api.github.com/repos/danthareja/contribute-to-open-source',
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

github.interceptors.response.use(
  function onGithubSuccess(response) {
    return response;
  },
  function onGithubError(error) {
    // This case is caught manually during `fork` event
    if (error.response.status === 422) {
      return Promise.reject(error);
    }
    console.log(error);
    return Promise.reject(
      `GITHUB API ERROR: ${
        error.response.data.message
      } (${error.config.method.toUpperCase()} ${error.config.url})`
    );
  }
);

github.getAll = async function(url, options) {
  const response = await this.get(url, options);

  if (response.headers.link) {
    const link = LinkHeader.parse(response.headers.link);
    if (link.rel('next').length > 0) {
      return response.data.concat(
        await github.getAll(link.get('rel', 'next')[0].uri)
      );
    }
  }

  return response.data;
};

github.getPullRequest = async function(number) {
  const pull = await github.get(`/pulls/${number}`).then(res => res.data);
  if (typeof pull.mergeable === 'boolean') {
    return pull;
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  return github.getPullRequest(number);
};

github.getPullRequestDiff = async function(number) {
  return github
    .get(`/pulls/${number}`, {
      headers: {
        Accept: 'application/vnd.github.v3.diff'
      }
    })
    .then(res => parseDiff(res.data));
};

module.exports = github;
