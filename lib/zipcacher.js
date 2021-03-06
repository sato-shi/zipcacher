/* global Promise, caches, fetch, Request, Response */
'use strict';

var CacheHelper = require('sw-cache-helper');

var JSZip = require('jszip');

var MIMEMAP = {
  'json': 'application/json',
  'js': 'application/javascript',
  'css': 'text/css',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'html': 'text/html'
};

function getFileMime(fileName) {
  var extension = fileName.substr(fileName.lastIndexOf('.') + 1);

  return MIMEMAP[extension] || 'text/plain';
}

function ZipCacher(url) {
  this.zip = url;
}

ZipCacher.prototype.onInstall = function (evt) {
  var self = this;
  return new Promise(function (resolve, reject) {
    try {
      fetch(self.zip).then(function (response) {
        CacheHelper.getDefaultCache().then(function (cache) {
          response = response.clone();
          response.arrayBuffer().then(function (body) {
            var zip = new JSZip(body);
            var promises = [];
            Object.keys(zip.files).forEach(function (fileName) {
              var zipEntry = zip.files[fileName];
              var mime = getFileMime(fileName);
              var body = zipEntry.options.binary ? zipEntry.asArrayBuffer() : zipEntry.asText();
              promises.push(cache.put(new Request(fileName), new Response(body, {
                'headers': {
                  'Content-Type': mime
                }
              })));
            });
            Promise.all(promises).then(resolve);
          });
        });
      });
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = ZipCacher;