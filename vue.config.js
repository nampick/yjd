const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    port: 8080,
    open: true
  },
  // Cấu hình build thư viện
  configureWebpack: {
    externals: {
      vue: {
        root: 'Vue',
        commonjs: 'vue',
        commonjs2: 'vue',
        amd: 'vue'
      }
    },
    optimization: {
      splitChunks: false
    }
  },
  css: {
    extract: process.env.NODE_ENV === 'production' ? false : {
      ignoreOrder: true
    }
  },
  chainWebpack: config => {
    // Fix CSS extraction for library builds
    if (process.env.NODE_ENV === 'production') {
      config.optimization.splitChunks(false);
      config.optimization.runtimeChunk(false);
      
      // Disable CSS extraction for library builds
      config.plugins.delete('extract-css');
    }
  }
})
