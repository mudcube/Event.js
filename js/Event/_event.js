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
	REQUIREMENT: querySelector, querySelectorAll
	----------------------------------------------------
	//* There are two ways to add events with this library.
	target.addEventListener(); // Retains "this" attribute as target, and overrides native addEventListener.
	Event.add(); // Attempts to be as fast as possible.
	----------------------------------------------------
	//* turn addEventListener prototyping on/off.
	Event.prototype(true);
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
				wait: 500, // milliseconds
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
	//  type, fingers, state, start, x, y, position, bbox
	//  rotation, scale, velocity, angle, hold, cutoff
	----------------------------------------------------
	/// "Click" :: fingers, minFingers, maxFingers.
	Event.add(window, "click", function(event, self) {
		console.log(self.type, self.x, self.y);
	});
	/// "Double-Click" :: fingers, minFingers, maxFingers.
	Event.add(window, "dblclick", function(event, self) {
		console.log(self.type, self.x, self.y);
	});
	/// "Drag" :: fingers, maxFingers, position
	Event.add(window, "drag", function(event, self) {
		console.log(self.type, self.fingers, self.state, self.start, self.x, self.y, self.bbox);
	});
	/// "Gesture" :: fingers, minFingers, maxFingers.
	Event.add(window, "gesture", function(event, self) {
		console.log(self.type, self.fingers, self.state, self.rotation, self.scale);
	});
	/// "Swipe" :: fingers, minFingers, maxFingers, snap, threshold.
	Event.add(window, "swipe", function(event, self) {
		console.log(self.type, self.fingers, self.velocity, self.angle);
	});
	/// "Tap" and "Tap-Hold" :: fingers, minFingers, maxFingers, hold, cutoff.
	Event.add(window, "tap", function(event, self) {
		console.log(self.type, self.fingers);
	});
	///
	Event.add(window, "shake", function(event, self) {
		console.log(self.type, self.acceleration, self.accelerationIncludingGravity);
	});
	///
	Event.add(window, "devicemotion", function(event, self) {
		console.log(self.type, self.acceleration, self.accelerationIncludingGravity);
	});
	///
	Event.add(window, "wheel", function(event, self) {
		console.log(self.type, self.state, self.wheelDelta);
	});
	----------------------------------------------------
	//* Use query selectors to create an event (querySelectorAll)
	Event.add("#element a.link", "click", callback);
	document.querySelectorAll("#element a.link").addEventListener("click", callback);
	----------------------------------------------------
	//* Listen for query selector to become available (querySelector)
	Event.add("body", "ready", callback);
	----------------------------------------------------
	Event.add({
		target: "body", 
		type: "ready", 
		timeout: 10000, // set a timeout to stop checking.
		interval: 30, // set how often to check for element.
		listener: callback
	});
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

