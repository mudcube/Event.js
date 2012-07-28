/*
	----------------------------------------------------
	Event.js : 1.0.1 : 2012/07/14 : MIT License
	----------------------------------------------------
	https://github.com/mudcube/Event.js
	----------------------------------------------------
	1  : click, dblclick, dbltap
	1+ : tap, taphold, drag, swipe
	2+ : pinch, rotate
	   : mousewheel, devicemotion, shake
	----------------------------------------------------
	//* There are two ways to add events with this library.
	target.addEventListener(); // Retains "this" attribute as target, and addEventListener.
	Event.add(); // Attempts to be as fast as possible.
	----------------------------------------------------
	//* turns addEventListener prototyping on/off.
	Event.prototyped = true;
	----------------------------------------------------
	//* Single listener.
	/// optional configuration.
	var configure = {
		fingers: 1, // listen for one finger only.
		snap: 90 // snap to 90 degree intervals.
	};
	
	/// adding with addEventListener()
	target.addEventListener("swipe", function(event) {
		console.log(event.velocity, event.angle, event.fingers);
	}, configure);
	
	/// adding with Event.add()
	Event.add("swipe", function(event, self) {
		console.log(self.velocity, self.angle, self.fingers);
	}, configure);
	----------------------------------------------------
	//* Multiple listeners glued together.
	/// adding with addEventListener()
	target.addEventListener("click swipe", function(event) { });

	/// adding with Event.add()
	Event.add(target, "click swipe", function(event, self) { });
	----------------------------------------------------
	//* Multiple listeners bound to one callback w/ single configuration.
	var bindings = Event.add({
		target: target,
		type: "click swipe",
		snap: 90, // snap to 90 degree intervals.
		minFingers: 2, // minimum required fingers to start event.
		maxFingers: 4, // maximum fingers in one event.
		listener: function(event, self) {
			console.log(self.type); // will be click or swipe.
			console.log(self.x);
			console.log(self.y);
			console.log(self.identifier);
			console.log(self.start);
			console.log(self.fingers); // somewhere between "2" and "4".
			self.disable(); // disable event.
			self.enable(); // enable event.
			self.remove(); // remove event.
		}
	});
	----------------------------------------------------
	//* Multiple listeners bound to multiple callbacks w/ single configuration.
	var bindings = Event.add({
		target: target,
		minFingers: 1,
		maxFingers: 12,
		listeners: {
			click: function(event, self) {
				self.remove(); // removes this click listener.
			},
			swipe: function(event, self) {
				binding.remove(); // removes both the click + swipe listeners.
			}
		}
	});
	----------------------------------------------------
	//* Multiple listeners bound to multiple callbacks w/ multiple configurations.
	var binding = Event.add({
		target: target,
		listeners: {
			taphold: {
				fingers: 1,
				wait: 250, // milliseconds
				listener: function(event, self) {
					console.log(self.fingers); // "1" finger.
				}
			},
			drag: {
				fingers: 3,
				position: "relative", // "relative", "absolute", "difference", "move"
				listener: function(event, self) {
					console.log(self.fingers); // "3" fingers.
					console.log(self.x); // coordinate is relative to edge of target.
				}
			}
		}
	});
	----------------------------------------------------
	//* Capturing an event and manually forwarding it to a proxy (tiered events).
	Event.add(target, "down", function(event, self) {
		var x = event.pageX; // local variables that wont change.
		var y = event.pageY;
		Event.proxy.drag({
			event: event,
			target: target,
			listener: function(event, self) {
				console.log(x - event.pageX); // measure movement.
				console.log(y - event.pageY);
			}
		});
	});
	----------------------------------------------------
	//* Event proxies.
	Event.add(window, "click", function(event, self) {
		console.log(self.type, self.x, self.y);
	});
	Event.add(window, "dblclick", function(event, self) {
		console.log(self.type, self.x, self.y);
	});
	Event.add(window, "drag", function(event, self) {
		console.log(self.type, self.fingers, self.state, self.start, self.x, self.y, self.bbox);
	});
	Event.add(window, "gesture", function(event, self) {
		console.log(self.type, self.fingers, self.state, self.rotation, self.scale);
	});
	Event.add(window, "shake", function(event, self) {
		console.log(self.type, self.acceleration, self.accelerationIncludingGravity);
	});
	Event.add(window, "devicemotion", function(event, self) {
		console.log(self.type, self.acceleration, self.accelerationIncludingGravity);
	});
	Event.add(window, "swipe", function(event, self) {
		console.log(self.type, self.fingers, self.velocity, self.angle);
	});
	Event.add(window, "tap", function(event, self) {
		console.log(self.type, self.fingers);
	});
	Event.add(window, "wheel", function(event, self) {
		console.log(self.type, self.state, self.wheelDelta);
	});
	----------------------------------------------------
	//* Listen for selectors to become available.
	Event.add("body div#test", "ready", callback);
	----------------------------------------------------
	Event.stop(event); // stop bubble.
	Event.prevent(event); // prevent default.
	Event.cancel(event); // stop and prevent.
	----------------------------------------------------
	//* Track for proper command/control-key for Mac/PC.
	Event.add(window, "keyup keydown", Event.keyTracker);
	console.log(Event.metaKey);
	----------------------------------------------------
	//* Test for event features, in this example Drag & Drop file support.
	console.log(Event.supports('dragstart') && Event.supports('drop') && !!window.FileReader);
	----------------------------------------------------

*/

if (typeof(Event) === "undefined") var Event = {};

