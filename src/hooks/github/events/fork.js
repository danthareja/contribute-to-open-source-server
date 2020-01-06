const github = require('../../../lib/github');

module.exports = async function fork({ forkee }) {
  const master = await github.get(`/branches/master`).then(res => res.data);

  try {
    console.log(`Cutting branch for ${forkee.owner.login}`);
    await github.post(`/git/refs`, {
      ref: `refs/heads/${forkee.owner.login}`,
      sha: master.commit.sha
    });
    return {
      success: true
    };
  } catch (e) {
    if (e.response && e.response.status === 422) {
      console.log(`Re-creating branch for ${forkee.owner.login}`);
      await github.delete(`/git/refs/heads/${forkee.owner.login}`);
      await github.post(`/git/refs`, JSON.parse(e.config.data));
      return {
        success: true
      };
    } else {
      console.log(`Error cutting branch for ${forkee.owner.login}`);
      throw e;
    }
  }
};
