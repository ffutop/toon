---
description: 向大语言模型发送 TOON 以及校验其生成的 TOON 的提示策略，附带示例。
---

# 在大语言模型中使用 TOON

TOON 专为向大语言模型传递结构化数据而设计，能降低 token 成本并提升可靠性。本指南展示如何在提示词中有效使用 TOON，既包括输入（向模型发送数据），也包括输出（让模型生成 TOON）。

本指南关注 TOON 格式本身。代码示例使用 TypeScript 库进行演示，但无论你使用哪种编程语言，同样的模式和技巧都适用。

## 为什么要在大语言模型场景中使用 TOON

大语言模型 token 会产生成本，而 JSON 较为冗长——数组中的每条记录都要重复字段名。TOON 只声明一次字段，然后数据逐行流式呈现，因此在结构一致的数组上尤其能减少 token；与格式化后的 JSON 相比，通常可节省 30%–60%。

TOON 提供了结构护栏：显式的 `[N]` 长度和 `{fields}` 头部，让模型更容易跟踪行数据，也便于你校验输出。严格模式有助于在解码模型响应时检测截断或格式错误的 TOON。

## 将 TOON 作为输入发送

使用 TOON 时，与其描述格式，不如直接展示格式。TOON 的结构本身就能说明格式规则——模型看到这种模式后，通常可以自然地理解并解析它。

将编码后的数据放在代码块中（为清晰起见，标记为 ` ```toon`）：

````md
数据采用 TOON 格式（2 空格缩进，数组会显示长度和字段）。

```toon
users[3]{id,name,role,lastLogin}:
  1,Alice,admin,"2025-01-15T10:30:00Z"
  2,Bob,user,"2025-01-14T15:22:00Z"
  3,Charlie,user,"2025-01-13T09:45:00Z"
```

任务：总结各用户的角色及其最近的活跃情况。
````

通常有缩进和首部就足够了——模型会像处理熟悉的 YAML 或 CSV 一样处理 TOON。显式的数组长度(`[N]`)和字段头(`{fields}`)有助于模型跟踪结构，对于大型表格尤为有用。

> [!NOTE]
> 大多数模型内置的语法高亮并不支持 TOON，因此使用 ` ```toon` 或 ` ```yaml` 都可以。真正重要的是结构本身。

## 让大语言模型生成 TOON

对于输出，当你希望模型**生成** TOON 时：

- **展示期望的首部**（例如 `users[N]{id,name,role}:`）。模型只需填充行数据，而不必重复键名，从而减少生成错误。
- **说明规则**：2 空格缩进、无尾随空格、`[N]` 需与行数保持一致。

下面这个提示词同时适用于读取和生成场景：

````md
数据采用 TOON 格式（2 空格缩进，数组会显示长度和字段）。

```toon
users[3]{id,name,role,lastLogin}:
  1,Alice,admin,"2025-01-15T10:30:00Z"
  2,Bob,user,"2025-01-14T15:22:00Z"
  3,Charlie,user,"2025-01-13T09:45:00Z"
```

任务：仅以 TOON 格式返回角色为 "user" 的用户。使用相同的首部格式。将 [N] 设为与行数一致。只输出代码块。
````

**期望的输出：**

```toon
users[2]{id,name,role,lastLogin}:
  2,Bob,user,"2025-01-14T15:22:00Z"
  3,Charlie,user,"2025-01-13T09:45:00Z"
```

模型将 `[N]` 调整为 `2`，并生成了两行数据。

### 使用严格模式校验

在解码模型生成的 TOON 时，使用严格模式（默认）来捕获错误：

```ts
import { decode } from '@toon-format/toon'

