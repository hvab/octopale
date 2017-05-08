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
const sourcemaps = require('gulp-sourcemaps');

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

/*
gulp bemBuild [--path static/catalog] [--prod]
gulp bemWatch [--path static/catalog] [--prod]
*/

// Configs
const CWD = argv.path || '';
const PROD = argv.prod || false;
const CONFIG = require(path.resolve(CWD, 'config.js'));
const packageJson = require(path.resolve('./', 'package.json'));
const BROWSERSLIST = CONFIG.browserslist || packageJson.browserslist;
const BUNDLES = 'bundles';

// BEM Builder
const builder = bundleBuilder({
  levels: CONFIG.levels,
  techMap: {
    css: ['post.css', 'css'],
    image: ['jpg', 'png', 'svg']
  }
});

// BEM Tasks
// Styles
gulp.task('bemCss', function() {
  return bundlerFs(path.resolve(CWD, BUNDLES) + '/*')
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
          autoprefixer({browsers: BROWSERSLIST}),
          postcssReporter()
        ], {
          to: path.resolve(CWD, BUNDLES, bundle.name, bundle.name + '.css'),
        }))
        .pipe(concat(bundle.name + '.css'))
        .pipe(gulpIf(!PROD, sourcemaps.write('.')))
        .pipe(gulpIf(PROD, csso()))
        .pipe(gulp.dest(path.resolve(CWD, BUNDLES, bundle.name)))
        .pipe(debug({title: 'bemCss:'}))
    }));
});

// Images
gulp.task('bemImage', function() {
  return bundlerFs(path.resolve(CWD, BUNDLES) + '/*')
    .pipe(builder({
      image: bundle => bundle.src('image')
        .pipe(gulpIf(PROD, imagemin()))
        .pipe(flatten())
        .pipe(gulp.dest(path.resolve(CWD, BUNDLES, bundle.name)))
        .pipe(debug({title: 'bemImage:'}))
    }));
});

// Clean bundles
gulp.task('cleanBundles', function() {
  return del([
    path.resolve(CWD, BUNDLES) + '/*/*',
    '!' + path.resolve(CWD, BUNDLES) + '/*/*.bemdecl.js'
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
    path.resolve(CWD, BUNDLES) + '/**/*.bemdecl.js',
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
