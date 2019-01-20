# Mocha test-runner with gulp

### Passing shared module in all tests

```javascript
// npm install gulp gulp-mocha

var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('default', function() {
  return gulp.src(['test/test-*.js'], { read: false })
    .pipe(mocha({
      reporter: 'spec',
      globals: {
        should: require('should')
      }
    }));
});
```

### Running mocha tests when files change

```javascript
var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('mocha', function() {
  return gulp.src(['test/*.js'], { read: false })
    .pipe(mocha({ reporter: 'list' }));
});

gulp.task('watch-mocha', function() {
  gulp.watch(['lib/**/*', 'test/**/*'], ['mocha']);
});
```
