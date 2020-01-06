const sinon = require('sinon');
const { expect } = require('chai');

describe('tasks/health', () => {
  it('should import without errors', () => {
    expect(() => {
      require('../../src/tasks/health');
    }).to.not.throw();
  });
});
