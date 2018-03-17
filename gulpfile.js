var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence');
var imagemin = require('gulp-imagemin');
var ghPages = require('gulp-gh-pages');


// production || develop
var envOptions = {
    string: 'env',
    default: { env: 'develop' }
}
var options = minimist(process.argv.slice(2), envOptions);

// gulp build --env production || develop


gulp.task('clean', function () {
    return gulp.src(['./tmp', './public'], {read: false})
        .pipe($.clean());
});

gulp.task('pug', function buildHTML() {
  return gulp.src('./source/**/*.pug')
  .pipe($.watch('./source/**/*.pug'))
  .pipe($.plumber())
  .pipe($.pug({
    pretty: true
  }))
  .pipe(gulp.dest('./public/'))
  .pipe(browserSync.stream())
});

gulp.task('sass', function() {
    var plugins = [
        autoprefixer({ browsers: ['last 3 version', '> 5%', 'ie 11'] })
    ];
    return gulp.src('./source/styles/**/*.sass')
        .pipe($.watch('./source/styles/**/*.sass'))
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sass({
            outputStyle: 'expanded',
            //includePaths: [''] ./node_modules/外部css路徑
        }).on('error', $.sass.logError))
        .pipe($.postcss(plugins))
        .pipe($.if(options.env === 'production', $.cleanCss())) //可用 gulp sass --env production 切換環境
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/styles/'))
        .pipe(browserSync.stream())
});

gulp.task('babel', function() {
    gulp.src('./source/script/**/*.js')
        .pipe($.watch('./source/script/**/*.js'))
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['env']
        }))
        .pipe($.concat('default.js'))
        .pipe($.if(options.env === 'production', $.uglify()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/script/'))
        .pipe(browserSync.stream())
});

gulp.task('bower', function() {
    return gulp.src(mainBowerFiles())
        .pipe(gulp.dest('./.tmp/vendors'))
});

gulp.task('vendorJs', ['bower'], function() {
    return gulp.src('./.tmp/vendors/**/*.js')
        .pipe($.order([
            'jquery.js',
            'bootstrap.js'
        ]))
        .pipe($.concat('vendors.js'))
        .pipe($.if(options.env === 'production', $.uglify({
            compress: {
                drop_console: true
            }
        })))
        .pipe(gulp.dest('./public/script/'))
});

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./public",
            reloadDebounce: 2000
        }
    });
});

//壓縮圖片
gulp.task('image-min', function () {
    gulp.src('./source/images/*')
        .pipe($.if(options.env === 'production', $.imagemin()))
        .pipe(gulp.dest('./public/images'))
});

// gulp.task('watch', function() {
//     gulp.watch('./source/styles/**/*.sass', ['sass']);
//     gulp.watch('./source/**/*.pug', ['pug']);
//     gulp.watch('./source/script/**/*.js', ['babel']);
// });

//上傳github
gulp.task('deploy', function() {
  return gulp.src('./public/**/*')
    .pipe(ghPages());
});


gulp.task('build', gulpSequence(['clean', 'pug', 'sass', 'babel', 'vendorJs']));
// gulp build --env production

gulp.task('default', ['pug', 'sass', 'babel', 'vendorJs', 'image-min', 'browser-sync']);