const sinon = require('sinon');
const { expect } = require('chai');

describe('hooks/circle', () => {
  it('should import without errors', () => {
    expect(() => {
      require('../../src/hooks/circleci');
    }).to.not.throw();
  });
});
