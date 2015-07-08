"use strict";
/**
 * Bind properties instead of data's keys
 *
 * On set: emit modelChanged event to root element, which is listening
 * When root element catches this event, needs to see which key changed
 * and map that to an element, and hence update element.
 * So, root element needs to have a map of key -> element
 *
 * On element change: update model.
 *
 */

var AtoFn     = require('./functions');
var addEvents = require('./events');

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
	addEvents(data);

	var privateData    = AtoFn.initPrivateData(data, options);
	var selector       = AtoFn.getBindableSelector(options);
	var $bindable      = AtoFn.getChildElements($rootElt, selector);
	var $bindableByKey = AtoFn.filterBindableByKey($bindable, data, options.attributes);

	if (options.direction == 'both' || options.direction == 'dom') {
		for(let k in data) {
			if (!AtoFn.isEnum(data, k)) {
				continue;
			}
			privateData.observers[k] = privateData.observers[k] || new Set();
			let observers = privateData.observers[k];

			if (k in privateData.data) {
				// This element is already data-bound
				// so add the new elements to observers
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
						console.debug(`ato.get '${k}' => '${privateData.data[k]}'`);
					}
					return privateData.data[k];
				},
				set: function(val) {
					privateData.data[k] = val;
					// Internal event
					data.trigger('ato.modelChanged', k, val);
					// Event for library users
					data.trigger('change', k, val);
					if (options.debug) {
						console.debug(`ato.set '${k}' to '${val}'`);
					}
				},
				configurable: true,
				enumerable:   true
			});
		}

		data.on('ato.modelChanged', function(key, value, flags) {
			if (!flags) {
				flags = { noTrigger: false, fromInput: false };
			}
			var elts = $bindableByKey.get(key);
			if (!elts) {
				return;
			}
			for(var i=0; i<elts.length; i++) {
				var elt = elts[i];
				if (options.debug) {
					console.debug(`ato.event: modelChanged on '${elt}' -> '${key}'`, elt, key, value, data);
				}
				if (flags.fromInput !== elt) {
					AtoFn.setValue(elt, value, key, data, options);
				}
				data.trigger('update', elt, key, value);
			}
		});
	}

	if (options.direction == 'both' || options.direction == 'model') {
		AtoFn.on($rootElt, 'input', function(e) {
			var elt = e.target || this;
			var eltKeyAttr = AtoFn.getEltKey(elt, options.attributes);
			var eltKey     = elt.getAttribute(eltKeyAttr);
			if (options.debug) {
				console.debug(`ato.event: '${e.type}' on '${elt}' -> '${eltKey}'`);
			}
			data['.ato.set'](eltKey, AtoFn.getValue(elt, options.text), {fromInput: elt});
			if (options.debug) {
				console.debug(`ato: DOM->Model set '${eltKey}' = '${data[eltKey]}'`);
			}
			return true;
		});
	}

	return data;
}


module.exports = Ato;