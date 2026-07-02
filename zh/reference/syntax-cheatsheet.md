---
url: /zh/reference/syntax-cheatsheet.md
description: 一览 JSON 与 TOON 之间的映射关系——对象、数组、引号、键折叠和类型转换。
---

# 语法速查表

将 JSON 映射为 TOON 格式的快速参考。关于严谨的规范性语法规则和边界情况,请参阅 [规范](/reference/spec)。

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

## 混合与非一致数组

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

> \[!NOTE]
> 当一个列表项对象的第一个字段是表格化数组时,表格化头部会出现在连字符所在的那一行。行数据比连字符深两级缩进,其他字段深一级缩进。这是该模式的规范编码方式。

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

## 数组的数组

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

## 引号的特殊情况

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

这些字符串必须加引号,因为它们看起来像数字/布尔值。

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

当字符串包含生效分隔符(在数组作用范围内)或文档级分隔符(对象字段的值,默认为逗号)时,必须加引号。

### 带前导/尾随空格的字符串

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

在以下情况下,字符串**必须**加引号:

* 为空字符串(`""`)
* 存在前导或尾随空白
* 等于 `true`、`false` 或 `null`(区分大小写)
* 看起来像数字(例如 `"42"`、`"-3.14"`、`"1e-6"`、`"05"`)
* 包含特殊字符:`:`、`"`、`\`、`[`、`]`、`{`、`}`,或任何控制字符(U+0000–U+001F,包括换行符/制表符/回车符)
* 包含相关的分隔符——数组作用范围内的生效分隔符,或对象字段值的文档级分隔符(默认为逗号)
* 等于 `"-"`,或以 `"-"` 开头且后面还有其他字符

除此之外,字符串都可以不加引号。Unicode 和 emoji 是安全的:

```yaml
message: Hello 世界 👋
note: This has inner spaces
```

## 转义序列

在带引号的字符串中,有六种合法的转义序列:

| 字符 | 转义 |
|-----------|--------|
| 反斜杠(`\`) | `\\` |
| 双引号(`"`) | `\"` |
| 换行符 | `\n` |
| 回车符 | `\r` |
| 制表符 | `\t` |
| 其他任意 U+0000–U+001F 控制字符 | `\uXXXX` |

其他转义方式(例如 `\x`、`\0`、`\b`)是非法的,单独出现的代理项 `\uXXXX` 值(U+D800–U+DFFF)会被拒绝。

## 数组头部

### 基础头部

```
key[N]:
```

* `N` = 数组长度
* 默认分隔符:逗号

### 表格化头部

```
key[N]{field1,field2,field3}:
```

* `N` = 数组长度
* `{fields}` = 列名
* 默认分隔符:逗号

### 备选分隔符

::: code-group

```yaml [制表符分隔]
items[2	]{id	name}:
  1	Alice
  2	Bob
```

```yaml [竖线分隔]
items[2|]{id|name}:
  1|Alice
  2|Bob
```

:::

分隔符符号出现在方括号和花括号内部。

## 键折叠(可选)

标准嵌套:

```yaml
data:
  metadata:
    items[2]: a,b
```

启用键折叠后(`keyFolding: 'safe'`):

```yaml
data.metadata.items[2]: a,b
```

详情请参阅 [格式概览——键折叠](/guide/format-overview#key-folding-optional)。

## 类型转换

| 输入 | 输出 |
|-------|--------|
| 位于 `[1e-6, 1e21)` 范围内(或为零)的有限数字 | 规范的十进制形式 |
| 超出该范围的有限数字 | 允许使用指数记法 |
| `NaN`、`Infinity`、`-Infinity` | `null` |
| `BigInt`(安全范围内) | 数字 |
| `BigInt`(超出范围) | 带引号的十进制字符串 |
| `Date` | ISO 字符串(带引号) |
| `Set` | 归一化后的值组成的数组 |
| `Map` | 以 `String(key)` 为键的对象 |
| `undefined`、`function`、`symbol` | `null` |

::: info
TOON 本身并未规定 `Date` 应如何编码——规范将其留给具体实现决定。本库以带引号的 ISO 8601 字符串形式输出;其他实现可能会有不同的选择。
:::
