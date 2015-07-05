"use strict";

var AForEach = Array.prototype.forEach;

module.exports = {
	isEnum: function(o,k) {
		return o.hasOwnProperty(k);
	},

	getKeyFromElement: function(elt, options) {
		var keys = options.attributes;
		keys     = keys.filter(k => elt.hasAttribute(k));
		return keys.length ? keys[0] : false;
	},

	removeEventListener: function(el, eventName, handler) {
		if (el.removeEventListener)
			el.removeEventListener(eventName, handler);
		else
			el.detachEvent('on' + eventName, handler);
	},

	addEventListener: function(el, eventName, handler) {
		if (el.addEventListener) {
			el.addEventListener(eventName, handler);
		} else {
			el.attachEvent('on' + eventName, el => { return handler.call(el); });
		}
	},

	getValueFromElement: function(elt, options) {
		if (options.text) {
			return elt.textContent;
		}
		var attr = this.tagToAttribute(elt);
		if (attr === false) {
			if (elt.selectedIndex >= 0) {
				let option = elt[elt.selectedIndex];
				if (option.hasAttribute('value')) {
					return option.value;
				} else {
					return option.textContent;
				}
			}
		}
		return elt[attr];
	},

	selectOption: function(elt, value) {
		// Seek for matching value first
		for(var i=0; i<options.length; i++) {
			if (elt.options[i].hasAttribute('value') && elt.value == value) {
				elt.selectedIndex = i;
				return;
			}
		}
		// Seek for matching option text
		if (typeof(value) === 'string' && (Number(value) != value)) {
			for(var i=0; i<options.length; i++) {
				if (elt.options[i].textContent == value) {
					elt.selectedIndex = i;
					return;
				}
			}
		}
		// Fallback to option index
		elt.selectedIndex = value;
	},

	tagToAttribute: function(elt) {
		var tag = elt.tagName.toLowerCase();
		if (tag === 'select') {
			return false;
		}
		if (elt.type === 'checkbox' || elt.type === 'radio') {
			return 'checked';
		}
		if (!('value' in elt)) {
			return 'textContent';
		}
		return 'value';
	},

	setValueOnElement: function(elt, value, key, data, options) {
		if (options.html) {
			try {
				return elt.innerHTML = options.html(value, elt, key, data);
			} catch(e) {
				return elt.innerHTML = value;
			}
		}
		if (options.text) {
			return elt.textContent = value;
		}

		var attr = this.tagToAttribute(elt);
		if (attr === 'checked' && typeof(value) !== 'boolean') {
			elt.value = value;
		} else if(attr === false) {
			this.selectOption(elt, value);
		} else {
			elt[attr] = value;
		}
	},


	getBindableSelector: function(options) {
		if (typeof(options.bindable) === 'string') {
			options.bindable = options.bindable.split(/[,\s]/g);
		}
		var selector = options.bindable
			.map(tag => options.attributes.map(attr => `${tag}[${attr}]`).join(','))
			.join(',');
		return selector;
	},

	filterBindableByKey: function($bindable, data, options) {
		var out = new Map();

		for(let k in data) {
			if (!this.isEnum(data, k)) {
				continue;
			}
			for(let i=0; i < $bindable.length; i++) {
				let elt       = $bindable[i];
				var attribute = this.getKeyFromElement(elt, options);
				var key       = elt.getAttribute(attribute);
				if (key       === k) {
					if (!out.has(key)) {
						out.set(key, []);
					}
					out.get(key).push(elt);
				}
			}
		}
		return out;
	},

	initPrivateData: function(data, options) {
		var privateDataKey = options.privateDataKey;
		if (!(privateDataKey in data)) {
			data[privateDataKey] = {};
			Object.defineProperty(data, privateDataKey, {
				value: {
					observers: {},
					data:      {}
				},
				enumerable: false
			});
		}
		return data[privateDataKey];
	},

	getChildElements: function(root, selector, options) {
		if (ATO_LIBRARY === 'jquery') {
			return $(root).find(selector);
		}
		return Array.prototype.map.call(
			root.querySelectorAll(selector),
			elt => { MicroEvent.mixin(elt); return elt; }
		);
	},

	triggerAll: function(collection, event, value, key, data) {
		if (!collection || !collection.length) {
			return;
		}
		if (data.length === 1 && Array.isArray(data[0])) {
			data = data[0];
		}
		AForEach.call(collection, elt => {
			elt.trigger(event, value, key, data);
		});
	},

	domOnAll: function($coll, event, handler) {
		AForEach.call($coll, elt => {
			addEventListener(elt, event, handler);
		});
	},

	customOnAll: function($coll, event, handler) {
		AForEach.call($coll, elt => {
			elt.on(event, handler);
		});
	},

	domOffAll: function($coll, event) {
		AForEach.call($coll, elt => {
			removeEventListener(elt, event, handler);
		});
	}
};