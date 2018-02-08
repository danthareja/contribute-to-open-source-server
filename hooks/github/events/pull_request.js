const Promise = require('bluebird');
const axios = require('axios');
const github = require('../../../lib/github');
const circleci = require('../../../lib/circleci');
const comments = require('../comments');

module.exports = Promise.coroutine(function* pullRequest({ number, action }) {
  if (action !== 'opened' && action !== 'synchronize') {
    console.log(`Ignoring action: ${action}`);
    return;
  }

  console.log(`Processing pull request #${number}`);
  const pull = yield getPullRequest(number);

  if (pull.base.ref !== pull.user.login) {
    console.log(
      `Pull request #${number} opened against wrong branch (${pull.base
        .ref} instead of ${pull.user.login})`
    );

    const builds = yield circleci.get('/').then(res => res.data);
    const buildsForThisPull = builds
      .filter(build => build.branch === `pull/${pull.number}`)
      .sort((a, b) => b.build_num - a.build_num);

    if (buildsForThisPull.length > 0) {
      console.log(
        `Canceling CircleCI build #${buildsForThisPull[0].build_num}`
      );
      yield circleci.post(`/${buildsForThisPull[0].build_num}/cancel`);
    }

    yield github.post(`/issues/${pull.number}/comments`, {
      body: comments.pullRequestWrongBranch({ pull })
    });

    console.log(`Closing pull request #${number}`);
    return github.patch(`/pulls/${pull.number}`, { state: 'closed' });
  }

  if (!pull.mergeable) {
    console.log(`Pull request #${number} has a merge conflict`);
    yield github.post(`/issues/${pull.number}/comments`, {
      body: comments.pullRequestMergeConflict({ pull })
    });

    console.log(`Closing pull request #${number}`);
    return github.patch(`/pulls/${pull.number}`, { state: 'closed' });
  }

  if (action === 'opened') {
    console.log(`Pull request #${number} opened for the first time`);
    return github.post(`/issues/${pull.number}/comments`, {
      body: comments.pullRequestOpen({ pull })
    });
  }

  if (action === 'synchronize') {
    console.log(`Pull request #${number} synchronized`);
    return github.post(`/issues/${pull.number}/comments`, {
      body: comments.pullRequestSync({ pull })
    });
  }
});

// Guarantee population of the `mergable` attribute
const getPullRequest = Promise.coroutine(function*(number) {
  const pull = yield github.get(`/pulls/${number}`).then(res => res.data);
  if (typeof pull.mergeable === 'boolean') {
    return pull;
  }
  yield Promise.delay(500);
  return getPullRequest(number);
});
