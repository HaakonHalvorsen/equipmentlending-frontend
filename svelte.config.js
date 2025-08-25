import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      out: 'build',        // default
      precompress: true    // optional, serves .gz/.br when available
      // Reads PORT/HOST from env automatically on Azure
    })
  }
};

export default config;