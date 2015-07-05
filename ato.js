"use strict";

var MicroEvent = require('microevent-mistic100');

function getKeyFromElement(elt, options) {
	var keys = options.attributes;
	keys     = keys.filter(k => elt.hasAttribute(k));
	return keys.length ? keys[0] : false;
}

function removeEventListener(el, eventName, handler) {
  if (el.removeEventListener)
    el.removeEventListener(eventName, handler);
  else
    el.detachEvent('on' + eventName, handler);
}

function addEventListener(el, eventName, handler) {
  if (el.addEventListener) {
    el.addEventListener(eventName, handler);
  } else {
    el.attachEvent('on' + eventName, function(){
      handler.call(el);
    });
  }
}

function getValueFromElement(elt, options) {
	// if (options.html) {
		// return elt.innerHTML;
	// }
	if (options.text) {
		return elt.textContent;
	}
	switch(elt.tagName.toLowerCase()) {
		case 'input':
		case 'textarea':
			if (elt.type === 'checkbox' || elt.type === 'radio') {
				if (!elt.hasAttribute('value')) {
					return !!elt.checked;
				}
			}
			return elt.value;
		case 'select':
			if (elt.selectedIndex >= 0) {
				let option = elt[elt.selectedIndex];
				if (option.hasAttribute('value')) {
					return option.value;
				} else {
					return option.textContent;
				}
			}
			return undefined;
	}
	return elt.textContent;
}

function selectOption(elt, value) {
	var foundOption = false;
	for(var i=0; i<options.length; i++) {
		if (elt.options[i].value == value) {
			elt.selectedIndex = i;
			foundOption = true;
		}
	}
	if (!foundOption) {
		if (typeof(value) === 'string' && (Number(value) != value)) {
			for(var i=0; i<options.length; i++) {
				if (elt.options[i].textContent == value) {
					elt.selectedIndex = i;
					foundOption = true;
				}
			}
		}
		else {
			elt.selectedIndex = value;
		}
	}
}

function setValueOnElement(elt, value, key, data, options) {
	if (options.html !== false) {
		if (typeof(options.html) === 'function') {
			elt.innerHTML = options.html(value, elt, key, data);
		} else {
			elt.innerHTML = value;
		}
		return;
	}
	if (options.text) {
		elt.textContent = value;
		return;
	}

	var tag = elt.tagName.toLowerCase();
	switch(tag) {
		case 'input':
		case 'textarea':
			switch(elt.type) {
				case 'checkbox':
				case 'radio':
					if (typeof(value) === 'boolean') {
						elt.checked = !!value;
					} else {
						elt.value = value;
					}
					break;
				default:
					elt.value = value;
					break;
			}
			break;
		case 'select':
			selectOption(elt, value);
			break;
		default:
			elt.textContent = value;
			break;
	}
}

function getBindableSelector(options) {
	if (typeof(options.bindable) === 'string') {
		options.bindable = options.bindable.split(/[,\s]/g);
	}
	var selector = options.bindable
		.map(tag => options.attributes.map(attr => `${tag}[${attr}]`).join(','))
		.join(',');
	return selector;
}

