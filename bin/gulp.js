#!/usr/bin/env node
'use strict';

try {
  require('gulp-cli')();
} catch (err) {
  /* eslint-disable no-console */
  console.error(err);
  console.error('Please run `npm install -g gulp-cli` and try again.');
}
