"use strict";

var jQuery, $;
$ = jQuery = require('jquery');

function getKeyFromElement(elt, options) {
	var keys = options.attributes;
	keys     = keys.filter(k => elt.hasAttribute(k));
	return keys.length ? keys[0] : false;
}

function getElements(selector) {
	return document.querySelectorAll(selector);
}

function getValueFromElement(elt, options) {
	if (options.html) {
		return elt.innerHTML;
	}
	if (options.text) {
		return elt.textContent;
	}
	return $(elt).val();
}

function setValueOnElement(elt, value, options) {
	if (elt.tagName.toLowerCase() === 'input') {
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
	} else {
		$(elt).val(value);
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
	var out = {};
	for(var k in data) {
		if (k.match(/^_ato/)) {
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

module.exports = function(data, $rootElt, options) {
	options = Object.assign({
		debug:      false,
		bindable:   'input,select,textarea,button',
		attributes: ['data-bind', 'id', 'name'],
		html:       false,
		text:       false,
		direction:  'dom' // dom|model|both
	}, options);

	// var $;
	// if (options.$) {
	// 	$ = options.$;
	// } else {
	// 	$ = jQuery;
	// }
	$rootElt = $($rootElt);

	var selector       = getBindableSelector(options);
	var $bindable      = $rootElt.find(selector);
	var $bindableByKey = filterBindableByKey($bindable, data, options);

	var observersKey = '_ato_observers';
	if (!(observersKey in data)) {
		data[observersKey] = {};
	}

	for(var k in data) {
		if (k.match(/^_ato/)) {
			continue;
		}
		var privateK          = '_ato.' + k;
		data[observersKey][k] = data[observersKey][k] || new Set();
		var observers         = data[observersKey][k];

		if (privateK in data) {
			// Already bound!
			// @todo add to observers
			data[observersKey][k].add($bindableByKey[k]);
		}
		if (typeof(k) !== 'function') {
			data[privateK] = data[k];
			delete(data[k]);
			data[observersKey][k].add($bindableByKey[k]);
			Object.defineProperty(data, k, (function(data, k) {
					return {
					get: function() {
						if (options.debug) {
							console.log(`ato: get ${k} => '${data[privateK]}'`);
						}
						return data[privateK];
					},
					set: function(val) {
						data[privateK] = val;
						data[observersKey][k].forEach(
							$coll => $coll.trigger('avl_binder_modelchanged', [val, k, data])
						);
						if (options.debug) {
							console.log(`ato: set ${k} to ${val} => '${data[privateK]}`);
						}
					},
					configurable: true,
					enumerable:   true
				};
			})(data, k));
		}
	}

	$bindable
	.off('avl_binder_modelchanged.ato');

	if (options.direction == 'both' || options.direction == 'dom') {
		$bindable.on('avl_binder_modelchanged.ato', function(e, value, key, data) {
			var eltKey = this.getAttribute(getKeyFromElement(this, options));
			if (eltKey == key) {
				if (options.debug) {
					console.log('ato.modelChanged event', this, key, value, data);
				}
				var $this = $(this);
				if (options.html !== false) {
					if (typeof(options.html) === 'function') {
						$this.html(options.html(value, $this, key, data));
					} else {
						$this.html(value);
					}
				} else {
					if (options.text) {
						$this.text(value);
					} else {
						setValueOnElement(this, value, options);
						// $this.val(value);
					}
				}
				if (typeof(options.onUpdate) === 'function') {
					options.onUpdate.call($this, value, key, data);
				}
			}
		});
	}

	if (options.direction == 'both' || options.direction == 'model') {
		$bindable.on('change.ato input.ato', function(e) {
			var eltKeyAttr = getKeyFromElement(this, options);
			var eltKey     = this.getAttribute(eltKeyAttr);
			if (options.debug) {
				console.log(`ato: ${e.type} on ${eltKey}`);
			}
			data[eltKey] = getValueFromElement(this, options);
			if (options.debug) {
				console.log(`ato: DOM->Model set ${eltKey} = ${data[eltKey]}`);
			}
			return true;
		});
	}

	return data;
};