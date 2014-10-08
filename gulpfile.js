// 'use strict';

var gulp = require('gulp');
var gulpRename = require('gulp-rename');
// var gulpNotify = require('gulp-notify');
var gulpInclude = require('gulp-file-include');
var gulpTap = require('gulp-tap');
var gulpAutoprefixer = require('gulp-autoprefixer');
var gulpMinifyCss = require('gulp-minify-css');
var gulpUglify = require('gulp-uglify');
var gulpLess = require('gulp-less');
var gulpJade = require('gulp-jade');
var gulpDataUri = require('gulp-data-uri');
var gulpTemplate = require('gulp-template');
var gulpConcat = require('gulp-concat');
var jsStringEscape = require('js-string-escape');


var lazypipe = require('lazypipe');
var config = require('./config/config');

// Wrap file in js var named after filename
function varWrap (file) {
  var regex = /^.*\/(.*)\.(.*)$/;
  var filename = file.path.match(regex)[1];
  var extension = file.path.match(regex)[2];
  extension = (extension) ? '_' + extension : '' ; // prefix extension if it exists

  file.contents = Buffer.concat([
    new Buffer('var ' + filename + extension + ' = \''),
    new Buffer(jsStringEscape(file.contents)),
    new Buffer('\';')
  ]);
}

// Wrap file in module.export
function moduleWrap (file) {
  file.contents = Buffer.concat([
    new Buffer('module.exports = \''),
    new Buffer(jsStringEscape(file.contents)),
    new Buffer('\';')
  ]);
}

var lazyLess = lazypipe() // dry
  .pipe(gulpLess, { paths: ['/assets/less'] })
  .pipe(gulpAutoprefixer, 'last 5 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4')
  .pipe(gulpDataUri)
  .pipe(gulpMinifyCss);


// SHARED
gulp.task('shared-js', function () {
  return gulp.src(['assets/js/shared/**/*'])
    .pipe(gulpTemplate({url: config.url, version: config.bookmarklet_version}))
    .pipe(gulp.dest('incremental/shared'));
});


// STATIC PAGES
gulp.task('static-html', function () {
  return gulp.src(['assets/templates/static/*.jade'])
    .pipe(gulpJade())
    .pipe(gulp.dest('static'));
});


// DEMO JS
gulp.task('demo-js', function () {
  return gulp.src('assets/js/demo/index.js')
    .pipe(gulpInclude('// = '))
    // .pipe(gulpUglify())
    .pipe(gulpRename('demo.js'))
    .pipe(gulp.dest('static/dist'));
    // .pipe(gulpNotify({ message: 'demo-js task complete' }));
});


// CHROME BOILERPLATE
gulp.task('chrome-js', function () {
  return gulp.src(['assets/js/chrome/**/*'])
    .pipe(gulpTemplate({url: config.url, version: config.bookmarklet_version}))
    .pipe(gulp.dest('loader/chrome'));
});


// IFRAME LOADER
gulp.task('loader-js', function () {
  return gulp.src(['assets/js/loader/**/*.js', 'assets/js/shared/**/*.js'])
    .pipe(gulpTemplate({url: config.url, version: config.bookmarklet_version})) // Add magic numbers like url etc.
    .pipe(gulp.dest('incremental/loader'));
    // .pipe(gulpNotify({ message: 'loader-js task complete' }));
});

gulp.task('loader-styles', function () {
  return gulp.src('assets/less/loader.less')
    .pipe(lazyLess())
    .pipe(gulpRename('style.css'))
    .pipe(gulpTap(varWrap))
    .pipe(gulp.dest('incremental/loader'));
    // .pipe(gulpNotify({ message: 'loader-styles task complete' }));
});

gulp.task('loader-incremental', function () {
  return gulp.src(['incremental/loader/index.js'])
    .pipe(gulpInclude('// = '))
    // .pipe(gulpUglify())
    .pipe(gulpRename('content_script.js'))
    .pipe(gulp.dest('loader/chrome'))
    .pipe(gulpRename('bookmarklet.js'))
    .pipe(gulpTap(moduleWrap))
    .pipe(gulp.dest('loader/bookmarklet'));
    // .pipe(gulpNotify({ message: 'loader-incremental task complete' }));
});



// IFRAME CONTENTS
gulp.task('iframe-styles', function () {
  return gulp.src('assets/less/iframe.less')
    .pipe(lazyLess())
    .pipe(gulpRename('iframe.css'))
    .pipe(gulp.dest('static/dist'));
    // .pipe(gulpNotify({ message: 'iframe-styles task complete' }));
});

gulp.task('iframe-js', function () {
  return gulp.src(['incremental/shared/config.js', 'assets/js/iframe/vendor/lodash.custom.js', 'assets/js/iframe/vendor/vue.0.10.4.js', 'assets/js/iframe/app.js'])
    .pipe(gulpConcat('iframe.js'))
    .pipe(gulp.dest('static/dist'));
    // .pipe(gulpNotify({ message: 'iframe-js task complete' }));
});

//// WATCH
gulp.task('watch', function () {
  gulp.watch('assets/less/**', ['iframe-styles', 'loader-styles']);
  gulp.watch('assets/js/**', ['chrome-js', 'shared-js', 'iframe-js', 'loader-js']);
  gulp.watch('assets/images/**', ['iframe-images']);
  gulp.watch('assets/templates/static/**', ['static-html']);
  gulp.watch('assets/js/demo/**', ['demo-js']);

  gulp.watch('incremental/loader/**', ['loader-incremental']);
});

// BUILD
gulp.task('build', [
  'shared-js',
  'demo-js',
  'chrome-js',
  'iframe-js',
  'iframe-styles',
  'loader-styles',
  'loader-js',
  'loader-incremental',
  'static-html'
]);