---
read_when:
    - 你想在 OpenClaw 中使用 StepFun 模型
    - 你需要 StepFun 的设置指引
summary: 将 StepFun 模型与 OpenClaw 配合使用
title: StepFun
x-i18n:
    generated_at: "2026-04-23T21:02:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3267379303e5cf1539c1945ec8d777f1bfc6189c9f9e7f8802b3393c60e7693d
    source_path: providers/stepfun.md
    workflow: 15
---

OpenClaw 内置了一个 StepFun 提供商插件，包含两个提供商 ID：

- `stepfun` 用于标准端点
- `stepfun-plan` 用于 Step Plan 端点

<Warning>
标准版和 Step Plan 是**独立的提供商**，具有不同的端点和模型引用前缀（`stepfun/...` 与 `stepfun-plan/...`）。中国密钥请配合 `.com` 端点使用，全局密钥请配合 `.ai` 端点使用。
</Warning>

## 区域与端点概览

| 端点 | 中国（`.com`） | 全球（`.ai`） |
| --------- | -------------------------------------- | ------------------------------------- |
| 标准版 | `https://api.stepfun.com/v1` | `https://api.stepfun.ai/v1` |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

认证环境变量：`STEPFUN_API_KEY`

## 内置目录

标准版（`stepfun`）：

| 模型引用 | 上下文 | 最大输出 | 说明 |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536 | 默认标准模型 |

Step Plan（`stepfun-plan`）：

| 模型引用 | 上下文 | 最大输出 | 说明 |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash` | 262,144 | 65,536 | 默认 Step Plan 模型 |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536 | 额外的 Step Plan 模型 |

## 入门指南

选择你的提供商表面，并按步骤进行设置。

<Tabs>
  <Tab title="标准版">
    **最适合：** 通过标准 StepFun 端点进行通用用途。

    <Steps>
      <Step title="选择你的端点区域">
        | 认证选项 | 端点 | 区域 |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1` | 国际版 |
        | `stepfun-standard-api-key-cn` | `https://api.stepfun.com/v1` | 中国 |
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        或使用中国端点：

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="非交互式替代方式">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### 模型引用

    - 默认模型：`stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **最适合：** Step Plan 推理端点。

    <Steps>
      <Step title="选择你的端点区域">
        | 认证选项 | 端点 | 区域 |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1` | 国际版 |
        | `stepfun-plan-api-key-cn` | `https://api.stepfun.com/step_plan/v1` | 中国 |
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        或使用中国端点：

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="非交互式替代方式">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### 模型引用

    - 默认模型：`stepfun-plan/step-3.5-flash`
    - 备用模型：`stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## 高级配置

<AccordionGroup>
  <Accordion title="完整配置：标准版提供商">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          stepfun: {
            baseUrl: "https://api.stepfun.ai/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="完整配置：Step Plan 提供商">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          "stepfun-plan": {
            baseUrl: "https://api.stepfun.ai/step_plan/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
              {
                id: "step-3.5-flash-2603",
                name: "Step 3.5 Flash 2603",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="说明">
    - 该提供商为 OpenClaw 内置，因此无需单独安装插件。
    - `step-3.5-flash-2603` 当前仅在 `stepfun-plan` 上暴露。
    - 单次认证流程会为 `stepfun` 和 `stepfun-plan` 写入区域匹配的配置文件，因此两个表面可以一起被发现。
    - 使用 `openclaw models list` 和 `openclaw models set <provider/model>` 可检查或切换模型。
  </Accordion>
</AccordionGroup>

<Note>
更广泛的提供商概览请参见 [模型提供商](/zh-CN/concepts/model-providers)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障切换行为概览。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    提供商、模型和插件的完整配置 schema。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API 密钥管理与文档。
  </Card>
</CardGroup>
