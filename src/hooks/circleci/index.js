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
    console.log('No request body');
    return false;
  }

  if (!event.body.payload) {
    console.log('No payload');
    return false;
  }

  if (!event.body.payload.build_num) {
    console.log('No build number');
    return false;
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
    console.log(`
      Payload for #${event.body.payload.build_num} does not match API result.

      Differences: ${JSON.stringify(differences, null, 2)}
    `);
    return false;
  }

  return true;
});

const handle = Promise.coroutine(function*(event) {
  const { build_num, branch, outcome, status } = event.body.payload;
  console.log(`Processing build #${build_num}`);

  if (outcome === 'canceled' || status === 'canceled') {
    console.log(`Skipping build #${build_num} because it was canceled`);
    return;
  }

  const pull_num = (branch.match(/pull\/(\d+)/) || [])[1];
  if (!pull_num) {
    console.log(
      `Skipping build #${build_num} because it is not a pull request (branch "${branch}")`
    );
    return;
  }

  const pull = yield github.getPullRequest(pull_num);
  if (pull.base.ref !== pull.user.login) {
    console.log(
      `Skipping build ${build_num} because it is for a pull request opened against wrong branch (${
        pull.base.ref
      } instead of ${pull.user.login})`
    );
    return;
  }

  const [artifacts, diff] = yield Promise.all([
    circleci.getArtifacts(build_num, ['mocha.json', 'eslint.json']),
    github.getPullRequestDiff(pull_num)
  ]);

  const reports = [
    new ESLintReport(artifacts.eslint, diff, pull),
    new MochaReport(artifacts.mocha, diff, pull)
  ];

  const hasErrors = reports.some(report => report.hasErrors());

  return github.post(`/pulls/${pull.number}/reviews`, {
    event: hasErrors ? 'REQUEST_CHANGES' : 'APPROVE',
    body: reports
      .reduce((body, report) => body.concat(report.getReviewBody()), [
        comments.pullRequestReviewHeader({ pull, hasErrors })
      ])
      .join('\n\n'),
    comments: reports.reduce(
      (comments, report) => comments.concat(report.getReviewComments()),
      []
    )
  });
});

module.exports = Promise.coroutine(function*(event, context, callback) {
  try {
    if (yield verify(event)) {
      yield handle(event);
    }
    return callback(null);
  } catch (e) {
    bugsnag.notify(e, {
      event,
      context,
      severity: 'error'
    });
    return callback(e);
  }
});

module.exports.verify = verify;
module.exports.handle = handle;
