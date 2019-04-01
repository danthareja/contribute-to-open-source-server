const Promise = require('bluebird');
const path = require('path');
const axios = require('axios');
const rax = require('retry-axios');

const circleci = axios.create({
  baseURL:
    'https://circleci.com/api/v1.1/project/github/danthareja/contribute-to-open-source',
  params: {
    'circle-token': process.env.CIRCLECI_TOKEN
  }
});

circleci.defaults.raxConfig = {
  instance: circleci
};
rax.attach(circleci);

circleci.getArtifacts = Promise.coroutine(function*(number, files) {
  const output = {};

  const artifacts = yield circleci
    .get(`/${number}/artifacts`)
    .then(res => res.data);

  for (let file of files) {
    const artifact = artifacts.find(a => path.basename(a.path) === file);

    if (!artifact) {
      throw new Error(
        `No ${file} artifact found. Ensure circle.yml stores this file.`
      );
    }

    const download = yield circleci.get(artifact.url).then(res => res.data);

    const name = path.basename(artifact.path, path.extname(artifact.path));
    output[name] = download;
  }

  return output;
});

module.exports = circleci;
