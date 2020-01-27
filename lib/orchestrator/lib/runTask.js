'use strict';

var eos = require('end-of-stream');
var consume = require('stream-consume');

module.exports = function(task, done) {
  var that = this;
  var finish;
  var cb;
  var isDone = false;
  var start;
  var r;

  finish = function(err_, runMethod) {
    var hrDuration = process.hrtime(start);
    var err;

    if (isDone && !err_) {
      err = new Error('task completion callback called too many times');
    }
    isDone = true;
    err = err || err_;

    var duration = hrDuration[0] + (hrDuration[1] / 1e9); // seconds

    done.call(that, err, {
      duration: duration, // seconds
      hrDuration: hrDuration, // [seconds,nanoseconds]
      runMethod: runMethod
    });
  };

  cb = function(err) {
    finish(err, 'callback');
  };

  try {
    start = process.hrtime();
    r = task(cb);
  } catch (err) {
    return finish(err, 'catch');
  }

  if (r && typeof r.then === 'function') {
    // wait for promise to resolve
    // FRAGILE: ASSUME: Promises/A+, see http://promises-aplus.github.io/promises-spec/
    r.then(function() {
      finish(null, 'promise');
    }, function(err) {
      finish(err, 'promise');
    });

  } else if (r && typeof r.pipe === 'function') {
    // wait for stream to end

    eos(r, { error: true, readable: r.readable && !r.writable, writable: r.writable }, function(err) {
      finish(err, 'stream');
    });

    // Ensure that the stream completes
    consume(r);

  } else if (task.length === 0) {
    // synchronous, function took in args.length parameters, and the callback was extra
    finish(null, 'sync');

  }
};
