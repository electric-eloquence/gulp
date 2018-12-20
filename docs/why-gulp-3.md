# Why gulp 3?

gulp 4 is backwards-compatible with much of gulp 3 syntax, but definitely not 
all of it. There will be a threshold where your codebase contains so much 
incompatible code that if a secure version of gulp 3 exists, it would be better 
to not refactor your code, and to use the secure version of gulp 3. This is 
especially the case if 
[gulp 3 were to receive support and maintenance indefinitely](https://github.com/electric-eloquence/gulp#readme).

### Where gulp 3 outshines gulp 4

There are some cases where it does not make sense to upgrade to gulp 4 even if 
your resources allow for the refactor. gulp is essential to the 
<a href="http://fepper.io" target="_blank">Fepper frontend prototyper</a> 
because it enables extensibility. Fepper compiles templates and JSON data into 
HTML, like millions of other projects. And like millions of other projects, 
simply compiling markup does not require gulp or any other third-party task 
runner.

However, let's say _some_ users want to preprocess CSS with Stylus. Fepper could 
certainly have Stylus hard-coded in. But then, _all_ users would be _forced_ to 
use it. With that in mind, the decision was made early on to leave CSS 
preprocessing (as well as many many other tasks) up to end-users.

Fepper enables this extensibility by giving users the ability to declare 
extension tasks. These, in turn, are declared as optional dependencies to 
core tasks.

gulpfile.js:

```javascript
gulp.task('default', [
  'core', // abstracted for demonstration purposes
  'extensions'
]);
```

extensions.js:

```javascript
gulp.task('extensions', [
  'extension:foo',
  'extension:bar'
]);
```

extension-foo.js:

```javascript
gulp.task('extension:foo',
  // define task
);
```

extension-bar.js:

```javascript

gulp.task('extension:bar',
  // define task
);
```

To make this work, `extensions.js` must be user-editable and kept out of the 
project core's version control. In this way, updates to core will not overwrite 
user customizations.

Additionally, adding or removing extensions is as simple as adding or removing 
their string names from the array submitted as the 2nd argument to `gulp.task()` 
in `extensions.js`.

This is where compatibility breaks most severely with gulp 4. gulp 4 discourages 
the naming of tasks with strings and it does not recognize the submission of an 
array of tasks as the 2nd argument to `gulp.task()`.

### Suggestions

If you know of a simpler (and possibly better) way of achieving this 
extensibility, [please comment](https://github.com/electric-eloquence/gulp/issues) 
as to what it may be.
