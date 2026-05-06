const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const externalTf = env && env.external_tf;

  const config = {
    entry: './src/index.ts',
    output: {
      filename: externalTf ? 'encoder.slim.js' : 'encoder.min.js',
      path: path.resolve(__dirname, 'dist'),
      library: {
        name: 'Encoder',
        type: 'umd',
        export: 'default',
      },
      globalObject: 'typeof self !== "undefined" ? self : this',
    },
    resolve: {
      extensions: ['.ts', '.js'],
      fallback: {
        fs: false,
        path: false,
        crypto: false,
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.bin$/,
          type: 'asset/inline',
          generator: {
            dataUrl: (content) => {
              return content.toString('base64');
            },
          },
        },
      ],
    },
    devtool: isProduction ? false : 'source-map',
    performance: {
      hints: isProduction ? 'warning' : false,
      maxAssetSize: 1024 * 1024,
      maxEntrypointSize: 1024 * 1024,
    },
  };

  if (externalTf) {
    config.externals = {
      '@tensorflow/tfjs': {
        commonjs: '@tensorflow/tfjs',
        commonjs2: '@tensorflow/tfjs',
        amd: '@tensorflow/tfjs',
        root: 'tf',
      },
    };
  }

  return config;
};
