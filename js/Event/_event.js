/*
	----------------------------------------------------
	Event.js : 1.0.9 : 2012/07/28 : MIT License
	----------------------------------------------------
	https://github.com/mudcube/Event.js
	----------------------------------------------------
	1  : click, dblclick, dbltap
	1+ : tap, longpress, drag, swipe
	2+ : pinch, rotate
	   : mousewheel, devicemotion, shake
	----------------------------------------------------
	REQUIREMENTS: querySelector, querySelectorAll
	----------------------------------------------------
	*	There are two ways to add/remove events with this library.
	----------------------------------------------------
	// Retains "this" attribute as target, and overrides native addEventListener.
	target.addEventListener(type, listener, useCapture); 
	target.removeEventListener(type, listener, useCapture);

	// Attempts to perform as fast as possible.
	Event.add(type, listener, configure); 
	Event.remove(type, listener, configure);

	*	You can turn prototyping on/off for individual features.
	----------------------------------------------------
	Event.modifyEventListener = true; // add custom *EventListener commands to HTMLElements.
	Event.modifySelectors = true; // add bulk *EventListener commands on NodeLists from querySelectorAll and others.

	*	Example of setting up a single listener with a custom configuration.
	----------------------------------------------------
	// optional configuration.
	var configure = {
		fingers: 2, // listen for specifically two fingers.
		snap: 90 // snap to 90 degree intervals.
	};
	// adding with addEventListener()
	target.addEventListener("swipe", function(event) {
		// additional variables can be found on the event object.
		console.log(event.velocity, event.angle, event.fingers);
	}, configure);
	
	// adding with Event.add()
	Event.add("swipe", function(event, self) {
		// additional variables can be found on the self object.
		console.log(self.velocity, self.angle, self.fingers);
	}, configure);

	*	Multiple listeners glued together.
	----------------------------------------------------
	// adding with addEventListener()
	target.addEventListener("click swipe", function(event) { });

	// adding with Event.add()
	Event.add(target, "click swipe", function(event, self) { });

	*	Use query selectors to create an event (querySelectorAll)
	----------------------------------------------------
	// adding events to NodeList from querySelectorAll()
	document.querySelectorAll("#element a.link").addEventListener("click", callback);

	// adding with Event.add()
	Event.add("#element a.link", "click", callback);

	*	Listen for selector to become available (querySelector)
	----------------------------------------------------
	Event.add("body", "ready", callback);
	// or...
	Event.add({
		target: "body", 
		type: "ready", 
		timeout: 10000, // set a timeout to stop checking.
		interval: 30, // set how often to check for element.
		listener: callback
	});

	*	Multiple listeners bound to one callback w/ single configuration.
	----------------------------------------------------
	var bindings = Event.add({
		target: target,
		type: "click swipe",
		snap: 90, // snap to 90 degree intervals.
		minFingers: 2, // minimum required fingers to start event.
		maxFingers: 4, // maximum fingers in one event.
		listener: function(event, self) {
			console.log(self.gesture); // will be click or swipe.
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

	*	Multiple listeners bound to multiple callbacks w/ single configuration.
	----------------------------------------------------
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

	*	Multiple listeners bound to multiple callbacks w/ multiple configurations.
	----------------------------------------------------
	var binding = Event.add({
		target: target,
		listeners: {
			longpress: {
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

	*	Capturing an event and manually forwarding it to a proxy (tiered events).
	----------------------------------------------------
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

	*	Event proxies.
	*	type, fingers, state, start, x, y, position, bbox
	*	rotation, scale, velocity, angle, delay, timeout
	----------------------------------------------------
	// "Click" :: fingers, minFingers, maxFingers.
	Event.add(window, "click", function(event, self) {
		console.log(self.gesture, self.x, self.y);
	});
	// "Double-Click" :: fingers, minFingers, maxFingers.
	Event.add(window, "dblclick", function(event, self) {
		console.log(self.gesture, self.x, self.y);
	});
	// "Drag" :: fingers, maxFingers, position
	Event.add(window, "drag", function(event, self) {
		console.log(self.gesture, self.fingers, self.state, self.start, self.x, self.y, self.bbox);
	});
	// "Gesture" :: fingers, minFingers, maxFingers.
	Event.add(window, "gesture", function(event, self) {
		console.log(self.gesture, self.fingers, self.state, self.rotation, self.scale);
	});
	// "Swipe" :: fingers, minFingers, maxFingers, snap, threshold.
	Event.add(window, "swipe", function(event, self) {
		console.log(self.gesture, self.fingers, self.velocity, self.angle);
	});
	// "Tap" :: fingers, minFingers, maxFingers, timeout.
	Event.add(window, "tap", function(event, self) {
		console.log(self.gesture, self.fingers);
	});
	// "Longpress" :: fingers, minFingers, maxFingers, delay.
	Event.add(window, "longpress", function(event, self) {
		console.log(self.gesture, self.fingers);
	});
	//
	Event.add(window, "shake", function(event, self) {
		console.log(self.gesture, self.acceleration, self.accelerationIncludingGravity);
	});
	//
	Event.add(window, "devicemotion", function(event, self) {
		console.log(self.gesture, self.acceleration, self.accelerationIncludingGravity);
	});
	//
	Event.add(window, "wheel", function(event, self) {
		console.log(self.gesture, self.state, self.wheelDelta);
	});

	*	Stop, prevent and cancel.
	----------------------------------------------------
	Event.stop(event); // stop bubble.
	Event.prevent(event); // prevent default.
	Event.cancel(event); // stop and prevent.

	*	Track for proper command/control-key for Mac/PC.
	----------------------------------------------------
	Event.add(window, "keyup keydown", Event.proxy.metaTracker);
	console.log(Event.metaKey);

	*	Test for event features, in this example Drag & Drop file support.
	----------------------------------------------------
	console.log(Event.supports('dragstart') && Event.supports('drop') && !!window.FileReader);

*/

