/*
	----------------------------------------------------
	Keypress.js : v1.0 : 2011.05.21 : http://mudcu.be
	----------------------------------------------------
	- Regularizes keyboard IO across browsers (Chrome/Firefox/IE/Opera/Safari)
	- Keeps track of keyShift, altKey, metaKey, capsLock, and numLock.
	- Attaches events to specific ascii-codes, key-codes, char-codes, or combinations thereof.
	- Allows onkeypress for keys that dont stream natively.
	- Allows onkeydown/onkeyup for ghost keys.
	- Customize onkeypress execution speed.
	- Generates keycodeToCharcode and charcodeToKeycode translation tables.
	----------------------------------------------------
	Interface
	----------------------------------------------------
	listeners = { // Format of event tracking module
		// Use the wildcard to track the entire keyboard
		"*": function(event, state, code) { console.log("you pressed " + code); },
		// Each code can either be inputted as a charcode (122), keycode (80_shift), or ascii (G)
		"G": function(event, state, code) { console.log("you pressed shift + g"); },
		// Each code can include any combination of (_meta, _alt, _shift)
		"E_meta": function(event, state, code) { console.log("you pressed meta + shift + e"); }
	};
	----------------------------------------------------
	// Register to activate key-tracking on the above module
	events = Key.register(document, "ascii", listeners); // accepts: ascii, charcode, keycode
	----------------------------------------------------
	// Unregister to deactivate key-tracking
	events.unregister(); // self-destruct
	----------------------------------------------------
	// Set the speed of onkeypress interval (how fast do you want the data?)
	Key.setIntervalSpeed(50); // measured in ms
	----------------------------------------------------
	// Tutorial on how to convert to and from ascii/charcode/keycode
	result = "G".charCodeAt(); // ascii -> charcode
	result = String.fromCharCode(23); // charcode -> ascii
	result = String.fromCharCode(charcodeToKeycode["65_shift"]); // keycode -> ascii
	result = charcodeToKeycode["G".charCodeAt()]; // ascii -> keycode
	----------------------------------------------------
	function(event, state, code) {
		if (state !== "down") return;
		if (event.metaKey && code == 90) {
			if (event.shiftKey) { // redo
			
			} else { // undo
			}
		}
	};
*/

