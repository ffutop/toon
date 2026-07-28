---
layout: home
titleTemplate: 面向 Token 的对象表示法
hero:
  name: TOON
  text: 面向 Token 的<br>对象表示法
  tagline: 一种为 LLM 提示词设计的、紧凑且人类可读的 <br>JSON 数据模型编码方式。
  image:
    dark: /logo-index-dark.svg
    light: /logo-index-light.svg
    alt: TOON Logo
  actions:
    - theme: brand
      text: 什么是 TOON？
      link: /zh/guide/getting-started
    - theme: alt
      text: 基准测试
      link: /zh/guide/benchmarks
    - theme: alt
      text: 在线体验
      link: /zh/playground
    - theme: alt
      text: CLI
      link: /zh/cli/

features:
  - title: 节省 Token 且准确率高
    icon: 📊
    details: 在 4 个大语言模型的 244 个数据检索问题中，TOON 的准确率达到 72.2%（JSON 为 71.4%），同时所用 token 减少 42.6%。
    link: /zh/guide/benchmarks
  - title: JSON 数据模型
    icon: 🔁
    details: 使用与 JSON 相同的对象、数组和基本类型进行编码，支持确定性的无损往返转换。
    link: /zh/guide/format-overview
  - title: LLM 友好的护栏机制
    icon: 🛤️
    details: 每个首部中显式的 [N] 长度标记和 {fields} 字段列表为模型提供了清晰的模式(schema)指引，提高了解析可靠性。
    link: /zh/guide/format-overview#arrays
  - title: 极简语法
    icon: 📐
    details: 用缩进代替大括号，并尽量减少引号的使用，兼具 YAML 般的可读性和 CSV 般的紧凑性。
    link: /zh/guide/format-overview#arrays
  - title: 表格化形式
    icon: 🧺
    details: 结构一致的对象数组，以及由结构一致对象组成的对象，都会折叠为表格，只声明一次字段列表并逐行流式呈现行值。
    link: /zh/guide/format-overview#四种形式
  - title: 多语言生态
    icon: 🌐
    details: 提供多种语言的基于规范的实现。
    link: /zh/ecosystem/implementations
---
