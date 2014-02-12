'use strict';

// Load plugins
var gulp = require('gulp'),
  // gulpStylus = require('gulp-stylus'),
  // gulpAutoprefixer = require('gulp-autoprefixer'),
  // gulpMinifycss = require('gulp-minify-css'),
  gulpJshint = require('gulp-jshint'),
  gulpRename = require('gulp-rename'),
  gulpNotify = require('gulp-notify'),
  gulpLivereload = require('gulp-livereload'),
  gulpBrowserify = require('gulp-browserify'),
  gulpClean = require('gulp-clean'),
  lr = require('tiny-lr'),
  server = lr();

// // Styles
// gulp.task('styles', function() {
//   return gulp.src('assets/stylus/style.styl')
//     .pipe(stylus())
//     .pipe(autoprefixer('last 5 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
//     .pipe(gulp.dest('public/css'))
//     .pipe(rename({ suffix: '.min' }))
//     .pipe(minifycss())
//     .pipe(livereload(server))
//     .pipe(gulp.dest('public/css'))
//     .pipe(notify({ message: 'Styles task complete' }));
// });


gulp.task('chrome-extension-js', function() {
  // Clean dist
  gulp.src(['extension/chrome/dist/*'])
    .pipe(gulpClean());

  // Compile index.js
  return gulp.src('extension/chrome/src/content_script/index.js', { read: false }) // read: false for browserify
    .pipe(gulpJshint('.jshintrc'))
    .pipe(gulpJshint.reporter('jshint-stylish'))
    .pipe(gulpBrowserify({
      transform: ['./my_modules/stylify-autoprefix', './my_modules/wrapify'],
      extensions: ['.styl', '.html'],
      debug: true
    }))
    .pipe(gulpRename('content_script.js'))
    .pipe(gulp.dest('extension/chrome/dist'))
    .pipe(gulpLivereload(server));
});


gulp.task('chrome-extension', ['chrome-extension-js'], function() {
  // Copy files in root
  return gulp.src(['extension/chrome/src/*.*'])
    .pipe(gulp.dest('extension/chrome/dist'))
    .pipe(gulpNotify({ message: 'Extension js complete' }));
});
 

// Watch
gulp.task('watch', function() {
 
  // Listen on port 35729
  server.listen(35729, function (err) {
    if (err) {
      return console.log(err);
    }

    gulp.watch('extension/chrome/src/**/*', ['chrome-extension']);

  });
});