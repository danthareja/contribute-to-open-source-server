/**
 * Parse JSON output from Mocha
 * source: https://mochajs.org/#json
 */

const comments = require('./comments');

module.exports = class MochaReport {
  constructor(json = {}, diff, pull) {
    this.json = json;
    this.diff = diff;
    this.pull = pull;
  }

  hasErrors() {
    if (!this.json.stats) {
      return true;
    }
    return this.json.stats.failures;
  }

  getReviewBody() {
    if (!this.json.stats) {
      return comments.mochaInvalid({
        pull: this.pull,
        data: this.json
      });
    }

    if (this.json.stats && this.json.stats.pending > 0) {
      return comments.mochaPending({
        pull: this.pull,
        data: this.json
      });
    }

    if (this.json.stats && this.json.stats.failures > 0) {
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
