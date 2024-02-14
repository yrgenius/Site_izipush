'use strict'

const { src, dest, watch, parallel, series } = require('gulp')
const fileInclude = require('gulp-file-include')
const scss = require('gulp-sass')(require('sass'))
const concat = require('gulp-concat')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify-es').default
const browserSync = require('browser-sync').create()
const autoprefixer = require('gulp-autoprefixer')
const imageComp = require('compress-images')
const rimraf = require('gulp-rimraf')


/* Paths */
const srcPath = 'src/'
const distPath = 'dist/'

const path = {
    build: {
        html: distPath,
        css: distPath + '/css/',
        js: distPath + '/js/',
        images: distPath + '/images/',
        fonts: distPath + '/fonts/'
    },
    src: {
        html: srcPath + '*.html',
        js: srcPath + '/js/*.js',
        css: srcPath + '/css/style.min.css',
        scss: srcPath + '/scss/*.scss',
        images: srcPath + '/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
        fonts: srcPath + '/fonts/**/*.{eot,woff,woff2,ttf,svg}'
    },
    watch: {
        html: srcPath + '**/*.html',
        js: srcPath + '/js/**/*.js',
        css: srcPath + '/scss/**/*.scss',
        images: srcPath + '/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
        fonts: srcPath + '/fonts/**/*.{eot,woff,woff2,ttf,svg}'
    },
    clean: './' + distPath + '*'
}


/* Tasks */

function includeFiles() {
    return src(path.src.html)
        .pipe(fileInclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(dest('./' + distPath))
}

function browsersync() {
    browserSync.init({
        server: {
            baseDir: './' + srcPath
        }
    })
}

async function imagecomp() {
    imageComp(
        path.src.images,
        path.build.images,
        { compress_force: false, statistic: true, autoupdate: true },
        false,
        { jpg: { engine: 'mozjpeg', command: ['-quality', '60'] } },
        { png: { engine: 'pngquant', command: ['--quality=20-50', '-o'] } },
        { svg: { engine: 'svgo', command: '--multipass' } },
        {
            gif: { engine: 'gifsicle', command: ['--colors', '64', '--use-col=web'] },
        },
        function (err, completed) {
            if (completed === true) { // Обновляем страницу по завершению
                browserSync.reload()
            }
        }
    )
}

function scripts() {
    return src([
        path.src.js
    ])
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(dest('src/js'))
        .pipe(browserSync.stream())
}

function styles() {
    return src(path.src.scss)
        .pipe(scss({ outputStyle: 'compressed' }))
        .pipe(rename('style.min.css'))
        .pipe(autoprefixer({
            overrideBrowserlist: ['last 10 version'],
            grid: true,
        }))
        .pipe(dest('src/css'))
        .pipe(browserSync.stream())
}

function build() {
    return src([
        'src/css/style.min.css',
        path.src.fonts,
        path.src.js,
        path.src.html,
        path.src.images
    ], { base: 'src' })
        .pipe(dest('dist'))
}

function watching() {
    watch([path.watch.html], styles)
    watch([path.watch.js, '!src/js/main.min.js'], scripts)
    watch(path.watch.html).on('change', browserSync.reload)
}

function cleandist() {
    return src(path.clean, { read: false })
        .pipe(rimraf())
}


exports.build = series(cleandist, imagecomp, build)
exports.default = parallel(scripts, styles, browsersync, watching)


/* Exports Tasks */
exports.includeFiles = includeFiles
exports.styles = styles
exports.watch = watching
exports.browsersync = browsersync
exports.scripts = scripts
exports.images = imagecomp
exports.clean = cleandist

