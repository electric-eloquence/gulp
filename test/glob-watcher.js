'use strict';

var chokidar = require('@electric-eloquence/chokidar');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var globWatcher = require('../lib/glob-watcher');
var path = require('path');

var should = require('should');
require('mocha');

// Default delay on debounce
var timeout = 200;

describe('globWatcher()', function() {
  this.timeout(6000);

  var outDir = path.join(__dirname, './fixtures/');
  var outFile1 = path.join(outDir, 'changed.js');
  var outFile2 = path.join(outDir, 'added.js');
  var globPattern = '**/*.js';
  var outGlob = path.join(outDir, globPattern);
  var singleAdd = path.join(outDir, 'changed.js');
  var ignoreGlob = '!' + singleAdd;

  function changeFile() {
    fs.writeFileSync(outFile1, 'hello changed');
  }

  function addFile() {
    fs.writeFileSync(outFile2, 'hello added');
  }

  beforeEach(function() {
    if (fs.existsSync(outFile1)) {
      fs.unlinkSync(outFile1);
    }
    if (fs.existsSync(outFile2)) {
      fs.unlinkSync(outFile2);
    }
    fs.writeFileSync(outFile1, 'hello world');
  });

  it('returns a file system watcher', function() {
    var watcher = globWatcher(outGlob);

    should.exist(watcher);
    should(watcher).be.instanceof(chokidar.FSWatcher);
    watcher.should.be.an.instanceof(EventEmitter);

    watcher.close();
  });

  it('only requires a glob and returns watcher', function(done) {
    var watcher = globWatcher(outGlob);

    watcher.once('change', function(evt) {
      should(evt.type).equal('change');
      should(evt.path).equal(outFile1);

      watcher.close();
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);
  });

  it('picks up added files', function(done) {
    var watcher = globWatcher(outGlob);

    watcher.once('add', function(evt) {
      should(evt.type).equal('add');
      should(evt.path).equal(outFile2);

      watcher.close();
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', addFile);
  });

  it('works with OS-specific cwd', function(done) {
    var watcher = globWatcher('./fixtures/' + globPattern, { cwd: __dirname });

    watcher.once('change', function(evt) {
      // Uses path.join here because the resulting path is OS-specific
      should(evt.type).equal('change');
      should(evt.path).equal(path.join(__dirname, 'fixtures', 'changed.js'));

      watcher.close();
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);
  });

  it('waits for completion is signaled before running again', function(done) {
    var runs = 0;

    var watcher = globWatcher(outGlob, function() {
      return new Promise(function(resolve) {
        runs++;
        if (runs === 1) {
          setTimeout(function() {
            // Expect 1 even through this timeout completes after the run 2 timeout
            // Run 2 must await the completion of run 1
            should(runs).equal(1);
            resolve();
          }, timeout * 6);
        }
        if (runs === 2) {
          watcher.close();
          done();
          resolve();
        }
      });
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', function() {
      changeFile();
      // Fire after delay
      setTimeout(changeFile, timeout * 5);
    });
  });

  it('allows the user to disable queueing', function(done) {
    var runs = 0;

    // Promises always seem to queue so no Promise
    var watcher = globWatcher(outGlob, { queue: false }, function() {
      runs++;
      if (runs === 1) {
        setTimeout(function() {
          // Expect 2 because run 2 completes before 6his timeout completes and the queue is disabled
          should(runs).equal(2);
          watcher.close();
          done();
        }, timeout * 6);
      }
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', function() {
      changeFile();
      setTimeout(changeFile, timeout * 5);
    });
  });

  it('allows the user to adjust delay', function(done) {
    var runs = 0;

    var watcher = globWatcher(outGlob, { delay: (timeout / 2) }, function() {
      return new Promise(function(resolve) {
        runs++;
        if (runs === 1) {
          setTimeout(function() {
            should(runs).equal(1);
            resolve();
          }, timeout * 6);
        }
        if (runs === 2) {
          should(runs).equal(2);
          watcher.close();
          done();
          resolve();
        }
      });
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', function() {
      changeFile();
      setTimeout(changeFile, timeout * 5);
    });
  });

  it('emits an error if one is rejected in the callback Promise and handler is attached', function(done) {
    var expectedError = new Error('boom');

    var watcher = globWatcher(outGlob, function() {
      return new Promise(function(resolve, reject) {
        reject(expectedError);
      });
    });

    watcher.on('error', function(err) {
      should(err).equal(expectedError);
      watcher.close();
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);
  });

  it('emits an error if one is thrown in the callback Promise and handler is attached', function(done) {
    var expectedError = new Error('boom');

    var watcher = globWatcher(outGlob, function() {
      return new Promise(function() {
        throw expectedError;
      });
    });

    watcher.on('error', function(err) {
      should(err).equal(expectedError);
      watcher.close();
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);
  });

  it('passes options to chokidar', function(done) {
    // Callback is called while chokidar is discovering file paths
    // if ignoreInitial is explicitly set to false and passed to chokidar
    var watcher = globWatcher(outGlob, { ignoreInitial: false }, function() {
      watcher.close();
      done();
    });
  });

  it('does not override default values with null values', function(done) {
    var watcher = globWatcher(outGlob, { ignoreInitial: null }, function() {
      watcher.close();
      done();
    });

    // We default `ignoreInitial` to true and it isn't overwritten by null
    // So wait for `on('ready')`
    watcher.on('ready', changeFile);
  });

  it('watches exactly the given event', function(done) {
    // Accepts a string as the events property and wraps it in an array
    var watcher = globWatcher(outGlob, { events: 'add' }, function() {
      watcher.close();
      done();
    });

    watcher.on('ready', addFile);
  });

  it('accepts multiple events to watch', function(done) {
    var watcher = globWatcher(outGlob, { events: ['add', 'unlink'] }, function(evt) {
      if (evt.type === 'unlink') {
        watcher.close();
        done();
      }
    });

    watcher.on('ready', function() {
      addFile();
      setTimeout(function() {
        fs.unlinkSync(outFile2);
      }, timeout);
    });
  });

  it('can ignore a glob after it has been added', function(done) {
    var watcher = globWatcher([outGlob, ignoreGlob]);

    watcher.once('change', function(evt) {
      // It should never reach here
      should(evt.path).to.not.exist();

      watcher.close();
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);

    setTimeout(function() {
      watcher.close();
      done();
    }, 1500);
  });

  it('can re-add a glob after it has been negated', function(done) {
    var watcher = globWatcher([outGlob, ignoreGlob, singleAdd]);

    watcher.once('change', function(evt) {
      should(evt.path).equal(singleAdd);

      watcher.close();
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);
  });

  it('does not mutate the globs array', function(done) {
    var globs = [outGlob, ignoreGlob, singleAdd];
    var watcher = globWatcher(globs);

    should(globs[0]).equal(outGlob);
    should(globs[1]).equal(ignoreGlob);
    should(globs[2]).equal(singleAdd);

    watcher.close();
    done();
  });

  it('passes ignores through to chokidar', function(done) {
    var ignored = [singleAdd];
    var watcher = globWatcher(outGlob, {
      ignored: ignored
    });

    watcher.once('change', function(evt) {
      // It should never reach here
      should(evt.path).toNotExist();

      watcher.close();
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);

    // Just test the non-mutation in this test
    should(ignored.length).equal(1);

    setTimeout(function() {
      watcher.close();
      done();
    }, 1500);
  });
});
