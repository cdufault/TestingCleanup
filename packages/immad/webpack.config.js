const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CSSMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const WorkboxPlugin = require('workbox-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const path = require('path');
const webpack = require('webpack');

module.exports = function (_, arg) {
    const config = {
        entry: {
            index: ['./src/index.tsx'],
        },
        output: {
            filename: 'js/[name].[chunkhash].js',
            sourceMapFilename: 'sourceMap/[file].map',
            publicPath: '',
            clean: true,
        },
        optimization: {
            minimize: false,
            // minimize: arg.mode === 'production',
            splitChunks: { minChunks: Infinity, chunks: 'all' },
            minimizer: [
                new TerserPlugin({
                    parallel: true,
                    terserOptions: {
                        output: {
                            comments: false,
                        },
                    },
                }),
                new CSSMinimizerPlugin(),
            ],
            runtimeChunk: {
                name: 'runtime',
            },
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    },
                },
                {
                    test: /\.html$/,
                    use: [
                        {
                            loader: 'html-loader',
                            options: { minimize: false },
                        },
                    ],
                    exclude: /node_modules/,
                },
                {
                    test: /\.(jpe?g|png|gif|svg|webp)$/,
                    loader: 'url-loader',
                    options: {
                        // Inline files smaller than 10 kB (10240 bytes)
                        limit: 10 * 1024,
                    },
                },
                {
                    test: /\.(wsv|ttf|otf|eot|woff(2)?)(\?[a-z0-9]+)?$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name: 'build/[name].[ext]',
                            },
                        },
                    ],
                },
                {
                    test: /\.css$|\.scss$/,
                    include: /node_modules/,
                    use: [
                        { loader: MiniCssExtractPlugin.loader },
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                            },
                        },
                        {
                            loader: 'resolve-url-loader',
                            options: { engine: 'postcss' },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true,
                                sassOptions: {
                                    includePaths: [path.resolve('./node_modules')],
                                },
                            },
                        },
                    ],
                },
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify(arg.mode || 'production'),
                    BASENAME: JSON.stringify(arg.mode === 'production' ? process.env.BASENAME || '/immad' : ''),
                },
            }),

            new CopyPlugin({
                patterns: [
                    { from: './src/config.json', noErrorOnMissing: true },
                    { from: './src/activityCountsDef.json', noErrorOnMissing: true },
                    { from: './src/config_template.json', noErrorOnMissing: true },
                    { from: './version.txt', noErrorOnMissing: true },
                    { from: './public/Web.config', noErrorOnMissing: true },
                    { from: './public/assets', to: './assets' },
                ],
            }),

            new HtmlWebPackPlugin({
                title: 'IMMAD',
                template: './public/index.ejs',
                filename: './index.html',
                favicon: './public/assets/favicon.ico',
                chunksSortMode: 'none',
                inlineSource: '.(css)$',
                mode: arg.mode,
            }),

            new HtmlWebPackPlugin({
                template: './public/popout.html',
                filename: './popout.html',
                chunksSortMode: 'none',
                inject: false,
            }),

            new HtmlWebPackPlugin({
                template: './public/oauth-callback.html',
                filename: './oauth-callback.html',
                chunksSortMode: 'none',
                inject: false,
            }),

            new MiniCssExtractPlugin({
                filename: '[name].[chunkhash].css',
                chunkFilename: '[id].css',
            }),

            new WebpackPwaManifest({
                name: 'IMMAD',
                short_name: 'IMMAD',
                description: 'IMMAD',
                background_color: '#032341',
                theme_color: '#032341',
                crossorigin: 'use-credentials',
                icons: [
                    {
                        src: path.resolve('public/assets/logo.png'),
                        sizes: [96, 128], // multiple sizes
                    },
                ],
            }),
        ],
        resolve: {
            alias: {
                '@mui/styled-engine': '@mui/styled-engine-sc',
            },
            modules: [path.resolve(__dirname, '/src'), path.resolve(__dirname, '../../node_modules/')],
            extensions: ['.ts', '.tsx', '.js', '.scss', '.css'],
        },
    };

    if (arg.mode === 'development') {
        config.devtool = 'eval-source-map';
    }

    if (arg.mode === 'production') {
        config.devtool = 'source-map';
        config.plugins.push(
            new WorkboxPlugin.GenerateSW({
                clientsClaim: true,
                skipWaiting: true,

                // Exclude images and the configuration file from the precache
                exclude: [
                    /\.(?:png|jpg|jpeg|svg|gif)$/,
                    /config\.json$/,
                    /activityCountsDef\.json$/,
                    /config_template\.json$/,
                    /Web\.config$/,
                ],

                // Define runtime caching rules.
                runtimeCaching: [
                    {
                        // Match any request ends with .png, .jpg, .jpeg or .svg.
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
                        // Apply a cache-first strategy.
                        handler: 'CacheFirst',
                    },
                    {
                        // Match any fonts
                        urlPattern: /\.(?:eot|ttf|jpeg|woff|woff2)$/,
                        // Apply a cache-first strategy.
                        handler: 'CacheFirst',
                    },
                    // {
                    //     urlPattern: new RegExp('^https://js.arcgis.com/'),
                    //     handler: 'StaleWhileRevalidate',
                    // },
                    // {
                    //     urlPattern: new RegExp('^https://arcgis.com/sharing/'),
                    //     handler: 'StaleWhileRevalidate',
                    // },
                    // {
                    //     urlPattern: new RegExp('^https://static.arcgis.com/'),
                    //     handler: 'StaleWhileRevalidate',
                    // },
                    // {
                    //     urlPattern: new RegExp('^https://cigt-srv19.esri.tech/'),
                    //     handler: 'StaleWhileRevalidate',
                    // },
                ],
            })
        );
    }

    return config;
};
