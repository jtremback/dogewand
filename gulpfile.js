'use strict';

var gulp = require('gulp');
var gulpRename = require('gulp-rename');
var gulpNotify = require('gulp-notify');
var gulpInclude = require('gulp-include');
var gulpTap = require('gulp-tap');
var gulpAutoprefixer = require('gulp-autoprefixer');
var gulpStylus = require('gulp-stylus');
var gulpMinifyCss = require('gulp-minify-css');
var gulpMinifyHtml = require('gulp-htmlmin');
var gulpDataUri = require('gulp-data-uri');

// Wrap file in js var named after filename
function varWrap (file) {
  var regex = /^.*\/(.*)\.(.*)$/;
  var filename = file.path.match(regex)[1];
  var extension = file.path.match(regex)[2];
  file.contents = Buffer.concat([
    new Buffer('var ' + filename + '_' + extension + ' = \''),
    file.contents,
    new Buffer('\';')
  ]);
}

//// PREPROCESS
gulp.task('bundle-styles', function () {
  return gulp.src('assets/stylus/extension.styl')
    .pipe(gulpStylus())
    .pipe(gulpAutoprefixer('last 5 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulpDataUri())
    .pipe(gulpMinifyCss())
    .pipe(gulpRename('style.css'))
    .pipe(gulpTap(varWrap))
    .pipe(gulp.dest('extension/bundle/incremental'))
    .pipe(gulpNotify({ message: 'Styles task complete' }));
});

gulp.task('bundle-html', function () {
  return gulp.src('extension/bundle/html/*.html')
    .pipe(gulpMinifyHtml({collapseWhitespace: true}))
    .pipe(gulpTap(varWrap))
    .pipe(gulp.dest('extension/bundle/incremental'))
    .pipe(gulpNotify({ message: 'HTML task complete' }));
});

gulp.task('bundle-js', function () {
  return gulp.src('extension/bundle/*.js')
    .pipe(gulp.dest('extension/bundle/incremental'))
    .pipe(gulpNotify({ message: 'JS task complete' }));
});

//// COMBINE
gulp.task('bundle-incremental', function () {
  return gulp.src('extension/bundle/incremental/index.js')
    .pipe(gulpInclude())
    .pipe(gulpRename('content_script.js'))
    .pipe(gulp.dest('extension/chrome'))
    .pipe(gulpRename('bookmarklet.js'))
    .pipe(gulp.dest('extension/bookmarklet'))
    .pipe(gulpRename('app.js'))
    .pipe(gulp.dest('public/js'))
    .pipe(gulpNotify({ message: 'Incremental task complete' }));
});

// Watch
gulp.task('watch', function () {
  gulp.watch('extension/bundle/html/**', ['bundle-html']);
  gulp.watch('assets/stylus/**', ['bundle-styles']);
  gulp.watch('extension/bundle/*.js', ['bundle-js']);

  gulp.watch('extension/bundle/incremental/*.*', ['bundle-incremental']);
});

// Build
gulp.task('build', ['bundle-html', 'bundle-js', 'bundle-styles', 'bundle-incremental']);