(function(root) { "use strict";

root.add = function(target, type, listener, conf) {
	return handleEvent(target, type, listener, "add", conf);
};

root.remove = function(target, type, listener, conf) {
	return handleEvent(target, type, listener, "remove", conf);
};

root.stop = function(event) {
	if (event.stopPropagation) event.stopPropagation();
	event.cancelBubble = true; // <= IE8
	event.bubble = 0;
};

root.prevent = function(event) {
	if (event.preventDefault) event.preventDefault();
	event.returnValue = false; // <= IE8
};

root.cancel = function(event) {
	root.stop(event);
	root.prevent(event);
};

// Check to see whether event exists (via @kangax)
root.supports = function (target, type) {
	if (typeof(target) === "string") {
		type = target;
		target = window;
	}
	type = "on" + type;
	if (type in target) return true;
	if (!target.setAttribute) target = document.createElement("div");
	if (target.setAttribute && target.removeAttribute) {
		target.setAttribute(type, "");
		var isSupported = typeof target[type] === "function";
		if (typeof target[type] !== "undefined") target[type] = undefined;
		target.removeAttribute(type);
		return isSupported;
	}
};

/// Expose special key commands.
(function() {
	var agent = navigator.userAgent.toLowerCase();
	var mac = agent.indexOf("macintosh") !== -1;
	if (mac && agent.indexOf("khtml") !== -1) { // chrome, safari
		var codes = { 91: true, 93: true };
	} else if (mac && agent.indexOf("firefox") !== -1) {  // mac firefox
		var codes = { 224: true };
	} else { // windows, linux, or mac opera
		var codes = { 17: true };
	}
	///
	root.metaTracker = function(event) {
		if (codes[event.keyCode]) {
			root.metaKey = event.type === "keydown";
		}
	};
})();

/// Detect custom event listeners.
var isEventProxy = (function () {
	var events = {};
	var types = [];
	types.push("click");
	types.push("dblclick");
	types.push("dbltap");
	types.push("drag");
	types.push("gesture");
	types.push("shake");
	types.push("swipe");
	types.push("tap");
	types.push("taphold");
	types.push("devicemotion");
	types.push("mousewheel");
	for (var n = 0, length = types.length; n < length; n ++) {
		events[types[n]] = true;
	}
	return events; 
})();

/// Handle naming discrepancies.
var touch = root.supports("touchstart") ? {
	"mousedown": "touchstart",
	"mouseup": "touchend",
	"mousemove": "touchmove"
} : { };

var mspointer = window.navigator.msPointerEnabled ? {
	"mousedown": "MSPointerDown",
	"mousemove": "MSPointerMove",
	"mouseup": "MSPointerUp"
} : { };

var shorthand = {
	"down": "mousedown", 
	"up": "mouseup", 
	"move": "mousemove"
};

var normalize = function(type) {
	if (shorthand[type]) type = shorthand[type];
	if (touch[type]) type = touch[type];
	if (mspointer[type]) type = mspointer[type];
	if (!document.addEventListener) { // IE
		return "on" + type;
	} else { // 
		return type;
	}
};

/// Event listeners.
var handleEvent = function(target, type, listener, trigger, conf) {
	// Check for element to load on interval (before onload).
	if (typeof(target) === "string" && type === "ready") {
		var interval = setInterval(function() {
			if (document.querySelector(target)) {
				clearInterval(interval);
				listener();
			}
		}, 1000 / 60);
		return;
	}
	if (typeof(target) === "string") {
		target = document.querySelector(target);
	}
	// Check for multiple events in one string.
	if (type.indexOf && type.indexOf(" ") !== -1) type = type.split(" ");
	if (type.indexOf && type.indexOf(",") !== -1) type = type.split(",");
	// Attach or remove multiple events associated with a target.
	if (typeof(type) !== "string") { // Has multiple events.
		var events = {};
		if (typeof(type.length) === "number") { // Has multiple listeners glued together.
			for (var n = 0, length = type.length; n < length; n ++) { // Array[]
				var event = handleEvent(target, type[n], listener, trigger);
				if (event) events[type[n]] = event;
			}
		} else { // Has multiple listeners.
			for (var key in type) { // Object{}
				var event = handleEvent(target, key, type[key], trigger);
				if (event) events[key] = event;
			}
		}
		return {
			remove: function() { // Remove multiple events.
				var events = that.events;
				for (var key in events) events[key].remove();
			},
			add: function() { // Add multiple events.
				var events = that.events;
				for (var key in events) events[key].add();
			}
		};
	}
	// Ensure listener is a function.
	if (typeof(listener) !== "function") return;
	// Generate a unique wrapper identifier.
	var id = normalize(type) + getID(target) + "." + getID(listener);
	// Handle the event.
	if (isEventProxy[type]) { // Fire custom event.
		if (trigger === "remove") { // Remove event listener.
			if (!wrappers[id]) return;
			wrappers[id].remove();
			delete wrappers[id];
		} else if (trigger === "add") { // Attach event listener.
			if (wrappers[id]) return wrappers[id]; // Already attached.
			conf = conf || {};
			conf.type = type;
			conf.target = target;
			conf.listener = listener;
			wrappers[id] = root.proxy[type](conf);			
		}
	} else { // Fire native event.
		if (trigger === "remove") { // Remove event listener.
			if (!wrappers[id]) return;
			target[remove](normalize(type), wrappers[id].listener, false);		
			delete wrappers[id];
		} else if (trigger === "add") { // Attach event listener.
			if (wrappers[id]) return wrappers[id];
			target[add](normalize(type), listener, false);
			wrappers[id] = {
				type: type,
				target: target,
				listener: listener,
				remove: function() {
					root.remove(target, type, listener);
				}
			};				
		}
	}
	return wrappers[id];
};

/// Event wrappers, and associated variables.
var wrappers = {};
var counter = 0;
var getID = function(object) {
	if (object === window) return "#window";
	if (object === document) return "#document";
	if (!object) return console.log("Missing target on listener!");
	if (!object.uniqueID) object.uniqueID = "id" + counter ++;
	return object.uniqueID;
};

/// Detect proper native function.
var add = document.addEventListener ? "addEventListener" : "attachEvent";
var remove = document.removeEventListener ? "removeEventListener" : "detachEvent";

})(Event);
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
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

