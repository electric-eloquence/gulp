'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function(name) {
  if (typeof name !== 'string') {
    throw new Error('Missing completion type');
  }
  var file = path.join(__dirname, '../completion', name);
  try {
    // eslint-disable-next-line no-console
    console.log(fs.readFileSync(file, 'utf8'));
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(
      'echo "gulp autocompletion rules for',
      '\'' + name + '\'',
      'not found"'
    );
    // eslint-disable-next-line no-process-exit
    process.exit(5);
  }
};
