;(function(root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory(window, document);
	} else {
		root.HardcoreScrollbar = factory(window, document);
	}
})(this, function(w, d) {
	var raf = w.requestAnimationFrame || w.setImmediate || function(c) { return setTimeout(c, 0); };
	var scrollbarSize = 0

	function test() {
		raf(function() {
			var testStyle = 'width:5em;height:5em;overflow:scroll;position:absolute;top:-1000em;left:-1000em;z-index:1000000;';
			var testDiv = '<div id="___hardcrore_test_node" style="'+testStyle+'"><div></div></div>';
			d.body.insertAdjacentHTML('beforeend', testDiv);

			testDiv = d.querySelector('#___hardcrore_test_node');
			scrollbarSize = testDiv.offsetWidth-testDiv.clientWidth,

			testDiv.parentNode.removeChild(testDiv);
			attachStyle();
		});
	}

	function attachStyle() {
		raf(function() {
			var style = document.createElement('style');
			style.appendChild(document.createTextNode(''));
			d.head.appendChild(style);

			style.sheet.insertRule('.ss-content { width: calc(100% + '+scrollbarSize+'px); }', 0);
		});
	}

	function attach(el) {
		if (Object.prototype.hasOwnProperty.call(el, 'data-hardcore-scrollbar')) {
			return el['data-hardcore-scrollbar'];
		}

		var instance = new HardcoreScrollbar(el);
		Object.defineProperty(el, 'data-hardcore-scrollbar', { value: instance });

		return instance;
	}

	function dragDealer(el, context) {
		var lastPageY;

		el.addEventListener('mousedown', function(e) {
			lastPageY = e.pageY;
			el.classList.add('ss-grabbed');
			d.body.classList.add('ss-grabbed');

			d.addEventListener('mousemove', drag);
			d.addEventListener('mouseup', stop);

			return false;
		});

		function drag(e) {
			var delta = e.pageY - lastPageY;
			lastPageY = e.pageY;

			raf(function() {
				context.el.scrollTop += (delta / context.scrollRatio * context.dragRatio);
			});
		}

		function stop() {
			el.classList.remove('ss-grabbed');
			d.body.classList.remove('ss-grabbed');
			d.removeEventListener('mousemove', drag);
			d.removeEventListener('mouseup', stop);
		}
	}

	// Constructor
	function ss(el) {
		this.target = el;
		this.bar = '<div class="ss-track"><div class="ss-scroll"></div>';

		this.wrapper = d.createElement('div');
		this.wrapper.setAttribute('class', 'ss-wrapper');

		this.el = d.createElement('div');
		this.el.setAttribute('class', 'ss-content');

		this.wrapper.appendChild(this.el);

		while(this.target.firstChild) {
			this.el.appendChild(this.target.firstChild);
		}
		this.target.appendChild(this.wrapper);

		this.target.insertAdjacentHTML('beforeend', this.bar);
		this.bar = this.target.lastChild.lastChild;
		this.track = this.target.lastChild;

		dragDealer(this.bar, this);
		this.moveBar();

		// let's stop the listener spam. Need a refernce to this exact context to later remove the listener.
		this.moveHandlerBound = this.moveBar.bind(this);

		w.addEventListener('resize', this.moveHandlerBound);
		this.el.addEventListener('scroll', this.moveHandlerBound);
		this.el.addEventListener('mouseenter', this.moveHandlerBound);

		this.target.classList.add('ss-container');

		var css = w.getComputedStyle(el);
		if (css['height'] === '0px' && css['max-height'] !== '0px') {
			el.style.height = css['max-height'];
		}

		this.observer = new MutationObserver(function(list) {
			if(list.length) this.moveBar();
		}.bind(this));

		this.observer.observe(this.el, {
			childList: true,
			subtree: true,
		});

		this.destroy = destroy.bind(this);
	}

	function destroy() {
		// we could create a mutation observer on the container but I'm too lazy to check whether it fires
		// consistently when parent node is destroyed too. Just call this inside whatever code instantiated
		// the scrollbar when the element is destroyed. Use instance returned from attach(). If we don't have
		// instance, calling attach() again on the same node will return it.
		w.removeEventListener('resize', this.moveHandlerBound);
		this.el.removeEventListener('scroll', this.moveHandlerBound);
		this.el.removeEventListener('mouseenter', this.moveHandlerBound);

		this.observer.disconnect();
	}

	ss.prototype = {
		moveBar: function() {
			var totalHeight = this.el.scrollHeight;
			var ownHeight = this.el.clientHeight;
			this.scrollRatio = ownHeight / totalHeight;

			// need to correct the drag ratio if track has been restyled to be of a different size than the container
			this.dragRatio = this.wrapper.clientHeight/this.track.clientHeight;

			var _this = this;
			var right = (_this.target.clientWidth - _this.bar.clientWidth) * -1;

			raf(function() {
				if(_this.scrollRatio >= 1) {
					_this.bar.classList.add('ss-hidden');
				} else {
					_this.bar.classList.remove('ss-hidden');
					_this.bar.style.cssText = 'height:' + (_this.scrollRatio * 100) + '%; top:' + (_this.el.scrollTop / totalHeight ) * 100 + '%;right:' + right + 'px;';
				}
			});
		}
	}

	ss.attach = attach;
	test();

	var HardcoreScrollbar = ss;
	return HardcoreScrollbar;
});
