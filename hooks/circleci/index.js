const Promise = require('bluebird');
const path = require('path');
const axios = require('axios');
const deepDiff = require('deep-diff').diff;

const ESLint = require('./eslint');
const Mocha = require('./mocha');
const parseDiff = require('./diffparser');

const comments = require('./comments');

const github = axios.create({
  baseURL: 'https://api.github.com/repos/danthareja/contribute-to-open-source',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    'User-Agent': '@danthareja'
  }
});

const circleci = axios.create({
  baseURL:
    'https://circleci.com/api/v1.1/project/github/danthareja/contribute-to-open-source',
  params: {
    'circle-token': process.env.CIRCLECI_TOKEN
  }
});

/**
 * CircleCI verification strategy:
 * The webhook payload should be identical to the Build API
 * (source: https://circleci.com/docs/1.0/configuration/#notify)
 * We can verify the payload against an independent GET request to the Build API
 */
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

  // Two GET requests for the same build will return different 'output_urls'
  // Because this is expected, we can safely exclude them from the check
  const differences = deepDiff(build, event.body.payload).filter(
    d => !d.path.includes('output_url')
  );

  if (differences.length > 0) {
    throw new Error('Payload does not match');
  }
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

  const [reports, diff, pull] = yield Promise.all([
    getReports(build_num),
    getPullRequestDiff(pull_num),
    getPullRequest(pull_num)
  ]);

  const eslint = new ESLint(reports.eslint, diff, pull);
  const mocha = new Mocha(reports.mocha, diff, pull);

  if (!eslint.hasErrors() && !mocha.hasErrors()) {
    console.log(`Approving pull request #${pull.number}`);
    yield github.post(`/pulls/${pull.number}/reviews`, {
      event: 'APPROVE',
      body: comments.reviewApprove({ pull })
    });
    console.log(`Merging pull request #${pull.number}`);
    yield github.put(`/pulls/${pull.number}/merge`);
    yield Promise.delay(1000);
    return github.post(`/issues/${pull.number}/comments`, {
      body: comments.pullRequestMerge({ pull })
    });
  }

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
});

const getReports = Promise.coroutine(function*(number) {
  const reports = {};

  const artifacts = yield circleci
    .get(`/${number}/artifacts`)
    .then(res => res.data);

  for (let report of ['mocha.json', 'eslint.json']) {
    const artifact = artifacts.find(a => path.basename(a.path) === report);

    if (!artifact) {
      throw new Error(
        `No ${report} artifact found. Ensure circle.yml stores this file.`
      );
    }

    const download = yield axios
      .get(`${artifact.url}?circle-token=${process.env.CIRCLECI_TOKEN}`)
      .then(res => res.data);

    const name = path.basename(artifact.path, path.extname(artifact.path));
    reports[name] = download;
  }

  return reports;
});

const getPullRequestDiff = Promise.coroutine(function*(number) {
  const diff = yield github
    .get(`/pulls/${number}`, {
      headers: {
        Accept: 'application/vnd.github.v3.diff'
      }
    })
    .then(res => res.data);
  return parseDiff(diff);
});

const getPullRequest = Promise.coroutine(function*(number) {
  return github.get(`/pulls/${number}`).then(res => res.data);
});

module.exports = Promise.coroutine(function*(event, context, callback) {
  try {
    yield verify(event);
    yield handle(event);
    return callback();
  } catch (e) {
    console.log('Uncaught error');
    console.log(e);
    return callback(e);
  }
});

module.exports.verify = verify;
module.exports.handle = handle;
