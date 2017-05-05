'use strict';

const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const del = require('del');

const bundleBuilder = require('gulp-bem-bundle-builder');
const bundlerFs = require('gulp-bem-bundler-fs');

const gulp = require('gulp');
const concat = require('gulp-concat');
const debug = require('gulp-debug');
const flatten = require('gulp-flatten');
const gulpIf = require('gulp-if');
const imagemin = require('gulp-imagemin');
const include = require('gulp-include');
const notify = require('gulp-notify');
const nunjucks = require('gulp-nunjucks-html');
const posthtml = require('gulp-posthtml');
const sourcemaps = require('gulp-sourcemaps');
const typograf = require('gulp-typograf');
const uglify = require('gulp-uglify');

const postcss = require('gulp-postcss');
const postcssImport = require('postcss-import');
const postcssFor = require('postcss-for');
const postcssSimpleVars = require('postcss-simple-vars');
const postcssCalc = require('postcss-calc');
const postcssNested = require('postcss-nested');
const postcssColorFunction = require('postcss-color-function');
const postcssUrl = require('postcss-url');
const autoprefixer = require('autoprefixer');
const postcssReporter = require('postcss-reporter');
const csso = require('gulp-csso');

const browserSync = require('browser-sync').create();

/*
gulp bemBuild [--path static/catalog] [--prod]
gulp bemWatch [--path static/catalog] [--prod]
*/

// Configs
// const ROOT = process.cwd();
const CWD = argv.path || '';
const PROD = argv.prod || false;
const CONFIG = require(path.resolve(CWD, 'config.js'));

// BEM Builder
const builder = bundleBuilder(CONFIG.builder);

// BEM Tasks
// Styles
gulp.task('bemCss', function() {
  return bundlerFs(path.resolve(CWD, CONFIG.bundles) + '/*')
    .pipe(builder({
      css: bundle => bundle.src('css')
        .pipe(gulpIf(!PROD, sourcemaps.init()))
        .pipe(postcss([
          postcssImport(),
          postcssFor,
          postcssSimpleVars(),
          postcssCalc(),
          postcssNested,
          postcssColorFunction,
          postcssUrl({
            url: PROD ? 'inline' : 'copy'
          }),
          autoprefixer(),
          postcssReporter()
        ], {
          to: path.resolve(CWD, CONFIG.bundles, bundle.name, bundle.name + '.css'),
        })).on('error', notify.onError(function(err) {
          return {
            title: 'PostCSS',
            message: err.message,
            sound: 'Blow'
          };
        }))
        .pipe(concat(bundle.name + '.css'))
        .pipe(gulpIf(!PROD, sourcemaps.write('.')))
        .pipe(gulpIf(PROD, csso()))
        .pipe(gulp.dest(path.resolve(CWD, CONFIG.bundles, bundle.name)))
    }));
});

// Images
gulp.task('bemImage', function() {
  return bundlerFs(path.resolve(CWD, CONFIG.bundles) + '/*')
    .pipe(builder({
      image: bundle => bundle.src('image')
        .pipe(gulpIf(PROD, imagemin()))
        .pipe(flatten())
        .pipe(gulp.dest(path.resolve(CWD, CONFIG.bundles, bundle.name)))
    }));
});

// Clean bundles
gulp.task('cleanBundles', function() {
  return del([
    path.resolve(CWD, CONFIG.bundles) + '/*/*',
    '!' + path.resolve(CWD, CONFIG.bundles) + '/*/*.bemdecl.js'
  ]);
});

// Build bundles
gulp.task('bemBuild', gulp.series(
  'cleanBundles',
  gulp.parallel('bemCss', 'bemImage')
));

// Watcher
gulp.task('bemWatcher', function() {
  gulp.watch(
    path.resolve(CWD, CONFIG.bundles) + '/**/*.bemdecl.js',
    gulp.parallel('bemCss', 'bemImage')
  );

  gulp.watch(
    getWatchLayers(CONFIG.builder.levels, '/**/*.deps.js', CWD),
    gulp.parallel('bemCss', 'bemImage')
  );

  gulp.watch(
    getWatchLayers(CONFIG.builder.levels, '/**/*.+(' + getTechs(CONFIG.builder.techMap.css) + ')', CWD),
    gulp.series('bemCss')
  );

  gulp.watch(
    getWatchLayers(CONFIG.builder.levels, '/**/*.+(' + getTechs(CONFIG.builder.techMap.image) + ')', CWD),
    gulp.parallel('bemImage', 'bemCss')
  );
});

// Utils
function getWatchLayers(levels, techGlob, cwd) {
  var str = [];
  levels.forEach(function(item, i , arr) {
    str[i] = path.resolve(cwd, item) + techGlob;
  });

  return str;
}

function getTechs(techs) {
  var str = techs.map(function(name) {
    return name;
  });
  return str.join('|');
}

// Build
gulp.task('bemWatch', gulp.series('bemBuild', 'bemWatcher'));

gulp.task('default', function(cb) {
  // console.log('');
  cb();
});
