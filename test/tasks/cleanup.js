const sinon = require('sinon');
const { expect } = require('chai');

describe('tasks/cleanup', () => {
  it('should import without errors', () => {
    expect(() => {
      require('../../src/tasks/cleanup');
    }).to.not.throw();
  });
});
