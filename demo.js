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
	var obj = {};
	$(obj).on('modelChanged.ato', function(e, value, key, data) {
		$('#dump').text(JSON.stringify(viewModel, (key,val) => key != '.ato' ? val : undefined, '    '));
		$('pre code').each(function(i, block) {
		  hljs.highlightBlock(block);
		});
	});

	ato(viewModel, $('#container'),	{
		debug:     true,
		bindable:  'p select input div',
		observers: obj
	});

	ato(viewModel, $('#container .editor'),	{
		html:     {paragraph: true},
		bindable: 'textarea,div'
	});

	window.viewModel = viewModel;
});
