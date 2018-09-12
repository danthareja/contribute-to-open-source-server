const sinon = require('sinon');
const { expect } = require('chai');

describe('lib/circleci', () => {
  it('should import without errors', () => {
    expect(() => {
      require('../../src/lib/circleci');
    }).to.not.throw();
  });
});
