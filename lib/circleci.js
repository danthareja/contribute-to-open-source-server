const axios = require('axios');

const circleci = axios.create({
  baseURL:
    'https://circleci.com/api/v1.1/project/github/danthareja/contribute-to-open-source',
  params: {
    'circle-token': process.env.CIRCLECI_TOKEN
  }
});

module.exports = circleci
