#!/usr/bin/env node
'use strict';
var meow = require('meow');
var app = require('./');
var chalk = require('chalk');
var fs = require('fs');

var cli = meow({
  help: [
    'Usage',
    ' sass-theme <filePath> <themeID> --apikey',
    ' sass-theme <filePath> --colors'
  ].join('\n')
});

var opts = cli.flags;
var args = cli.input;
var cmd = args[0];
var api = {
  theme: '',
  filePath: '',
  themeName: 'Colors'
};

api.names = require('./colors');

api.init = function() {
  this.theme = args[1];
  this.filePath = args[0];

  if (!this.filePath) {
    console.log(chalk.red('No file path specified. Run `--help`'));
    return;
  }

  var passThrough = 0;
  var swatches = [];

  if (opts.colors) {
    passThrough = 1;
  }

  if (!passThrough) {

    if (!opts.apikey) {
      console.log(chalk.red('Adobe sucks. Specify an API Key.'));
      return;
    }

    if (!this.theme) {
      console.log(chalk.red('No theme ID specified. Run `--help`'));
      return;
    };

    var request = require('request');
    var url = 'https://color.adobe.com/api/v2/themes/' + this.theme + '?filter=public&metadata=all&x-api-key=' + opts.apikey;
    request(url, function(err, response, body) {
      if (err) { throw err; }

      body = JSON.parse(body);
      api.themeName = body.name;
      swatches = body.swatches;
      api.processColors(swatches);
    });
  } else {
    var cols = opts.colors.split(',');
    for (var i = 0; i < cols.length; i++) {
      swatches[i] = {
        hex: cols[i].replace('#', '')
      };
    }
    api.processColors(swatches);
  }
}

/**
 * Based heavily on http://chir.ag/projects/name-that-color
 */
api.processColors = function(swatches) {
  var swatchArr = [];
  var color, rgb, hsl;
  var blah;
  for (var i = 0; i < api.names.length; i++) {
    color = "#" + api.names[i][0];
    rgb = api.rgb(color);
    hsl = api.hsl(color);
    api.names[i].push(rgb[0], rgb[1], rgb[2], hsl[0], hsl[1], hsl[2]);
  }

  for (var i = 0; i < swatches.length; i++) {
    swatchArr[i] = api.name(swatches[i].hex);
  }

  api.writeTheme(swatchArr);
};

api.writeTheme = function(swatchArr) {
  var txt = '//-----------------------------------------------------------------------\n';
      txt += '//  ' + this.themeName + '\n';
      txt += '//-----------------------------------------------------------------------\n';

  for (var i = 0; i < swatchArr.length; i++) {
    if (isEmpty(swatchArr[i])) { continue; }
    txt += '$' + swatchArr[i].machineName + ': ' + swatchArr[i].hex.toLowerCase() + ';\n';
  };
  txt += '\n\n';

  fs.appendFile(this.filePath, txt, function (err) {
    if (err) { throw err; }
    console.log(chalk.green('Added `' + api.themeName + '` to ' + api.filePath));
  });
};

api.name = function(color) {
  color = color.toUpperCase();

  if(color.length < 3 || color.length > 7) {
    return {};
  }

  if(color.length % 3 == 0) {
    color = "#" + color;
  }

  if(color.length == 4) {
    color = "#" + color.substr(1, 1) + color.substr(1, 1) + color.substr(2, 1) + color.substr(2, 1) + color.substr(3, 1) + color.substr(3, 1);
  }

  var rgb = this.rgb(color);
  var r = rgb[0], g = rgb[1], b = rgb[2];
  var hsl = this.hsl(color);
  var h = hsl[0], s = hsl[1], l = hsl[2];
  var ndf1 = 0, ndf2 = 0, ndf = 0;
  var cl = -1, df = -1;

  for (var i = 0; i < this.names.length; i++) {
    if (color == "#" + this.names[i][0]) {
      return {
        hex: "#" + this.names[i][0],
        name: this.names[i][1],
        machineName: this.names[i][1].toLowerCase().replace(/\s/g, '-'),
        exactMatch: true
      };
    }

    ndf1 = Math.pow(r - this.names[i][2], 2) + Math.pow(g - this.names[i][3], 2) + Math.pow(b - this.names[i][4], 2);
    ndf2 = Math.pow(h - this.names[i][5], 2) + Math.pow(s - this.names[i][6], 2) + Math.pow(l - this.names[i][7], 2);
    ndf = ndf1 + ndf2 * 2;
    if (df < 0 || df > ndf) {
      df = ndf;
      cl = i;
    }
  }

  return (cl < 0 ? {} : {
    hex: "#" + this.names[cl][0],
    name: this.names[cl][1],
    machineName: this.names[cl][1].toLowerCase().replace(/\s/g, '-'),
    exactMatch: false
  });
};

api.hsl = function(color) {
  var rgb = [parseInt('0x' + color.substring(1, 3)) / 255, parseInt('0x' + color.substring(3, 5)) / 255, parseInt('0x' + color.substring(5, 7)) / 255];
  var min, max, delta, h, s, l;
  var r = rgb[0], g = rgb[1], b = rgb[2];

  min = Math.min(r, Math.min(g, b));
  max = Math.max(r, Math.max(g, b));
  delta = max - min;
  l = (min + max) / 2;

  s = 0;
  if (l > 0 && l < 1) {
    s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));
  }

  h = 0;
  if (delta > 0) {
    if (max == r && max != g) h += (g - b) / delta;
    if (max == g && max != b) h += (2 + (b - r) / delta);
    if (max == b && max != r) h += (4 + (r - g) / delta);
    h /= 6;
  }
  return [parseInt(h * 255), parseInt(s * 255), parseInt(l * 255)];
};

api.rgb = function(color) {
  return [parseInt('0x' + color.substring(1, 3)), parseInt('0x' + color.substring(3, 5)),  parseInt('0x' + color.substring(5, 7))];
};


//http://stackoverflow.com/questions/4994201/is-object-empty
// Speed up calls to hasOwnProperty
var hasOwnProperty = Object.prototype.hasOwnProperty;
function isEmpty(obj) {
  // null and undefined are "empty"
  if (obj == null) return true;

  // Assume if it has a length property with a non-zero value
  // that that property is correct.
  if (obj.length > 0)    return false;
  if (obj.length === 0)  return true;

  // Otherwise, does it have any properties of its own?
  // Note that this doesn't handle
  // toString and valueOf enumeration bugs in IE < 9
  for (var key in obj) {
    if (hasOwnProperty.call(obj, key)) return false;
  }

  return true;
}

api.init();
