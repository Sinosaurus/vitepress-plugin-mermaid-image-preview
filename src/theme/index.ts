import { defineComponent, h } from 'vue';
import type { Theme } from 'vitepress';
import MermaidDiagram from './mermaid/MermaidDiagram.vue';
import MediaPreview from './preview/MediaPreview.vue';
import { mermaidThemeKey } from './mermaid/render';
import type { MermaidThemeConfig } from './mermaid/render';

export { MermaidDiagram, MediaPreview };
export type { MermaidThemeConfig };

/** Keeps the base theme's hooks and slots; adds one shared preview dialog. */
export function withIrisTheme(
  base: Theme,
  options: { selector?: string; mermaid?: MermaidThemeConfig } = {},
): Theme {
  return {
    extends: base,
    enhanceApp({ app }) {
      app.component('IrisMermaid', MermaidDiagram);
      app.provide(mermaidThemeKey, options.mermaid ?? {});
    },
    Layout: defineComponent({
      name: 'IrisLayout',
      setup(_, { attrs, slots }) {
        return () => [
          h(base.Layout!, attrs, slots),
          h(MediaPreview, { selector: options.selector }),
        ];
      },
    }),
  };
}
