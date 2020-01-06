const sinon = require('sinon');
const { expect } = require('chai');

describe('lib/buildkite', () => {
  it('should import without errors', () => {
    expect(() => {
      require('../../src/lib/buildkite');
    }).to.not.throw();
  });
});
