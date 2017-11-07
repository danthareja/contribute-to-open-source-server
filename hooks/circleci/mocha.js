/**
 * Parse JSON output from Mocha
 * source: https://mochajs.org/#json
 */

const comments = require('./comments');

module.exports = class MochaParser {
  constructor(json, diff, pull) {
    this.json = json;
    this.diff = diff;
    this.pull = pull;
  }

  hasErrors() {
    return this.json.stats.failures + this.json.stats.pending > 0;
  }

  getReviewBody() {
    if (this.json.stats.pending > 0) {
      return comments.mochaPending({
        pull: this.pull,
        data: this.json
      });
    }

    if (this.json.stats.failures > 0) {
      return comments.mochaError({
        pull: this.pull,
        data: this.json
      });
    }
  }

  getReviewComments() {
    return [];
  }
};