root.gestureStart = function(event, conf) {
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

root.gestureEnd = function(event, conf, callback) {
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
/*
	"Click" event proxy.
	----------------------------------------------------
	Event.add(window, "click", function(event, self) {});
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

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
		if (root.gestureStart(e, conf)) {
			Event.add(conf.doc, "mousemove", onMouseMove).listener(e);
			Event.add(conf.doc, "mouseup", onMouseUp);
		}
	};
	var onMouseMove = function (e) {
		event = e;
	};
	var onMouseUp = function(e) {
		if (root.gestureEnd(e, conf)) {
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
			if (event.cancelBubble && ++event.bubble > 1) return;
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

return root;

})(Event.proxy);
/*
	"Double-Click" aka "Double-Tap" event proxy.
	----------------------------------------------------
	Event.add(window, "dblclick", function(event, self) {});
	----------------------------------------------------
	Touch an target twice for <= 700ms, with less than 15 pixel drift.
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

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
		if (root.gestureStart(event, conf)) {
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
		if (root.gestureEnd(event, conf)) {
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
		}
		if (time0 && time1) {
			if (time1 <= delay && !(event.cancelBubble && ++event.bubble > 1)) {
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

return root;

})(Event.proxy);
/*
	"Drag" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: maxFingers, position.
	----------------------------------------------------
	Event.add(window, "drag", function(event, self) {
		console.log(self.type, self.state, self.start, self.x, self.y, self.bbox);
	});
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

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
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
		},
		disable: function(d) {
			if (!d || d.move) Event.remove(conf.doc, "mousemove", onMouseMove);
			if (!d || d.up) Event.remove(conf.doc, "mouseup", onMouseUp);
			conf.fingers = 0;
		},
		enable: function(d) {
			if (!d || d.move) Event.add(conf.doc, "mousemove", onMouseMove);
			if (!d || d.move) Event.add(conf.doc, "mouseup", onMouseUp);
			conf.fingers = 1;
		}
	};
	// Tracking the events.
	var onMouseDown = function (event) {
		if (root.gestureStart(event, conf)) {
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
		if (root.gestureEnd(event, conf, onMouseMove)) {
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

return root;

})(Event.proxy);
/*
	"Gesture" event proxy (2+ fingers).
	----------------------------------------------------
	CONFIGURE: minFingers, maxFingers.
	----------------------------------------------------
	Event.add(window, "gesture", function(event, self) {
		console.log(self.rotation, self.scale, self.fingers, self.state);
	});
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

var RAD_DEG = Math.PI / 180;

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
		if (root.gestureStart(event, conf)) {
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
		if (root.gestureEnd(event, conf)) {
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

return root;

})(Event.proxy);
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

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

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

return root;

})(Event.proxy);
/*
	"Swipe" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: snap, threshold, maxFingers.
	----------------------------------------------------
	Event.add(window, "swipe", function(event, self) {
		console.log(self.velocity, self.angle);
	});
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

var RAD_DEG = Math.PI / 180;

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
		if (root.gestureStart(event, conf)) {
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
		if (root.gestureEnd(event, conf)) {
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

return root;

})(Event.proxy);
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

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

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
		if (root.gestureStart(event, conf)) {
			timestamp = (new Date).getTime();
			// Initialize event listeners.
			Event.add(conf.doc, "mousemove", onMouseMove).listener(event);
			Event.add(conf.doc, "mouseup", onMouseUp);
			// Make sure this is a "taphold" event.
			if (conf.type !== "taphold") return;
			timeout = setTimeout(function() {
				if (event.cancelBubble && ++event.bubble > 1) return;
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
		if (root.gestureEnd(event, conf)) {
			clearTimeout(timeout);
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
			if (event.cancelBubble && ++event.bubble > 1) return;
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

return root;

})(Event.proxy);
/*
	"Mouse Wheel" event proxy.
	----------------------------------------------------
	Event.add(window, "mousewheel_fix", function(event, self) {
		console.log(self.state, self.wheelDelta);
	});
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

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

return root;

})(Event.proxy);
/**
 * Gesture recognizer for the `doubletap` gesture.
 *
 * Taps happen when an element is pressed and then released.
 */
(function(exports) {
  var DOUBLETAP_TIME = 300;

  function pointerDown(e) {
    var now = new Date();
    if (now - this.lastDownTime < DOUBLETAP_TIME) {
      this.lastDownTime = 0;
      var payload = {};
      window._createCustomEvent('gesturedoubletap', e.target, payload);
    }
    this.lastDownTime = now;
  }

  /**
   * Make the specified element create gesturetap events.
   */
  function emitDoubleTaps(el) {
    el.addEventListener('pointerdown', pointerDown);
  }

  exports.Gesture._gestureHandlers.gesturedoubletap = emitDoubleTaps;

})(window);

(function(exports) {

  function synthesizeGestureEvents(type, listener, useCapture) {
    if (type.indexOf('gesture') === 0) {
      var handler = Gesture._gestureHandlers[type];
      if (handler) {
        handler(this);
      } else {
        console.error('Warning: no handler found for {{evt}}.'
                      .replace('{{evt}}', type));
      }
    }
  }

  // Note: Firefox doesn't work like other browsers... overriding HTMLElement
  // doesn't actually affect anything. Special case for Firefox:
  if (navigator.userAgent.match(/Firefox/)) {
    // TODO: fix this for the general case.
    window._augmentAddEventListener(HTMLDivElement, synthesizeGestureEvents);
    window._augmentAddEventListener(HTMLCanvasElement, synthesizeGestureEvents);
  } else {
    window._augmentAddEventListener(HTMLElement, synthesizeGestureEvents);
  }

  exports.Gesture = exports.Gesture || {};
  exports.Gesture._gestureHandlers = exports.Gesture._gestureHandlers || {};

})(window);

// Source:
// https://github.com/slightlyoff/cassowary-js-refactor/blob/master/src/c.js#L10-23
// For Safari 5.x. Go-go-gadget ridiculously long release cycle!
try {
  (function(){}).bind(scope);
} catch (e) {
  Object.defineProperty(Function.prototype, "bind", {
    value: function(scope) {
      var f = this;
      return function() { return f.apply(scope, arguments); };
    },
    enumerable: false,
    configurable: true,
    writable: true
  });
}


/* Modernizr 2.5.3 (Custom Build) | MIT & BSD
 * Build: http://www.modernizr.com/download/#-touch-teststyles-prefixes
 */

window.Modernizr = (function (window, document, undefined) {
	var version = '2.5.3',
		Modernizr = {},
		docElement = document.documentElement,
		mod = 'modernizr',
		modElem = document.createElement(mod),
		mStyle = modElem.style,
		inputElem,
		toString = {}.toString,
		prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),
		tests = {},
		inputs = {},
		attrs = {},
		classes = [],
		slice = classes.slice,
		featureName,
		injectElementWithStyles = function (rule, callback, nodes, testnames) {
			var style, ret, node,
			div = document.createElement('div'),
				body = document.body,
				fakeBody = body ? body : document.createElement('body');
			if (parseInt(nodes, 10)) {
				while (nodes--) {
					node = document.createElement('div');
					node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
					div.appendChild(node);
				}
			}
			style = ['&#173;', '<style>', rule, '</style>'].join('');
			div.id = mod;
			(body ? div : fakeBody).innerHTML += style;
			fakeBody.appendChild(div);
			if (!body) {
				fakeBody.style.background = "";
				docElement.appendChild(fakeBody);
			}
			ret = callback(div, rule);
			!body ? fakeBody.parentNode.removeChild(fakeBody) : div.parentNode.removeChild(div);
			return !!ret;
		},
		_hasOwnProperty = ({}).hasOwnProperty,
		hasOwnProperty;
	if (!is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined')) {
		hasOwnProperty = function (object, property) {
			return _hasOwnProperty.call(object, property);
		};
	} else {
		hasOwnProperty = function (object, property) {
			return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
		};
	}
	if (!Function.prototype.bind) {
		Function.prototype.bind = function bind(that) {
			var target = this;
			if (typeof target != "function") {
				throw new TypeError();
			}
			var args = slice.call(arguments, 1),
				bound = function () {
					if (this instanceof bound) {
						var F = function () {};
						F.prototype = target.prototype;
						var self = new F;
						var result = target.apply(
						self,
						args.concat(slice.call(arguments)));
						if (Object(result) === result) {
							return result;
						}
						return self;
					} else {
						return target.apply(
						that,
						args.concat(slice.call(arguments)));
					}
				};
			return bound;
		};
	}

	function setCss(str) {
		mStyle.cssText = str;
	}

	function is(obj, type) {
		return typeof obj === type;
	}
	var testBundle = (function (styles, tests) {
		var style = styles.join(''),
			len = tests.length;
		injectElementWithStyles(style, function (node, rule) {
			var style = document.styleSheets[document.styleSheets.length - 1],
				cssText = style ? (style.cssRules && style.cssRules[0] ? style.cssRules[0].cssText : style.cssText || '') : '',
				children = node.childNodes,
				hash = {};
			while (len--) {
				hash[children[len].id] = children[len];
			}
			console.log(node)
			Modernizr['touch'] = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch || (hash['touch'] && hash['touch'].offsetTop) === 9;
		}, len, tests);
	})([, ['@media (', prefixes.join('touch-enabled),('), mod, ')', '{#touch{top:9px;position:absolute}}'].join('')], [, 'touch']);
	tests['touch'] = function () {
		return Modernizr['touch'];
	};
	for (var feature in tests) {
		if (hasOwnProperty(tests, feature)) {
			featureName = feature.toLowerCase();
			Modernizr[featureName] = tests[feature]();
			classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
		}
	}
	setCss('');
	modElem = inputElem = null;
	Modernizr._version = version;
	Modernizr._prefixes = prefixes;
	Modernizr.testStyles = injectElementWithStyles;
	return Modernizr;
})(this, this.document);;
/**
 * Gesture recognizer for the `longpress` gesture.
 *
 * Longpress happens when pointer is pressed and doesn't get released
 * for a while (without movement).
 */
(function(exports) {
  var LONGPRESS_TIME = 600;

  function pointerDown(e) {
    // Start a timer.
    this.longPressTimer = setTimeout(function() {
      payload = {};
      window._createCustomEvent('gesturelongpress', e.target, payload);
    }, LONGPRESS_TIME);
  }

  function pointerMove(e) {
    // TODO(smus): allow for small movement and still emit a longpress.
    clearTimeout(this.longPressTimer);
  }

  function pointerUp(e) {
    clearTimeout(this.longPressTimer);
  }

  /**
   * Make the specified element create gesturetap events.
   */
  function emitLongPresses(el) {
    el.addEventListener('pointerdown', pointerDown);
    el.addEventListener('pointermove', pointerMove);
    el.addEventListener('pointerup', pointerUp);
  }

  exports.Gesture._gestureHandlers.gesturelongpress = emitLongPresses;

})(window);

(function (exports) {

	var MOUSE_ID = Infinity;

	function Pointer(x, y, type, identifier) {
		this.x = x;
		this.y = y;
		this.type = type;
		this.identifier = identifier;
	};

	var PointerTypes = {
		TOUCH: 'touch',
		MOUSE: 'mouse'
	};

	/**
	 * Returns an array of all pointers currently on the screen.
	 */
	function getPointerList() {
		// Note: "this" is the element.
		var pointers = [];
		if (this.touchList) {
			for (var i = 0; i < this.touchList.length; i++) {
				var touch = this.touchList[i];
				var pointer = new Pointer(touch.pageX, touch.pageY, PointerTypes.TOUCH, touch.identifier);
				pointers.push(pointer);
			}
		}
		if (this.mouseEvent) {
			pointers.push(new Pointer(this.mouseEvent.pageX, this.mouseEvent.pageY, PointerTypes.MOUSE, MOUSE_ID));
		}
		return pointers;
	};

	function createCustomEvent(eventName, target, payload) {
		var event = document.createEvent('Event');
		event.initEvent(eventName, true, true);
		for (var k in payload) {
			event[k] = payload[k];
		}
		target.dispatchEvent(event);
	};

	/**
	 * Causes the passed in element to broadcast pointer events instead
	 * of mouse/touch/etc events.
	 */
	function emitPointers(el) {
		if (!el.isPointerEmitter) {
			// Latch on to all relevant events for this element.
			if (isTouch()) {
				el.addEventListener('touchstart', touchStartHandler);
				el.addEventListener('touchmove', touchMoveHandler);
				el.addEventListener('touchend', touchEndHandler);
			} else if (isPointer()) {
				el.addEventListener('MSPointerDown', pointerDownHandler);
				el.addEventListener('MSPointerMove', pointerMoveHandler);
				el.addEventListener('MSPointerUp', pointerUpHandler);
			} else {
				el.addEventListener('mousedown', mouseDownHandler);
				el.addEventListener('mousemove', mouseMoveHandler);
				el.addEventListener('mouseup', mouseUpHandler);
				// Necessary for the edge case that the mouse is down and you drag out of
				// the area.
				el.addEventListener('mouseout', mouseOutHandler);
			}
			el.isPointerEmitter = true;
		}
	};

	/*************** Mouse event handlers *****************/

	function mouseDownHandler(event) {
		event.preventDefault();
		event.target.mouseEvent = event;
		var payload = {
			pointerType: 'mouse',
			getPointerList: getPointerList.bind(this),
			originalEvent: event
		};
		createCustomEvent('pointerdown', event.target, payload);
	};

	function mouseMoveHandler(event) {
		event.preventDefault();
		event.target.mouseEvent = event;
		var payload = {
			pointerType: 'mouse',
			getPointerList: getPointerList.bind(this),
			originalEvent: event
		};
		createCustomEvent('pointermove', event.target, payload);
	};

	function mouseUpHandler(event) {
		event.preventDefault();
		event.target.mouseEvent = null;
		var payload = {
			pointerType: 'mouse',
			getPointerList: getPointerList.bind(this),
			originalEvent: event
		};
		createCustomEvent('pointerup', event.target, payload);
	};

	function mouseOutHandler(event) {
		event.preventDefault();
		event.target.mouseEvent = null;
	};

	/*************** Touch event handlers *****************/

	function touchStartHandler(event) {
		console.log('touchstart');
		event.preventDefault();
		touchEvent.target.touchList = touchEvent.targetTouches;
		var payload = {
			pointerType: 'touch',
			getPointerList: getPointerList.bind(this),
			originalEvent: event
		};
		createCustomEvent('pointerdown', event.target, payload);
	};

	function touchMoveHandler(event) {
		event.preventDefault();
		touchEvent.target.touchList = touchEvent.targetTouches;
		var payload = {
			pointerType: 'touch',
			getPointerList: getPointerList.bind(this),
			originalEvent: event
		};
		createCustomEvent('pointermove', event.target, payload);
	};

	function touchEndHandler(event) {
		event.preventDefault();
		touchEvent.target.touchList = touchEvent.targetTouches;
		var payload = {
			pointerType: 'touch',
			getPointerList: getPointerList.bind(this),
			originalEvent: event
		};
		createCustomEvent('pointerup', event.target, payload);
	};

	/*************** MSIE Pointer event handlers *****************/

	function pointerDownHandler(event) {
		log('pointerdown');
	};

	function pointerMoveHandler(event) {
		log('pointermove');
	};

	function pointerUpHandler(event) {
		log('pointerup');
	};

	/**
	 * @return {Boolean} Returns true iff this user agent supports touch events.
	 */
	function isTouch() {
		return Modernizr.touch;
	};

	/**
	 * @return {Boolean} Returns true iff this user agent supports MSIE pointer
	 * events.
	 */
	function isPointer() {
		return false;
		// TODO(smus): Implement support for pointer events.
		// return window.navigator.msPointerEnabled;
	};

	/**
	 * Option 1: Require emitPointers call on all pointer event emitters.
	 */
	//exports.pointer = {
	//  emitPointers: emitPointers,
	//};

	/**
	 * Option 2: Replace addEventListener with a custom version.
	 */
	function augmentAddEventListener(baseElementClass, customEventListener) {
		var oldAddEventListener = baseElementClass.prototype.addEventListener;
		baseElementClass.prototype.addEventListener = function (type, listener, useCapture) {
			customEventListener.call(this, type, listener, useCapture);
			oldAddEventListener.call(this, type, listener, useCapture);
		};
	};

	function synthesizePointerEvents(type, listener, useCapture) {
		if (type.indexOf('pointer') === 0) {
			emitPointers(this);
		}
	};

	// Note: Firefox doesn't work like other browsers... overriding HTMLElement
	// doesn't actually affect anything. Special case for Firefox:
	if (navigator.userAgent.match(/Firefox/)) {
		// TODO: fix this for the general case.
		augmentAddEventListener(HTMLDivElement, synthesizePointerEvents);
		augmentAddEventListener(HTMLCanvasElement, synthesizePointerEvents);
	} else {
		augmentAddEventListener(HTMLElement, synthesizePointerEvents);
	}

	exports._createCustomEvent = createCustomEvent;
	exports._augmentAddEventListener = augmentAddEventListener;
	exports.PointerTypes = PointerTypes;

})(window);
/**
 * Gesture recognizer for the `scale` gesture.
 *
 * Scale happens when two fingers are placed on the screen, and then
 * they move so the the distance between them is greater or less than a
 * certain threshold.
 */
(function(exports) {

  var SCALE_THRESHOLD = 0.2;

  function PointerPair(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  /**
   * Calculate the distance between the two pointers.
   */
  PointerPair.prototype.span = function() {
    var dx = this.p1.x - this.p2.x;
    var dy = this.p1.y - this.p2.y;
    return Math.sqrt(dx*dx + dy*dy);
  };

  /**
   * Given a reference pair, calculate the scale multiplier difference.
   */
  PointerPair.prototype.scaleSince = function(referencePair) {
    return this.span() / referencePair.span();
  };

  function pointerDown(e) {
    var pointerList = e.getPointerList();
    // If there are exactly two pointers down,
    if (pointerList.length == 2) {
      // Record the initial pointer pair.
      e.target.scaleReferencePair = new PointerPair(pointerList[0],
                                                    pointerList[1]);
    }
  }

  function pointerMove(e) {
    var pointerList = e.getPointerList();
    // If there are two pointers down, compare to the initial pointer pair.
    if (pointerList.length == 2 && e.target.scaleReferencePair) {
      var pair = new PointerPair(pointerList[0], pointerList[1]);
      // Compute the scaling value according to the difference.
      var scale = pair.scaleSince(e.target.scaleReferencePair);
      // If the movement is drastic enough:
      if (Math.abs(1 - scale) > SCALE_THRESHOLD) {
        // Create the scale event as a result.
        var payload = {
          scale: scale
        };
        window._createCustomEvent('gesturescale', e.target, payload);
      }
    }
  }

  function pointerUp(e) {
    e.target.scaleReferencePair = null;
  }

  /**
   * Make the specified element create gesturetap events.
   */
  function emitScale(el) {
    el.addEventListener('pointerdown', pointerDown);
    el.addEventListener('pointermove', pointerMove);
    el.addEventListener('pointerup', pointerUp);
  }

  exports.Gesture._gestureHandlers.gesturescale = emitScale;

})(window);

/* Modernizr 2.5.3 (Custom Build) | MIT & BSD
 * Build: http://www.modernizr.com/download/#-touch-teststyles-prefixes
 */



window.Modernizr = (function( window, document, undefined ) {

    var version = '2.5.3',

    Modernizr = {},


    docElement = document.documentElement,

    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    inputElem  ,


    toString = {}.toString,

    prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),



    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName, 


    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node,
          div = document.createElement('div'),
                body = document.body, 
                fakeBody = body ? body : document.createElement('body');

      if ( parseInt(nodes, 10) ) {
                      while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

                style = ['&#173;','<style>', rule, '</style>'].join('');
      div.id = mod;
          (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if(!body){
                fakeBody.style.background = "";
          docElement.appendChild(fakeBody);
      }

      ret = callback(div, rule);
        !body ? fakeBody.parentNode.removeChild(fakeBody) : div.parentNode.removeChild(div);

      return !!ret;

    },
    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProperty;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProperty = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProperty = function (object, property) { 
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }


    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F;

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    function setCss( str ) {
        mStyle.cssText = str;
    }

    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    function is( obj, type ) {
        return typeof obj === type;
    }

    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }


    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                            if (elem === false) return props[i];

                            if (is(item, 'function')){
                                return item.bind(elem || obj);
                }

                            return item;
            }
        }
        return false;
    }


    var testBundle = (function( styles, tests ) {
        var style = styles.join(''),
            len = tests.length;

        injectElementWithStyles(style, function( node, rule ) {
            var style = document.styleSheets[document.styleSheets.length - 1],
                                                    cssText = style ? (style.cssRules && style.cssRules[0] ? style.cssRules[0].cssText : style.cssText || '') : '',
                children = node.childNodes, hash = {};

            while ( len-- ) {
                hash[children[len].id] = children[len];
            }

                       Modernizr['touch'] = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch || (hash['touch'] && hash['touch'].offsetTop) === 9; 
                                }, len, tests);

    })([
                       ,['@media (',prefixes.join('touch-enabled),('),mod,')',
                                '{#touch{top:9px;position:absolute}}'].join('')           ],
      [
                       ,'touch'                ]);



    tests['touch'] = function() {
        return Modernizr['touch'];
    };



    for ( var feature in tests ) {
        if ( hasOwnProperty(tests, feature) ) {
                                    featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }
    setCss('');
    modElem = inputElem = null;


    Modernizr._version      = version;

    Modernizr._prefixes     = prefixes;

    Modernizr.testStyles    = injectElementWithStyles;
    return Modernizr;

})(this, this.document);
;

