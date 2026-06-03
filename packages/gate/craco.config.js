const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const autoprefixer = require('autoprefixer');

module.exports = {
    webpack: {
        configure: (webpackConfig, { env }) => {
            if (env === 'production') {
                webpackConfig.optimization.minimize = false;
                webpackConfig.devtool = false;

                // Ignore source map warnings and locale-related errors globally
                webpackConfig.ignoreWarnings = [
                    (warning) =>
                        warning.module &&
                        warning.module.resource.includes('node_modules') &&
                        warning.details &&
                        warning.details.includes('source map'),
                    (warning) =>
                        warning.module &&
                        warning.module.resource.includes('.scss') &&
                        warning.details &&
                        warning.details.includes('source map'),
                    (warning) =>
                        warning.message && warning.message.includes('autoprefixer: start value has mixed support'),
                ];

                // Add TerserPlugin for minification in production
                webpackConfig.optimization.minimizer.push(
                    new TerserPlugin({
                        terserOptions: {
                            format: {
                                comments: true,
                            },
                        },
                    })
                );
            }

            // Ignore locale imports for various libraries
            webpackConfig.plugins.push(
                new webpack.IgnorePlugin({
                    resourceRegExp: /^\.\/locale$/,
                })
            );

            return webpackConfig;
        },
    },
    style: {
        postcss: {
            loaderOptions: {
                postcssOptions: {
                    plugins: [
                        autoprefixer({
                            overrideBrowserslist: ['last 2 versions', 'not dead', 'not ie 11'],
                            ignoreUnknownVersions: true,
                            flexbox: 'no-2009',
                        }),
                    ],
                },
            },
        },
    },
};
