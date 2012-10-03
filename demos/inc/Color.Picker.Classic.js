/* 
	----------------------------------------------------
	Color Picker : 1.1.2 : 2012/09/08 : http://mudcu.be
	----------------------------------------------------
	http://colrd.com/misc/labs/Color-Picker/Classic/index.html
	----------------------------------------------------
	Firefox 2+, Safari 3+, Opera 9+, Google Chrome, IE9+
	----------------------------------------------------
	var picker = new Color.Picker({
		display: true,
		color: "#643263", // accepts rgb(), rgba(), hsl(), hsla(), or #hex
		style: "top: 220px; right: 270px",
		callback: function(rgba, state, type) {
			document.body.style.background = Color.Space(rgba, "RGBA>W3");
		}
	});
	----------------------------------------------------
	@ColorPicker #Event.js #Color/Space.js
*/

if (typeof(Color) === "undefined") var Color = {};

(function() {

Color.Picker = function (conf) {
	if (!window.zIndexGlobal) window.zIndexGlobal = 100;
	var that = this;
	var modules = conf.modules;
	if (typeof(modules) === "undefined") {
		modules = { hue: true, satval: true, alpha: true };
	}
	/// loading properties
	if (typeof(conf) === "undefined") conf = {};
	this.state = "colorPicker"; // the other state is "eyeDropper"
	this.callback = conf.callback; // bind custom function
	this.color = getHSVA(conf.color);
	this.eyedropLayer = conf.eyedropLayer;
	this.eyedropMouseLayer = conf.eyedropMouseLayer || conf.eyedropLayer;
	this.container = conf.container || document.body;
	this.margin = conf.margin || 12; // margins on colorpicker
	this.offset = this.margin / 2;
	this.conf = {
		"hue": {
			column: 0,
			enable: true,
			width: modules.hue.width || 30,
			height: modules.hue.height || 200
		}, 
		"satval": {
			column: 1,
			enable: true,
			width: modules.satval.width || 200,
			height: modules.satval.height || 200
		},
		"alpha": {
			column: 2,
			enable: true,
			width: modules.alpha.width || 30,
			height: modules.alpha.height || 200
		}
	};

	/// Useful for toggling focus when picker is over an iframe.
	this.onMouseDown = conf.onMouseDown; 
	this.onMouseUp = conf.onMouseUp;

	/// Creating our color picker.
	var plugin = document.createElement("div");
	plugin.id = "ColorPicker";
	///
	var pickerWidth = 0;
	var pickerHeight = 0;
	var row = -1;
	for (var key in this.conf) {
		pickerWidth += this.conf[key].width + this.margin + this.offset - 7;
		if (row !== this.conf[key].row) {
			pickerHeight += this.conf[key].height + this.margin * 2;
			row = this.conf[key].row;
		}
	}
	plugin.style.cssText = conf.style;
	plugin.style.height = pickerHeight + "px";
	plugin.style.width = pickerWidth + "px";

	/// appending to element
	this.container.appendChild(plugin);
	this.element = plugin;

	/// Current selected color as the background of this box.
	var hexBoxContainer = document.createElement("div");
	hexBoxContainer.style.backgroundImage = "url("+interlace.data+")";
	hexBoxContainer.className = "hexBox";
	hexBoxContainer.title = "Eyedropper";
	if (that.eyedropMouseLayer) {
		var mouseLayerTitle;
		var mouseLayerUpdate = function(event) {
			var coord = Event.proxy.getCoord(event);	
			var ctx = that.eyedropLayer.getContext("2d");
			var data = ctx.getImageData(coord.x, coord.y, 1, 1);
			var color = Color.Space(data.data, "RGBA>HSVA");
			that.update(color, "HSVA");
		};
		var mouseLayerExit = function() {
			that.callback(Color.Space(that.color, "HSVA>RGBA"), "up");
			hexBoxContainer.className = "hexBox";
			that.eyedropMouseLayer.style.cursor = "default";
			that.eyedropMouseLayer.title = mouseLayerTitle;
			Event.remove(that.eyedropMouseLayer, "mouseup", mouseLayerExit);
			Event.remove(that.eyedropMouseLayer, "mousemove", mouseLayerUpdate);
			setTimeout(function() { 
				that.state = "colorPicker";
			}, 50);
		};
		Event.add(that.eyedropMouseLayer, "mousedown", function() {
			hexInput.blur();
		});
		Event.add(hexBoxContainer, "mousedown", Event.cancel);
		Event.add(hexBoxContainer, "click", function(event) {
			if (that.state === "eyeDropper") return mouseLayerExit();
			that.state = "eyeDropper";
			mouseLayerTitle = that.eyedropMouseLayer.title;
			hexBoxContainer.className = "hexBox active";
			that.eyedropMouseLayer.style.cursor = "crosshair";
			that.eyedropMouseLayer.title = "Pick color";
			Event.add(that.eyedropMouseLayer, "mouseup", mouseLayerExit);
			Event.add(that.eyedropMouseLayer, "mousemove", mouseLayerUpdate);
		});
	}
	
	///
	var hexBox = document.createElement("div");
	hexBoxContainer.appendChild(hexBox);
	plugin.appendChild(hexBoxContainer);

	/// Creating the HEX input element.
	var isHex = /[^a-f0-9]/gi;
	var hexInput = document.createElement("input");
	hexInput.title = "HEX Code";
	hexInput.className = "hexInput";
	hexInput.size = 6;
	hexInput.type = "text";
	//
	Event.add(hexInput, "mousedown", Event.stop);
	Event.add(hexInput, "keydown change", function(event) {
		Event.stop(event);
		var code = event.keyCode;
		var value = hexInput.value.replace(isHex, '').substr(0, 6);
		var hex = parseInt("0x" + value);
		if (event.type === "keydown") {
			if (code === 40) { // less
				hex = Math.max(0, hex - (event.shiftKey ? 10 : 1));
				hexInput.value = Color.Space(hex, "HEX24>W3").toUpperCase().substr(1);
			} else if (code === 38) { // more
				hex = Math.min(0xFFFFFF, hex + (event.shiftKey ? 10 : 1));
				hexInput.value = Color.Space(hex, "HEX24>W3").toUpperCase().substr(1);
			} else {
				return;
			}
		}
		if (String(hex) === "NaN") return;
		if (hex > 0xFFFFFF) hex = 0xFFFFFF;
		if (hex < 0) hex = 0;
		var update = (event.type === "change") ? "" : "hex";
		that.update(Color.Space(hex, "HEX24>RGB"), "RGB");
		if (event.keyCode === 27) this.blur();
	});
	//
	plugin.appendChild(hexInput);

	/// Creating the close button.
	var hexClose = document.createElement("div");
	hexClose.title = "Close";
	hexClose.className = "hexClose";
	hexClose.innerHTML = "x";
	Event.add(hexClose, "mousedown", Event.cancel);
	Event.add(hexClose, "click", function(event) {
		that.toggle(false);
	});
	plugin.appendChild(hexClose);
	plugin.appendChild(document.createElement("br"));

	/// Creating colorpicker sliders.
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");
	canvas.style.cssText = "position: absolute; top: 32px; left: " + this.offset + "px;";
	canvas.width = this.conf.satval.width + this.conf.hue.width + this.conf.alpha.width + this.margin * 3;
	canvas.height = this.conf.satval.width + this.margin;
	plugin.appendChild(canvas);
	///
	Event.add(plugin, "mousedown mousemove mouseup", function (event) {
		var down = (event.type === "mousedown" || event.type === "touchstart");
		var up = (event.type === "mouseup" || event.type === "touchend");
		///
		if (down) {
			if (that.onMouseDown) {
				that.onMouseDown(event);
			}
			Event.stop(event);
			hexInput.blur();
		}
		///
		if (up && that.onMouseDown) {
			that.onMouseUp(event);
		}
		///
		var offset = that.margin / 2;
		var abs = { x: 0, y: 0 };
		if (window !== canvas) {
			var tmp = canvas;
			while(tmp !== null) { 
				abs.x += tmp.offsetLeft; 
				abs.y += tmp.offsetTop; 
				tmp = tmp.offsetParent; 
			};
		}
		var xx = event.touches ? event.touches[0].pageX : event.pageX;
		var yy = event.touches ? event.touches[0].pageY : event.pageY;
		var x0 = (xx - abs.x) - offset;
		var y0 = (yy - abs.y) - offset;
		var x = clamp(x0, 0, canvas.width);
		var y = clamp(y0, 0, that.conf.satval.height);
		if (event.target.className === "hexInput") {
			plugin.style.cursor = "text";
			return; // allow selection of HEX		
		} else if (x !== x0 || y !== y0) { // move colorpicker
			plugin.style.cursor = "move";
			plugin.title = "Move";
			if (down) Event.proxy.drag({
				position: "move",
				event: event,
				target: plugin,
				listener: function (event, self) {
					var x1 = 0;
					var y1 = 0;
					var x2 = window.innerWidth;
					var y2 = window.innerHeight
					var width = self.target.offsetWidth;
					var height = self.target.offsetHeight;
					if (self.x + width > x2) self.x = x2 - width;
					if (self.y + height > y2) self.y = y2 - height;
					if (self.x < x1) self.x = x1;
					if (self.y < y1) self.y = y1;
					///
					plugin.style.left = self.x + "px";
					plugin.style.top = self.y + "px";
					if (self.state === "down") {
						plugin.style.zIndex = window.zIndexGlobal ++;
					} else if (self.state === "up") {
						if (conf.recordCoord) {
							conf.recordCoord({ 
								id: plugin.id, 
								left: self.x / x2, 
								top: self.y / y2,
								display: "block"
							});
						}
					}
					Event.prevent(event);
				}
			});
		} else if (x <= that.conf.satval.width) { // saturation-value selection
			if (that.conf.satval.enable === false) return;
			plugin.style.cursor = "crosshair";
			plugin.title = "Saturation + Value";
			if (down) Event.proxy.drag({
				position: "relative",
				event: event,
				target: canvas,
				listener: function (event, self) {
					var x = clamp(self.x - that.offset, 0, that.conf.satval.width);
					var y = clamp(self.y - that.offset, 0, that.conf.satval.height);
					that.color.S = x / that.conf.satval.width * 100; // scale saturation
					that.color.V = 100 - (y / that.conf.satval.height * 100); // scale value
					that.drawSample(self.state, true);
					Event.prevent(event);
				}
			});
		} else if (x > that.conf.satval.width + that.margin && x <= that.conf.satval.width + that.margin + that.offset + that.conf.hue.width) { // hue selection
			if (that.conf.hue.enable === false) return;
			plugin.style.cursor = "crosshair";
			plugin.title = "Hue";
			if (down) Event.proxy.drag({
				position: "relative",
				event: event,
				target: canvas,
				listener: function (event, self) {
					var y = clamp(self.y - that.offset, 0, that.conf.satval.height);
					that.color.H = 360 - (Math.min(1, y / that.conf.satval.height) * 360);
					that.drawSample(self.state, true);
					Event.prevent(event);
				}
			});
		} else if (x > that.conf.satval.width + that.conf.alpha.width + that.margin * 2 && x <= that.conf.satval.width + that.margin * 2 + that.offset + that.conf.alpha.width * 2) { // alpha selection
			if (that.conf.alpha.enable === false) return;
			plugin.style.cursor = "crosshair";
			plugin.title = "Alpha";
			if (down) Event.proxy.drag({
				position: "relative",
				event: event,
				target: canvas,
				listener: function (event, self) {
					var y = clamp(self.y - that.offset, 0, that.conf.satval.height);
					that.color.A = (1 - Math.min(1, y / that.conf.satval.height)) * 255;
					that.drawSample(self.state, true);
					Event.prevent(event);
				}
			});
		} else { // margin between hue/saturation-value
			plugin.style.cursor = "default";
		}
		return false; // prevent selection
	});

	/// helper functions
	
	this.update = function(color, alpha) { // accepts HEX, RGB, and HSV
		if (color) that.color = getHSVA(color);
		if (typeof(alpha) === "number") that.color.A = alpha;
		that.drawSample("update", true);
	};
	
	this.drawSample = function (state, update) {
		// clearing canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		that.drawSquare();
		that.drawHue();
		if (this.conf.alpha) that.drawAlpha();
		// retrieving hex-code
		var rgba = Color.Space(that.color, "HSVA>RGBA");
		var hex = Color.Space(rgba, "RGB>HEX24>W3");
		// display hex string
		hexInput.value = hex.toUpperCase().substr(1);
		// display background color
		hexBox.style.backgroundColor = Color.Space(rgba, "RGBA>W3");
		// draw controls
		ctx.save();
		if (this.conf.alpha) { // arrow-selection
			ctx.globalAlpha = this.conf.alpha.enable ? 1.0 : 0;
			var left = that.conf.satval.width + that.margin * 2 + that.conf.hue.width + that.conf.alpha.width + that.offset;
			var y = ((255 - that.color.A) / 255) * that.conf.satval.height - 2;
			ctx.drawImage(arrow, left + 2, Math.round(y) + that.offset - 1);
		}
		if (this.conf.hue) { // arrow-selection
			ctx.globalAlpha = this.conf.hue.enable ? 1.0 : 0;
			var left = that.conf.satval.width + that.margin + that.offset + that.conf.hue.width;
			var y = ((360 - that.color.H) / 362) * that.conf.satval.height - 2;
			ctx.drawImage(arrow, left + 2, Math.round(y) + that.offset - 1);
		}
		if (this.conf.satval) { // circle-selection
			ctx.globalAlpha = this.conf.satval.enable ? 1.0 : 0;
			var x = that.color.S / 100 * that.conf.satval.width;
			var y = (1 - (that.color.V / 100)) * that.conf.satval.height;
			x = x - circle.width / 2;
			y = y - circle.height / 2;
			ctx.drawImage(circle, Math.round(x) + that.offset, Math.round(y) + that.offset);
		}
		ctx.restore();
		// run custom code
		if (that.callback && state && update) {
			that.callback(rgba, state);
		}
	};

	this.drawSquare = function () {
		// retrieving hex-code
		var hex = Color.Space({
			H: that.color.H,
			S: 100,
			V: 100
		}, "HSV>RGB>HEX24>W3");
		var rgb = Color.Space.HEX_RGB("0x"+hex);
		var offset = that.offset;
		var size = that.conf.satval.width;
		// drawing color
		ctx.save();
		ctx.fillStyle = interlace;
		ctx.fillRect(offset, that.offset, that.conf.satval.width, that.conf.satval.height);
		ctx.globalAlpha = that.color.A / 255;
		ctx.fillStyle = grayscale(hex, "satval");
		ctx.fillRect(offset, offset, size, size);
		// overlaying saturation
		var gradient = ctx.createLinearGradient(offset, offset, size + offset, 0);
		gradient.addColorStop(0, grayscale("rgba(255, 255, 255, 1)", "satval"));
		gradient.addColorStop(1, grayscale("rgba(255, 255, 255, 0)", "satval"));
		ctx.fillStyle = gradient;
		ctx.fillRect(offset, offset, size, size);
		// overlaying value
		var gradient = ctx.createLinearGradient(0, offset, 0, size + offset);
		gradient.addColorStop(0.0, "rgba(0, 0, 0, 0)");
		gradient.addColorStop(1.0, "rgba(0, 0, 0, 1)");
		ctx.fillStyle = gradient;
		ctx.fillRect(offset, offset, size, size);
		// drawing outer bounds
		ctx.strokeStyle = grayscale("rgba(255,255,255,0.15)", "satval");
		ctx.strokeRect(offset+0.5, offset+0.5, size-1, size-1);
		ctx.restore();
	};
	
	var grayscale = function(color, type) {
		if (that.conf[type].enable === true) {
			return color;
		}
		if (color.substr(0, 4) === "rgba") {
			color = Color.Space(color, "W3>RGBA");
		} else { // HEX
			color = Color.Space(color, "W3>HEX32>RGBA");
		}
		var L = Math.round(0.33 * color.R + 0.33 * color.G + 0.33 * color.B);
		return "rgba(" + L + "," + L + "," + L + "," + ((color.A / 255) * 0.42) + ")";
	};

	this.drawHue = function () {
		// drawing hue selector
		var left = that.conf.satval.width + that.margin + that.offset;
		ctx.fillStyle = interlace;
		ctx.fillRect(left, that.offset, that.conf.hue.width, that.conf.satval.height);
		///
		var gradient = ctx.createLinearGradient(0, 0, 0, that.conf.satval.width + that.offset);
		gradient.addColorStop(0, grayscale("rgba(255, 0, 0, 1)", "hue"));
		gradient.addColorStop(5/6, grayscale("rgba(255, 255, 0, 1)", "hue"));
		gradient.addColorStop(4/6, grayscale("rgba(0, 255, 0, 1)", "hue"));
		gradient.addColorStop(3/6, grayscale("rgba(0, 255, 255, 1)", "hue"));
		gradient.addColorStop(2/6, grayscale("rgba(0, 0, 255, 1)", "hue"));
		gradient.addColorStop(1/6, grayscale("rgba(255, 0, 255, 1)", "hue"));
		gradient.addColorStop(1, grayscale("rgba(255, 0, 0, 1)", "hue"));
		ctx.save();
		ctx.globalAlpha = that.color.A / 255;
		ctx.fillStyle = gradient;
		ctx.fillRect(left, that.offset, that.conf.hue.width, that.conf.satval.height);
		// drawing outer bounds
		ctx.strokeStyle = grayscale("rgba(255,255,255,0.2)", "hue");
		ctx.strokeRect(left + 0.5, that.offset + 0.5, that.conf.hue.width - 1, that.conf.hue.height - 1);
		ctx.restore();
	};
	
	this.drawAlpha = function () {
		// drawing hue selector
		var left = that.conf.satval.width + that.margin * 2 + that.conf.hue.width + that.offset;
		ctx.fillStyle = interlace;
		ctx.fillRect(left, that.offset, that.conf.alpha.width, that.conf.satval.height);
		///
		var rgb = Color.Space.HSV_RGB({ H: that.color.H, S: that.color.S, V: that.color.V });
		var gradient = ctx.createLinearGradient(0, 0, 0, that.conf.satval.height);
		rgb.A = 255;
		gradient.addColorStop(0, grayscale(Color.Space.RGBA_W3(rgb), "alpha"));
		rgb.A = 0;
		gradient.addColorStop(1, grayscale(Color.Space.RGBA_W3(rgb), "alpha"));
		ctx.fillStyle = gradient;
		ctx.fillRect(left, that.offset, that.conf.alpha.width, that.conf.satval.height);
		// drawing outer bounds
		ctx.strokeStyle = "rgba(255,255,255,0.2)";
		ctx.strokeRect(left + 0.5, that.offset + 0.5, that.conf.alpha.width - 1, that.conf.satval.height - 1);
	};
	
	this.toggle = function (display) {
		if (typeof(display) !== "boolean") {
			if (plugin.style.display === "block") {
				display = false;
			} else { // display === "none"
				display = true;
			}
		}
		///
		if (display) {
			plugin.style.display = "block";
			setTimeout(function() {
				plugin.style.opacity = 1;
			}, 150);
		} else {
			plugin.style.opacity = 0;
			setTimeout(function() {
				plugin.style.display = "none";
			}, 150);
		}
		///
		if (conf.recordCoord) {
			conf.recordCoord({ 
				id: plugin.id, 
				display: display ? "block" : "none"
			});
		}
		///
		if (display && conf.autoclose) {
			var mousedown = function() {
				Event.remove(window, "mousedown", mousedown);
				that.toggle(false);
			};
			Event.add(window, "mousedown", mousedown);
		}
	};

	this.destory = function () {
		document.body.removeChild(plugin);
		for (var key in that) delete that[key];
	};

	// drawing color selection
	this.drawSample("create");
	///
	if (typeof(conf.display) !== "undefined") {
		this.toggle(conf.display);
	}
	//
	return this;
};

var getHSVA = function(color) {
	if (typeof(color) === "string") {
		if (color.substr(0, 4) === "hsla") {
			color = Color.Space(color, "W3>HSLA>RGBA>HSVA");
		} else if (color.substr(0, 4) === "rgba") {
			color = Color.Space(color, "W3>RGBA>HSVA");
		} else if (color.substr(0, 3) === "rgb") {
			color = Color.Space(color, "W3>RGB>HSV");
		} else { // HEX
			color = Color.Space(color, "W3>HEX24>RGB>HSV");
		}
	} else if (typeof(color.R) !== "undefined") {
		color = Color.Space(color, "RGB>HSV");
	} else if (typeof(color.H) !== "undefined") {
		color = color;
	}
	if (typeof(color.A) === "undefined") {
		color.A = 255;
	}
	return color;
};

/// Creating the arrows.
var arrow = (function () { // creating arrow
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");
	var size = 16;
	var width = size / 3;
	canvas.width = size;
	canvas.height = size;
	var top = -size / 4;
	var left = 0;
	for (var n = 0; n < 20; n++) { // multiply anti-aliasing
		ctx.beginPath();
		ctx.fillStyle = "#fff";
		ctx.moveTo(left, size / 2 + top);
		ctx.lineTo(left + size / 4, size / 4 + top);
		ctx.lineTo(left + size / 4, size / 4 * 3 + top);
		ctx.fill();
	}
	ctx.translate(-width, -size);
	return canvas;
})();

/// Creating the circle indicator.
var circle = (function () { // creating circle-selection
	var canvas = document.createElement("canvas");
	canvas.width = 10;
	canvas.height = 10;
	var ctx = canvas.getContext("2d");
	ctx.lineWidth = 1;
	ctx.beginPath();
	var x = canvas.width / 2;
	var y = canvas.width / 2;
	ctx.arc(x, y, 4.5, 0, Math.PI * 2, true);
	ctx.strokeStyle = '#000';
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(x, y, 3.5, 0, Math.PI * 2, true);
	ctx.strokeStyle = '#FFF';
	ctx.stroke();
	return canvas;
})();

/// Creating the interlacing background.
var interlace = (function (size, color1, color2) {
	var proto = document.createElement("canvas").getContext("2d");
	proto.canvas.width = size * 2;
	proto.canvas.height = size * 2;
	proto.fillStyle = color1; // top-left
	proto.fillRect(0, 0, size, size);
	proto.fillStyle = color2; // top-right
	proto.fillRect(size, 0, size, size);
	proto.fillStyle = color2; // bottom-left
	proto.fillRect(0, size, size, size);
	proto.fillStyle = color1; // bottom-right
	proto.fillRect(size, size, size, size);
	var pattern = proto.createPattern(proto.canvas, "repeat");
	pattern.data = proto.canvas.toDataURL();
	return pattern;
})(8, "#FFF", "#eee");

/// 
var clamp = function(n, min, max) {
	return (n < min) ? min : ((n > max) ? max : n);
};

})();