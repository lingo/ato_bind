"use strict";

var _listeners        = new Map();

var AtoFn = require('./functions');

module.exports = function(object) {
	AtoFn.defineSimpleDataProperty(object, 'on', function(event, handler) {
		if (!_listeners.has(event)) {
			_listeners.set(event, new Set());
			// _listeners[event] = {}
		}
		_listeners.get(event).add(handler);
	});

	AtoFn.defineSimpleDataProperty(object, 'off', function(event, handler) {
		var events = _listeners.get(event);
		if (events)
			events.delete(handler);
	});

	AtoFn.defineSimpleDataProperty(object, 'trigger', function(event, ...data) {
		var e      = {
			timestamp: Date.now(),
			type:      event
		};
		var handlers = _listeners.get(event);
		if (!handlers) {
			return;
		}
		for(let handler of handlers) {
			data.unshift(e);
			handler.apply(object, data);
		}
	});
};