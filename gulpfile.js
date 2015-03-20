var gulp        = require('gulp'),
    sass        = require('gulp-sass'),
    rename      = require('gulp-rename'),
    cssmin      = require('gulp-minify-css'),
    concat      = require('gulp-concat'),
    uglify      = require('gulp-uglify'),
    cache       = require('gulp-cached'),
    prefix      = require('gulp-autoprefixer'),
    browserSync = require('browser-sync'),
    reload      = browserSync.reload,
    minifyHTML  = require('gulp-minify-html'),
    size        = require('gulp-size'),
    imagemin    = require('gulp-imagemin'),
    pngquant    = require('imagemin-pngquant'),
    plumber     = require('gulp-plumber'),
    notify      = require('gulp-notify'),
    connect     = require('gulp-connect-php'),
    httpProxy   = require('http-proxy');


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

  return gulp.src('scss/main.scss')
    .pipe(plumber({errorHandler: onError}))
    .pipe(sass())
    .pipe(size({ gzip: true, showFiles: true }))
    .pipe(prefix())
    .pipe(rename('main.css'))
    .pipe(gulp.dest('dist/css'))
    .pipe(reload({stream:true}))
    .pipe(cssmin())
    .pipe(size({ gzip: true, showFiles: true }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist/css'))
    .pipe(gulp.dest('css'))
});

gulp.task('php-serve', ['scss'], function () {
    connect.server({
        port: 9001,
        base: 'dist',
        open: false
    });

    var proxy = httpProxy.createProxyServer({});

    browserSync({
        notify: false,
        port  : 9000,
        server: {
            baseDir   : ['.tmp', 'dist'],
            routes    : {
                '/bower_components': 'bower_components'
            },
            middleware: function (req, res, next) {
                var url = req.url;

                if (!url.match(/^\/(styles|fonts|bower_components)\//)) {
                    proxy.web(req, res, { target: 'http://127.0.0.1:9001' });
                } else {
                    next();
                }
            }
        }
    });

    // watch for changes
    gulp.watch([
        './*.html',
        './*.php',
        './scripts/**/*.js',
        './images/**/*',
        '.tmp/fonts/**/*'
    ]).on('change', reload);

    gulp.watch('./styles/**/*.scss', ['styles']);
    gulp.watch('bower.json', ['wiredep']);
});



gulp.task('deploy', function () {
    return gulp.src('dist/**/*')
        .pipe(deploy());
});

gulp.task('copy', function() {
  gulp.src(['markup/**/*'])
    .pipe(gulp.dest('dist/markup'))
  gulp.src(['scss/**/*'])
    .pipe(gulp.dest('dist/'))
  gulp.src(['./index.php', './functions.php'])
    .pipe(gulp.dest('dist/'))
  gulp.src(['./css/sg-style.css'])
    .pipe(gulp.dest('dist/css/'))
  gulp.src(['./js/**.js'])
    .pipe(gulp.dest('dist/js/'))
});

gulp.task('js', function() {
  gulp.src('js/*.js')
    .pipe(uglify())
    .pipe(size({ gzip: true, showFiles: true }))
    .pipe(concat('j.js'))
    .pipe(gulp.dest('dist/js'))
    .pipe(reload({stream:true}));
});

gulp.task('minify-html', function() {
    var opts = {
      comments:true,
      spare:true
    };

  gulp.src('./*.php')
    .pipe(minifyHTML(opts))
    .pipe(gulp.dest('dist/'))
    .pipe(reload({stream:true}));
});

gulp.task('watch', function() {
  gulp.watch('scss/**/*.scss', ['scss']);
  gulp.watch('js/*.js', ['js']);
  gulp.watch('./*.php', ['minify-html']);
  gulp.watch('img/*', ['imgmin']);
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

gulp.task('default', ['js', 'imgmin', 'copy', 'scss', 'watch', 'php-serve']);
