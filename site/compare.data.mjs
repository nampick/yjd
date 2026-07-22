/**
 * Single source of truth for the "yjd vs <editor>" comparison pages.
 * scripts/build-compare-pages.js turns each entry into site/vs/<slug>.html plus
 * the hub site/compare.html. Comparisons are meant to be fair: sizes are
 * approximate (they vary a lot by configuration) and each page links the rival's
 * own site. Edit here and re-run `npm run build:compare`.
 */
export const SITE = 'https://yjd.io';

// yjd's own column — kept in one place so every table stays consistent.
export const YJD = {
  size: '~17 KB min → ~75 KB full (gzip), tree-shakeable',
  deps: 'None (zero runtime deps)',
  frameworks: 'React, Vue 3/2, Angular, AngularJS, Svelte, vanilla',
  types: 'Yes (bundled .d.ts)',
  license: 'ISC',
  arch: 'Vanilla DOM / contenteditable',
  bestFor: 'Comments, chat/prompt inputs, blog & social posts, light CMS',
};

export const ROWS = [
  ['Bundle size', 'size'],
  ['Dependencies', 'deps'],
  ['Frameworks', 'frameworks'],
  ['TypeScript types', 'types'],
  ['License', 'license'],
  ['Architecture', 'arch'],
  ['Best for', 'bestFor'],
];

