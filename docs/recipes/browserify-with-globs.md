# Browserify + Globs

[Browserify + Uglify](browserify-uglify-sourcemap.md) 
shows how to setup a basic gulp task to bundle a JavaScript file with its 
dependencies, and minify the bundle with UglifyJS while preserving source maps.
It does not, however, show how one may use gulp and Browserify with multiple 
entry files.

See also: the 
[Combining Streams to Handle Errors](combining-streams-to-handle-errors.md) 
recipe for handling errors with Browserify or UglifyJS in your stream.

``` javascript
'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var globby = require('globby');
var through = require('through2');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var reactify = require('reactify');

gulp.task('javascript', function() {
  // gulp expects tasks to return a stream, so we create one here.
  var bundledStream = through();

  bundledStream
    // Turns the output bundle stream into a stream containing
    // the normal attributes gulp plugins expect.
    .pipe(source('app.js'))
    // The rest of the gulp task, as you would normally write it.
    // Here we're copying from the Browserify + Uglify recipe.
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
      // Add gulp plugins to the pipeline here.
      .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/js/'));

  // "globby" replaces the normal "gulp.src" as Browserify
  // creates it's own readable stream.
  globby(['./entries/*.js']).then(function(entries) {
    // Create the Browserify instance.
    var b = browserify({
      entries: entries,
      debug: true,
      transform: [reactify]
    });

    // Pipe the Browserify stream into the stream we created earlier.
    // This starts our gulp pipeline.
    b.bundle().pipe(bundledStream);
  }).catch(function(err) {
    // Ensure any errors from globby are handled.
    bundledStream.emit('error', err);
  });

  // Finally, we return the stream, so gulp knows when this task is done.
  return bundledStream;
});
```