(function(exports) {

  // TODO(smus): Come up with a better solution for this. This is bad because
  // it might conflict with a touch ID. However, giving negative IDs is also
  // bad because of code that makes assumptions about touch identifiers being
  // positive integers.
  var MOUSE_ID = 31337;

  function Pointer(x, y, type, identifier) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.identifier = identifier;
  }

  var PointerTypes = {
    TOUCH: 'touch',
    MOUSE: 'mouse'
  };

  function setMouse(mouseEvent) {
    mouseEvent.target.mouseEvent = mouseEvent;
  }

  function unsetMouse(mouseEvent) {
    mouseEvent.target.mouseEvent = null;
  }

  function setTouch(touchEvent) {
    touchEvent.target.touchList = touchEvent.targetTouches;
  }

  /**
   * Returns an array of all pointers currently on the screen.
   */
  function getPointerList() {
    // Note: "this" is the element.
    var pointers = [];
    if (this.touchList) {
      for (var i = 0; i < this.touchList.length; i++) {
        var touch = this.touchList[i];
        var pointer = new Pointer(touch.pageX, touch.pageY,
                                  PointerTypes.TOUCH, touch.identifier);
        pointers.push(pointer);
      }
    }
    if (this.mouseEvent) {
      pointers.push(new Pointer(this.mouseEvent.pageX, this.mouseEvent.pageY,
                                  PointerTypes.MOUSE, MOUSE_ID));
    }
    return pointers;
  }

  function createCustomEvent(eventName, target, payload) {
    var event = document.createEvent('Event');
    event.initEvent(eventName, true, true);
    for (var k in payload) {
      event[k] = payload[k];
    }
    target.dispatchEvent(event);
  }

  /*************** Mouse event handlers *****************/

  function mouseDownHandler(event) {
    event.preventDefault();
    setMouse(event);
    var payload = {
      pointerType: 'mouse',
      getPointerList: getPointerList.bind(this),
      originalEvent: event
    };
    createCustomEvent('pointerdown', event.target, payload);
  }

  function mouseMoveHandler(event) {
    event.preventDefault();
    if (event.target.mouseEvent) {
      setMouse(event);
    }
    var payload = {
      pointerType: 'mouse',
      getPointerList: getPointerList.bind(this),
      originalEvent: event
    };
    createCustomEvent('pointermove', event.target, payload);
  }

  function mouseUpHandler(event) {
    event.preventDefault();
    unsetMouse(event);
    var payload = {
      pointerType: 'mouse',
      getPointerList: getPointerList.bind(this),
      originalEvent: event
    };
    createCustomEvent('pointerup', event.target, payload);
  }

  /*************** Touch event handlers *****************/

  function touchStartHandler(event) {
    console.log('touchstart');
    event.preventDefault();
    setTouch(event);
    var payload = {
      pointerType: 'touch',
      getPointerList: getPointerList.bind(this),
      originalEvent: event
    };
    createCustomEvent('pointerdown', event.target, payload);
  }

  function touchMoveHandler(event) {
    event.preventDefault();
    setTouch(event);
    var payload = {
      pointerType: 'touch',
      getPointerList: getPointerList.bind(this),
      originalEvent: event
    };
    createCustomEvent('pointermove', event.target, payload);
  }

  function touchEndHandler(event) {
    event.preventDefault();
    setTouch(event);
    var payload = {
      pointerType: 'touch',
      getPointerList: getPointerList.bind(this),
      originalEvent: event
    };
    createCustomEvent('pointerup', event.target, payload);
  }

  function mouseOutHandler(event) {
    event.preventDefault();
    unsetMouse(event);
  }

  /*************** MSIE Pointer event handlers *****************/

  function pointerDownHandler(event) {
    log('pointerdown');
  }

  function pointerMoveHandler(event) {
    log('pointermove');
  }

  function pointerUpHandler(event) {
    log('pointerup');
  }

  /**
   * Causes the passed in element to broadcast pointer events instead
   * of mouse/touch/etc events.
   */
  function emitPointers(el) {
    if (!el.isPointerEmitter) {
      // Latch on to all relevant events for this element.
      if (isTouch()) {
        el.addEventListener('touchstart', touchStartHandler);
        el.addEventListener('touchmove', touchMoveHandler);
        el.addEventListener('touchend', touchEndHandler);
      } else if (isPointer()) {
        el.addEventListener('MSPointerDown', pointerDownHandler);
        el.addEventListener('MSPointerMove', pointerMoveHandler);
        el.addEventListener('MSPointerUp', pointerUpHandler);
      } else {
        el.addEventListener('mousedown', mouseDownHandler);
        el.addEventListener('mousemove', mouseMoveHandler);
        el.addEventListener('mouseup', mouseUpHandler);
        // Necessary for the edge case that the mouse is down and you drag out of
        // the area.
        el.addEventListener('mouseout', mouseOutHandler);
      }

      el.isPointerEmitter = true;
    }
  }

  /**
   * @return {Boolean} Returns true iff this user agent supports touch events.
   */
  function isTouch() {
    return Modernizr.touch;
  }

  /**
   * @return {Boolean} Returns true iff this user agent supports MSIE pointer
   * events.
   */
  function isPointer() {
    return false;
    // TODO(smus): Implement support for pointer events.
    // return window.navigator.msPointerEnabled;
  }

  /**
   * Option 1: Require emitPointers call on all pointer event emitters.
   */
  //exports.pointer = {
  //  emitPointers: emitPointers,
  //};

  /**
   * Option 2: Replace addEventListener with a custom version.
   */
  function augmentAddEventListener(baseElementClass, customEventListener) {
    var oldAddEventListener = baseElementClass.prototype.addEventListener;
    baseElementClass.prototype.addEventListener = function(type, listener, useCapture) {
      customEventListener.call(this, type, listener, useCapture);
      oldAddEventListener.call(this, type, listener, useCapture);
    };
  }

  function synthesizePointerEvents(type, listener, useCapture) {
    if (type.indexOf('pointer') === 0) {
      emitPointers(this);
    }
  }

  // Note: Firefox doesn't work like other browsers... overriding HTMLElement
  // doesn't actually affect anything. Special case for Firefox:
  if (navigator.userAgent.match(/Firefox/)) {
    // TODO: fix this for the general case.
    augmentAddEventListener(HTMLDivElement, synthesizePointerEvents);
    augmentAddEventListener(HTMLCanvasElement, synthesizePointerEvents);
  } else {
    augmentAddEventListener(HTMLElement, synthesizePointerEvents);
  }

  exports._createCustomEvent = createCustomEvent;
  exports._augmentAddEventListener = augmentAddEventListener;
  exports.PointerTypes = PointerTypes;

})(window);

