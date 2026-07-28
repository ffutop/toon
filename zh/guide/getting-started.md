---
url: /zh/guide/getting-started.md
description: TOON 是什么、何时使用它，以及使用 TypeScript 库进行编码/解码的第一个示例。
---

# 快速开始

## 什么是 TOON ？

**面向 Token 的对象表示法(Token-Oriented Object Notation)** 是一种紧凑、人类可读的 JSON 数据模型编码方式，能够最大限度地减少 token 消耗，并让大语言模型更可靠地解析结构。

TOON 结合了 YAML 基于缩进的嵌套对象结构，以及用于一致数据的 CSV 风格表格化形式。它最适合结构一致的对象——无论这些对象位于数组中，还是以 ID 作为键存放——在提供 CSV 般紧凑性的同时，还增加了明确的结构标记，帮助大语言模型更可靠地解析和校验数据。

可以把它看作一层“翻译层”：在程序中照常使用 JSON，而在发送给大语言模型之前将其编码为 TOON，作为你已有 JSON 的即插即用、无损表示。

### 为什么选择 TOON ？

大语言模型 token 会产生成本，而标准 JSON 较为冗长。下面是一份 TOON 格式的天气预报：

```yaml
location:
  city: Berlin
  country: DE
  units: metric
alerts[2]: frost,wind
forecast[3]{day,temp{min,max},condition,rainChance}:
  Mon,-2,4,snow,80
  Tue,1,7,cloudy,20
  Wed,3,11,sunny,5
```

同一份数据用 JSON 表示，大约是 117 个 token；TOON 大约是 66 个：

```json
{
  "location": {
    "city": "Berlin",
    "country": "DE",
    "units": "metric"
  },
  "alerts": [
    "frost",
    "wind"
  ],
  "forecast": [
    {
      "day": "Mon",
      "temp": {
        "min": -2,
        "max": 4
      },
      "condition": "snow",
      "rainChance": 80
    },
    {
      "day": "Tue",
      "temp": {
        "min": 1,
        "max": 7
      },
      "condition": "cloudy",
      "rainChance": 20
    },
    {
      "day": "Wed",
      "temp": {
        "min": 3,
        "max": 11
      },
      "condition": "sunny",
      "rainChance": 5
    }
  ]
}
```

