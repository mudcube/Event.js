/*
	----------------------------------------------------
	Event.proxy : 0.3.7 : 2012/06/14 : http://mudcu.be
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

Event.proxy = (function(root) { "use strict";

var RAD_DEG = Math.PI / 180;

/*
	"Drag" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: maxFingers, position.
	----------------------------------------------------
	Event.add(window, "drag", function(event, self) {
		console.log(self.type, self.state, self.start, self.x, self.y, self.bbox);
	});
*/

root.drag = function(conf) {
	conf.doc = conf.target.ownerDocument || conf.target;
	conf.minFingers = conf.minFingers || 1;
	conf.maxFingers = conf.maxFingers || Infinity; // Maximum allowed fingers.
	conf.position = conf.position || "relative"; // Point to source coordinates from.
	// Externally accessible data.
	var self = {
		type: "drag",
		target: conf.target,
		listener: conf.listener,
		remove: function() {
			Event.remove(conf.target, "mousedown", onMouseDown);
		}
	};
	// Tracking the events.
	var onMouseDown = function (event) {
		if (TouchStart(event, conf)) {
			Event.add(conf.doc, "mousemove", onMouseMove);
			Event.add(conf.doc, "mouseup", onMouseUp);
		}
		// Process event listener.
		onMouseMove(event, "down");
	};
	var onMouseMove = function (event, state) {
		var bbox = conf.bbox;
		var touches = event.changedTouches || getCoords(event);
		var length = touches.length;
		for (var i = 0; i < length; i ++) {
			var touch = touches[i];
			var sid = touch.identifier || 0;
			var o = conf.tracker[sid];
			// Identifier defined outside of listener.
			if (!o) continue;
			o.pageX = touch.pageX;
			o.pageY = touch.pageY;
			// Record data.
			self.state = state || "move";
			self.id = sid;
			self.x = (touch.pageX + bbox.scrollLeft - o.offsetX) * bbox.scaleX;
			self.y = (touch.pageY + bbox.scrollTop - o.offsetY) * bbox.scaleY;
			self.start = o.start;
			conf.listener(event, self);
		}
	};
	var onMouseUp = function(event) {
		// Remove tracking for touch.
		if (TouchEnd(event, conf, onMouseMove)) {
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
		}
	};
	// Attach events.
	if (conf.event) {
		onMouseDown(conf.event);
	} else {
		Event.add(conf.target, "mousedown", onMouseDown);
	}
	// Return this object.
	return self;
};

/*
	"Gesture" event proxy (2+ fingers).
	----------------------------------------------------
	CONFIGURE: minFingers, maxFingers.
	----------------------------------------------------
	ongesturestart	Fired when the user starts a gesture using two fingers
	ongesturechange	Fired when the user is moving her fingers, rotating or pinching
	ongestureend	Fired when the user lifts one or both fingers
	----------------------------------------------------
	Event.add(window, "gesture", function(event, self) {
		console.log(self.rotation, self.scale, self.fingers, self.state);
	});
*/

