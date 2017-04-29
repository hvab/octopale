'use strict';

const gulp = require('gulp');
const HubRegistry = require('gulp-hub');

const hub = new HubRegistry([
  './tasks/bem/gulpfile.js'
]);

gulp.registry(hub);
