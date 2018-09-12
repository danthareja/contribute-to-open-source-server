const Promise = require('bluebird');
const path = require('path');
const axios = require('axios');
const deep = require('deep-diff');
const bugsnag = require('bugsnag');

const github = require('../../lib/github');
const circleci = require('../../lib/circleci');
const comments = require('../../comments');

const ESLintReport = require('./reports/eslint');
const MochaReport = require('./reports/mocha');

const verify = Promise.coroutine(function*(event) {
  if (!event.body) {
    throw new Error('No request body');
  }

  if (!event.body.payload) {
    throw new Error('No payload');
  }

  if (!event.body.payload.build_num) {
    throw new Error('No build number');
  }

  const build = yield circleci
    .get(`/${event.body.payload.build_num}`)
    .then(res => res.data);

  const differences = deep.diff(build, event.body.payload).filter(
    d =>
      // Some keys from the webhook's payload will be slightly different
      // from the response from the Build API.
      // Because this is expected, we can safely exclude them from the check
      !d.path.includes('output_url') && !d.path.includes('ssh_enabled')
  );

  if (differences.length > 0) {
    throw new Error(`
      Payload for #${event.body.payload.build_num} does not match API result.

      Differences: ${JSON.stringify(differences, null, 2)}
    `);
  }
});

const handle = Promise.coroutine(function*(event) {
  const { build_num, branch, outcome, status } = event.body.payload;
  console.log(`Processing build #${build_num}`);

  if (outcome === 'canceled' || status === 'canceled') {
    console.log(`Skipping build #${build_num} because it was canceled`);
    return;
  }

  if (outcome === 'failed' || status === 'failed') {
    console.log(`Skipping build #${build_num} because it failed`);
    return;
  }

  const pull_num = (branch.match(/pull\/(\d+)/) || [])[1];
  if (!pull_num) {
    console.log(
      `Skipping build #${build_num} because it is not a pull request (branch "${branch}")`
    );
    return;
  }

  const [artifacts, diff, pull] = yield Promise.all([
    circleci.getArtifacts(build_num, ['mocha.json', 'eslint.json']),
    github.getPullRequestDiff(pull_num),
    github.getPullRequest(pull_num)
  ]);

  const eslint = new ESLintReport(artifacts.eslint, diff, pull);
  const mocha = new MochaReport(artifacts.mocha, diff, pull);

  if (eslint.hasErrors() || mocha.hasErrors()) {
    console.log(`Requesting changes for pull request #${pull.number}`);
    return github.post(`/pulls/${pull.number}/reviews`, {
      event: 'REQUEST_CHANGES',
      body: [
        comments.reviewRequestChangesHeader({ pull }),
        mocha.getReviewBody(),
        eslint.getReviewBody(),
        comments.reviewRequestChangesFooter({ pull })
      ].join('\n\n'),
      comments: [...mocha.getReviewComments(), ...eslint.getReviewComments()]
    });
  }

  console.log(`Approving pull request #${pull.number}`);
  return github.post(`/pulls/${pull.number}/reviews`, {
    event: 'APPROVE',
    body: comments.reviewApprove({ pull })
  });
});

module.exports = Promise.coroutine(function*(event, context, callback) {
  try {
    yield verify(event);
  } catch (e) {
    console.log('Verify error');
    console.log(e);
    bugsnag.notify(e, { event });
    return callback(e);
  }

  try {
    yield handle(event);
  } catch (e) {
    console.log('Handle error');
    console.log(e);
    bugsnag.notify(e, {
      event,
      severity: 'error'
    });
    return callback(e);
  }
});

module.exports.verify = verify;
module.exports.handle = handle;
