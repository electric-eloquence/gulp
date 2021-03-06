'use strict';

var chokidar = require('@electric-eloquence/chokidar');
var debounce = require('lodash.debounce');
var defaults = require('object.defaults');

var defaultOpts = {
  delay: 200,
  events: ['add', 'change', 'unlink'],
  ignoreInitial: true,
  queue: true
};

function watch(glob, options_, cb_) {
  var options = options_;
  var cb = cb_;

  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  var opt = defaults({}, options, defaultOpts);

  if (!Array.isArray(opt.events)) {
    opt.events = [opt.events];
  }

  var queued = false;
  var running = false;

  var watcher = chokidar.watch(glob, opt);

  function runComplete(err) {
    running = false;

    if (err) {
      watcher.emit('error', err);
    }

    // If we have a run queued, start onChange again
    if (queued) {
      queued = false;
      onChange();
    }
  }

  function onChange() {
    if (running) {
      if (opt.queue) {
        queued = true;
      }
      return;
    }

    running = true;

    var event = {
      type: watcher.lastEvent && watcher.lastEvent.type || '',
      path: watcher.lastEvent && watcher.lastEvent.path || ''
    };

    var retVal = cb(event);
    if (typeof Promise === 'function' && retVal instanceof Promise) {
      retVal.then(function() {
        runComplete();
      }).catch(function(err) {
        runComplete(err);
      });
    } else {
      runComplete();
    }
  }

  var fn;
  if (typeof cb === 'function') {
    fn = debounce(onChange, opt.delay, opt);
  }

  function watchEvent(eventName) {
    watcher.on(eventName, fn);
  }

  if (fn) {
    opt.events.forEach(watchEvent);
  }

  return watcher;
}

module.exports = watch;
