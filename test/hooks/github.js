const sinon = require('sinon');
const { expect } = require('chai');

describe('hooks/github', () => {
  it('should import without errors', () => {
    expect(() => {
      require('../../src/hooks/github');
    }).to.not.throw();
  });
});
