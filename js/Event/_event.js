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
	if (fireCustom[type]) { // Fire custom event.
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

/// Detect custom event listeners.
var fireCustom = (function () {
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