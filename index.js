'use strict';

var util = require('util');
var Orchestrator = require('orchestrator');
var runSequence = require('./lib/run-sequence');
var vfs = require('vinyl-fs');
var globWatcher = require('./lib/glob-watcher');

function Gulp() {
  Orchestrator.call(this);
}
util.inherits(Gulp, Orchestrator);

Gulp.prototype.task = Gulp.prototype.add;
Gulp.prototype.runSeq = null;
Gulp.prototype.runSequence = null; // Keeping because older version documented
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

// Not publicly documenting this because it doesn't signal any sort of
// termination. It fires and forgets tasks asynchronously. Nonetheless,
// it is helpful for running tests and its use should remain internal.
Gulp.prototype.run = function() {
  var tasks = arguments.length ? arguments : ['default'];
  this.start.apply(this, tasks);
};

// Let people use this class from our instance
Gulp.prototype.Gulp = Gulp;

var inst = new Gulp();
inst.runSeq = runSequence.bind(null, inst);
inst.runSequence = inst.runSeq; // Keeping because older version documented this
module.exports = inst;
