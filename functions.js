"use strict";

module.exports = {
	isEnum: function(o,k) {
		return o.hasOwnProperty(k);
	},

	off: function(el, eventName, handler) {
		if (el.removeEventListener)
			el.removeEventListener(eventName, handler);
		else
			el.detachEvent('on' + eventName, handler);
	},

	on: function(el, eventName, handler) {
		if (el.addEventListener) {
			el.addEventListener(eventName, handler);
		} else {
			el.attachEvent('on' + eventName, el => { return handler.call(el); });
		}
	},

	selectOption: function(elt, value) {
		var i;
		// Seek for matching value first
		for(i=0; i < elt.options.length; i++) {
			if (elt.options[i].hasAttribute('value') && elt.value == value) {
				elt.selectedIndex = i;
				return;
			}
		}
		// Seek for matching option text
		if (typeof(value) === 'string' && (Number(value) != value)) {
			for(i=0; i < elt.options.length; i++) {
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

	getKeyFromElement: function(elt, validAttr) {
		var keys = validAttr.filter(k => elt.hasAttribute(k));
		return keys.length ? keys[0] : false;
	},

	getValueFromElement: function(elt, asText) {
		if (asText) {
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

	setValueOnElement: function(elt, value, key, data, options) {
		var html = options.html;
		if (typeof(html) === 'object') {
			html = (key in html) ? html[key] : false;
		}
		if (html) {
			try {
				return (elt.innerHTML = html(value, elt, key, data));
			} catch(e) {
				return (elt.innerHTML = value);
			}
		}
		var text = options.text;
		if (typeof(text) === 'object') {
			text = (key in text) ? text[key] : false;
		}
		if (text) {
			try {
				return (elt.textContent = text(value, elt, key, data));
			} catch(e) {
				return (elt.textContent = value);
			}
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

	filterBindableByKey: function($bindable, data, validAttr) {
		var out = new Map();

		for(let k in data) {
			if (!this.isEnum(data, k)) {
				continue;
			}
			for(let i=0; i < $bindable.length; i++) {
				let elt       = $bindable[i];
				var attribute = this.getKeyFromElement(elt, validAttr);
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

	defineSimpleDataProperty: function(obj, name, value) {
		return Object.defineProperty(obj, name, {
			value:      value,
			enumerable: false
		});
	},

	initPrivateData: function(data, options) {
		var privateDataKey = options.privateDataKey;
		if (!(privateDataKey in data)) {
			data[privateDataKey] = {};
			this.defineSimpleDataProperty(data, privateDataKey, {
				observers: {},
				data:      {}
			});
		}
		return data[privateDataKey];
	},

	getChildElements: function(root, selector) {
		return root.querySelectorAll(selector);
	}
};
