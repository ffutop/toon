---
description: 跨结构类型对比 TOON 与 JSON 字节级开销的数学模型，附带公式与实例推导。
---

# TOON 与 JSON 对比：字节级效率模型

针对不同数据结构，对 TOON 与 JSON 的字节效率进行的数学分析。

::: info 本文档的范围
本页展示的是 TOON 与 JSON 之间基于理论、字符层面的对比。关于实际的基准测试和 token 计数，请参阅 [性能基准](/guide/benchmarks)。这是一份**高级的、非规范性**参考资料：它从数学角度解释了 TOON 的设计原理，但并不会改变 TOON 规范本身。
:::

## 概述

标准 JSON 引入了结构性冗余，从而增加了 token 用量和推理成本。本页对 TOON 与 JSON 进行字节级形式化对比，以评估 TOON 是否通过消除结构冗余实现了可量化的效率提升。

在下文所述的假设条件下（紧凑 JSON、规范 TOON、ASCII 键与标点符号、浅到中等程度的嵌套，以及大多数不加引号的 TOON 字符串），对于本文分析的结构类型，除了“数组的数组”之外，**TOON 的结构性开销都低于紧凑 JSON**。

### 关键发现

- **表格化数组** 是 TOON 的最佳使用场景，其效率提升随行数和字段数的增加而线性增长。
- **简单对象和基本类型数组** 显示出稳定的字节数削减，节省量与字段数或元素数成正比。
- **嵌套对象** 能从降低的开销中受益，但由于缩进成本，效率会随深度增加而下降；在足够深的嵌套下，紧凑 JSON 可能变得更小。
- **数组的数组** 是本分析中唯一 TOON 效率低于 JSON 的结构，这是由于 TOON 显式的列表标记和内部数组头部所致。

## 方法论

我们为两种格式分别定义了递归的字节长度函数 $L_{\text{json}}$ 和 $L_{\text{toon}}$，然后推导出效率差值：

$$
\Delta = L_{\text{json}}(\Omega) - L_{\text{toon}}(\Omega)
$$

其中 $\Omega$ 表示被比较的数据结构。若 $\Delta > 0$，则表示 TOON 在该结构上使用的字节数少于 JSON。

::: info 范围与假设
- **紧凑 JSON**：假定 JSON 是紧凑的（字符串之外没有空格或换行符）。字节数按此紧凑形式计算。
- **规范 TOON**：假定 TOON 遵循规范格式（缩进 = 2 空格，`:` 后恰好一个空格，数组/字段列表中逗号后无空格，无尾随空格）。
- **键与字符串**：所有键均为“简单的” ASCII 标识符风格键，它们：
  - 在 JSON 中必须加引号，并且
  - 在 TOON 中可以不加引号（不含任何会强制要求加引号的字符）。
  许多示例假定值为数字、布尔值、null，或是可以在 TOON 中不加引号、但在 JSON 中必须加引号的 TOON 安全字符串。
