/**
 * Parse JSON output from ESLint
 * source: http://eslint.org/docs/user-guide/formatters/#json
 */

const comments = require('../comments');

module.exports = class ESLintReport {
  constructor(json = [], diff, pull) {
    this._errorThreshold = 20;
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
    const errorCount = this._getErrorCount();

    if (errorCount > this._errorThreshold) {
      return comments.eslintErrorLarge({
        pull: this.pull,
        data: { errorCount }
      });
    }

    if (errorCount > 0) {
      return comments.eslintError({
        pull: this.pull,
        data: { errorCount }
      });
    }
  }

  getReviewComments() {
    if (this._getErrorCount() > this._errorThreshold) {
      return [];
    }

    const _comments = [];

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

        _comments.push({
          path: diff.to,
          position: change.position,
          body: comments.eslintInline({
            pull: this.pull,
            data: message
          })
        });
      });
    });

    return _comments;
  }
};
