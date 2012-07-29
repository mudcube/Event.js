/*
	"Double-Click" aka "Double-Tap" event proxy.
	----------------------------------------------------
	Event.add(window, "dblclick", function(event, self) {});
	----------------------------------------------------
	Touch an target twice for <= 700ms, with less than 15 pixel drift.
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

root.dbltap =
root.dblclick = function(conf) {
	conf.doc = conf.target.ownerDocument || conf.target;
	conf.minFingers = conf.minFingers || 1;
	conf.maxFingers = conf.maxFingers || 1; // Maximum allowed fingers.
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
	var delay = 700; // in milliseconds
	var time0, time1, timeout; 
	var touch0, touch1;
	// Tracking the events.
	var onMouseDown = function (event) {
		var touches = event.changedTouches || root.getCoords(event);
		if (time0 && !time1) { // Click #2
			touch1 = touches[0];
			time1 = (new Date).getTime() - time0;
		} else { // Click #1
			touch0 = touches[0];
			time0 = (new Date).getTime();
			time1 = 0;
			clearTimeout(timeout);
			timeout = setTimeout(function() {
				time0 = 0;
			}, delay);
		}
		if (root.gestureStart(event, conf)) {
			Event.add(conf.doc, "mousemove", onMouseMove).listener(event);
			Event.add(conf.doc, "mouseup", onMouseUp);
		}
	};
	var onMouseMove = function (event) {
		if (time0 && !time1) {
			var touches = event.changedTouches || root.getCoords(event);
			touch1 = touches[0];
		}
		var bbox = conf.bbox;
		var ax = (touch1.pageX + bbox.scrollLeft - bbox.x1) * bbox.scaleX;
		var ay = (touch1.pageY + bbox.scrollTop - bbox.y1) * bbox.scaleY;
		if (!(ax > 0 && ax < bbox.width && // Within target coordinates..
			  ay > 0 && ay < bbox.height &&
			  Math.abs(touch1.pageX - touch0.pageX) <= 25 && // Within drift deviance.
			  Math.abs(touch1.pageY - touch0.pageY) <= 25)) {
			// Cancel out this listener.
			Event.remove(conf.doc, "mousemove", onMouseMove);
			clearTimeout(timeout);
			time0 = time1 = 0;
		}
	};
	var onMouseUp = function(event) {
		if (root.gestureEnd(event, conf)) {
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
		}
		if (time0 && time1) {
			if (time1 <= delay && !(event.cancelBubble && ++event.bubble > 1)) {
				self.state = conf.type;
				conf.listener(event, self);
			}
			clearTimeout(timeout);
			time0 = time1 = 0;
		}
	};
	// Attach events.
	Event.add(conf.target, "mousedown", onMouseDown);
	// Return this object.
	return self;
};

Event.Gesture = Event.Gesture || {};
Event.Gesture._gestureHandlers = Event.Gesture._gestureHandlers || {};
Event.Gesture._gestureHandlers.dbltap = root.dbltap;
Event.Gesture._gestureHandlers.dblclick = root.dblclick;

return root;

})(Event.proxy);