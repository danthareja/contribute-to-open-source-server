const sinon = require('sinon');
const { expect } = require('chai');

describe('tasks/cleanup', () => {

  it('should import without errors', () => {
    expect(() => {
      require('../../tasks/cleanup');
    }).to.not.throw();
  });

});
