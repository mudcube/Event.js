/*
	"Gesture" event proxy (2+ fingers).
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

var RAD_DEG = Math.PI / 180;

root.gesture = function(conf) {
	conf.doc = conf.target.ownerDocument || conf.target;
	conf.minFingers = conf.minFingers || 2;
	conf.maxFingers = conf.maxFingers || 2;
	// Externally accessible data.
	var self = {
		type: "gesture",
		target: conf.target,
		listener: conf.listener,
		remove: function() {
			Event.remove(conf.target, "mousedown", onMouseDown);
		}
	};
	// Tracking the events.
	var onMouseDown = function (event) {
		var fingers = conf.fingers;
		if (root.gestureStart(event, conf)) {
			Event.add(conf.doc, "mousemove", onMouseMove);
			Event.add(conf.doc, "mouseup", onMouseUp);
		}
		// Record gesture start.
		if (conf.fingers === conf.minFingers && fingers !== conf.fingers) {
			self.fingers = conf.minFingers;
			self.scale = 1;
			self.rotation = 0;
			self.state = "start";
			var sids = "";
			for (var key in conf.tracker) sids += key;
			self.id = parseInt(sids);
			conf.listener(event, self);
		}
	};
	///
	var onMouseMove = function (event, state) {
		var bbox = conf.bbox;
		var points = conf.tracker;
		var touches = event.changedTouches || getCoords(event);
		var length = touches.length;
		// Update tracker coordinates.
		for (var i = 0; i < length; i ++) {
			var touch = touches[i];
			var sid = touch.identifier || 0;
			var pt = points[sid];
			// Check whether "pt" is used by another gesture.
			if (!pt) continue; 
			// Find the actual coordinates.
			pt.move.x = (touch.pageX + bbox.scrollLeft - bbox.x1) * bbox.scaleX;
			pt.move.y = (touch.pageY + bbox.scrollTop - bbox.y1) * bbox.scaleY;
		}
		///
		if (conf.fingers < conf.minFingers) return;
		///
		var touches = [];
		var scale = 0;
		var rotation = 0;
		/// Calculate centroid of gesture.
		var centroidx = 0;
		var centroidy = 0;
		var length = 0;
		for (var sid in points) {
			var touch = points[sid];
			if (touch.up) continue;
			centroidx += touch.move.x;
			centroidy += touch.move.y;
			length ++;
		}
		centroidx /= length;
		centroidy /= length;
		///
		for (var sid in points) {
			var touch = points[sid];
			if (touch.up) continue;
			var start = touch.start;
			if (!start.distance) {
				var dx = start.x - centroidx;
				var dy = start.y - centroidy;
				start.distance = Math.sqrt(dx * dx + dy * dy);
				start.angle = Math.atan2(dx, dy) / RAD_DEG;
			}
			// Calculate scale.
			var dx = touch.move.x - centroidx;
			var dy = touch.move.y - centroidy;
			var distance = Math.sqrt(dx * dx + dy * dy);
			scale += distance / start.distance;
			// Calculate rotation.
			var angle = Math.atan2(dx, dy) / RAD_DEG;
			var rotate = (start.angle - angle + 360) % 360 - 180;
			touch.DEG2 = touch.DEG1; // Previous degree.
			touch.DEG1 = rotate > 0 ? rotate : -rotate; // Current degree.
			if (typeof(touch.DEG2) !== "undefined") {
				if (rotate > 0) {
					touch.rotation += touch.DEG1 - touch.DEG2;
				} else {
					touch.rotation -= touch.DEG1 - touch.DEG2;
				}
				rotation += touch.rotation;
			}
			// Attach current points to self.
			touches.push(touch.move);
		}
		///
		self.touches = touches;
		self.fingers = conf.fingers;
		self.scale = scale / conf.fingers;
		self.rotation = rotation / conf.fingers;
		self.state = "change";
		conf.listener(event, self);
	};
	var onMouseUp = function(event) {
		// Remove tracking for touch.
		var fingers = conf.fingers;
		if (root.gestureEnd(event, conf)) {
			Event.remove(conf.doc, "mousemove", onMouseMove);
			Event.remove(conf.doc, "mouseup", onMouseUp);
		}
		// Check whether fingers has dropped below minFingers.
		if (fingers === conf.minFingers && conf.fingers < conf.minFingers) {
			self.fingers = conf.fingers;
			self.state = "end";
			conf.listener(event, self);
		}
	};
	// Attach events.
	Event.add(conf.target, "mousedown", onMouseDown);
	// Return this object.
	return self;
};

return root;

})(Event.proxy);