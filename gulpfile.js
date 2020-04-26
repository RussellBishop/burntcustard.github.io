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
const chalk = require('chalk');

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

function img() {
  return gulp
    .src('assets/img/**/*')
    .pipe(gulp.dest('dist/img'));
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
function slotParts(html, parts) {
  const regex = /( *)(?:<part src=")([a-zA-Z./-]*)(?:"\/?>)/g;
  const replacer = (match, indent, filename) => {
    let filepath = `src/parts/${filename}.html`
    if (!(filepath in parts)) {
      let error = `Failed to include part: ${filepath}`;
      console.error(chalk.red(error));
      return `<pre>${error}</pre>`;
    }

    let part = parts[filepath];

    // Part importing recursion
    if (part.includes('<part src="')) {
      part = slotParts(part, parts);
    }

    // Return withe part, with the same indentation as the tag it's replacing
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

  if (dirname === 'pages' && filename === 'index') {
    return html.replace('href="/"', '$& aria-current="page"');
  }

  const regex = new RegExp(`href="\/${filename}|${dirname}"`);
  return html.replace(regex, '$& aria-current="page"');
}

function combineTitles(html, separator = ' - ') {
  // Used to get all the title elements from an HTML snippet
  const titleElementsRegex = /(<title>[^<]+<\/title>)/g;

  // Used to pull the title text out of a title tag
  const titleTextRegex = /(?:<title>)([^<]+)(?:<\/title)/;

  // Get all the title elements including <title> tags and indentation
  const titleElements = html.match(titleElementsRegex);

  // If there's no titles, or there's only one, don't modify
  if (!titleElements || titleElements.length === 1) {
    return html;
  }

  const titleTexts = [];

  for (i = titleElements.length - 1; i >= 0; i--) {
    titleTexts.unshift(titleElements[i].match(titleTextRegex)[1]);

    // If the title element is the first, original, hopefully in <head>, one
    if (i === 0) {
      // Replace it with all the title tags combined
      let fullTitle = titleTexts.join(separator);
      html = html.replace(titleElements[i], `<title>${fullTitle}</title>`);
    } else {
      // Otherwise remove it!
      // Get the full title line, with indentation and newline at the end. Also
      // Include 0 or 1 single empty lines (can have spaces) after title line
      html = html.replace(new RegExp(` *${titleElements[i]}( *\\n)*`), '');
    }
  }

  return html;
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
function jam(chunk, encoding, callback, files) {
  let content = chunk.contents.toString();

  // If the file is markdown
  if (path.extname(chunk.path) === '.md') {
    // Convert it to HTML
    content = markdown(content, { smartypants: true });

    // If it's in a folder with a template, slot the content in the template
    let templatePath = `src/${path.basename(chunk.dirname)}/template.html`;

    if (templatePath in files.templates) {
      content = slotContent(files.templates[templatePath], content);
    }
  }

  content = slotParts(content, files.parts);
  content = setCurrentNav(content, chunk.path);
  content = combineTitles(content);

  chunk.contents = Buffer.from(content);
  callback(null, chunk);
}

const patterns = {
  templates: 'src/*/?(_)template.html',
  listings: 'src/*/?(_)listing.html',
  parts: 'src/parts/*.html',
};

function getFiles(pattern) {
  const filepaths = glob.sync(pattern);
  const files = {};

  filepaths.forEach(filepath => {
    // Put file contents into files obj, without optional underscores in key
    files[filepath.replace(/\/_/, '/')] = fs.readFileSync(filepath, 'utf8');
  });

  return files;
}


function html() {
  const files = {
    templates: getFiles(patterns.templates),
    listings: getFiles(patterns.listings),
    parts: getFiles(patterns.parts)
  };

  return gulp
    .src([
      `src/**/*.{html,md}`,
      `!${patterns.templates}`,
      `!${patterns.listings}`,
      `!${patterns.parts}`,
    ])
    .pipe(through.obj((chunk, enc, cb) => jam(chunk, enc, cb, files)))
    .pipe(rename(path => ({
      // Move pages out of their subdirectory, to the root of /dist
      dirname: path.dirname === 'pages' ? '' : path.dirname,
      // Remove optional underscores so e.g. '_index.html' becomes 'index.html'
      basename: path.basename.replace(/^_/, ''),
      // All extension names are now .html (i.e. convert from .md)
      extname: '.html'
    })))
    .pipe(gulp.dest('./dist'))
}

exports.clean = clean;

exports.watch = gulp.parallel(
  html,
  css,
  js,
  img,
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
    img,
    js
  )
);