if (typeof(Event) === "undefined") var Event = {};

Event = (function(root) { "use strict";

// Add custom *EventListener commands to HTMLElements.
root.modifyEventListener = true;

// Add bulk *EventListener commands on NodeLists from querySelectorAll and others.
root.modifySelectors = true;

// Event maintenance.
root.add = function(target, type, listener, configure) {
	return eventManager(target, type, listener, configure, "add");
};

root.remove = function(target, type, listener, configure) {
	return eventManager(target, type, listener, configure, "remove");
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

// Check whether event is natively supported (via @kangax)
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

/// Handle custom *EventListener commands.
var eventManager = function(target, type, listener, configure, trigger) {
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
				var event = eventManager(target[n], type, listener, configure, trigger);
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
				var event = eventManager(target, type[n], listener, configure, trigger);
				if (event) events[type[n]] = event;
			}
		} else { // Handle multiple listeners.
			for (var key in type) { // Object {type}
				if (typeof(type[key]) === "function") { // without configuration.
					var event = eventManager(target, key, type[key], configure, trigger);
				} else { // with configuration.
					var event = eventManager(target, key, type[key].listener, type[key], trigger);
				}
				if (event) events[key] = event;
			}
		}
		return batch(events);
	}
	// Ensure listener is a function.
	if (typeof(listener) !== "function") return;
	// Generate a unique wrapper identifier.
	var useCapture = configure.useCapture || false;
	var id = normalize(type) + getID(target) + "." + getID(listener) + "." + (useCapture ? 1 : 0);
	// Handle the event.
	if (root.Gesture._gestureHandlers[type]) { // Fire custom event.
		if (trigger === "remove") { // Remove event listener.
			if (!wrappers[id]) return; // Already removed.
			wrappers[id].remove();
			delete wrappers[id];
		} else if (trigger === "add") { // Attach event listener.
			if (wrappers[id]) return wrappers[id]; // Already attached.
			// Retains "this" orientation.
			if (configure.useCall && !root.modifyEventListener) {
				var tmp = listener;
				var listener = function(event, self) {
					for (var key in self) event[key] = self[key];
					return tmp.call(target, event);
				};
			}
			// Create listener proxy.
			configure.gesture = type; 
			configure.target = target;
			configure.listener = listener;
			// Record wrapper.
			wrappers[id] = root.proxy[type](configure); 
		}
	} else { // Fire native event.
		if (trigger === "remove") { // Remove event listener.
			if (!wrappers[id]) return; // Already removed.
			target[remove](type, listener, useCapture); 
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

/// Handle naming discrepancies between platforms.
var normalize = (function() {
	var translate = {};
	return function(type) {
		if (!root.pointerType) {
			if (window.navigator.msPointerEnabled) {
				root.pointerType = "mspointer";
				translate = {
					"mousedown": "MSPointerDown",
					"mousemove": "MSPointerMove",
					"mouseup": "MSPointerUp"
				};
			} else if (root.supports("touchstart")) {
				root.pointerType = "touch";
				translate = {
					"mousedown": "touchstart",
					"mouseup": "touchend",
					"mousemove": "touchmove"
				};	
			} else {
				root.pointerType = "mouse";
			}
		}	
		if (translate[type]) type = translate[type];
		if (!document.addEventListener) { // IE
			return "on" + type;
		} else {
			return type;
		}
	}
})();

/// Event wrappers to keep track of all events placed in the window.
var wrappers = {};
var counter = 0;
var getID = function(object) {
	if (object === window) return "#window";
	if (object === document) return "#document";
	if (!object) return console.log("Missing target on listener!");
	if (!object.uniqueID) object.uniqueID = "id" + counter ++;
	return object.uniqueID;
};

/// Detect platforms native *EventListener command.
var add = document.addEventListener ? "addEventListener" : "attachEvent";
var remove = document.removeEventListener ? "removeEventListener" : "detachEvent";

/*
	Pointer.js
	------------------------
	Modified from; https://github.com/borismus/pointer.js
*/

root.createPointerEvent = function (event, self, conf, preventRecord) {
	var eventName = self.gesture;
	var target = self.target;
	var pts = event.changedTouches || root.proxy.getCoords(event);
	///
	if (pts.length) {
		var pt = pts[0];
		self.pointers = preventRecord ? [] : pts;
		self.pageX = pt.pageX;
		self.pageY = pt.pageY;
		self.x = self.pageX;
		self.y = self.pageY;
	}
	///
	self.identifier = conf.identifier;
	var newEvent = document.createEvent("Event");
	newEvent.initEvent(eventName, true, true);
	newEvent.originalEvent = event;
	for (var k in self) newEvent[k] = self[k];
	target.dispatchEvent(newEvent);
};

/// Allows *EventListener to use custom event proxies.
if (root.modifyEventListener) (function() {
	var augmentEventListener = function(proto) {
		var recall = function(trigger) { // overwrite native *EventListener's
			var handle = trigger + "EventListener";
			var handler = proto[handle];
			proto[handle] = function (type, listener, useCapture) {
				if (root.Gesture._gestureHandlers[type]) { // capture custom events.
					var configure = useCapture;
					if (typeof(useCapture) === "object") {
						configure.useCall = true;
					} else { // convert to configuration object.
						configure = {
							useCall: true,
							useCapture: useCapture
						}
					}
					eventManager(this, type, listener, configure, trigger);
					handler.call(this, type, listener, useCapture);
				} else { // use native function.
					handler.call(this, normalize(type), listener, useCapture);
				}
			};
		};
		recall("add");
		recall("remove");
	};
	// NOTE: overwriting HTMLElement doesn't do anything in Firefox.
	if (navigator.userAgent.match(/Firefox/)) {
		// TODO: fix Firefox for the general case.
		augmentEventListener(HTMLDivElement.prototype);
		augmentEventListener(HTMLCanvasElement.prototype);
	} else {
		augmentEventListener(HTMLElement.prototype);
	}
	augmentEventListener(document);
	augmentEventListener(window);
})();

/// Allows querySelectorAll and other NodeLists to perform *EventListener commands in bulk.
if (root.modifySelectors) (function() {
	var proto = NodeList.prototype;
	proto.removeEventListener = function(type, listener, useCapture) {
		for (var n = 0, length = this.length; n < length; n ++) {
			this[n].removeEventListener(type, listener, useCapture);
		}
	};
	proto.addEventListener = function(type, listener, useCapture) {
		for (var n = 0, length = this.length; n < length; n ++) {
			this[n].addEventListener(type, listener, useCapture);
		}
	};
})();

return root;

})(Event);