export const COMPETITORS = [
  {
    slug: 'tiptap', name: 'Tiptap',
    seoTitle: 'yjd vs Tiptap — a lighter rich text editor alternative',
    seoDescription: 'yjd vs Tiptap: a dependency-free, tree-shakeable editor (~17 KB) versus a ProseMirror-based headless framework. When each one is the right call.',
    intro: 'Tiptap is a headless editor framework built on ProseMirror, with official React and Vue wrappers and a deep extension system. It shines when you need custom node views rendered as framework components, collaboration, or a strict document schema. yjd is the opposite trade: a tiny, dependency-free editor you drop into any framework for comments, chat and posts without pulling ProseMirror.',
    col: {
      size: '~30–80+ KB gzip (core + ProseMirror + extensions)',
      deps: 'ProseMirror (several packages)',
      frameworks: 'React, Vue, Svelte wrappers + vanilla',
      types: 'Yes',
      license: 'MIT (core)',
      arch: 'ProseMirror schema + node views',
      bestFor: 'Complex documents, collaboration, custom framework-rendered nodes',
    },
    theyWin: ['Node views: render editor nodes as React/Vue components', 'Rich extension ecosystem + strict schema', 'Collaboration (Yjs) is well-trodden'],
    yjdWins: ['No ProseMirror dependency; smaller footprint', 'Works the same across React, Vue, Angular and vanilla', 'Native chat/prompt layout + BYO-AI, no plugins'],
    whenThem: 'You are building a document app (Notion/Google-Docs class) with custom interactive blocks or real-time collaboration.',
    whenYjd: 'You want a small editor for comments, chat or posts and do not need framework-component nodes.',
    url: 'https://tiptap.dev',
  },
  {
    slug: 'quill', name: 'Quill',
    seoTitle: 'yjd vs Quill — a modern, tree-shakeable Quill alternative',
    seoDescription: 'yjd vs Quill: a zero-dependency, tree-shakeable TypeScript-first editor versus the mature Delta-based Quill. Size, API, framework and format differences.',
    intro: 'Quill is a mature, popular vanilla editor with its own Delta document format. It is a solid all-rounder. yjd is newer and leaner: it ships first-class TypeScript types, tree-shakes to ~17 KB, stores plain HTML/Markdown, and adds a chat/prompt layout Quill has no equivalent for.',
    col: {
      size: '~43 KB gzip (core + snow theme)',
      deps: 'None (Parchment built in)',
      frameworks: 'Vanilla + community wrappers',
      types: 'Community types',
      license: 'BSD-3-Clause',
      arch: 'Delta model + Parchment',
      bestFor: 'General WYSIWYG, Delta-based workflows',
    },
    theyWin: ['Battle-tested, huge install base', 'Delta format is great for granular diffing/OT', 'Large community + modules'],
    yjdWins: ['Tree-shakes to ~17 KB (vs a fixed ~43 KB)', 'First-class bundled TypeScript types', 'Stores plain HTML/Markdown; native chat/prompt layout'],
    whenThem: 'You want the Delta format, an OT/diff pipeline, or the largest community and module set.',
    whenYjd: 'You want a smaller, TS-first editor that stores HTML/Markdown and a chat/prompt composer out of the box.',
    url: 'https://quilljs.com',
  },
  {
    slug: 'tinymce', name: 'TinyMCE',
    seoTitle: 'yjd vs TinyMCE — a lightweight, no-license-tier alternative',
    seoDescription: 'yjd vs TinyMCE: a ~17 KB dependency-free editor versus the full classic WYSIWYG. Bundle size, licensing, and when a heavy plugin suite is worth it.',
    intro: 'TinyMCE is the classic, full-featured WYSIWYG with a huge plugin catalog and official framework wrappers. It is a lot of editor: hundreds of KB, an iframe, and a licensing model where some features are paid. yjd is a fraction of the size, all-open (ISC), and self-contained, aimed at modern comment/chat/post surfaces rather than a Word-like toolbar.',
    col: {
      size: '~300+ KB (self-contained, iframe)',
      deps: 'None (bundles everything)',
      frameworks: 'Official React, Vue, Angular wrappers',
      types: 'Yes',
      license: 'MIT core; some premium features paid',
      arch: 'Iframe classic WYSIWYG',
      bestFor: 'Full document editing, migrations from classic editors',
    },
    theyWin: ['Enormous feature + plugin catalog', 'Familiar Word-style editing surface', 'Long track record in CMSes'],
    yjdWins: ['~10–15× smaller; no iframe', 'Fully open (ISC), no paid feature tiers', 'Tree-shake to only what you use; chat/prompt layout'],
    whenThem: 'You need a maximal, Word-like editor with a big plugin suite and are fine with the size and licensing.',
    whenYjd: 'You want a light, fully-open editor for comments/posts/chat without a heavyweight toolbar.',
    url: 'https://www.tiny.cloud',
  },
  {
    slug: 'ckeditor', name: 'CKEditor 5',
    seoTitle: 'yjd vs CKEditor 5 — a smaller, permissively-licensed alternative',
    seoDescription: 'yjd vs CKEditor 5: a ~17 KB ISC-licensed editor versus the enterprise CKEditor 5 (GPL/commercial). Size, licensing, and collaboration trade-offs.',
    intro: 'CKEditor 5 is a powerful, enterprise-grade editor with real-time collaboration and a custom document model. It is also large and dual-licensed (GPL or commercial). yjd targets a different niche: a tiny, ISC-licensed, framework-agnostic editor for everyday rich text, without a build pipeline or a license decision.',
    col: {
      size: '~200+ KB (build-dependent)',
      deps: 'Many internal packages',
      frameworks: 'Official React, Vue, Angular wrappers',
      types: 'Yes',
      license: 'GPL-2+ or commercial',
      arch: 'Custom MVC model/view',
      bestFor: 'Enterprise editing, real-time collaboration',
    },
    theyWin: ['First-class real-time collaboration', 'Deep, structured document model', 'Enterprise support + features'],
    yjdWins: ['Much smaller; no build tooling required', 'Permissive ISC license, no commercial tier', 'One editor across every framework + vanilla'],
    whenThem: 'You need enterprise collaboration, revision history, and a structured model, and the GPL/commercial license fits.',
    whenYjd: 'You want a small, permissively-licensed editor for comments/posts/chat with no license gymnastics.',
    url: 'https://ckeditor.com/ckeditor-5',
  },
  {
    slug: 'slate', name: 'Slate',
    seoTitle: 'yjd vs Slate — a framework-agnostic alternative to Slate (React)',
    seoDescription: 'yjd vs Slate: a zero-dependency editor that runs in any framework versus Slate, a fully customizable React-only editor. When each fits.',
    intro: 'Slate is a completely customizable editor framework — for React only. You build the editing experience yourself, rendering nodes as React components. That power comes with a steep learning curve and a React lock-in. yjd gives you a working editor out of the box that runs in React, Vue, Angular and vanilla alike.',
    col: {
      size: '~40–50 KB gzip (+ React)',
      deps: 'React (peer dependency)',
      frameworks: 'React only',
      types: 'Yes',
      license: 'MIT',
      arch: 'React-rendered document model',
      bestFor: 'Fully custom, bespoke React editors',
    },
    theyWin: ['Total control: render any node as a React component', 'Unopinionated, build exactly what you want', 'Great for novel editing UX in React'],
    yjdWins: ['Works out of the box — no editor to build', 'Runs in any framework, not just React', 'Tiny, dependency-free, TS types included'],
    whenThem: 'You are building a bespoke React editor with unusual behaviour and want to control every node yourself.',
    whenYjd: 'You want a ready editor that works everywhere and do not want to build the editing layer.',
    url: 'https://docs.slatejs.org',
  },
  {
    slug: 'lexical', name: 'Lexical',
    seoTitle: 'yjd vs Lexical — a tiny, framework-agnostic editor comparison',
    seoDescription: 'yjd vs Lexical: two lightweight, extensible editors. yjd stores HTML/Markdown and runs anywhere; Lexical is a node-based framework with React bindings.',
    intro: 'Lexical is Meta\'s extensible, framework-agnostic editor core with official React bindings and a node-based model. It is fast and powerful for building custom editors. yjd is more turnkey: a small editor with a ready toolbar, HTML/Markdown output, and a chat/prompt layout, that drops into any framework without composing plugins.',
    col: {
      size: '~22 KB core gzip (+ plugins / bindings)',
      deps: 'None (core); @lexical/react for React',
      frameworks: 'Framework-agnostic core + React bindings',
      types: 'Yes',
      license: 'MIT',
      arch: 'Node-based, plugin-driven',
      bestFor: 'Custom, performant, extensible editors',
    },
    theyWin: ['Very fast, node-based architecture', 'Composable plugin model, Meta-backed', 'Great base for building a custom editor'],
    yjdWins: ['Turnkey: toolbar + formats ready, less wiring', 'HTML/Markdown output (not a custom node tree)', 'Native chat/prompt layout + BYO-AI, any framework'],
    whenThem: 'You want to build a custom, high-performance editor and are happy assembling nodes and plugins.',
    whenYjd: 'You want a ready-to-use editor with a toolbar and HTML/Markdown output, minimal wiring.',
    url: 'https://lexical.dev',
  },
];
