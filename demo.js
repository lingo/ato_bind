"use strict";

var $ = document.querySelector.bind(document);

var ato = require('ato');
/**
 * This is the view model, here exposed
 * globally so people can play with it in devtools
 */
var viewModel = {
	'paragraph': '',
	'latinspam': ''
};

function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    document.attachEvent('onreadystatechange', function() {
      if (document.readyState != 'loading')
        fn();
    });
  }
}

ready(function() {

	ato(viewModel, '#container', {
		debug:     true,
		bindable:  'p select input div'
		// observers: obj
	});

	ato(viewModel, '#container .editor', {
		html:     true,
		bindable: 'textarea,div'
	});

	viewModel.on('change.ato', function(key, value) {
		$('#dump')
			.textContent = JSON.stringify(viewModel,
				(key, val) => key != '.ato' ? val : undefined,
				'    '
			);
		hljs.highlightBlock($('pre code'));
	});

	window.viewModel = viewModel;
});
