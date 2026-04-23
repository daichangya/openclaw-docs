---
read_when:
    - 添加新的核心能力和插件注册表面
    - 判断代码应放在 core、vendor 插件还是 feature 插件中
    - 为渠道或工具接入新的运行时辅助函数
sidebarTitle: Adding Capabilities
summary: 向 OpenClaw 插件系统添加新共享能力的贡献者指南
title: 添加能力（贡献者指南）
x-i18n:
    generated_at: "2026-04-23T23:04:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1e3251b9150c9744d967e91f531dfce01435b13aea3a17088ccd54f2145d14f
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  这是面向 OpenClaw 核心开发者的**贡献者指南**。如果你正在构建外部插件，请参见[构建插件](/zh-CN/plugins/building-plugins)。
</Info>

当 OpenClaw 需要一个新的领域时使用本指南，例如图像生成、视频生成，或未来某个由 vendor 支持的功能领域。

规则是：

- plugin = 所有权边界
- capability = 共享核心契约

这意味着你不应一开始就把某个 vendor 直接接进渠道或工具。应从定义 capability 开始。

## 何时创建 capability

当以下条件都满足时，创建一个新的 capability：

1. 不止一个 vendor 有可能实现它
2. 渠道、工具或 feature 插件应在不关心 vendor 的情况下消费它
3. core 需要拥有回退、策略、配置或交付行为

如果这项工作仅限 vendor 且尚不存在共享契约，请先停下来定义契约。

## 标准顺序

1. 定义带类型的核心契约。
2. 为该契约添加插件注册。
3. 添加共享运行时辅助函数。
4. 接入一个真实 vendor 插件作为证明。
5. 将 feature/渠道消费者迁移到运行时辅助函数上。
6. 添加契约测试。
7. 记录面向操作员的配置和所有权模型。

## 各部分应放在哪里

Core：

- 请求/响应类型
- provider 注册表 + 解析
- 回退行为
- 配置 schema，以及传播到嵌套对象、通配符、数组项和组合节点上的 `title` / `description` 文档元数据
- 运行时辅助函数表面

Vendor 插件：

- vendor API 调用
- vendor 认证处理
- vendor 特定的请求规范化
- capability 实现的注册

Feature/渠道插件：

- 调用 `api.runtime.*` 或匹配的 `plugin-sdk/*-runtime` 辅助函数
- 绝不直接调用 vendor 实现

## 文件清单

对于一个新的 capability，预计会涉及这些区域：

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
- config/docs/tests

## 示例：图像生成

图像生成遵循标准形状：

1. core 定义 `ImageGenerationProvider`
2. core 暴露 `registerImageGenerationProvider(...)`
3. core 暴露 `runtime.imageGeneration.generate(...)`
4. `openai`、`google`、`fal` 和 `minimax` 插件注册由 vendor 支持的实现
5. 未来其他 vendor 可以注册同一契约，而无需修改渠道/工具

该配置键与视觉分析路由是分开的：

- `agents.defaults.imageModel` = 分析图像
- `agents.defaults.imageGenerationModel` = 生成图像

请保持二者分离，以便让回退和策略保持明确。

## 评审清单

在交付新的 capability 之前，请确认：

- 没有任何渠道/工具直接导入 vendor 代码
- 运行时辅助函数是共享路径
- 至少有一个契约测试断言了内置所有权
- 配置文档命名了新的模型/配置键
- 插件文档解释了所有权边界

如果某个 PR 跳过 capability 层，直接把 vendor 行为硬编码进渠道/工具中，请退回该 PR，并先定义契约。

## 相关内容

- [插件](/zh-CN/tools/plugin)
- [创建 Skills](/zh-CN/tools/creating-skills)
- [工具和插件](/zh-CN/tools)
