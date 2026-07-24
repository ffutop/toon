---
description: TOON 规范导览：章节结构、合规性检查清单、媒体类型和版本管理。
---

# 规范

[TOON 规范](https://github.com/toon-format/spec) 是实现编码器、解码器和校验器的权威参考。它定义了具体语法、规范性的编码/解码行为，以及严格模式下的校验规则。

如果只是*使用* TOON，无需阅读本页；本页主要面向实现者和贡献者。如果你想学习如何使用 TOON，请从 [快速开始](/zh/guide/getting-started) 指南入手。

> [!NOTE]
> TOON 规范已经稳定，但仍在持续演进中。规范并非一成不变，欢迎通过贡献内容或分享反馈来参与其后续发展。

## 当前版本

**规范 v{{ $spec.version }}**（2026-07-22）是当前已发布的工作草案。该版本已足够稳定并可作为实现依据，但尚未定稿；详情请参阅规范中的 “Status of This Document” 部分。

## 媒体类型与文件扩展名

规范在 [§17](https://github.com/toon-format/spec/blob/main/SPEC.md#17-iana-considerations) 中定义了临时媒体类型和文件扩展名：

- **媒体类型：** `text/toon`（临时，尚未在 IANA 注册；仅支持 UTF-8）
- **文件扩展名：** `.toon`

TOON 文档始终使用 UTF-8 编码和 LF（`\n`）换行符；可选的 `charset` 参数如果存在，其值为 `utf-8`。

## 规范导览

### 核心概念

[§1 术语与约定](https://github.com/toon-format/spec/blob/main/SPEC.md#1-terminology-and-conventions)：
定义了“缩进层级”“生效分隔符”“严格模式”等关键术语，以及 RFC2119 关键词（MUST、SHOULD、MAY）。

[§2 数据模型](https://github.com/toon-format/spec/blob/main/SPEC.md#2-data-model)：
规定了 JSON 数据模型（对象、数组、基本类型）、数组和对象的顺序要求，以及规范数字格式（位于 `[1e-6, 1e21)` 范围内或为零的值使用规范十进制；超出该范围允许使用指数记法）。

[§3 编码规范化](https://github.com/toon-format/spec/blob/main/SPEC.md#3-encoding-normalization-reference-encoder)：
定义了非 JSON 类型（Date、BigInt、NaN、Infinity、undefined 等）在编码前应如何规范化。编码器实现者应重点阅读这一节。

[§4 解码解释](https://github.com/toon-format/spec/blob/main/SPEC.md#4-decoding-interpretation-reference-decoder)：
规定了解码器如何将文本标记映射为宿主语言中的值（带引号的字符串、不带引号的基本类型，以及解析数字时对前导零的处理）。在参考实现中，解码器默认启用严格模式（`strict = true`）；严格模式错误见 §14。

### 语法规则

[§5 具体语法与根形式](https://github.com/toon-format/spec/blob/main/SPEC.md#5-concrete-syntax-and-root-form)：
定义了 TOON 这种面向行、基于缩进的表示法，并说明如何判断根值是对象、数组还是基本类型。§5.1 定义了整行注释，注释会在其他任何处理之前通过词法预处理移除。

[§6 首部语法](https://github.com/toon-format/spec/blob/main/SPEC.md#6-header-syntax-normative)：
给出数组首部和带键首部的规范性 ABNF 语法：`key[N<delim?>]{fields}:` 和 `key[N:<delim?>]{fields}:`。该节规定了方括号片段、分隔符符号和字段列表，包括嵌套字段组。

[§7 字符串与键](https://github.com/toon-format/spec/blob/main/SPEC.md#7-strings-and-keys)：
完整的引号规则（字符串何时必须加引号）、合法转义序列（仅包括 `\\`、`\"`、`\n`、`\r`、`\t`，以及用于其他 U+0000–U+001F 控制字符的 `\uXXXX`），以及键的编码要求。

[§8 对象](https://github.com/toon-format/spec/blob/main/SPEC.md#8-objects)：
对象字段编码（`key: value`）、嵌套规则、键顺序保留，以及空对象处理。

[§9 数组与表格形式](https://github.com/toon-format/spec/blob/main/SPEC.md#9-arrays-and-tabular-forms)：
涵盖所有数组形式：基本类型数组（内联）、对象数组（表格化，包括嵌套字段组）、混合数组/非一致数组（列表）、数组的数组，以及一致对象映射的带键表格形式（§9.5）。该节还包括各类形式的检测要求。

[§10 作为列表项的对象](https://github.com/toon-format/spec/blob/main/SPEC.md#10-objects-as-list-items)：
列表项中对象的缩进规则（第一个字段位于连字符所在行），包括第一个字段为表格化数组或带键表格对象时的规范模式（首部位于连字符所在行，行数据缩进深度为 +2，同级字段缩进深度为 +1）。

[§11 分隔符](https://github.com/toon-format/spec/blob/main/SPEC.md#11-delimiters)：
分隔符作用域（文档级分隔符与生效分隔符）、基于分隔符的引号处理，以及逗号、制表符、竖线分隔符的解析规则。

[§12 缩进与空白](https://github.com/toon-format/spec/blob/main/SPEC.md#12-indentation-and-whitespace)：
编码要求（一致的空格缩进、缩进中不允许使用制表符、无行尾空格/换行符）以及解码规则（严格和非严格缩进处理）。

### 合规性与校验

[§13 合规性与选项](https://github.com/toon-format/spec/blob/main/SPEC.md#13-conformance-and-options)：
定义了合规类型（编码器、解码器、校验器）、标准化选项以及合规检查清单。

[§14 严格模式下的错误与诊断](https://github.com/toon-format/spec/blob/main/SPEC.md#14-strict-mode-errors-and-diagnostics-authoritative-checklist)：
严格模式下各类错误的**权威检查清单**：数组与条目数量、宽度不匹配（§14.1）、语法和结构错误（§14.2），以及重复的同级键（§14.3）。

### 实现指导

[§15 安全考量](https://github.com/toon-format/spec/blob/main/SPEC.md#15-security-considerations)：
与安全相关的注入风险、引号规则和严格模式检查。

[§16 国际化](https://github.com/toon-format/spec/blob/main/SPEC.md#16-internationalization)：
Unicode 处理，以及不受语言环境影响的数字文本格式。

[§17 IANA 考量](https://github.com/toon-format/spec/blob/main/SPEC.md#17-iana-considerations)：
媒体类型注册计划及临时状态。

[§18 版本管理与可扩展性](https://github.com/toon-format/spec/blob/main/SPEC.md#18-versioning-and-extensibility)：
规范的演进方式：主版本和次版本变更，以及可扩展性策略。

[§19 知识产权考量](https://github.com/toon-format/spec/blob/main/SPEC.md#19-intellectual-property-considerations)：
规范的许可和知识产权条款。

[附录 F：宿主类型规范化示例](https://github.com/toon-format/spec/blob/main/SPEC.md#appendix-f-host-type-normalization-examples-informative)：
为 Go、JavaScript、Python、Rust 和 Java 实现提供参考说明，介绍各语言特有类型的规范化方式。

[附录 C：测试套件与合规性](https://github.com/toon-format/spec/blob/main/SPEC.md#appendix-c-test-suite-and-compliance-informative)：
位于 [github.com/toon-format/spec/tree/main/tests](https://github.com/toon-format/spec/tree/main/tests) 的参考测试套件，可用于校验各实现。

## 规范章节一览

| 章节 | 主题 | 何时阅读 |
|---------|-------|--------------|
| §1–4 | 数据模型、规范化、解码 | 实现编码器/解码器时 |
| §5–6 | 语法、首部、根形式 | 实现解析器时 |
| §7 | 字符串、键、引号、转义 | 实现字符串处理时 |
| §8–10 | 对象、数组、列表项 | 实现结构编码时 |
| §11–12 | 分隔符、缩进、空白 | 实现格式化与校验时 |
| §13 | 合规性与选项 | 实现选项与特性时 |
| §14 | 严格模式错误 | 实现校验器时 |
| §15–16 | 安全、国际化 | 运行和部署时的注意事项 |
| §17–19 | IANA、版本管理、知识产权 | 生态与许可 |

## 合规性检查清单

规范包含三份合规性检查清单：

### 编码器检查清单（§13.1） <sup>[↗ SPEC.md](https://github.com/toon-format/spec/blob/main/SPEC.md#131-encoder-conformance-checklist)</sup>

关键要求：
- 生成 UTF-8 编码、LF 换行符的输出
- 使用一致的缩进（默认 2 个空格，不使用制表符）
- 在带引号的字符串中转义 `\\`、`\"`、`\n`、`\r`、`\t`，对其他任意 U+0000–U+001F 控制字符使用 `\uXXXX`；拒绝未配对的 UTF-16 代理码位
- 对包含生效分隔符、冒号或结构性字符，以及以 `-` 或 `#` 开头的字符串加引号
- 输出与实际项目数或条目数一致的数组长度 `[N]`
- 保留对象键的顺序
- 按 §2 输出数字（对于 `[1e-6, 1e21)` 范围内或为零的值使用规范十进制；超出该范围允许使用指数记法）
- 将 `-0` 转换为 `0`，将 `NaN`/±Infinity 转换为 `null`
- 以小写字面量形式输出布尔值和 null（`true`、`false`、`null`）
- 不得包含行尾空格或末尾换行符
- 永远不要输出注释行

### 解码器检查清单（§13.2） <sup>[↗ SPEC.md](https://github.com/toon-format/spec/blob/main/SPEC.md#132-decoder-conformance-checklist)</sup>

关键要求：
- 在词法预处理阶段剥离整行注释（§5.1）
- 按 §6 解析数组首部和带键首部（长度、带键标记、分隔符、字段，包括嵌套字段组）
- 仅使用生效分隔符拆分内联数组、表格行和带键条目行
- 只使用合法转义对带引号的字符串进行反转义
- 为不带引号的值判定类型：true/false/null → 布尔值/null，数字 → 数字，其他 → 字符串
- 在 `strict=true` 时强制执行严格模式规则
- 保留数组顺序和对象键顺序

### 校验器检查清单（§13.3） <sup>[↗ SPEC.md](https://github.com/toon-format/spec/blob/main/SPEC.md#133-validator-conformance-checklist)</sup>

校验器应当验证：
- 结构性合规（首部、缩进、列表标记）
- 空白不变式（无行尾空格/换行符）
- 首部与行数据之间的分隔符一致性
- 实际行数、项目数和条目数与声明的 `[N]` 相符
- 所有严格模式要求

## 版本管理

规范使用语义化版本（主版本号、次版本号）：
- **主版本**（例如 v2 → v3）：破坏性变更，与之前版本不兼容
- **次版本**（例如 v3.1 → v3.2）：澄清说明、新增要求，或向后兼容的补充内容

详细的版本历史请参阅 [附录 D：文档变更日志](https://github.com/toon-format/spec/blob/main/SPEC.md#appendix-d-document-changelog-informative)。

## 为规范做贡献

该规范由社区在 [github.com/toon-format/spec](https://github.com/toon-format/spec) 上维护。我们欢迎各种形式的贡献：报告歧义或错误、提出澄清说明和示例、向参考测试套件添加测试用例，或讨论边界情况和规范性行为。你的反馈有助于推动这一格式的发展。
