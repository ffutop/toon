---
description: 跨语言的官方与社区 TOON 实现，以及贡献指引。
---

# 实现列表

TOON 在多种编程语言中拥有官方与社区实现。所有实现都力求遵循同一份 [规范](https://github.com/toon-format/spec)，以确保兼容性和互操作性。

本文档站点中的代码示例默认使用 TypeScript 实现，但相关格式和概念同样适用于所有语言。

> [!NOTE]
> 在其他语言中实现 TOON 时，请遵循 [规范](https://github.com/toon-format/spec/blob/main/SPEC.md) 以确保各实现之间的兼容性。[一致性测试](https://github.com/toon-format/spec/tree/main/tests) 提供了与语言无关的测试用例，用于校验你的实现。

## 官方实现

以下实现由专门团队积极维护。欢迎参与贡献！你可以在相应仓库中提交 issue、发起 PR，或讨论实现细节。

| 语言 | 仓库 | 状态 | 维护者 |
|----------|------------|--------|------------|
| **.NET** | [toon-dotnet](https://github.com/toon-format/toon-dotnet) | 开发中 | 官方团队 |
| **Dart** | [toon-dart](https://github.com/toon-format/toon-dart) | 开发中 | 官方团队 |
| **Go** | [toon-go](https://github.com/toon-format/toon-go) | 开发中 | 官方团队 |
| **Java** | [toon-java](https://github.com/toon-format/toon-java) | ✅ 稳定 | 官方团队 |
| **Julia** | [ToonFormat.jl](https://github.com/toon-format/ToonFormat.jl) | ✅ 稳定 | 官方团队 |
| **Python** | [toon-python](https://github.com/toon-format/toon-python) | ✅ 稳定 | 官方团队 |
| **Rust** | [toon-rust](https://github.com/toon-format/toon-rust) | ✅ 稳定 | 官方团队 |
| **Swift** | [toon-swift](https://github.com/toon-format/toon-swift) | ✅ 稳定 | 官方团队 |
| **TypeScript/JavaScript** | [toon](https://github.com/toon-format/toon/tree/main/packages/toon) | ✅ 稳定 | 官方团队 |

## 社区实现

社区成员为其他语言创建了以下实现：

| 语言 | 仓库 | 维护者 |
|----------|------------|------------|
| **Apex** | [ApexToon](https://github.com/Eacaw/ApexToon) | [@Eacaw](https://github.com/Eacaw) |
| **C** | [TOONc](https://github.com/UsboKirishima/TOONc) | [@UsboKirishima](https://github.com/UsboKirishima) |
| **C++** | [ctoon](https://github.com/mohammadraziei/ctoon) | [@mohammadraziei](https://github.com/mohammadraziei) |
| **C#** | [ToonEncoder](https://github.com/Cysharp/ToonEncoder) | [@Cysharp](https://github.com/Cysharp/ToonEncoder) |
| **Clojure** | [toon](https://github.com/vadelabs/toon) | [@vadelabs](https://github.com/vadelabs) |
| **Crystal** | [toon-crystal](https://github.com/mamantoha/toon-crystal) | [@mamantoha](https://github.com/mamantoha) |
| **Delphi** | [delphi-toon](https://github.com/ernestoalconada/delphi-toon) | [@ernestoalconada](https://github.com/ernestoalconada) |
| **Elixir** | [toon_ex](https://github.com/kentaro/toon_ex) | [@kentaro](https://github.com/kentaro) |
| **Gleam** | [toon_codec](https://github.com/axelbellec/toon_codec) | [@axelbellec](https://github.com/axelbellec) |
| **Go** | [gotoon](https://github.com/alpkeskin/gotoon) | [@alpkeskin](https://github.com/alpkeskin) |
| **Java** | [json-io](https://github.com/jdereg/json-io) | [@jdereg](https://github.com/jdereg) |
| **Kotlin** | [ktoon](https://github.com/lukelast/ktoon)| [@lukelast](https://github.com/lukelast) |
| **Laravel Framework** | [laravel-toon](https://github.com/mischasigtermans/laravel-toon) | [@mischasigtermans](https://github.com/mischasigtermans) |
| **Lua/Neovim** | [toon.nvim](https://github.com/thalesgelinger/toon.nvim) | [@thalesgelinger](https://github.com/thalesgelinger) |
| **Matlab** | [ctoon](https://github.com/mohammadraziei/ctoon) | [@mohammadraziei](https://github.com/mohammadraziei) |
| **OCaml** | [ocaml-toon](https://github.com/davesnx/ocaml-toon) | [@davesnx](https://github.com/davesnx) |
| **Perl** | [Data::TOON](https://github.com/ytnobody/p5-Data-TOON) | [@ytnobody](https://github.com/ytnobody) |
| **PHP** | [toon-php](https://github.com/HelgeSverre/toon-php) | [@HelgeSverre](https://github.com/HelgeSverre) |
| **Python**（C++ 后端） | [ctoon](https://github.com/mohammadraziei/ctoon) | [@mohammadraziei](https://github.com/mohammadraziei) |
| **Python**（Rust 后端） | [toons](https://github.com/alesanfra/toons) | [@alesanfra](https://github.com/alesanfra) |
| **R** | [toon](https://github.com/laresbernardo/toon) | [@laresbernardo](https://github.com/laresbernardo) |
| **Ruby** | [toon-ruby](https://github.com/andrepcg/toon-ruby) | [@andrepcg](https://github.com/andrepcg) |
| **Scala** | [toon4s](https://github.com/vim89/toon4s) | [@vim89](https://github.com/vim89) |
| **Zig** | [toon-zig](https://github.com/LatentEvals/toon-zig) | [@montanaflynn](https://github.com/montanaflynn) |

## 贡献一个新的实现

想为某个新的语言构建 TOON 实现吗？太棒了！以下是入门的一些步骤：

1. **遵循规范**：实现 [最新规范](https://github.com/toon-format/spec/blob/main/SPEC.md)。
2. **添加测试**：运行 [一致性测试套件](https://github.com/toon-format/spec/tree/main/tests)。
3. **编写使用文档**：提供一份清晰的 README，包含安装和使用示例。
4. **分享出来**：提交一个 PR，将你的实现添加到 [github.com/toon-format/toon](https://github.com/toon-format/toon) 的 README 中。
