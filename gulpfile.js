'use strict';

// Load plugins
var gulp = require('gulp'),
  stylus = require('gulp-stylus'),
  autoprefixer = require('gulp-autoprefixer'),
  minifycss = require('gulp-minify-css'),
  jshint = require('gulp-jshint'),
  rename = require('gulp-rename'),
  notify = require('gulp-notify'),
  livereload = require('gulp-livereload'),
  browserify = require('gulp-browserify'),
  clean = require('gulp-clean'),
  lr = require('tiny-lr'),
  server = lr();

// Styles
gulp.task('styles', function() {
  return gulp.src('assets/stylus/style.styl')
    .pipe(stylus())
    .pipe(autoprefixer('last 5 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('public/css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(livereload(server))
    .pipe(gulp.dest('public/css'))
    .pipe(notify({ message: 'Styles task complete' }));
});


gulp.task('chrome-extension-js', function() {
  // Clean dist
  gulp.src(['extension/chrome/dist/*'])
    .pipe(clean());

  // Compile index.js
  return gulp.src('extension/chrome/src/content_script/index.js', { read: false }) // read: false for browserify
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(browserify({
      transform: ['stylify', './my_modules/wrapify'],
      extensions: ['.styl', '.html']
    }))
    .pipe(rename('content_script.js'))
    .pipe(gulp.dest('extension/chrome/dist'))
    .pipe(livereload(server));
});


gulp.task('chrome-extension', ['chrome-extension-js'], function() {
  // Copy files in root
  return gulp.src(['extension/chrome/src/*.*'])
    .pipe(gulp.dest('extension/chrome/dist'))
    .pipe(notify({ message: 'Extension js complete' }));
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