root.gesture = function(conf) {
	conf.doc = conf.target.ownerDocument || conf.target;
	conf.minFingers = conf.minFingers || 2;
	conf.maxFingers = conf.maxFingers || 2;
	// Externally accessible data.
	var self = {
		type: "gesture",
		target: conf.target,
		listener: conf.listener,
		remove: function() {
			Event.remove(conf.target, "mousedown", onMouseDown);
		}
	};
	// Tracking the events.
	var onMouseDown = function (event) {
		var fingers = conf.fingers;
		if (TouchStart(event, conf)) {
			Event.add(conf.doc, "mousemove", onMouseMove);
			Event.add(conf.doc, "mouseup", onMouseUp);
		}
		// Record gesture start.
		if (conf.fingers === conf.minFingers && fingers !== conf.fingers) {
			self.fingers = conf.minFingers;
			self.scale = 1;
			self.rotation = 0;
			self.state = "start";
			var sids = "";
			for (var key in conf.tracker) sids += key;
			self.id = parseInt(sids);
			conf.listener(event, self);
		}
	};
	///
	var onMouseMove = function (event, state) {
		var bbox = conf.bbox;
		var points = conf.tracker;
		var touches = event.changedTouches || getCoords(event);
		var length = touches.length;
		// Update tracker coordinates.
		for (var i = 0; i < length; i ++) {
			var touch = touches[i];
			var sid = touch.identifier || 0;
			var pt = points[sid];
			// Check whether "pt" is used by another gesture.
			if (!pt) continue; 
			// Find the actual coordinates.
			pt.move.x = (touch.pageX + bbox.scrollLeft - bbox.x1) * bbox.scaleX;
			pt.move.y = (touch.pageY + bbox.scrollTop - bbox.y1) * bbox.scaleY;
		}
		///
		if (conf.fingers < conf.minFingers) return;
		///
		var touches = [];
		var scale = 0;
		var rotation = 0;
		/// Calculate centroid of gesture.
		var centroidx = 0;
		var centroidy = 0;
		var length = 0;
		for (var sid in points) {
			var touch = points[sid];
			if (touch.up) continue;
			centroidx += touch.move.x;
			centroidy += touch.move.y;
			length ++;
		}
		centroidx /= length;
		centroidy /= length;
		///
		for (var sid in points) {
			var touch = points[sid];
			if (touch.up) continue;
			var start = touch.start;
			if (!start.distance) {
				var dx = start.x - centroidx;
				var dy = start.y - centroidy;
				start.distance = Math.sqrt(dx * dx + dy * dy);
				start.angle = Math.atan2(dx, dy) / RAD_DEG;
			}
			// Calculate scale.
			var dx = touch.move.x - centroidx;
			var dy = touch.move.y - centroidy;
			var distance = Math.sqrt(dx * dx + dy * dy);
			scale += distance / start.distance;
			// Calculate rotation.
			var angle = Math.atan2(dx, dy) / RAD_DEG;
			var rotate = (start.angle - angle + 360) % 360 - 180;
			touch.DEG2 = touch.DEG1; // Previous degree.
			touch.DEG1 = rotate > 0 ? rotate : -rotate; // Current degree.
			if (typeof(touch.DEG2) !== "undefined") {
				if (rotate > 0) {
					touch.rotation += touch.DEG1 - touch.DEG2;
				} else {
					touch.rotation -= touch.DEG1 - touch.DEG2;
				}
				rotation += touch.rotation;
			}
			// Attach current points to self.
			touches.push(touch.move);
		}
		///
		self.touches = touches;
		self.fingers = conf.fingers;
		self.scale = scale / conf.fingers;
		self.rotation = rotation / conf.fingers;
		self.state = "change";
		conf.listener(event, self);
	};
	var onMouseUp = function(event) {
		// Remove tracking for touch.
		var fingers = conf.fingers;
		if (TouchEnd(event, conf)) {
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
		}
		// Check whether fingers has dropped below minFingers.
		if (fingers === conf.minFingers && conf.fingers < conf.minFingers) {
			self.fingers = conf.fingers;
			self.state = "end";
			conf.listener(event, self);
		}
	};
	// Attach events.
	Event.add(conf.target, "mousedown", onMouseDown);
	// Return this object.
	return self;
};

/*
	"Swipe" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: snap, threshold, maxFingers.
	----------------------------------------------------
	Event.add(window, "swipe", function(event, self) {
		console.log(self.velocity, self.angle);
	});
*/

