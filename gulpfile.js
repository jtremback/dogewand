'use strict';

var gulp = require('gulp');
var gulpRename = require('gulp-rename');
var gulpNotify = require('gulp-notify');
var gulpInclude = require('gulp-include');
var gulpTap = require('gulp-tap');
var gulpAutoprefixer = require('gulp-autoprefixer');
var gulpStylus = require('gulp-stylus');
var gulpMinifyCss = require('gulp-minify-css');
// var gulpMinifyHtml = require('gulp-htmlmin');
var gulpJade = require('gulp-jade');
var gulpDataUri = require('gulp-data-uri');

var lazypipe = require('lazypipe');

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

var stylus = lazypipe()
  .pipe(gulpStylus)
  .pipe(gulpAutoprefixer, 'last 5 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4')
  .pipe(gulpDataUri)
  .pipe(gulpMinifyCss);


//// PREPROCESS
gulp.task('extension-styles', function () {
  return gulp.src('assets/stylus/extension.styl')
    .pipe(stylus())
    .pipe(gulpRename('style.css'))
    .pipe(gulpTap(varWrap))
    .pipe(gulp.dest('extension/incremental'))
    .pipe(gulpNotify({ message: 'extension-styles task complete' }));
});

gulp.task('site-styles', function () {
  return gulp.src('assets/stylus/extension.styl')
    .pipe(stylus())
    .pipe(gulpRename('style.css'))
    .pipe(gulp.dest('extension/incremental'))
    .pipe(gulpNotify({ message: 'site-styles task complete' }));
});

gulp.task('extension-html', function () {
  return gulp.src('assets/templates/extension/**/*.jade')
    .pipe(gulpJade())
    .pipe(gulpTap(varWrap))
    .pipe(gulp.dest('extension/incremental'))
    .pipe(gulpNotify({ message: 'extension-html task complete' }));
});

gulp.task('extension-js', function () {
  return gulp.src(['assets/js/extension/**/*.js', 'assets/js/shared/**/*.js'])
    .pipe(gulp.dest('extension/incremental'))
    .pipe(gulpNotify({ message: 'extension-js task complete' }));
});

gulp.task('site-js', function () {
  return gulp.src(['assets/js/extension/**/*.js', 'assets/js/shared/**/*.js'])
    .pipe(gulp.dest('extension/incremental'))
    .pipe(gulpNotify({ message: 'site-js task complete' }));
});


//// COMBINE
gulp.task('extension-incremental', function () {
  return gulp.src('extension/incremental/index.js')
    .pipe(gulpInclude())
    .pipe(gulpRename('content_script.js'))
    .pipe(gulp.dest('extension/chrome'))
    .pipe(gulpRename('bookmarklet.js'))
    .pipe(gulp.dest('extension/bookmarklet'))
    .pipe(gulpRename('app.js'))
    .pipe(gulp.dest('public/js'))
    .pipe(gulpNotify({ message: 'extension-incremental task complete' }));
});



//// WATCH
gulp.task('watch', function () {
  gulp.watch('assets/templates/extension/**', ['extension-html']);
  gulp.watch('assets/stylus/**', ['extension-styles']);
  gulp.watch('assets/js/extension/**', ['extension-js']);

  gulp.watch('extension/incremental/**', ['extension-incremental']);
});

// Build
gulp.task('build', ['extension-html', 'extension-js', 'extension-styles', 'extension-incremental']);