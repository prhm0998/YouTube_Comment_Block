import { createApp } from 'vue'
import App from './App.vue'
export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  main(ctx) {
    setContentScriptContext(ctx)
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        const app = createApp(App)
        app.mount(container)
        return app
      },
      onRemove: (app) => {
        if (app) {
          app.unmount()
        }
      },
    })
    ui.mount()
  },
})