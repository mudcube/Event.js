### Demos
----------------------------------------------------
* https://sketch.io/mobile/

Your demo here?

### Supported events
----------------------------------------------------
<pre>
1  : click, dblclick, dbltap
1+ : tap, longpress, drag, swipe
2+ : pinch, rotate
   : mousewheel, devicemotion, shake
</pre>

### Three ways to add/remove events (and why)
----------------------------------------------------
<pre>
// Retains "this" attribute as target, and overrides native addEventListener.
target.addEventListener(type, listener, useCapture); 
target.removeEventListener(type, listener, useCapture);

// Has less function calls then the override version, while retains similar formatting.
eventjs.add(target, type, listener, configure); 
eventjs.remove(target, type, listener, configure);

// Same as the previous, but (arguably) cleaner looking code.
eventjs.add(configure);
eventjs.remove(configure);
</pre>

### Click: fingers, minFingers, maxFingers
----------------------------------------------------
<pre>
eventjs.add(window, "click", function(event, self) {
	console.log(self.gesture, self.x, self.y);
});
</pre>
### Double-Click: fingers, minFingers, maxFingers
----------------------------------------------------
<pre>
eventjs.add(window, "dblclick", function(event, self) {
	console.log(self.gesture, self.x, self.y);
});
</pre>
### Drag: fingers, maxFingers, position
----------------------------------------------------
<pre>
eventjs.add(window, "drag", function(event, self) {
	console.log(self.gesture, self.fingers, self.state, self.start, self.x, self.y, self.bbox);
});
</pre>
### Gesture: fingers, minFingers, maxFingers
----------------------------------------------------
<pre>
eventjs.add(window, "gesture", function(event, self) {
	console.log(self.gesture, self.fingers, self.state, self.rotation, self.scale);
});
</pre>
### Swipe: fingers, minFingers, maxFingers, snap, threshold
----------------------------------------------------
<pre>
eventjs.add(window, "swipe", function(event, self) {
	console.log(self.gesture, self.fingers, self.velocity, self.angle, self.start, self.x, self.y);
});
</pre>
### Tap: fingers, minFingers, maxFingers, timeout
----------------------------------------------------
<pre>
eventjs.add(window, "tap", function(event, self) {
	console.log(self.gesture, self.fingers);
});
</pre>
### Longpress: fingers, minFingers, maxFingers, delay
----------------------------------------------------
<pre>
eventjs.add(window, "longpress", function(event, self) {
	console.log(self.gesture, self.fingers);
});
</pre>
### Shake
----------------------------------------------------
<pre>
eventjs.add(window, "shake", function(event, self) {
	console.log(self.gesture, self.acceleration, self.accelerationIncludingGravity);
});
</pre>
### DeviceMotion (smooth quirks)
----------------------------------------------------
<pre>
eventjs.add(window, "devicemotion", function(event, self) {
	console.log(self.gesture, self.acceleration, self.accelerationIncludingGravity);
});
</pre>
### Wheel (smooth quirks)
----------------------------------------------------
<pre>
eventjs.add(window, "wheel", function(event, self) {
	console.log(self.gesture, self.state, self.wheelDelta);
});
</pre>

### Single listener with a custom configuration.
----------------------------------------------------
<pre>
// adding with addEventListener()
target.addEventListener("swipe", function(event) {
	console.log(event.velocity, event.angle, event.fingers);
}, {
	fingers: 2, // listen for specifically two fingers (minFingers & maxFingers both now equal 3)
	snap: 90 // snap to 90 degree intervals.
});

// adding with eventjs.add() - a bit more efficient
eventjs.add(target, "swipe", function(event, self) {
	console.log(self.velocity, self.angle, self.fingers);
}, {
	fingers: 2,
	snap: 90 
});

// adding with eventjs.add() w/ configuration
eventjs.add({
	target: target,
	type: "swipe",
	fingers: 2,
	snap: 90, 
	listener: function(event, self) {
		console.log(self.velocity, self.angle, self.fingers);
	}
});
</pre>

### Multiple listeners glued together.
----------------------------------------------------
<pre>
// adding with addEventListener()
target.addEventListener("click swipe", function(event) { });

// adding with eventjs.add()
eventjs.add(target, "click swipe", function(event, self) { });
</pre>

### Query selectors to create an event (querySelectorAll)
----------------------------------------------------
<pre>
// adding events to NodeList from querySelectorAll()
document.querySelectorAll("#element a.link").addEventListener("click", callback);

// adding with eventjs.add()
eventjs.add("#element a.link", "click", callback);
</pre>

