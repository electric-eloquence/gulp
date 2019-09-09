'use strict';

var gulp = require('../');
var should = require('should');
require('mocha');

describe('gulp tasks', function() {
  describe('task()', function() {
    it('defines a task', function(done) {
      var fn = function() {};
      gulp.task('test', fn);
      should.exist(gulp.tasks.test);
      gulp.tasks.test.fn.should.equal(fn);
      gulp.reset();
      done();
    });
  });
  describe('run()', function() {
    it('runs multiple tasks', function(done) {
      var a = 0;
      var fn = function() {
        this.should.equal(gulp);
        ++a;
      };
      var fn2 = function() {
        this.should.equal(gulp);
        ++a;
      };
      gulp.task('test', fn);
      gulp.task('test2', fn2);
      gulp.run('test', 'test2');
      a.should.equal(2);
      gulp.reset();
      done();
    });
    it('runs all tasks when it calls run() multiple times', function(done) {
      var a = 0;
      var fn = function() {
        this.should.equal(gulp);
        ++a;
      };
      var fn2 = function() {
        this.should.equal(gulp);
        ++a;
      };
      gulp.task('test', fn);
      gulp.task('test2', fn2);
      gulp.run('test');
      gulp.run('test2');
      a.should.equal(2);
      gulp.reset();
      done();
    });
    it('runs all async promise tasks', function(done) {
      var a = 0;
      var fn = function() {
        return new Promise(function(resolve) {
          setTimeout(function() {
            ++a;
            resolve();
          }, 1);
        });
      };
      var fn2 = function() {
        return new Promise(function(resolve) {
          setTimeout(function() {
            ++a;
            resolve();
          }, 1);
        });
      };
      gulp.task('test', fn);
      gulp.task('test2', fn2);
      gulp.run('test');
      gulp.run('test2', function() {
        gulp.isRunning.should.equal(false);
        a.should.equal(2);
        gulp.reset();
        done();
      });
      gulp.isRunning.should.equal(true);
    });
    it('runs all async callback tasks', function(done) {
      var a = 0;
      var fn = function(cb) {
        setTimeout(function() {
          ++a;
          cb(null);
        }, 1);
      };
      var fn2 = function(cb) {
        setTimeout(function() {
          ++a;
          cb(null);
        }, 1);
      };
      gulp.task('test', fn);
      gulp.task('test2', fn2);
      gulp.run('test');
      gulp.run('test2', function() {
        gulp.isRunning.should.equal(false);
        a.should.equal(2);
        gulp.reset();
        done();
      });
      gulp.isRunning.should.equal(true);
    });
    it('emits task_not_found and throw an error when task is not defined', function(done) {
      gulp.on('task_not_found', function(err) {
        should.exist(err);
        should.exist(err.task);
        err.task.should.equal('test');
        gulp.reset();
        done();
      });
      try {
        gulp.run('test');
      } catch (err) {
        should.exist(err);
      }
    });
    it('runs task scoped to gulp', function(done) {
      var a = 0;
      var fn = function() {
        this.should.equal(gulp);
        ++a;
      };
      gulp.task('test', fn);
      gulp.run('test');
      a.should.equal(1);
      gulp.isRunning.should.equal(false);
      gulp.reset();
      done();
    });
    it('runs default task scoped to gulp', function(done) {
      var a = 0;
      var fn = function() {
        this.should.equal(gulp);
        ++a;
      };
      gulp.task('default', fn);
      gulp.run();
      a.should.equal(1);
      gulp.isRunning.should.equal(false);
      gulp.reset();
      done();
    });
  });
});
