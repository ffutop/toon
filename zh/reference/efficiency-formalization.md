---
url: /zh/reference/efficiency-formalization.md
description: TOON 与 JSON 在不同结构类型下的字节级开销模型，包含公式和实例推导。
---

# TOON 与 JSON 对比：字节级效率模型

本文从数学角度分析不同数据结构下 TOON 相对于 JSON 的字节效率。

::: info 本文档的范围
本页从理论角度比较 TOON 与 JSON 的字符级开销。如需查看实际基准测试和 token 计数，请参阅 [性能基准](/zh/guide/benchmarks)。本文属于**进阶参考资料，不具有规范效力**。它从数学角度解释 TOON 的设计思路，但不改变 TOON 规范本身。
:::

## 概述

标准 JSON 会引入额外的结构性字符。这会增加 token 用量和推理成本。本页从字节级对 TOON 与 JSON 进行形式化比较，评估 TOON 能否通过减少结构性冗余获得可量化的效率提升。

本文的比较基于几个前提：JSON 采用紧凑形式，TOON 采用规范格式。键和标点均为 ASCII。嵌套深度较浅或中等。大多数字符串无需加引号。在这些前提下，除“数组的数组”外，TOON 在本文分析的各类数据结构中，结构性开销都低于紧凑 JSON。

### 关键发现

* **表格化数组** 是 TOON 最适合的场景。行数和字段数越多，效率提升越明显，并且呈线性增长。
* **简单对象和基本类型数组** 通常能稳定减少字节数，节省量与字段数或元素数成正比。
* **嵌套对象** 可受益于较低的结构性开销。但缩进也会带来额外成本。嵌套越深，TOON 的优势越小。嵌套足够深时，紧凑 JSON 反而可能比 TOON 更省字节。
* **数组的数组** 是本分析中唯一 TOON 效率低于 JSON 的结构。原因是 TOON 需要显式的列表标记和内部数组首部。

## 方法论

我们分别为 JSON 和 TOON 定义递归的字节长度函数：$L\_{\text{json}}$ 和 $L\_{\text{toon}}$。然后推导二者的字节差值：

$$
\Delta = L\_{\text{json}}(\Omega) - L\_{\text{toon}}(\Omega)
$$

其中 $\Omega$ 表示待比较的数据结构。若 $\Delta > 0$，则表示 TOON 在该结构上使用的字节数少于 JSON。

::: info 范围与假设

* **紧凑 JSON**：假定 JSON 是紧凑的（字符串之外没有空格或换行符）。字节数按此紧凑形式计算。
* **规范 TOON**：假定 TOON 遵循规范格式。缩进为 2 个空格，`:` 后恰好一个空格，数组和字段列表中逗号后无空格，也没有行尾空格。
* **键与字符串**：所有键都是“简单”的 ASCII 标识符风格键。也就是说，它们：

  * 在 JSON 中必须加引号，并且
  * 在 TOON 中可以不加引号（不含任何会强制要求加引号的字符）。

  许多示例假定值为数字、布尔值、null，或符合 TOON 非引号字符串规则、但在 JSON 中必须加引号的字符串。