root.swipe = function(conf) {
	conf.doc = conf.target.ownerDocument || conf.target;
	conf.snap = conf.snap || 90; // angle snap.
	conf.threshold = conf.threshold || 1; // velocity threshold.
	conf.minFingers = conf.minFingers || 1;
	conf.maxFingers = conf.maxFingers || 5;
	// Externally accessible data.
	var self = {
		type: "swipe",
		target: conf.target,
		listener: conf.listener,
		remove: function() {
			Event.remove(conf.target, "mousedown", onMouseDown);
		}
	};
	// Tracking the events.
	var onMouseDown = function (event) {
		if (TouchStart(event, conf)) {
			Event.add(conf.doc, "mousemove", onMouseMove).listener(event);
			Event.add(conf.doc, "mouseup", onMouseUp);
		}
	};
	var onMouseMove = function (event) {
		var touches = event.changedTouches || getCoords(event);
		var length = touches.length;
		for (var i = 0; i < length; i ++) {
			var touch = touches[i];
			var sid = touch.identifier || 0;
			var o = conf.tracker[sid];
			// Identifier defined outside of listener.
			if (!o) continue; 
			o.move.x = touch.pageX;
			o.move.y = touch.pageY;
			o.moveTime = (new Date).getTime();
		}
	};
	var onMouseUp = function(event) {
		if (TouchEnd(event, conf)) {
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
			///
			var velocity1;
			var velocity2
			var degree1;
			var degree2;
			for (var sid in conf.tracker) {
				var touch = conf.tracker[sid];
				var xdist = touch.move.x - touch.start.x;
				var ydist = touch.move.y - touch.start.y;
				var distance = Math.sqrt(xdist * xdist + ydist * ydist);
				var ms = touch.moveTime - touch.startTime;
				var degree2 = Math.atan2(xdist, ydist) / RAD_DEG + 180;
				var velocity2 = ms ? distance / ms : 0;
				if (typeof(degree1) === "undefined") {
					degree1 = degree2;
					velocity1 = velocity2;
				} else if (Math.abs(degree2 - degree1) <= 20) {
					degree1 = (degree1 + degree2) / 2;
					velocity1 = (velocity1 + velocity2) / 2;
				} else {
					return;
				}
			}			
			if (velocity1 > conf.threshold) {
				self.angle = -((((degree1 / conf.snap + 0.5) >> 0) * conf.snap || 360) - 360);
				self.velocity = velocity1;
				self.fingers = conf.gestureFingers;
				conf.listener(event, self);
			}
		}
	};
	// Attach events.
	Event.add(conf.target, "mousedown", onMouseDown);
	// Return this object.
	return self;
};

/*
	"Tap" and "Tap-Hold" event proxy.
	----------------------------------------------------
	CONFIGURE: minhold, maxhold.
	----------------------------------------------------
	Event.add(window, "tap", function(event, self) {
		console.log(self.fingers);
	});
	----------------------------------------------------
	multi-finger tap // touch an target for <= 250ms.
	multi-finger taphold // touch an target for >= 500ms
*/

root.tap = 
root.taphold = function(conf) {
	conf.doc = conf.target.ownerDocument || conf.target;
	conf.minFingers = conf.minFingers || 1;
	conf.maxFingers = conf.maxFingers || Infinity; // Maximum allowed fingers.
	if (conf.type === "taphold" || conf.minhold) {
		conf.type = "taphold";
		conf.delay = conf.minhold || 500;
	} else {
		conf.type = "tap";
		conf.delay = conf.maxhold || 250;
	}
	// Externally accessible data.
	var self = {
		type: conf.type,
		target: conf.target,
		listener: conf.listener,
		remove: function() {
			Event.remove(conf.target, "mousedown", onMouseDown);
		}
	};
	// Setting up local variables.
	var timestamp, timeout;
	// Tracking the events.
	var onMouseDown = function (event) {
		if (TouchStart(event, conf)) {
			timestamp = (new Date).getTime();
			// Initialize event listeners.
			Event.add(conf.doc, "mousemove", onMouseMove).listener(event);
			Event.add(conf.doc, "mouseup", onMouseUp);
			// Make sure this is a "taphold" event.
			if (conf.type !== "taphold") return;
			timeout = setTimeout(function() {
				if (event.cancelBubble) return;
				// Make sure no fingers have been changed.
				var fingers = 0;
				for (var key in conf.tracker) {
					if (conf.tracker[key].end === true) return;
					if (conf.cancel) return;
					fingers ++;
				}
				// Send callback.
				self.state = "taphold";
				self.fingers = fingers;
				conf.listener(event, self);
			}, conf.delay);
		}
	};
	var onMouseMove = function (event) {
		var bbox = conf.bbox;
		var touches = event.changedTouches || getCoords(event);
		var length = touches.length;
		for (var i = 0; i < length; i ++) {
			var touch = touches[i];
			var sid = touch.identifier || 0;
			var o = conf.tracker[sid];
			if (!o) continue;
			var x = (touch.pageX + bbox.scrollLeft - bbox.x1) * bbox.scaleX;
			var y = (touch.pageY + bbox.scrollTop - bbox.y1) * bbox.scaleY;
			if (!(x > 0 && x < bbox.width && // Within target coordinates..
				  y > 0 && y < bbox.height &&
				  Math.abs(x - o.start.x) <= 25 && // Within drift deviance.
				  Math.abs(y - o.start.y) <= 25)) {
				// Cancel out this listener.
				Event.remove(conf.doc, "mousemove", onMouseMove);
				conf.cancel = true;
				return;
			}
		}
	};
	var onMouseUp = function(event) {
		if (TouchEnd(event, conf)) {
			clearTimeout(timeout);
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
			if (event.cancelBubble) return;
			// Callback release on taphold.
			if (conf.type === "taphold") {
				if (self.state === "taphold") {
					self.state = "release";
					conf.listener(event, self);
				}
				return;
			}
			// Cancel event due to movement.
			if (conf.cancel) return;
			// Ensure delay is within margins.
			if ((new Date).getTime() - timestamp > conf.delay) return;
			// Send callback.
			self.state = "tap";
			self.fingers = conf.gestureFingers;
			conf.listener(event, self);
		}
	};
	// Attach events.
	Event.add(conf.target, "mousedown", onMouseDown);
	// Return this object.
	return self;
};

