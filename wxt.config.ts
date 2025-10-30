import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  // extensionApi: 'chrome',
  modules: ['@wxt-dev/i18n/module', '@wxt-dev/module-vue', '@wxt-dev/auto-icons'],
  autoIcons: {
    developmentIndicator: false,
  },

  vite: () => {
    const isProd = process.env.NODE_ENV === 'production'
    return {
      esbuild: {
        drop: isProd ? ['console', 'debugger'] : [],
      },
      plugins: [
        tailwindcss(),
      ],
    }
  },

  manifest: () => ({
    permissions: ['storage'],
    name: '__MSG_name__',
    description: '__MSG_description__',
    default_locale: 'en',
  }),
})
