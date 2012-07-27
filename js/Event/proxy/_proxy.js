/*
	----------------------------------------------------
	Event.proxy : 0.3.8 : 2012/07/14 : MIT License
	----------------------------------------------------
	https://github.com/mudcube/Event.js
	----------------------------------------------------
	1  : click, dblclick, dbltap
	1+ : tap, taphold, drag, swipe
	2+ : pinch, rotate
	   : mousewheel, devicemotion, shake
	----------------------------------------------------
	- Add "self" to the "event" object?
	----------------------------------------------------
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

root.TouchStart = function(event, conf) {
	var addTouchStart = function(touch, sid) {	
		var bbox = conf.bbox;
		var o = track[sid] = {};
		///
		switch(conf.position) {
			case "absolute": // Absolute from within window.
				o.offsetX = 0;
				o.offsetY = 0;
				break;
			case "difference": // Relative from origin.
				o.offsetX = touch.pageX;
				o.offsetY = touch.pageY;
				break;
			case "move": // Move target element.
				o.offsetX = touch.pageX - bbox.x1;
				o.offsetY = touch.pageY - bbox.y1;
				break;
			default: // Relative from within target.
				o.offsetX = bbox.x1;
				o.offsetY = bbox.y1;
				break;
		}
		///
		var x = (touch.pageX + bbox.scrollLeft - o.offsetX) * bbox.scaleX;
		var y = (touch.pageY + bbox.scrollTop - o.offsetY) * bbox.scaleY;
		///
		o.rotation = 0;
		o.scale = 1;
		o.startTime = o.moveTime = (new Date).getTime();
		o.move = { x: x, y: y };
		o.start = { x: x, y: y };
		///
		conf.fingers ++;
	};
	//
	var isTouchStart = !conf.fingers;
	var track = conf.tracker;
	var touches = event.changedTouches || getCoords(event);
	var length = touches.length;
	// Adding touch events to tracking.
	for (var i = 0; i < length; i ++) {
		var touch = touches[i];
		var sid = touch.identifier || 0; // Touch ID.
		// Track the current state of the touches.
		if (conf.fingers) {
			if (conf.fingers >= conf.maxFingers) {
				return isTouchStart;
			}
			var fingers = 0; // Finger ID.
			for (var rid in track) {
				// Replace removed finger.
				if (track[rid].up) {
					delete track[rid];
					addTouchStart(touch, sid);
					conf.cancel = true;
					break;
				}
				fingers ++;
			}
			// Add additional finger.
			if (track[sid]) continue;
			addTouchStart(touch, sid);
		} else { // Start tracking fingers.
			track = conf.tracker = {};
			conf.bbox = root.getBoundingBox(conf.target);
			conf.fingers = 0;
			conf.cancel = false;
			addTouchStart(touch, sid);
		}
	}
	///
	return isTouchStart;
};

root.TouchEnd = function(event, conf, callback) {
	// Record changed touches have ended (iOS changedTouches is not reliable).
	//- simplify this for desktop computers...
	var touches = event.touches || [];
	var length = touches.length;
	var exists = {};
	for (var i = 0; i < length; i ++) {
		var touch = touches[i];
		exists[touch.identifier || 0] = true;
	}
	for (var key in conf.tracker) {
		var track = conf.tracker[key];
		if (!exists[key] && !track.up) {
			if (callback) {
				callback({
					pageX: track.pageX,
					pageY: track.pageY,
					changedTouches: [{
						pageX: track.pageX,
						pageY: track.pageY,
						identifier: key 
					}]
				}, "up");
			}
			conf.tracker[key].up = true;
			conf.fingers --;
		}
	}
/*	var touches = event.changedTouches || getCoords(event);
	var length = touches.length;
	// Record changed touches have ended (this should work).
	for (var i = 0; i < length; i ++) {
		var touch = touches[i];
		var sid = touch.identifier || 0;
		if (conf.tracker[sid]) {
			conf.tracker[sid].up = true;
			conf.fingers --;
		}
	} */
	// Wait for all fingers to be released.
	if (conf.fingers !== 0) return false;
	//
	conf.gestureFingers = 0;
	for (var sid in conf.tracker) {
		conf.gestureFingers ++;
	}
	// Return state of tracking.
	return true;
};

var getCoords = function(event) {
	if (typeof(event.pageX) !== "undefined") { // Desktop browsers.
		getCoords = function(event) {
			return Array(event);
		};
	} else { // Internet Explorer <=8.0
		getCoords = function(event) {
			event = event || window.event;
			return Array({
				pageX: event.clientX + document.documentElement.scrollLeft,
				pageY: event.clientY + document.documentElement.scrollTop
			});
		};
	}
	return getCoords(event);
};

root.getBoundingBox = function(o) { 
	if (o === window || o === document) o = document.body;
	///
	var bbox = {
		x1: 0,
		y1: 0,
		x2: 0,
		y2: 0,
		scrollLeft: 0,
		scrollTop: 0
	};
	///
	if (o === document.body) {
		bbox.height = window.innerHeight;
		bbox.width = window.innerWidth;
	} else {
		bbox.height = o.offsetHeight;
		bbox.width = o.offsetWidth;
	}
	/// Get the scale of the element.
	bbox.scaleX = o.width / bbox.width || 1;
	bbox.scaleY = o.height / bbox.height || 1;
	/// Get the offset of element.
	var tmp = o;
	while (tmp !== null) {
		bbox.x1 += tmp.offsetLeft; 
		bbox.y1 += tmp.offsetTop; 
		tmp = tmp.offsetParent;
	};
	/// Get the scroll of container element.
	var tmp = o.parentNode;
	while (tmp !== null) {
		if (tmp === document.body) break;
		if (tmp.scrollTop === undefined) break;
		bbox.scrollLeft += tmp.scrollLeft;
		bbox.scrollTop += tmp.scrollTop;
		tmp = tmp.parentNode;
	};
	/// Record the extent of box.
	bbox.x2 = bbox.x1 + bbox.width;
	bbox.y2 = bbox.y1 + bbox.height;
	///
	return bbox;
};

root.getCoords = function(event) {
	if ("ontouchstart" in window) { // Mobile browsers.
		var pX = 0;
		var pY = 0;
		root.getCoords = function(event) {
			var touches = event.changedTouches;
			if (touches.length) { // ontouchstart + ontouchmove
				return {
					x: pX = touches[0].pageX,
					y: pY = touches[0].pageY
				};
			} else { // ontouchend
				return {
					x: pX,
					y: pY
				};
			}
		};
	} else if(typeof(event.pageX) !== "undefined" && typeof(event.pageY) !== "undefined") { // Desktop browsers.
		root.getCoords = function(event) {
			return {
				x: event.pageX,
				y: event.pageY
			};
		};
	} else { // Internet Explorer <=8.0
		root.getCoords = function(event) {
			event = event || window.event;
			return {
				x: event.clientX + document.documentElement.scrollLeft,
				y: event.clientY + document.documentElement.scrollTop
			};
		};
	}
	return root.getCoords(event);
};

return root;

})(Event.proxy);