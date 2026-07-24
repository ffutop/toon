---
url: /zh/cli.md
description: 在命令行中将 JSON 转换为 TOON，或反向转换，支持 token 统计、流式处理和分隔符选项。
---

# 命令行接口

`@toon-format/cli` 软件包可以在 JSON 与 TOON 之间双向转换。你可以用它在将 TOON 集成到应用程序之前先测算 token 节省量，也可以在 shell 工作流中与 `curl`、`jq` 等工具配合，通过管道对 JSON 执行 TOON 转换。该 CLI 支持标准输入/输出、token 统计、面向大型数据集的流式处理，以及库中提供的所有编码选项。

该 CLI 基于 `@toon-format/toon` 的 TypeScript 实现构建，并遵循 [最新规范](/zh/reference/spec)。

## 使用方法

### 免安装使用

使用 `npx` 无需安装即可运行该 CLI：

::: code-group

```bash [编码]
npx @toon-format/cli input.json -o output.toon
```

```bash [解码]
npx @toon-format/cli data.toon -o output.json
```

```bash [标准输入]
echo '{"name": "Ada"}' | npx @toon-format/cli
```

:::

### 全局安装

如果要反复使用，也可以选择全局安装：

::: code-group

```bash [npm]
npm install -g @toon-format/cli
```

```bash [pnpm]
pnpm add -g @toon-format/cli
```

```bash [yarn]
yarn global add @toon-format/cli
```

:::

全局安装后，使用 `toon` 命令：

```bash
toon input.json -o output.toon
```

## 基本用法

### 自动检测

CLI 会根据文件扩展名自动检测操作类型：

* `.json` 文件 → 编码（JSON 转 TOON）
* `.toon` 文件 → 解码（TOON 转 JSON）

从标准输入读取时，使用 `--encode` 或 `--decode` 选项指定操作（默认是编码）。

::: code-group

```bash [将 JSON 编码为 TOON]
toon input.json -o output.toon
```

```bash [将 TOON 解码为 JSON]
toon data.toon -o output.json
```

```bash [输出到标准输出]
toon input.json
```

```bash [从标准输入管道传入]
cat data.json | toon
echo '{"name": "Ada"}' | toon
```

```bash [从标准输入解码]
cat data.toon | toon --decode
```

:::

