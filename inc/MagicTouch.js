// Framework for simulating touch events without a mobile device
// Trying to be compatible with
// http://dvcs.w3.org/hg/webevents/raw-file/tip/touchevents.html
// TODO: support more of the touch API: touch{enter, leave, cancel}
// https://github.com/borismus/MagicTouch

var magictouch;
var tuio = {
	cursors: [],
	// Data structure for associating cursors with objects
	_data: {},
	_create_event: function (name, touch, attrs) {
		// Creates a custom DOM event
		var evt = document.createEvent('CustomEvent');
		evt.initEvent(name, true, true);
		// Attach basic touch lists
		evt.touches = this.cursors;
		// Get targetTouches on the event for the element
		evt.targetTouches = this._get_target_touches(touch.target);
		evt.changedTouches = [touch];
		// Attach custom attrs to the event
		for (var attr in attrs) {
			if (typeof(attrs[attr]) !== "undefined") {
				evt[attr] = attrs[attr];
			}
		}
		// Dispatch the event
		if (touch.target) {
			touch.target.dispatchEvent(evt);
		} else {
			document.dispatchEvent(evt);
		}
	},
	_get_target_touches: function (element) {
		var targetTouches = [];
		for (var i = 0; i < this.cursors.length; i++) {
			var touch = this.cursors[i];
			if (touch.target == element) {
				targetTouches.push(touch);
			}
		}
		return targetTouches;
	},
	// Callback from the main event handler
	callback: function (type, sid, fid, x, y, angle) {
		// console.log('callback type: ' + type + ' sid: ' + sid + ' fid: ' + fid);
		// Prevent superfluous events from being sent through.
		if (this.x === x && this.y === y && this.type === type && this.sid === sid) return;
		this.x = x;
		this.y = y;
		this.sid = sid;
		this.type = type;
		///
		if (type === 3) {
			var data = {
				sid: sid,
				fid: fid
			};
			this._data[sid] = data;
		} else {
			var data = this._data[sid];
			if (typeof(data) === "undefined") return;
		}
		// Setup properties.
		// See http://dvcs.w3.org/hg/webevents/raw-file/tip/touchevents.html
		data.identifier = sid;
		data.pageX = window.innerWidth * x;
		data.pageY = window.innerHeight * y;
		data.target = document.elementFromPoint(data.pageX, data.pageY);
		switch (type) {
			case 3:
				this.cursors.push(data);
				this._create_event('touchstart', data, {});
				break;
			case 4:
				this._create_event('touchmove', data, {});
				break;
			case 5:
				this.cursors.splice(this.cursors.indexOf(data), 1);
				this._create_event('touchend', data, {});
				break;
			default:
				break;
		}
		if (type === 5) {
			delete this._data[sid];
		}
	}
};

function tuio_callback(type, sid, fid, x, y, angle) {
	tuio.callback(type, sid, fid, x, y, angle);
};

/////////////////

(function() {
	magictouch = function (visible) {
		ontouchstart = ontouchmove = ontouchend = true;
		///
		var canvas = document.createElement("canvas");
		if (!canvas.getContext) return;
		var ctx = canvas.getContext('2d');
		var touches = [];
		var PI_2 = Math.PI * 2;
		///
		function update(event) {
			if (event) {
				Event.prevent(event);
				touches = event.touches;
			}
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.font = "15px arial";
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";
			///
			for (var i = 0, length = touches.length; i < length; i ++) {
				var touch = touches[i];
				var px = touch.pageX;
				var py = touch.pageY;
				ctx.beginPath();
				ctx.arc(px, py, 20, 0, PI_2, true);
				ctx.fillStyle = "rgba(200, 200, 200, 0.2)";
				ctx.fill();
				ctx.fillStyle = "rgba(0, 0, 0, 1)";
				ctx.fillText(touch.fid || i, px, py);
				ctx.lineWidth = 2.0;
				ctx.strokeStyle = "rgba(200, 0, 200, 1)";
				ctx.stroke();
			}
		};
		///
		if (typeof(ontouchstart) === "undefined") return;
		if (typeof(ontouchstart) === "object") return;
		var object = document.createElement("object");
		object.id = "tuio";
		object.type = "application/x-tuio";
		object.style.cssText = "width: 1px; height: 1px; opacity: 0; position: absolute; top: 0; left: 0;";
		document.body.appendChild(object);
		//
		if (visible === false) return;
		///
		canvas.id = "magictouch";
		canvas.style.cssText = "pointer-events: none; top: 0; left: 0; z-index: 999999; position: absolute;";
		document.body.appendChild(canvas);
		/////
		Event.add(document.body, 'touchstart', update);
		Event.add(document.body, 'touchmove', update);
		Event.add(document.body, 'touchend', update);
		Event.add(window, 'resize', function (event) {
			var w = window.innerWidth;
			var h = window.innerHeight;
			canvas.width = w;
			canvas.height = h;
		}).listener();
		///
		update();
	};
})();