/*
	"Double-Click" aka "Double-Tap" event proxy.
	----------------------------------------------------
	Event.add(window, "dblclick", function(event, self) {});
	----------------------------------------------------
	Touch an target twice for <= 700ms, with less than 15 pixel drift.
*/

root.dbltap =
root.dblclick = function(conf) {
	conf.doc = conf.target.ownerDocument || conf.target;
	conf.minFingers = conf.minFingers || 1;
	conf.maxFingers = conf.maxFingers || 1; // Maximum allowed fingers.
	// Externally accessible data.
	var self = {
		type: conf.type,
		target: conf.target,
		listener: conf.listener,
		remove: function() {
			Event.remove(conf.target, "mousedown", onMouseDown);
		}
	};
	// Setting up local variables.
	var delay = 700; // in milliseconds
	var time0, time1, timeout; 
	var touch0, touch1;
	// Tracking the events.
	var onMouseDown = function (event) {
		var touches = event.changedTouches || getCoords(event);
		if (time0 && !time1) { // Click #2
			touch1 = touches[0];
			time1 = (new Date).getTime() - time0;
		} else { // Click #1
			touch0 = touches[0];
			time0 = (new Date).getTime();
			time1 = 0;
			clearTimeout(timeout);
			timeout = setTimeout(function() {
				time0 = 0;
			}, delay);
		}
		if (TouchStart(event, conf)) {
			Event.add(conf.doc, "mousemove", onMouseMove).listener(event);
			Event.add(conf.doc, "mouseup", onMouseUp);
		}
	};
	var onMouseMove = function (event) {
		if (time0 && !time1) {
			var touches = event.changedTouches || getCoords(event);
			touch1 = touches[0];
		}
		var bbox = conf.bbox;
		var ax = (touch1.pageX + bbox.scrollLeft - bbox.x1) * bbox.scaleX;
		var ay = (touch1.pageY + bbox.scrollTop - bbox.y1) * bbox.scaleY;
		if (!(ax > 0 && ax < bbox.width && // Within target coordinates..
			  ay > 0 && ay < bbox.height &&
			  Math.abs(touch1.pageX - touch0.pageX) <= 25 && // Within drift deviance.
			  Math.abs(touch1.pageY - touch0.pageY) <= 25)) {
			// Cancel out this listener.
			Event.remove(conf.doc, "mousemove", onMouseMove);
			clearTimeout(timeout);
			time0 = time1 = 0;
		}
	};
	var onMouseUp = function(event) {
		if (TouchEnd(event, conf)) {
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
		}
		if (time0 && time1) {
			if (time1 <= delay && !event.cancelBubble) {
				self.state = conf.type;
				conf.listener(event, self);
			}
			clearTimeout(timeout);
			time0 = time1 = 0;
		}
	};
	// Attach events.
	Event.add(conf.target, "mousedown", onMouseDown);
	// Return this object.
	return self;
};