Event = (function(root) { "use strict";

root.add = function(target, type, listener, configure) {
	return eventHandler(target, type, listener, configure, "add");
};

root.remove = function(target, type, listener, configure) {
	return eventHandler(target, type, listener, configure, "remove");
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

root.enablePointer = function() {
	function createCustomEvent(eventName, target, payload) {
		var event = document.createEvent('Event');
		event.initEvent(eventName, true, true);
		for (var k in payload) event[k] = payload[k];
		target.dispatchEvent(event);
	};
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
			pointers.push(new Pointer(this.mouseEvent.pageX, this.mouseEvent.pageY, PointerTypes.MOUSE, Infinity));
		}
		return pointers;
	};
	var primitives = {
		"mousedown": true, 
		"mouseup": true, 
		"mousemove": true,
		"MSPointerDown": true,
		"MSPointerMove": true,
		"MSPointerUp": true,
		"touchstart": true,
		"touchend": true,
		"touchmove": true
	};
	var augmentEventListener = function(baseElementClass) {
		var oldAddEventListener = baseElementClass.prototype.addEventListener;
		baseElementClass.prototype.addEventListener = function (type, listener, useCapture) {
			if (primitives[type]) { // handle native events.
				oldAddEventListener.call(this, normalize(type), listener, useCapture);
			} else { // handle custom events.
				if (typeof(useCapture) === "object") {
					useCapture.call = true;
				} else {
					useCapture = {
						call: true,
						useCapture: useCapture
					}
				}
				eventHandler(this, type, listener, useCapture, "add");
			}
		};
		var oldRemoveEventListener = baseElementClass.prototype.removeEventListener;
		baseElementClass.prototype.removeEventListener = function (type, listener, useCapture) {
			if (primitives[type]) { // handle native events.
				oldRemoveEventListener.call(this, normalize(type), listener, useCapture);
			} else { // handle custom events.
				if (typeof(useCapture) === "object") {
					useCapture.call = true;
				} else {
					useCapture = {
						call: true,
						useCapture: useCapture
					}
				}
				eventHandler(this, type, listener, useCapture, "remove");
			}
		};
	};
	// Note: Firefox doesn't work like other browsers... overriding HTMLElement
	// doesn't actually affect anything. Special case for Firefox:
	if (navigator.userAgent.match(/Firefox/)) {
		// TODO: fix this for the general case.
		augmentEventListener(HTMLDivElement);
		augmentEventListener(HTMLCanvasElement);
	} else {
		augmentEventListener(HTMLElement);
	}
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

/// Keep track of whether metaKey is being fired.
root.metaTracker = (function() {
	var agent = navigator.userAgent.toLowerCase();
	var mac = agent.indexOf("macintosh") !== -1;
	if (mac && agent.indexOf("khtml") !== -1) { // chrome, safari.
		var watch = { 91: true, 93: true };
	} else if (mac && agent.indexOf("firefox") !== -1) {  // mac firefox.
		var watch = { 224: true };
	} else { // windows, linux, or mac opera.
		var watch = { 17: true };
	}
	return function(event) {
		if (watch[event.keyCode]) {
			root.metaKey = event.type === "keydown";
		}
	};
})();

/// Event listeners.
var eventHandler = function(target, type, listener, configure, trigger) {
	configure = configure || {};
	// Check for element to load on interval (before onload).
	if (typeof(target) === "string" && type === "ready") {
		var timeout = configure.timeout;
		var speed = configure.interval || 1000 / 60;
		var interval = setInterval(function() {
			if (document.querySelector(target)) {
				clearInterval(interval);
				listener();
			}
		}, speed);
		return;
	}
	// Get DOM element from Query Selector.
	if (typeof(target) === "string") {
		target = document.querySelectorAll(target);
		if (target.length === 0) return;
		if (target.length === 1) {
			target = target[0];
		} else { /// Handle multiple targets.
			var events = {};
			for (var n = 0, length = target.length; n < length; n ++) {
				var event = eventHandler(target[n], type, listener, configure, trigger);
				if (event) events[n] = event;
			}	
			return batch(events);
		}
	}
	// Check for multiple events in one string.
	if (type.indexOf && type.indexOf(" ") !== -1) type = type.split(" ");
	if (type.indexOf && type.indexOf(",") !== -1) type = type.split(",");
	// Attach or remove multiple events associated with a target.
	if (typeof(type) !== "string") { // Has multiple events.
		var events = {};
		if (typeof(type.length) === "number") { // Handle multiple listeners glued together.
			for (var n = 0, length = type.length; n < length; n ++) { // Array [type]
				var event = eventHandler(target, type[n], listener, configure, trigger);
				if (event) events[type[n]] = event;
			}
		} else { // Handle multiple listeners.
			for (var key in type) { // Object {type}
				if (typeof(type[key]) === "function") { // without configuration.
					var event = eventHandler(target, key, type[key], configure, trigger);
				} else { // with configuration.
					var event = eventHandler(target, key, type[key].listener, type[key], trigger);
				}
				if (event) events[key] = event;
			}
		}
		return batch(events);
	}
	// Ensure listener is a function.
	if (typeof(listener) !== "function") return;
	// Generate a unique wrapper identifier.
	var id = normalize(type) + getID(target) + "." + getID(listener);
	var useCapture = configure.useCapture || false;
	// Handle the event.
	if (detectProxy[type]) { // Fire custom event.
		if (trigger === "remove") { // Remove event listener.
			if (!wrappers[id]) return; // Already removed.
			wrappers[id].remove();
			delete wrappers[id];
		} else if (trigger === "add") { // Attach event listener.
			if (wrappers[id]) return wrappers[id]; // Already attached.
			// Retains "this" orientation.
			if (configure.call) {
				var tmp = listener;
				var listener = function(event, self) {
					for (var key in self) event[key] = self[key];
					event.target.mouseEvent = event;
					event.identifier = self.identifier || Infinity;
					event.pointerType = "mouse";
					event.getPointerList = function() {
						return [event];
					};
					return tmp.call(target, event);
				};
			}
			// Create listener proxy.
			configure.type = type; 
			configure.target = target;
			configure.listener = listener;
			// Record wrapper.
			wrappers[id] = root.proxy[type](configure); 
		}
	} else { // Fire native event.
		if (trigger === "remove") { // Remove event listener.
			if (!wrappers[id]) return; // Already removed.
			wrappers[id].remove();
			delete wrappers[id];
		} else if (trigger === "add") { // Attach event listener.
			if (wrappers[id]) return wrappers[id]; // Already attached.
			var type = normalize(type);
			// Attach listener.
			target[add](type, listener, useCapture); 
			// Record wrapper.
			wrappers[id] = { 
				type: type,
				target: target,
				listener: listener,
				remove: function() {
					root.remove(target, type, listener, configure);
				}
			};				
		}
	}
	return wrappers[id];
};

/// Perform batch actions on multiple events.
var batch = function(events) {
	return {
		remove: function() { // Remove multiple events.
			for (var key in events) {
				events[key].remove();
			}
		},
		add: function() { // Add multiple events.
			for (var key in events) {
				events[key].add();
			}
		}
	};
};

/// Handle naming discrepancies.
var normalize = (function() {
	var generalized = {
		"pointerdown": "mousedown", 
		"pointerup": "mouseup", 
		"pointermove": "mousemove"
	};
	/// MSIE Pointer event
	var mspointer = window.navigator.msPointerEnabled ? {
		"mousedown": "MSPointerDown",
		"mousemove": "MSPointerMove",
		"mouseup": "MSPointerUp"
	} : { };
	/// Touch event
	var touch = root.supports("touchstart") ? {
		"mousedown": "touchstart",
		"mouseup": "touchend",
		"mousemove": "touchmove"
	} : { };
	/// Normalize.
	return function(type) {
		if (generalized[type]) type = generalized[type];
		if (mspointer[type]) type = mspointer[type];
		if (touch[type]) type = touch[type];
		if (!document.addEventListener) { // IE
			return "on" + type;
		} else {
			return type;
		}
	};
})();

/// Detect custom event listeners (proxies).
var detectProxy = (function () {
	var events = {};
	var types = [];
	types.push("pointerdown");
	types.push("pointermove");
	types.push("pointerup");
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
	/// Convert to matching object.
	for (var n = 0, length = types.length; n < length; n ++) {
		events[types[n]] = true;
	}
	return events; 
})();

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

root.enablePointer();

return root;

})(Event);