/*
	------------------------------------------------------------------------------
	Grunt configuration
	------------------------------------------------------------------------------
	The entire library is 6kb minified with gzip compression.
	------------------------------------------------------------------------------
	* To reduce the size remove unused libraries below.	
	* The only required libraries is _event.js for most basic work.
	* _proxy.js is required to include any additional event proxies.
	------------------------------------------------------------------------------
*/

module.exports = function (grunt) {
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.initConfig({
		concat: {
			'js/Event.js': [
				'js/Event/_event.js', 
				'js/Event/_proxy.js', 
//				'js/Event/keypress.js', //- in dev
				'js/Event/mutationObserver.js',
				'js/Event/click.js', 
				'js/Event/dbltap.js', 
				'js/Event/drag.js', 
				'js/Event/gesture.js', 
				'js/Event/pointer.js', 
				'js/Event/shake.js', 
				'js/Event/swipe.js', 
				'js/Event/tap.js', 
				'js/Event/wheel.js',
				'js/Event/orientation.js'
			]
		},
		uglify: {
			my_target: {
				files: {
					'js/Event.min.js': ['js/Event.js']
				}
			}
		},
	});
	grunt.registerTask("default", ["concat", "uglify"]);
};