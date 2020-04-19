const browserSync = require('browser-sync').create();
const del = require('del');
const fs = require("fs");
const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const gzipSize = require('gzip-size');
const through = require('through2');
const path = require('path');
const markdown = require('marked');
const glob = require ('fast-glob');
const rename = require('gulp-rename');

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

  gulp.watch('src/**/*.{html,md}', gulp.series(html, reload))
      .on('all', (event, path, stats) => {
        console.log('Markup changed:', path);
      });
}

function css() {
  let init = mini = gzip = 0;
  return gulp
    .src('assets/css/*.css')
    .pipe(concat('styles.css'))
    .pipe(cleanCSS({debug: true}, (details) => {
      init = details.stats.originalSize;
      mini = details.stats.minifiedSize;
    }))
    .pipe(gulp.dest('dist'))
    .on('end', () => {
      gzip = gzipSize.fileSync('dist/styles.css');
      console.log(`Minified CSS from ${init}B to ${mini}B (${gzip}B gzipped)`);
    })
    .pipe(browserSync.stream())
}

function js() {
  return gulp
    .src('assets/js/**/*.js')
    .pipe(gulp.dest('dist/js'));
}

/**
 * Slot or 'import' HTML files into other HTML files, respecting indentation.
 *
 * Use via:
 * <part src="filename-of-part"/> (no dir or extensions)
 * in HTML files. Self-closing HTML forward slash is optional.
 *
 * Parts CAN import other parts, but too much recursion could get slow.
 * @param  {[type]} html [description]
 * @return {[type]}      [description]
 */
function slotParts(html) {
  const regex = /( *)(?:<part src=")([a-zA-Z./-]*)(?:"\/?>)/g;
  const replacer = (match, indent, filename) => {
    try {
      var part = fs.readFileSync(`src/parts/${filename}.html`, 'utf8');
    } catch (error) {
      console.error(error);
      return `<pre>Failed to include src/parts/${filename}.html</pre>`;
    }

    // Part importing recursion
    if (part.includes('<part src="')) {
      part = slotParts(part);
    }

    return part.replace(/^/gm, indent);
  };

  return html.replace(regex, replacer);
}

/**
 * Slot new HTML content into a main HTML string.
 * @param  {[type]} html    [description]
 * @param  {[type]} content [description]
 * @return {[type]}         [description]
 */
function slotContent(html, content) {
  const regex = /( *)(?:<content\/?>)/g;
  const replacer = (match, indent) => {
    return content.replace(/^/gm, indent);
  };

  return html.replace(regex, replacer);
}

function setCurrentNav(html, pagePath) {
  const filename = path.basename(pagePath, path.extname(pagePath));
  const dirname = path.basename(path.dirname(pagePath));
  const regex = new RegExp(`href="\/${filename}|${dirname}"`);
  return html.replace(regex, '$& aria-current="page"');
}

/**
 * Named after jamstack, this does (or calls) all the fun part replacement,
 * markdown to HTML, slotting content into templates, etc.
 * @param  {[type]}   chunk     [description]
 * @param  {[type]}   encoding  [description]
 * @param  {Function} callback  [description]
 * @param  {[type]}   templates [description]
 * @return {[type]}             [description]
 */
function jam(chunk, encoding, callback, templates) {
  let content = chunk.contents.toString();

  // If the file is markdown
  if (path.extname(chunk.path) === '.md') {
    // Convert it to HTML
    content = markdown(content);

    // If it's in a folder with a template, slot the content in the template
    let templatePath = path.dirname(chunk.path) + '/template.html';
    if (templatePath in templates) {
      content = slotContent(templates[templatePath], content);
    }
  }

  content = slotParts(content);
  content = setCurrentNav(content, chunk.path);

  chunk.contents = Buffer.from(content);
  callback(null, chunk);
}

function html() {
  let templates = {};
  glob.sync('src/*/template.html', { absolute:true }).forEach(filepath => {
    templates[filepath] = fs.readFileSync(filepath).toString();
  });
  return gulp
    .src([
      'src/**/*.{html,md}',
      '!src/parts/*', // Exclude the parts folder
      '!src/**/?(_)template.html', // Exclude templates (w/ optional '_')
    ])
    .pipe(through.obj((chunk, enc, cb) => jam(chunk, enc, cb, templates)))
    .pipe(rename(path => {
      // Remove optional underscores so e.g. '_index.html' becomes 'index.html'
      path.basename = path.basename.replace(/^_/, '');
      // All extension names are now .html (i.e. convert from .md)
      path.extname = '.html'
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
