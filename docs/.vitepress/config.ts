import type { DefaultTheme, LocaleConfig } from 'vitepress'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vitepress'
import llmstxt, { copyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms'
import { description, github, name, ogImage, ogUrl, releases, twitterImage, version } from './meta'

export default defineConfig({
  title: name,
  description,
  head: [
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'author', content: 'Johann Schopplich' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: ogUrl }],
    ['meta', { property: 'og:title', content: name }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { name: 'twitter:title', content: name }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: twitterImage }],
    ['meta', { name: 'twitter:site', content: '@jschopplich' }],
    ['meta', { name: 'twitter:creator', content: '@jschopplich' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  vite: {
    // @ts-expect-error – UnoCSS types are not compatible with Vite yet
    plugins: [UnoCSS(), llmstxt()],
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: navEn(),
        sidebar: {
          '/guide/': sidebarEn(),
          '/cli/': sidebarEn(),
          '/reference/': sidebarEn(),
          '/ecosystem/': sidebarEn(),
        },
        footer: {
          message: 'Released under the <a href="https://opensource.org/licenses/MIT" target="_blank">MIT License</a>.',
          copyright: 'Copyright © 2025-PRESENT <a href="https://johannschopplich.com" target="_blank">Johann Schopplich</a>',
        },
      },
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      title: name,
      description: '面向 Token 的对象表示法',
      themeConfig: {
        nav: navZh(),
        sidebar: {
          '/zh/guide/': sidebarZh(),
          '/zh/cli/': sidebarZh(),
          '/zh/reference/': sidebarZh(),
          '/zh/ecosystem/': sidebarZh(),
        },
        footer: {
          message: '基于 <a href="https://opensource.org/licenses/MIT" target="_blank">MIT 许可证</a>发布。',
          copyright: 'Copyright © 2025-PRESENT <a href="https://johannschopplich.com" target="_blank">Johann Schopplich</a> <br>中文文档由 <a href="https://www.ffutop.com">ffutop</a> 翻译维护。',
        },
        docFooter: {
          prev: '上一页',
          next: '下一页',
        },
        outline: {
          label: '本页目录',
        },
        lastUpdated: {
          text: '最后更新于',
        },
        langMenuLabel: '切换语言',
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
      },
    },
  } satisfies LocaleConfig<DefaultTheme.Config>,

  themeConfig: {
    logo: '/favicon.svg',

    socialLinks: [
      { icon: 'github', link: github },
    ],

    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                },
              },
            },
          },
        },
      },
    },
  },
  markdown: {
    config(md) {
      md.use(copyOrDownloadAsMarkdownButtons)
    },
    math: true,
  },
})

function navEn(): DefaultTheme.NavItem[] {
  return [
    {
      text: 'Playground',
      link: '/playground',
    },
    {
      text: 'Guide',
      activeMatch: '^/guide/',
      items: [
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Format Overview', link: '/guide/format-overview' },
        { text: 'Using TOON with LLMs', link: '/guide/llm-prompts' },
        { text: 'Benchmarks', link: '/guide/benchmarks' },
      ],
    },
    {
      text: 'CLI',
      link: '/cli/',
    },
    {
      text: 'Reference',
      activeMatch: '^/reference/',
      items: [
        { text: 'API', link: '/reference/api' },
        { text: 'Syntax Cheatsheet', link: '/reference/syntax-cheatsheet' },
        { text: 'Specification', link: '/reference/spec' },
        { text: 'Efficiency Formalization', link: '/reference/efficiency-formalization' },
      ],
    },
    {
      text: 'Ecosystem',
      activeMatch: '^/ecosystem/',
      items: [
        { text: 'Tools & Playgrounds', link: '/ecosystem/tools-and-playgrounds' },
        { text: 'Implementations', link: '/ecosystem/implementations' },
      ],
    },
    {
      text: `v${version}`,
      items: [
        {
          text: 'Release Notes',
          link: releases,
        },
      ],
    },
  ]
}

function sidebarEn(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Guide',
      items: [
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Format Overview', link: '/guide/format-overview' },
        { text: 'Using TOON with LLMs', link: '/guide/llm-prompts' },
        { text: 'Benchmarks', link: '/guide/benchmarks' },
      ],
    },
    {
      text: 'Tooling',
      items: [
        { text: 'Playground', link: '/playground' },
        { text: 'CLI Reference', link: '/cli/' },
      ],
    },
    {
      text: 'Ecosystem',
      items: [
        { text: 'Tools & Playgrounds', link: '/ecosystem/tools-and-playgrounds' },
        { text: 'Implementations', link: '/ecosystem/implementations' },
      ],
    },
    {
      text: 'Reference',
      items: [
        { text: 'API (TypeScript)', link: '/reference/api' },
        { text: 'Syntax Cheatsheet', link: '/reference/syntax-cheatsheet' },
        { text: 'Specification', link: '/reference/spec' },
        { text: 'Efficiency Formalization', link: '/reference/efficiency-formalization' },
      ],
    },
  ]
}

function navZh(): DefaultTheme.NavItem[] {
  return [
    {
      text: '演练场',
      link: '/zh/playground',
    },
    {
      text: '指南',
      activeMatch: '^/zh/guide/',
      items: [
        { text: '快速开始', link: '/zh/guide/getting-started' },
        { text: '格式概览', link: '/zh/guide/format-overview' },
        { text: '在 LLM 中使用 TOON', link: '/zh/guide/llm-prompts' },
        { text: '性能基准', link: '/zh/guide/benchmarks' },
      ],
    },
    {
      text: 'CLI',
      link: '/zh/cli/',
    },
    {
      text: '参考',
      activeMatch: '^/zh/reference/',
      items: [
        { text: 'API', link: '/zh/reference/api' },
        { text: '语法速查表', link: '/zh/reference/syntax-cheatsheet' },
        { text: '规范', link: '/zh/reference/spec' },
        { text: '效率形式化', link: '/zh/reference/efficiency-formalization' },
      ],
    },
    {
      text: '生态',
      activeMatch: '^/zh/ecosystem/',
      items: [
        { text: '工具与演练场', link: '/zh/ecosystem/tools-and-playgrounds' },
        { text: '实现列表', link: '/zh/ecosystem/implementations' },
      ],
    },
    {
      text: `v${version}`,
      items: [
        {
          text: '发布说明',
          link: releases,
        },
      ],
    },
  ]
}

function sidebarZh(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '指南',
      items: [
        { text: '快速开始', link: '/zh/guide/getting-started' },
        { text: '格式概览', link: '/zh/guide/format-overview' },
        { text: '在 LLM 中使用 TOON', link: '/zh/guide/llm-prompts' },
        { text: '性能基准', link: '/zh/guide/benchmarks' },
      ],
    },
    {
      text: '工具',
      items: [
        { text: '演练场', link: '/zh/playground' },
        { text: 'CLI 参考', link: '/zh/cli/' },
      ],
    },
    {
      text: '生态',
      items: [
        { text: '工具与演练场', link: '/zh/ecosystem/tools-and-playgrounds' },
        { text: '实现列表', link: '/zh/ecosystem/implementations' },
      ],
    },
    {
      text: '参考',
      items: [
        { text: 'API(TypeScript)', link: '/zh/reference/api' },
        { text: '语法速查表', link: '/zh/reference/syntax-cheatsheet' },
        { text: '规范', link: '/zh/reference/spec' },
        { text: '效率形式化', link: '/zh/reference/efficiency-formalization' },
      ],
    },
  ]
}
