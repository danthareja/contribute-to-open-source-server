const path = require('path');
const axios = require('axios');
const rax = require('retry-axios');

const buildkite = axios.create({
  baseURL: process.env.IS_OFFLINE
    ? 'https://api.buildkite.com/v2/organizations/contribute-to-open-source/pipelines/contribute-to-open-source-dev'
    : 'https://api.buildkite.com/v2/organizations/contribute-to-open-source/pipelines/contribute-to-open-source',
  headers: {
    Authorization: `Bearer ${process.env.BUILDKITE_TOKEN}`
  },
  validateStatus(status) {
    return status < 400;
  }
});

buildkite.defaults.raxConfig = {
  instance: buildkite
};
rax.attach(buildkite);

buildkite.interceptors.response.use(
  function onBuildkiteSuccess(response) {
    return response;
  },
  function onBuildkiteError(error) {
    console.log(error);
    return Promise.reject(
      `BUILDKITE API ERROR: ${
        error.response.data.message
      } (${error.config.method.toUpperCase()} ${error.config.url})`
    );
  }
);

buildkite.getArtifacts = async function(build, files) {
  const output = {};

  const artifacts = await buildkite
    .get(`/builds/${build.number}/artifacts`)
    .then(res => res.data);

  for (let file of files) {
    const artifact = artifacts.find(a => a.filename === file);

    if (!artifact) {
      throw new Error(`Build #${build.number} failed to save artifact ${file}`);
    }

    const s3Url = await buildkite
      .get(artifact.download_url, { maxRedirects: 0 })
      .then(res => res.data.url);
    const download = await axios.get(s3Url).then(res => res.data);

    const name = path.basename(artifact.path, path.extname(artifact.path));
    output[name] = download;
  }

  return output;
};

buildkite.buildPullRequest = async function(pull) {
  const { commit } = await axios
    .get(`${pull.head.repo.url}/commits/${pull.head.sha}`)
    .then(res => res.data);
  return buildkite.post('/builds', {
    commit: pull.head.sha,
    branch: pull.head.label,
    message: commit.message,
    author: {
      name: commit.author.name,
      email: commit.author.email
    },
    pull_request_base_branch: pull.base.label,
    pull_request_id: pull.number,
    pull_request_repository: pull.base.repo.git_url
  });
};

module.exports = buildkite;