/*
	"Click" event proxy.
	----------------------------------------------------
	Event.add(window, "click", function(event, self) {});
*/

root.click = function(conf) {
	conf.doc = conf.target.ownerDocument || conf.target;
	conf.minFingers = conf.minFingers || 1;
	conf.maxFingers = conf.maxFingers || 1; // Maximum allowed fingers.
	// Externally accessible data.
	var self = {
		type: "click",
		target: conf.target,
		listener: conf.listener,
		add: function() {
			Event.add(conf.target, "mousedown", onMouseDown);
		},
		remove: function() {
			Event.remove(conf.target, "mousedown", onMouseDown);
		}
	};
	// Setting up local variables.
	var event;
	// Tracking the events.
	var onMouseDown = function (e) {
		if (TouchStart(e, conf)) {
			Event.add(conf.doc, "mousemove", onMouseMove).listener(e);
			Event.add(conf.doc, "mouseup", onMouseUp);
		}
	};
	var onMouseMove = function (e) {
		event = e;
	};
	var onMouseUp = function(e) {
		if (TouchEnd(e, conf)) {
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
			if (event.cancelBubble) return;
			var touches = event.changedTouches || getCoords(event);
			var touch = touches[0];
			var bbox = conf.bbox;
			var newbbox = root.getBoundingBox(conf.target);
			var ax = (touch.pageX + bbox.scrollLeft - bbox.x1) * bbox.scaleX;
			var ay = (touch.pageY + bbox.scrollTop - bbox.y1) * bbox.scaleY;
			if (ax > 0 && ax < bbox.width && // Within target coordinates.
				ay > 0 && ay < bbox.height &&
				bbox.scrollTop === newbbox.scrollTop) {
				conf.listener(event, self);
			}
		}
	};
	// Attach events.
	Event.add(conf.target, "mousedown", onMouseDown);
	// Return this object.
	return self;
};

/*
	"Device Motion" and "Shake" event proxy.
	----------------------------------------------------
	http://developer.android.com/reference/android/hardware/SensorEvent.html#values
	----------------------------------------------------
	Event.add(window, "shake", function(event, self) {});
	Event.add(window, "devicemotion", function(event, self) {
		console.log(self.acceleration, self.accelerationIncludingGravity);
	});
*/

root.shake =
root.devicemotion = function(conf) {
	// Externally accessible data.
	var self = {
		type: "devicemotion",
		acceleration: {},
		accelerationIncludingGravity: {},
		target: conf.target,
		listener: conf.listener,
		remove: function() {
			window.removeEventListener('devicemotion', onDeviceMotion, false);
		}
	};
	// Setting up local variables.
	var threshold = 4; // Gravitational threshold.
	var timeout = 1000; // Timeout between shake events.
	var timeframe = 200; // Time between shakes.
	var shakes = 3; // Minimum shakes to trigger event.
	var lastShake = (new Date).getTime();
	var gravity = { x: 0, y: 0, z: 0 };
	var delta = {
		x: { count: 0, value: 0 },
		y: { count: 0, value: 0 },
		z: { count: 0, value: 0 }
	};
	// Tracking the events.
	var onDeviceMotion = function(e) {
		var alpha = 0.8; // Low pass filter.
		var o = e.accelerationIncludingGravity;
		gravity.x = alpha * gravity.x + (1 - alpha) * o.x;
		gravity.y = alpha * gravity.y + (1 - alpha) * o.y;
		gravity.z = alpha * gravity.z + (1 - alpha) * o.z; 
		self.accelerationIncludingGravity = gravity;
		self.acceleration.x = o.x - gravity.x;
		self.acceleration.y = o.y - gravity.y;
		self.acceleration.z = o.z - gravity.z;
		///
		if (conf.type === "devicemotion") {
			return conf.listener(e, self);
		} 
		var data = "xyz";
		var now = (new Date).getTime();
		for (var n = 0; n < data.length; n ++) {
			var letter = data[n];
			var ACCELERATION = self.acceleration[letter];
			var DELTA = delta[letter];
			var abs = Math.abs(ACCELERATION);
			/// Check whether another shake event was recently registered.
			if (now - lastShake < timeout) continue;
			/// Check whether delta surpasses threshold.
			if (abs > threshold) {
				var idx = now * ACCELERATION / abs;
				var span = Math.abs(idx + DELTA.value);
				// Check whether last delta was registered within timeframe.
				if (DELTA.value && span < timeframe) {
					DELTA.value = idx;
					DELTA.count ++;
					// Check whether delta count has enough shakes.
					if (DELTA.count === shakes) {
						conf.listener(e, self);
						// Reset tracking.
						lastShake = now;
						DELTA.value = 0;
						DELTA.count = 0;
					}
				} else {
					// Track first shake.
					DELTA.value = idx;
					DELTA.count = 1;
				}
			}
		}
	};
	// Attach events.
	if (!window.addEventListener) return;
	window.addEventListener('devicemotion', onDeviceMotion, false);
	// Return this object.
	return self;
};

