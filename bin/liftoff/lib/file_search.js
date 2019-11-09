'use strict';

var fs = require('fs');
var path = require('path');

// Recurse up the directory tree to find the parent directory of a given file.
function findup(filename, workDir) {
  var workDirFiles = fs.readdirSync(workDir);

  if (workDirFiles.indexOf(filename) > -1) {
    return workDir;
  }

  // Need to work with the operating system's path separators, so use Node path methods.
  var workDirUp = path.normalize(path.join(workDir, '..'));
  var workDirUpFiles = fs.readdirSync(workDirUp);
  var dirMatch = '';

  // Return the found directory if filename has been found.
  if (workDirUpFiles.indexOf(filename) > -1) {
    return workDirUp;
  }
  // Return empty string if reached end-of-the-line.
  else if (
    workDirUp === '/' ||
    /^[A-Z]:\\$/.test(workDirUp) ||
    workDirUp.slice(0, 2) === '\\\\'
  ) {
    return '';
  }
  // Otherwise, keep trying.
  else {
    dirMatch = findup(filename, workDirUp);
  }

  return dirMatch;
}

module.exports = function(filename, workPaths) {
  var workDir;
  var len = workPaths.length;
  for (var i = 0; i < len; i++) {
    if (workDir) {
      break;
    } else {
      workDir = findup(filename, path.dirname(workPaths[i]));
    }
  }
  return path.join(workDir, filename);
};