- **数字**：仅在本分析中，假定两种格式使用相同的规范十进制表示。JSON 可以使用指数记法，但为了单独分析结构性差异，此处忽略这一点。
- **ASCII/UTF-8**：假定键和结构性 token 均为 ASCII，因此字节长度等于字符数($|x|_{\text{utf8}} = |x|_{\text{char}}$)。非 ASCII 内容对两种格式的影响类似，不会改变结构性结论。
- **嵌套深度**：针对扁平结构和单层嵌套给出了封闭形式的表达式。TOON 中每增加一层嵌套，每个嵌套行就会增加 2 字节的缩进。在足够深的嵌套下，紧凑 JSON 的大括号可能比 TOON 的缩进更有优势（参见 [何时不使用 TOON](/guide/getting-started#when-not-to-use-toon)）。
- **字节数 vs token 数**：现代 LLM 分词器基于 UTF-8 字节运作，因此字节长度是 token 数的一个良好上界和一阶近似，尽管这种映射关系并非严格线性。
:::

可以将其理解为一个简化的结构模型：我们剥离了现实世界中的各种噪声，只问一个问题——“如果只计算结构性字符，JSON 和 TOON 相比如何？”

## 形式化记号

### 数据模型

设 $\omega$ 为一个基本类型值，满足 $\omega \in \{\text{string, number, boolean, null}\}$。

设 $\mathcal{O}$ 为一个由 $n$ 个键值对组成的对象：

$$
\mathcal{O} = \{(k_1, v_1), (k_2, v_2), \dots, (k_n, v_n)\}
$$

设 $\mathcal{A}$ 为一个由 $n$ 个元素组成的数组：

$$
\mathcal{A} = \{v_1, v_2, \dots, v_n\}
$$

其中：
- $k_i$ 是一个键（字符串）
- $v_i$ 可以是一个基本类型值 $\omega$、一个对象 $\mathcal{O}$，或一个数组 $\mathcal{A}$

因此：$v_i \in \{\omega, \mathcal{O}, \mathcal{A}\}$

### 字符串长度

设 $\mathcal{S}$ 为合法 Unicode 字符串的集合。对于任意字符串 $x \in \mathcal{S}$，我们用 $|x|_{\text{utf8}}$ 表示 $x$ 在 UTF-8 编码下的字节长度。

### 整数长度

设 $n \in \mathbb{Z}_{\ge 0}$ 为一个非负整数。以十进制表示 $n$ 所需的字节数为：

$$
L_{\text{num}}(n) = \begin{cases}
1 & \text{if } n = 0 \\
\lfloor \log_{10}(|n|) \rfloor + 1 & \text{if } n > 0
\end{cases}
$$

## JSON 大小函数

对于一个具有 $n$ 个键的扁平对象：

$$
L_{\text{json}}(\mathcal{O}) = \underbrace{2}_{\{\}} + \sum_{i=1}^{n} (L_{\text{str}}(k_i) + \underbrace{1}_{:} + L_{\text{json}}(v_i)) + \underbrace{(n-1)}_{\text{commas}}
$$

其中 $L_{\text{str}}(k)$ 是键的长度，包含其强制性的引号：

$$
L_{\text{str}}(k) = |k|_{\text{utf8}} + \underbrace{2}_{\text{quotes}}
$$

### JSON 中的基本类型值

当 $v_i$ 是基本数据类型 $\omega$ 时：

| 类型 | 公式 |
|------|---------|
| 字符串 | $L_{\text{str}}(v_i) = \lvert v_i\rvert_{\text{utf8}} + 2$ |
| 数字 | $L_{\text{num}}(v_i) = \lvert v_i\rvert_{\text{utf8}}$ |
| 布尔值 | $L_{\text{bool}}(v_i) = \lvert v_i\rvert_{\text{utf8}}$ |
| Null | $L_{\text{null}}(v_i) = \lvert v_i\rvert_{\text{utf8}}$ |

### JSON 中的数组

当 $v_i$ 是数组 $\mathcal{A}$ 时：

$$
L_{\text{json}}(\mathcal{A}) = \underbrace{2}_{\text{[]}} + \sum_{i=1}^{n} L_{\text{json}}(v_i) + \underbrace{(n-1)}_{\text{commas}}
$$

## TOON 大小函数

对于一个具有 $n$ 个键的扁平对象：

$$
L_{\text{toon}}(\mathcal{O}) = \sum_{i=1}^{n} (L_{\text{str}}(k_i) + \underbrace{1}_{:} + \underbrace{1}_{\text{space}} + L_{\text{toon}}(v_i)) + \underbrace{(n-1)}_{\text{newlines}}
$$

其中 $L_{\text{str}}(k)$ 是键的长度（简单键不需要引号）：

$$
L_{\text{str}}(k) = |k|_{\text{utf8}}
$$

### TOON 中的基本类型值

当 $v_i$ 是基本数据类型 $\omega$ 时：

| 类型 | 公式 |
|------|---------|
| 字符串（普通） | $L_{\text{str}}(v_i) = \lvert v_i\rvert_{\text{utf8}}$ |
| 字符串（看起来像数字/布尔值） | $L_{\text{str}}(v_i) = \lvert v_i\rvert_{\text{utf8}} + 2$ |
| 数字 | $L_{\text{num}}(v_i) = \lvert v_i\rvert_{\text{utf8}}$ |
| 布尔值 | $L_{\text{bool}}(v_i) = \lvert v_i\rvert_{\text{utf8}}$ |
| Null | $L_{\text{null}}(v_i) = \lvert v_i\rvert_{\text{utf8}}$ |

### TOON 中的简单数组

此处 $L_{\text{toon}}(\mathcal{A})$ 指的是整个字段行 `key[N]: ...` 的长度，而不仅仅是数组值本身。

当 $v_i$ 是简单数组 $\mathcal{A}$ 时：

$$
L_{\text{toon}}(\mathcal{A}) = L_{\text{str}}(k_i) + \underbrace{1}_{\text{[}} + L_{\text{num}}(n) + \underbrace{1}_{\text{]}} + \underbrace{1}_{:} + \underbrace{1}_{\text{space}} + \sum_{i=1}^{n} L_{\text{toon}}(v_i) + \underbrace{(n-1)}_{\text{commas}}
$$

### TOON 中的表格化数组

当 $v_i$ 是具有 $m$ 个字段的对象数组时：

$$
\begin{split}
L_{\text{toon}}(\mathcal{A}') = L_{\text{str}}(k_i) + \underbrace{1}_{\text{[}} + L_{\text{num}}(n) + \underbrace{1}_{\text{]}} + \underbrace{1}_{\{} + \\
\sum_{i=1}^{m} L_{\text{str}}(k_i) + \underbrace{(m-1)}_{\text{commas}} + \underbrace{1}_{\}} + \underbrace{1}_{:} + \\
\underbrace{2n}_{\text{indents}} + \sum_{i=1}^{n}\sum_{j=1}^{m} L_{\text{toon}}(v_{ij}) + \underbrace{(m-1)n}_{\text{commas}} + \underbrace{n}_{\text{newlines}}
\end{split}
$$

*说明：项 $2n$ 假定缩进大小为 2 空格。*

## 按结构类型的效率分析

以下每个小节都关注一种特定的结构类型，给出对应的公式，并展示一个小示例。直观来说，TOON 在以下情况下往往占优：

- 避免重复键名（表格化数组），
- 避免为键和大多数值加引号，
- 以及用缩进代替大括号，

而在需要为每个元素支付固定开销（数组的数组）或深度缩进（高度嵌套的配置）时往往落于下风。

### 简单对象

带有基本类型字符串值的扁平对象是最容易取胜的场景：JSON 要为大括号、带引号的键和字符串付出代价，而 TOON 在根级别去掉了大括号，省略了简单键的引号，并且每个字段一行。

对于仅含字符串基本类型值的对象：

$$
\Delta_{\text{obj}} = 2 + n + \sum_{i=1}^{n}(L_{\text{json}}(v_i)) - \sum_{i=1}^{n}(L_{\text{toon}}(v_i))
$$

如果所有值都是在 TOON 中可以不加引号的字符串，可简化为：

$$
f(n) = 2 + 3n
$$

**示例：** 对于 1,000,000 个对象，TOON 节省 **3,000,002 字节 ≈ 2.86 MB**。

#### 实证验证

::: code-group

```json [JSON(21 字节)]
{ "id": 1, "name": "Ada" }
```

```yaml [TOON(15 字节)]
id: 1
name: Ada
```

:::

$$
\Delta_{\text{obj}} = 2 + \underbrace{2}_{n} + \underbrace{6}_{\sum L_{\text{json}}(v_i)} - \underbrace{4}_{\sum L_{\text{toon}}(v_i)} = 6
$$

### 嵌套对象

添加一个包装对象（多一层嵌套）会为 JSON 引入额外的大括号，并为 TOON 引入额外的缩进和换行符。对于带有基本类型值的单层嵌套，TOON 仍然占优，但净优势会更小。

对于带有基本类型值的单层嵌套：

$$
f(n) = 5 + n
$$

**示例：** 对于 1,000,000 个嵌套对象（深度为 1），TOON 节省 **1,000,005 字节 ≈ 0.95 MB**。

::: warning 注意事项
该公式仅适用于单层嵌套。TOON 中每多一层嵌套，每个嵌套行就会增加 2 个空格的缩进；在足够深的嵌套下，紧凑 JSON 可能变得更小，尤其是当表格化的可能性消失时（参见 [何时不使用 TOON](/guide/getting-started#when-not-to-use-toon) 以及 [性能基准](/guide/benchmarks) 中的“深度嵌套配置”数据集）。
:::

#### 实证验证

::: code-group

```json [JSON(30 字节)]
{ "user": { "id": 1, "name": "Ada" } }
```

```yaml [TOON(25 字节)]
user:
  id: 1
  name: Ada
```

:::

$$
\Delta_{\text{nested}} = 5
$$

### 基本类型数组

对于字符串基本类型数组，JSON 写作 `["foo","bar","baz"]`，为每个字符串加引号，并使用 `[]` 表示数组。TOON 写作 `key[N]: foo,bar,baz`，只为长度标记付出一次代价，而省略了大部分引号。

对于由 $n$ 个字符串基本类型组成的数组：

$$
\Delta_{\text{arr}} = 3 - L_{\text{num}}(n) + \sum_{i=1}^{n}(L_{\text{json}}(v_i)) - \sum_{i=1}^{n}(L_{\text{toon}}(v_i))
$$

如果字符串值在 TOON 中可以不加引号，可简化为：

$$
f(n) = 2 + 2n - \lfloor \log_{10}(|n|) \rfloor
$$

**示例：** 对于 1,000,000 个元素，TOON 节省 **1,999,996 字节 ≈ 1.91 MB**。

#### 实证验证

::: code-group

```json [JSON(28 字节)]
{ "tags": ["foo", "bar", "baz"] }
```

```yaml [TOON(20 字节)]
tags[3]: foo,bar,baz
```

:::

$$
\Delta_{\text{arr}} = 3 - \underbrace{1}_{L_{\text{num}}(3)} + \underbrace{15}_{\sum L_{\text{json}}} - \underbrace{9}_{\sum L_{\text{toon}}} = 8
$$

### 根数组

在根级别，JSON 写作 `["x","y","z"]`;TOON 写作 `[3]: x,y,z`。这里没有对象键的开销，因此优势主要来自不为 TOON 安全字符串加引号，以及用 `[N]:` 代替 `[]`。

对于由 $n$ 个字符串基本类型组成的根级别数组：

$$
f(n) = -3 + 2n - \lfloor \log_{10}(|n|) \rfloor
$$

**示例：** 对于 1,000,000 个元素，TOON 节省 **1,999,991 字节 ≈ 1.91 MB**。

#### 实证验证

::: code-group

```json [JSON(13 字节)]
["x", "y", "z"]
```

```yaml [TOON(10 字节)]
[3]: x,y,z
```

:::

$$
\Delta_{\text{root}} = \underbrace{9}_{\sum L_{\text{json}}} - 2 - \underbrace{1}_{L_{\text{num}}(3)} - \underbrace{3}_{\sum L_{\text{toon}}} = 3
$$

### 表格化数组

结构一致的对象数组是 TOON 的最佳应用场景。JSON 为每一行重复每个键，而 TOON 只声明一次长度和列名(`key[N]{id,qty,...}:`)，然后以裸值的形式流式呈现各行。

对于具有 $n$ 行、$m$ 个字段的对象数组，假定为数字值且 $|k| = 3$:

$$
f(n) = 1 + nm(3 + |k|) - m(1 + |k|) - \lfloor \log_{10}(|n|) \rfloor
$$

**示例：** 对于 1,000,000 行、2 个字段、字段名长度为 3 个字符的情况，TOON 节省 **11,999,987 字节 ≈ 11.44 MB**。

正是在这里，TOON 的设计（只声明一次字段，流式呈现各行）带来了最强的收益：节省量随行数和字段数二者线性增长。

#### 实证验证

::: code-group

```json [JSON(45 字节)]
{ "items": [{ "id": 1, "qty": 5 }, { "id": 2, "qty": 3 }] }
```

```yaml [TOON(29 字节)]
items[2]{id,qty}:
  1,5
  2,3
```

:::

$$
\Delta_{\text{tab}} = 2 + \underbrace{4}_{nm} - \underbrace{2}_{m} + \underbrace{22}_{\Sigma L_{\text{json}}} - \underbrace{1}_{L_{\text{num}}(n)} - \underbrace{5}_{\Sigma L_{\text{toon}}(k)} - \underbrace{4}_{\Sigma L_{\text{toon}}(v)} = 16
$$

### 数组的数组

基本类型数组组成的数组，是 TOON 在结构上落于下风的场景：每个内部数组都变成了一个带有自身头部的列表项，因此 TOON 要为每个内部数组支付固定开销(`"- "` 加上 `"[m]: "`)，而 JSON 只需使用逗号。

::: info 实践提示
对于基本类型数组组成的数组，该模型预测 JSON 的字节效率比 TOON 更高，因为 TOON 每个内部数组要多付出约 6 字节（`"- "` 占 2 字节，`"[m]: "` 占 4 字节），再加上长度标记。
:::

对于具有 $n$ 个外层元素、$m$ 个内层元素的数组的数组：

$$
\begin{split}
\Delta_{\text{arrarr}} = 2 - 6n - \sum_{i=1}^{n}\sum_{j=1}^{m} L_{\text{num}}(m) + \\
\sum_{i=1}^{n}\sum_{j=1}^{m} L_{\text{json}}(v_{ij}) - \sum_{i=1}^{n}\sum_{j=1}^{m} L_{\text{toon}}(v_{ij})
\end{split}
$$

对于字符串基本类型且 $m = 2$:

$$
f(n) = 2 - 6n - \sum_{i=1}^{n}\sum_{j=1}^{m} (\lfloor \log_{10}(|m|) \rfloor + 1) + 2nm
$$

**示例：** 对于 1,000,000 个数组、$m = 2$ 的情况，在该模型下 TOON 相对于 JSON **浪费了 2,999,998 字节 ≈ 2.86 MB**。

#### 实证验证

::: code-group

```json [JSON(23 字节)]
{ "pairs": [[1, 2], [3, 4]] }
```

```yaml [TOON(35 字节)]
pairs[2]:
  - [2]: 1,2
  - [2]: 3,4
```

:::

$$
\Delta_{\text{arrarr}} = 2 - \underbrace{12}_{6n} - \underbrace{2}_{\sum L_{\text{num}}(m)} + \underbrace{4}_{\sum L_{\text{json}}} - \underbrace{4}_{\sum L_{\text{toon}}} = -12
$$

### 看起来像字面量的字符串

看起来像数字或布尔值的字符串（例如 `"123"`、`"true"`）在 JSON 和 TOON 中都必须加引号，这会略微削弱 TOON 的优势，因为它不再能在这些值上节省引号。

对于包含此类字符串的对象：

$$
\Delta_{\text{strlit}} = 2 + n
$$

**示例：** 对于 1,000,000 个对象，TOON 节省 **2,000,002 字节 ≈ 1.91 MB**。

#### 实证验证

::: code-group

```json [JSON(34 字节)]
{ "version": "123", "enabled": "true" }
```

```yaml [TOON(30 字节)]
version: "123"
enabled: "true"
```

:::

$$
\Delta_{\text{str}} = 2 + \underbrace{2}_{n} = 4
$$

### 空结构

即使是极小的规模，空容器也能揭示出结构性差异。

**空对象：**

$$
\Delta_{\text{EmptyObject}} = 2
$$

JSON 需要 `{}`（2 字节），而 TOON 中完全为空的根对象则表示为一个空文档（0 字节）。

**空数组（字段）：**

$$
\Delta_{\text{EmptyArray}} = 3
$$

对于名为 `key` 的字段，JSON 以紧凑形式使用 `{"key":[]}`，而 TOON 使用：

```yaml
key: []
```

在该模型下，这为 TOON 带来了恒定的 3 字节优势。出于向后兼容考虑，旧式的 `key[0]:` 形式仍可解码。

## 总结表

下表汇总了各公式以及在建模假设下哪一方占优。

| 结构 | 效率公式 | TOON 是否占优？ |
|-----------|-------------------|-----------------|
| 简单对象 | $f(n) = 2 + 3n$ | ✅ 是 |
| 嵌套对象（1 层） | $f(n) = 5 + n$ | ✅ 是（随深度增加而收窄） |
| 基本类型数组 | $f(n) = 2 + 2n - \lfloor \log_{10}(n) \rfloor$ | ✅ 是 |
| 根数组 | $f(n) = -3 + 2n - \lfloor \log_{10}(n) \rfloor$ | ✅ 是 |
| 表格化数组 | $f(n) = 1 + nm(3+\lvert k\rvert) - m(1+\lvert k\rvert) - \lfloor \log_{10}(n) \rfloor$ | ✅ **最佳场景** |
| 数组的数组 | $f(n) = 2 - 6n + 2nm - \text{overhead}$ | ❌ JSON 在此更优 |
| 字符串字面量 | $f(n) = 2 + n$ | ✅ 是（优势较小） |
| 空结构 | $\Delta = 2$ 或 $3$ | ✅ 是 |

简而言之：

- 对于扁平对象，TOON 的收益与字段数量成**线性关系**。
- 对于数组，收益随元素数量**线性增长**；对于表格化数组，收益随行数和字段数**双线性增长**。
- 数组的数组是 JSON 更小的主要结构性场景。
- 深度嵌套和大量引号会在实际数据中削弱甚至逆转这些优势。

## 结论

这个简化的理论模型支持了 TOON 的设计目标：从结构上看，在许多常见模式下，它通过以下方式降低了相对于紧凑 JSON 的开销：

- 避免在表格化数组中重复键名，
- 省略许多键和值的引号，
- 以及在较浅的深度下用缩进代替大括号。

对于本文所考察的结构类型，在所述假设条件下，除了数组的数组之外，TOON 的结构性开销都低于紧凑 JSON。由于 UTF-8 字节长度是 token 数的一个合理的一阶近似，这些结构性节省通常会转化为这些模式下更低的 token 数量。

与此同时，这是一个刻意简化的模型。在真实数据集中，其他因素——更深或不规则的嵌套、大量加引号的字符串、JSON 中的指数记法，以及分词器的特殊行为——可能会削弱甚至逆转这些收益。我们的 [性能基准](/guide/benchmarks) 和 [何时不使用 TOON](/guide/getting-started#when-not-to-use-toon) 表明，对于深度嵌套或表格化程度较低的数据，紧凑 JSON 可能更高效。请将本页作为理解 TOON *为何* 如此表现的直觉参考，而不是普遍适用的保证。

## 相关资源

- [性能基准](/guide/benchmarks) —— 跨格式的实证 token 数量与准确率对比
- [规范](/reference/spec) —— 正式的 TOON 规范

## 参考文献

本分析基于以下内容：

- **原始研究**：[TOON vs. JSON: A Mathematical Evaluation of Byte Efficiency in Structured Data](https://www.researchgate.net/publication/397903673_TOON_vs_JSON_A_Mathematical_Evaluation_of_Byte_Efficiency_in_Structured_Data)
- **TOON 规范**：[toon-format/spec](https://github.com/toon-format/spec)
- **JSON 规范**：[RFC 8259](https://datatracker.ietf.org/doc/html/rfc8259)、[ECMA-404](https://www.ecma-international.org/publications-and-standards/standards/ecma-404/)

---

本页由 Mateo Lafalce([@mateolafalce](https://github.com/mateolafalce))贡献。

*对该形式化分析有疑问，或发现了错误？欢迎在 [GitHub](https://github.com/toon-format/spec) 上提出 issue，或为本分析贡献改进内容。*
