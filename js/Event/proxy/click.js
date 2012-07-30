/*
	"Click" event proxy.
	----------------------------------------------------
	Event.add(window, "click", function(event, self) {});
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

root.click = function(conf) {
	conf.maxFingers = conf.maxFingers || conf.fingers || 1;
	// Setting up local variables.
	var event;
	// Tracking the events.
	conf.onPointerDown = function (e) {
		if (root.pointerStart(e, conf)) {
			Event.add(conf.doc, "mousemove", conf.onPointerMove).listener(e);
			Event.add(conf.doc, "mouseup", conf.onPointerUp);
		}
	};
	conf.onPointerMove = function (e) {
		event = e;
	};
	conf.onPointerUp = function(e) {
		if (root.pointerEnd(e, conf)) {
			Event.remove(conf.doc, "mousemove", conf.onPointerMove);
			Event.remove(conf.doc, "mouseup", conf.onPointerUp);
			if (event.cancelBubble && ++ event.bubble > 1) return;
			var touches = event.changedTouches || root.getCoords(event);
			var touch = touches[0];
			var bbox = conf.bbox;
			var newbbox = root.getBoundingBox(conf.target);
			var ax = (touch.pageX + bbox.scrollLeft - bbox.x1) * bbox.scaleX;
			var ay = (touch.pageY + bbox.scrollTop - bbox.y1) * bbox.scaleY;
			if (ax > 0 && ax < bbox.width && // Within target coordinates.
				ay > 0 && ay < bbox.height &&
				bbox.scrollTop === newbbox.scrollTop) {
				if (Event.modifyEventListener) {
					Event.createPointerEvent(event, self, conf);
				} else {
					conf.listener(event, self);
				}
			}
		}
	};
	// Generate maintenance commands, and other configurations.
	var self = root.pointerSetup(conf);
	self.state = "click";
	// Attach events.
	Event.add(conf.target, "mousedown", conf.onPointerDown);
	// Return this object.
	return self;
};

Event.Gesture = Event.Gesture || {};
Event.Gesture._gestureHandlers = Event.Gesture._gestureHandlers || {};
Event.Gesture._gestureHandlers.click = root.click;

return root;

})(Event.proxy);