# gulp 3 lts

> The streaming build system

[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Linux Build Status][linux-image]][linux-url]
[![Mac Build Status][mac-image]][mac-url]
[![Windows Build Status][windows-image]][windows-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![License][license-image]][license-url]

### This package provides long-term support for gulp at major version 3.

This includes maintenance fixes and security updates.

## Install

* Latest version (without Git):
  * `npm install https://github.com/electric-eloquence/gulp/tarball/v3-lts@3.9.17`
  * Or add `"gulp": "https://github.com/electric-eloquence/gulp/tarball/v3-lts@3.9.17"`
    as a dependency in package.json.
* Latest version (with Git):
  * `npm install electric-eloquence/gulp`
* Specific version (with Git):
  * `npm install electric-eloquence/gulp#3.9.17`
* Semver range (with Git):
  * `npm install electric-eloquence/gulp#semver:^3.9.17`
* When installed one of these ways, other packages depending on gulp will get
  gulp 3 with long-term support.

## What is gulp?

* __Automation__ - gulp is a toolkit that helps you automate painful or 
  time-consuming tasks in your development workflow.
* __Platform-agnostic__ - Integrations are built into all major IDEs and people 
  are using gulp with PHP, .NET, Node.js, Java, and other platforms.
* __Strong Ecosystem__ - Use npm modules to do anything you want + over 2000 
  curated plugins for streaming file transformations.
* __Simple__ - By providing only a minimal API surface, gulp is easy to learn 
  and simple to use.

## Documentation

For a Getting Started guide, API docs, recipes, making a plugin, etc. check out our docs!

* [Documentation for gulp 3](/docs/README.md)
* [Why stay on gulp 3?](/docs/why-gulp-3.md)

## Sample `gulpfile.js`

This file will give you a taste of what gulp does.

```javascript
var gulp = require('gulp');
var coffee = require('gulp-coffee');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');

var paths = {
  scripts: ['client/js/**/*.coffee', '!client/external/**/*.coffee'],
  images: 'client/img/**/*'
};

gulp.task('clean', function() {
  // Not all tasks need to use streams.
  // A gulpfile is just another node program and you can use any package
  // available on npm.
  return del(['build']);
});

gulp.task('scripts', ['clean'], function() {
  // Minify and copy all JavaScript (except vendor scripts) with
  // sourcemaps all the way down.
  return gulp.src(paths.scripts)
    .pipe(sourcemaps.init())
      .pipe(coffee())
      .pipe(uglify())
      .pipe(concat('all.min.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/js'));
});

gulp.task('imagemin', function() {
  // Minify and copy all static images.
  return gulp.src(paths.images)
    // Pass in options to the task
    .pipe(imagemin({ optimizationLevel: 5 }))
    .pipe(gulp.dest('build/img'));
});

gulp.task('images', function(cb) {
  // The run-sequence package and method are now internal to gulp
  // and will receive long-term support for the life of gulp 3 lts.
  // https://github.com/OverZealous/run-sequence
  gulp.runSeq( // or gulp.runSequence
    'clean',
    'imagemin',
    cb
  );
});

// Rerun the task when a file changes.
gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['scripts']);
  gulp.watch(paths.images, ['images']);
});

// The default task (called when you run `gulp` from cli).
gulp.task('default', ['watch', 'scripts', 'images']);
```

## Incremental Builds

We recommend these plugins:

* [gulp-changed](https://github.com/sindresorhus/gulp-changed) - only pass through changed files
* [gulp-cached](https://github.com/gulp-community/gulp-cached) - in-memory file cache, not for operation on sets of files
* [gulp-remember](https://github.com/ahaurw01/gulp-remember) - pairs nicely with gulp-cached
* [gulp-newer](https://github.com/tschaub/gulp-newer) - pass through newer source files only, supports many:1 source:dest

## Troubleshooting Installation

* `npm ERR! code EINTEGRITY`
  * If npm warns that the tarball seems to be corrupted, delete your
    package-lock.json, and install again.

## Acknowledgments

This package is forked from 
[the upstream source](https://github.com/gulpjs/gulp) with the same name. 
This fork is mostly derivative and adds little functionality. Credit and 
gratitude are due for 
[the contributors to the source](https://github.com/gulpjs/gulp/graphs/contributors). 
It is our intent to work in their favor by maintaining an older version of their 
project, which may otherwise be burdensome for them to commit time to.

[snyk-image]: https://snyk.io/test/github/electric-eloquence/gulp/v3-lts/badge.svg
[snyk-url]: https://snyk.io/test/github/electric-eloquence/gulp/v3-lts

[linux-image]: https://github.com/electric-eloquence/gulp/workflows/Linux%20build/badge.svg?branch=v3-lts
[linux-url]: https://github.com/electric-eloquence/gulp/actions?query=workflow%3A"Linux+build"

[mac-image]: https://github.com/electric-eloquence/gulp/workflows/Mac%20build/badge.svg?branch=v3-lts
[mac-url]: https://github.com/electric-eloquence/gulp/actions?query=workflow%3A"Mac+build"

[windows-image]: https://github.com/electric-eloquence/gulp/workflows/Windows%20build/badge.svg?branch=v3-lts
[windows-url]: https://github.com/electric-eloquence/gulp/actions?query=workflow%3A"Windows+build"

[coveralls-image]: https://img.shields.io/coveralls/electric-eloquence/gulp/v3-lts.svg
[coveralls-url]: https://coveralls.io/github/electric-eloquence/gulp?branch=v3-lts

[license-image]: https://img.shields.io/github/license/electric-eloquence/gulp.svg
[license-url]: https://raw.githubusercontent.com/electric-eloquence/gulp/v3-lts/LICENSE
