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

Event.proxy = (function(root, exports) { "use strict";

root.drag = function(conf) {
	conf.onMouseDown = function (event) {
		if (root.gestureStart(event, conf)) {
			Event.add(conf.doc, "mousemove", conf.onMouseMove);
			Event.add(conf.doc, "mouseup", conf.onMouseUp);
		}
		// Process event listener.
		conf.onMouseMove(event, "down");
	};
	conf.onMouseMove = function (event, state) {
		var bbox = conf.bbox;
		var touches = event.changedTouches || root.getCoords(event);
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
			self.identifier = sid;
			self.start = o.start;
			self.x = (touch.pageX + bbox.scrollLeft - o.offsetX) * bbox.scaleX;
			self.y = (touch.pageY + bbox.scrollTop - o.offsetY) * bbox.scaleY;
			///
			if (Event.prototyped) {
				window._createCustomEvent('drag', self.target, {});
			} else {
				conf.listener(event, self);
			}
		}
	};
	conf.onMouseUp = function(event) {
		// Remove tracking for touch.
		if (root.gestureEnd(event, conf, conf.onMouseMove)) {
			Event.remove(conf.doc, "mousemove", conf.onMouseMove);
			Event.remove(conf.doc, "mouseup", conf.onMouseUp);
		}
	};
	// Data accessible externally.
	var self = root.addPointer({}, conf);
	// Attach events.
	if (conf.event) {
		conf.onMouseDown(conf.event);
	} else {
		Event.add(conf.target, "mousedown", conf.onMouseDown);
	}
	// Return this object.
	return self;
};

//exports.Gesture._gestureHandlers.drag = root.drag;

return root;

})(Event.proxy, window);