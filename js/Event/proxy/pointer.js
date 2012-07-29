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

root.pointerdown = function(conf) {
	if (conf.target.isPointerEmitter) return;
	// Tracking the events.
	conf.onPointerDown = function (event) {
///		conf.listener(event, self);
		conf.target.mouseEvent = event;
		Event.createCustomEvent('pointerdown', event.target, {
			pointerType: 'mouse',
			getPointerList: Event.getPointerList.bind(this),
			originalEvent: event
		});
	};
	conf.onPointerMove = function (event) {
//		conf.listener(event, self);
		if (conf.target.mouseEvent) conf.target.mouseEvent = event;
		Event.createCustomEvent('pointermove', event.target, {
			pointerType: 'mouse',
			getPointerList: Event.getPointerList.bind(this),
			originalEvent: event
		});
	};
	conf.onPointerUp = function (event) {
//		conf.listener(event, self);
		conf.target.mouseEvent = null;
		Event.createCustomEvent('pointerup', event.target, {
			pointerType: 'mouse',
			getPointerList: Event.getPointerList.bind(this),
			originalEvent: event
		});
	};
	// Attach events.
	var self = root.utility(conf);
	Event.add(conf.target, "mousedown", conf.onPointerDown);
	Event.add(conf.target, "mousemove", conf.onPointerMove);
	Event.add(conf.target, "mouseup", conf.onPointerUp);
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