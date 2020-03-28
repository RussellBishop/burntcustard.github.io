const browserSync = require('browser-sync').create();
const del = require('del');
const fs = require("fs");
const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');
const replace = require('gulp-replace');

function clean(cb) {
  return del(['dist/']);
  cb();
}

function browserSyncInit(cb) {
  browserSync.init({
    serveStatic: ['./'],
    serveStaticOptions: {
      extensions: ['html']
    }
  });
  cb();
}

function reload(cb) {
  browserSync.reload();
  cb();
}

function watch(cb) {
  gulp.watch('assets/css/*.css', gulp.series(css));

  gulp.watch('src/**/*.html', gulp.series(html, reload))
      .on('all', (event, path, stats) => {
        console.log('Markup changed:', path);
      });
}

function css(cb) {
  return gulp.src('assets/css/*.css')
    .pipe(cleanCSS({debug: true}, (details) => {
      console.log(`${details.name}: ${details.stats.originalSize}`);
      console.log(`${details.name}: ${details.stats.minifiedSize}`);
    }))
  .pipe(gulp.dest('dist'));
}

function js(cb) {
  return gulp
    .src('assets/js/**/*.js')
    .pipe(gulp.dest('dist/js'));
}

function html() {
  return gulp
    .src([
      'src/pages/*.html'
    ], { base: './src' })
    .pipe(header('\n'))
    .pipe(footer('\n'))
    .pipe(replace(/(?:<part src=")([a-zA-Z./-]*)(?:"\/?>)/g, (match, p1) => {
       try {
         var component = fs.readFileSync(`src/parts/${p1}.html`);
       } catch (error) {
         console.error(error);
         return `<pre>Failed to include src/parts/${p1}.html</pre>`;
       }
       return component;
    }))
    .pipe(replace(/(.+\r?\n)/g, '    $1'))
    .pipe(gulp.dest('./'))
}

exports.clean = clean;

exports.watch = gulp.parallel(
  html,
  css,
  js,
  gulp.series(
    browserSyncInit,
    watch
  )
);

exports.default = gulp.series(
  clean,
  gulp.parallel(
    html,
    css,
    js
  )
);
