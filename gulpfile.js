const browserSync = require('browser-sync').create();
const del = require('del');
const fs = require("fs");
const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const gzipSize = require('gzip-size');
const through = require('through2').obj;
const path = require('path');
//const markdown = require('gulp-markdown');
const markdown = require('marked');
const glob = require ('glob');

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

function slotParts(html) {
  const regex = /( *)(?:<part src=")([a-zA-Z./-]*)(?:"\/?>)/g;
  const replacer = (match, indent, filename) => {
    try {
      var part = fs.readFileSync(`src/parts/${filename}.html`).toString();
    } catch (error) {
      console.error(error);
      return `<pre>Failed to include src/parts/${filename}.html</pre>`;
    }

    // Part importing recursion
    if (part.includes('<part src="')) {
      part = replaceParts(part);
    }

    return part.replace(/^/gm, indent);
  };

  return html.replace(regex, replacer);
}

function slotContent(html, content) {
  const regex = /( *)(?:<content\/?>)/g;
  const replacer = (match, indent) => {
    return content.replace(/^/gm, indent);
  };

  return html.replace(regex, replacer);
}

function setCurrentNav(html, path) {
  const filename path.basename(path, path.extname(path));
  const dirname = path.basename(path.dirname(path));
  const regex = new RegExp(`href="\/${filename}|${dirname}"`);
  return html.replace(regex, '$& aria-current="page"');
}

// function html() {
//   return gulp
//     .src([
//       'src/pages/*.html'
//     ], { base: './src/pages' })
//     .pipe(through((chunk, encoding, callback) => {
//       let html = chunk.contents.toString();
//       let filename = path.basename(chunk.path, path.extname(chunk.path));
//       html = replaceParts(html);
//       html = setCurrentNav(html, filename);
//       chunk.contents = Buffer.from(html);
//       callback(null, chunk);
//     }))
//     .pipe(gulp.dest('./dist'))
// }
//
// function posts() {
//   let single = fs.readFileSync('src/posts/single.html').toString();
//   return gulp
//     .src([
//       'src/posts/*.md'
//     ], { base: './src/posts' })
//     .pipe(markdown())
//     .pipe(through((chunk, encoding, callback) => {
//       let content = chunk.contents.toString();
//       let html = replaceContent(single, content);
//       html = replaceParts(html);
//       //html = setCurrentNav(html, filename);
//       chunk.contents = Buffer.from(html);
//       callback(null, chunk);
//     }))
//     .pipe(gulp.dest('./dist/blog'))
// }

function html() {
  let templates = {};
  [...glob.sync('.src/*/template.html')].forEach(filename => {
    templates[filename] = fs.readFileSync(filepath).toString();
  });
  return gulp
    .src([
      'src/**/*.html',
      '!src/parts/', // Exclude the parts folder
      '!src/**/template.html', // Exclude template files
      'src/**/*.md'
    ], { base: './src/' })
    .pipe(through((chunk, encoding, callback) => {
      let content = chunk.contents.toString();

      // If the file is markdown, convert it to HTML
      if (chunk.path.extname === '.md') {
        content = markdown(content);
      }

      // If the file is in a folder with a template, slot the content in it
      if (chunk.path.dirname + '/template.html' in templates) {
        slotContent(templates[chunk.path.dirname + '/template.html'], content);
      }

      content = slotParts(content);
      content = setCurrentNav(content, chunk.path);

      chunk.contents = Buffer.from(html);
      callback(null, chunk);
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
    posts,
    css,
    js
  )
);
