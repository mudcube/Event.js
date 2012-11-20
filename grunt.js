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
	grunt.initConfig({
		concat: {
			'js/Event.js': [
				'js/Event/_event.js', 
				'js/Event/proxy/_proxy.js', 
				'js/Event/proxy/click.js', 
				'js/Event/proxy/dbltap.js', 
				'js/Event/proxy/drag.js', 
				'js/Event/proxy/gesture.js', 
				'js/Event/proxy/pointer.js', 
				'js/Event/proxy/shake.js', 
				'js/Event/proxy/swipe.js', 
				'js/Event/proxy/tap.js', 
				'js/Event/proxy/wheel.js'
			]
		},
		min: {
			'js/Event.min.js': ['js/Event.js']
		},
	});
	grunt.registerTask('default', 'concat min');
};