try {
  const data = decode(modelOutput, { strict: true })
  // 成功——数据有效
}
catch (error) {
  // 模型输出格式有误(数组长度不匹配、非法转义等)
  console.error('校验失败:', error.message)
}
```

严格模式会检查数组长度、缩进和转义，帮助你发现内容截断或 TOON 格式错误。完整细节请参阅 [API 参考](/zh/reference/api#decode-input-options)。

## 选择有利于 token 效率的分隔符

如果想进一步减少 token 用量，可以对以制表符分隔的表格使用 `delimiter: '\t'`。制表符是单个字符，通常比逗号更容易被高效地 token 化，也很少出现在自然文本中（因此可以减少引号转义）。

```ts
const toon = encode(data, { delimiter: '\t' })
```

在使用制表符时，请告诉模型“字段以制表符分隔”。关于分隔符的更多内容，请参阅 [格式概览](/zh/guide/format-overview#分隔符选项)。

## 流式处理大型输出

在处理大型数据集（数千条记录或深度嵌套结构）时，使用 `encodeLines()` 逐行流式输出 TOON，而不是在内存中构建完整字符串。

```ts
import { encodeLines } from '@toon-format/toon'

const largeData = await fetchThousandsOfRecords()

// 流式处理大型数据集，而不必将完整字符串加载到内存中
for (const line of encodeLines(largeData, { delimiter: '\t' })) {
  process.stdout.write(`${line}\n`)
}
```

CLI 同样支持流式处理，以实现内存高效的 JSON 到 TOON 的格式转换：

```bash
toon large-dataset.json -o output.toon
```

这种流式处理方式可以在为大语言模型准备大型上下文窗口时避免内存溢出。关于 `encodeLines()` 的完整细节，请参阅 [API 参考](/zh/reference/api#encodelines-input-options)。

**流式消费大语言模型输出：** 如果你的大语言模型客户端提供流式文本，并且你按行缓冲内容，就可以增量解码 TOON：

```ts
import { decodeFromLines } from '@toon-format/toon'

// 逐行缓冲响应的数据
const lines: string[] = []
let buffer = ''

for await (const chunk of modelStream) {
  buffer += chunk
  let index: number

  while ((index = buffer.indexOf('\n')) !== -1) {
    lines.push(buffer.slice(0, index))
    buffer = buffer.slice(index + 1)
  }
}

// 解码已缓冲的行
const data = decodeFromLines(lines)
```

关于流式解码 API，请参阅 [`decodeFromLines()`](/zh/reference/api#decodefromlines-lines-options) 和 [`decodeStream()`](/zh/reference/api#decodestream-source-options)。

## 技巧与注意事项

**展示而非描述。** 不要详细解释 TOON 语法——只需展示一个示例即可。模型会从上下文中学习这种模式。一个包含 2-5 行的简单代码块，比大段的文字说明更有效。

**保持示例精简。** 示例使用 2-5 行即可，不必给出几百行。模型会根据模式进行泛化。过大的示例只会浪费 token，而不会提升准确率。

**始终校验输出。** 使用 `strict: true`（默认值）解码生成的 TOON，以便尽早捕获错误。不要在未经检查的情况下，假定模型输出的就是有效的 TOON。

## 真实案例

下面是一个完整的工作流程：向模型发送数据，并校验模型返回的 TOON。

**带有 TOON 输入的提示词：**

````md
系统日志采用 TOON 格式（制表符分隔）：

```toon
events[4	]{id	level	message	timestamp}:
  1	error	Connection timeout	"2025-01-15T10:00:00Z"
  2	warn	Slow query	"2025-01-15T10:05:00Z"
  3	info	User login	"2025-01-15T10:10:00Z"
  4	error	Database error	"2025-01-15T10:15:00Z"
```

任务：仅以 TOON 格式返回 error 级别的事件。使用相同格式。
````

**校验响应：**

```ts
import { decode } from '@toon-format/toon'

const modelResponse = `
events[2	]{id	level	message	timestamp}:
  1	error	Connection timeout	"2025-01-15T10:00:00Z"
  4	error	Database error	"2025-01-15T10:15:00Z"
`

const filtered = decode(modelResponse, { strict: true })
// ✓ 校验通过——模型正确地进行了筛选,并将 [N] 调整为 2
```
