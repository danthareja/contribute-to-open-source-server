const sinon = require('sinon');
const { expect } = require('chai');

describe('hooks/buildkite', () => {
  it('should import without errors', () => {
    expect(() => {
      require('../../src/hooks/buildkite');
    }).to.not.throw();
  });
});
