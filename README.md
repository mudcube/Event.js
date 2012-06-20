	----------------------------------------------------
	Event.js : 0.9 : 2012/06/15 : http://mudcu.be
	----------------------------------------------------
	// "Event" provides easy access, and retains "this" attribute:
	Event(window, "click", function(event, self) {
		self.stop().prevent().remove();
		console.log(this === self.target); // true
	});
	----------------------------------------------------
	// "Event.add" uses less overhead, but is more verbose:
	var click = Event.add(window, "click", function(event) {
		Event.stop(event);
		Event.prevent(event);
		Event.remove(window, "click", click);
	});
	----------------------------------------------------
	// Multiple event-types bound to one function.
	var binding = Event(window, "click mousemove mousemove mouseup", function(event, self) {
		self.stop().prevent(); // stopPropagation and preventDefault
		binding.remove(); // removes all the listeners
	});
	----------------------------------------------------
	// Multiple events bound to one element.
	var binding = Event(window, {
		"mousedown": function(event, self) {
			self.remove(); // remove all the listeners
		},
		"mouseup": function(event, self) {
			binding.remove(); // just remove this listener
		}	
	});
	----------------------------------------------------
	// Wait for element to become ready.
	Event("body", "ready", function(event, self) {
		self.stop.prevent.remove();		
	});
	----------------------------------------------------
	// Test for Drag & Drop File
	var support = Event.supports('dragstart') && Event.supports('drop') && !!window.FileReader;

	----------------------------------------------------
	Event.proxy : 0.3.7 : 2012/06/14 : http://mudcu.be
	----------------------------------------------------
	1  : click, dblclick, dbltap
	1+ : tap, taphold, drag, swipe
	2+ : pinch, rotate
	   : mousewheel, devicemotion, shake

	----------------------------------------------------
	"Drag" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: maxFingers, position.
	----------------------------------------------------
	Event.add(window, "drag", function(event, self) {
		console.log(self.type, self.state, self.start, self.x, self.y, self.bbox);
	});

	----------------------------------------------------
	"Gesture" event proxy (2+ fingers).
	----------------------------------------------------
	CONFIGURE: minFingers, maxFingers.
	----------------------------------------------------
	ongesturestart	Fired when the user starts a gesture using two fingers
	ongesturechange	Fired when the user is moving her fingers, rotating or pinching
	ongestureend	Fired when the user lifts one or both fingers
	----------------------------------------------------
	Event.add(window, "gesture", function(event, self) {
		console.log(self.rotation, self.scale, self.fingers, self.state);
	});

	----------------------------------------------------
	"Swipe" event proxy (1+ fingers).
	----------------------------------------------------
	CONFIGURE: snap, threshold, maxFingers.
	----------------------------------------------------
	Event.add(window, "swipe", function(event, self) {
		console.log(self.velocity, self.angle);
	});

	----------------------------------------------------
	"Tap" and "Tap-Hold" event proxy.
	----------------------------------------------------
	CONFIGURE: minhold, maxhold.
	----------------------------------------------------
	Event.add(window, "tap", function(event, self) {
		console.log(self.fingers);
	});
	----------------------------------------------------
	multi-finger tap // touch an target for <= 250ms.
	multi-finger taphold // touch an target for >= 500ms

	----------------------------------------------------
	"Double-Click" aka "Double-Tap" event proxy.
	----------------------------------------------------
	Event.add(window, "dblclick", function(event, self) {});
	----------------------------------------------------
	Touch an target twice for <= 700ms, with less than 15 pixel drift.

	----------------------------------------------------
	"Click" event proxy.
	----------------------------------------------------
	Event.add(window, "click", function(event, self) {});

	----------------------------------------------------
	"Device Motion" and "Shake" event proxy.
	----------------------------------------------------
	http://developer.android.com/reference/android/hardware/SensorEvent.html#values
	----------------------------------------------------
	Event.add(window, "shake", function(event, self) {});
	Event.add(window, "devicemotion", function(event, self) {
		console.log(self.acceleration, self.accelerationIncludingGravity);
	});

	----------------------------------------------------
	"Mouse Wheel" event proxy.
	----------------------------------------------------
	Event.add(window, "mousewheel_fix", function(event, self) {
		console.log(self.state, self.wheelDelta);
	});
