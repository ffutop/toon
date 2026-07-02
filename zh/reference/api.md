---
url: /zh/reference/api.md
description: '@toon-format/toon 的 TypeScript 与 JavaScript 编码/解码函数、选项、错误类型及流式解码器。'
---

# API 参考

`@toon-format/toon` 软件包的 TypeScript/JavaScript API 文档。关于格式规则,请参阅 [格式概览](/guide/format-overview) 或 [规范](/reference/spec)。关于其他语言,请参阅 [实现列表](/ecosystem/implementations)。

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

将任意可 JSON 序列化的值转换为 TOON 格式。

```ts
import { encode } from '@toon-format/toon'

const toon = encode(data, {
  indent: 2,
  delimiter: ',',
  keyFolding: 'off',
  flattenDepth: Infinity
})
```

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `input` | `unknown` | 任意可 JSON 序列化的值(对象、数组、基本类型或嵌套结构) |
| `options` | `EncodeOptions?` | 可选的编码选项(参见 [配置参考](#configuration-reference)) |

#### 返回值

返回一个 TOON 格式的字符串,末尾没有换行符或空格。

#### 类型归一化

不可 JSON 序列化的值在编码前会被归一化:

| 输入 | 输出 |
|-------|--------|
| 带 `toJSON()` 方法的 `Object` | 调用 `toJSON()` 的结果,并递归归一化 |
| 位于 `[1e-6, 1e21)` 范围内(或为零)的有限数字 | 规范的十进制形式(例如 `1e6` → `1000000`,`-0` → `0`) |
| 超出该范围的有限数字 | 允许使用指数记法(例如 `1e-7`、`1e+21`) |
| `NaN`、`Infinity`、`-Infinity` | `null` |
| `BigInt`(在安全范围内) | 数字 |
| `BigInt`(超出范围) | 带引号的十进制字符串(例如 `"9007199254740993"`) |
| `Date` | 带引号的 ISO 字符串(例如 `"2025-01-01T00:00:00.000Z"`) |
| `Set` | 归一化后的值组成的数组 |
| `Map` | 以 `String(key)` 为键的对象 |
| `undefined`、`function`、`symbol` | `null` |

::: info
TOON 本身并未规定 `Date` 应如何编码——规范将其留给具体实现决定。本库以带引号的 ISO 8601 字符串形式输出;其他实现可能会有不同的选择。
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

**输出:**

```yaml
items[2]{sku,qty,price}:
  A1,2,9.99
  B2,1,14.5
```

### `encodeLines(input, options?)`

**流式输出 TOON 的首选方法。** 将任意可 JSON 序列化的值以行序列的形式转换为 TOON 格式,而不会在内存中构建完整的字符串。适用于将大型输出流式写入文件、HTTP 响应或进程标准输出。

```ts
import { encodeLines } from '@toon-format/toon'

// 流式输出到标准输出(Node.js)
for (const line of encodeLines(data)) {
  process.stdout.write(`${line}\n`)
}

// 逐行写入文件
const lines = encodeLines(data, { indent: 2, delimiter: '\t' })
for (const line of lines) {
  await writeToStream(`${line}\n`)
}

// 收集为数组
const lineArray = Array.from(encodeLines(data))
```

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `input` | `unknown` | 任意可 JSON 序列化的值(对象、数组、基本类型或嵌套结构) |
| `options` | `EncodeOptions?` | 可选的编码选项(参见 [配置参考](#configuration-reference)) |

#### 返回值

返回一个 `Iterable<string>`,逐条产出 TOON 的每一行。**每个产出的字符串都是不带结尾换行符的单独一行**——写入流或标准输出时,你需要自行添加 `\n`。

::: info 与 `encode()` 的关系
`encode(value, options)` 等价于:

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

`replacer` 选项允许你在编码过程中转换或过滤值。它的工作方式类似于 `JSON.stringify` 的 replacer 参数,但带有路径追踪,以实现更精确的控制。

#### 类型签名

```typescript
type EncodeReplacer = (
  key: string,
  value: JsonValue,
  path: readonly (string | number)[]
) => unknown
```

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `key` | `string` | 属性名、数组索引(以字符串形式)或根位置的空字符串 |
| `value` | `JsonValue` | 该位置归一化后的值 |
| `path` | `readonly (string \| number)[]` | 从根到当前值的路径 |

#### 返回值

* 原样返回该值以保留它
* 返回一个不同的值以替换它(将被归一化)
* 返回 `undefined` 以省略属性/数组元素
* 对于根值,`undefined` 表示"不改变"(根值不能被省略)

#### 示例

**过滤敏感数据:**

```typescript
import { encode } from '@toon-format/toon'

const data = {
  user: { name: 'Alice', password: 'secret123', email: 'alice@example.com' }
}

function replacer(key, value) {
  if (key === 'password')
    return undefined
  return value
}

console.log(encode(data, { replacer }))
```

**输出:**

```yaml
user:
  name: Alice
  email: alice@example.com
```

**转换值:**

```typescript
const data = { user: 'alice', role: 'admin' }

function replacer(key, value) {
  if (typeof value === 'string')
    return value.toUpperCase()
  return value
}

console.log(encode(data, { replacer }))
```

**输出:**

```yaml
user: ALICE
role: ADMIN
```

**基于路径的转换:**

```typescript
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

**输出:**

```yaml
metadata:
  created: "2025-01-01T00:00:00Z"
user:
  created: 2025-01-02
```

::: info 替换函数的执行顺序
replacer 以深度优先的方式被调用:

1. 首先是根值(key = `''`,path = `[]`)
2. 然后是每个属性/元素(带有正确的 key 和 path)
3. 替换后值会被重新归一化
4. 子项会在父项转换完成后被处理
   :::

::: warning 数组索引以字符串形式传入
遵循 `JSON.stringify` 的行为,数组索引会以字符串形式(`'0'`、`'1'`、`'2'` 等)传给 replacer,而不是数字。
:::

## 解码函数

### `decode(input, options?)`

将 TOON 格式的字符串转换回 JavaScript 值。

```ts
import { decode } from '@toon-format/toon'

const data = decode(toon, {
  indent: 2,
  strict: true,
  expandPaths: 'off'
})
```

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `input` | `string` | 要解析的 TOON 格式字符串 |
| `options` | `DecodeOptions?` | 可选的解码选项(参见 [配置参考](#configuration-reference)) |

#### 返回值

返回一个表示已解析 TOON 数据的 JavaScript 值(对象、数组或基本类型)。

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

**输出:**

```json
{
  "items": [
    { "sku": "A1", "qty": 2, "price": 9.99 },
    { "sku": "B2", "qty": 1, "price": 14.5 }
  ]
}
```

### `decodeFromLines(lines, options?)`

将预先按行拆分好的 TOON 数据解码为一个 JavaScript 值。这是一个对流式处理友好的封装,基于事件驱动的解码器,会在内存中构建完整的值。

当你已经拥有数组或可迭代对象形式的行数据(例如来自文件流、readline 接口或网络响应),并希望获得带路径展开支持的标准解码行为时,该函数非常有用。

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `lines` | `Iterable<string>` | TOON 各行组成的可迭代对象(不含结尾换行符) |
| `options` | `DecodeOptions?` | 可选的解码配置(参见 [配置参考](#configuration-reference)) |

#### 返回值

返回一个 `JsonValue`(已解析的 JavaScript 值:对象、数组或基本类型)。

#### 示例

**数组的基本用法:**

```ts
import { decodeFromLines } from '@toon-format/toon'

const lines = ['name: Alice', 'age: 30']
const value = decodeFromLines(lines)
// { name: 'Alice', age: 30 }
```

**从 Node.js readline 流式处理:**

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

**配合路径展开:**

```ts
const lines = ['user.name: Alice', 'user.age: 30']
const value = decodeFromLines(lines, { expandPaths: 'safe' })
// { user: { name: 'Alice', age: 30 } }
```

### 选择合适的解码器

| 函数 | 输入 | 输出 | 异步 | 路径展开 | 适用场景 |
|----------|-------|--------|-------|----------------|----------|
| `decode()` | 字符串 | 值 | 否 | 支持 | 你拥有完整的 TOON 字符串 |
| `decodeFromLines()` | 行 | 值 | 否 | 支持 | 你拥有行数据,并希望得到完整的值 |
| `decodeStreamSync()` | 行 | 事件 | 否 | 不支持 | 你需要逐事件处理(同步) |
| `decodeStream()` | 行 | 事件 | 是 | 不支持 | 你需要逐事件处理(异步) |

::: info 关键区别

* **值 vs 事件**:以 `Stream` 结尾的函数会产出事件,而不会在内存中构建完整的值。
* **路径展开**:只有 `decode()` 和 `decodeFromLines()` 支持 `expandPaths: 'safe'`。
* **异步支持**:只有 `decodeStream()` 接受异步可迭代对象(适用于文件/网络流)。
  :::

## 流式解码器

### `decodeStreamSync(lines, options?)`

将 TOON 各行同步解码为一系列 JSON 事件流。该函数会产出表示 JSON 数据模型的结构化事件,而不会构建完整的值树。

适用于流式处理、自定义转换,或在无需将完整值保留在内存中时对大型数据集进行内存高效的解析。

::: tip 事件流
这是一个返回单个解析事件的底层 API。对于大多数使用场景,[`decodeFromLines()`](#decodefromlines-lines-options) 或 [`decode()`](#decode-input-options) 会更方便。

流式模式下**不支持**路径展开(`expandPaths: 'safe'`),因为它需要完整的值树。
:::

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `lines` | `Iterable<string>` | TOON 各行组成的可迭代对象(不含结尾换行符) |
| `options` | `DecodeStreamOptions?` | 可选的流式解码配置(参见 [配置参考](#configuration-reference)) |

#### 返回值

返回一个 `Iterable<JsonStreamEvent>`,产出结构化事件(事件结构参见 [TypeScript 类型](#typescript-types))。

#### 示例

**基本的事件流:**

```ts
import { decodeStreamSync } from '@toon-format/toon'

const lines = ['name: Alice', 'age: 30']

for (const event of decodeStreamSync(lines)) {
  console.log(event)
}

// 输出:
// { type: 'startObject' }
// { type: 'key', key: 'name' }
// { type: 'primitive', value: 'Alice' }
// { type: 'key', key: 'age' }
// { type: 'primitive', value: 30 }
// { type: 'endObject' }
```

**自定义处理:**

```ts
import { decodeStreamSync } from '@toon-format/toon'

const lines = ['users[2]{id,name}:', '  1,Alice', '  2,Bob']
let userCount = 0

for (const event of decodeStreamSync(lines)) {
  if (event.type === 'endObject' && userCount < 2) {
    userCount++
    console.log(`已处理用户 ${userCount}`)
  }
}
```

### `decodeStream(source, options?)`

将 TOON 各行异步解码为一系列 JSON 事件流。这是 [`decodeStreamSync()`](#decodestreamsync-lines-options) 的异步版本,同时支持同步和异步可迭代对象。

适用于处理文件流、网络响应或其他异步数据源,让你能够在数据到达时增量地处理它。

#### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `source` | `AsyncIterable<string>` | `Iterable<string>` | TOON 各行组成的异步或同步可迭代对象(不含结尾换行符) |
| `options` | `DecodeStreamOptions?` | 可选的流式解码配置(参见 [配置参考](#configuration-reference)) |

#### 返回值

返回一个 `AsyncIterable<JsonStreamEvent>`,异步产出结构化事件(事件结构参见 [TypeScript 类型](#typescript-types))。

#### 示例

**从文件流式处理:**

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

当输入无法解析时,解码会抛出 `ToonDecodeError`。该类继承自 `SyntaxError`,因此已有的 `error instanceof SyntaxError` 检查无需修改代码即可继续正常工作。

### `ToonDecodeError`

```ts
import { ToonDecodeError } from '@toon-format/toon'
```

#### 字段

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| `name` | `'ToonDecodeError'` | 判别标记——`error.name === 'ToonDecodeError'` |
| `message` | `string` | 人类可读的消息;当已知行号时会带有 `Line N: ` 前缀 |
| `line` | `number?` | 检测到错误所在行的行号(从 1 开始) |
| `source` | `string?` | 原始源代码行(包含其前导空白字符) |
| `cause` | `unknown?` | 当解码器对底层解析器的失败进行了增强处理时,指向原始错误 |

只要某个错误具有行上下文——也就是正常解码过程中的几乎每一个解析错误——`line` 和 `source` 字段都会被填充。`cause` 链会指回 token 级解析器所抛出的底层 `SyntaxError` 或 `TypeError`,因此调试器和详细日志记录器可以展示出原始的调用帧。

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

::: info 向后兼容性
`ToonDecodeError` 继承自 `SyntaxError`。针对早期版本编写、捕获 `SyntaxError` 的代码仍然能够匹配这些错误。该类只是添加了结构化字段,并未移除任何内容。
:::

## 配置参考

### `EncodeOptions`

[`encode()`](#encode-input-options) 和 [`encodeLines()`](#encodelines-input-options) 的配置:

| 选项 | 类型 | 默认值 | 说明 |
|--------|------|---------|-------------|
| `indent` | `number` | `2` | 每个缩进层级的空格数 |
| `delimiter` | `','` | `'\t'` | `'\|'` | `','` | 数组值和表格行使用的分隔符 |
| `keyFolding` | `'off'` | `'safe'` | `'off'` | 启用键折叠,将单键包装链折叠为带点号的路径 |
| `flattenDepth` | `number` | `Infinity` | 启用 `keyFolding` 时最多折叠的片段数(值为 0-1 时没有实际效果) |
| `replacer` | `EncodeReplacer` | `undefined` | 编码前用于转换或省略值的可选钩子(参见 [替换函数](#replacer-function)) |

**分隔符选项:**

::: code-group

```ts [逗号(默认)]
encode(data, { delimiter: ',' })
```

```ts [制表符]
encode(data, { delimiter: '\t' })
```

```ts [竖线]
encode(data, { delimiter: '|' })
```

:::

关于如何选择分隔符,请参阅 [分隔符策略](#delimiter-strategies)。

### `DecodeOptions`

[`decode()`](#decode-input-options) 和 [`decodeFromLines()`](#decodefromlines-lines-options) 的配置:

| 选项 | 类型 | 默认值 | 说明 |
|--------|------|---------|-------------|
| `indent` | `number` | `2` | 每个缩进层级期望的空格数 |
| `strict` | `boolean` | `true` | 启用严格校验(数组数量、缩进、分隔符一致性) |
| `expandPaths` | `'off'` | `'safe'` | `'off'` | 启用路径展开,将带点号的键还原为嵌套对象(与 `keyFolding: 'safe'` 搭配使用) |

默认情况下(`strict: true`),解码器会严格校验输入:

* **非法转义序列**:遇到 `\x`、未终止的字符串、单独出现的代理项 `\uXXXX` 时抛出错误
* **语法错误**:遇到缺少冒号、格式错误的头部时抛出错误
* **数组长度不匹配**:当声明的长度与实际数量不一致时抛出错误
* **头部分隔符不匹配**:当方括号中声明的分隔符与字段列表中使用的分隔符不一致时抛出错误(§14.2)
* **缩进错误**:当前导空格数不是 `indent` 的整数倍时抛出错误
* **头部结构**:遇到带前导零或非整数的数组长度,以及方括号/字段/冒号之间存在插入内容时抛出错误
* **重复的同级键**:当一个对象存在两个键相同的子项时抛出错误(§14.4)
* **路径展开冲突**:当设置了 `expandPaths: 'safe'` 时,遇到会发生冲突的重叠点号路径时抛出错误

所有解码错误都以 [`ToonDecodeError`](#error-handling) 实例的形式抛出,并带有结构化的 `line` 和 `source` 字段。

将 `strict` 设为 `false` 可跳过这些检查。此时重复的同级键和路径展开冲突会按照文档顺序、以最后写入的值为准来解决。

关于路径展开行为和冲突解决的更多细节,请参阅 [键折叠与路径展开](#key-folding-path-expansion)。

### `DecodeStreamOptions`

[`decodeStreamSync()`](#decodestreamsync-lines-options) 和 [`decodeStream()`](#decodestream-source-options) 的配置:

| 选项 | 类型 | 默认值 | 说明 |
|--------|------|---------|-------------|
| `indent` | `number` | `2` | 每个缩进层级期望的空格数 |
| `strict` | `boolean` | `true` | 启用严格校验(数组数量、缩进、分隔符一致性) |

::: warning 不支持路径展开
路径展开需要构建完整的值树,这与事件流处理不兼容。如果你需要路径展开,请使用 [`decodeFromLines()`](#decodefromlines-lines-options)。
:::

## TypeScript 类型

### `JsonStreamEvent`

由 [`decodeStreamSync()`](#decodestreamsync-lines-options) 和 [`decodeStream()`](#decodestream-source-options) 发出的事件:

```ts
type JsonStreamEvent
  = | { type: 'startObject' }
    | { type: 'endObject' }
    | { type: 'startArray', length: number }
    | { type: 'endArray' }
    | { type: 'key', key: string, wasQuoted?: boolean }
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
| `DELIMITERS` | 将分隔符名称映射到对应字符的冻结记录 |
| `Delimiter` | 合法分隔符字符的联合类型:`',' \| '\t' \| '\|'` |
| `DelimiterKey` | 分隔符名称的联合类型:`'comma' \| 'tab' \| 'pipe'` |

### 选项类型

| 导出 | 说明 |
|--------|-------------|
| `EncodeOptions` | [`encode()`](#encode-input-options) 和 [`encodeLines()`](#encodelines-input-options) 接受的选项 |
| `DecodeOptions` | [`decode()`](#decode-input-options) 和 [`decodeFromLines()`](#decodefromlines-lines-options) 接受的选项 |
| `DecodeStreamOptions` | [`decodeStreamSync()`](#decodestreamsync-lines-options) 和 [`decodeStream()`](#decodestream-source-options) 接受的选项 |
| `EncodeReplacer` | [替换函数](#replacer-function) 的签名 |
| `ResolvedEncodeOptions` | 应用默认值后的 `EncodeOptions`(高级用法) |
| `ResolvedDecodeOptions` | 应用默认值后的 `DecodeOptions`(高级用法) |

## 指南与示例

### 往返兼容性

TOON 在归一化处理后提供无损的往返转换:

```ts
import { decode, encode } from '@toon-format/toon'

const original = {
  users: [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' }
  ]
}

const toon = encode(original)
const restored = decode(toon)

console.log(JSON.stringify(original) === JSON.stringify(restored))
// true
```

**配合键折叠:**

```ts
import { decode, encode } from '@toon-format/toon'

const original = { data: { metadata: { items: ['a', 'b'] } } }

// 使用折叠进行编码
const toon = encode(original, { keyFolding: 'safe' })
// → "data.metadata.items[2]: a,b"

// 使用展开进行解码
const restored = decode(toon, { expandPaths: 'safe' })
// → { data: { metadata: { items: ['a', 'b'] } } }

console.log(JSON.stringify(original) === JSON.stringify(restored))
// true
```

### 键折叠与路径展开

**键折叠**(`keyFolding: 'safe'`)会在编码期间折叠单键包装链:

```ts
import { encode } from '@toon-format/toon'

const data = { data: { metadata: { items: ['a', 'b'] } } }

// 未使用折叠
encode(data)
// data:
//   metadata:
//     items[2]: a,b

// 使用折叠
encode(data, { keyFolding: 'safe' })
// data.metadata.items[2]: a,b
```

**路径展开**(`expandPaths: 'safe'`)会在解码时反向执行该过程:

```ts
import { decode } from '@toon-format/toon'

const toon = 'data.metadata.items[2]: a,b'

const data = decode(toon, { expandPaths: 'safe' })
console.log(data)
// { data: { metadata: { items: ['a', 'b'] } } }
```

**展开冲突的解决方式:**

当多个展开后的键构造出重叠的路径时,解码器会递归地合并它们:

* **对象 + 对象**:递归深度合并
* **对象 + 非对象**(数组或基本类型):产生冲突
  * 使用 `strict: true`(默认)时:抛出错误
  * 使用 `strict: false` 时:以最后写入的值为准(LWW)

重复的同级键(与 `expandPaths` 无关)遵循相同的策略:严格模式下抛出错误,宽松模式下保留最后看到的值。

### 分隔符策略

制表符分隔(`\t`)通常比逗号更高效地进行 token 化。制表符是单个字符,很少出现在自然文本中,这减少了对引号转义的需求,并在大型数据集中带来更小的 token 数量。

示例:

```yaml
items[2	]{sku	name	qty	price}:
  A1	Widget	2	9.99
  B2	Gadget	1	14.5
```

若要在大型表格数据上获得最大程度的 token 节省,可以将制表符分隔与键折叠结合使用:

```ts
encode(data, { delimiter: '\t', keyFolding: 'safe' })
```

**如何选择分隔符:**

* **逗号(`,`)**:默认选项,广泛易懂,适合简单的表格数据。
* **制表符(`\t`)**:对 LLM token 效率最有利,非常适合大型数据集。
* **竖线(`|`)**:当数据中经常出现逗号时的替代选择。
