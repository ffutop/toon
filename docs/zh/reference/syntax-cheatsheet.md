---
description: 快速了解 JSON 到 TOON 的映射关系，包括对象、数组、表格形式、引号和类型转换。
---

# 语法速查表

本页提供将 JSON 映射为 TOON 格式的语法速查表。若需要了解完整的语法规则和边界情况，请参阅 [规范](/zh/reference/spec)。

## 对象

::: code-group

```json [JSON]
{
  "id": 1,
  "name": "Ada"
}
```

```yaml [TOON]
id: 1
name: Ada
```

:::

## 嵌套对象

::: code-group

```json [JSON]
{
  "user": {
    "id": 1,
    "name": "Ada"
  }
}
```

```yaml [TOON]
user:
  id: 1
  name: Ada
```

:::

## 基本类型数组

::: code-group

```json [JSON]
{
  "tags": ["foo", "bar", "baz"]
}
```

```yaml [TOON]
tags[3]: foo,bar,baz
```

:::

## 表格化数组

::: code-group

```json [JSON]
{
  "items": [
    { "id": 1, "qty": 5 },
    { "id": 2, "qty": 3 }
  ]
}
```

```yaml [TOON]
items[2]{id,qty}:
  1,5
  2,3
```

:::

## 混合数组和非一致数组

::: code-group

```json [JSON]
{
  "items": [1, { "a": 1 }, "x"]
}
```

```yaml [TOON]
items[3]:
  - 1
  - a: 1
  - x
```

:::

> [!NOTE]
> 当列表项对象的第一个字段是表格化数组时，表格化首部会出现在连字符所在行。行数据相对于连字符多缩进两级，其他字段多缩进一级。这是该模式的规范编码方式。

::: code-group

```yaml [多字段对象]
items[1]:
  - users[2]{id,name}:
      1,Ada
      2,Bob
    status: active
```

```yaml [单字段对象]
items[1]:
  - users[2]{id,name}:
      1,Ada
      2,Bob
```

:::

## 数组的数组（列表形式）

::: code-group

```json [JSON]
{
  "pairs": [[1, 2], [3, 4]]
}
```

```yaml [TOON]
pairs[2]:
  - [2]: 1,2
  - [2]: 3,4
```

:::

## 根数组

::: code-group

```json [JSON]
["x", "y", "z"]
```

```yaml [TOON]
[3]: x,y,z
```

:::

## 空容器

::: code-group

```json [空对象]
{}
```

```yaml [空对象]
(空输出)
```

:::

::: code-group

```json [空数组]
{
  "items": []
}
```

```yaml [空数组]
items: []
```

:::

## 必须使用引号的特殊情况

### 看起来像字面量的字符串

::: code-group

```json [JSON]
{
  "version": "123",
  "enabled": "true"
}
```

```yaml [TOON]
version: "123"
enabled: "true"
```

:::

这些字符串必须加引号，因为它们看起来像数字/布尔值。

### 包含分隔符的字符串

::: code-group

```json [JSON]
{
  "note": "hello, world"
}
```

```yaml [TOON]
note: "hello, world"
```

:::

当字符串包含相关分隔符时，必须加引号：在数组作用域内为生效分隔符；在对象字段值中为文档级分隔符（默认为逗号）。

### 带开头/结尾空格的字符串

::: code-group

```json [JSON]
{
  "message": " padded "
}
```

```yaml [TOON]
message: " padded "
```

:::

### 空字符串

::: code-group

```json [JSON]
{
  "name": ""
}
```

```yaml [TOON]
name: ""
```

:::

## 引号规则汇总

在以下情况下，字符串**必须**加引号：

- 空字符串（`""`）
- 开头或结尾是空格字符
- 值等于 `true`、`false` 或 `null`（区分大小写）
- 看起来像数字（例如 `"42"`、`"-3.14"`、`"1e-6"`、`"05"`、`"+1"`）
- 包含特殊字符：`:`、`"`、`\`、`[`、`]`、`{`、`}`，或任何控制字符（U+0000–U+001F，包括换行符/制表符/回车符）
- 包含相关的分隔符（数组作用范围内为生效分隔符，其他情况下为文档级分隔符）
- 值等于 `"-"`，或以 `"-"` 开头且后面还有其他字符
- 值等于 `"#"`，或以 `"#"` 开头（该行会被视为注释）

除上述情况，字符串都可以不加引号。Unicode、emoji 以及内部（非开头/结尾）带空格的字符串都可以安全地不加引号：

```yaml
message: Hello 世界 👋
note: This has inner spaces
```

## 转义序列

带引号的字符串中允许使用六种转义字符：

| 字符 | 转义 |
|-----------|--------|
| 反斜杠（`\`） | `\\` |
| 双引号（`"`） | `\"` |
| 换行符(U+000A) | `\n` |
| 回车符(U+000D) | `\r` |
| 制表符(U+0009) | `\t` |
| 其他任意 U+0000–U+001F 控制字符 | `\uXXXX` |

其他转义方式（例如 `\x`、`\0`、`\b`）一律会被拒绝，未配对的 UTF-16 代理码位 `\uXXXX`（U+D800–U+DFFF）同样会被拒绝。

## 数组首部

### 基础首部

```
key[N]:
```

- `N` = 数组长度
- 默认分隔符：逗号

### 表格化首部

```
key[N]{field1,field2,field3}:
```

- `N` = 数组长度
- `{fields}` = 字段列表，每个叶子字段对应行中的一个单元格
- 默认分隔符：逗号

### 嵌套字段组

```
key[N]{id,customer{name,country},total}:
```

- `customer{…}` = 一列结构一致的子对象，折叠进首部
- 行数据保持扁平：单元格按字段列表的深度优先顺序排列

详情请参阅 [格式概览——嵌套字段组](/zh/guide/format-overview#嵌套字段组)。

### 备选分隔符

::: code-group

```yaml [制表符分隔]
items[2	]{id	name}:
  1	Ada
  2	Bob
```

```yaml [竖线分隔]
items[2|]{id|name}:
  1|Ada
  2|Bob
```

:::

分隔符符号会出现在方括号和花括号内。

## 带键的表格化对象

结构一致对象组成的对象会折叠为带键首部，每个条目对应一行：

```yaml
users[2:]{age,city}:
  alice: 30,Berlin
  bob: 25,Oslo
```

详情请参阅 [格式概览——带键的表格化对象](/zh/guide/format-overview#带键的表格化对象)。

## 注释

第一个非空格字符为 `#` 的行会在解码前被剥离：

```yaml
# 仅支持整行注释；编码器永远不会输出注释
host: example.com
```

## 类型转换

| 输入 | 输出 |
|-------|--------|
| 位于 `[1e-6, 1e21)` 区间内的有限数值，或零 | 规范的十进制形式 |
| 超出该范围的有限数字 | 允许使用指数记法 |
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
