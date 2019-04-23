## gulp API docs

Jump to:
  [gulp.src](#gulpsrcglobs-options) |
  [gulp.dest](#gulpdestpath-options) |
  [gulp.task](#gulptaskname--deps-fn) |
  [gulp.runSeq](#gulprunseqtasks-cb) |
  [gulp.watch](#gulpwatchglob--opts-tasks-or-gulpwatchglob--opts-cb)

### gulp.src(globs[, options])

Emits files matching provided glob or an array of globs. 
Returns a [stream](https://nodejs.org/api/stream.html) of 
[Vinyl files](https://github.com/gulpjs/vinyl-fs) that can be 
[piped](https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options) 
to plugins.

```javascript
gulp.src('client/templates/*.jade')
  .pipe(jade())
  .pipe(minify())
  .pipe(gulp.dest('build/minified_templates'));
```

#### globs
Type: `String` or `Array`

Glob or array of globs to read. Globs use [node-glob syntax] except that
negation is fully supported.

A glob that begins with `!` excludes matching files from the glob results up to
that point. For example, consider this directory structure:

    client/
      a.js
      bob.js
      bad.js

The following expression matches `a.js` and `bad.js`:

    gulp.src(['client/*.js', '!client/b*.js', 'client/bad.js'])
    

#### options
Type: `Object`

Options to pass to [node-glob] through [glob-stream].

gulp supports all [options supported by node-glob][node-glob documentation] and
[glob-stream] except `ignore` and adds the following options.

##### options.buffer
Type: `Boolean`
Default: `true`

Setting this to `false` will return `file.contents` as a stream and not buffer
files. This is useful when working with large files.

__Note:__ Plugins might not implement support for streams.

##### options.read
Type: `Boolean`
Default: `true`

Setting this to `false` will return `file.contents` as null and not read the
file at all.

##### options.base
Type: `String`
Default: everything before a glob starts (see [glob2base])

E.g., consider `somefile.js` in `client/js/somedir`:

```javascript
gulp.src('client/js/**/*.js') // Resolves `base` to `client/js/`
  .pipe(minify())
  .pipe(gulp.dest('build'));  // Writes 'build/somedir/somefile.js'

gulp.src('client/js/**/*.js', { base: 'client' }) // Resolves `base` to `client/`
  .pipe(minify())
  .pipe(gulp.dest('build'));  // Writes 'build/js/somedir/somefile.js'
```

### gulp.dest(path[, options])

Can be piped to and it will write files. Re-emits all data passed to it so you
can pipe to multiple folders.  Folders that don't exist will be created.

```javascript
gulp.src('./client/templates/*.jade')
  .pipe(jade())
  .pipe(gulp.dest('./build/templates'))
  .pipe(minify())
  .pipe(gulp.dest('./build/minified_templates'));
```

The write path is calculated by appending the file relative path to the given
destination directory. In turn, relative paths are calculated against the file
base. See `gulp.src` above for more info.

#### path
Type: `String` or `Function`

The path (output folder) to write files to. Or a function that returns it, the
function will be provided a 
[Vinyl file instance](https://github.com/gulpjs/vinyl).

#### options
Type: `Object`

##### options.cwd
Type: `String`
Default: `process.cwd()`

`cwd` for the output folder, only has an effect if provided output folder is
relative.

##### options.mode
Type: `String`
Default: `0777`

Octal permission string specifying mode for any folders that need to be created
for output folder.

### gulp.task(name [, deps, fn])

Define a task using [Orchestrator].

```javascript
gulp.task('somename', function() {
  // do stuff
});
```

#### name
Type: `String`

The name of the task. Tasks that you want to run from the command line should
not have spaces in them.

#### deps
Type: `Array`

An array of tasks to be executed and completed before your task will run.

```javascript
gulp.task('mytask', ['array', 'of', 'task', 'names'], function() {
  // do stuff
});
```

You can also omit the function if you only want to run a bundle of dependency
tasks:

```javascript
gulp.task('build', ['array', 'of', 'task', 'names']);
```

__Note:__ The tasks will run in parallel (all at once), so don't assume that the
tasks will start/finish in order.

#### fn
Type: `Function`

The function performs the task's main operations. Generally this takes the form
of:

```javascript
gulp.task('buildStuff', function() {
  // Do something that "builds stuff"
  var stream = gulp.src(/*some source path*/)
  .pipe(somePlugin())
  .pipe(someOtherPlugin())
  .pipe(gulp.dest(/*some destination*/));
  
  return stream;
  });
```

Is your function running before the dependencies are complete? Make sure your
dependency tasks handle asynchrony correctly.

#### Async task support

Tasks can be made asynchronous if its `fn` does one of the following:

##### Invoke a callback

```javascript
// Run a command in a shell
var exec = require('child_process').exec;
gulp.task('jekyll', function(cb) {
  // Build Jekyll
  exec('jekyll build', function(err) {
    if (err) return cb(err); // Return error
    cb(); // Finished task
  });
});
```

##### Return a stream

```javascript
gulp.task('somename', function() {
  var stream = gulp.src('client/**/*.js')
    .pipe(minify())
    .pipe(gulp.dest('build'));
  return stream;
});
```

##### Return a promise

```javascript
gulp.task('somename', function() {
  return new Promise(function(resolve) {
    // Do async stuff
    setTimeout(function() {
      resolve();
    }, 1000);
  });
});
```

__Note:__ By default, tasks run with maximum concurrency -- e.g. it launches all
the tasks at once and waits for nothing. If you want to create a series where
tasks run in a particular order, you need to do two things:

* Give it a hint to tell it when the task is done.
* Give it a hint that a task depends on completion of another.

For these examples, let's presume you have two tasks, "one" and "two" that you
specifically want to run in this order:

1. In task "one" you add a hint to tell it when the task is done.  Either take
in a callback and call it when you're done or return a promise or stream that
the engine should wait to resolve or end respectively.
2. In task "two" you add a hint telling the engine that it depends on completion
of the first task.

So this example would look like this:

```javascript
var gulp = require('gulp');

// Takes in a callback so the engine knows when it'll be done
gulp.task('one', function(cb) {
    // do stuff -- async or otherwise
    cb(err); // If err is not null and not undefined, the run will stop, and note that it failed
});

// Identifies a dependency task that must be complete before this one begins
gulp.task('two', ['one'], function() {
    // Task 'one' is done now
});

gulp.task('default', ['one', 'two']);
```

### gulp.runSeq(tasks..., cb)

An reference to the [run-sequence](https://github.com/OverZealous/run-sequence) 
package and method.

#### tasks
Type: `String` or `Array`

Tasks to be executed. You may pass any number of tasks or arrays of tasks as 
individual arguments.

Tasks will be run in order so long as they return a stream or promise, or handle 
the callback. This works by listening to the `task_stop` and `task_err` events, 
and keeping track of which tasks have been completed. You can still run some of 
the tasks in parallel by providing an array of task names for one or more of the 
arguments.

#### cb
Type: `Function`

Be sure to submit a callback function as the final argument. This is necessary 
to signal the termination of execution for `gulp.runSeq`.

```javascript
gulp.task('default', function(callback) {
  gulp.runSeq(
    'boil-water',
    ['steep-tea', 'boil-egg'],
    'peel-egg',
    callback
  );
});
```

#### Options

There are a few options you can configure on the `gulp.runSeq` function.

__Note:__ These options are persistent to the gulp instance, and once set will 
affect every use of `gulp.runSeq` thereafter.

```javascript
gulp.runSeq.options.ignoreUndefinedTasks = true;
gulp.task('default', function(cb) {
  gulp.runSeq(
    'foo',
    null, // No longer errors on `null`
    'bar',
    cb
  );
})
```

* `showErrorStackTrace`: When set to `false`, this suppresses the full stack 
  trace from errors captured during a sequence.
* `ignoreUndefinedTasks`: When set to `true`, this enables you to pass falsey 
  values in which will be stripped from the task set before validation and sequencing.

### gulp.watch(glob [, opts], tasks) or gulp.watch(glob [, opts, cb])

Watch files and do something when a file changes. This always returns an
EventEmitter that emits `change` events.

### gulp.watch(glob[, opts], tasks)

#### glob
Type: `String` or `Array`

A single glob or array of globs that indicate which files to watch for changes.

#### opts
Type: `Object`

Options, that are passed to 
[`Chokidar`](https://github.com/electric-eloquence/chokidar).

#### tasks
Type: `Array`

Names of task(s) to run when a file changes, added with `gulp.task()`

```javascript
var watcher = gulp.watch('js/**/*.js', ['uglify','reload']);
watcher.on('change', function(event) {
  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
});
```

### gulp.watch(glob[, opts, cb])

#### glob
Type: `String` or `Array`

A single glob or array of globs that indicate which files to watch for changes.

#### opts
Type: `Object`

Options, that are passed to 
[`Chokidar`](https://github.com/electric-eloquence/chokidar).

#### cb(event)
Type: `Function`

Callback to be called on each change.

```javascript
gulp.watch('js/**/*.js', function(event) {
  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
});
```

The callback will be passed an object, `event`, that describes the change:

##### event.type
Type: `String`

The type of change that occurred, either `add`, `change` or `unlink`.

##### event.path
Type: `String`

The path to the file that triggered the event.

Each watcher has a callback queue which can wait for asynchronous callbacks to
complete before proceeding to the next one. In order for this to work, the
callback must return a promise.

__Note:__ In order to gracefully handle errors rejected or thrown by such
asynchronous callbacks, the watcher must have an on('error') event listener.

```javascript
var watcher = gulp.watch('js/**/*.js', function() {
  return new Promise(function(resolve, reject) {
    // Get HTTP response
    if (httpResponse.ok) {
      resolve(httpResponse);
    } else {
      reject(new Error(httpResponse.status + ': ' + httpResponse.statusText));
    }
  });
});
watcher.on('error', function(err) {
  console.error(err);
});
```

[node-glob]: https://github.com/isaacs/node-glob
[node-glob documentation]: https://github.com/isaacs/node-glob#options
[node-glob syntax]: https://github.com/isaacs/node-glob
[glob-stream]: https://github.com/gulpjs/glob-stream
[Orchestrator]: https://github.com/robrich/orchestrator
[glob2base]: https://github.com/contra/glob2base
