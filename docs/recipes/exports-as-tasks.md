# Exports as tasks

Using the ES2015 module syntax you can use your exports as tasks.

```javascript
import gulp from 'gulp';
import babel from 'gulp-babel';

// Named task.
export function build() {
  return gulp.src('src/*.js')
    .pipe(babel())
    .pipe(gulp.dest('lib'));
}

// Default task.
export default function dev() {
  gulp.watch('src/*.js', ['build']);
}
```