(function(exports) {

  function synthesizeGestureEvents(type, listener, useCapture) {
    if (type.indexOf('gesture') === 0) {
      var handler = Gesture._gestureHandlers[type];
      if (handler) {
        handler(this);
      } else {
        console.error('Warning: no handler found for {{evt}}.'
                      .replace('{{evt}}', type));
      }
    }
  }

  // Note: Firefox doesn't work like other browsers... overriding HTMLElement
  // doesn't actually affect anything. Special case for Firefox:
  if (navigator.userAgent.match(/Firefox/)) {
    // TODO: fix this for the general case.
    window._augmentAddEventListener(HTMLDivElement, synthesizeGestureEvents);
    window._augmentAddEventListener(HTMLCanvasElement, synthesizeGestureEvents);
  } else {
    window._augmentAddEventListener(HTMLElement, synthesizeGestureEvents);
  }

  exports.Gesture = exports.Gesture || {};
  exports.Gesture._gestureHandlers = exports.Gesture._gestureHandlers || {};

})(window);

/**
 * Gesture recognizer for the `doubletap` gesture.
 *
 * Taps happen when an element is pressed and then released.
 */
(function(exports) {
  var DOUBLETAP_TIME = 300;

  function pointerDown(e) {
    var now = new Date();
    if (now - this.lastDownTime < DOUBLETAP_TIME) {
      this.lastDownTime = 0;
      var payload = {
      };
      window._createCustomEvent('gesturedoubletap', e.target, payload);
    }
    this.lastDownTime = now;
  }

  /**
   * Make the specified element create gesturetap events.
   */
  function emitDoubleTaps(el) {
    el.addEventListener('pointerdown', pointerDown);
  }

  exports.Gesture._gestureHandlers.gesturedoubletap = emitDoubleTaps;

})(window);

