"use strict";

var $   = require('jquery');
var ato = require('ato');
/**
 * This is the view model, here exposed
 * globally so people can play with it in devtools
 */
var viewModel = {
	'paragraph': '',
	'byID':      '',
	'display':   '',
	'in':        ''
};

$(function() {

	// We still use jQuery to register change handlers, as currently
	// ato is only one-way binding: from model to DOM
	// $('#container').on('change', 'select,input', function(e) {
	// });
	ato(viewModel, $('#container'), {
		direction: 'both',
		debug:     true,
		bindable:  'p select input div'
	});

	// ato(viewModel, document.body, {
	// 	direction: 'dom',
	// 	debug:     true,
	// 	bindable:  'p',
	// 	text:      true
	// });

	// ato(viewModel, document.body, {
	// 	direction: 'dom',
	// 	debug:     true,
	// 	bindable:  'div',
	// 	html:      true
	// });

	window.viewModel = viewModel;
});
