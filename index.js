'use strict';

var util = require('util');
var Orchestrator = require('orchestrator');
var deprecated = require('deprecated');
var vfs = require('vinyl-fs');
var globWatcher = require('./lib/globWatcher');

function Gulp() {
  Orchestrator.call(this);
}
util.inherits(Gulp, Orchestrator);

Gulp.prototype.task = Gulp.prototype.add;
Gulp.prototype.run = function() {
  // `run()` is deprecated as of 3.5 and will be removed in 4.0
  // Use task dependencies instead

  // Impose our opinion of "default" tasks onto orchestrator
  var tasks = arguments.length ? arguments : ['default'];

  this.start.apply(this, tasks);
};

Gulp.prototype.src = vfs.src;
Gulp.prototype.dest = vfs.dest;
Gulp.prototype.watch = function(glob, opt_, fn_) {
  var fn = fn_;
  var opt = opt_;
  if (typeof opt === 'function' || Array.isArray(opt)) {
    fn = opt;
    opt = null;
  }

  // Array of tasks given
  if (Array.isArray(fn)) {
    return globWatcher(glob, opt, function() {
      this.start.apply(this, fn);
    }.bind(this));
  }

  return globWatcher(glob, opt, fn);
};

// Let people use this class from our instance
Gulp.prototype.Gulp = Gulp;

Gulp.prototype.run = deprecated.method('gulp.run() has been deprecated. ' +
  'Use task dependencies or gulp.watch task triggering instead.',
  console.warn, // eslint-disable-line no-console
  Gulp.prototype.run
);

var inst = new Gulp();
module.exports = inst;
