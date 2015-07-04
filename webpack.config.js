var webpack = require('webpack');
var path    = require('path');

// webpack.config.js
module.exports = {
	entry: {
		app: ["demo.js"]
	},
    resolve: {
    	root: __dirname
    },
	output: {
		filename: path.join(__dirname, "dist", '[name].js'),
        sourceMapFilename: '[file].map'
	},
	module: {
		loaders: [
	        {
	        		test:    /\.js$/,
	        		exclude: /node_modules/,
	        		loader:  'babel',
	        		query: {
	        			plugins: 'object-assign'
	        			// optional: 'minification.removeConsole'
	        		}
	        }
		],
	},
	devtool: '#source-map',
	plugins: [
	]
};



if (process.env.production) {
    // new webpack.optimize.CommonsChunkPlugin(/* chunkName= */"vendor", /* filename= */path.join(__dirname, 'themes/avl/dist', "vendor.js")),
	module.exports.plugins.push(new webpack.optimize.DedupePlugin());
	module.exports.plugins.push(new webpack.optimize.UglifyJsPlugin({minimize: true}));
}