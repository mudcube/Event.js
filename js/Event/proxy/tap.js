/*
	"Tap" and "Long press" event proxy.
	----------------------------------------------------
	CONFIGURE: delay (longpress), timeout (tap).
	----------------------------------------------------
	Event.add(window, "tap", function(event, self) {
		console.log(self.fingers);
	});
	----------------------------------------------------
	multi-finger tap // touch an target for <= 250ms.
	multi-finger longpress // touch an target for >= 500ms
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

root.tap = 
root.longpress = function(conf) {
	conf.doc = conf.target.ownerDocument || conf.target;
	conf.minFingers = conf.minFingers || 1;
	conf.maxFingers = conf.maxFingers || Infinity; // Maximum allowed fingers.
	if (conf.type === "longpress" || conf.delay) {
		conf.type = "longpress";
		conf.ms = conf.delay || 500;
	} else {
		conf.type = "tap";
		conf.ms = conf.timeout || 250;
	}
	// Externally accessible data.
	var self = {
		type: conf.type,
		target: conf.target,
		listener: conf.listener,
		remove: function() {
			Event.remove(conf.target, "mousedown", onMouseDown);
		}
	};
	// Setting up local variables.
	var timestamp, timeout;
	// Tracking the events.
	var onMouseDown = function (event) {
		if (root.gestureStart(event, conf)) {
			timestamp = (new Date).getTime();
			// Initialize event listeners.
			Event.add(conf.doc, "mousemove", onMouseMove).listener(event);
			Event.add(conf.doc, "mouseup", onMouseUp);
			// Make sure this is a "longpress" event.
			if (conf.type !== "longpress") return;
			timeout = setTimeout(function() {
				if (event.cancelBubble && ++event.bubble > 1) return;
				// Make sure no fingers have been changed.
				var fingers = 0;
				for (var key in conf.tracker) {
					if (conf.tracker[key].end === true) return;
					if (conf.cancel) return;
					fingers ++;
				}
				// Send callback.
				self.state = "longpress";
				self.fingers = fingers;
				conf.listener(event, self);
			}, conf.ms);
		}
	};
	var onMouseMove = function (event) {
		var bbox = conf.bbox;
		var touches = event.changedTouches || root.getCoords(event);
		var length = touches.length;
		for (var i = 0; i < length; i ++) {
			var touch = touches[i];
			var sid = touch.identifier || 0;
			var o = conf.tracker[sid];
			if (!o) continue;
			var x = (touch.pageX + bbox.scrollLeft - bbox.x1) * bbox.scaleX;
			var y = (touch.pageY + bbox.scrollTop - bbox.y1) * bbox.scaleY;
			if (!(x > 0 && x < bbox.width && // Within target coordinates..
				  y > 0 && y < bbox.height &&
				  Math.abs(x - o.start.x) <= 25 && // Within drift deviance.
				  Math.abs(y - o.start.y) <= 25)) {
				// Cancel out this listener.
				Event.remove(conf.doc, "mousemove", onMouseMove);
				conf.cancel = true;
				return;
			}
		}
	};
	var onMouseUp = function(event) {
		if (root.gestureEnd(event, conf)) {
			clearTimeout(timeout);
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
			if (event.cancelBubble && ++event.bubble > 1) return;
			// Callback release on longpress.
			if (conf.type === "longpress") {
				if (self.state === "longpress") {
					self.state = "release";
					conf.listener(event, self);
				}
				return;
			}
			// Cancel event due to movement.
			if (conf.cancel) return;
			// Ensure delay is within margins.
			if ((new Date).getTime() - timestamp > conf.ms) return;
			// Send callback.
			self.state = "tap";
			self.fingers = conf.gestureFingers;
			conf.listener(event, self);
		}
	};
	// Attach events.
	Event.add(conf.target, "mousedown", onMouseDown);
	// Return this object.
	return self;
};

Event.Gesture = Event.Gesture || {};
Event.Gesture._gestureHandlers = Event.Gesture._gestureHandlers || {};
Event.Gesture._gestureHandlers.tap = root.tap;
Event.Gesture._gestureHandlers.longpress = root.longpress;

return root;

})(Event.proxy);