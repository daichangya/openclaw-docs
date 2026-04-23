---
read_when:
    - 添加新的核心能力和插件注册界面
    - 判断代码应属于核心、vendor 插件还是功能插件1?
    - 为渠道或工具接入新的运行时辅助工具
sidebarTitle: Adding Capabilities
summary: 向 OpenClaw 插件系统添加新共享能力的贡献者指南
title: 添加能力（贡献者指南）
x-i18n:
    generated_at: "2026-04-23T21:07:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5939c129d25ffe58bca97e77da99f12344c3ec3c1657bac3c9b756f89acb1de
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  这是面向 OpenClaw 核心开发者的**贡献者指南**。如果你是在
  构建外部插件，请改看 [构建插件](/zh-CN/plugins/building-plugins)。
</Info>

当 OpenClaw 需要一个新的领域能力，例如图像生成、视频
生成，或未来某种由 vendor 支持的功能领域时，请使用本指南。

规则是：

- plugin = 所有权边界
- capability = 共享核心契约

这意味着，你不应该一开始就把某个 vendor 直接接到渠道或
工具里。应先定义 capability。

## 何时创建 capability

当以下条件全部成立时，请创建一个新的 capability：

1. 有不止一个 vendor 可能实现它
2. 渠道、工具或功能插件应能消费它，而不必关心
   具体 vendor
3. 核心需要持有回退、策略、配置或投递行为

如果这项工作只是 vendor 专属，而尚不存在共享契约，请停下来，
先定义契约。

## 标准顺序

1. 定义类型化的核心契约。
2. 为该契约添加插件注册能力。
3. 添加共享运行时辅助工具。
4. 接入一个真实 vendor 插件作为证明。
5. 将功能 / 渠道消费者迁移到运行时辅助工具上。
6. 添加契约测试。
7. 编写面向操作员的配置和所有权模型文档。

## 各部分放在哪里

核心：

- 请求 / 响应类型
- 提供商注册表 + 解析
- 回退行为
- 配置 schema，以及传播到嵌套对象、通配符、数组项和组合节点上的 `title` / `description` 文档元数据
- 运行时辅助工具界面

Vendor 插件：

- vendor API 调用
- vendor 认证处理
- vendor 特定的请求规范化
- capability 实现的注册

功能 / 渠道插件：

- 调用 `api.runtime.*` 或匹配的 `plugin-sdk/*-runtime` 辅助工具
- 绝不直接调用 vendor 实现

## 文件检查清单

对于一个新的 capability，通常需要修改以下区域：

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- 一个或多个内置插件包
- config / docs / tests

## 示例：图像生成

图像生成遵循标准形态：

1. 核心定义 `ImageGenerationProvider`
2. 核心暴露 `registerImageGenerationProvider(...)`
3. 核心暴露 `runtime.imageGeneration.generate(...)`
4. `openai`、`google`、`fal` 和 `minimax` 插件注册由 vendor 支持的实现
5. 未来的 vendor 可以注册相同契约，而无需修改渠道 / 工具

配置键与视觉分析路由是分开的：

- `agents.defaults.imageModel` = 分析图像
- `agents.defaults.imageGenerationModel` = 生成图像

请将它们分开，以便让回退和策略保持明确。

## 审查检查清单

在发布新 capability 之前，请确认：

- 没有任何渠道 / 工具直接导入 vendor 代码
- 运行时辅助工具是共享路径
- 至少有一个契约测试断言了内置所有权
- 配置文档为新的模型 / 配置键命名
- 插件文档解释了所有权边界

如果某个 PR 跳过 capability 层，并将 vendor 行为硬编码进
渠道 / 工具中，请退回它，并先定义契约。
