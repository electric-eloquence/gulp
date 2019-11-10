#!/usr/bin/env node
'use strict';

var archy = require('archy');
var argv = require('minimist')(process.argv.slice(2));
var chalk = require('chalk');
var log = require('fancy-log');
var prettyTime = require('pretty-hrtime');
var tildify = require('tildify');
var v8flags = require('v8flags');

var completion = require('../lib/completion');
var taskTree = require('../lib/task-tree');
var Liftoff = require('./liftoff');

// Set env var for ORIGINAL cwd
// before anything touches it
process.env.INIT_CWD = process.cwd();

var cli = new Liftoff({
  name: 'gulp',
  completions: completion,
  v8flags: v8flags
});

// Exit with 0 or 1
var failed = false;
process.once('exit', function(code) {
  if (code === 0 && failed) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
});

// Parse those args m8
var cliPackage = require('../package');
var versionFlag = argv.v || argv.version;
var tasksFlag = argv.T || argv.tasks;
var tasks = argv._;
var toRun = tasks.length ? tasks : ['default'];

// This is a hold-over until we have a better logging system
// with log levels
var simpleTasksFlag = argv['tasks-simple'];
var shouldLog = !argv.silent && !simpleTasksFlag;

if (!shouldLog) {
  log = function() {};
}

// Will probably never require external modules
/* istanbul ignore next */
cli.on('require', function(name) {
  log('Requiring external module', chalk.magenta(name));
});

/* istanbul ignore next */
cli.on('requireFail', function(name) {
  log(chalk.red('Failed to load external module'), chalk.magenta(name));
});

// Might not ever be able to test
/* istanbul ignore next */
cli.on('respawn', function(flags, child) {
  var nodeFlags = chalk.magenta(flags.join(', '));
  var pid = chalk.magenta(child.pid);
  log('Node flags detected:', nodeFlags);
  log('Respawned to PID:', pid);
});

cli.launch({
  cwd: argv.cwd,
  configPath: argv.gulpfile,
  require: argv.require,
  completion: argv.completion
}, handleArguments);

// The actual logic
function handleArguments(env) {
  if (versionFlag && tasks.length === 0) {
    log('CLI version', cliPackage.version);
    if (env.modulePackage && typeof env.modulePackage.version !== 'undefined') {
      log('Local version', env.modulePackage.version);
    }
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }

  if (!env.modulePath) {
    log(
      chalk.red('Local gulp not found in'),
      chalk.magenta(tildify(env.cwd))
    );
    log(chalk.red('Try running: npm install gulp'));
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  if (!env.configPath) {
    log(chalk.red('No gulpfile found'));
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  // Chdir before requiring gulpfile to make sure
  // we let them chdir as needed
  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    log(
      'Working directory changed to',
      chalk.magenta(tildify(env.cwd))
    );
  }

  // This is what actually loads up the gulpfile
  require(env.configPath);
  log('Using gulpfile', chalk.magenta(tildify(env.configPath)));

  var gulpInst = require(env.modulePath);
  logEvents(gulpInst);

  process.nextTick(function() {
    if (simpleTasksFlag) {
      return logTasksSimple(env, gulpInst);
    }
    if (tasksFlag) {
      return logTasks(env, gulpInst);
    }
    gulpInst.start.apply(gulpInst, toRun);
  });
}

function logTasks(env, localGulp) {
  var tree = taskTree(localGulp.tasks);
  tree.label = 'Tasks for ' + chalk.magenta(tildify(env.configPath));
  archy(tree)
    .split('\n')
    .forEach(function(v) {
      if (v.trim().length === 0) {
        return;
      }
      log(v);
    });
}

function logTasksSimple(env, localGulp) {
  // eslint-disable-next-line no-console
  console.log(Object.keys(localGulp.tasks)
    .join('\n')
    .trim());
}

// Format orchestrator errors
/* istanbul ignore next */
function formatError(e) {
  if (!e.err) {
    return e.message;
  }

  // PluginError
  if (typeof e.err.showStack === 'boolean') {
    return e.err.toString();
  }

  // Normal error
  if (e.err.stack) {
    return e.err.stack;
  }

  // Unknown (string, number, etc.)
  return new Error(String(e.err)).stack;
}

// Wire up logging events
function logEvents(gulpInst) {

  // Total hack due to poor error management in orchestrator
  gulpInst.on('err', function() {
    failed = true;
  });

  gulpInst.on('task_start', function(e) {
    // TODO: batch these
    // so when 5 tasks start at once it only logs one time with all 5
    log('Starting', '\'' + chalk.cyan(e.task) + '\'...');
  });

  gulpInst.on('task_stop', function(e) {
    var time = prettyTime(e.hrDuration);
    log(
      'Finished', '\'' + chalk.cyan(e.task) + '\'',
      'after', chalk.magenta(time)
    );
  });

  gulpInst.on('task_err', function(e) {
    var msg = formatError(e);
    var time = prettyTime(e.hrDuration);
    log(
      '\'' + chalk.cyan(e.task) + '\'',
      chalk.red('errored after'),
      chalk.magenta(time)
    );
    log(msg);
  });

  gulpInst.on('task_not_found', function(err) {
    log(
      chalk.red('Task \'' + err.task + '\' is not in your gulpfile')
    );
    log('Please check the documentation for proper gulpfile formatting');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
}
