var gulp        = require('gulp'),
sass            = require('gulp-sass'),
rename          = require('gulp-rename'),
cssmin          = require('gulp-minify-css'),
concat          = require('gulp-concat'),
uglify          = require('gulp-uglify'),
cache           = require('gulp-cached'),
prefix          = require('gulp-autoprefixer'),
browserSync     = require('browser-sync'),
reload          = browserSync.reload,
size            = require('gulp-size'),
imagemin        = require('gulp-imagemin'),
pngquant        = require('imagemin-pngquant'),
plumber         = require('gulp-plumber'),
notify          = require('gulp-notify'),
connect         = require('gulp-connect-php'),
httpProxy       = require('http-proxy');


gulp.task('scss', function() {
  var onError = function(err) {
    notify.onError({
      title:    "Gulp",
      subtitle: "Failure!",
      message:  "Error: <%= error.message %>",
      sound:    "Beep"
    })(err);
    this.emit('end');
  };

  return gulp.src('scss/styles.scss')
  .pipe(plumber({errorHandler: onError}))
  .pipe(sass())
  .pipe(prefix())
  .pipe(rename('styles.css'))
  .pipe(gulp.dest('css'))
  .pipe(reload({stream:true}))
});
gulp.task('scss:dist', function() {

  return gulp.src('scss/styles.scss')
  .pipe(plumber({errorHandler: onError}))
  .pipe(sass())
  .pipe(prefix())
  .pipe(cssmin())
  .pipe(size({ gzip: true, showFiles: true }))
  .pipe(rename('styles.css'))
  .pipe(gulp.dest('dist/css'))
});

gulp.task('connect-sync', function() {
  connect.server({
    baseDir: './dist'
  }, function(){
    browserSync({
      proxy: 'localhost:8000'
    });
  });
})

gulp.task('php-serve', ['scss'], function () {
  connect.server({
    port: 3001,
    base: 'dist',
    open: false
  });

  var proxy = httpProxy.createProxyServer({});

  browserSync({
    notify: true,
    port  : 3000,
    server: {
      baseDir   : ['.tmp', 'dist']
    }
  });

  // watch for changes
  gulp.watch([
    './*.html',
    './*.php',
    './scss/**/*.scss',
    './scripts/**/*.js',
    './images/**/*'
  ]).on('change', reload);

  gulp.watch('./styles/**/*.scss', ['styles']);
  gulp.watch('bower.json', ['wiredep']);
});

gulp.task('deploy', function () {
  return gulp.src('dist/**/*')
  .pipe(deploy());
});

gulp.task('copy:dist', function() {
  gulp.src(['markup/**/*'])
  .pipe(gulp.dest('dist/markup'))
  gulp.src(['./index.php', './functions.php'])
  .pipe(gulp.dest('dist/'))
  gulp.src(['./css/sg-style.css'])
  .pipe(gulp.dest('dist/css/'))
});

gulp.task('js', function() {
  gulp.src('js/*.js')
  .pipe(uglify())
  .pipe(size({ gzip: true, showFiles: true }))
  .pipe(concat('scripts.js'))
  .pipe(gulp.dest('dist/js'))
  .pipe(reload({stream:true}));
});

gulp.task('imgmin', function () {
  return gulp.src('img/*')
  .pipe(imagemin({
    progressive: true,
    svgoPlugins: [{removeViewBox: false}],
    use: [pngquant()]
  }))
  .pipe(gulp.dest('dist/img'));
});

gulp.task('default', ['js', 'imgmin', 'scss', 'copy', 'connect-sync']);
gulp.task('build', ['js', 'imgmin', 'scss:dist', 'copy:dist']);
gulp.task('serve', ['scss', 'copy', 'connect-sync']);
