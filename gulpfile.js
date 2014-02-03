'use strict';

var gulp = require('gulp');
var sweetjs = require('gulp-sweetjs');

gulp.task('default', function () {
    gulp.src('assets/js/*.js')
      .pipe(sweetjs())
      .pipe(gulp.dest('public/js/'));
});