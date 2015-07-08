"use strict";

var $ = document.querySelector.bind(document);

var ato = Ato; //require('ato');
/**
 * This is the view model, here exposed
 * globally so people can play with it in devtools
 */
var viewModel = {
	'paragraph': '',
	'latinspam': ''
};
var color = {red: 0, green: 0, blue: 0, hex: 0};

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

	ato(viewModel, $('#form_container'), {
		html:  {
			paragraph: true
		},
		bindable: 'textarea div select p span input'
	});

	function showModel() {
		$('#dump').textContent = JSON.stringify(
			viewModel,
			(key, val) => key != '.ato' ? val : undefined,
			"  "
			)
		+ "\n\n"
		+ JSON.stringify(
			color,
			(key, val) => key != '.ato' ? val : undefined,
			"  "
			);
		if(typeof(hljs) !== 'undefined') {
			hljs.highlightBlock($('pre code'));
		}
	}

	viewModel.on('change', function(key, value) {
		showModel();
		if (key === 'latinspam') {
			viewModel.paragraph = text.replace(
				new RegExp(`(${viewModel.latinspam})`, 'gi'),
				'<strong class="highlight">$1</strong>'
			);
		}
	});


	ato(color, $('.color'), {
		html: {
			hex: true
		},
		bindable: 'input,div'
	});

	color.on('change', (key, value) => {
		showModel();
		if (key !== 'hex') {
			color.hex = `<div style="width: 100%; height: 100%; background: rgb(${color.red},${color.green},${color.blue});"></div>`;
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
	window.color     = color;
});
