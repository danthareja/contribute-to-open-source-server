const github = require('../../../lib/github');
const buildkite = require('../../../lib/buildkite');
const comments = require('../../../comments');
const ESLintReport = require('../../../reports/eslint');
const MochaReport = require('../../../reports/mocha');

module.exports = async function buildFinished({ build }) {
  console.log(`Processing build #${build.number}`);

  if (build.state === 'canceled') {
    console.log(`Skipping build #${build.number} because it was canceled`);
    return;
  }

  if (!build.pull_request) {
    console.log(
      `Skipping build #${
        build.number
      } because it is not a pull request (branch "${build.branch}")`
    );
    return;
  }

  const pull = await github.getPullRequest(build.pull_request.id);
  if (pull.base.ref !== pull.user.login) {
    console.log(
      `Skipping build #${
        build.number
      } because it is for a pull request opened against wrong branch (${
        pull.base.ref
      } instead of ${pull.user.login})`
    );
    return;
  }

  const [artifacts, diff] = await Promise.all([
    buildkite.getArtifacts(build, ['mocha.json', 'eslint.json']),
    github.getPullRequestDiff(build.pull_request.id)
  ]);

  const reports = [
    new ESLintReport(artifacts.eslint, diff, pull),
    new MochaReport(artifacts.mocha, diff, pull)
  ];

  const hasErrors = reports.some(report => report.hasErrors());

  await github.post(`/pulls/${pull.number}/reviews`, {
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

  return {
    success: true
  };
};
