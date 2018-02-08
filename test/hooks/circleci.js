const sinon = require('sinon');
const { expect } = require('chai');

describe('hooks/circle', () => {
  it('should import without errors', () => {
    expect(() => {
      require('../../hooks/circleci');
    }).to.not.throw();
  });
});
