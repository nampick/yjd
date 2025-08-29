module.exports = {
  presets: [
    ['@vue/cli-plugin-babel/preset', {
      useBuiltIns: 'usage',
      corejs: 3,
      targets: {
        browsers: ['> 1%', 'last 2 versions', 'not dead', 'ie >= 11']
      }
    }]
  ],
  plugins: [
    // Class properties and methods
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-private-methods',
    '@babel/plugin-transform-private-property-in-object',
    
    // Modern JavaScript features
    '@babel/plugin-transform-optional-chaining',
    '@babel/plugin-transform-nullish-coalescing-operator',
    '@babel/plugin-transform-async-generator-functions',
    '@babel/plugin-transform-spread',
    '@babel/plugin-transform-parameters',
    '@babel/plugin-transform-destructuring',
    '@babel/plugin-transform-arrow-functions',
    '@babel/plugin-transform-template-literals',
    '@babel/plugin-transform-exponentiation-operator',
    '@babel/plugin-transform-object-rest-spread',
    
    // Runtime helpers
    ['@babel/plugin-transform-runtime', {
      corejs: 3,
      helpers: true,
      regenerator: true,
      useESModules: false
    }]
  ],
  env: {
    test: {
      plugins: ['@babel/plugin-transform-modules-commonjs']
    }
  }
} 
