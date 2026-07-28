---
description: TOON Playground、CLI、编辑器支持和生态工具。
---

# 工具与 Playground

使用以下工具以交互方式体验 TOON 格式，进行 token 对比、格式转换和校验。

## Playground

[TOON Playground](/zh/playground)（在线试用环境）支持将 JSON 或 YAML 实时转换为 TOON、对比 token 数量，并通过 URL 分享实验结果。

## CLI 工具

官方 TOON CLI 提供命令行转换、token 统计以及完整的编码/解码功能。完整文档请参阅 [CLI 参考](/zh/cli/)。

```bash
npx @toon-format/cli input.json --stats -o output.toon
```

## 编辑器支持

### VS Code

[TOON Language Support](https://marketplace.visualstudio.com/items?itemName=vishalraut.vscode-toon) —— 语法高亮、校验、转换和 token 分析。

可从 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=vishalraut.vscode-toon) 安装，或通过命令行安装：

```bash
code --install-extension vishalraut.vscode-toon
```

### Tree-sitter 语法

[tree-sitter-toon](https://github.com/3swordman/tree-sitter-toon) —— 适用于兼容 Tree-sitter 的编辑器（Neovim、Helix、Emacs、Zed）的语法定义。

### Neovim

[toon.nvim](https://github.com/thalesgelinger/toon.nvim) —— 基于 Lua 的 Neovim 插件。

### 其他编辑器

可以使用 YAML 语法高亮作为近似方案。大多数编辑器都支持将 `.toon` 文件关联到 YAML 语言模式。

## 数据库

### ToonStore

[ToonStore](https://github.com/Kalama-Tech/toonstoredb) —— 一个兼容 Redis、以 TOON 格式存储数据的嵌入式数据库，采用 Rust 实现。

## MCP

### Tooner

[Tooner](https://github.com/chaindead/tooner) —— 将工具调用返回的 JSON 结果转换为 TOON 的 MCP 代理。
