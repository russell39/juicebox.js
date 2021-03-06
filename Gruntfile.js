module.exports = function (grunt) {

    // 1. All configuration goes here
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        qunit: {
            all: ['test/runTests.html']
        },

        connect: {
            uses_defaults: {}
        },

        concat: {
            hic: {
                src: [
                    'wrapper/header.js',
                    'vendor/jquery-1.12.4.js',
                    'vendor/jquery-ui.js',
                    'vendor/underscore.js',
                    'vendor/throbber.js',
                    'vendor/colors.js',
                    'js/**/*.js',
                    'wrapper/footer.js'
                ],
                dest: 'dist/juicebox.js'
            }
        },

        uglify: {
            options: {
                mangle: false,
                sourceMap: true
            },

            hic: {
                src: 'dist/juicebox.js',
                dest: 'dist/juicebox.min.js'
            }
        },

        copy: {
            css: {
                expand: true,
                flatten: true,
                src: ['css/juicebox.css'],
                dest: 'dist/css'
            },
            img: {
                expand: true,
                src: 'css/img/*',
                dest: 'dist'
            }
        }
    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    //grunt.registerTask('default', ['concat:igvexp', 'uglify:igvexp']);
    //grunt.registerTask('default', ['concat:igv', 'uglify:igv', 'md2html:igv']);
    grunt.registerTask('default', ['concat:hic', 'uglify:hic', 'copy']);

    grunt.task.registerTask('unittest', 'Run one unit test.', function (testname) {

        if (!!testname)
            grunt.config('qunit.all', ['test/' + testname + '.html']);

        grunt.task.run('qunit:all');

    });

};

