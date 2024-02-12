const { src, dest, watch, parallel, series } = require('gulp');
const scss = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const imageComp = require('compress-images');
const cleanDist = require('del');

function cleandist() {
    return src('dist')
}

function browsersync() {
    browserSync.init({
        server: {
            baseDir: 'app/'
        }
    })
}

async function imagecomp() {
    imageComp(
        "app/images/**/*.{jpg,JPG,jpeg,JPEG,png,svg,gif}",
        "dist/images/", { compress_force: false, statistic: true, autoupdate: true },
        false, { jpg: { engine: "mozjpeg", command: ["-quality", "60"] } }, { png: { engine: "pngquant", command: ["--quality=20-50", "-o"] } }, { svg: { engine: "svgo", command: "--multipass" } }, {
            gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] },
        },
        function(err, completed) {
            if (completed === true) { // Обновляем страницу по завершению
                browserSync.reload();
            }
        }
    )
}

function scripts() {
    return src([
            'node_modules/jquery/dist/jquery.js',
            'app/js/main.js'
        ])
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(dest('app/js'))
        .pipe(browserSync.stream())
}

function styles() {
    return src('app/scss/style.scss')
        .pipe(scss({ outputStyle: 'compressed' }))
        .pipe(rename('style.min.css'))
        .pipe(autoprefixer({
            overrideBrowserlist: ['last 10 version'],
            grid: true,
        }))
        .pipe(dest('app/css'))
        .pipe(browserSync.stream())
}

function build() {
    return src([
            'app/css/style.min.css',
            'app/font/**/*',
            'app/js/main.min.js',
            'app/*.html',
            'app/images/*'
        ], { base: 'app' })
        .pipe(dest('dist'))
}

function watching() {
    watch(['app/scss/**/*.scss'], styles);
    watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts)
    watch('app/*.html').on('change', browserSync.reload);
}

exports.styles = styles;
exports.watch = watching;
exports.browsersync = browsersync;
exports.scripts = scripts;
exports.images = imagecomp;
exports.clean = cleandist;

exports.build = series(cleandist, imagecomp, build);
exports.default = parallel(scripts, styles, browsersync, watching);