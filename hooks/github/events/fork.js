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


module.exports = Promise.coroutine(function* fork({ forkee }) {
  const master = yield github.get(`/branches/master`).then(res => res.data);

  try {
    console.log(`Cutting branch for ${forkee.owner.login}`);
    yield github.post(`/git/refs`, {
      ref: `refs/heads/${forkee.owner.login}`,
      sha: master.commit.sha
    });
  } catch (e) {
    if (
      e.response &&
      e.response.status === 422
    ) {
      console.log(`Re-creating branch for ${forkee.owner.login}`);
      yield github.delete(`/git/refs/heads/${forkee.owner.login}`);
      return github.post(`/git/refs`, JSON.parse(e.config.data));
    } else {
      console.log(`Error cutting branch for ${forkee.owner.login}`)
      throw e;
    }
  }
});