(function() {

	var textarea = document.createElement("textarea"); // use to grab corrent charcode (based on browser and os)
	var lastKeycode = undefined; // last pressed keycode
	var keycodeToCharcode = {}; // charcode -> keycode (keycodeToCharcode[38] = "65_shift")
	var charcodeToKeycode = {}; // keycode -> charcode (charcodeToKeycode["65_shift"] = 38)
	var isEmpty = function(o) {
		var n = 0;
		for (var key in o) n ++;
		return !n;
	}
	/// Find keyCode(s) for metaKey

	var isMetaKey = (function() {
		var useragent = navigator.userAgent.toLowerCase();
		var isMac = useragent.indexOf("macintosh") != -1;
		if(isMac && useragent.indexOf("khtml") != -1) {
			return { 91: true, 93: true };
		} else if(isMac && useragent.indexOf("firefox") != -1) { 
			return { 224: true };
		} else { // windows, linux, or mac opera
			return { 17: true };
		}
	})();

	/// Keycodes that modify other keys charcodes when used in combination

	var isModifier = {};
	isModifier[16] = "shift";
	isModifier[18] = "alt";
	isModifier[20] = "capsLock";
	isModifier[144] = "numLock";
	(function() { // add metaKey to isModifier
		for(var key in isMetaKey) {
			isModifier[key] = "meta";
		}
	})();
	
	/// Keys that stream onkeypress natively (detect as you type, and cache results)

	var isPressable = { };

	/// Keys that shouldnt stream (as you need to click them twice to get the down/up events)
	
	var stopPressable = {
		20: "capsLock",
		144: "numLock"
	};
	(function() { // add metaKey to stopPressable
		for(var key in isMetaKey) {
			stopPressable[key] = "meta";
		}
	})();
	
	/// Keycodes and their corresponding names

	var getKeycodeName = {
		8:	"delete",
		9:	"tab",
		13: "enter",
		16: "shift",
		18: "alt",
		17: "ctrl",
		20: "capsLock",
		27: "escape",
		33: "pageUp",
		34: "pageDown",
		35: "end",
		36: "home",
		37: "left",
		38: "up",
		39: "right",
		40: "down",
		45: "insert",
		46: "delete",
		91: "start",
		144: "numLock"
	};
	(function() { // F1-F12
		for(var n = 1; n < 13; n ++) { //- FIXME: Safari gives keyCodes 63236-47 onkeypress?
			getKeycodeName[n + 111] = "F" + n;
		}
	})();
	
	/// Keys that return 0 onkeydown and onkeyup in certain browsers
	/// Opera: F1-F12
	/// Firefox: :, <, >, ?, _, |, ~
	
	var isZero = undefined;

	/// Tracking the current state of keypress
	
	Key = { 
		meta: false, // is meta on?
		shift: false, // is shift on?
		alt: false, // is alt on?
		capsLock: false, // is capsLock on?
		codes: {}, // current running keycodes
		code: undefined // last keycode to enter Key.core
	};

	/// Blur when window loses focus
	
	Key.blur = function() {
		Key.meta = false;
		Key.shift = false;
		Key.alt = false;
		Key.clear();
	};
	
	/// Setting information
	
	Key.setIntervalSpeed = function(speed) { // how fast onKeyPress runs
		intervalSpeed = speed;
	};
	
	/// Retrieving information

	Key.getTargetID = function(target) {
		if(!target) return//- huh?
		if(target.eventVars == undefined) {
			var obj = target.eventVars = {};
			obj.targetID = targetID ++;
		}
		return target.eventVars.targetID;
	};
	
	/// Key management (registering targets with events)
	
	var targets = {}, // targets["targetID"]["KeyCode"]["42"]
		targetID = 0;
		
	function runOnTarget(selected, type, listeners, execute) {
		if(typeof listeners == "function") { // do something with anykey
			execute(selected, "keycode", "*", listeners);
		} else {
			if(type == "ascii") { // convert ascii to charcode
				var tmp = {};
				for(var code in listeners) {
					var charcode = code[0].charCodeAt() + code.substr(1);
					tmp[charcode] = listeners[code];
				}
				listeners = tmp;
				type = "charcode";
			}
			if(type == "charcode") { // do something with charlisteners
				for(var code in listeners) {
					execute(selected, "charcode", code, listeners[code]);
				}
			} else if(type == "keycode") { // do something with keylisteners
				for(var code in listeners) {
					execute(selected, "keycode", code, listeners[code]);
				}
			}
		}
	};

	Key.register = function(target, type, listeners) {
		var id = this.getTargetID(target); // element id
		var selected = targets[id]; // selected target element
		if(selected == undefined) { // no events registered
			selected = // create target tracker
			targets[id] = { keycode: {}, charcode: {} }; // charcode, keycode, and ascii
		}
		runOnTarget(selected, type, listeners, function(module, type, code, callback) {
			var md5 = hashString(callback.toString());
			if(!module[type]) { // activate type
				module[type] = {};
			}
			if(!module[type][code]) { // activate code
				module[type][code] = {};
			}
			module[type][code][md5] = callback // activate callback
		});
		return this.eventManager(target, type, listeners, "add");
	};
	
	Key.unregister = function(target, type, listeners) {
		var id = this.getTargetID(target); // element id
		var selected = targets[id]; // selected target element
		if(selected == undefined) return; // target not registered
		runOnTarget(selected, type, listeners, function(module, type, code, callback) {
			var md5 = hashString(callback.toString());
			if(module[type][code][md5]) { // deactivate callback
				delete module[type][code][md5];
				if (isEmpty(module[type][code])) { // deactivate code
					delete module[type][code];
					if (isEmpty(module[type])) { // deactivate type
						delete module[type];
						if (isEmpty(module)) {
							delete targets[id];
						}
					}
				}
			}
		});
		return this.eventManager(target, type, listeners, "remove");
	};
	
	/// Adding and Removing DOM events
	
	Key.eventManager = function(target, type, listeners, operation) {
		Event[operation](target, "keydown", function(event) {
			Key.down(target, event);
		});
		Event[operation](target, "keyup", function(event) {
			Key.up(target, event);
		});
		Event[operation](target, "keypress", function(event) {
			Key.press(target, event);
		});
		Event[operation](target, "blur", function(event) {
			Key.blur(target, event);
		});
		if(operation == "remove") return;
		return { // allow for self-destruct
			unregister: function() {
				Key.unregister(target, type, listeners);
				delete this.unregister;
			}
		}
	};

	/// Generation of keycode <-> charcode translations (calculates as you type [as needed])

	Event.add(window, "load", function() { // add textarea to body (to track translations)
		Event.add(textarea, "focus", function(event) {
			textarea.hasfocus = true;
		});
		Event.add(textarea, "blur", function(event) {
			textarea.hasfocus = false;
			Key.blur(undefined, event);
		});
		textarea.style.cssText = "z-index: -1; position: absolute; top: 0; left: 0; width: 1px; height: 1px; opacity: 0";
		document.body.appendChild(textarea);
	});
	
	Key.combo = function(keycode) {
		var mods = (Key.shift ? "shift_" : "") + (Key.alt ? "alt_" : "");
		return mods + keycode;
	};
	
	var ignoreNode = {
		"INPUT": true,
		"TEXTAREA": true
	};
		
	Key.translate = function(newcode) {
		var keycode = Key.combo(newcode);
		var element = document.activeElement; 
		if (ignoreNode[element.nodeName]) return;
		textarea.focus(); // focus textarea so the input is recorded
		setTimeout(function() { // wait one event loop to capture value
			if (textarea.value[0]) { // if text was inputed
				var charcode = textarea.value[0].charCodeAt();
				if(charcode == 10) charcode = 13; // convert newline to carriage return
				keycodeToCharcode[keycode] = charcode; // add keycode -> charcode conversion
				charcodeToKeycode[charcode] = keycode; // add charcode -> keycode conversion
				for(var key in targets) { // remove charcode once keycode translation is registered
					var selected = targets[key]; // selected target
					if(selected.charcode == undefined) continue;
					if(selected.charcode[charcode]) { // update registered keys
						selected.keycode[keycode] = selected.charcode[charcode];
						delete selected.charcode[charcode]; // remove hardlinked charcode
					}
				}
			}
			textarea.value = textarea.value.slice(1); // remove last entry
		}, 0);
	};

	/// Regularization of key events
	
	var intervalSpeed = 125; // how fast keypress runs

	Key.core = function(target, event, code) {
		var keyCode = Key.combo(lastKeycode);
		var charCode = keycodeToCharcode[keyCode];
		if(charCode == undefined && isPressable[lastKeycode] && !getKeycodeName[lastKeycode] && !keycodeToCharcode[lastKeycode]) {
			this.translate(lastKeycode); // generate charcode <-> keycode translation
		} else if(textarea.hasfocus) {
			textarea.blur(); // unfocus textarea
		}
		// current pressed keys
		this.code = code;
		this.codes[code] = true;
		this.listener(target, event, "down", code); // run onkeydown
		if (this.interval) window.clearInterval(this.interval); // switch key mid-steam
		var timeStart = (new Date).getTime(); // delay before stream
		var timeMax = 450; // execution delay targeting when metaKey gets in the way of key-streaming
		this.timeLastPress = timeStart;
		this.interval = window.setInterval(function() { // setup keypress stream
			var timeCurrent = (new Date).getTime();
			if(Key.meta && timeCurrent - Key.timeLastPress > timeMax) { // run onmouseup
				Key.up(target, event); //- metaKey prevented onmouseup from being executed (osx)
				return;
			} else if ((timeCurrent - timeStart) > 450) { // run onkeypress
				Key.listener(target, event, "press", code);
				timeMax = intervalSpeed;
			}
		}, intervalSpeed);
	};

	/// Tracking of key events
	
	var hasPress = false;
	Key.down = function(target, event, keyCode) {
		var keyCode = keyCode || event.keyCode;
		hasPress = false;
//		console.log("down: "+keyCode);
		lastKeycode = keyCode; // record for textarea translation
		if (keyCode == 0) return false; // no worries, fixed onkeypress (hasClick)
		if(keyCode == 9 && textarea.hasfocus) textarea.blur(); // fixes chrome from making tab go crazy :p
		this.timeLastDown = 
		this.timeLastPress = (new Date).getTime();
		if(this.isPressableInterval) { // not enough time to find out whether previous keycode was pressable
			window.clearInterval(this.isPressableInterval);
		}
		if (this.codes[keyCode]) { // keyCode already running in Key.core()
			event.preventDefault();
			return false;
		}
		if (isModifier[keyCode]) { // cache modifier and clearInterval
			Key[isModifier[keyCode]] = true;
			if (this.interval) {
				window.clearInterval(this.interval); // stop any keypresss still running
			}
		}
		if(stopPressable[keyCode]) { // force non-pressability on keycode
			isPressable[keyCode] = false;
			this.listener(target, event, "down", keyCode);
			return;
		}
		// define charcode if available
		var charCode = keycodeToCharcode[Key.combo(keyCode)];
		if(charCode && this.codes[charCode]) return; // return if corresponding charcode is running
		// execute keycode
		if(isPressable[keyCode] == false) { // stream keys that dont stream natively
			this.core(target, event, keyCode);
		} else if(isPressable[keyCode] == undefined) { // needs to determine whether key requires onKeyPress support
			this.isPressableInterval = window.setInterval(function() {
				window.clearInterval(this.isPressableInterval);
				if(isPressable[keyCode] != undefined) return;
				isPressable[keyCode] = (this.timeLastDown != this.timeLastPress);
				Key.core(target, event, keyCode);
			}, 100);
		} else if(this.meta) { // execute keys used in combination with metaKey (onkeypress is not fired)
			this.listener(target, event, "down", keyCode);
		}
	};
	
	Key.press = function(target, event, keyCode) {
		var keyCode = keyCode || event.charCode || event.keyCode;
		hasPress = true;
//		console.log("press: "+keyCode);
		this.timeLastPress = (new Date).getTime();
		if (this.codes[keyCode]) { // keyCode already running in Key.core()
			event.preventDefault();
			return false;
		}
		// check for capslock
		var str = String.fromCharCode(keyCode);
		if(str.toUpperCase() != str.toLowerCase()) {
			var uppercase = (str == str.toUpperCase());
			this.capsLock = (uppercase && !this.shift) ? true : false;
		}
		// keep track of keys that dont work with onkeyup
		if(lastKeycode == 0) {
			isZero = keyCode; 
		}
		// record pressability
		if(this.isPressableInterval) {
			window.clearInterval(this.isPressableInterval);
			isPressable[lastKeycode] = true;
		}
		// intercept into pseudo keypress
		this.core(target, event, keyCode);
	};
	
	Key.up = function(target, event, keyCode) {
		var keyCode = keyCode || event.keyCode;
//		console.log("up: "+keyCode);
		if (keyCode == 0 && isZero) {
			keyCode = isZero; // 
			isZero = undefined; 
		}
		if(this.isPressableInterval) { // not enough time to find out whether previous keycode was pressable
			window.clearInterval(this.isPressableInterval);
		}
		if(isPressable[keyCode] == undefined) { // up fired before isPressable could be defined
			this.listener(target, event, "down", keyCode);
		}
		if (isModifier[keyCode]) { // cache modifier
			if (!isMetaKey[keyCode] && this.interval) {
				window.clearInterval(this.interval); // stop any keypresss still running
			}
			Key[isModifier[keyCode]] = false;
			if (isMetaKey[keyCode]) {
				if(this.code) { // metaKey prevented onmouseup from being executed (osx)
					this.up(target, event, this.code);
				}
				this.listener(target, event, "up", keyCode, true);
				return false;
			}
		}
		// run onkeyup (forwards key combos to attached functions)
		var charcode = keycodeToCharcode[Key.combo(keyCode)];
		if (charcode && isPressable[keyCode]) { 
			keyCode = charcode;
			this.listener(target, event, "up", keyCode); 
			delete this.codes[keyCode];
			// cancel key streaming if keyCode == (alt, shift, or Key.code)
			if (this.code == keyCode && this.interval) { 
				window.clearInterval(this.interval);
				delete this.code;
			}
		} else {
			this.listener(target, event, "up", keyCode); 
			delete this.codes[keyCode];
			// cancel key streaming if keyCode == (alt, shift, or Key.code)
			if (this.code == keyCode && this.interval) { 
				window.clearInterval(this.interval);
				delete this.code;
			}
		}
		hasPress = false;
	};

	Key.blur = function(target, event) {
		if(this.interval) { // clear onKeyPress being run in Key.core
			window.clearInterval(this.interval);
		}
		if(this.code) { // complete running current key event
			this.up(target, event, this.code);
			this.code = undefined;
			this.codes = {};
		}
	};	
	
	/// Execution of keys
	
	Key.listener = function(target, event, state, code) { // execute listener
		var id = this.getTargetID(target); // element id
		var selected = targets[id]; // selected target element
		if (selected == undefined) return;
		function batch() { // process batch of events
			var modifiers = { shift: shift, meta: meta, alt: alt };
			for(var key in codes) { // go through key combinations
				var hashes = codes[key];
				for(var hash in hashes) { // go through hashes
					if (hashes[hash](event, state, code, modifiers)) {
						event.preventDefault(); // default to preventDefault (return false to prevent)
					}
				}
			}
		};
		var codes = selected["keycode"]; // registered keycodes
		if(!codes) return; // no registered codes
		var fn = undefined; // listen for key combos with codes attached
		var meta = this.meta;
		var shift = this.shift;
		var alt = this.alt;
		if(!hasPress && isMetaKey[code] && meta && (fn = codes["meta"])) batch();
		else if(code == 18 && (fn = codes["alt"])) batch();
		else if(code == 16 && (fn = codes["shift"])) batch();
		else if(meta && shift && (fn = codes["meta_shift_" + code])) batch();
		else if(meta && alt && (fn = codes["meta_alt_" + code])) batch();
		else if(meta && (fn = codes["meta_" + code])) batch();
		else if(shift && (fn = codes["shift_" + code])) batch();
		else if(alt && (fn = codes["alt_" + code])) batch();
		else if(fn = codes[code]) batch();
		else if(fn = codes["*"]) batch();
	};
	
	/// Helper functions
	
	var hashString = function(str) { // Justin Sobel Hash
		var hash = 1315423911;
		for(var i = 0; i < str.length; i++) {
			hash ^= ((hash << 5) + str.charCodeAt(i) + (hash >> 2));
		}
		return hash;
	};
	
})();