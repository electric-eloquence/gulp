'use strict';

var exec = require('child_process').exec;
var path = require('path');

var resolve = require('resolve');
var should = require('should');
var sinon = require('sinon');

var NAME = 'mocha';
var NODE_PATH = process.env.NODE_PATH;

describe('Liftoff', function() {
  var Liftoff = require('../bin/liftoff');
  var app = new Liftoff({
    processTitle: NAME,
    configName: NAME + 'file',
    moduleName: NAME,
    searchPaths: ['test/fixtures/search_path']
  });

  this.timeout(3000);

  afterEach(function() {
    process.env.NODE_PATH = NODE_PATH;
  });

  describe('buildEnvironment()', function() {
    it('locates local module using cwd if no config is found', function() {
      var test = new Liftoff({ name: 'should' });
      var cwd = 'explicit/cwd';
      var spy = sinon.spy(resolve, 'sync');
      // NODE_PATH might be defined.
      delete process.env.NODE_PATH;
      test.buildEnvironment({ cwd: cwd });
      should(spy.calledWith('should', { basedir: path.join(process.cwd(), cwd), paths: [] })).be.true;
      spy.restore();
    });

    it('locates global module using NODE_PATH if defined', function() {
      var test = new Liftoff({ name: 'dummy' });
      var cwd = 'explicit/cwd';
      var spy = sinon.spy(resolve, 'sync');
      process.env.NODE_PATH = path.join(process.cwd(), cwd);
      test.buildEnvironment();
      should(spy.calledWith('dummy', { basedir: process.cwd(), paths: [path.join(process.cwd(), cwd)] })).be.true;
      spy.restore();
    });

    it('does not use search_paths if cwd is explicitly provided', function() {
      should(app.buildEnvironment({ cwd: './' }).configPath).equal(null);
    });

    it('finds module in the directory next to config', function() {
      should(app.buildEnvironment().modulePath).equal(path.resolve('node_modules/mocha/index.js'));
    });

    it('requires the package sibling to the module', function() {
      should(app.buildEnvironment().modulePackage).equal(require('../node_modules/mocha/package.json'));
    });

    it('sets cwd to match the directory of the config file as long as cwd wasn\'t explicitly provided', function() {
      should(app.buildEnvironment().cwd).equal(path.resolve('test/fixtures/search_path'));
    });

    describe('for developing against yourself', function() {
      it('finds and loads package.json', function(done) {
        var fixturesDir = path.resolve(__dirname, 'fixtures');
        var cwd = path.resolve(fixturesDir, 'developing_yourself');

        exec('cd ' + cwd + ' && node main.js', cb);
        function cb(err, stdout, stderr) {
          should(err).equal(null);
          should(stderr).equal('');
          var fp = path.resolve(cwd, 'package.json');
          should(stdout).equal(
            JSON.stringify(require(fp)) + '\n' +
            path.resolve(cwd, 'main.js') + '\n' +
            cwd + '\n'
          );
          done();
        }
      });

      it('clears modulePackage if package.json is of different project', function(done) {
        var fixturesDir = path.resolve(__dirname, 'fixtures');
        var cwd = path.resolve(fixturesDir, 'developing_yourself/app1');

        exec('cd ' + cwd + ' && node index.js', cb);
        function cb(err, stdout, stderr) {
          should(err).equal(null);
          should(stderr).equal('');
          should(stdout).equal(
            '{}\n' +
            'undefined\n' +
            cwd + '\n'
          );
          done();
        }
      });

      it('uses `index.js` if `main` property in package.json does not exist', function(done) {
        var fixturesDir = path.resolve(__dirname, 'fixtures');
        var cwd = path.resolve(fixturesDir, 'developing_yourself/app2');

        exec('cd test/fixtures/developing_yourself/app2 && node index.js', cb);
        function cb(err, stdout, stderr) {
          should(err).equal(null);
          should(stderr).equal('');
          var fp = './fixtures/developing_yourself/app2/package.json';
          should(stdout).equal(
            JSON.stringify(require(fp)) + '\n' +
            path.resolve(cwd, 'index.js') + '\n' +
            cwd + '\n'
          );
          done();
        }
      });
    });
  });

  describe('prepare()', function() {
    it('sets the process.title to the moduleName', function() {
      app.prepare({}, function() {});
      should(process.title).equal(app.moduleName);
    });

    it('returns early if completions are available and requested', function(done) {
      var test = new Liftoff({
        name: 'whatever',
        completions: function() {
          done();
        }
      });
      test.prepare({ completion: true }, function() {});
    });

    it('calls prepare with liftoff instance as context', function(done) {
      app.prepare({}, function() {
        should(this).equal(app);
        done();
      });
    });

    it('passes environment to first argument of prepare callback', function(done) {
      app.prepare({}, function(env) {
        should(env).deepEqual(app.buildEnvironment());
        done();
      });
    });

    it('throws if 2nd arg is not a function', function() {
      should(function() {
        app.prepare({});
      }).throw();
    });
  });


  describe('execute()', function() {
    it('passes environment to first argument of execute callback', function(done) {
      var testEnv = app.buildEnvironment();
      app.execute(testEnv, function(env) {
        should(env).deepEqual(testEnv);
        done();
      });
    });

    it('throws if 2nd arg is not a function', function() {
      should(function() {
        app.execute({});
      }).throw();
    });

    it('skips respawning if process.argv has no values from v8flags in it', function(done) {
      exec('node test/fixtures/prepare-execute/v8flags.js', function(err, stdout, stderr) {
        should(stderr).equal('\n');
        exec('node test/fixtures/prepare-execute/v8flags_function.js', function(err, stdout, stderr) {
          should(stderr).equal('\n');
          done();
        });
      });
    });

    it('throws if v8flags is a function and it causes an error', function(done) {
      exec('node test/fixtures/prepare-execute/v8flags_error.js --lazy', function(err, stdout, stderr) {
        should(err).not.equal(null);
        should(stdout).equal('');
        should(stderr).containEql('v8flags error!');
        done();
      });
    });

    it('respawns if v8flag is set by forcedFlags', function(done) {
      exec('node test/fixtures/prepare-execute/v8flags_config.js 123', cb);

      function cb(err, stdout, stderr) {
        should(err).equal(null);
        should(stderr).equal([
          path.resolve('test/fixtures/prepare-execute/v8flags_config.js'),
          '123'
        ].join(' ') + '\n');
        should(stdout).equal('saw respawn [ \'--lazy\' ]\n');
        done();
      }
    });

    it('respawns if v8flag is set by both cli flag and forcedFlags', function(done) {
      exec('node test/fixtures/prepare-execute/v8flags_config.js 123 --harmony abc', cb);

      function cb(err, stdout, stderr) {
        should(err).equal(null);
        should(stderr).equal([
          path.resolve('test/fixtures/prepare-execute/v8flags_config.js'),
          '123',
          'abc'
        ].join(' ') + '\n');
        should(stdout).equal('saw respawn [ \'--lazy\', \'--harmony\' ]\n');
        done();
      }
    });

    it('emits a respawn event if a respawn is required', function(done) {
      exec('node test/fixtures/prepare-execute/v8flags.js', function(err, stdout) {
        should(stdout).be.empty;
        exec('node test/fixtures/prepare-execute/v8flags_function.js --lazy', function(err, stdout) {
          should(stdout).equal('saw respawn\n');
          done();
        });
      });
    });

    it('respawns if process.argv has v8flags with values in it', function(done) {
      exec('node test/fixtures/prepare-execute/v8flags_value.js --stack_size=2048', function(err, stdout, stderr) {
        should(stderr).equal('--stack_size=2048\n');
        done();
      });
    });

    it('respawns if v8flags is empty but forcedFlags are specified', function(done) {
      exec('node test/fixtures/prepare-execute/nodeflags_only.js 123', cb);

      function cb(err, stdout, stderr) {
        should(err).equal(null);
        should(stderr).equal([
          path.resolve('test/fixtures/prepare-execute/nodeflags_only.js'),
          '123'
        ].join(' ') + '\n');
        should(stdout).equal('saw respawn [ \'--lazy\' ]\n');
        done();
      }
    });
  });

  describe('requireLocal()', function() {
    it('attempts pre-loading local modules but fails', function(done) {
      var app = new Liftoff({ name: 'test' });
      var logs = [];
      app.on('require', function() {
        done();
      });
      app.on('requireFail', function(moduleName, err) {
        should(moduleName).equal('badmodule');
        should(err).not.equal(null);
        logs.push('requireFail');
      });
      app.prepare({ require: 'badmodule' }, function(env) {
        app.execute(env, function(env) {
          should(env.require).deepEqual(['badmodule']);
          should(logs).deepEqual(['requireFail']);
          done();
        });
      });
    });

    it('pre-loads a local module only once even if it is respawned', function(done) {
      var fixturesDir = path.resolve(__dirname, 'fixtures');

      exec('cd ' + fixturesDir + ' && node respawn_and_require.js', cb);
      function cb(err, stdout, stderr) {
        should(err).equal(null);
        should(stderr).equal('');
        should(stdout).equal(
          'saw respawn [ \'--lazy\' ]\n' +
          'execute\n' +
        '');
        done();
      }
    });

    it('emits `require` with the name of the module and the required module', function(done) {
      var requireTest = new Liftoff({ name: 'require' });
      requireTest.on('require', function(name, module) {
        should(name).equal('mocha');
        should(module).equal(require('mocha'));
        done();
      });
      requireTest.requireLocal('mocha', __dirname);
    });

    it('emits `requireFail` with an error if a module can\'t be found.', function(done) {
      var requireFailTest = new Liftoff({ name: 'requireFail' });
      requireFailTest.on('requireFail', function(name) {
        should(name).equal('badmodule');
        done();
      });
      requireFailTest.requireLocal('badmodule', __dirname);
    });

  });

  describe('configFiles', function() {
    it('is empty if not specified', function(done) {
      var app = new Liftoff({
        name: 'myapp'
      });
      app.prepare({}, function(env) {
        should(env.configFiles).deepEqual({});
        done();
      });
    });

    it('finds multiple files if specified', function(done) {
      var app = new Liftoff({
        name: 'myapp',
        configFiles: {
          index: {
            currentdir: '.',
            test: {
              path: 'test/fixtures/configfiles'
            }
          },
          package: {
            currentdir: '.',
            test: {
              path: 'test/fixtures/configfiles'
            }
          }
        }
      });
      app.prepare({}, function(env) {
        should(env.configFiles).deepEqual({
          index: {
            currentdir: path.resolve('./index.js'),
            test: path.resolve('./test/fixtures/configfiles/index.json')
          },
          package: {
            currentdir: path.resolve('./package.json'),
            test: null
          }
        });
        done();
      });
    });

    it('uses default cwd if not specified', function(done) {
      var app = new Liftoff({
        name: 'myapp',
        configFiles: {
          index: {
            cwd: {
              path: '.',
              extensions: ['.js', '.json']
            }
          }
        }
      });
      app.prepare({
        cwd: 'test/fixtures/configfiles'
      }, function(env) {
        should(env.configFiles).deepEqual({
          index: {
            cwd: path.resolve('./test/fixtures/configfiles/index.json')
          }
        });
        done();
      });
    });

    it('uses default extensions if not specified', function(done) {
      var app = new Liftoff({
        extensions: { '.md': null },
        name: 'myapp',
        configFiles: {
          README: {
            markdown: {
              path: 'test/fixtures/configfiles'
            },
            markdown2: {
              path: '.',
              extensions: ['.json', '.js']
            },
            text: {
              path: 'test/fixtures/configfiles',
              extensions: ['.json', '.js']
            }
          }
        }
      });
      app.prepare({}, function(env) {
        should(env.configFiles).deepEqual({
          README: {
            markdown: path.resolve('./test/fixtures/configfiles/README.md'),
            markdown2: null,
            text: null
          }
        });
        done();
      });
    });
  });

  describe('buildConfigName()', function() {
    var buildConfigName = require('../bin/liftoff/lib/build_config_name');

    it('throws if no configName is provided', function() {
      should(function() { buildConfigName(); }).throw();
    });

    it('uses configName directly if it is a regex', function() {
      var configNameSearch = /mocha/;
      should(buildConfigName({ configName: configNameSearch })).deepEqual([configNameSearch]);
    });

    it('throws if no array of extensions are provided and config is not a regex already', function() {
      should(function() { buildConfigName({ configName: 'foo' });}).throw();
      should(function() { buildConfigName({ configName: 'foo', extensions: '?' }); }).throw();
      should(function() { buildConfigName({ configName: 'foo', extensions: ['.js'] }); }).not.throw();
    });

    it('builds an array of possible config names', function() {
      var multiExtension = buildConfigName({ configName: 'foo', extensions: ['.js', '.coffee'] });
      should(multiExtension).deepEqual(['foo.js', 'foo.coffee']);
      var singleExtension = buildConfigName({ configName: 'foo', extensions: ['.js'] });
      should(singleExtension).deepEqual(['foo.js']);
    });

    it('throws error if opts is null or empty', function() {
      should(function() {
        buildConfigName();
      }).throw();
      should(function() {
        buildConfigName(null);
      }).throw();
      should(function() {
        buildConfigName({});
      }).throw();
    });

    it('throws error if .configName is null', function() {
      should(function() {
        buildConfigName({ extensions: ['.js'] });
      }).throw();
    });

    it('throws error if .extension is not an array', function() {
      should(function() {
        buildConfigName({ configName: 'foo' });
      }).throw();
      should(function() {
        buildConfigName({ configName: 'foo', extensions: null });
      }).throw();
      should(function() {
        buildConfigName({ configName: 'foo', extensions: '.js' });
      }).throw();
    });
  });

  describe('fileSearch()', function() {
    var fileSearch = require('../bin/liftoff/lib/file_search');

    it('locates a file using findup from an array of possible base paths', function() {
      should(fileSearch('mochafile.js', ['../../'])).be.null;
      should(fileSearch('package.json', [process.cwd()])).equal(path.resolve(__dirname, '..', 'package.json'));
    });


    it('recursively locates a file using findup through nested directories', function() {
      should(fileSearch('package.json', [path.join(__dirname, 'fixtures')]))
        .equal(path.resolve(__dirname, '..', 'package.json'));
    });
  });

  describe('findConfig()', function() {
    var findConfig = require('../bin/liftoff/lib/find_config');

    it('throws if searchPaths or configNameRegex are empty when configName isn\'t explicltly provided', function() {
      should(function() { findConfig(); }).throw();
      should(function() { findConfig({ searchPaths: ['../'] }); }).throw();
      should(function() { findConfig({ configNameRegex: 'dude' }); }).throw();
    });

    it('if configPath is explicitly provided, return the absolute path to the file or null if it doesn\'t actually exist\
  ', function() {
      var configPath = path.resolve('test/fixtures/mochafile.js');
      should(findConfig({ configPath: configPath })).equal(configPath);
      should(findConfig({ configPath: 'path/to/nowhere' })).equal(null);
    });

    it('returns the absolute path to the first config file found in searchPaths', function() {
      should(findConfig({
        configNameSearch: ['mochafile.js', 'mochafile.coffee'],
        searchPaths: ['test/fixtures']
      })).equal(path.resolve('test/fixtures/mochafile.js'));
      should(findConfig({
        configNameSearch: ['mochafile.js', 'mochafile.coffee'],
        searchPaths: ['test/fixtures/search_path', 'test/fixtures/coffee']
      })).equal(path.resolve('test/fixtures/search_path/mochafile.js'));
      should(findConfig({
        configNameSearch: 'mochafile.js',
        searchPaths: ['test/fixtures/search_path', 'test/fixtures/coffee']
      })).equal(path.resolve('test/fixtures/search_path/mochafile.js'));
    });

    it('throws error if .searchPaths is not an array', function() {
      should(function() {
        findConfig({
          configNameSearch: ['mochafile.js', 'mochafile.coffee']
        });
      }).throw();
      should(function() {
        findConfig({
          configNameSearch: ['mochafile.js', 'mochafile.coffee'],
          searchPaths: null
        });
      }).throw();
      should(function() {
        findConfig({
          configNameSearch: ['mochafile.js', 'mochafile.coffee'],
          searchPaths: 'test/fixtures/search_path'
        });
      }).throw();
    });

    it('throws error if .configNameSearch is null', function() {
      should(function() {
        findConfig({
          searchPaths: ['test/fixtures/search_path', 'test/fixtures/coffee']
        });
      }).throw();
      should(function() {
        findConfig({
          configNameSearch: null,
          searchPaths: ['test/fixtures/search_path', 'test/fixtures/coffee']
        });
      }).throw();
      should(function() {
        findConfig({
          configNameSearch: '',
          searchPaths: ['test/fixtures/search_path', 'test/fixtures/coffee']
        });
      }).throw();
    });

    it('throws error if opts is null or empty', function() {
      should(function() {
        findConfig();
      }).throw();
      should(function() {
        findConfig(null);
      }).throw();
      should(function() {
        findConfig({});
      }).throw();
    });
  });

  describe('findCwd()', function() {
    var findCwd = require('../bin/liftoff/lib/find_cwd');

    it('returns process.cwd if no options are passed', function() {
      should(findCwd()).equal(process.cwd());
    });

    it('returns path from cwd if supplied', function() {
      should(findCwd({ cwd: '../' })).equal(path.resolve('../'));
    });

    it('returns directory of config if configPath defined', function() {
      should(findCwd({ configPath: 'test/fixtures/mochafile.js' })).equal(path.resolve('test/fixtures'));
    });

    it('returns path from cwd if both it and configPath are defined', function() {
      should(findCwd({ cwd: '../', configPath: 'test/fixtures/mochafile.js' })).equal(path.resolve('../'));
    });

    it('ignores cwd if it isn\'t a string', function() {
      should(findCwd({ cwd: true })).equal(process.cwd());
    });

    it('ignores configPath if it isn\'t a string', function() {
      should(findCwd({ configPath: true })).equal(process.cwd());
    });
  });

  describe('getNodeFlags', function() {
    var getNodeFlags = require('../bin/liftoff/lib/get_node_flags');

    describe('arrayOrFunction', function() {
      it('returns the first argument when it is an array', function() {
        var env = { cwd: 'aaa' };
        should(getNodeFlags.arrayOrFunction([], env)).be.empty();
        should(getNodeFlags.arrayOrFunction(['--lazy', '--use_strict', '--harmony'], env))
          .containDeep(['--lazy', '--harmony', '--use_strict']);

      });

      it('returns the exection result of the first argument when it is a function', function() {
        var env = { cwd: 'aaa' };
        should(getNodeFlags.arrayOrFunction(function() {
          return [];
        }, env)).be.empty();
        should(getNodeFlags.arrayOrFunction(function(arg) {
          should(arg).equal(env);
          return ['--lazy', '--harmony'];
        }, env)).containDeep(['--lazy', '--harmony']);
      });

      it('returns an array which has an element of the first argument when the first argument is a string', function() {
        var env = { cwd: 'aaa' };
        should(getNodeFlags.arrayOrFunction('--lazy', env)).containDeep(['--lazy']);
      });

      it('returns an empty array when the first argument is neither an array, a function nor a string', function() {
        var env = { cwd: 'aaa' };
        should(getNodeFlags.arrayOrFunction(void 0, env)).be.empty();
        should(getNodeFlags.arrayOrFunction(null, env)).be.empty();
        should(getNodeFlags.arrayOrFunction(true, env)).be.empty();
        should(getNodeFlags.arrayOrFunction(false, env)).be.empty();
        should(getNodeFlags.arrayOrFunction(0, env)).be.empty();
        should(getNodeFlags.arrayOrFunction(123, env)).be.empty();
        should(getNodeFlags.arrayOrFunction({}, env)).be.empty();
        should(getNodeFlags.arrayOrFunction({ length: 1 }, env)).be.empty();
      });
    });

    describe('fromReorderedArgv', function() {
      it('returns only node flags from respawning arguments', function() {
        var env = { cwd: 'aaa' };
        var cmd = ['node', '--lazy', '--harmony', '--use_strict', './aaa/bbb/app.js', '--ccc', 'ddd', '-e', 'fff'];
        should(getNodeFlags.fromReorderedArgv(cmd, env)).deepEqual(['--lazy', '--harmony', '--use_strict']);
      });

      it('ends node flags before "--"', function() {
        var env = { cwd: 'aaa' };
        var cmd = ['node', '--lazy', '--', '--harmony', '--use_strict', './aaa/bbb/app.js', '--ccc', 'ddd', '-e', 'fff'];
        should(getNodeFlags.fromReorderedArgv(cmd, env)).deepEqual(['--lazy']);

      });

      it('returns node flags when arguments are only node flags', function() {
        var env = { cwd: 'aaa' };
        var cmd = ['node', '--lazy', '--harmony', '--use_strict'];
        should(getNodeFlags.fromReorderedArgv(cmd, env)).deepEqual(['--lazy', '--harmony', '--use_strict']);
      });

      it('returns an empty array when no node flags', function() {
        var env = { cwd: 'aaa' };
        var cmd = ['node', './aaa/bbb/app.js', '--aaa', 'bbb', '-c', 'd'];
        should(getNodeFlags.fromReorderedArgv(cmd, env)).deepEqual([]);
      });
    });
  });

  describe('parseOptions()', function() {
    var parseOptions = require('../bin/liftoff/lib/parse_options');

    it('auto-sets processTitle, moduleName, & configFile if `name` is provided.', function() {
      var opts = parseOptions({ name: NAME });
      should(opts.processTitle).equal(NAME);
      should(opts.configName).equal(NAME + 'file');
      should(opts.moduleName).equal(NAME);
    });

    it('sets a title to be used for the process at launch', function() {
      var opts = parseOptions({ name: NAME });
      should(opts.processTitle).equal(NAME);
      should(function() {
        parseOptions();
      }).throw('You must specify a processTitle.');
    });

    it('sets the configuration file to look for at launch', function() {
      var opts = parseOptions({ name: NAME });
      should(opts.configName).equal(NAME + 'file');
      should(function() {
        parseOptions({ processTitle: NAME });
      }).throw('You must specify a configName.');
    });

    it('sets a local module to resolve at launch', function() {
      var opts = parseOptions({ name: NAME });
      should(opts.moduleName).equal(NAME);
    });

    it('uses .processTitle/.configName/.moduleName preferencially', function() {
      var opts = parseOptions({
        name: 'a',
        processTitle: 'b',
        configName: 'c',
        moduleName: 'd'
      });
      should(opts.processTitle).equal('b');
      should(opts.configName).equal('c');
      should(opts.moduleName).equal('d');
    });

    it('throws error if opts does not have .name and .moduleName', function() {
      should(function() {
        parseOptions({
          processTitle: 'a',
          configName: 'b'
        });
      }).throw();
    });

    it('throws error if opts is null or empty', function() {
      should(function() { parseOptions(null); }).throw();
      should(function() { parseOptions(void 0); }).throw();
      should(function() { parseOptions({}); }).throw();
    });
  });

  describe('silentRequire()', function() {
    var silentRequire = require('../bin/liftoff/lib/silent_require');

    it('requires a file', function() {
      should(silentRequire(path.resolve('./package'))).deepEqual(require('../package'));
    });

    it('does not throw if file is not found', function() {
      should(function() {
        silentRequire('path/to/nowhere');
      }).not.throw();
    });
  });
});
