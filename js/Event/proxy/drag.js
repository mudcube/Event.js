/*
	"Drag" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: maxFingers, position.
	----------------------------------------------------
	Event.add(window, "drag", function(event, self) {
		console.log(self.gesture, self.state, self.start, self.x, self.y, self.bbox);
	});
*/

if (typeof(Event) === "undefined") var Event = {};
if (typeof(Event.proxy) === "undefined") Event.proxy = {};

Event.proxy = (function(root) { "use strict";

root.dragElement = function(that, event) {
	root.drag({
		event: event,
		target: that,
		position: "move",
		listener: function(event, self) {
			that.style.left = self.x + "px";
			that.style.top = self.y + "px";
		}
	});
};

root.drag = function(conf) {
	conf.gesture = "drag";
	conf.onPointerDown = function (event) {
		if (root.pointerStart(event, self, conf)) {
			Event.add(conf.doc, "mousemove", conf.onPointerMove);
			Event.add(conf.doc, "mouseup", conf.onPointerUp);
		}
		// Process event listener.
		conf.onPointerMove(event, "down");
	};
	conf.onPointerMove = function (event, state) {
		var bbox = conf.bbox;
		var touches = event.changedTouches || root.getCoords(event);
		var length = touches.length;
		for (var i = 0; i < length; i ++) {
			var touch = touches[i];
			var identifier = touch.identifier || Infinity;
			var pt = conf.tracker[identifier];
			// Identifier defined outside of listener.
			if (!pt) continue;
			pt.pageX = touch.pageX;
			pt.pageY = touch.pageY;
			// Record data.
			self.state = state || "move";
			self.identifier = identifier;
			self.start = pt.start;
			self.fingers = 1; // TODO(mud): option to track as single set, or individually.
			if (conf.position === "relative") {
				self.x = (pt.pageX + bbox.scrollLeft - pt.offsetX) * bbox.scaleX;
				self.y = (pt.pageY + bbox.scrollTop - pt.offsetY) * bbox.scaleY;
			} else {
				self.x = (pt.pageX - pt.offsetX);
				self.y = (pt.pageY - pt.offsetY);
			}
			///
			conf.listener(event, self);
		}
	};
	conf.onPointerUp = function(event) {
		// Remove tracking for touch.
		if (root.pointerEnd(event, self, conf, conf.onPointerMove)) {
			Event.remove(conf.doc, "mousemove", conf.onPointerMove);
			Event.remove(conf.doc, "mouseup", conf.onPointerUp);
		}
	};
	// Generate maintenance commands, and other configurations.
	var self = root.pointerSetup(conf);
	// Attach events.
	if (conf.event) {
		conf.onPointerDown(conf.event);
	} else {
		Event.add(conf.target, "mousedown", conf.onPointerDown);
	}
	// Return this object.
	return self;
};

Event.Gesture = Event.Gesture || {};
Event.Gesture._gestureHandlers = Event.Gesture._gestureHandlers || {};
Event.Gesture._gestureHandlers.drag = root.drag;

return root;

})(Event.proxy);