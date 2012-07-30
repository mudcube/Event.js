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

root.pointerdown = 
root.pointermove = 
root.pointerup = function(conf) {
	if (conf.target.isPointerEmitter) return;
	// Tracking the events.
	var isDown = true;
	conf.onPointerDown = function (event) {
		isDown = false;
		self.gesture = "pointerdown";
		if (Event.modifyEventListener) {
			Event.createPointerEvent(event, self, conf);
		} else {
			conf.listener(event, self);
		}
	};
	conf.onPointerMove = function (event) {
		self.gesture = "pointermove";
		if (Event.modifyEventListener) {
			Event.createPointerEvent(event, self, conf, isDown);
		} else {
			conf.listener(event, self);
		}
	};
	conf.onPointerUp = function (event) {
		isDown = true;
		self.gesture = "pointerup";
		if (Event.modifyEventListener) {
			Event.createPointerEvent(event, self, conf, true);
		} else {
			conf.listener(event, self);
		}
	};
	// Generate maintenance commands, and other configurations.
	var self = root.pointerSetup(conf);
	self.gesture = "pointerup";
	// Attach events.
	Event.add(conf.target, "mousedown", conf.onPointerDown);
	Event.add(conf.target, "mousemove", conf.onPointerMove);
	Event.add(conf.doc, "mouseup", conf.onPointerUp);
	// Return this object.
	conf.target.isPointerEmitter = true;
	return self;
};

Event.Gesture = Event.Gesture || {};
Event.Gesture._gestureHandlers = Event.Gesture._gestureHandlers || {};
Event.Gesture._gestureHandlers.pointerdown = root.pointerdown;
Event.Gesture._gestureHandlers.pointermove = root.pointermove;
Event.Gesture._gestureHandlers.pointerup = root.pointerup;

return root;

})(Event.proxy);