### Listen until selector to become available (querySelector)
----------------------------------------------------
<pre>
eventjs.add("body", "ready", callback);
// or...
eventjs.add({
	target: "body", 
	type: "ready", 
	timeout: 10000, // set a timeout to stop checking.
	interval: 30, // set how often to check for element.
	listener: callback
});
</pre>

### Multiple listeners bound to one listener w/ configuration.
----------------------------------------------------
<pre>
var bindings = eventjs.add({
	target: target,
	type: "click swipe",
	snap: 90, // snap to 90 degree intervals.
	minFingers: 2, // minimum required fingers to start event.
	maxFingers: 4, // maximum fingers in one event.
	listener: function(event, self) {
		console.log(self.gesture); // will be click or swipe.
		console.log(self.x);
		console.log(self.y);
		console.log(self.identifier);
		console.log(self.start);
		console.log(self.fingers); // somewhere between "2" and "4".
		self.pause(); // disable event.
		self.resume(); // enable event.
		self.remove(); // remove event.
	}
});
</pre>

### Multiple listeners bound to multiple callbacks w/ configuration.
----------------------------------------------------
<pre>
var bindings = eventjs.add({
	target: target,
	minFingers: 1,
	maxFingers: 12,
	listeners: {
		click: function(event, self) {
			self.remove(); // removes this click listener.
		},
		swipe: function(event, self) {
			binding.remove(); // removes both the click + swipe listeners.
		}
	}
});
</pre>

### Multiple listeners bound to multiple callbacks w/ multiple configurations.
----------------------------------------------------
<pre>
var binding = eventjs.add({
	target: target,
	listeners: {
		longpress: {
			fingers: 1,
			wait: 500, // milliseconds
			listener: function(event, self) {
				console.log(self.fingers); // "1" finger.
			}
		},
		drag: {
			fingers: 3,
			position: "relative", // "relative", "absolute", "difference", "move"
			listener: function(event, self) {
				console.log(self.fingers); // "3" fingers.
				console.log(self.x); // coordinate is relative to edge of target.
			}
		}
	}
});
</pre>

### Capturing an event and manually forwarding it to a proxy (tiered events).
----------------------------------------------------
<pre>
eventjs.add(target, "down", function(event, self) {
	var x = event.pageX; // local variables that wont change.
	var y = event.pageY;
	eventjs.proxy.drag({
		event: event,
		target: target,
		listener: function(event, self) {
			console.log(x - event.pageX); // measure movement.
			console.log(y - event.pageY);
		}
	});
});
</pre>

### Stop, prevent and cancel.
----------------------------------------------------
<pre>
eventjs.stop(event); // stop bubble.
eventjs.prevent(event); // prevent default.
eventjs.cancel(event); // stop and prevent.
</pre>

### Track for proper command/control-key for Mac/PC.
----------------------------------------------------
<pre>
eventjs.add(window, "keyup keydown", eventjs.proxy.metaTracker); // setup tracking on the metaKey.
eventjs.add(window, "focus load blur beforeunload", eventjs.proxy.metaTrackerReset); // 
console.log(eventjs.proxy.metaTracker(event)); // returns whether metaKey is pressed.
console.log(eventjs.proxy.metaKey); // indicates whether metaKey is pressed (once metaTracker is run).
</pre>

### Test for event features, in this example Drag & Drop file support.
----------------------------------------------------
<pre>
console.log(eventjs.supports('dragstart') && eventjs.supports('drop') && !!window.FileReader);
</pre>

### Turn prototyping on/off
----------------------------------------------------
<pre>
// NOTE: These two features are on by default (so it's easy to add to a project)
//       however, I like to run without modify* support in production, as it's less hacky.
// ----------------------------------------------------
// add custom *EventListener commands to HTMLElements.
eventjs.modifyEventListener = true; 
// add bulk *EventListener commands on NodeLists from querySelectorAll and others.
eventjs.modifySelectors = true; 
</pre>

### Upgrading
----------------------------------------------------
<pre>
The latest version of MIDI.js makes calls to midijs instead of Event. This fixes issues
with using the library with other frameworks, also, using the Event namespace was a bit hacky.

If you want to use the latest library, but not update your calls (or prefer the Event namespace), 
add this to the bottom of the Event.min.js
///
var addEvent = eventjs.add;
var removeEvent = eventjs.remove;
///
(function() {
	for (var key in eventjs) {
		Event[key] = eventjs[key];
	}
	for (var key in eventjs.proxy) {
		addEvent[key] = eventjs.proxy[key];
	}
})();
</pre>

### Browser support
----------------------------------------------------
<pre>
Firefox
Chrome
Chrome Mobile
Opera
Internet Explorer - for IE8 or less include http://git.io/ppQT
Safari
Safari Mobile
</pre>

### MIT License

Copyright (c) 2010-2014 SketchIO (Michael Deal)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
