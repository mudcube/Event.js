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
			var touches = event.changedTouches || root.getCoords(event);
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

Event.Gesture = Event.Gesture || {};
Event.Gesture._gestureHandlers = Event.Gesture._gestureHandlers || {};
Event.Gesture._gestureHandlers.click = root.click;

return root;

})(Event.proxy);