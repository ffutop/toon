---
url: /zh/reference/api.md
description: '@toon-format/toon 的 TypeScript 与 JavaScript 编码/解码函数、选项、错误类型及流式解码器。'
---

# API 参考

`@toon-format/toon` 软件包的 TypeScript/JavaScript API 文档。关于格式规则，请参阅 [格式概览](/zh/guide/format-overview) 或 [规范](/zh/reference/spec)。关于其他语言，请参阅 [实现列表](/zh/ecosystem/implementations)。

## 安装

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

## 编码函数

### `encode(input, options?)`

将任意可序列化为 JSON 的值转换为 TOON 格式。

```ts
import { encode } from '@toon-format/toon'

const toon = encode(data, {
  indentSize: 2,
  delimiter: ','
})
```

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `input` | `unknown` | 任意可序列化为 JSON 的值（对象、数组、基本类型或嵌套结构） |
| `options` | `EncodeOptions?` | 可选的编码选项（参见 [配置参考](#配置参考)） |

#### 返回值

返回一个 TOON 格式的字符串，末尾没有换行符或空格。

#### 类型规范化

不可序列化为 JSON 的值在编码前需要规范化：

| 输入 | 输出 |
|-------|--------|
| 带 `toJSON()` 方法的 `Object` | 调用 `toJSON()` 得到的结果，并对该结果递归进行规范化 |
| 位于 `[1e-6, 1e21)` 区间内的有限数值，或零 | 规范的十进制形式（例如 `1e6` → `1000000`,`-0` → `0`） |
| 超出该区间的有限数字 | 允许使用指数记法（例如 `1e-7`、`1e+21`） |
| `NaN`、`Infinity`、`-Infinity` | `null` |
| `BigInt`（可无精度损失地转换为 Number） | Number |
| `BigInt`（不可无损转换） | 带引号的十进制字符串（例如 `"9007199254740993"`） |
| `Date` | 带引号的 ISO 字符串（例如 `"2025-01-01T00:00:00.000Z"`） |
| `Set` | 规范化后的值组成的数组 |
| `Map` | 以 `String(key)` 为键的对象 |
| `undefined`、`function`、`symbol` | `null` |

::: info
TOON 本身并未规定 `Date` 应如何编码——规范将其留给具体实现决定。本库以带引号的 ISO 8601 字符串形式输出；其他实现可能会有不同的选择。
:::

#### 示例

```ts
import { encode } from '@toon-format/toon'

const items = [
  { sku: 'A1', qty: 2, price: 9.99 },
  { sku: 'B2', qty: 1, price: 14.5 }
]

console.log(encode({ items }))
```

**输出：**

```yaml
items[2]{sku,qty,price}:
  A1,2,9.99
  B2,1,14.5
```

### `encodeLines(input, options?)`

**流式输出 TOON 的首选方法。** 将任意可序列化为 JSON 的值逐行转换为 TOON 格式输出，而不会在内存中构建完整的字符串。适用于将大型输出流式写入文件、HTTP 响应或进程标准输出。

```ts
import { encodeLines } from '@toon-format/toon'

// 流式输出到标准输出(Node.js)
for (const line of encodeLines(data)) {
  process.stdout.write(`${line}\n`)
}

// 逐行写入文件
const lines = encodeLines(data, { indentSize: 2, delimiter: '\t' })
for (const line of lines) {
  await writeToStream(`${line}\n`)
}

// 收集为数组
const lineArray = Array.from(encodeLines(data))
```

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `input` | `unknown` | 任意可序列化为 JSON 的值（对象、数组、基本类型或嵌套结构） |
| `options` | `EncodeOptions?` | 可选的编码选项（参见 [配置参考](#配置参考)） |

#### 返回值

返回一个 `Iterable<string>`，用于逐行产出 TOON 行。**每个产出的字符串都不带结尾换行符**——写入流或标准输出时，你需要自行添加 `\n`。

::: info 与 `encode()` 的关系
`encode(value, options)` 等价于：

```ts
Array.from(encodeLines(value, options)).join('\n')
```

:::

#### 示例

```ts
import { createWriteStream } from 'node:fs'
import { encodeLines } from '@toon-format/toon'

const data = {
  items: Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random()
  }))
}

// 将大型数据集流式写入文件
const stream = createWriteStream('output.toon')
for (const line of encodeLines(data, { delimiter: '\t' })) {
  stream.write(`${line}\n`)
}
stream.end()
```

### 替换函数(Replacer)

`replacer` 选项允许你在编码过程中转换或过滤值。它的工作方式类似于 `JSON.stringify` 的 replacer 参数，同时会跟踪当前值在结构中的路径，便于进行更精细的控制。

#### 类型签名

```ts
type EncodeReplacer = (
  key: string,
  value: JsonValue,
  path: readonly (string | number)[]
) => unknown
```

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `key` | `string` | 属性名、数组索引（以字符串形式）或根位置的空字符串 |
| `value` | `JsonValue` | 该位置归一化后的值 |
| `path` | `readonly (string \| number)[]` | 从根到当前值的路径 |

#### 返回值

* 原样返回该值以保留它
* 返回一个不同的值替换它（将被规范化）
* 返回 `undefined` 以省略属性/数组元素
* 对于根值，`undefined` 表示“不改变”（因为根值不能被省略）

#### 示例

**过滤敏感数据：**

```ts
import { encode } from '@toon-format/toon'

const data = {
  user: { name: 'Ada', password: 'secret123', email: 'ada@example.com' }
}

function replacer(key, value) {
  if (key === 'password')
    return undefined
  return value
}

console.log(encode(data, { replacer }))
```

**输出：**

```yaml
user:
  name: Ada
  email: ada@example.com
```

**转换值：**

```ts
const data = { user: 'alice', role: 'admin' }

function replacer(key, value) {
  if (typeof value === 'string')
    return value.toUpperCase()
  return value
}

console.log(encode(data, { replacer }))
```

**输出：**

```yaml
user: ALICE
role: ADMIN
```

**基于路径的转换：**

```ts
const data = {
  metadata: { created: '2025-01-01' },
  user: { created: '2025-01-02' }
}

function replacer(key, value, path) {
  // 只为顶层的 metadata 添加时区信息
  if (path.length === 1 && path[0] === 'metadata' && key === 'created') {
    return `${value}T00:00:00Z`
  }
  return value
}

console.log(encode(data, { replacer }))
```

**输出：**

```yaml
metadata:
  created: "2025-01-01T00:00:00Z"
user:
  created: 2025-01-02
```

::: info 替换函数的执行顺序
replacer 以深度优先的方式被调用：

1. 首先是根值(key = `''`, path = `[]`)
2. 然后是每个属性/元素（带有正确的 key 和 path）
3. 替换后值会被重新规范化
4. 子节点会在父节点转换完成后被处理
   :::

::: warning 数组索引以字符串形式传入
遵循 `JSON.stringify` 的行为，数组索引会以字符串形式（`'0'`、`'1'`、`'2'` 等）传给 replacer，而不是数字。
:::

### 原始字符串输出

从 replacer 返回 `rawString(...)` 可以在值的位置原样输出字符串，绕过 TOON 的引号、转义以及数字/关键字检测。你可以将它与 `escapeString` 组合使用，在不重新实现转义处理的情况下自行控制引号。

```ts
import { encode, escapeString, rawString } from '@toon-format/toon'

const data = { name: 'Ada', age: 30 }

// 始终加引号模式：把每个叶子值都包在引号中
console.log(encode(data, {
  replacer: (key, value) => rawString(`"${escapeString(String(value))}"`)
}))
```

**输出：**

```yaml
name: "Ada"
age: "30"
```

#### 语义

* `rawString` 只会在本应输出基本类型的位置生效。如果为对象或数组值返回它，该值会被忽略，容器仍会正常编码；这让“包裹每个值”的 replacer 可以继续递归进入容器，而不是把容器折叠掉。
* 如果值中包含某一行，且该行第一个非空格字符是 `#`，则会在调用 `rawString(...)` 时抛出错误，无论该值最终会输出到哪里。原因是解码器会静默剥离这类注释行，数据会在不报错的情况下消失。

#### `escapeString(value)`

转义反斜杠、引号和控制字符，以便放入带引号的 TOON 字符串中。某个值是否需要加引号仍由调用方决定。

```ts
escapeString('a "quoted" value') // a \"quoted\" value
escapeString('line1\nline2') // line1\nline2 (escaped)
```

::: warning 单向逃生口
原始输出会绕过编码器的正确性保证：输出不保证是有效 TOON，也不保证能无损往返。在上面的示例中，`age` 会解码回字符串 `"30"`，而不是数字 `30`。
:::

## 解码函数

### `decode(input, options?)`

将 TOON 格式的字符串转换回 JavaScript 值。

```ts
import { decode } from '@toon-format/toon'

const data = decode(toon, {
  indentSize: 2,
  strict: true
})
```

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `input` | `string` | 要解析的 TOON 格式字符串 |
| `options` | `DecodeOptions?` | 可选的解码选项（参见 [配置参考](#配置参考)） |

#### 返回值

返回一个 JavaScript 值，表示解析后的 TOON 数据（对象、数组或基本类型）。

数字 token 会解码为 `number`，并遵循 IEEE 754 双精度：超出精度的值会静默舍入（包括安全整数范围之外的整数）；溢出有限范围的 token 会解码为字符串。这是解码器按 [规范 §4](https://github.com/toon-format/spec/blob/main/SPEC.md#4-decoding-interpretation-reference-decoder) 记录的越界策略。必须保持精确的值应放在带引号的字符串中；`encode()` 会自动以这种方式输出越界的 `BigInt` 值。

#### 示例

```ts
import { decode } from '@toon-format/toon'

const toon = `
items[2]{sku,qty,price}:
  A1,2,9.99
  B2,1,14.5
`

const data = decode(toon)
console.log(data)
```

**输出：**

```json
{
  "items": [
    { "sku": "A1", "qty": 2, "price": 9.99 },
    { "sku": "B2", "qty": 1, "price": 14.5 }
  ]
}
```

### `decodeFromLines(lines, options?)`

将预先按行拆分好的 TOON 数据解码为一个 JavaScript 值。这是一个对流式处理友好的封装，基于事件驱动的解码器会在内存中构建完整的值。

当你已经拥有数组或可迭代对象形式的行数据（例如来自文件流、readline 接口或网络响应），并希望获得标准解码行为时，该函数非常有用。

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `lines` | `Iterable<string>` | TOON 各行组成的可迭代对象（不含结尾换行符） |
| `options` | `DecodeOptions?` | 可选的解码配置（参见 [配置参考](#配置参考)） |

#### 返回值

返回一个 `JsonValue`（即解析后的 JavaScript 值：对象、数组或原始值）。

#### 示例

**数组的基本示例：**

```ts
import { decodeFromLines } from '@toon-format/toon'

const lines = ['name: Ada', 'age: 30']
const value = decodeFromLines(lines)
// { name: 'Ada', age: 30 }
```

**Node.js readline 流式处理：**

```ts
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { decodeFromLines } from '@toon-format/toon'

const rl = createInterface({
  input: createReadStream('data.toon'),
  crlfDelay: Infinity,
})

const value = decodeFromLines(rl)
console.log(value)
```

### 选择合适的解码器

| 函数 | 输入 | 输出 | 异步 | 适用场景 |
|----------|-------|--------|-------|----------|
| `decode()` | 字符串 | 值 | 否 | 你拥有完整的 TOON 字符串 |
| `decodeFromLines()` | 行 | 值 | 否 | 你拥有行数据，并希望得到完整的值 |
| `decodeStreamSync()` | 行 | 事件 | 否 | 你需要逐事件处理（同步） |
| `decodeStream()` | 行 | 事件 | 是 | 你需要逐事件处理（异步） |

::: info 关键区别

* **值 vs 事件**：以 `Stream` 结尾的函数会产生事件，而不会在内存中构建完整的值。
* **异步支持**：只有 `decodeStream()` 接受异步可迭代对象（适用于文件/网络流）。
  :::

## 流式解码器

### `decodeStreamSync(lines, options?)`

将 TOON 各行同步解码为一系列 JSON 事件流。该函数会产出表示 JSON 数据模型的结构化事件，而不会构造完整的嵌套值结构。

适用于流式处理、自定义转换，以及处理大型数据集时无需在内存中保存完整数据的高效解析。

::: tip 事件流
这是一个返回单个解析事件的底层 API。对于大多数使用场景，[`decodeFromLines()`](#decodefromlines-lines-options) 或 [`decode()`](#decode-input-options) 会更方便。
:::

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `lines` | `Iterable<string>` | TOON 各行组成的可迭代对象（不含结尾换行符） |
| `options` | `DecodeStreamOptions?` | 可选的流式解码配置（参见 [配置参考](#配置参考)） |

#### 返回值

返回一个 `Iterable<JsonStreamEvent>`，产出结构化事件（事件结构参见 [TypeScript 类型](#typescript-类型)）。

#### 示例

**基本的事件流：**

```ts
import { decodeStreamSync } from '@toon-format/toon'

const lines = ['name: Ada', 'age: 30']

for (const event of decodeStreamSync(lines)) {
  console.log(event)
}

// 输出:
// { type: 'startObject' }
// { type: 'key', key: 'name' }
// { type: 'primitive', value: 'Ada' }
// { type: 'key', key: 'age' }
// { type: 'primitive', value: 30 }
// { type: 'endObject' }
```

**自定义处理：**

```ts
import { decodeStreamSync } from '@toon-format/toon'

const lines = ['users[2]{id,name}:', '  1,Ada', '  2,Bob']
let userCount = 0

for (const event of decodeStreamSync(lines)) {
  if (event.type === 'endObject' && userCount < 2) {
    userCount++
    console.log(`已处理用户 ${userCount}`)
  }
}
```

### `decodeStream(source, options?)`

将 TOON 各行异步解码为一系列 JSON 事件流。这是 [`decodeStreamSync()`](#decodestreamsync-lines-options) 的异步版本，同时支持同步和异步可迭代对象。

适用于处理文件流、网络响应或其他异步数据源，让你能够在数据到达时增量地处理它。

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `source` | `AsyncIterable<string>` | `Iterable<string>` | TOON 各行组成的异步或同步可迭代对象（不含结尾换行符） |
| `options` | `DecodeStreamOptions?` | 可选的流式解码配置（参见 [配置参考](#配置参考)） |

#### 返回值

返回一个 `AsyncIterable<JsonStreamEvent>`，异步产出结构化事件（事件结构参见 [TypeScript 类型](#typescript-类型)）。

#### 示例

**从文件流式处理：**

```ts
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { decodeStream } from '@toon-format/toon'

const fileStream = createReadStream('data.toon', 'utf-8')
const rl = createInterface({ input: fileStream, crlfDelay: Infinity })

for await (const event of decodeStream(rl)) {
  console.log(event)
  // 在事件到达时进行处理
}
```

## 错误处理

当输入无法解析时，解码过程会抛出 `ToonDecodeError`。该类继承自 `SyntaxError`，因此，现有的 `error instanceof SyntaxError` 检查无需改动即可继续生效。

### `ToonDecodeError`

```ts
import { ToonDecodeError } from '@toon-format/toon'
```

#### 字段

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| `name` | `'ToonDecodeError'` | 判别标记——`error.name === 'ToonDecodeError'` |
| `message` | `string` | 人类可读的消息；当已知行号时会带有 `Line N: ` 前缀 |
| `line` | `number?` | 错误所在行的行号（从 1 开始） |
| `source` | `string?` | 原始源代码行（包含其前导空白字符） |
| `cause` | `unknown?` | 解码器为底层解析器故障补充上下文时的原始错误 |

对于带有行上下文的错误，line 和 source 字段都会被填充；这基本涵盖正常解码过程中的所有解析错误。cause 链会指向词元级解析器抛出的底层 SyntaxError 或 TypeError，因此调试器和详细日志工具可以显示原始栈帧。

#### 示例

```ts
import { decode, ToonDecodeError } from '@toon-format/toon'

try {
  decode('a:\n\tb: 1')
}
catch (error) {
  if (error instanceof ToonDecodeError) {
    console.error(`Line ${error.line}:`, error.source)
    console.error(error.message)
    // Line 2: 	b: 1
    // Line 2: Tabs are not allowed in indentation in strict mode
  }
  else {
    throw error
  }
}
```

::: info 旧版本兼容性
`ToonDecodeError` 继承自 `SyntaxError`。针对早期版本编写、捕获 `SyntaxError` 的代码仍然能够匹配这些错误。该类只是添加了结构化字段，并未移除任何内容。
:::

## 配置参考

### `EncodeOptions`

[`encode()`](#encode-input-options) 和 [`encodeLines()`](#encodelines-input-options) 的配置：

| 选项 | 类型 | 默认值 | 说明 |
|--------|------|---------|-------------|
| `indentSize` | `number` | `2` | 每个缩进层级的空格数 |
| `delimiter` | `','` | `'\t'` | `'\|'` | `','` | 数组值和表格行使用的分隔符 |
| `replacer` | `EncodeReplacer` | `undefined` | 编码前用于转换或省略值的可选钩子（参见 [替换函数](#替换函数-replacer)） |

**分隔符选项：**

::: code-group

```ts [逗号（默认）]
encode(data, { delimiter: ',' })
```

```ts [制表符]
encode(data, { delimiter: '\t' })
```

```ts [竖线]
encode(data, { delimiter: '|' })
```

:::

关于如何选择分隔符，请参阅 [分隔符策略](#分隔符策略)。

### `DecodeOptions`

[`decode()`](#decode-input-options) 和 [`decodeFromLines()`](#decodefromlines-lines-options) 的配置：

| 选项 | 类型 | 默认值 | 说明 |
|--------|------|---------|-------------|
| `indentSize` | `number` | `2` | 每个缩进层级期望的空格数 |
| `strict` | `boolean` | `true` | 启用严格校验（数组数量、缩进、分隔符一致性） |

默认情况下(`strict: true`)，解码器会严格校验输入：

* **非法转义序列**：遇到 `\x`、未终止的字符串、无法完整表示 Unicode 字符的 `\uXXXX` 时抛出错误
* **语法错误**：遇到缺少冒号、格式错误的首部时抛出错误
* **数组长度不匹配**：当声明的长度与实际数量不一致时抛出错误
* **带键表格不匹配**：当条目行数量与声明数量不一致，或某一行的单元格数量与首部叶子字段数量不一致时抛出错误（§9.5）
* **首部分隔符不匹配**：当方括号中声明的分隔符与字段列表中使用的分隔符不一致时抛出错误(§14.2)
* **缩进错误**：当前导空格数不是 `indentSize` 的整数倍、进入嵌套作用域时深度跳过一级以上、或出现不属于任何作用域的过度缩进行时抛出错误（§14.2）。严格解码绝不会静默丢弃输入，包括根数组或根级带键表格完成后的尾随内容（§5）
* **首部结构**：遇到带前导零或非整数的数组长度、格式错误的带键标记，以及方括号/字段/冒号之间存在插入内容时抛出错误
* **重复的同级键**：当同一对象下存在两个具有相同键的子项时抛出错误，包括重复的条目键（§14.3）

所有解码错误都以 [`ToonDecodeError`](#错误处理) 实例的形式抛出，并带有结构化的 `line` 和 `source` 字段。

将 `strict` 设为 `false` 可跳过这些检查。此时重复的同级键会按照文档顺序、以最后写入的值为准来解决。声明的 `[N]` 永远不会截断作用域：作用域中实际包含的每个列表项、表格行和条目行都会被解码，无论其数量少于还是多于 `N`（§14.1）。

有四类情况在两种模式下都是错误，因为没有任何恢复方式能保留文档含义（§14）：键上下文中缺少冒号、非法转义或未终止的带引号字符串、带引号 token 的结束引号后仍有字符，以及深度 0 的行既不是首部也不是键值行的文档。

**已记录的解码器策略。** 规范要求每个实现说明规范留给实现决定的选择（§4、§12、§15）：

* **数字越界**：匹配 §4 数字语法但幅度超出 IEEE 754 双精度范围的 token 会解码为字符串；下溢的 token 会解码为数字 `0`；可容纳但不能精确表示的 token 会解码为最接近的双精度数。需要精确小数时，请使用 `replacer` 或在解码后处理该值。
* **制表符缩进**：严格模式下会被拒绝。`strict: false` 时，行首制表符会被视为缩进并从行内容中移除；每个行首制表符贡献一级深度。
* **对象表示**：解码后的对象是普通 JavaScript 对象。`__proto__`、`constructor` 和 `prototype` 会作为普通自有条目物化，绝不会修改原型链（§15）。JavaScript 会把整数形式的键重排到字符串键之前，因此如果文档键中包含整数形式的 token，则不会保留文档中的键顺序（§2）。

### `DecodeStreamOptions`

[`decodeStreamSync()`](#decodestreamsync-lines-options) 和 [`decodeStream()`](#decodestream-source-options) 的配置：

| 选项 | 类型 | 默认值 | 说明 |
|--------|------|---------|-------------|
| `indentSize` | `number` | `2` | 每个缩进层级期望的空格数 |
| `strict` | `boolean` | `true` | 启用严格校验（数组数量、缩进、分隔符一致性） |

## TypeScript 类型

### `JsonStreamEvent`

由 [`decodeStreamSync()`](#decodestreamsync-lines-options) 和 [`decodeStream()`](#decodestream-source-options) 发出的事件：

```ts
type JsonStreamEvent
  = | { type: 'startObject' }
    | { type: 'endObject' }
    | { type: 'startArray', length: number }
    | { type: 'endArray' }
    | { type: 'key', key: string }
    | { type: 'primitive', value: JsonPrimitive }
```

### 分隔符

```ts
import { DEFAULT_DELIMITER, DELIMITERS } from '@toon-format/toon'

DEFAULT_DELIMITER // ','
DELIMITERS // { comma: ',', tab: '\t', pipe: '|' }
```

| 导出 | 说明 |
|--------|-------------|
| `DEFAULT_DELIMITER` | 未指定分隔符时使用的默认分隔符字符(`,`) |
| `DELIMITERS` | 不可变的记录对象，用于将分隔符名称映射到对应的字符 |
| `Delimiter` | 合法分隔符字符的联合类型：`',' \| '\t' \| '\|'` |
| `DelimiterKey` | 分隔符名称的联合类型：`'comma' \| 'tab' \| 'pipe'` |

### 选项类型

| 导出 | 说明 |
|--------|-------------|
| `EncodeOptions` | [`encode()`](#encode-input-options) 和 [`encodeLines()`](#encodelines-input-options) 接受的选项 |
| `DecodeOptions` | [`decode()`](#decode-input-options) 和 [`decodeFromLines()`](#decodefromlines-lines-options) 接受的选项 |
| `DecodeStreamOptions` | [`decodeStreamSync()`](#decodestreamsync-lines-options) 和 [`decodeStream()`](#decodestream-source-options) 接受的选项 |
| `EncodeReplacer` | [替换函数](#replacer-function) 的函数签名 |
| `ResolvedEncodeOptions` | 应用默认值后的 `EncodeOptions`（高级用法） |
| `ResolvedDecodeOptions` | 应用默认值后的 `DecodeOptions`（高级用法） |

## 指南与示例

### 往返转换兼容性

TOON 在规范化处理后提供无损的往返转换：

```ts
import { decode, encode } from '@toon-format/toon'

const original = {
  users: [
    { id: 1, name: 'Ada', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' }
  ]
}

const toon = encode(original)
const restored = decode(toon)

console.log(JSON.stringify(original) === JSON.stringify(restored))
// true
```

### 分隔符策略

制表符分隔(`\t`)通常比逗号分隔符具有更高的分词效率。制表符是单个字符，且很少出现在自然语言文本中，因此可以减少引号转义的需求，并在大型数据集中产生更少的 token。

示例：

```yaml
items[2	]{sku	name	qty	price}:
  A1	Widget	2	9.99
  B2	Gadget	1	14.5
```

对于大型表格数据，若要最大限度减少 token 用量，可以使用制表符分隔符：

```ts
encode(data, { delimiter: '\t' })
```

**如何选择分隔符：**

* **逗号(`,`)**：默认选项，广泛易懂，适合简单的表格数据。
* **制表符(`\t`)**：通常能为大语言模型提供最佳 token 使用效率，适合大型数据集。
* **竖线(`|`)**：当数据中经常出现逗号时的可选替代。
