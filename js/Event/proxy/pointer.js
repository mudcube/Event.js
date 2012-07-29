/*
	"Pointer" event proxy (1+ fingers).
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

var isDown = false;

root.pointerdown = function(conf) {
	// Tracking the events.
	conf.onMouseUp = function (event) {
		isDown = false;
	};
	conf.onMouseDown = function (event) {
		isDown = true;
		conf.listener(event, self);
	};
	// Attach events.
	var self = root.addPointer(conf);
	Event.add(conf.target, "mousedown", conf.onMouseDown);
	Event.add(conf.target, "mouseup", conf.onMouseUp);
	// Return this object.
	return self;
};

root.pointermove = function(conf) {
	// Tracking the events.
	conf.onMouseMove = function (event) {
		if (isDown) conf.listener(event, self);
	};
	// Attach events.
	var self = root.addPointer(conf);
	Event.add(conf.target, "mousemove", conf.onMouseMove);
	// Return this object.
	return self;
};		

root.pointerup = function(conf) {
	// Tracking the events.
	conf.onMouseUp = function (event) {
		isDown = false;
		conf.listener(event, self);
	};
	// Attach events.
	var self = root.addPointer(conf);
	Event.add(conf.target, "mouseup", conf.onMouseUp);
	// Return this object.
	return self;
};		

Event.Gesture = Event.Gesture || {};
Event.Gesture._gestureHandlers = Event.Gesture._gestureHandlers || {};
Event.Gesture._gestureHandlers.pointerdown = root.pointerdown;
Event.Gesture._gestureHandlers.pointermove = root.pointermove;
Event.Gesture._gestureHandlers.pointerup = root.pointerup;

return root;

})(Event.proxy);