按照惯例，TOON 文件使用 `.toon` 扩展名和临时媒体类型 `text/toon`（参见 [规范 §17](https://github.com/toon-format/spec/blob/main/SPEC.md#17-iana-considerations)）。

### 标准输入

省略输入参数，或使用 `-` 表示从标准输入读取。这样就能直接将其他命令的数据通过管道传入：

```bash
# 不需要参数
cat data.json | toon

# 使用连字符显式表示标准输入（效果相同）
cat data.json | toon -

# 从标准输入解码
cat data.toon | toon --decode
```

## 性能

### 流式输出

编码和解码操作都使用流式输出，以增量方式写出，而不会在内存中构建完整的输出字符串。这使得该 CLI 处理大型数据集时无需额外配置也能保持高效。

**JSON → TOON（编码）**：

* 逐行流式写出 TOON。
* 内存中不会保留完整的 TOON 字符串。

**TOON → JSON（解码）**：

* 使用与 `@toon-format/toon` 中 `decodeStream` API 相同的基于事件的流式解码器。
* 流式写出 JSON token。
* 内存中不会保留完整的 JSON 字符串。

以最小的内存占用处理大文件：

```bash
# 编码大型 JSON 文件
toon huge-dataset.json -o output.toon

# 解码大型 TOON 文件
toon huge-dataset.toon -o output.json

# 通过标准输入高效处理数百万条记录
cat million-records.json | toon > output.toon
cat million-records.toon | toon --decode > output.json
```

峰值内存占用与数据的嵌套深度有关，而非总数据量。这样一来，只要单个嵌套结构能够放入内存，就可以处理任意大小的文件。

::: tip Token 统计
在编码时使用 `--stats` 选项时，CLI 会构建一次完整的 TOON 字符串以计算准确的 token 数量。若要在超大文件上追求最大内存效率，请省略 `--stats`。
:::

## 选项

| 选项 | 说明 |
| ------ | ----------- |
| `-o, --output <file>` | 输出文件路径（省略时打印到标准输出） |
| `-e, --encode` | 强制编码模式（覆盖自动检测） |
| `-d, --decode` | 强制解码模式（覆盖自动检测） |
| `--delimiter <char>` | 数组分隔符：`,`（逗号）、制表符、`\|`（管道符）。在 bash/zsh 中以 `$'\t'` 传入制表符 |
| `--indent <number>` | 缩进（默认：`2`） |
| `--stats` | 显示 token 数量估算值及节省情况（仅编码时可用） |
| `--no-strict` | 跳过解码校验（数组数量、缩进、首部分隔符）；重复键时后写入的值生效 |
| `--verbose` | 显示完整的堆栈跟踪和错误原因链（默认：`false`） |

## 高级示例

### Token 统计

编码时显示节省的 token 数量：

```bash
toon data.json --stats -o output.toon
```

这有助于你在将数据发送给大语言模型之前预估可节省的 token 开销。

输出示例：

```
✔ Encoded data.json → output.toon

ℹ Token estimates: ~15,145 (JSON) → ~8,745 (TOON)
✔ Saved ~6,400 tokens (-42.3%)
```

### 分隔符选项

TOON 支持三种分隔符：逗号（默认）、制表符和管道符。根据数据情况，使用其他分隔符可以进一步节省 token。

::: code-group

```bash [制表符分隔（bash/zsh）]
toon data.json --delimiter $'\t' -o output.toon
```

```bash [竖线分隔]
toon data.json --delimiter "|" -o output.toon
```

:::

`--delimiter` 的值必须是实际的分隔符字符。在 bash/zsh 中，请使用 `$'\t'` 传入真正的制表符；字面量 `"\t"` 会被视为无效分隔符而被拒绝。

**制表符分隔示例：**

::: code-group

```yaml [制表符]
items[2	]{id	name	qty	price}:
  A1	Widget	2	9.99
  B2	Gadget	1	14.5
```

```yaml [逗号（默认）]
items[2]{id,name,qty,price}:
  A1,Widget,2,9.99
  B2,Gadget,1,14.5
```

:::

::: tip
制表符分隔通常比逗号更有利于降低 token 数，并减少对引号转义的需求。对于大型表格数据，可使用 `--delimiter $'\t'`（bash/zsh）尽可能节省 token。完整指导请参阅 [分隔符策略](/zh/reference/api#分隔符策略)。
:::

### 宽松解码

跳过校验，实现更快、容错性更强的解码：

```bash
toon data.toon --no-strict -o output.json
```

使用 `--no-strict` 时，解码器不再强制要求数组数量匹配、缩进为整数倍，也不再检查首部分隔符是否一致。重复的同级键不再抛出错误——以最后写入的值为准。格式错误的数组首部会回退为普通的 `key: value` 行，而不是报错。

### 解码错误输出

当 TOON 文档解析失败时，CLI 会渲染出错的那一行，并用插入符号指向第一个非空白字符。制表符会显示为 `→`，这样插入符号所在的列就能反映解码器实际看到的内容。

对于一个使用制表符缩进第二行的输入文件（此处用 `→` 表示）：

```
a:
→b: 1
```

CLI 会打印：

```
 ERROR  Failed to decode TOON at line 2: Tabs are not allowed in indentation in strict mode

  2 | →b: 1
      ^
```

发生任何错误时，退出码均为 `1`。默认情况下会隐藏堆栈跟踪。传入 `--verbose` 可包含完整堆栈和底层错误原因链——在提交错误报告或诊断意外错误路径时很有用：

```bash
cat broken.toon | toon --decode --verbose
```

::: tip 程序化访问
解码错误由库以 `ToonDecodeError` 实例的形式抛出。CLI 的插入符号渲染基于该类暴露的结构化 `line` 和 `source` 字段构建。如果你想在自己的代码中获得同样详细的诊断信息，请参阅 API 参考中的 [错误处理](/zh/reference/api#错误处理) 部分。
:::

### 标准输入工作流

该 CLI 可以与 Unix 管道及其他命令行工具无缝集成：

```bash
# 将 API 响应转换为 TOON
curl https://api.example.com/data | toon --stats

# 处理大型数据集
cat large-dataset.json | toon --delimiter $'\t' > output.toon

# 与 jq 串联使用
jq '.results' data.json | toon > filtered.toon
```

### 组合选项

组合使用多个选项以获得最大效率：

```bash
# 制表符分隔 + 统计信息
toon data.json --delimiter $'\t' --stats -o output.toon
```
