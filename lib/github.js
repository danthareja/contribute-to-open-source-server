const axios = require('axios');
const LinkHeader = require('http-link-header');

const github = axios.create({
  baseURL: 'https://api.github.com/repos/danthareja/contribute-to-open-source',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    'User-Agent': 'danthareja/contribute-to-open-source-server'
  }
});

github.getAll = Promise.coroutine(function* getAll(url, options) {
  const response = yield this.get(url, options)

  if (response.headers.link) {
    const link = LinkHeader.parse(response.headers.link);
    if (link.rel('next').length > 0) {
      return response.data.concat(
        yield github.getAll(link.get('rel', 'next')[0].uri)
      )
    }
  }

  return response.data;
});

module.exports = github
