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
gulp bemCss [--path static/catalog] [--prod]
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
gulp.task('buildBundles', gulp.series(
  'cleanBundles',
  gulp.parallel('bemCss', 'bemImage')
));

// gulp.task('bemJs', function() {
//   return bundlerFs('bundles/*')
//     .pipe(builder({
//       js: bundle => bundle.src('js')
//         .pipe(gulpIf(isDevelopment, sourcemaps.init()))
//         .pipe(include({
//           includePaths: [
//             __dirname + '/node_modules',
//             __dirname + '/.'
//           ]
//         }))
//         .pipe(concat(bundle.name + '.js'))
//         .pipe(gulpIf(isDevelopment, sourcemaps.write('.')))
//         .pipe(gulpIf(!isDevelopment, uglify()))
//     }))
//     .pipe(debug({title: 'bemJs:'}))
//     .pipe(gulp.dest(DEST));
// });
//
// gulp.task('buildHtml', function() {
//   return gulp.src('pages/**/*.html')
//     .pipe(nunjucks({
//       searchPaths: ['./']
//     })).on('error', notify.onError(function(err) {
//       return {
//         title: 'Nunjucks',
//         message: err.message,
//         sound: 'Blow'
//       };
//     }))
//     .pipe(typograf({
//       locale: ['ru', 'en-US'],
//       mode: 'digit'
//     }))
//     .pipe(gulpIf(!isDevelopment, posthtml([
//       require('posthtml-alt-always')(),
//       require('posthtml-minifier')({
//         removeComments: true,
//         collapseWhitespace: true,
//         minifyJS: true
//       })
//     ])))
//     .pipe(flatten())
//     .pipe(debug({title: 'buildHtml:'}))
//     .pipe(gulp.dest(DEST));
// });
//
// gulp.task('watch', function() {
//   gulp.watch([
//     'blocks/**/*.deps.js',
//     'bundles/**/*.bemdecl.js'
//   ], gulp.parallel('bemCss', 'bemJs', 'bemImage'));
//
//   gulp.watch([
//     'pages/**/*.html',
//     'templates/**/*.html'
//   ], gulp.series('buildHtml'));
//
//   gulp.watch('blocks/**/*.css', gulp.series('bemCss'));
//
//   gulp.watch([
//     'blocks/**/*.js',
//     '!blocks/**/*.deps.js'
//   ], gulp.series('bemJs'));
//
//   gulp.watch('blocks/**/*.+(png|jpg|svg)', gulp.parallel('bemCss','bemImage'));
// });
//
// gulp.task('serve', function() {
//   browserSync.init({
//     logPrefix: 'palecore',
//     server: DEST,
//     port: isDevelopment ? 3000 : 8080,
//     notify: false,
//     open: false,
//     ui: false,
//     tunnel: false,
//   });
//
//   browserSync.watch([
//     DEST+'/**/*.*',
//     '!'+DEST+'/**/*.+(css|css.map)'
//   ]).on('change', browserSync.reload);
//
//   browserSync.watch(DEST+'/**/*.css', function (event, file) {
//     if (event === 'change') {
//       browserSync.reload(DEST+'/**/*.css');
//     }
//   });
// });
//
// gulp.task('dev', gulp.series('build', gulp.parallel('watch', 'serve')));
// gulp.task('prod', gulp.series('build', 'serve'));
//
// gulp.task('default', gulp.series(isDevelopment ? 'dev' : 'prod'));

gulp.task('default', function(cb) {
  console.log(path.resolve(CWD, CONFIG.bundles));
  console.dir(PROD);

  cb();
});
