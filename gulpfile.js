const browserSync = require('browser-sync').create();
const del = require('del');
const fs = require("fs");
const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const replace = require('gulp-replace');
const gzipSize = require('gzip-size');
const through = require('through2').obj;
const markdown = require('gulp-markdown');

function clean(cb) {
  return del(['dist/']);
  cb();
}

function browserSyncInit(cb) {
  browserSync.init({
    serveStatic: ['dist'],
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
      let minified = details.stats.minifiedSize + 'B';
      process.stdout.write(`Minified CSS from ${original} to ${minified}`);
    }))
    .pipe(gulp.dest('dist'))
    .on('end', () => {
      console.log(` (${gzipSize.fileSync('dist/styles.css')}B gzipped)`);
    })
    .pipe(browserSync.stream())
}

function js() {
  return gulp
    .src('assets/js/**/*.js')
    .pipe(gulp.dest('dist/js'));
}

function hasParts(html) {
  return html.includes('<part src="');
}

function replaceParts(html) {
  html.replace(/(?:<part src=")([a-zA-Z./-]*)(?:"\/?>)/g, (match, param1) => {
    try {
      let part = fs.readFileSync(`src/parts/${param1}.html`);
    } catch (error) {
        console.error(error);
      return `<pre>Failed to include src/parts/${param1}.html</pre>`;
    }

    if (hasParts(part)) {
      replaceParts(part);
    }

    return part;
  });

  return html;
}

function html() {
  return gulp
    .src([
      'src/pages/*.html'
    ], { base: './src/pages' })
    .pipe(through((chunk, encoding, callback) => {
      var html = chunk.contents.toString();
      html = replaceParts(html);
      chunk.contents = Buffer.from(html);
      callback(null, chunk);
    }))
    .pipe(gulp.dest('./dist'))
}

function posts() {
  let single = fs.readFileSync('src/posts/single.html');
  return gulp
    .src([
      'src/posts/*.md'
    ], { base: './src/posts' })
    .pipe(markdown())
    .pipe(through((chunk, encoding, callback) => {
      var content = chunk.contents.toString();
      content += test;
      chunk.contents = Buffer.from(content);
      callback(null, chunk);
    }))
    .pipe(gulp.dest('./dist/blog'))
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
    posts,
    css,
    js
  )
);
