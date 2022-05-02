const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: [
    'vuetify'
  ],

  pluginOptions: {
    express: {
      shouldServeApp: true,
      serverDir: './srv'
    }
  }
})
