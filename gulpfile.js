'use strict';

const { src, dest, series, parallel, watch } = require('gulp');

const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const groupMediaQueries = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-cleancss');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');

const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
// const babel = require('gulp-babel');

const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const replace = require('gulp-replace');
const del = require('del');
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync').create();

// const svgstore = require('gulp-svgstore');
const svgmin = require('gulp-svgmin');
const imagemin = require('gulp-imagemin');
const cheerio = require('gulp-cheerio');
const svgSpriteGulp = require('gulp-svg-sprite');
const config = {
  shape: {
            dimension: { // Set maximum dimensions
              maxWidth: 32,
              maxHeight: 32
            },
  spacing: { //Add padding
              padding: 10
            },
          },
  mode: {
      inline: true,
      symbol: true, // Create a «symbol» sprite
    css: { // Activate the «css» mode
      render: {
        scss: true // Activate CSS output (with default options)
      }
    }
  }
};

const paths =  {
    src: './src/',              // paths.src
    build: './build/',          // paths.build
    modules: './node_modules'
};

function styles() {
    return src(paths.src + 'scss/main.scss')
      .pipe(plumber())
      .pipe(sourcemaps.init())
      .pipe(sassGlob())
      .pipe(sass()) // { outputStyle: 'compressed' }
      .pipe(groupMediaQueries())
      .pipe(postcss([
        autoprefixer({browsers: ['last 2 version']}),
      ]))
      .pipe(cleanCSS())
      .pipe(rename({ suffix: ".min" }))
      .pipe(sourcemaps.write('/'))
      .pipe(dest(paths.build + 'css/'));
  }

// function normalize() {
//   return src(paths.src + 'css/*.css')
//       .pipe(plumber())
//       .pipe(dest(paths.build + 'css/'));
// }

function svgSprite() {
  return src(paths.src + 'svg/*.svg')
    .pipe(svgmin({
      js2svg: {
          pretty: true
      }
    }))
    // .pipe(svgmin(function (file) {
    //   return {
    //     plugins: [{
    //       cleanupIDs: {
    //         minify: true
    //       }
    //     }]
    //   }
    // }))
    // 
    .pipe(cheerio({
      run: function ($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: {xmlMode: true}
    }))
    // cheerio plugin create unnecessary string '&gt;', so replace it.
    .pipe(replace('&gt;', '>'))
    .pipe(svgSpriteGulp(config))
    .pipe(dest(paths.build + 'img/'));
}
  
function scripts() {
    return src(paths.src + 'js/*.js')
      .pipe(plumber())
      // .pipe(babel({
      //   presets: ['@babel/env']
      // }))
      .pipe(uglify())
      .pipe(concat('script.min.js'))
      .pipe(dest(paths.build + 'js/'))
  }
// function scriptsVendors() {
//     return src([
//         'node_modules/jquery/dist/jquery.min.js',
//         'node_modules/slick-carousel/slick/slick.min.js',
//         'node_modules/svg4everybody/dist/svg4everybody.min.js'
//       ])
//       .pipe(concat('vendors.min.js'))
//       .pipe(dest(paths.build + 'js/'))
// }
function htmls() {
    return src(paths.src + '*.html')
      .pipe(plumber())
      .pipe(replace(/\n\s*<!--DEV[\s\S]+?-->/gm, ''))
      .pipe(dest(paths.build));
  }

function fonts() {
    return src(paths.src + 'fonts/**/*')
        .pipe(plumber())
        .pipe(dest(paths.build + 'fonts/'));
}

function icons() {
    return src(paths.src + 'icons/**/*')
        .pipe(plumber())
        .pipe(dest(paths.build + 'icons/'));
}

function images() {
  return src(paths.src + 'img/**/*.{jpg,jpeg,png,gif,svg}')
    .pipe(imagemin())
    .pipe(dest(paths.build + 'img/'));
}

// function php() {
//     return src(paths.src + '*.php')
//         .pipe(plumber())
//         .pipe(dest(paths.build));
// }

function clean() {
    return del('build/')
}

function watcher() {
    watch(paths.src + 'scss/**/*.scss', styles);
    watch(paths.src + 'js/*.js', scripts);
    watch(paths.src + '*.html', htmls);
  }
  
function serve() {
    browserSync.init({
      server: {
        baseDir: paths.build
      }
    });
    browserSync.watch(paths.build + '**/*.*', browserSync.reload);
}

exports.styles = styles;
exports.scripts = scripts;
exports.fonts = fonts;
exports.images = images;
exports.htmls = htmls;
exports.svgSprite = svgSprite;
exports.clean = clean;
exports.watcher = watcher;

exports.build = series(
  clean,
  parallel(styles, svgSprite, images, scripts, fonts, htmls)
);

exports.default = series(
  clean,
  parallel(styles, svgSprite, scripts, images, fonts, htmls, icons),
  parallel(watcher, serve),
);