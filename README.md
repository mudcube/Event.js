----------------------------------------------------
Event.js : 1.1.1 : 2013/04/06 : MIT License
----------------------------------------------------
https://github.com/mudcube/Event.js
----------------------------------------------------
<pre>
1  : click, dblclick, dbltap
1+ : tap, longpress, drag, swipe
2+ : pinch, rotate
   : mousewheel, devicemotion, shake
</pre>
----------------------------------------------------
Quirks with Typescript
----------------------------------------------------
<pre>
* When using other libraries that have built in "Event" namespace, 
  to prevent conflict use "eventjs" instead.
</pre>
----------------------------------------------------
*	Three ways to add/remove events (and why)
----------------------------------------------------
<pre>
// Retains "this" attribute as target, and overrides native addEventListener.
target.addEventListener(type, listener, useCapture); 
target.removeEventListener(type, listener, useCapture);

// Attempts to perform as fast as possible, while as similar in format to the standard
Event.add(target, type, listener, configure); 
Event.remove(target, type, listener, configure);

// Same as the previous, but cleaner looking code when configuration is present
Event.add(configure);
Event.remove(configure);
</pre>

*	Turn prototyping on/off
----------------------------------------------------
<pre>
Event.modifyEventListener = true; // add custom *EventListener commands to HTMLElements.
Event.modifySelectors = true; // add bulk *EventListener commands on NodeLists from querySelectorAll and others.
</pre>

*	Single listener with a custom configuration.
----------------------------------------------------
<pre>
// adding with addEventListener()
target.addEventListener("swipe", function(event) {
	console.log(event.velocity, event.angle, event.fingers);
}, {
	fingers: 2, // listen for specifically two fingers (minFingers & maxFingers both now equal 3)
	snap: 90 // snap to 90 degree intervals.
});

// adding with Event.add() - a bit more efficient
Event.add(target, "swipe", function(event, self) {
	console.log(self.velocity, self.angle, self.fingers);
}, {
	fingers: 2,
	snap: 90 
});

// adding with Event.add() w/ configuration
Event.add({
	target: target,
	type: "swipe",
	fingers: 2,
	snap: 90, 
	listener: function(event, self) {
		console.log(self.velocity, self.angle, self.fingers);
	}
});
</pre>

*	Multiple listeners glued together.
----------------------------------------------------
<pre>
// adding with addEventListener()
target.addEventListener("click swipe", function(event) { });

// adding with Event.add()
Event.add(target, "click swipe", function(event, self) { });
</pre>

*	Query selectors to create an event (querySelectorAll)
----------------------------------------------------
<pre>
// adding events to NodeList from querySelectorAll()
document.querySelectorAll("#element a.link").addEventListener("click", callback);

// adding with Event.add()
Event.add("#element a.link", "click", callback);
</pre>

*	Listen until selector to become available (querySelector)
----------------------------------------------------
<pre>
Event.add("body", "ready", callback);
// or...
Event.add({
	target: "body", 
	type: "ready", 
	timeout: 10000, // set a timeout to stop checking.
	interval: 30, // set how often to check for element.
	listener: callback
});
</pre>

*	Multiple listeners bound to one listener w/ configuration.
----------------------------------------------------
<pre>
var bindings = Event.add({
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

*	Multiple listeners bound to multiple callbacks w/ configuration.
----------------------------------------------------
<pre>
var bindings = Event.add({
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

*	Multiple listeners bound to multiple callbacks w/ multiple configurations.
----------------------------------------------------
<pre>
var binding = Event.add({
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

*	Capturing an event and manually forwarding it to a proxy (tiered events).
----------------------------------------------------
<pre>
Event.add(target, "down", function(event, self) {
	var x = event.pageX; // local variables that wont change.
	var y = event.pageY;
	Event.proxy.drag({
		event: event,
		target: target,
		listener: function(event, self) {
			console.log(x - event.pageX); // measure movement.
			console.log(y - event.pageY);
		}
	});
});
</pre>
----------------------------------------------------
*	Examples
----------------------------------------------------
<pre>
// "Click" :: fingers, minFingers, maxFingers.
Event.add(window, "click", function(event, self) {
	console.log(self.gesture, self.x, self.y);
});
// "Double-Click" :: fingers, minFingers, maxFingers.
Event.add(window, "dblclick", function(event, self) {
	console.log(self.gesture, self.x, self.y);
});
// "Drag" :: fingers, maxFingers, position
Event.add(window, "drag", function(event, self) {
	console.log(self.gesture, self.fingers, self.state, self.start, self.x, self.y, self.bbox);
});
// "Gesture" :: fingers, minFingers, maxFingers.
Event.add(window, "gesture", function(event, self) {
	console.log(self.gesture, self.fingers, self.state, self.rotation, self.scale);
});
// "Swipe" :: fingers, minFingers, maxFingers, snap, threshold.
Event.add(window, "swipe", function(event, self) {
	console.log(self.gesture, self.fingers, self.velocity, self.angle, self.start, self.x, self.y);
});
// "Tap" :: fingers, minFingers, maxFingers, timeout.
Event.add(window, "tap", function(event, self) {
	console.log(self.gesture, self.fingers);
});
// "Longpress" :: fingers, minFingers, maxFingers, delay.
Event.add(window, "longpress", function(event, self) {
	console.log(self.gesture, self.fingers);
});
//
Event.add(window, "shake", function(event, self) {
	console.log(self.gesture, self.acceleration, self.accelerationIncludingGravity);
});
//
Event.add(window, "devicemotion", function(event, self) {
	console.log(self.gesture, self.acceleration, self.accelerationIncludingGravity);
});
//
Event.add(window, "wheel", function(event, self) {
	console.log(self.gesture, self.state, self.wheelDelta);
});
</pre>

*	Stop, prevent and cancel.
----------------------------------------------------
<pre>
Event.stop(event); // stop bubble.
Event.prevent(event); // prevent default.
Event.cancel(event); // stop and prevent.
</pre>

*	Track for proper command/control-key for Mac/PC.
----------------------------------------------------
<pre>
Event.add(window, "keyup keydown", Event.proxy.metaTracker); // setup tracking on the metaKey.
Event.add(window, "focus load blur beforeunload", Event.proxy.metaTrackerReset); // 
console.log(Event.proxy.metaTracker(event)); // returns whether metaKey is pressed.
console.log(Event.proxy.metaKey); // indicates whether metaKey is pressed (once metaTracker is run).
</pre>

*	Test for event features, in this example Drag & Drop file support.
----------------------------------------------------
<pre>
console.log(Event.supports('dragstart') && Event.supports('drop') && !!window.FileReader);
</pre>
