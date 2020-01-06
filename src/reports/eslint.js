/**
 * Parse JSON output from ESLint
 * source: http://eslint.org/docs/user-guide/formatters/#json
 */

const { eslintReviewBody, eslintReviewComment } = require('../comments');

module.exports = class ESLintReport {
  constructor(json = [], diff, pull) {
    this._maxReviewComments = 20;
    this.json = json;
    this.diff = diff;
    this.pull = pull;
  }

  _getErrorCount() {
    return this.json.reduce((num, file) => num + file.messages.length, 0);
  }

  hasErrors() {
    return this.json.some(file => file.messages.length > 0);
  }

  getReviewBody() {
    return eslintReviewBody({
      hasErrors: this.hasErrors(),
      pull: this.pull,
      data: {
        errorCount: this._getErrorCount()
      }
    });
  }

  getReviewComments() {
    if (!this.hasErrors()) {
      return [];
    }

    const comments = [];

    this.json.forEach(file => {
      if (file.messages.length === 0) {
        return;
      }

      const diff = this.diff.find(d => file.filePath.includes(d.to));

      if (!diff) {
        return;
      }

      const changes = diff.chunks.reduce(
        (changes, chunk) => changes.concat(chunk.changes),
        []
      );

      file.messages.forEach(message => {
        const change = changes.find(change => change.newLine === message.line);

        if (!change) {
          return;
        }

        comments.push({
          path: diff.to,
          position: change.position,
          body: eslintReviewComment({
            pull: this.pull,
            data: message
          })
        });
      });
    });

    return comments.slice(0, this._maxReviewComments);
  }
};
