/*
	"Mouse Wheel" event proxy.
	----------------------------------------------------
	Event.add(window, "wheel", function(event, self) {
		console.log(self.state, self.wheelDelta);
	});
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

root.wheel = function(conf) {
	// Configure event listener.
	var interval;
	var timeout = conf.timeout || 150;
	var count = 0;
	// Externally accessible data.
	var self = {
		gesture: "wheel",
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
		self.state = count++ ? "change" : "start";
		self.wheelDelta = event.detail ? event.detail * -40 : event.wheelDelta;
		if (Event.modifyEventListener) {
			Event.createPointerEvent(event, self, conf);
		} else {
			conf.listener(event, self);
		}
		clearTimeout(interval);
		interval = setTimeout(function() {
			count = 0;
			self.state = "end";
			self.wheelDelta = 0;
			if (Event.modifyEventListener) {
				Event.createPointerEvent(event, self, conf);
			} else {
				conf.listener(event, self);
			}
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

Event.Gesture = Event.Gesture || {};
Event.Gesture._gestureHandlers = Event.Gesture._gestureHandlers || {};
Event.Gesture._gestureHandlers.wheel = root.wheel;

return root;

})(Event.proxy);