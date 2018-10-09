/**
 * Parse JSON output from Mocha
 * source: https://mochajs.org/#json
 */

const StacktraceParser = require('stacktrace-parser');
const { mochaReviewBody, mochaReviewComment } = require('../../../comments');

module.exports = class MochaReport {
  constructor(json = {}, diff, pull) {
    this.json = json;
    this.diff = diff;
    this.pull = pull;
  }

  hasErrors() {
    return (
      this.json.stats &&
      (this.json.stats.failures > 0 || this.json.stats.pending > 0)
    );
  }

  getReviewBody() {
    return mochaReviewBody({
      hasErrors: this.hasErrors(),
      pull: this.pull,
      data: this.json
    });
  }

  getReviewComments() {
    if (!this.hasErrors()) {
      return [];
    }

    const comments = [];

    const lines = this.json.failures.reduce((memo, failure) => {
      if (
        !failure.err ||
        !failure.err.stack ||
        typeof failure.err.stack !== 'string'
      ) {
        return memo;
      }

      const line = StacktraceParser.parse(failure.err.stack)[0];

      if (!line) {
        return memo;
      }

      const key = `${line.file}:${line.lineNumber}`;
      if (!memo[key]) {
        memo[key] = [failure];
      } else {
        memo[key].push(failure);
      }

      return memo;
    }, {});

    Object.keys(lines).forEach(key => {
      const [file, lineNumber] = key.split(':');
      const diff = this.diff.find(d => file.includes(d.to));

      if (!diff) {
        return;
      }

      const changes = diff.chunks.reduce(
        (changes, chunk) => changes.concat(chunk.changes),
        []
      );

      const change = changes.find(
        change => change.newLine == Number.parseInt(lineNumber)
      );

      if (!change) {
        return;
      }

      comments.push({
        path: diff.to,
        position: change.position,
        body: mochaReviewComment({
          pull: this.pull,
          data: lines[key]
        })
      });
    });

    return comments;
  }
};
