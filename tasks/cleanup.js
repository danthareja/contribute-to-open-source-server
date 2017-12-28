const Promise = require('bluebird');
const axios = require('axios');
const moment = require('moment');
const comments = require('./comments');
const LinkHeader = require('http-link-header');

const github = axios.create({
  baseURL: 'https://api.github.com/repos/danthareja/contribute-to-open-source',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `token ${process.env.GITHUB_TOKEN || '6e643c3d491d31331343e2dfa6ba441143cff18b'}`,
    'User-Agent': 'danthareja/contribute-to-open-source-server'
  }
});

github.getAll = Promise.coroutine(function* getAll(url, options) {
  const response = yield this.get(url, options)

  if (response.headers.link) {
    const link = LinkHeader.parse(response.headers.link);
    if (link.rel('next').length > 0) {
      return response.data.concat(
        yield github.getAll(link.get('rel', 'next')[0].uri)
      )
    }
  }

  return response.data;
});


Promise.coroutine(function* handle(event) {
  const staged = []
  const oneWeekAgo = moment().subtract(7, 'days').startOf('day')

  // Get all branches

  console.log('getting branches...')
  const branches = yield Promise.map(
    yield github.getAll('/branches'),
    branch => github.getAll(`/branches/${branch.name}`)
  )
  .tap(branches => console.log(`found ${branches.length} branches`))
  .filter(branch => {
    const lastCommitDate = moment(branch.commit.commit.author.date)
    return lastCommitDate.isBefore(oneWeekAgo) && branch.name !== 'master'
  })
  .tap(branches => console.log(`found ${branches.length} branches with no activity in the last week`))

  // Get all forks

  console.log('getting forks...')
  const forks = yield github.getAll('/forks')
  .tap(forks => console.log(`found ${forks.length} forks`))


  // Get all pull requests

  console.log('getting pull requests...')
  const pulls = yield github.getAll('/pulls', {
    params: {
      state: 'closed'
    }
  })
  .tap(pulls => console.log(`found ${pulls.length} closed pull requests`))
  .filter(pull => {
    if (!pull.merged_at) {
      return false
    } else {
      const lastMergeDate = moment(pull.merged_at)
      return lastMergeDate.isBefore(oneWeekAgo)
    }
  })
  .tap(pulls => console.log(`found ${pulls.length} pull requests merged over a week ago`))


  // Cleanup strategy #1 -
  // Branches with no attached forks

  branches
    .filter(branch => !forks.find(fork => fork.owner.login === branch.name))
    .forEach(branch => staged.push({
      name: branch.name,
      reason: 'UNATTACHED'
    }))


  // Cleanup strategy #2 -
  // Branches with merged pull requests

  branches
    .map(branch => pulls.find(pull => {
      return pull.base.ref === branch.name
    }))
    .filter(pull => pull)
    .forEach(pull => staged.push({
      name: pull.base.ref,
      reason: 'MERGED',
      pull: pull
    }))


  console.log(`found ${staged.length} branches to delete`)

  for (let branch of staged) {
    if (branch.reason === 'MERGED') {
      console.log(`deleting ${branch.name} because pull #${branch.pull.number} has been merged`)
      try {
        yield github.post(`/issues/${branch.pull.number}/comments`, {
          body: comments.branchDeleted({ pull: branch.pull })
        });
      } catch (e) {
        console.log(`error commenting on #${branch.pull}. skipping deletion`)
        console.log(e.response.data)
        continue
      }
    } else if (branch.reason === 'UNATTACHED') {
      console.log(`deleting ${branch.name} because there is no attached fork`)
    }

    try {
      yield github.delete(`/git/refs/heads/${branch.name}`)
    } catch (e) {
      if (e.response.data.message !== 'Reference does not exist') {
        console.log(`error deleting ${branch.name}`)
        console.log(e.response.data)
      }
    }
  }

})();


module.exports = Promise.coroutine(function* main(event, context, callback) {
  try {
    yield handle(event);
    return callback();
  } catch (e) {
    console.log('Uncaught error');
    console.log(e);
    return callback(e);
  }
});
