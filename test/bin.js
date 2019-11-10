'use strict';

var exec = require('child_process').exec;
var path = require('path');

var should = require('should');

var NODE_PATH = process.env.NODE_PATH;
var cwd = process.cwd();

describe('`bin/gulp.js` command line interface', function() {
  this.timeout(3000);

  beforeEach(function() {
    process.env.NODE_PATH = path.resolve(__dirname, '..', '..');
    process.chdir(path.join(__dirname, 'fixtures'));
  });

  afterEach(function() {
    process.env.NODE_PATH = NODE_PATH;
    process.chdir(cwd);
  });

  it('runs the default task', function(done) {
    exec('node ../../bin/gulp.js', function(err, stdout, stderr) {
      should(err).equal(null);
      should(stdout).containEql('hello world');
      should(stderr).equal('');
      done();
    });
  });

  it('`-v` displays the global and local gulp versions', function(done) {
    exec('node ../../bin/gulp.js -v', function(err, stdout, stderr) {
      should(err).equal(null);
      should(stdout).containEql('CLI version');
      should(stdout).containEql('Local version');
      should(stderr).equal('');
      done();
    });
  });

  it('`--version` displays the global and local gulp versions', function(done) {
    exec('node ../../bin/gulp.js --version', function(err, stdout, stderr) {
      should(err).equal(null);
      should(stdout).containEql('CLI version');
      should(stdout).containEql('Local version');
      should(stderr).equal('');
      done();
    });
  });

  it('`-T` displays the task dependency tree', function(done) {
    exec('node ../../bin/gulp.js -T', function(err, stdout, stderr) {
      should(err).equal(null);
      should(stdout).containEql(' ├── default\n');
      should(stdout).containEql(' └── error\n');
      should(stderr).equal('');
      done();
    });
  });

  it('`--tasks` displays the task dependency tree', function(done) {
    exec('node ../../bin/gulp.js --tasks', function(err, stdout, stderr) {
      should(err).equal(null);
      should(stdout).containEql(' ├── default\n');
      should(stdout).containEql(' └── error\n');
      should(stderr).equal('');
      done();
    });
  });

  it('`--tasks-simple` displays a plain-text list of tasks', function(done) {
    exec('node ../../bin/gulp.js --tasks-simple', function(err, stdout, stderr) {
      should(err).equal(null);
      should(stdout).containEql('default\nerror\n');
      should(stderr).equal('');
      done();
    });
  });

  it('`--cwd` changes the working directory', function(done) {
    exec('node ../../bin/gulp.js --cwd=' + path.join(__dirname, 'fixtures', 'test'), function(err, stdout, stderr) {
      should(err).equal(null);
      should(stdout).containEql('hello world');
      should(stderr).equal('');
      done();
    });
  });

  it('errors when passed an erroring task', function(done) {
    exec('node ../../bin/gulp.js error', function(err, stdout, stderr) {
      should(err.message).equal('Command failed: node ../../bin/gulp.js error\n');
      should(stdout).containEql('SyntaxError: Unexpected end of JSON input');
      should(stderr).equal('');
      done();
    });
  });

  it('errors when passed a non-existent task', function(done) {
    exec('node ../../bin/gulp.js non-existent', function(err, stdout, stderr) {
      should(err.message).equal('Command failed: node ../../bin/gulp.js non-existent\n');
      should(stdout).containEql('Task \'non-existent\' is not in your gulpfile');
      should(stderr).equal('');
      done();
    });
  });

  it('errors when finding no local gulpfile', function(done) {
    process.chdir(__dirname);
    exec('node ../bin/gulp.js', function(err, stdout, stderr) {
      should(err.message).containEql('Command failed: node ../bin/gulp.js');
      should(stdout).containEql('No gulpfile found');
      should(stderr).equal('');
      done();
    });
  });

  it('errors when finding no local gulp', function(done) {
    process.env.NODE_PATH = '';

    exec('node ../../bin/gulp.js', function(err, stdout, stderr) {
      should(err.message).containEql('Command failed: node ../../bin/gulp.js');
      should(stdout).containEql('Local gulp not found in');
      should(stdout).containEql('Try running: npm install gulp');
      should(stderr).equal('');
      done();
    });
  });
});
