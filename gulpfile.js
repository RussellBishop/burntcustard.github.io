const browserSync = require('browser-sync').create();
const del = require('del');
const fs = require("fs");
const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const replace = require('gulp-replace');
const gzipSize = require('gzip-size');

function clean(cb) {
  return del(['dist/']);
  cb();
}

function browserSyncInit(cb) {
  browserSync.init({
    serveStatic: ['./dist'],
    serveStaticOptions: {
      extensions: ['html']
    },
    logSnippet: false
  });
  cb();
}

function reload(cb) {
  browserSync.reload();
  cb();
}

function watch() {
  gulp.watch('assets/css/*.css', css);

  gulp.watch('src/**/*.html', gulp.series(html, reload))
      .on('all', (event, path, stats) => {
        console.log('Markup changed:', path);
      });
}

function css() {
  return gulp
    .src('assets/css/*.css')
    .pipe(concat('styles.css'))
    .pipe(cleanCSS({debug: true}, (details) => {
      let original = details.stats.originalSize + 'B';
      let mini = details.stats.minifiedSize + 'B';
      process.stdout.write(`Minified CSS from ${original} to ${mini} `);
    }))
    .pipe(gulp.dest('dist'))
    .on('end', () => {
      console.log(`(${gzipSize.fileSync('dist/styles.css')}B gzipped)`);
    })
    .pipe(browserSync.stream())
}

function js() {
  return gulp
    .src('assets/js/**/*.js')
    .pipe(gulp.dest('dist/js'));
}

function html() {
  return gulp
    .src([
      'src/pages/*.html'
    ], { base: './src/pages' })
    .pipe(replace(/(?:<part src=")([a-zA-Z./-]*)(?:"\/?>)/g, (match, p1) => {
       try {
         var component = fs.readFileSync(`src/parts/${p1}.html`);
       } catch (error) {
         console.error(error);
         return `<pre>Failed to include src/parts/${p1}.html</pre>`;
       }
       return component;
    }))
    .pipe(gulp.dest('./dist'))
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
