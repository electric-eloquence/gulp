var gulp = require('../../');

gulp.task('default', function(cb) {
  console.log('hello world'); // eslint-disable-line no-console
  cb();
});

gulp.task('error', function(cb) {
  JSON.parse('{');
  cb();
});
