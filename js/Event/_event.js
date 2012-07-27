/*
	----------------------------------------------------
	Event.js : 1.0.1 : 2012/07/14 : MIT License
	----------------------------------------------------
	https://github.com/mudcube/Event.js
	----------------------------------------------------
	// "Event" provides easy access, and retains "this" attribute:
	Event(window, "click", function(event, self) {
		self.stop().prevent().remove();
		console.log(this === self.target); // true
	});
	----------------------------------------------------
	// "Event.add" uses less overhead, but is more verbose:
	var click = Event.add(window, "click", function(event) {
		Event.stop(event);
		Event.prevent(event);
		Event.remove(window, "click", click);
	});
	----------------------------------------------------
	// Multiple event-types bound to one function.
	var binding = Event(window, "click mousemove mousemove mouseup", function(event, self) {
		self.stop().prevent(); // stopPropagation and preventDefault
		binding.remove(); // removes all the listeners
	});
	----------------------------------------------------
	// Multiple events bound to one element.
	var binding = Event(window, {
		"mousedown": function(event, self) {
			self.remove(); // remove all the listeners
		},
		"mouseup": function(event, self) {
			binding.remove(); // just remove this listener
		}	
	});
	----------------------------------------------------
	// Wait for element to become ready.
	Event("body", "ready", function(event, self) {
		self.stop.prevent.remove();		
	});
	----------------------------------------------------
	// Test for Drag & Drop File
	var support = Event.supports('dragstart') && Event.supports('drop') && !!window.FileReader;
	----------------------------------------------------
	// Track for Event.metaKey (proper control-key for mac/pc)
	Event.add(window, "keyup keydown", Event.trackMetaKey);

*/

var Event = (function() { "use strict";

var root = function(target, type, listener) {
	var that = this || {};
	// Check for element to load on interval (before onload)
	if (typeof(target) === "string" && type === "ready") {
		var interval = setInterval(function() {
			if (document.getElementsByTagName(target).length) {
				clearInterval(interval);
				listener();
			}
		}, 10);
		return that;
	}
	// Check for multiple events in one string.
	if (type.indexOf && type.indexOf(" ") !== -1) type = type.split(" ");
	if (type.indexOf && type.indexOf(",") !== -1) type = type.split(",");
	// Check type for multiple events.
	if (typeof(type) !== "string") { // Has multiple events.
		that.events = {};
		if (typeof(type.length) === "number") { // Has multiple listeners (object)
			for (var n = 0, length = type.length; n < length; n ++) {
				var event = Event(target, type[n], listener);
				if (event) that.events[type[n]] = event;
			}
		} else { // Has multiple listeners glued together (array)
			for (var key in type) {
				var event = Event(target, key, type[key]);
				if (event) that.events[key] = event;
			}
		}
		that.remove = function() { // Remove multiple events.
			var events = that.events;
			for (var key in events) events[key].remove();
			return that;
		};
		that.add = function() { // Add multiple events.
			var events = that.events;
			for (var key in events) events[key].add();
			return that;
		};
		return that;
	}
	// Ensure listener is a function.
	if (typeof(listener) !== "function") return;
	// Generate a unique wrapper identifier.
	var type = normalize(type);
	var id = type + getID(target) + "." + getID(listener);
	// Handle the event.
	if (!wrappers[id]) { // create new wrapper
		wrappers[id] = function(event) {
			that.event = event;
			return listener.call(target, event, that);
		};
	}
	// The wrapped listener.
	target[add](type, wrappers[id], false);
	// 
	that.listener = listener;
	that.add = function() { // so you can add it back
		target[add](type, wrappers[id], false);
		return that;
	};
	that.remove = function() { 
		target[remove](type, wrappers[id], false);
		return that;
	};
	that.stop = function() {
		var event = that.event;
		if (event.stopPropagation) event.stopPropagation();
		event.cancelBubble = true; // <= IE8
		event.bubble = 0;
		return that;
	};
	that.prevent = function() {
		var event = that.event;
		if (event.preventDefault) event.preventDefault();
		event.returnValue = false; // <= IE8
		return that;
	};
	that.cancel = function() {
		that.stop().prevent();
		return that;
	};
	return that;
};	

// Speedy event manager.
var triggerEvent = function(target, type, listener, trigger, conf) {
	if (typeof(target) === "string") {
		target = document.querySelector(target);
	}
	// Attach or remove multiple events associated with a target.
	if (type.indexOf) {
		if (type.indexOf(" ") !== -1) type = type.split(" ");
		else if (type.indexOf(",") !== -1) type = type.split(",");
	}
	if (typeof(type) !== "string") {
		if (typeof(type.length) === "number") { // Has multiple listeners glued together.
			for (var n = 0, length = type.length; n < length; n ++) { // Array[]
				triggerEvent(target, type[n], listener, trigger);
			}
		} else { // Has multiple listeners.
			for (var key in type) { // Object{}
				triggerEvent(target, key, type[key], trigger);
			}
		}
		return;
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

root.add = function(target, type, listener, conf) {
	return triggerEvent(target, type, listener, "add", conf);
};

root.remove = function(target, type, listener, conf) {
	return triggerEvent(target, type, listener, "remove", conf);
};

root.stop =	
root.stopPropagation = function(event) {
	if (event.stopPropagation) event.stopPropagation();
	event.cancelBubble = true; // <= IE8
	event.bubble = 0;
};

root.prevent = 
root.preventDefault = function(event) {
	if (event.preventDefault) event.preventDefault();
	event.returnValue = false; // <= IE8
};

root.cancel = function(event) {
	root.stop(event);
	root.prevent(event);
};

// Check to see whether event exists.
root.supports = function (target, type) { // via @kangax
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

// Meta key
root.metaKey = false;
root.trackMetaKey = function(event) {
	var isDown = event.type === "keydown";
	if (defineMetaKey[event.keyCode]) root.metaKey = isDown;
	root.shiftKey = event.shiftKey;	
};

var defineMetaKey = (function() {
	var agent = navigator.userAgent.toLowerCase();
	var mac = agent.indexOf("macintosh") !== -1;
	if (mac && agent.indexOf("khtml") !== -1) { // chrome, safari
		return { 91: true, 93: true };
	} else if (mac && agent.indexOf("firefox") !== -1) {  // mac firefox
		return { 224: true };
	} else { // windows, linux, or mac opera
		return { 17: true };
	}
})();

// Custom event listeners.
var isEventProxy = (function () {
	var events = {};
	var types = [];
	///
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

// Fix any browser discrepancies.
var normalize = function(type) { 
	if (root.supports("touchstart")) { // iOS
		switch(type) {
			case "mousedown":
				return "touchstart";
			case "mouseup":
				return "touchend";
			case "mousemove":
				return "touchmove";
			default:
				break;			
		}	
	}
	if (!document.addEventListener) { // IE
		return "on" + type;
	} else { // 
		return type;
	}
};

// Event wrappers, and associated variables.
var wrappers = {};
var counter = 0;
var getID = function(object) {
	if (object === window) return "#window";
	if (object === document) return "#document";
	if (!object) return console.log("Missing target on listener!");
	if (!object.uniqueID) object.uniqueID = "id" + counter ++;
	return object.uniqueID;
};
//
var add = document.addEventListener ? "addEventListener" : "attachEvent";
var remove = document.removeEventListener ? "removeEventListener" : "detachEvent";
///
return root;
//
})();