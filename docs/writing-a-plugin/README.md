# Writing a plugin

If you plan to create your own Gulp plugin, you will save time by reading the 
full documentation.

* [Guidelines](guidelines.md) (a MUST read)
* [Using buffers](using-buffers.md)
* [Dealing with streams](dealing-with-streams.md)
* [Testing](testing.md)

## What it does

### Streaming file objects

A gulp plugin always returns a stream in 
[object mode](https://nodejs.org/api/stream.html#stream_object_mode) that does 
the following:

1. Takes in [Vinyl file objects](https://github.com/gulpjs/vinyl)
2. Outputs [Vinyl file objects](https://github.com/gulpjs/vinyl) (via 
   `transform.push()` and/or the plugin's callback function) 

These are known as 
[transform streams](https://nodejs.org/api/stream.html#stream_class_stream_transform) 
(also sometimes called through streams). Transform streams are streams that are 
readable and writable; they manipulate objects as they're being passed through.

All gulp plugins essentially boil down to this:

```javascript
var Transform = require('stream').Transform;

module.exports = function() {
  // Monkey patch Transform or create your own subclass, 
  // implementing `_transform()` and optionally `_flush()`.
  var transformStream = new Transform({ objectMode: true });
  /**
   * @param {Buffer|string} file
   * @param {string=} encoding - ignored if file contains a Buffer
   * @param {function(Error, object)} callback - Call this function (optionally with an 
   *          error argument and data) when you are done processing the supplied chunk.
   */
  transformStream._transform = function(file, encoding, callback) {
    var error = null, 
        output = doSomethingWithTheFile(file);
    callback(error, output);
  };
  
  return transformStream;
};
```

Many plugins use the [through2](https://github.com/rvagg/through2) module to 
simplify their code:

```javascript
var through = require('through2'); // npm install --save through2

module.exports = function() {
  return through.obj(function(file, encoding, callback) {
    callback(null, doSomethingWithTheFile(file));
  });
};
```

The stream returned from `through()` (and `this` within your transform function) 
is an instance of the 
[Transform](https://github.com/nodejs/readable-stream/blob/master/lib/_stream_transform.js)
class, which extends 
[Duplex](https://github.com/nodejs/readable-stream/blob/master/lib/_stream_duplex.js),
[Readable](https://github.com/nodejs/readable-stream/blob/master/lib/_stream_readable.js)
(and parasitically from Writable) and ultimately 
[Stream](https://nodejs.org/api/stream.html). If you need to parse additional 
options, you can call the `through()` function directly:

```javascript
return through({ objectMode: true /* other options... */ }, function(file, encoding, callback) { ...
```
 
Supported options include:

* highWaterMark (defaults to 16)
* defaultEncoding (defaults to 'utf8')
* encoding - 'utf8', 'base64', 'utf16le', 'ucs2' etc. If specified, a 
  [StringDecoder](https://nodejs.org/api/string_decoder.html) 
  `decoder` will be attached to the stream.
* readable {boolean}
* writable {boolean}
* allowHalfOpen {boolean} If set to false, then the stream will automatically 
  end the readable side when the writable side ends and vice versa.

### Modifying file content

The function parameter that you pass to `through.obj()` is a 
[\_transform](https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback)
function which will operate on the input `file`.  You may also provide an optional 
[\_flush](https://nodejs.org/api/stream.html#stream_transform_flush_callback)
function if you need to emit a bit more data at the end of the stream.

From within your transform function call `this.push(file)` 0 or more times to 
pass along transformed/cloned files. You don't need to call `this.push(file)` 
if you provide all output to the `callback()` function.

Call the `callback` function only when the current file (stream/buffer) is 
completely consumed. If an error is encountered, pass it as the first argument 
to the callback, otherwise set it to null. If you have passed all output data to 
`this.push()` you can omit the second argument to the callback.

Generally, a gulp plugin would update `file.contents` and then choose to either:

* call `callback(null, file)` 

_or_ 

* make one call to `this.push(file)`
 
If a plugin creates multiple files from a single input file, it would make 
multiple calls to `this.push()` - eg:

```javascript
module.exports = function() {
  /**
   * @this {Transform}
   */
  var transform = function(file, encoding, callback) {
    var files = splitFile(file);
    this.push(files[0]);
    this.push(files[1]);                              
    callback();
  }; 
   
  return through.obj(transform);
};
```

The [gulp-unzip](https://github.com/terrierscript/gulp-unzip/blob/master/index.js) 
plugin provides a good example of making multiple calls to `push()`. It also 
uses a chunk transform stream with a `_flush()` function _within_ the Vinyl 
transform function.

Vinyl files can have 3 possible forms for the contents attribute:

* [Streams](dealing-with-streams.md)
* [Buffers](using-buffers.md)
* Empty (null) - Useful for things like rimraf, clean, where contents is not 
  needed.

A simple example showing how to detect & handle each form is provided below, for 
a more detailed explanation of each approach follow the links above.

```javascript
var PLUGIN_NAME = 'gulp-example';

module.exports = function() {
  return through.obj(function(file, encoding, callback) {
    if (file.isNull()) {
      // Return empty file.
      return callback(null, file);
    }

    if (file.isStream()) {
      // file.contents is a Stream - https://nodejs.org/api/stream.html
      this.emit('error', new Error(PLUGIN_NAME + ': Streams not supported!'));
      
      // Or, if you can handle Streams:
      //file.contents = file.contents.pipe(...
      //return callback(null, file);
    } else if (file.isBuffer()) {
      // file.contents is a Buffer - https://nodejs.org/api/buffer.html
      this.emit('error', new Error(PLUGIN_NAME + ': Buffers not supported!'));
  
      // Or, if you can handle Buffers:
      //file.contents = ...
      //return callback(null, file);
    }
  });
};
```

Note: When looking through the code of other gulp plugins (and the example 
above), you may notice that the transform functions will return the result of 
the callback:

```javascript
return callback(null, file);
```

...don't be confused - gulp ignores any return value of your transform function. 
The code above is simply a short-hand form of:

```javascript
if (someCondition) {
  callback(null, file);
  return;
}
// further execution...
```

## Sample plugins

* [sindresorhus' gulp plugins](https://github.com/search?q=%40sindresorhus+gulp-)
* [gulpjs's gulp plugins](https://github.com/search?q=%40gulpjs+gulp-)
* [gulp-replace](https://github.com/lazd/gulp-replace)


## About streams

If you're unfamiliar with streams, you will need to read up on them:

* https://github.com/substack/stream-handbook (a MUST read)
* https://nodejs.org/api/stream.html

Other libraries that are not file manipulating through streams but are made for 
use with gulp are tagged with the 
[gulpfriendly](https://www.npmjs.com/search?q=keywords:gulpfriendly) keyword on 
npm.
