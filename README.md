# gulp 3 lts

> The streaming build system

[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Mac/Linux Build Status][travis-image]][travis-url]
[![Windows Build Status][appveyor-image]][appveyor-url]
[![Coverage Status][coveralls-image]][coveralls-url]
![Node Version][node-version-image]
[![License][license-image]][license-url]

### This package provides long-term support for gulp at major version 3.

This includes maintenance fixes and security updates.

The scoping of this package makes it an entirely different package from unscoped
gulp and precludes any access from any gulp plugins if it is installed with the
usual `npm install @electric-eloquence/gulp` command.

Instead, follow these instructions:

## Install

* Latest version (without Git):
  * `npm install https://github.com/electric-eloquence/gulp/tarball/v3-lts@3.9.11`
  * Or add `"gulp": "https://github.com/electric-eloquence/gulp/tarball/v3-lts@3.9.11"`
    as a dependency in package.json.
* Latest version (with Git):
  * `npm install electric-eloquence/gulp`
* Specific version (with Git):
  * `npm install electric-eloquence/gulp#3.9.11`
* Semver range (with Git):
  * `npm install electric-eloquence/gulp#semver:^3.9.11`
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

// Not all tasks need to use streams.
// A gulpfile is just another node program and you can use any package
// available on npm.
gulp.task('clean', function() {
  // You can use multiple globbing patterns as you would with `gulp.src`.
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

// Copy all static images.
gulp.task('images', ['clean'], function() {
  return gulp.src(paths.images)
    // Pass in options to the task
    .pipe(imagemin({ optimizationLevel: 5 }))
    .pipe(gulp.dest('build/img'));
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

[travis-image]: https://img.shields.io/travis/electric-eloquence/gulp/v3-lts.svg?label=mac%20%26%20linux
[travis-url]: https://travis-ci.org/electric-eloquence/gulp

[appveyor-image]: https://img.shields.io/appveyor/ci/e2tha-e/gulp/v3-lts.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/e2tha-e/gulp

[coveralls-image]: https://img.shields.io/coveralls/electric-eloquence/gulp/v3-lts.svg
[coveralls-url]: https://coveralls.io/github/electric-eloquence/gulp?branch=v3-lts

[node-version-image]: https://img.shields.io/node/v/@electric-eloquence/gulp.svg

[license-image]: https://img.shields.io/github/license/electric-eloquence/gulp.svg
[license-url]: https://raw.githubusercontent.com/electric-eloquence/gulp/v3-lts/LICENSE
