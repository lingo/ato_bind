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

	var text = `Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
	tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
	quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
	consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
	cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
	proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

	// ato(viewModel, $('#form_container'), {
		// debug:     true,
		// bindable:  'p select span input div'
	// });

	ato(viewModel, $('#form_container'), {
		html:     {
			paragraph: true
		},
		bindable: 'textarea div select p span input'
	});

	viewModel.on('change.ato', function(key, value) {
		$('#dump').textContent = JSON.stringify(
			viewModel,
			(key, val) => key != '.ato' ? val : undefined,
			"  "
			);
		if(typeof(hljs) !== 'undefined') {
			hljs.highlightBlock($('pre code'));
		}
	});

	viewModel.paragraph = `<style>
#test {
	background: #37c;
	color: white;
	text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
	font-weight: bold;
	padding: 1vw;
	margin: 2vw;
	border: 0.5vw solid gainsboro;
	border-radius: 0.5vw;
}
#test:hover {
	background: -webkit-radial-gradient(50% 90%, ellipse cover, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%); /* Chrome10+,Safari5.1+ */
}
</style>
<div id="test">Lorem ipsum dolor sit amet. </div>
`;

	window.viewModel = viewModel;
});
