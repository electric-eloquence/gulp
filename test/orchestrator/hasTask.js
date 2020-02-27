'use strict';

var Orchestrator = require('../../lib/orchestrator');
require('should');
require('mocha');

describe('orchestrator', function() {
  describe('hasTask()', function() {

    it('should return true if there is a task', function(done) {
      var orchestrator;
      var name;
      var task1;
      var expected;
      var actual;

      // Arrange
      name = 'task1';
      task1 = {
        name: name,
        fn: function() {}
      };

      // the thing under test
      orchestrator = new Orchestrator();
      orchestrator.tasks[name] = task1;

      // Act
      expected = true;
      actual = orchestrator.hasTask(name);

      // Assert
      actual.should.equal(expected);
      done();
    });

    it('should return false if there is no such task', function(done) {
      var orchestrator;
      var name;
      var task1;
      var expected;
      var actual;

      // Arrange
      name = 'task1';
      task1 = {
        name: name,
        fn: function() {}
      };

      // the thing under test
      orchestrator = new Orchestrator();
      orchestrator.tasks[name] = task1;

      // Act
      expected = false;
      actual = orchestrator.hasTask('not' + name);

      // Assert
      actual.should.equal(expected);
      done();
    });

  });
});
