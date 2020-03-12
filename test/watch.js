'use strict';

var gulp = require('../');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var path = require('path');

var should = require('should');
require('mocha');

var outpath = path.join(__dirname, './out-fixtures');

describe('gulp', function() {
  describe('watch()', function() {
    before(function(done) {
      rimraf(outpath, function() {
        mkdirp.sync(outpath);
        done();
      });
    });

    var tempFileContent = 'A test generated this file and it is safe to delete';
    var writeTimeout = 125; // Wait for it to get to the filesystem

    function writeFileWait(name, content, cb_) {
      var cb = cb_ || function() {};

      setTimeout(function() {
        fs.writeFile(name, content, cb);
      }, writeTimeout);
    }

    it('calls the function when file changes: no options', function(done) {
      // Arrange
      var tempFile = path.join(outpath, 'watch-func.txt');
      fs.writeFile(tempFile, tempFileContent, function() {

        // Assert
        var watcher = gulp.watch(tempFile, function(evt) {
          var watched = watcher.getWatched();
          var testDir = Object.keys(watched)[0];
          var testFullPath = path.join(testDir, watched[testDir][0]);

          should.exist(evt);
          should.exist(evt.path);
          should.exist(evt.type);
          should(evt.type).equal('change');
          should(evt.path).equal(path.resolve(tempFile));
          should.exist(watched);
          should(testFullPath).equal(tempFile);
          should(fs.existsSync(testDir)).be.true;
          should(fs.existsSync(testFullPath)).be.true;

          watcher.close();
          done();
        });

        // Act: change file
        writeFileWait(tempFile, tempFileContent + ' changed');
      });
    });

    it('calls the function when file changes: w/ options', function(done) {
      // Arrange
      var tempFile = path.join(outpath, 'watch-func-options.txt');
      fs.writeFile(tempFile, tempFileContent, function() {

        // Assert: it works if it calls done
        var watcher = gulp.watch(tempFile, { debounceDelay: 5 }, function(evt) {
          var watched = watcher.getWatched();
          var testDir = Object.keys(watched)[0];
          var testFullPath = path.join(testDir, watched[testDir][0]);

          should.exist(evt);
          should.exist(evt.path);
          should.exist(evt.type);
          should(evt.type).equal('change');
          should(evt.path).equal(path.resolve(tempFile));
          should.exist(watched);
          should(testFullPath).equal(tempFile);
          should(fs.existsSync(testDir)).be.true;
          should(fs.existsSync(testFullPath)).be.true;

          watcher.close();
          done();
        });

        // Act: change file
        writeFileWait(tempFile, tempFileContent + ' changed');
      });
    });

    it('does not drop options when no callback specified', function(done) {
      // Arrange
      var tempFile = path.join(outpath, 'watch-func-nodrop-options.txt');
      // By passing a cwd option, ensure options are not lost
      var relFile = '../watch-func-nodrop-options.txt';
      var cwd = outpath + '/subdir';
      fs.writeFile(tempFile, tempFileContent, function() {

        // Assert
        var watcher = gulp.watch(relFile, { debounceDelay: 5, cwd: cwd })
          .on('change', function(evt) {
            var watched = watcher.getWatched();
            var testDir = Object.keys(watched)[0];
            var testFullPath = path.resolve(cwd, testDir, watched[testDir][0]);

            should.exist(evt);
            should.exist(evt.path);
            should.exist(evt.type);
            should(evt.type).equal('change');
            should(evt.path).equal(path.resolve(tempFile));
            should.exist(watched);
            should(testFullPath).equal(path.resolve(cwd, relFile));
            should(fs.existsSync(testDir)).be.true;
            should(fs.existsSync(testFullPath)).be.true;

            watcher.close();
            done();
          });

        // Act: change file
        writeFileWait(tempFile, tempFileContent + ' changed');
      });
    });

    it('runs many tasks: w/ options', function(done) {
      // Arrange
      var tempFile = path.join(outpath, 'watch-task-options.txt');
      var task = 'task';
      var task1 = 'task1';
      var a = 0;
      var timeout = writeTimeout * 2.5;

      new Promise(function(resolve) {
        fs.writeFile(tempFile, tempFileContent, function() {
          // Set up watcher
          gulp.task(task, function() {
            a++;
          });
          gulp.task(task1, function() {
            a += 10;
          });

          // Launch watcher
          var config = { debounceDelay: timeout / 2 };
          gulp.watch(tempFile, config, [task, task1]);

          resolve();
        });
      })
      .then(function() {
        return new Promise(function(resolve) {
          // Act: change file
          setTimeout(function() {
            fs.writeFile(tempFile, tempFileContent + ' changed', function() {
              resolve();
            });
          }, writeTimeout);
        });
      })
      .then(function() {
        // Assert
        setTimeout(function() {
          a.should.equal(11); // task and task1

          gulp.reset();
          done();
        }, timeout);
      });
    });

    it('runs many tasks: no options', function(done) {
      // Arrange
      var tempFile = path.join(outpath, 'watch-many-tasks-no-options.txt');
      var task = 'task';
      var task1 = 'task1';
      var a = 0;
      var timeout = writeTimeout * 2.5;

      new Promise(function(resolve) {
        fs.writeFile(tempFile, tempFileContent, function() {
          // Set up watcher
          gulp.task(task, function() {
            a++;
          });
          gulp.task(task1, function() {
            a += 10;
          });

          // Launch watcher
          gulp.watch(tempFile, [task, task1]);

          resolve();
        });
      })
      .then(function() {
        return new Promise(function(resolve) {
          // Act: change file
          setTimeout(function() {
            fs.writeFile(tempFile, tempFileContent + ' changed', function() {
              resolve();
            });
          }, writeTimeout);
        });
      })
      .then(function() {
        // Assert
        setTimeout(function() {
          a.should.equal(11); // Task1 and task1

          gulp.reset();
          done();
        }, timeout);
      });
    });
  });
});
