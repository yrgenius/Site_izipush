'use strict'

const { src, dest, watch, parallel, series } = require('gulp')
const fileInclude = require('gulp-file-include')
const scss = require('gulp-sass')(require('sass'))
const sourceMaps = require('gulp-sourcemaps')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify-es').default
const browserSync = require('browser-sync').create()
const autoprefixer = require('gulp-autoprefixer')
const imageComp = require('compress-images')
const rimraf = require('gulp-rimraf')


/* Paths */
const srcPath = 'src'
const distPath = 'dist'

const path = {
    build: {
        html: distPath,
        css: distPath + '/css/',
        js: distPath + '/js/',
        images: distPath + '/images/',
        fonts: distPath + '/fonts/'
    },
    src: {
        html: srcPath + '/*.html',
        js: srcPath + '/js/*.js',
        css: srcPath + '/css/style.min.css',
        scss: srcPath + '/scss/*.scss',
        images: srcPath + '/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
        fonts: srcPath + '/fonts/**/*.{eot,woff,woff2,ttf,svg}'
    },
    watch: {
        html: srcPath + '/**/*.html',
        js: srcPath + '/js/**/*.js',
        css: srcPath + '/scss/**/*.scss',
        images: srcPath + '/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
        fonts: srcPath + '/fonts/**/*.{eot,woff,woff2,ttf,svg}'
    },
    clean: './' + distPath + '/*'
}

const fileIncludeSettings = {
    prefix: '@@',
    basepath: '@file'
}

const serverSettings = {
    baseDir: distPath,
    notify: false, //отключаем уведомления
    online: true
}


/* Tasks */

function html() {
    return src(path.src.html)
        .pipe(fileInclude(fileIncludeSettings))
        .pipe(dest('./' + distPath))
        .pipe(browserSync.stream())
}

function styles() {
    return src(path.src.scss)
        .pipe(sourceMaps.init())
        .pipe(scss())
        // .pipe(scss({ outputStyle: 'compressed' }))
        .pipe(rename(function (path) {
            path.basename += ".min"
        }))
        .pipe(autoprefixer({
            overrideBrowserlist: ['last 10 version'],
            grid: true,
        }))
        // .pipe(dest(srcPath + '/css'))
        .pipe(sourceMaps.write())
        .pipe(dest(path.build.css))
        .pipe(browserSync.stream())
}

function browsersync() {
    browserSync.init({
        server: serverSettings
    })
}

async function images() {
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
    return src([path.src.js])
        .pipe(rename(function (path) {
            path.basename += ".bundle"
        }))
        .pipe(uglify())
        .pipe(dest(path.build.js))
        .pipe(browserSync.stream())
}

function fonts() {
    return src([path.src.fonts])
        .pipe(dest(path.build.fonts))
        .pipe(browserSync.stream())
}

function watching() {
    watch([path.watch.css], styles)
    watch([path.watch.js, '!src/js/main.min.js'], scripts)
    watch([path.watch.images], images)
    watch([path.watch.html], html)
}

function cleandist() {
    return src(path.clean, { read: false })
        .pipe(rimraf())
}


/* Exports Tasks */
exports.html = html
exports.styles = styles
exports.images = images
exports.scripts = scripts
exports.fonts = fonts
exports.watch = watching
exports.browsersync = browsersync
exports.clean = cleandist

exports.default = series(
    cleandist,
    parallel(html, styles, scripts, images, fonts),
    parallel(browsersync, watching)
)
