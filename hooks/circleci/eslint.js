/**
 * Parse JSON output from ESLint
 * source: http://eslint.org/docs/user-guide/formatters/#json
 */

const comments = require('./comments');

module.exports = class ESLintParser {
  constructor(json, diff, pull) {
    this.json = json;
    this.diff = diff;
    this.pull = pull;
  }

  hasErrors() {
    return this.json.some(file => file.messages.length > 0);
  }

  getReviewBody() {
    const violations = this.json.reduce(
      (num, file) => (num += file.messages.length),
      0
    );

    if (violations > 0) {
      return comments.eslint({
        pull: this.pull,
        data: { violations }
      });
    }
  }

  getReviewComments() {
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
