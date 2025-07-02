// Less configuration
const gulp = require('gulp');
const less = require('gulp-less');

gulp.task('less', function() {
  return gulp
    .src('less/age-system.less')
    .pipe(less())
    .pipe(gulp.dest('./styles'));
});

gulp.task('watch', function() {
  gulp.watch('less/*.less', gulp.series('less'));
});

gulp.task('default', gulp.series('less', 'watch'));