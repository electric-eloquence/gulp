# Testing

> Testing your plugin is the only way to ensure quality. It brings confidence to 
  your users and makes your life easier.

[Writing a Plugin](README.md) > Testing

## Tooling

The following examples use Node's native `assert` library.

Most plugins probably use [mocha](https://github.com/mochajs/mocha),
[chai](https://github.com/chaijs/chai),
[should](https://github.com/shouldjs/should.js),
and other well-known tools to help them test. 

## Testing plugins for streaming mode

```javascript
var assert = require('assert');
var Stream = require('stream');
var File = require('vinyl');
var prefixer = require('../');

describe('gulp-prefixer', function() {
  describe('in streaming mode', function() {
    it('should prepend text', function(done) {

      // Create the readable stream.
      var readable = new Stream.Readable();

      // Create the fake file.
      var fakeFile = new File({
        contents: readable
      });

      // Create a prefixer plugin stream.
      var myPrefixer = prefixer('prependthis');

      // Write the fake file to it.
      myPrefixer.write(fakeFile);

      // Create the listener to wait for the stream and then assert.
      myPrefixer.once('data', function(file) {
        // Make sure the Vinyl file object is a stream.
        assert(file.isStream());

        // Concatenate the chunks of the stream.
        var data = '';
        file.contents.on('data', function(chunk) {
          data += chunk.toString();
        });
        file.contents.on('end', function() {
          // Check the contents.
          assert.equal(data, 'prependthisstreamwiththosecontents');
          done();
        });
      });

      // Fill the stream.
      var items = ['stream', 'with', 'those', 'contents'];
      items.forEach(function(item) { readable.push(item); });
      readable.push(null);
    });
  });
});
```

## Testing plugins for buffer mode

```javascript
var assert = require('assert');
var File = require('vinyl');
var prefixer = require('../');

describe('gulp-prefixer', function() {
  describe('in buffer mode', function() {
    it('should prepend text', function(done) {

      // Create the fake file.
      var fakeFile = new File({
        contents: new Buffer('abufferwiththiscontent')
      });

      // Create a prefixer plugin stream.
      var myPrefixer = prefixer('prependthis');

      // Write the fake file to it.
      myPrefixer.write(fakeFile);

      // Wait for the file to come back out.
      myPrefixer.once('data', function(file) {
        // Make sure it came out the same way it went in.
        assert(file.isBuffer());

        // Check the contents.
        assert.equal(file.contents.toString('utf8'), 'prependthisabufferwiththiscontent');
        done();
      });
    });
  });
});
```
