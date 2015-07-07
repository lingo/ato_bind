"use strict";

var _listeners        = new Map();

var AtoFn = require('./functions');

module.exports = function(object) {
	AtoFn.dataProp(object, 'on', function(event, handler) {
		if (!_listeners.has(event)) {
			_listeners.set(event, new Set());
			// _listeners[event] = {}
		}
		_listeners.get(event).add(handler);
	});

	AtoFn.dataProp(object, 'off', function(event, handler) {
		var events = _listeners.get(event);
		if (events)
			events.delete(handler);
	});

	AtoFn.dataProp(object, 'trigger', function(event, ...data) {
		var handlers = _listeners.get(event);
		if (!handlers) {
			return;
		}
		for(let handler of handlers) {
			handler.apply(object, data);
		}
	});
};