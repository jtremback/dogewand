'use strict';

// Load plugins
var gulp = require('gulp'),
  // sass = require('gulp-ruby-sass'),
  stylus = require('gulp-stylus'),
  autoprefixer = require('gulp-autoprefixer'),
  minifycss = require('gulp-minify-css'),
  sweetjs = require('gulp-sweetjs'),
  jshint = require('gulp-jshint'),
  uglify = require('gulp-uglify'),
  imagemin = require('gulp-imagemin'),
  rename = require('gulp-rename'),
  clean = require('gulp-clean'),
  concat = require('gulp-concat'),
  notify = require('gulp-notify'),
  cache = require('gulp-cache'),
  livereload = require('gulp-livereload'),
  lr = require('tiny-lr'),
  server = lr();

// does a bunch of js shit including sweet 
function sweet (src, target, dest) {
  return gulp.src(src)
    .pipe(concat(target))
    .pipe(sweetjs())
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(gulp.dest(dest))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify({outSourceMaps: true}))
    .pipe(livereload(server))
    .pipe(gulp.dest(dest))
    .pipe(notify({ message: 'Scripts task complete' }));
}

// straight up copy
function copy (src, dest) {
  return gulp.src(src)
    .pipe(gulp.dest(dest));
}


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
 
// Scripts
gulp.task('scripts', function() {
  return gulp.src(['assets/js/macros.jsw', 'assets/js/templates.jswt', 'assets/js/presenters.jsw'])
    .pipe(concat('bookmarklet.js'))
    .pipe(sweetjs())
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(gulp.dest('public/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify({outSourceMaps: true}))
    .pipe(livereload(server))
    .pipe(gulp.dest('public/js'))
    .pipe(notify({ message: 'Scripts task complete' }));
});

// Prepares files for chrome extension
gulp.task('chrome_ext', function() {
  sweet(
    ['extension/chrome/src/background/macros.js', 'extension/chrome/src/background/background.js'],
    'background.js',
    'extension/chrome/dist');

  copy('extension/chrome/src/*.*', 'extension/chrome/dist');
});

// Images
gulp.task('images', function() {
  return gulp.src('assets/img/*')
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(livereload(server))
    .pipe(gulp.dest('public/img'))
    .pipe(notify({ message: 'Images task complete' }));
});
 
// Clean
gulp.task('clean', function() {
  return gulp.src(['public/css', 'public/js', 'public/img', 'extension/chrome/dist'], {read: false})
    .pipe(clean());
});
 
// Listen
gulp.task('reload', function () {
  return gulp.src('app/*')
    .pipe(livereload(server));
});

// Default task
gulp.task('default', ['clean'], function() {
   gulp.start('images', 'styles', 'scripts', 'chrome_ext');
});
 
// Watch
gulp.task('watch', function() {
 
  // Listen on port 35729
  server.listen(35729, function (err) {
    if (err) {
      return console.log(err);
    }

    gulp.watch('assets/stylus/*', ['styles']);

    gulp.watch('assets/js/*', ['scripts']);
 
    gulp.watch('assets/img/*', ['images']);
 
    gulp.watch('extension/chrome/src/**/*', ['chrome_ext']);

    gulp.watch('app/views/*', ['reload']);
  });
});