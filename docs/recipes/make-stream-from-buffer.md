# Make stream from buffer (memory contents)

Sometimes you may need to start a stream with files that their contents are in a variable and not in a physical file. In other words, how to start a 'gulp' stream without using `gulp.src()`.

Let's say for example that we have a directory with js lib files and another directory with versions of some module. The target of the build would be to create one js file for each version, containing all the libs and the version of the module concatenated.

Logically we would break it down like this:

* load the lib files
* concatenate the lib file contents
* load the versions files
* for each version file, concatenate the libs' contents and the version file contents
* for each version file, output the result in a file

Imagine this file structure:

```sh
├── libs
│   ├── lib1.js
│   └── lib2.js
└── versions
    ├── version.1.js
    └── version.2.js
```

You should get:

```sh
└── output
    ├── version.1.complete.js # lib1.js + lib2.js + version.1.js
    └── version.2.complete.js # lib1.js + lib2.js + version.2.js
```

A simple and modular way to do this would be the following:

```js
var gulp = require('gulp');
var runSequence = require('run-sequence');
var source = require('vinyl-source-stream');
var vinylBuffer = require('vinyl-buffer');
var tap = require('gulp-tap');
var concat = require('gulp-concat');
var size = require('gulp-size');
var path = require('path');
var es = require('event-stream');

// Keep assets in memory.
var memory = {};

// Task of loading the files' contents into memory.
gulp.task('load-lib-files', function() {
  // Read the lib files from disk.
  return gulp.src('src/libs/*.js')
  // Concatenate all lib files into one.
  .pipe(concat('libs.concat.js'))
  // Tap into the stream to get each file's data.
  .pipe(tap(function(file) {
    // Save the file contents in memory.
    memory[path.basename(file.path)] = file.contents.toString();
  }));
});

gulp.task('load-versions', function() {
  memory.versions = {};
  // Read the version files from disk.
  return gulp.src('src/versions/version.*.js')
  // Tap into the stream to get each file's data.
  .pipe( tap(function(file) {
    // Save the file contents in memory.
    memory.versions[path.basename(file.path)] = file.contents.toString();
  }));
});

gulp.task('write-versions', function() {
  // Store all the different version file names in an array.
  var availableVersions = Object.keys(memory.versions);
  // Make an array to store all the stream promises.
  var streams = [];

  availableVersions.forEach(function(v) {
    // Make a new stream with fake file name.
    var stream = source('final.' + v);
    
    var streamEnd = stream;
    
    // Load the data from the concatenated libs.
    var fileContents = memory['libs.concat.js'] +
      // Add the version's data.
      '\n' + memory.versions[v];

    // Write the file contents to the stream.
    stream.write(fileContents);

    process.nextTick(function() {
      // In the next process cycle, end the stream.
      stream.end();
    });

    streamEnd = streamEnd
    // Transform the raw data in the stream into a vinyl object/file.
    .pipe(vinylBuffer())
    //.pipe(tap(function(file) { /* do something with the file contents here */ }))
    .pipe(gulp.dest('output'));
    
    // Add the end of the stream. Otherwise the task would finish before all the processing.
    // Done.
    streams.push(streamEnd);
  });

  return es.merge.apply(this, streams);
});

//============================================ our main task
gulp.task('default', function(taskDone) {
  runSequence(
    ['load-lib-files', 'load-versions'], // Load the files in parallel.
    'write-versions', // Ready to write once all resources are in memory.
    taskDone          // Done.
  );
});

//============================================ our watcher task
// Only watch after having run 'default' once so that all resources are already in memory.
gulp.task('watch', ['default'], function() {
  gulp.watch('./src/libs/*.js', function() {
    runSequence(
      'load-lib-files',  // We only have to load the changed files.
      'write-versions'
    );
  });

  gulp.watch('./src/versions/*.js', function() {
    runSequence(
      'load-versions', // We only have to load the changed files.
      'write-versions'
    );
  });
});
```
