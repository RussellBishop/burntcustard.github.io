const browserSync = require('browser-sync').create();
const del = require('del');
const fs = require("fs");
const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
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
  const regex = /( *)(?:<part src=")([a-zA-Z./-]*)(?:"\/?>)/g;
  const replacer = (match, indent, filename) => {
    try {
      var part = fs.readFileSync(`src/parts/${filename}.html`).toString();
    } catch (error) {
      console.error(error);
      return `<pre>Failed to include src/parts/${filename}.html</pre>`;
    }

    if (hasParts(part)) {
      part = replaceParts(part);
    }

    part = part.replace(/^/gm, indent);
    //console.log(part);

    return part;
  };

  return html.replace(regex, replacer);
}

function replaceContent(html, content) {
  const regex = /( *)(?:<content\/?>)/g;
  const replacer = (match, indent) => {
    return content.replace(/^/gm, indent);
  };

  return html.replace(regex, replacer);
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
  let single = fs.readFileSync('src/posts/single.html').toString();
  return gulp
    .src([
      'src/posts/*.md'
    ], { base: './src/posts' })
    .pipe(markdown())
    .pipe(through((chunk, encoding, callback) => {
      let content = chunk.contents.toString();
      let html = replaceContent(single, content);
      html = replaceParts(html);
      chunk.contents = Buffer.from(html);
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
