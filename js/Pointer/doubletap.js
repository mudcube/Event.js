/**
 * Gesture recognizer for the `doubletap` gesture.
 *
 * Taps happen when an element is pressed and then released.
 */
(function(exports) {
  var DOUBLETAP_TIME = 300;

  function pointerDown(e) {
    var now = new Date();
    if (now - this.lastDownTime < DOUBLETAP_TIME) {
      this.lastDownTime = 0;
      window._createCustomEvent('gesturedoubletap', e.target, {});
    }
    this.lastDownTime = now;
  }

  /**
   * Make the specified element create gesturetap events.
   */
  exports.Gesture._gestureHandlers.gesturedoubletap = function(el) {
    el.addEventListener('pointerdown', pointerDown);
  };

})(window);
