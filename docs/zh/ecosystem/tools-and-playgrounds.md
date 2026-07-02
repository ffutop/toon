---
description: TOON 的演练场、CLI、编辑器支持及生态工具。
---

# 工具与演练场

使用以下工具交互式地体验 TOON 格式,进行 token 对比、格式转换和校验。

## 演练场

### 官方演练场

[TOON 演练场](/playground) 让你实时将 JSON 或 YAML 转换为 TOON,对比 token 数量,并通过 URL 分享你的实验结果。

### 社区演练场

- [格式分词对比演练场](https://www.curiouslychase.com/playground/format-tokenization-exploration)
- [TOON Tools](https://toontools.vercel.app/)

## CLI 工具

官方 TOON CLI 提供命令行转换、token 统计,以及所有编码/解码功能。完整文档请参阅 [CLI 参考](/cli/)。

```bash
npx @toon-format/cli input.json --stats -o output.toon
```

## 编辑器支持

### VS Code

[TOON Language Support](https://marketplace.visualstudio.com/items?itemName=vishalraut.vscode-toon) —— 语法高亮、校验、转换和 token 分析。

可从 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=vishalraut.vscode-toon) 安装,或通过命令行安装:

```bash
code --install-extension vishalraut.vscode-toon
```

### Tree-sitter 语法

[tree-sitter-toon](https://github.com/3swordman/tree-sitter-toon) —— 适用于兼容 Tree-sitter 的编辑器(Neovim、Helix、Emacs、Zed)的语法定义。

### Neovim

[toon.nvim](https://github.com/thalesgelinger/toon.nvim) —— 基于 Lua 的 Neovim 插件。

### 其他编辑器

可以使用 YAML 语法高亮作为近似方案。大多数编辑器都支持将 `.toon` 文件关联到 YAML 语言模式。

## 数据库

### ToonStore

[ToonStore](https://github.com/Kalama-Tech/toonstoredb) —— 一个兼容 Redis、以 TOON 格式存储数据的嵌入式数据库(Rust 实现)。

## ORM

### TORM

[TORM](https://github.com/Kalama-Tech/torm) —— 与 ToonStore 数据库配合使用的 ORM,提供 Node.js、Python、Go 和 PHP 的 SDK。

## Web API

如果你正在构建需要处理 TOON 的 Web 应用程序,可以在浏览器中使用该 TypeScript 库:

```ts
import { decode, encode } from '@toon-format/toon'

// 可在浏览器、Node.js、Deno 和 Bun 中运行
const toon = encode(data)
const data = decode(toon)
```

详情请参阅 [API 参考](/reference/api)。

## MCP

### Tooner

[Tooner](https://github.com/chaindead/tooner) —— 一个将 JSON 工具响应转换为 TOON 的 MCP 代理。
