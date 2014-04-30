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
var gulpTemplate = require('gulp-template');

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

var lazyStylus = lazypipe() // dry
  .pipe(gulpStylus)
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
  return gulp.src('assets/stylus/loader.styl')
    .pipe(lazyStylus())
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
gulp.task('app-styles', function () {
  return gulp.src('assets/stylus/app.styl')
    .pipe(lazyStylus())
    .pipe(gulpRename('app.css'))
    .pipe(gulp.dest('public/css')) // Put into public folder for good caching
    .pipe(gulpNotify({ message: 'app-styles task complete' }));
});

gulp.task('app-html', function () {
  return gulp.src('assets/templates/app/**/*.jade')
    .pipe(gulpJade())
    .pipe(gulp.dest('public/app'))
    .pipe(gulpNotify({ message: 'app-html task complete' }));
});

gulp.task('app-js', function () {
  return gulp.src(['assets/js/app/**/*.js'])
    .pipe(gulpTemplate({url: config.url})) // Add magic numbers like url etc.
    .pipe(gulpInclude()) // Bring it all together
    .pipe(gulpRename('app.js'))
    .pipe(gulp.dest('public/js'))
    .pipe(gulpNotify({ message: 'app-js task complete' }));
});



//// WATCH
gulp.task('watch', function () {
  gulp.watch('assets/templates/app/**', ['app-html']);
  gulp.watch('assets/stylus/**', ['app-styles', 'loader-styles']);
  gulp.watch('assets/js/**', ['app-js', 'loader-js']);

  gulp.watch('incremental/loader/**', ['loader-incremental']);
});



// BUILD
gulp.task('build', ['app-js', 'app-html', 'app-styles', 'loader-styles', 'loader-js']);