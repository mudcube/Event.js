/*
	"Tap" and "Longpress" event proxy.
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
	conf.delay = conf.delay || 500;
	conf.timeout = conf.timeout || 250;
	// Setting up local variables.
	var timestamp, timeout;
	// Tracking the events.
	conf.onPointerDown = function (event) {
		if (root.pointerStart(event, conf)) {
			timestamp = (new Date).getTime();
			// Initialize event listeners.
			Event.add(conf.doc, "mousemove", conf.onPointerMove).listener(event);
			Event.add(conf.doc, "mouseup", conf.onPointerUp);
			// Make sure this is a "longpress" event.
			if (conf.gesture !== "longpress") return;
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
				self.state = "start";
				self.fingers = fingers;
				if (Event.modifyEventListener) {
					Event.createPointerEvent(event, self, conf);
				} else {
					conf.listener(event, self);
				}
			}, conf.delay);
		}
	};
	conf.onPointerMove = function (event) {
		var bbox = conf.bbox;
		var touches = event.changedTouches || root.getCoords(event);
		var length = touches.length;
		for (var i = 0; i < length; i ++) {
			var touch = touches[i];
			var identifier = touch.identifier || Infinity;
			var pt = conf.tracker[identifier];
			if (!pt) continue;
			var x = (touch.pageX + bbox.scrollLeft - bbox.x1) * bbox.scaleX;
			var y = (touch.pageY + bbox.scrollTop - bbox.y1) * bbox.scaleY;
			if (!(x > 0 && x < bbox.width && // Within target coordinates..
				  y > 0 && y < bbox.height &&
				  Math.abs(x - pt.start.x) <= 25 && // Within drift deviance.
				  Math.abs(y - pt.start.y) <= 25)) {
				// Cancel out this listener.
				Event.remove(conf.doc, "mousemove", conf.onPointerMove);
				conf.cancel = true;
				return;
			}
		}
	};
	conf.onPointerUp = function(event) {
		if (root.pointerEnd(event, conf)) {
			clearTimeout(timeout);
			Event.remove(conf.doc, "mousemove", conf.onPointerMove);
			Event.remove(conf.doc, "mouseup", conf.onPointerUp);
			if (event.cancelBubble && ++event.bubble > 1) return;
			// Callback release on longpress.
			if (conf.gesture === "longpress") {
				if (self.state === "start") {
					self.state = "end";
					if (Event.modifyEventListener) {
						Event.createPointerEvent(event, self, conf);
					} else {
						conf.listener(event, self);
					}
				}
				return;
			}
			// Cancel event due to movement.
			if (conf.cancel) return;
			// Ensure delay is within margins.
			if ((new Date).getTime() - timestamp > conf.timeout) return;
			// Send callback.
			self.state = "tap";
			self.fingers = conf.gestureFingers;
			if (Event.modifyEventListener) {
				Event.createPointerEvent(event, self, conf);
			} else {
				conf.listener(event, self);
			}
		}
	};
	// Generate maintenance commands, and other configurations.
	var self = root.pointerSetup(conf);
	// Attach events.
	Event.add(conf.target, "mousedown", conf.onPointerDown);
	// Return this object.
	return self;
};

Event.Gesture = Event.Gesture || {};
Event.Gesture._gestureHandlers = Event.Gesture._gestureHandlers || {};
Event.Gesture._gestureHandlers.tap = root.tap;
Event.Gesture._gestureHandlers.longpress = root.longpress;

return root;

})(Event.proxy);