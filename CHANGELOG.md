# gulp changelog

### 3.9.8
* Offloaded CLI to gulp-cli
* Greatly reduced the number of NPM dependencies

### 3.9.7
* Using vinyl-fs lts v3.0.4
* Letting chokidar disable fsevents for macOS El Capitan and lower

### 3.9.6
* Adding gulp.runSeq as an alias for gulp.runSequence
* Using @electric-eloquence/chokidar ^1.7.6, which uses fsevents 2.x, which uses Node's native N-API

### 3.9.5
* Acknowledgements in readme

### 3.9.4
* Minor maintenance and doc updates

### 3.9.3
* Better handling of renamed and removed directories
* Better handling of paths when cwd is submitted

### 3.9.2
* Updated documentation
* Continuous integration
* Removed deprecation from gulp.run method (but not exposing it publicly)
* Adding gulp.runSequence as a fully-supported method

### 3.9.1
* Beginning of long-term support for gulp major version 3
* Replacing Gaze with Chokidar with long-term support for major version 1