/*
	"Mouse Wheel" event proxy.
	----------------------------------------------------
	Event.add(window, "mousewheel_fix", function(event, self) {
		console.log(self.state, self.wheelDelta);
	});
*/

root.mousewheel = function(conf) {
	// Configure event listener.
	var timeout = conf.timeout || 150;
	// Externally accessible data.
	var self = {
		type: "mousewheel",
		state: "start",
		wheelDelta: 0,
		target: conf.target,
		listener: conf.listener,
		remove: function() {
			conf.target[remove](type, onMouseWheel, false);
		}
	};
	// Tracking the events.
	var onMouseWheel = function(event) {
		event = event || window.event;
		self.state = "wheel";
		self.wheelDelta = event.detail ? event.detail * -40 : event.wheelDelta;
		conf.listener(event, self);
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			self.state = "end";
			self.wheelDelta = 0;
			conf.listener(event, self);
		}, timeout);
	};
	// Attach events.
	var add = document.addEventListener ? "addEventListener" : "attachEvent";
	var remove = document.removeEventListener ? "removeEventListener" : "detachEvent";
	var type = Event.supports("mousewheel") ? "mousewheel" : "DOMMouseScroll";
	conf.target[add](type, onMouseWheel, false);
	// Return this object.
	return self;
};

//////// Helpers ////////

var TouchStart = function(event, conf) {
	var addTouchStart = function(touch, sid) {	
		conf.fingers ++;
		var bbox = conf.bbox;
		var x = (touch.pageX + bbox.scrollLeft - bbox.x1) * bbox.scaleX;
		var y = (touch.pageY + bbox.scrollTop - bbox.y1) * bbox.scaleY;
		var o = track[sid] = {};
		o.rotation = 0;
		o.scale = 1;
		o.startTime = o.moveTime = (new Date).getTime();
		o.move = { x: x, y: y };
		o.start = { x: x, y: y };
		o.offsetX = 0;
		o.offsetY = 0;
		if (!conf.position) return;
		switch(conf.position) {
			case "absolute": // Absolute from within window.
				o.offsetX = 0;
				o.offsetY = 0;
				break;
			case "relative": // Relative from within target.
				o.offsetX = bbox.x1;
				o.offsetY = bbox.y1;
				break;
			case "difference": // Relative from origin.
				o.offsetX = touch.pageX;
				o.offsetY = touch.pageY;
				break;
			case "move": // Move target element.
				o.offsetX = touch.pageX - bbox.x1;
				o.offsetY = touch.pageY - bbox.y1;
				break;
		}
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

var TouchEnd = function(event, conf, callback) {
	// Record changed touches have ended (iOS changedTouches is not reliable).
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

//////// Utilities ////////

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

return root;

})({});

//////////

Event.coords = function(event) {
	if ("ontouchstart" in window) { // Mobile browsers.
		var pX = 0;
		var pY = 0;
		Event.coords = function(event) {
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
		Event.coords = function(event) {
			return {
				x: event.pageX,
				y: event.pageY
			};
		};
	} else { // Internet Explorer <=8.0
		Event.coords = function(event) {
			event = event || window.event;
			return {
				x: event.clientX + document.documentElement.scrollLeft,
				y: event.clientY + document.documentElement.scrollTop
			};
		};
	}
	return Event.coords(event);
};