TOON 将 YAML 的缩进用于 `location` 对象，将内联形式用于基本类型数组 `alerts`，并将表格化形式用于 `forecast` 数组：`[3]` 声明数组长度（让大语言模型能回答数据集大小问题并检测截断），`{day,…}` 只声明一次字段名，每一行则流式呈现逗号分隔的值。结构一致的嵌套 `temp` 对象会折叠进首部，成为[嵌套字段组](/zh/guide/format-overview#嵌套字段组)（`temp{min,max}`），而行数据保持扁平。每种形式都会根据数据形状自动选择。

这种模式贯穿 TOON 始终：结构只声明一次，数据紧凑地流式呈现，最终效果接近 CSV 的信息密度，同时又保留了显式结构。

结构一致对象组成的映射也会折叠：[带键的表格化形式](/zh/guide/format-overview#带键的表格化对象)会把它们转换成行中自带键的表格。

### 设计目标

TOON 针对特定使用场景进行了优化。它旨在：

* 通过只声明一次结构并流式呈现数据，让结构一致的对象数组尽可能紧凑。
* 保持完全无损且具有确定性——往返转换会保留所有数据和结构。
* 通过显式的结构标记，让大语言模型和人类都能简单、稳健地解析。
* 提供校验护栏（数组长度、字段数量），帮助检测截断和格式错误的输出。

## 何时使用 TOON

TOON 在处理“结构一致的对象数组”（即各条目结构相同的数据）时表现出色。对于大语言模型提示词，该格式能生成确定性的、极少使用引号的文本，并带有内置校验。显式的数组长度(`[N]`)和字段列表(`{fields}`)有助于检测截断和格式错误的数据，同时表格化形式只需声明一次字段列表，而不必在每一行中重复。

::: tip
TOON 格式已经稳定，但也仍在持续演进中。一切都不是一成不变的——欢迎通过为 [规范](https://github.com/toon-format/spec) 做贡献或分享反馈来帮助塑造它的未来方向。
:::

## 何时不使用 TOON

TOON 并非总是最佳选择。在以下情况下可以考虑其他方案：

* **深度嵌套或结构不一致的数据**（表格化适用率 ≈ 0%）：JSON 压缩版通常使用更少的 token。例如：具有多层嵌套的复杂配置对象。
* **半一致的数组**（表格化适用率约 40%–60%）：节省的 token 会减少。如果你的处理流程已经依赖 JSON，建议优先使用 JSON。
* **纯表格数据**：对于扁平表格，CSV 比 TOON 更小。TOON 会增加少量开销（约 5%–10%），以提供能提升大语言模型可靠性的结构（数组长度声明、字段列表、分隔符作用域）。
* **对延迟敏感的应用**：请在你自己的实际环境中进行基准测试。某些部署场景（尤其是本地/量化模型）处理紧凑 JSON 的速度可能反而更快，尽管 TOON 的 token 数更低。

::: info
关于不同结构下基于数据的对比，请参阅 [基准测试](/zh/guide/benchmarks)。在针对延迟进行优化时，请分别测量 TOON 和 JSON 压缩版的首字时间(TTFT)、每秒 token 数和总耗时，并在你的具体环境中选择更快的那一个。
:::

## 安装

### TypeScript 库

使用你偏好的包管理器安装该库：

::: code-group

```bash [npm]
npm install @toon-format/toon
```

```bash [pnpm]
pnpm add @toon-format/toon
```

```bash [yarn]
yarn add @toon-format/toon
```

:::

### CLI

CLI 可以通过 `npx` 免安装使用，也可以全局安装：

::: code-group

```bash [npx（无需安装）]
npx @toon-format/cli input.json -o output.toon
```

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

完整的 CLI 文档请参阅 [CLI 参考](/zh/cli/)。

## 媒体类型与文件扩展名

按照惯例，TOON 文件使用 `.toon` 扩展名。对于 HTTP 传输，临时的媒体类型为 `text/toon`，并始终使用 UTF-8 编码。你可以显式指定 `charset=utf-8`，但这是可选的——UTF-8 是默认假设。这遵循了 [规范第 17 节](https://github.com/toon-format/spec/blob/main/SPEC.md#17-iana-considerations) 中所述的注册流程。

## 你的第一个示例

下面的示例使用 TypeScript 库进行演示，但同样的操作在任何拥有 TOON 实现的语言中都同样适用。

让我们用 TypeScript 库编码一个简单的数据集：

```ts
import { encode } from '@toon-format/toon'

const data = {
  users: [
    { id: 1, name: 'Ada', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' }
  ]
}

console.log(encode(data))
```

**输出：**

```yaml
users[2]{id,name,role}:
  1,Ada,admin
  2,Bob,user
```

### 解码到 JSON

解码同样简单：

```ts
import { decode } from '@toon-format/toon'

const toon = `
users[2]{id,name,role}:
  1,Ada,admin
  2,Bob,user
`

const data = decode(toon)
console.log(JSON.stringify(data, null, 2))
```

**输出：**

```json
{
  "users": [
    { "id": 1, "name": "Ada", "role": "admin" },
    { "id": 2, "name": "Bob", "role": "user" }
  ]
}
```

往返转换是无损的：`decode(encode(x))` 始终等于 `x`（在对 `Date`、`NaN` 等非 JSON 类型进行归一化处理之后）。

## 接下来去哪里

现在你已经看过了第一个 TOON 文档，接下来可以阅读 [格式概览](/zh/guide/format-overview) 了解完整的语法细节（对象、数组、表格形式、引号规则），然后了解 [在大语言模型中使用 TOON](/zh/guide/llm-prompts)，看看如何在提示词中有效使用它。想了解实现细节，可以查阅 [API 参考](/zh/reference/api)(TypeScript)或 [规范](/zh/reference/spec)（与语言无关的规范性规则）。