* **数字**：仅在本分析中，假定两种格式使用相同的规范十进制表示。JSON 可以使用指数记法。但为单独分析结构性差异，本文忽略这一点。
* **ASCII/UTF-8**：假定键和结构性 token 均为 ASCII。因此，字节长度等于字符数（$|x|*{\text{utf8}} = |x|*{\text{char}}$）。非 ASCII 内容对两种格式的影响类似，不会改变结构性结论。
* **嵌套深度**：本文针对扁平结构和单层嵌套给出闭式表达式。TOON 中每增加一层嵌套，每个嵌套行就会增加 2 字节缩进。嵌套足够深时，紧凑 JSON 的大括号可能比 TOON 的缩进更省字节（参见 [何时不使用 TOON](/zh/guide/getting-started#何时不使用-toon)）。
* **字节数 vs token 数**：现代大语言模型分词器基于 UTF-8 字节工作。因此，字节长度可以作为 token 数的上界和一阶近似。不过，二者并不是严格线性映射。
  :::

可以把它理解为一个简化的结构模型。它先剥离真实数据中的各种干扰因素，只关注一个问题：“如果只计算结构性字符，JSON 和 TOON 相比如何？”

## 形式化记号

### 数据模型

设 $\omega$ 为一个基本类型值，满足 $\omega \in {\text{string, number, boolean, null}}$。

设 $\mathcal{O}$ 表示由 $n$ 个键值对组成的对象：

$$
\mathcal{O} = {(k\_1, v\_1), (k\_2, v\_2), \dots, (k\_n, v\_n)}
$$

设 $\mathcal{A}$ 表示由 $n$ 个元素组成的数组：

$$
\mathcal{A} = {v\_1, v\_2, \dots, v\_n}
$$

其中：

* $k\_i$ 是键（字符串）
* $v\_i$ 可以是基本类型值 $\omega$、对象 $\mathcal{O}$，或数组 $\mathcal{A}$

因此：$v\_i \in {\omega, \mathcal{O}, \mathcal{A}}$

### 字符串长度

设 $\mathcal{S}$ 为合法 Unicode 字符串的集合。对于任意字符串 $x \in \mathcal{S}$，我们用 $|x|\_{\text{utf8}}$ 表示 $x$ 在 UTF-8 编码下的字节长度。

### 整数长度

设 $n \in \mathbb{Z}\_{\ge 0}$ 为非负整数。以十进制表示 $n$ 所需的字节数为：

$$
L\_{\text{num}}(n) = \begin{cases}
1 & \text{if } n = 0 \\
\lfloor \log\_{10}(|n|) \rfloor + 1 & \text{if } n > 0
\end{cases}
$$

## JSON 字节长度函数

对于具有 $n$ 个键的扁平对象：

$$
L\_{\text{json}}(\mathcal{O}) = \underbrace{2}*{{}} + \sum*{i=1}^{n} (L\_{\text{str}}(k\_i) + \underbrace{1}*{:} + L*{\text{json}}(v\_i)) + \underbrace{(n-1)}\_{\text{逗号}}
$$

其中 $L\_{\text{str}}(k)$ 是键的长度，包含必需的引号：

$$
L\_{\text{str}}(k) = |k|*{\text{utf8}} + \underbrace{2}*{\text{引号}}
$$

### JSON 基本类型值

当 $v\_i$ 是基本数据类型 $\omega$ 时：

| 类型 | 公式 |
|------|---------|
| 字符串 | $L\_{\text{str}}(v\_i) = \lvert v\_i\rvert\_{\text{utf8}} + 2$ |
| 数字 | $L\_{\text{num}}(v\_i) = \lvert v\_i\rvert\_{\text{utf8}}$ |
| 布尔值 | $L\_{\text{bool}}(v\_i) = \lvert v\_i\rvert\_{\text{utf8}}$ |
| Null | $L\_{\text{null}}(v\_i) = \lvert v\_i\rvert\_{\text{utf8}}$ |

### JSON 数组

当 $v\_i$ 是数组 $\mathcal{A}$ 时：

$$
L\_{\text{json}}(\mathcal{A}) = \underbrace{2}*{\text{\[]}} + \sum*{i=1}^{n} L\_{\text{json}}(v\_i) + \underbrace{(n-1)}\_{\text{逗号}}
$$

## TOON 字节长度函数

对于具有 $n$ 个键的扁平对象：

$$
L\_{\text{toon}}(\mathcal{O}) = \sum\_{i=1}^{n} (L\_{\text{str}}(k\_i) + \underbrace{1}*{:} + \underbrace{1}*{\text{空格}} + L\_{\text{toon}}(v\_i)) + \underbrace{(n-1)}\_{\text{换行符}}
$$

其中 $L\_{\text{str}}(k)$ 是键的长度（简单键不需要引号）：

$$
L\_{\text{str}}(k) = |k|\_{\text{utf8}}
$$

### TOON 基本类型值

当 $v\_i$ 是基本数据类型 $\omega$ 时：

| 类型 | 公式 |
|------|---------|
| 字符串（普通） | $L\_{\text{str}}(v\_i) = \lvert v\_i\rvert\_{\text{utf8}}$ |
| 字符串（看起来像数字/布尔值） | $L\_{\text{str}}(v\_i) = \lvert v\_i\rvert\_{\text{utf8}} + 2$ |
| 数字 | $L\_{\text{num}}(v\_i) = \lvert v\_i\rvert\_{\text{utf8}}$ |
| 布尔值 | $L\_{\text{bool}}(v\_i) = \lvert v\_i\rvert\_{\text{utf8}}$ |
| Null | $L\_{\text{null}}(v\_i) = \lvert v\_i\rvert\_{\text{utf8}}$ |

### TOON 简单数组

此处 $L\_{\text{toon}}(\mathcal{A})$ 指整个字段行 `key[N]: ...` 的长度，而不只是数组值本身。

当 $v\_i$ 是简单数组 $\mathcal{A}$ 时：

$$
L\_{\text{toon}}(\mathcal{A}) = L\_{\text{str}}(k\_i) + \underbrace{1}*{\text{\[}} + L*{\text{num}}(n) + \underbrace{1}*{\text{]}} + \underbrace{1}*{:} + \underbrace{1}*{\text{空格}} + \sum*{i=1}^{n} L\_{\text{toon}}(v\_i) + \underbrace{(n-1)}\_{\text{逗号}}
$$

### TOON 表格化数组

当 $v\_i$ 是具有 $m$ 个字段的对象数组时：

$$
\begin{split}
L\_{\text{toon}}(\mathcal{A}') = L\_{\text{str}}(k\_i) + \underbrace{1}*{\text{\[}} + L*{\text{num}}(n) + \underbrace{1}*{\text{]}} + \underbrace{1}*{{} + \\
\sum\_{i=1}^{m} L\_{\text{str}}(k\_i) + \underbrace{(m-1)}*{\text{逗号}} + \underbrace{1}*{}} + \underbrace{1}*{:} + \\
\underbrace{2n}*{\text{缩进}} + \sum\_{i=1}^{n}\sum\_{j=1}^{m} L\_{\text{toon}}(v\_{ij}) + \underbrace{(m-1)n}*{\text{逗号}} + \underbrace{n}*{\text{换行符}}
\end{split}
$$

*说明：项 $2n$ 假定缩进大小为 2 空格。*

## 按结构类型的效率分析

以下各小节分别分析一类特定的数据结构。每一节都会给出相应公式，并附简短示例。直观来看，在以下情况下 TOON 通常更省字节：

* 避免重复键名（表格化数组），
* 避免为键和大多数值加引号，
* 以及用缩进代替大括号，

但在另一些情况下，TOON 会处于劣势。例如数组的数组需要让每个元素承担固定开销，高度嵌套的配置则会产生较深的缩进。

### 简单对象

带有字符串基本类型值的扁平对象，是 TOON 最占优的场景。JSON 需要大括号，键和字符串也都要加引号。TOON 在根级别不需要大括号，简单键也无需加引号，每个字段单独成行。

对于仅含字符串基本类型值的对象：

$$
\Delta\_{\text{obj}} = 2 + n + \sum\_{i=1}^{n}(L\_{\text{json}}(v\_i)) - \sum\_{i=1}^{n}(L\_{\text{toon}}(v\_i))
$$

如果所有值都是可在 TOON 中不加引号的字符串，可简化为：

$$
f(n) = 2 + 3n
$$

**示例：** 对于 1,000,000 个对象，TOON 节省 **3,000,002 字节 ≈ 2.86 MB**。

#### 示例验证

::: code-group

```json [JSON (21 字节)]
{ "id": 1, "name": "Ada" }
```

```yaml [TOON (15 字节)]
id: 1
name: Ada
```

:::

$$
\Delta\_{\text{obj}} = 2 + \underbrace{2}*{n} + \underbrace{6}*{\sum L\_{\text{json}}(v\_i)} - \underbrace{4}*{\sum L*{\text{toon}}(v\_i)} = 6
$$

### 嵌套对象

添加一个包装对象，相当于增加一层嵌套。JSON 会多出一组大括号，TOON 则会增加缩进和换行。对于带有基本类型值的单层嵌套，TOON 仍然占优，但净优势会变小。

对于带有基本类型值的单层嵌套：

$$
f(n) = 5 + n
$$

**示例：** 对于 1,000,000 个嵌套对象（深度为 1），TOON 节省 **1,000,005 字节 ≈ 0.95 MB**。

::: warning 注意事项
该公式仅适用于单层嵌套。TOON 中每增加一层嵌套，每个嵌套行都会增加 2 个空格的缩进。嵌套足够深时，紧凑 JSON 反而可能比 TOON 更省字节。数据无法整理为表格化结构时，这一点尤其明显（参见 [何时不使用 TOON](/zh/guide/getting-started#何时不使用-toon)，以及 [基准测试](/zh/guide/benchmarks) 中的“深度嵌套配置”数据集）。
:::

#### 示例验证

::: code-group

```json [JSON (30 字节)]
{ "user": { "id": 1, "name": "Ada" } }
```

```yaml [TOON (25 字节)]
user:
  id: 1
  name: Ada
```

:::

$$
\Delta\_{\text{nested}} = 5
$$

### 基本类型数组

对于字符串基本类型数组，JSON 写作 `["foo","bar","baz"]`。每个字符串都要加引号，数组本身用 `[]` 表示。TOON 写作 `key[N]: foo,bar,baz`。它只需承担一次长度标记的开销，并省略大部分引号。

对于由 $n$ 个字符串基本类型组成的数组：

$$
\Delta\_{\text{arr}} = 3 - L\_{\text{num}}(n) + \sum\_{i=1}^{n}(L\_{\text{json}}(v\_i)) - \sum\_{i=1}^{n}(L\_{\text{toon}}(v\_i))
$$

如果字符串值可在 TOON 中不加引号，可简化为：

$$
f(n) = 2 + 2n - \lfloor \log\_{10}(|n|) \rfloor
$$

**示例：** 对于 1,000,000 个元素，TOON 节省 **1,999,996 字节 ≈ 1.91 MB**。

#### 示例验证

::: code-group

```json [JSON (28 字节)]
{ "tags": ["foo", "bar", "baz"] }
```

```yaml [TOON (20 字节)]
tags[3]: foo,bar,baz
```

:::

$$
\Delta\_{\text{arr}} = 3 - \underbrace{1}*{L*{\text{num}}(3)} + \underbrace{15}*{\sum L*{\text{json}}} - \underbrace{9}*{\sum L*{\text{toon}}} = 8
$$

### 根数组

在根级别，JSON 写作 `["x","y","z"]`，TOON 写作 `[3]: x,y,z`。这里不存在对象键开销。TOON 的优势主要来自两点：安全字符串无需加引号，以及用 `[N]:` 代替 `[]`。

对于由 $n$ 个字符串基本类型组成的根数组：

$$
f(n) = -3 + 2n - \lfloor \log\_{10}(|n|) \rfloor
$$

**示例：** 对于 1,000,000 个元素，TOON 节省 **1,999,991 字节 ≈ 1.91 MB**。

#### 示例验证

::: code-group

```json [JSON (13 字节)]
["x", "y", "z"]
```

```yaml [TOON (10 字节)]
[3]: x,y,z
```

:::

$$
\Delta\_{\text{root}} = \underbrace{9}*{\sum L*{\text{json}}} - 2 - \underbrace{1}*{L*{\text{num}}(3)} - \underbrace{3}*{\sum L*{\text{toon}}} = 3
$$

### 表格化数组

结构一致的对象数组是 TOON 最适合的场景。JSON 会在每一行重复所有键名。TOON 只声明一次长度和字段列表（`key[N]{id,qty,...}:`），随后直接按行输出裸值。

对于具有 $n$ 行、$m$ 个字段的对象数组，假定字段值为数字且 $|k| = 3$：

$$
f(n) = 1 + nm(3 + |k|) - m(1 + |k|) - \lfloor \log\_{10}(|n|) \rfloor
$$

**示例：** 对于 1,000,000 行、2 个字段、字段名长度为 3 个字符的情况，TOON 节省 **11,999,987 字节 ≈ 11.44 MB**。

这正体现了 TOON 的设计优势：字段只声明一次，数据按行输出。因此，节省的字节数会随行数和字段数同步线性增长。

#### 示例验证

::: code-group

```json [JSON (45 字节)]
{ "items": [{ "id": 1, "qty": 5 }, { "id": 2, "qty": 3 }] }
```

```yaml [TOON (29 字节)]
items[2]{id,qty}:
  1,5
  2,3
```

:::

$$
\Delta\_{\text{tab}} = 2 + \underbrace{4}*{nm} - \underbrace{2}*{m} + \underbrace{22}*{\Sigma L*{\text{json}}} - \underbrace{1}*{L*{\text{num}}(n)} - \underbrace{5}*{\Sigma L*{\text{toon}}(k)} - \underbrace{4}*{\Sigma L*{\text{toon}}(v)} = 16
$$

### 数组的数组

由基本类型数组组成的数组，是 TOON 在结构上处于劣势的场景。每个内部数组都会变成一个带有独立首部的列表项。因此，TOON 的每个内部数组都要承担固定开销（`"- "` 加上 `"[m]: "`）。JSON 则只需使用逗号分隔。

::: info 实践提示
按本文的字节级模型估算，对于由基本类型数组组成的数组，JSON 比 TOON 更省字节。TOON 的每个内部数组除了长度标记本身的开销外，还会额外多出约 6 字节（`"- "` 占 2 字节，`"[m]: "` 占 4 字节）。
:::

对于具有 $n$ 个外层元素、$m$ 个内层元素的数组的数组：

$$
\begin{split}
\Delta\_{\text{arrarr}} = 2 - 6n - \sum\_{i=1}^{n}\sum\_{j=1}^{m} L\_{\text{num}}(m) + \\
\sum\_{i=1}^{n}\sum\_{j=1}^{m} L\_{\text{json}}(v\_{ij}) - \sum\_{i=1}^{n}\sum\_{j=1}^{m} L\_{\text{toon}}(v\_{ij})
\end{split}
$$

对于字符串基本类型且 $m = 2$：

$$
f(n) = 2 - 6n - \sum\_{i=1}^{n}\sum\_{j=1}^{m} (\lfloor \log\_{10}(|m|) \rfloor + 1) + 2nm
$$

**示例：** 对于 1,000,000 个数组且 $m = 2$ 的情况，在该模型下 TOON 相比 JSON **多占用 2,999,998 字节 ≈ 2.86 MB**。

#### 示例验证

::: code-group

```json [JSON (23 字节)]
{ "pairs": [[1, 2], [3, 4]] }
```

```yaml [TOON (35 字节)]
pairs[2]:
  - [2]: 1,2
  - [2]: 3,4
```

:::

$$
\Delta\_{\text{arrarr}} = 2 - \underbrace{12}*{6n} - \underbrace{2}*{\sum L\_{\text{num}}(m)} + \underbrace{4}*{\sum L*{\text{json}}} - \underbrace{4}*{\sum L*{\text{toon}}} = -12
$$

### 看起来像字面量的字符串

看起来像数字或布尔值的字符串（例如 `"123"`、`"true"`）在 JSON 和 TOON 中都必须加引号。这会略微削弱 TOON 的优势，因为这些值已经无法再省去引号。

对于包含此类字符串的对象：

$$
\Delta\_{\text{strlit}} = 2 + n
$$

**示例：** 对于 1,000,000 个对象，TOON 节省 **2,000,002 字节 ≈ 1.91 MB**。

#### 示例验证

::: code-group

```json [JSON (34 字节)]
{ "version": "123", "enabled": "true" }
```

```yaml [TOON (30 字节)]
version: "123"
enabled: "true"
```

:::

$$
\Delta\_{\text{str}} = 2 + \underbrace{2}\_{n} = 4
$$

### 空结构

即便规模极小，空容器也能体现结构性差异。

**空对象：**

$$
\Delta\_{\text{EmptyObject}} = 2
$$

JSON 需要 `{}`（2 字节），而 TOON 中完全为空的根对象可表示为空文档（0 字节）。

**空数组（字段）：**

$$
\Delta\_{\text{EmptyArray}} = 3
$$

对于名为 `key` 的字段，JSON 以紧凑形式使用 `{"key":[]}`，而 TOON 使用：

```yaml
key: []
```

在该模型下，TOON 固定少用 3 字节。出于向后兼容考虑，旧式 `key[0]:` 形式仍可解码。

## 汇总表

下表汇总了各类结构的效率公式，也列出了在本文建模假设下哪一方更有优势。

| 结构 | 效率公式 | TOON 是否占优？ |
|-----------|-------------------|-----------------|
| 简单对象 | $f(n) = 2 + 3n$ | ✅ 是 |
| 嵌套对象（1 层） | $f(n) = 5 + n$ | ✅ 是（随深度增加而收窄） |
| 基本类型数组 | $f(n) = 2 + 2n - \lfloor \log\_{10}(n) \rfloor$ | ✅ 是 |
| 根数组 | $f(n) = -3 + 2n - \lfloor \log\_{10}(n) \rfloor$ | ✅ 是 |
| 表格化数组 | $f(n) = 1 + nm(3+\lvert k\rvert) - m(1+\lvert k\rvert) - \lfloor \log\_{10}(n) \rfloor$ | ✅ **最佳场景** |
| 数组的数组 | $f(n) = 2 - 6n + 2nm - \text{overhead}$ | ❌ JSON 在此更优 |
| 形似字面量的字符串 | $f(n) = 2 + n$ | ✅ 是（优势较小） |
| 空结构 | $\Delta = 2$ 或 $3$ | ✅ 是 |

简而言之：

* 对于扁平对象，TOON 的收益与字段数量成**线性关系**。
* 对于数组，收益随元素数量**线性增长**。
* 对于表格化数组，收益同时随行数和字段数**线性增长**。
* 数组的数组是 JSON 更省字节的主要结构性场景。
* 深度嵌套和大量引号会在实际数据中削弱甚至逆转这些优势。

## 结论

这个简化的理论模型印证了 TOON 的设计目标。从结构层面看，在许多常见数据模式中，TOON 可以通过以下方式降低相对于紧凑 JSON 的开销：

* 避免在表格化数组中重复键名，
* 省略许多键和值的引号，
* 并在嵌套较浅时用缩进代替大括号。

对于本文考察的结构类型，在上述假设下，除数组的数组外，TOON 的结构性开销都低于紧凑 JSON。UTF-8 字节长度可以作为 token 数的合理一阶近似。因此，这些结构性节省通常会转化为相应模式下更低的 token 数。

同时，这个模型有意做了简化。真实数据集还会受到其他因素影响，例如更深或不规则的嵌套、大量需要加引号的字符串、JSON 中的指数记法，以及分词器的特殊行为。这些因素都可能削弱甚至逆转 TOON 的收益。

[基准测试](/zh/guide/benchmarks) 和 [何时不使用 TOON](/zh/guide/getting-started#何时不使用-toon) 表明，对于深度嵌套或表格化程度较低的数据，紧凑 JSON 可能更高效。请将本页作为理解 TOON *为何* 如此表现的直觉参考，而不是普遍适用的保证。

## 相关资源

* [基准测试](/zh/guide/benchmarks) —— 跨格式的实证 token 数与准确率对比
* [规范](/zh/reference/spec) —— 正式的 TOON 规范

## 参考文献

本分析基于以下内容：

* **原始研究**：[TOON vs. JSON: A Mathematical Evaluation of Byte Efficiency in Structured Data](https://www.researchgate.net/publication/397903673_TOON_vs_JSON_A_Mathematical_Evaluation_of_Byte_Efficiency_in_Structured_Data)
* **TOON 规范**：[toon-format/spec](https://github.com/toon-format/spec)
* **JSON 规范**：[RFC 8259](https://datatracker.ietf.org/doc/html/rfc8259)、[ECMA-404](https://www.ecma-international.org/publications-and-standards/standards/ecma-404/)

***

本页由 Mateo Lafalce（[@mateolafalce](https://github.com/mateolafalce)）贡献。

*对该形式化分析有疑问，或发现了错误？欢迎在 [GitHub](https://github.com/toon-format/spec) 上提交 issue，或为本分析贡献改进内容。*
