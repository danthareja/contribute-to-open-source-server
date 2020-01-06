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

module.exports = buildkite;
