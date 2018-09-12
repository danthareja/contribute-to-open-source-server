const sinon = require('sinon');
const { expect } = require('chai');

describe('comments/index', () => {
  it('should import without errors', () => {
    expect(() => {
      require('../../src/comments');
    }).to.not.throw();
  });
});
