'use strict';

var gulp = require('gulp');
var gulpRename = require('gulp-rename');
var gulpNotify = require('gulp-notify');
var gulpInclude = require('gulp-file-include');
var gulpTap = require('gulp-tap');
var gulpAutoprefixer = require('gulp-autoprefixer');
var gulpStylus = require('gulp-stylus');
var gulpMinifyCss = require('gulp-minify-css');
// var gulpMinifyHtml = require('gulp-htmlmin');
var gulpLess = require('gulp-less');
var gulpJade = require('gulp-jade');
var gulpDataUri = require('gulp-data-uri');
var gulpTemplate = require('gulp-template');
var gulpConcat = require('gulp-concat');


var lazypipe = require('lazypipe');
var config = require('./config/config')();

// Wrap file in js var named after filename
function varWrap (file) {
  var regex = /^.*\/(.*)\.(.*)$/;
  var filename = file.path.match(regex)[1];
  var extension = file.path.match(regex)[2];
  extension = (extension) ? '_' + extension : '' ; // prefix extension if it exists

  file.contents = Buffer.concat([
    new Buffer('var ' + filename + extension + ' = \''),
    file.contents,
    new Buffer('\';')
  ]);
}

// var lazyStylus = lazypipe() // dry
//   .pipe(gulpStylus)
//   .pipe(gulpAutoprefixer, 'last 5 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4')
//   .pipe(gulpDataUri)
//   .pipe(gulpMinifyCss);

var lazyLess = lazypipe() // dry
  .pipe(gulpLess, { paths: ['/assets/less'] })
  .pipe(gulpAutoprefixer, 'last 5 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4')
  .pipe(gulpDataUri)
  .pipe(gulpMinifyCss);



// IFRAME LOADER
gulp.task('loader-js', function () {
  return gulp.src(['assets/js/loader/**/*.js', 'assets/js/shared/**/*.js'])
    .pipe(gulpTemplate({url: config.url})) // Add magic numbers like url etc.
    .pipe(gulp.dest('incremental/loader'))
    .pipe(gulpNotify({ message: 'loader-js task complete' }));
});

gulp.task('loader-styles', function () {
  return gulp.src('assets/less/loader.less')
    .pipe(lazyLess())
    .pipe(gulpRename('style.css'))
    .pipe(gulpTap(varWrap))
    .pipe(gulp.dest('incremental/loader'))
    .pipe(gulpNotify({ message: 'loader-styles task complete' }));
});

gulp.task('loader-incremental', function () {
  return gulp.src('incremental/loader/index.js')
    .pipe(gulpInclude())
    .pipe(gulpRename('content_script.js'))
    .pipe(gulp.dest('loader/chrome'))
    .pipe(gulpRename('bookmarklet.js'))
    .pipe(gulp.dest('loader/bookmarklet'))
    .pipe(gulpNotify({ message: 'loader-incremental task complete' }));
});



// IFRAME CONTENTS
gulp.task('iframe-styles', function () {
  return gulp.src('assets/less/iframe.less')
    .pipe(lazyLess())
    .pipe(gulpRename('iframe.css'))
    .pipe(gulp.dest('public/css')) // Put into public folder for good caching
    .pipe(gulpNotify({ message: 'iframe-styles task complete' }));
});

gulp.task('iframe-html', function () {
  return gulp.src('assets/templates/iframe/**/*.jade')
    .pipe(gulpJade())
    .pipe(gulp.dest('public/iframe'))
    .pipe(gulpNotify({ message: 'iframe-html task complete' }));
});

gulp.task('iframe-js', function () {
  return gulp.src(['assets/js/iframe/vue.0.10.4.js', 'assets/js/iframe/app.js'])
    .pipe(gulpTemplate({url: config.url})) // Add magic numbers like url etc.
    // .pipe(gulpInclude('@@'))
    .pipe(gulpConcat('iframe.js'))
    .pipe(gulp.dest('public/js'))
    .pipe(gulpNotify({ message: 'iframe-js task complete' }));
});

//// WATCH
gulp.task('watch', function () {
  gulp.watch('assets/templates/iframe/**', ['iframe-html']);
  gulp.watch('assets/less/**', ['iframe-styles', 'loader-styles']);
  gulp.watch('assets/js/**', ['iframe-js', 'loader-js']);

  gulp.watch('incremental/loader/**', ['loader-incremental']);
});

// BUILD
gulp.task('build', ['iframe-js', 'iframe-html', 'iframe-styles', 'loader-styles', 'loader-js']);