'use strict';

var chokidar = require('chokidar');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var globWatcher = require('../lib/globWatcher');
var path = require('path');

var should = require('should');
require('mocha');

// Default delay on debounce
var timeout = 200;

describe('globWatcher()', function() {
  // This terrible scoping of watcher is necessary for this test to run correctly in Windows.
  // It may result in flaky results on macOS, but since it is consistent on Linux, continuous integration test should
  // pass reliably.
  var watcher;

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

  afterEach(function() {
    if (process.platform !== 'darwin') {
      watcher.close();
    }
  });

  it('should return a file system watcher', function() {
    watcher = globWatcher(outGlob);

    should.exist(watcher);
    should(watcher).be.instanceof(chokidar.FSWatcher);
    watcher.should.be.an.instanceof(EventEmitter);
  });

  it('only requires a glob and returns watcher', function(done) {
    watcher = globWatcher(outGlob);

    watcher.once('change', function(evt) {
      should(evt.type).equal('change');
      should(evt.path).equal(outFile1);
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);
  });

  it('picks up added files', function(done) {
    watcher = globWatcher(outGlob);

    watcher.once('add', function(evt) {
      should(evt.type).equal('add');
      should(evt.path).equal(outFile2);
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', addFile);
  });

  it('works with OS-specific cwd', function(done) {
    watcher = globWatcher('./fixtures/' + globPattern, { cwd: __dirname });

    watcher.once('change', function(evt) {
      // Uses path.join here because the resulting path is OS-specific
      should(evt.type).equal('change');
      should(evt.path).equal(path.join(__dirname, 'fixtures', 'changed.js'));
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);
  });

  it('waits for completion is signaled before running again', function(done) {
    var runs = 0;

    watcher = globWatcher(outGlob, function() {
      return new Promise(function(resolve) {
        runs++;
        if (runs === 1) {
          setTimeout(function() {
            // Expect 1 even through this timeout completes after the run 2 timeout
            // Run 2 must await the completion of run 1
            should(runs).equal(1);
            resolve();
          }, timeout * 3);
        }
        if (runs === 2) {
          done();
          resolve();
        }
      });
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', function() {
      changeFile();
      // Fire after double the delay
      setTimeout(changeFile, timeout * 2);
    });
  });

  it('allows the user to disable queueing', function(done) {
    var runs = 0;

    // Promises always seem to queue so no Promise
    watcher = globWatcher(outGlob, { queue: false }, function() {
      runs++;
      if (runs === 1) {
        setTimeout(function() {
          // Expect 2 because run 2 completes before this timeout completes and the queue is disabled
          should(runs).equal(2);
        }, timeout * 3);
      }
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', function() {
      changeFile();
      setTimeout(changeFile, timeout * 2);
    });

    // Horrifically bad async usage
    // Necessary because done() doesn't exit the watcher callback after waiting for run 1 to timeout
    setTimeout(done, timeout * 3.1);
  });

  it('allows the user to adjust delay', function(done) {
    var runs = 0;

    watcher = globWatcher(outGlob, { delay: (timeout / 2) }, function() {
      return new Promise(function(resolve) {
        runs++;
        if (runs === 1) {
          setTimeout(function() {
            should(runs).equal(1);
            resolve();
          }, timeout * 3);
        }
        if (runs === 2) {
          should(runs).equal(2);
          done();
          resolve();
        }
      });
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', function() {
      changeFile();
      // This will queue because delay is halved
      setTimeout(changeFile, timeout);
    });
  });

  it('emits an error if one is rejected in the callback Promise and handler is attached', function(done) {
    var expectedError = new Error('boom');

    watcher = globWatcher(outGlob, function() {
      return new Promise(function(resolve, reject) {
        reject(expectedError);
      });
    });

    watcher.on('error', function(err) {
      should(err).equal(expectedError);
      watcher.close(); // Stops multiple done calls but will segfault if done too many times especially in macOS
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);
  });

  it('emits an error if one is thrown in the callback Promise and handler is attached', function(done) {
    var expectedError = new Error('boom');

    watcher = globWatcher(outGlob, function() {
      return new Promise(function() {
        throw expectedError;
      });
    });

    watcher.on('error', function(err) {
      should(err).equal(expectedError);
      watcher.close(); // Stops multiple done calls but will segfault if done too many times especially in macOS
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);
  });

  it('passes options to chokidar', function(done) {
    // Callback is called while chokidar is discovering file paths
    // if ignoreInitial is explicitly set to false and passed to chokidar
    watcher = globWatcher(outGlob, { ignoreInitial: false }, function() {
      watcher.close(); // Stops multiple done calls but will segfault if done too many times especially in macOS
      done();
    });
  });

  it('does not override default values with null values', function(done) {
    watcher = globWatcher(outGlob, { ignoreInitial: null }, function() {
      watcher.close(); // Stops multiple done calls but will segfault if done too many times especially in macOS
      done();
    });

    // We default `ignoreInitial` to true and it isn't overwritten by null
    // So wait for `on('ready')`
    watcher.on('ready', changeFile);
  });

  it('watches exactly the given event', function(done) {
    // Accepts a string as the events property and wraps it in an array
    watcher = globWatcher(outGlob, { events: 'add' }, function() {
      done();
    });

    watcher.on('ready', addFile);
  });

  it('accepts multiple events to watch', function(done) {
    watcher = globWatcher(outGlob, { events: ['add', 'unlink'] }, function(evt) {
      if (evt.type === 'unlink') {
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
    watcher = globWatcher([outGlob, ignoreGlob]);

    watcher.once('change', function(evt) {
      // It should never reach here
      should(evt.path).to.not.exist();
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);

    setTimeout(done, 1500);
  });

  it('can re-add a glob after it has been negated', function(done) {
    watcher = globWatcher([outGlob, ignoreGlob, singleAdd]);

    watcher.once('change', function(evt) {
      should(evt.path).equal(singleAdd);
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);
  });

  it('does not mutate the globs array', function(done) {
    var globs = [outGlob, ignoreGlob, singleAdd];
    watcher = globWatcher(globs);

    should(globs[0]).equal(outGlob);
    should(globs[1]).equal(ignoreGlob);
    should(globs[2]).equal(singleAdd);

    done();
  });

  it('passes ignores through to chokidar', function(done) {
    var ignored = [singleAdd];
    watcher = globWatcher(outGlob, {
      ignored: ignored,
    });

    watcher.once('change', function(evt) {
      // It should never reach here
      should(evt.path).toNotExist();
      done();
    });

    // We default `ignoreInitial` to true, so always wait for `on('ready')`
    watcher.on('ready', changeFile);

    // Just test the non-mutation in this test
    should(ignored.length).equal(1);

    setTimeout(done, 1500);
  });
});
