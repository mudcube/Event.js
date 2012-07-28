/*
	"Drag" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: maxFingers, position.
	----------------------------------------------------
	Event.add(window, "drag", function(event, self) {
		console.log(self.type, self.state, self.start, self.x, self.y, self.bbox);
	});
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

root.drag = function(conf) {
	conf.doc = conf.target.ownerDocument || conf.target;
	conf.minFingers = conf.minFingers || 1;
	conf.maxFingers = conf.maxFingers || Infinity; // Maximum allowed fingers.
	conf.position = conf.position || "relative"; // Point to source coordinates from.
	// Externally accessible data.
	var self = {
		type: "drag",
		target: conf.target,
		listener: conf.listener,
		remove: function() {
			Event.remove(conf.target, "mousedown", onMouseDown);
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
		},
		disable: function(d) {
			if (!d || d.move) Event.remove(conf.doc, "mousemove", onMouseMove);
			if (!d || d.up) Event.remove(conf.doc, "mouseup", onMouseUp);
			conf.fingers = 0;
		},
		enable: function(d) {
			if (!d || d.move) Event.add(conf.doc, "mousemove", onMouseMove);
			if (!d || d.move) Event.add(conf.doc, "mouseup", onMouseUp);
			conf.fingers = 1;
		}
	};
	// Tracking the events.
	var onMouseDown = function (event) {
		if (root.gestureStart(event, conf)) {
			Event.add(conf.doc, "mousemove", onMouseMove);
			Event.add(conf.doc, "mouseup", onMouseUp);
		}
		// Process event listener.
		onMouseMove(event, "down");
	};
	var onMouseMove = function (event, state) {
		var bbox = conf.bbox;
		var touches = event.changedTouches || getCoords(event);
		var length = touches.length;
		for (var i = 0; i < length; i ++) {
			var touch = touches[i];
			var sid = touch.identifier || 0;
			var o = conf.tracker[sid];
			// Identifier defined outside of listener.
			if (!o) continue;
			o.pageX = touch.pageX;
			o.pageY = touch.pageY;
			// Record data.
			self.state = state || "move";
			self.id = sid;
			self.x = (touch.pageX + bbox.scrollLeft - o.offsetX) * bbox.scaleX;
			self.y = (touch.pageY + bbox.scrollTop - o.offsetY) * bbox.scaleY;
			self.start = o.start;
			conf.listener(event, self);
		}
	};
	var onMouseUp = function(event) {
		// Remove tracking for touch.
		if (root.gestureEnd(event, conf, onMouseMove)) {
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
		}
	};
	// Attach events.
	if (conf.event) {
		onMouseDown(conf.event);
	} else {
		Event.add(conf.target, "mousedown", onMouseDown);
	}
	// Return this object.
	return self;
};

return root;

})(Event.proxy);