function filterBindableByKey($bindable, data, options) {
	var out = new Map();

	console.log(typeof($bindable), $bindable);
	for(let k in data) {
		if (k === options.privateDataKey) {
			continue;
		}
		for(let i=0; i < $bindable.length; i++) {
			let elt       = $bindable[i];
			var attribute = getKeyFromElement(elt, options);
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
}

function initPrivateData(data, options) {
	var privateDataKey = options.privateDataKey;
	if (!(privateDataKey in data)) {
		data[privateDataKey] = {};
	}
	data[privateDataKey].observers = data[privateDataKey].observers || {};
	data[privateDataKey].data      = data[privateDataKey].data || {};
	return data[privateDataKey];
}

function getChildElements(root, selector, options) {
	return Array.prototype.map.call(root.querySelectorAll(selector),
		elt => { MicroEvent.mixin(elt); return elt; });
}

function triggerAll(collection, event, value, key, data) {
	if (!collection || !collection.length) {
		return;
	}
	if (data.length === 1 && Array.isArray(data[0])) {
		data = data[0];
	}
	for(let i=0; i<collection.length; i++) {
		let elt = collection[i];
		elt.trigger(event, value, key, data);
	}
}

function domOnAll($coll, event, handler) {
	for(let i=0; i<$coll.length; i++) {
		let elt = $coll[i];
		addEventListener(elt, event, handler);
	}
}

function customOnAll($coll, event, handler) {
	for(let i=0; i<$coll.length; i++) {
		let elt = $coll[i];
		elt.on(event, handler);
	}
}

function domOffAll($coll, event) {
	for(let i=0; i<$coll.length; i++) {
		let elt = $coll[i];
		removeEventListener(elt, event, handler);
	}
}

function Ato(data, $rootElt, options) {
	options = Object.assign({
		attributes:     ['data-bind', 'name'],
		bindable:       'input,select,textarea,button',
		debug:          false,
		direction:      'both', // dom|model|both
		html:           false,
		privateDataKey: '.ato',
		text:           false
	}, options);

	if (typeof($rootElt) === 'string') {
		$rootElt = document.querySelector($rootElt);
	}

	var privateData    = initPrivateData(data, options);
	var selector       = getBindableSelector(options);
	var $bindable      = getChildElements($rootElt, selector, options);
	var $bindableByKey = filterBindableByKey($bindable, data, options);

	if (options.direction == 'both' || options.direction == 'dom') {
		for(let k in data) {
			if (k === options.privateDataKey) {
				continue;
			}

			privateData.observers[k] = privateData.observers[k] || new Set();
			let observers = privateData.observers[k];

			if (k in privateData.data) {
				// Already bound!
				// @todo add to observers
				observers.add($bindableByKey.get(k));
				continue;
			}

			if (typeof(k) === 'function') {
				continue;
			}

			privateData.data[k] = data[k];
			delete(data[k]);
			observers.add($bindableByKey.get(k));

			Object.defineProperty(data, k, {
				get: function() {
					if (options.debug) {
						console.debug(`ato: get ${k} => '${privateData.data[k]}'`);
					}
					return privateData.data[k];
				},
				set: function(val) {
					privateData.data[k] = val;
					observers.forEach(
						coll => { triggerAll(coll, 'modelChanged', val, k, data); }
					);
					data.trigger('change.ato', val, k);
					if (options.debug) {
						console.debug(`ato: set ${k} to ${val} => '${privateData.data[k]}`);
					}
				},
				configurable: true,
				enumerable:   true
			});
		}
	}


	if (options.direction == 'both' || options.direction == 'dom') {
		// ($bindable, 'modelChanged.ato');

		customOnAll($bindable, 'modelChanged', function(value, key, data) {
			var eltKey = this.getAttribute(getKeyFromElement(this, options));
			if (eltKey == key) {
				if (options.debug) {
					console.debug('ato.modelChanged event', this, key, value, data);
				}
				setValueOnElement(this, value, key, data, options);
				data.trigger('updated.ato', this, key, value, data);
			}
		});
	}

	if (options.direction == 'both' || options.direction == 'model') {
		domOnAll($bindable, 'input', function(e) {
			var eltKeyAttr = getKeyFromElement(this, options);
			var eltKey     = this.getAttribute(eltKeyAttr);
			if (options.debug) {
				console.debug(`ato: ${e.type} on ${eltKey}`);
			}
			data[eltKey] = getValueFromElement(this, options);
			if (options.debug) {
				console.debug(`ato: DOM->Model set ${eltKey} = ${data[eltKey]}`);
			}
			return true;
		});
	}

	MicroEvent.mixin(data);

	return data;
};


module.exports = Ato;