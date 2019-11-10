'use strict';

var fs = require('fs');
var path = require('path');

// Recurse up the directory tree to find the parent directory of a given file.
function findup(filenames_, workPath_) {
  var filenames = Array.isArray(filenames_) ? filenames_ : [filenames_];
  var workPath = path.resolve(workPath_);

  for (var i = 0; i < filenames.length; i++) {
    var filename = filenames[i];
    var workDir;

    try {
      if (fs.statSync(workPath).isDirectory()) {
        workDir = workPath;
      } else {
        workDir = path.dirname(workPath);
      }
    } catch (e) {
      return null;
    }

    var j;
    var workDirFiles = fs.readdirSync(workDir);
    var filenameLower = filename.toLowerCase();

    for (j = 0; j < workDirFiles.length; j++) {
      if (workDirFiles[j].toLowerCase() === filenameLower) {
        return { dir: workDir, file: filename };
      }
    }

    // Need to work with the operating system's path separators, so use Node path methods.
    var workDirUp = path.normalize(path.join(workDir, '..'));
    var workDirUpFiles = fs.readdirSync(workDirUp);

    // Return the found directory if filename has been found.
    for (j = 0; j < workDirUpFiles.length; j++) {
      if (workDirUpFiles[j].toLowerCase() === filenameLower) {
        return { dir: workDirUp, file: filename };
      }
    }

    var dirMatch;

    // Return null if reached end-of-the-line.
    if (
      workDirUp === '/' ||
      /^[A-Z]:\\$/.test(workDirUp) ||
      workDirUp.slice(0, 2) === '\\\\'
    ) {
      return null;
    } else { // Otherwise, keep trying.
      var result = findup(filename, workDirUp);

      if (result) {
        dirMatch = result.dir;
      } else {
        return null;
      }
    }

    return { dir: dirMatch, file: filename };
  }
}

module.exports = function(filenames, workPaths) {
  var result;

  for (var i = 0; i < workPaths.length; i++) {
    if (result) {
      break;
    } else {
      result = findup(filenames, workPaths[i]);
    }
  }

  if (result && result.dir && result.file) {
    return path.join(result.dir, result.file);
  } else {
    return null;
  }
};
