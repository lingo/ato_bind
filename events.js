"use strict";

var AtoFn = require('./functions');

module.exports = function(object) {

	AtoFn.dataProp(object, 'on', function(event, handler) {
		var privateData = AtoFn.initPrivateData(object, {privateDataKey: '.ato'});
		if (!privateData.event.listeners) {
			privateData.event.listeners = new Map();
		}
		if (!privateData.event.listeners.has(event)) {
			privateData.event.listeners.set(event, new Set());
			// privateData.event.listeners[event] = {}
		}
		privateData.event.listeners.get(event).add(handler);
	});

	AtoFn.dataProp(object, 'off', function(event, handler) {
		var privateData = AtoFn.initPrivateData(object, {privateDataKey: '.ato'});
		if (!privateData.event.listeners) {
			privateData.event.listeners = new Map();
		}
		var events = privateData.event.listeners.get(event);
		if (events)
			events.delete(handler);
	});

	AtoFn.dataProp(object, 'trigger', function(event, ...data) {
		var privateData = AtoFn.initPrivateData(object, {privateDataKey: '.ato'});
		if (!privateData.event.listeners) {
			privateData.event.listeners = new Map();
		}
		var handlers = privateData.event.listeners.get(event);
		if (!handlers) {
			return;
		}
		for(let handler of handlers) {
			handler.apply(object, data);
		}
	});
};