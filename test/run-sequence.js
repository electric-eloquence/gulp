'use strict';

var gulp = require('../');
var should = require('should');
var join = require('path').join;
var rimraf = require('rimraf');
var fs = require('fs');

require('mocha');

var outpath = join(__dirname, './out-fixtures');
var timeout = 10;

describe('runSequence()', function() {
  before(rimraf.sync.bind(null, outpath, {}));

  describe('sequential tasks', function() {
    it('runs async callback tasks', function(done) {
      var a = '';
      var b = '0';
      var c = '1';
      var stop1;
      var start2;
      var fn = function(cb) {
        setTimeout(function() {
          stop1 = Date.now();
          a = a + b;
          cb();
        }, timeout);
      };
      var fn2 = function(cb) {
        start2 = Date.now();
        setTimeout(function() {
          a = a + c;
          cb();
        }, timeout);
      };
      gulp.task('test', fn);
      gulp.task('test2', fn2);
      gulp.task('default', function(cb) {
        gulp.runSeq(
          'test',
          'test2',
          function() {
            a.should.equal('01');
            start2.should.be.aboveOrEqual(stop1);
            cb();
            gulp.reset();
            done();
          }
        );
      });
      gulp.run('default');
    });

    it('runs async stream tasks', function(done) {
      var fn = function() {
        return gulp.src(join(__dirname, './fixtures/copy/example.txt'))
          .pipe(gulp.dest(outpath));
      };
      var fn2 = function() {
        return gulp.src(join(outpath, './example.txt'))
          .pipe(gulp.dest(join(outpath, './run-sequence-series')));
      };
      gulp.task('test', fn);
      gulp.task('test2', fn2);
      gulp.task('default', function(cb) {
        gulp.runSeq(
          'test',
          'test2',
          function() {
            fs.readFile(join(outpath, './run-sequence-series/example.txt'), function(err, contents) {
              should.not.exist(err);
              should.exist(contents);
              String(contents).should.equal('this is a test');
              cb();
              gulp.reset();
              done();
            });
          }
        );
      });
      should(fs.existsSync(join(outpath, './example.txt'))).be.false;
      should(fs.existsSync(join(outpath, './run-sequence-series/example.txt'))).be.false;
      gulp.run('default');
    });

    it('runs async promise tasks', function(done) {
      var a = '';
      var b = '0';
      var c = '1';
      var stop1;
      var start2;
      var fn = function() {
        return new Promise(function(resolve) {
          setTimeout(function() {
            a = a + b;
            stop1 = Date.now();
            resolve();
          }, timeout);
        });
      };
      var fn2 = function() {
        return new Promise(function(resolve) {
          start2 = Date.now();
          setTimeout(function() {
            a = a + c;
            resolve();
          }, timeout);
        });
      };
      gulp.task('test', fn);
      gulp.task('test2', fn2);
      gulp.task('default', function(cb) {
        gulp.runSeq(
          'test',
          'test2',
          function() {
            a.should.equal('01');
            start2.should.be.aboveOrEqual(stop1);
            cb();
            gulp.reset();
            done();
          }
        );
      });
      gulp.run('default');
    });
  });

  describe('concurrent tasks', function() {
    it('runs async callback tasks', function(done) {
      var stop1;
      var start2;
      var fn = function(cb) {
        setTimeout(function() {
          stop1 = Date.now();
          cb();
        }, timeout);
      };
      var fn2 = function(cb) {
        start2 = Date.now();
        setTimeout(function() {
          cb();
        }, timeout);
      };
      gulp.task('test', fn);
      gulp.task('test2', fn2);
      gulp.task('default', function(cb) {
        gulp.runSeq(
          ['test', 'test2'],
          function() {
            start2.should.be.below(stop1);
            cb();
            gulp.reset();
            done();
          }
        );
      });
      gulp.run('default');
    });

    it('runs async stream tasks', function(done) {
      var stop1;
      var start2;

      var fn = function() {
        return gulp.src(join(__dirname, './fixtures/copy/example.txt'))
          .pipe(gulp.dest(join(outpath, './run-sequence-parallel')));
      };
      var fn2 = function() {
        return gulp.src(join(__dirname, './fixtures/test.coffee'))
          .pipe(gulp.dest(join(outpath, './run-sequence-parallel')));
      };
      gulp.task('test', fn);
      gulp.task('test2', fn2);
      gulp.task('parallel', function(cb) {
        setTimeout(function() {
          gulp.runSeq(
            'test',
            function() {
              stop1 = Date.now();
              cb();
            }
          );
        }, timeout);
      });
      gulp.task('parallel2', function(cb) {
        start2 = Date.now();
        setTimeout(function() {
          gulp.runSeq(
            'test2',
            cb
          );
        }, timeout);
      });
      gulp.task('default', function(cb) {
        gulp.runSeq(
          ['parallel', 'parallel2'],
          function() {
            start2.should.be.below(stop1);
            cb();
            gulp.reset();
            done();
          }
        );
      });
      gulp.run('default');
    });

    it('runs async promise tasks', function(done) {
      var stop1;
      var start2;
      var fn = function() {
        return new Promise(function(resolve) {
          setTimeout(function() {
            stop1 = Date.now();
            resolve();
          }, timeout);
        });
      };
      var fn2 = function() {
        return new Promise(function(resolve) {
          start2 = Date.now();
          setTimeout(function() {
            resolve();
          }, timeout);
        });
      };
      gulp.task('test', fn);
      gulp.task('test2', fn2);
      gulp.task('default', function(cb) {
        gulp.runSeq(
          ['test', 'test2'],
          function() {
            start2.should.be.below(stop1);
            cb();
            gulp.reset();
            done();
          }
        );
      });
      gulp.run('default');
    });
  });

  describe('error handling', function() {
    var callback = function(cb) {
      cb();
    };

    it('throws an error if no tasks are provided', function(done) {
      gulp.task('default', function(cb) {
        try {
          gulp.runSeq();
        } catch (err) {
          err.message.should.equal('No tasks were provided to gulp.runSeq.');
          cb();
          gulp.reset();
          done();
        }
      });
      gulp.run('default');
    });

    it('throws an error if a task is not defined', function(done) {
      gulp.task('default', function(cb) {
        try {
          gulp.runSeq('test');
        } catch (err) {
          err.message.should.equal('Task test is not configured as a task on gulp. If your code requires multiple gulp instances, try consolidating them into one instance.');
          cb();
          gulp.reset();
          done();
        }
      });
      gulp.run('default');
    });

    it('throws an error if a task argument is neither string nor array', function(done) {
      gulp.task('default', function(cb) {
        try {
          gulp.runSeq(0);
        } catch (err) {
          err.message.should.equal('Task 0 is not a valid task string.');
          cb();
          gulp.reset();
          done();
        }
      });
      gulp.run('default');
    });

    it('throws an error if a task is listed more than once in a concurrency array', function(done) {
      gulp.task('test', callback);
      gulp.task('default', function(cb) {
        try {
          gulp.runSeq(
            ['test', 'test']
          );
        } catch (err) {
          err.message.should.equal('Task test is listed more than once. This is probably a typo.');
          cb();
          gulp.reset();
          done();
        }
      });
      gulp.run('default');
    });

    it('throws an error if a concurrency array is empty', function(done) {
      gulp.task('default', function(cb) {
        try {
          gulp.runSeq(
            []
          );
        } catch (err) {
          err.message.should.equal('An empty array was provided as a task set.');
          cb();
          gulp.reset();
          done();
        }
      });
      gulp.run('default');
    });

    it('ignores undefined tasks if configured to do so', function(done) {
      gulp.runSeq.options.ignoreUndefinedTasks = true;
      gulp.task('test', callback);
      gulp.task('test2', callback);
      gulp.task('test4', callback);
      gulp.task('default', function(cb) {
        gulp.runSeq(
          'test',
          ['test2', 'test4'],
          null,
          function(err) {
            should(err).be.undefined;
            cb();
            gulp.runSeq.options.ignoreUndefinedTasks = false;
            gulp.reset();
            done();
          }
        );
      });
      gulp.run('default');
    });

    it('bubbles errors thrown by gulp to the callback', function(done) {
      var fn = function() {
        throw new Error('test throw');
      };
      gulp.runSeq.options.showErrorStackTrace = true;
      gulp.task('test', fn);
      gulp.task('default', function(cb) {
        gulp.runSeq(
          'test',
          function(err) {
            err.message.should.equal('test throw');
            cb();
            gulp.reset();
            done();
          }
        );
      });
      gulp.run('default');
    });

    it('suppresses the stack trace of gulp errors if configured to do so', function(done) {
      var fn = function() {
        throw new Error('test throw');
      };
      gulp.runSeq.options.showErrorStackTrace = false;
      gulp.task('test', fn);
      gulp.task('default', function(cb) {
        gulp.runSeq(
          'test',
          function(err) {
            err.message.should.equal('test throw');
            cb();
            gulp.runSeq.options.showErrorStackTrace = true;
            gulp.reset();
            done();
          }
        );
      });
      gulp.run('default');
    });

    it('throws gulp errors when there is no callback', function(done) {
      var fn = function() {
        throw new Error('test throw');
      };
      gulp.task('test', fn);
      gulp.task('default', function() {
        try {
          gulp.runSeq(
            'test'
          );
        } catch (err) {
          err.message.should.equal('test throw');
          gulp.reset();
          done();
        }
      });
      gulp.run('default');
    });

    it('bubbles an "aborted orchestration" error to the callback when gulp abruptly stops', function(done) {
      var fn = function(cb) {
        gulp.stop();
        cb();
      };
      gulp.task('test', fn);
      gulp.task('default', function(cb) {
        gulp.runSeq(
          'test',
          function(err) {
            err.message.should.equal('orchestration aborted');
            cb();
            gulp.reset();
            done();
          }
        );
      });
      gulp.run('default');
    });
  });
});