/**
 * Gesture recognizer for the `longpress` gesture.
 *
 * Longpress happens when pointer is pressed and doesn't get released
 * for a while (without movement).
 */
(function(exports) {
  var LONGPRESS_TIME = 600;

  function pointerDown(e) {
    // Start a timer.
    this.longPressTimer = setTimeout(function() {
      payload = {};
      window._createCustomEvent('gesturelongpress', e.target, payload);
    }, LONGPRESS_TIME);
  }

  function pointerMove(e) {
    // TODO(smus): allow for small movement and still emit a longpress.
    clearTimeout(this.longPressTimer);
  }

  function pointerUp(e) {
    clearTimeout(this.longPressTimer);
  }

  /**
   * Make the specified element create gesturetap events.
   */
  function emitLongPresses(el) {
    el.addEventListener('pointerdown', pointerDown);
    el.addEventListener('pointermove', pointerMove);
    el.addEventListener('pointerup', pointerUp);
  }

  exports.Gesture._gestureHandlers.gesturelongpress = emitLongPresses;

})(window);

/**
 * Gesture recognizer for the `scale` gesture.
 *
 * Scale happens when two fingers are placed on the screen, and then
 * they move so the the distance between them is greater or less than a
 * certain threshold.
 */
(function(exports) {

  var SCALE_THRESHOLD = 0.2;

  function PointerPair(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  /**
   * Calculate the distance between the two pointers.
   */
  PointerPair.prototype.span = function() {
    var dx = this.p1.x - this.p2.x;
    var dy = this.p1.y - this.p2.y;
    return Math.sqrt(dx*dx + dy*dy);
  };

  /**
   * Given a reference pair, calculate the scale multiplier difference.
   */
  PointerPair.prototype.scaleSince = function(referencePair) {
    return this.span() / referencePair.span();
  };

  function pointerDown(e) {
    var pointerList = e.getPointerList();
    // If there are exactly two pointers down,
    if (pointerList.length == 2) {
      // Record the initial pointer pair.
      e.target.scaleReferencePair = new PointerPair(pointerList[0],
                                                    pointerList[1]);
    }
  }

  function pointerMove(e) {
    var pointerList = e.getPointerList();
    // If there are two pointers down, compare to the initial pointer pair.
    if (pointerList.length == 2 && e.target.scaleReferencePair) {
      var pair = new PointerPair(pointerList[0], pointerList[1]);
      // Compute the scaling value according to the difference.
      var scale = pair.scaleSince(e.target.scaleReferencePair);
      // If the movement is drastic enough:
      if (Math.abs(1 - scale) > SCALE_THRESHOLD) {
        // Create the scale event as a result.
        var payload = {
          scale: scale
        };
        window._createCustomEvent('gesturescale', e.target, payload);
      }
    }
  }

  function pointerUp(e) {
    e.target.scaleReferencePair = null;
  }

  /**
   * Make the specified element create gesturetap events.
   */
  function emitScale(el) {
    el.addEventListener('pointerdown', pointerDown);
    el.addEventListener('pointermove', pointerMove);
    el.addEventListener('pointerup', pointerUp);
  }

  exports.Gesture._gestureHandlers.gesturescale = emitScale;

})(window);

window.Modernizr=function(a,b,c){function v(a){i.cssText=a}function w(a,b){return v(l.join(a+";")+(b||""))}function x(a,b){return typeof a===b}function y(a,b){return!!~(""+a).indexOf(b)}function z(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:x(f,"function")?f.bind(d||b):f}return!1}var d="2.5.3",e={},f=b.documentElement,g="modernizr",h=b.createElement(g),i=h.style,j,k={}.toString,l=" -webkit- -moz- -o- -ms- ".split(" "),m={},n={},o={},p=[],q=p.slice,r,s=function(a,c,d,e){var h,i,j,k=b.createElement("div"),l=b.body,m=l?l:b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:g+(d+1),k.appendChild(j);return h=["&#173;","<style>",a,"</style>"].join(""),k.id=g,(l?k:m).innerHTML+=h,m.appendChild(k),l||(m.style.background="",f.appendChild(m)),i=c(k,a),l?k.parentNode.removeChild(k):m.parentNode.removeChild(m),!!i},t={}.hasOwnProperty,u;!x(t,"undefined")&&!x(t.call,"undefined")?u=function(a,b){return t.call(a,b)}:u=function(a,b){return b in a&&x(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(a){var b=this;if(typeof b!="function")throw new TypeError;var c=q.call(arguments,1),d=function(){if(this instanceof d){var e=function(){};e.prototype=b.prototype;var f=new e,g=b.apply(f,c.concat(q.call(arguments)));return Object(g)===g?g:f}return b.apply(a,c.concat(q.call(arguments)))};return d});var A=function(c,d){var f=c.join(""),g=d.length;s(f,function(c,d){var f=b.styleSheets[b.styleSheets.length-1],h=f?f.cssRules&&f.cssRules[0]?f.cssRules[0].cssText:f.cssText||"":"",i=c.childNodes,j={};while(g--)j[i[g].id]=i[g];e.touch="ontouchstart"in a||a.DocumentTouch&&b instanceof DocumentTouch||(j.touch&&j.touch.offsetTop)===9},g,d)}([,["@media (",l.join("touch-enabled),("),g,")","{#touch{top:9px;position:absolute}}"].join("")],[,"touch"]);m.touch=function(){return e.touch};for(var B in m)u(m,B)&&(r=B.toLowerCase(),e[r]=m[B](),p.push((e[r]?"":"no-")+r));return v(""),h=j=null,e._version=d,e._prefixes=l,e.testStyles=s,e}(this,this.document),function(a){function c(a,b,c,d){this.x=a,this.y=b,this.type=c,this.identifier=d}function e(a){a.target.mouseEvent=a}function f(a){a.target.mouseEvent=null}function g(a){a.target.touchList=a.targetTouches}function h(){var a=[];if(this.touchList)for(var e=0;e<this.touchList.length;e++){var f=this.touchList[e],g=new c(f.pageX,f.pageY,d.TOUCH,f.identifier);a.push(g)}return this.mouseEvent&&a.push(new c(this.mouseEvent.pageX,this.mouseEvent.pageY,d.MOUSE,b)),a}function i(a,b,c){var d=document.createEvent("Event");d.initEvent(a,!0,!0);for(var e in c)d[e]=c[e];b.dispatchEvent(d)}function j(a){a.preventDefault(),e(a);var b={pointerType:"mouse",getPointerList:h.bind(this),originalEvent:a};i("pointerdown",a.target,b)}function k(a){a.preventDefault(),a.target.mouseEvent&&e(a);var b={pointerType:"mouse",getPointerList:h.bind(this),originalEvent:a};i("pointermove",a.target,b)}function l(a){a.preventDefault(),f(a);var b={pointerType:"mouse",getPointerList:h.bind(this),originalEvent:a};i("pointerup",a.target,b)}function m(a){console.log("touchstart"),a.preventDefault(),g(a);var b={pointerType:"touch",getPointerList:h.bind(this),originalEvent:a};i("pointerdown",a.target,b)}function n(a){a.preventDefault(),g(a);var b={pointerType:"touch",getPointerList:h.bind(this),originalEvent:a};i("pointermove",a.target,b)}function o(a){a.preventDefault(),g(a);var b={pointerType:"touch",getPointerList:h.bind(this),originalEvent:a};i("pointerup",a.target,b)}function p(a){a.preventDefault(),f(a)}function q(a){log("pointerdown")}function r(a){log("pointermove")}function s(a){log("pointerup")}function t(a){a.isPointerEmitter||(u()?(a.addEventListener("touchstart",m),a.addEventListener("touchmove",n),a.addEventListener("touchend",o)):v()?(a.addEventListener("MSPointerDown",q),a.addEventListener("MSPointerMove",r),a.addEventListener("MSPointerUp",s)):(a.addEventListener("mousedown",j),a.addEventListener("mousemove",k),a.addEventListener("mouseup",l),a.addEventListener("mouseout",p)),a.isPointerEmitter=!0)}function u(){return Modernizr.touch}function v(){return!1}function w(a,b){var c=a.prototype.addEventListener;a.prototype.addEventListener=function(a,d,e){b.call(this,a,d,e),c.call(this,a,d,e)}}function x(a,b,c){a.indexOf("pointer")===0&&t(this)}var b=31337,d={TOUCH:"touch",MOUSE:"mouse"};navigator.userAgent.match(/Firefox/)?(w(HTMLDivElement,x),w(HTMLCanvasElement,x)):w(HTMLElement,x),a._createCustomEvent=i,a._augmentAddEventListener=w,a.PointerTypes=d}(window),function(a){function b(a,b,c){if(a.indexOf("gesture")===0){var d=Gesture._gestureHandlers[a];d?d(this):console.error("Warning: no handler found for {{evt}}.".replace("{{evt}}",a))}}navigator.userAgent.match(/Firefox/)?(window._augmentAddEventListener(HTMLDivElement,b),window._augmentAddEventListener(HTMLCanvasElement,b)):window._augmentAddEventListener(HTMLElement,b),a.Gesture=a.Gesture||{},a.Gesture._gestureHandlers=a.Gesture._gestureHandlers||{}}(window),function(a){function c(a){var c=new Date;if(c-this.lastDownTime<b){this.lastDownTime=0;var d={};window._createCustomEvent("gesturedoubletap",a.target,d)}this.lastDownTime=c}function d(a){a.addEventListener("pointerdown",c)}var b=300;a.Gesture._gestureHandlers.gesturedoubletap=d}(window),function(a){function c(a){this.longPressTimer=setTimeout(function(){payload={},window._createCustomEvent("gesturelongpress",a.target,payload)},b)}function d(a){clearTimeout(this.longPressTimer)}function e(a){clearTimeout(this.longPressTimer)}function f(a){a.addEventListener("pointerdown",c),a.addEventListener("pointermove",d),a.addEventListener("pointerup",e)}var b=600;a.Gesture._gestureHandlers.gesturelongpress=f}(window),function(a){function c(a,b){this.p1=a,this.p2=b}function d(a){var b=a.getPointerList();b.length==2&&(a.target.scaleReferencePair=new c(b[0],b[1]))}function e(a){var d=a.getPointerList();if(d.length==2&&a.target.scaleReferencePair){var e=new c(d[0],d[1]),f=e.scaleSince(a.target.scaleReferencePair);if(Math.abs(1-f)>b){var g={scale:f};window._createCustomEvent("gesturescale",a.target,g)}}}function f(a){a.target.scaleReferencePair=null}function g(a){a.addEventListener("pointerdown",d),a.addEventListener("pointermove",e),a.addEventListener("pointerup",f)}var b=.2;c.prototype.span=function(){var a=this.p1.x-this.p2.x,b=this.p1.y-this.p2.y;return Math.sqrt(a*a+b*b)},c.prototype.scaleSince=function(a){return this.span()/a.span()},a.Gesture._gestureHandlers.gesturescale=g}(window)
