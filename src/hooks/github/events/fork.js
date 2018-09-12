const Promise = require('bluebird');
const github = require('../../../lib/github');
const comments = require('../../../comments');

module.exports = Promise.coroutine(function* fork({ forkee }) {
  const master = yield github.get(`/branches/master`).then(res => res.data);

  try {
    console.log(`Cutting branch for ${forkee.owner.login}`);
    yield github.post(`/git/refs`, {
      ref: `refs/heads/${forkee.owner.login}`,
      sha: master.commit.sha
    });
  } catch (e) {
    if (e.response && e.response.status === 422) {
      console.log(`Re-creating branch for ${forkee.owner.login}`);
      yield github.delete(`/git/refs/heads/${forkee.owner.login}`);
      return github.post(`/git/refs`, JSON.parse(e.config.data));
    } else {
      console.log(`Error cutting branch for ${forkee.owner.login}`);
      throw e;
    }
  }
});
