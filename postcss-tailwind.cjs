// The app runs on Tailwind v3; the marketing site (app/(marketing)) is built
// on a Tailwind v4 UI kit. Both share one PostCSS pipeline, so this plugin
// picks the Tailwind version per stylesheet.
const path = require('path')
const postcss = require('postcss')
const tailwindV3 = require('tailwindcss')
const tailwindV4 = require('@tailwindcss/postcss')

const MARKETING_DIR = path.join(__dirname, 'app', '(marketing)') + path.sep

module.exports = () => ({
  postcssPlugin: 'tailwind-by-area',
  async Once(root, { result }) {
    const from = root.source?.input.file ?? result.opts.from
    const tailwind = from?.startsWith(MARKETING_DIR) ? tailwindV4() : tailwindV3()
    const out = await postcss([tailwind]).process(root, { from, map: false })
    if (out.root !== root) {
      root.removeAll()
      root.append(out.root.nodes)
    }
    result.messages.push(...out.messages)
  },
})
module.exports.postcss = true
