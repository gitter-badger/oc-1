'use strict';

var expect = require('chai').expect;
var injectr = require('injectr');
var path = require('path');
var sinon = require('sinon');
var _ = require('underscore');

var initialise = function(){

  var fsMock = {
    existsSync: sinon.stub(),
    lstatSync: sinon.stub(),
    mkdirSync: sinon.spy(),
    readdirSync: sinon.stub(),
    readFileSync: sinon.stub(),
    readJsonSync: sinon.stub(),
    writeFileSync: sinon.spy(),
    writeJsonSync: sinon.spy()
  };

  var Local = injectr('../../cli/domain/local.js', {
    'fs-extra': fsMock,
    'uglify-js': {
      minify: function(code){
        return {
          code: code
        };
      }
    },
    path: {
      extname: path.extname,
      join: path.join,
      resolve: function(){
        return _.toArray(arguments).join('/');
      }
    }
  }, { __dirname: '' });

  var local = new Local();

  return { local: local, fs: fsMock };
};

var executePackaging = function(local, callback){
  return local.package('.', callback);
};

var executeComponentsListingByDir = function(local, callback){
  return local.getComponentsByDir('.', callback);
};

describe('cli : domain : local', function(){

  describe('when packaging', function(){

    describe('when component is valid', function(){

      var component;
      beforeEach(function(done){

        var data = initialise();

        component = {
          name: 'helloworld',
          oc: {
            files: {
              template: {
                type: 'jade',
                src: ''
              }
            }
          },
          dependencies: {}
        };

        data.fs.existsSync.returns(true);
        data.fs.readFileSync.returns('');
        data.fs.readJsonSync.onCall(0).returns(component);
        data.fs.readJsonSync.onCall(1).returns({ version: '1.2.3' });

        executePackaging(data.local, done);
      });

      it('should add version to package.json file', function(){
        expect(component.oc.version).to.eql('1.2.3');
      });

      it('should mark the package.json as a packaged', function(){
        expect(component.oc.packaged).to.eql(true);
      });
    });

    describe('when component has a server.js logic', function(){

      describe('when component does not require any json', function(){

        var data,
            serverjs = 'module.exports.data=function(context,cb){return cb(null, {name:\'John\'}); };';

        beforeEach(function(done){

          data = initialise();
          var component = {
            name: 'component01',
            oc: {
              files: {
                template: {
                  type: 'jade',
                  src: 'template.jade'
                },
                data: 'server.js'
              }
            },
            dependencies: {}
          };

          data.fs.existsSync.returns(true);
          data.fs.readJsonSync.onCall(0).returns(component);
          data.fs.readJsonSync.onCall(1).returns({});
          data.fs.readFileSync.onCall(0).returns('div #{name}');
          data.fs.readFileSync.onCall(1).returns(serverjs);

          executePackaging(data.local, done);
        });

        it('should save compiled and minified view-model handler', function(){
          expect(data.fs.writeFileSync.args[1][1]).to.equal(serverjs);
        });
      });

      describe('when component requires a json', function(){

        var data,
            requiredJson = '{"hello":"world"}',
            serverjs = 'var data=require(\'./someJson\');module.exports.data=function(context,cb){return cb(null,data); };';

        beforeEach(function(done){
          data = initialise();

          var component = {
            name: 'component01',
            oc: {
              files: {
                template: {
                  type: 'jade',
                  src: 'template.jade'
                },
                data: 'server.js'
              }
            },
            dependencies: {}
          };

          data.fs.existsSync.returns(true);
          data.fs.readJsonSync.onCall(0).returns(component);
          data.fs.readJsonSync.onCall(1).returns({});
          data.fs.readFileSync.onCall(0).returns('div #{name}');
          data.fs.readFileSync.onCall(1).returns(serverjs);
          data.fs.readFileSync.onCall(2).returns(requiredJson);

          executePackaging(data.local, done);
        });

        it('should save compiled and minified view-model handler incapsulating json content', function(){
          var written = data.fs.writeFileSync.args[1][1];

          expect(written).to.contain(serverjs);
          expect(written).to.contain(requiredJson);
        });
      });

      describe('when component requires a module', function(){

        var data,
            error,
            serverjs = 'var data=require(\'request\');module.exports.data=function(context,cb){return cb(null,data); };';

        beforeEach(function(done){
          data = initialise();

          var component = {
            name: 'component01',
            oc: {
              files: {
                template: {
                  type: 'jade',
                  src: 'template.jade'
                },
                data: 'server.js'
              }
            },
            dependencies: {}
          };

          data.fs.existsSync.returns(true);
          data.fs.readJsonSync.onCall(0).returns(component);
          data.fs.readJsonSync.onCall(1).returns({});
          data.fs.readFileSync.onCall(0).returns('div #{name}');
          data.fs.readFileSync.onCall(1).returns(serverjs);

          executePackaging(data.local, function(err, res){
            error = err;
            done();
          });
        });

        it('should throw an error when the dependency is not present in the package.json', function(){
          expect(error).to.equal('Missing dependencies from package.json => ["request"]');
        });
      });

      describe('when component requires a js file', function(){

        var data,
            requiredJson = '{"hello":"world"}',
            serverjs = 'var data=require(\'./hi.js\');module.exports.data=function(context,cb){return cb(null,data); };',
            error;

        beforeEach(function(done){
          data = initialise();

          var component = {
            name: 'component01',
            oc: {
              files: {
                template: {
                  type: 'jade',
                  src: 'template.jade'
                },
                data: 'server.js'
              }
            },
            dependencies: {}
          };

          data.fs.existsSync.returns(true);
          data.fs.readJsonSync.onCall(0).returns(component);
          data.fs.readJsonSync.onCall(1).returns({});
          data.fs.readFileSync.onCall(0).returns('div #{name}');
          data.fs.readFileSync.onCall(1).returns(serverjs);

          executePackaging(data.local, function(err, res){
            error = err;
            done();
          });
        });

        it('should not package component and respond with error', function(){
          expect(error).to.equal('Requiring local js files is not allowed. Keep it small.');
        });
      });
    });
  });

  describe('when getting components from dir', function(){

    var error, result;
    beforeEach(function(done){

      var data = initialise();

      data.fs.readdirSync.onCall(0).returns([
        'a-component',
        'a-not-component-dir',
        'a-file.json',
        '_package'
      ]);

      data.fs.lstatSync.onCall(0).returns({ isDirectory: function(){ return true; }});
      data.fs.existsSync.onCall(0).returns(true);
      data.fs.readJsonSync.onCall(0).returns({ oc: {}});

      data.fs.lstatSync.onCall(1).returns({ isDirectory: function(){ return true; }});
      data.fs.existsSync.onCall(1).returns(false);

      data.fs.lstatSync.onCall(2).returns({ isDirectory: function(){ return false; }});

      data.fs.lstatSync.onCall(3).returns({ isDirectory: function(){ return true; }});
      data.fs.existsSync.onCall(2).returns(true);
      data.fs.readJsonSync.onCall(1).returns({ oc: { packaged: true }});

      executeComponentsListingByDir(data.local, function(err, res){
        error = err;
        result = res;
        done();
      });
    });

    it('should add version to package.json file', function(){
      expect(result).to.eql(['./a-component']);
    });
  });
});
