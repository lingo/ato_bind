"use strict";

var jQuery = require('jquery');
var $      = jQuery;

function getKeyFromElement(elt, options) {
	var keys = options.attributes;
	keys     = keys.filter(k => elt.hasAttribute(k));
	return keys.length ? keys[0] : false;
}

function getValueFromElement(elt, options) {
	// if (options.html) {
		// return elt.innerHTML;
	// }
	if (options.text) {
		return elt.textContent;
	}
	return $(elt).val();
}

function setValueOnElement($elt, value, key, data, options) {
	if (options.html !== false) {
		if (typeof(options.html) === 'function') {
			$elt.html(options.html(value, $elt, key, data));
		} else {
			$elt.html(value);
		}
		return;
	}
	if (options.text) {
		$elt.text(value);
		return;
	}

	var elt = $elt[0]; // Plain Old Js object
	var tag = elt.tagName.toLowerCase();
	switch(tag) {
		case 'input':
			switch(elt.type) {
				case 'checkbox':
				case 'radio':
					// if (typeof(value) === 'boolean') {
					$(elt).prop('checked', !!value);
					// } else {
					// }
					break;
				default:
					$(elt).val(value);
					break;
			}
			break;
		case 'select':
		case 'textarea':
			$elt.val(value);
			break;
		default:
			$elt.text(value);
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


module.exports = function(data, $rootElt, options) {
	options = Object.assign({
		attributes: ['data-bind', 'name'],
		bindable:   'input,select,textarea,button',
		debug:      false,
		direction:  'both', // dom|model|both
		html:       false,
		observers:  [],
		text:       false
	}, options);

	$rootElt = $($rootElt);
	console.debug('ato root element', $rootElt);
	if (options.observers) {
		options.observers = $(options.observers);
	}

	var privateDataKey = '.ato';
	if (!(privateDataKey in data)) {
		data[privateDataKey] = {};
	}

	function filterBindableByKey($bindable, data, options) {
		var out = {};
		for(let k in data) {
			if (k === privateDataKey) {
				continue;
			}
			$bindable.each(function() {
				var attribute = getKeyFromElement(this, options);
				var key       = this.getAttribute(attribute);
				if (key === k) {
					out[key] = out[key] || [];
					out[key].push(this);
				}
			});
		}

		Object.keys(out).map(k => out[k] = $(out[k]));

		return out;
	}


	var selector       = getBindableSelector(options);
	var $bindable      = $rootElt.find(selector);
	var $bindableByKey = filterBindableByKey($bindable, data, options);

	data[privateDataKey].observers = data[privateDataKey].observers || {};
	data[privateDataKey].data      = data[privateDataKey].data || {};
	var privateData                = data[privateDataKey];

	if (options.direction == 'both' || options.direction == 'dom') {
		for(let k in data) {
			if (k === privateDataKey) {
				continue;
			}

			privateData.observers[k] = privateData.observers[k] || new Set();
			let observers = privateData.observers[k];

			if (k in privateData.data) {
				// Already bound!
				// @todo add to observers
				observers.add($bindableByKey[k]);
				continue;
			}

			if (typeof(k) === 'function') {
				continue;
			}

			privateData.data[k] = data[k];
			delete(data[k]);
			observers.add($bindableByKey[k]);

			Object.defineProperty(data, k, {
				get: function() {
					if (options.debug) {
						console.debug(`ato: get ${k} => '${privateData.data[k]}'`);
					}
					return privateData.data[k];
				},
				set: function(val) {
					privateData.data[k] = val;
					if (options.observers) {
						options.observers.trigger('modelChanged', [val, k, data]);
					}
					observers.forEach(
						$coll => $coll && $coll.trigger('modelChanged', [val, k, data])
					);
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
		$bindable
		.off('modelChanged.ato')
		.on('modelChanged.ato', function(e, value, key, data) {
			var eltKey = this.getAttribute(getKeyFromElement(this, options));
			if (eltKey == key) {
				if (options.debug) {
					console.debug('ato.modelChanged event', this, key, value, data);
				}
				var $this = $(this);
				setValueOnElement($this, value, key, data, options);
				if (typeof(options.onUpdate) === 'function') {
					options.onUpdate.call($this, value, key, data);
				}
			}
		});
	}

	if (options.direction == 'both' || options.direction == 'model') {
		$bindable.on('input.ato', function(e) {
			var eltKeyAttr = getKeyFromElement(this, options);
			var eltKey     = this.getAttribute(eltKeyAttr);
			if (options.debug) {
				console.debug(`ato: ${e.type} on ${eltKey}`);
			}
			data[eltKey] = getValueFromElement(this, options);
			if (options.observers) {
				// options.observers.trigger('modelChanged', [val, k, data]);
			}
			if (options.debug) {
				console.debug(`ato: DOM->Model set ${eltKey} = ${data[eltKey]}`);
			}
			return true;
		});
	}

	return data;
};