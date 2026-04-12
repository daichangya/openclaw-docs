---
read_when:
    - 你想在 OpenClaw 中使用 StepFun 模型
    - 你需要 StepFun 设置指导
summary: 在 OpenClaw 中使用 StepFun 模型
title: StepFun
x-i18n:
    generated_at: "2026-04-12T10:19:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: a463bed0951d33802dcdb3a7784406272ee206b731e9864ea020323e67b4d159
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClaw 内置了一个 StepFun 提供商插件，包含两个提供商 id：

- 标准端点使用 `stepfun`
- Step Plan 端点使用 `stepfun-plan`

<Warning>
标准版和 Step Plan 是**彼此独立的提供商**，具有不同的端点和模型 ref 前缀（`stepfun/...` vs `stepfun-plan/...`）。`.com` 端点请使用中国区密钥，`.ai` 端点请使用全球密钥。
</Warning>

## 区域和端点概览

| 端点      | 中国区（`.com`）                       | 全球（`.ai`）                         |
| --------- | -------------------------------------- | ------------------------------------- |
| 标准版    | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

认证环境变量：`STEPFUN_API_KEY`

## 内置目录

标准版（`stepfun`）：

| 模型 ref                 | 上下文 | 最大输出 | 说明           |
| ------------------------ | ------ | -------- | -------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536   | 默认标准模型 |

Step Plan（`stepfun-plan`）：

| 模型 ref                           | 上下文 | 最大输出 | 说明                 |
| ---------------------------------- | ------ | -------- | -------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536   | 默认 Step Plan 模型 |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536   | 额外的 Step Plan 模型 |

## 入门指南

选择你的提供商入口，并按照设置步骤进行操作。

<Tabs>
  <Tab title="标准版">
    **最适合：** 通过标准 StepFun 端点进行通用用途使用。

    <Steps>
      <Step title="选择你的端点区域">
        | 认证选项                         | 端点                              | 区域 |
        | -------------------------------- | --------------------------------- | ---- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`       | 国际 |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`      | 中国 |
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        或者使用中国区端点：

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="非交互式替代方案">
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

    ### 模型 ref

    - 默认模型：`stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **最适合：** Step Plan 推理端点。

    <Steps>
      <Step title="选择你的端点区域">
        | 认证选项                     | 端点                                     | 区域 |
        | ---------------------------- | ---------------------------------------- | ---- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`    | 国际 |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1`   | 中国 |
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        或者使用中国区端点：

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="非交互式替代方案">
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

    ### 模型 ref

    - 默认模型：`stepfun-plan/step-3.5-flash`
    - 备用模型：`stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## 高级用法

<AccordionGroup>
  <Accordion title="完整配置：标准提供商">
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
    - 该提供商已内置于 OpenClaw，因此无需单独安装插件。
    - `step-3.5-flash-2603` 目前仅在 `stepfun-plan` 上提供。
    - 单次认证流程会为 `stepfun` 和 `stepfun-plan` 写入与区域匹配的配置，因此两个入口都可以一起被发现。
    - 使用 `openclaw models list` 和 `openclaw models set <provider/model>` 来查看或切换模型。
  </Accordion>
</AccordionGroup>

<Note>
有关更广泛的提供商概览，请参见 [模型提供商](/zh-CN/concepts/model-providers)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型 ref 和故障切换行为的概览。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    提供商、模型和插件的完整配置 schema。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API 密钥管理和文档。
  </Card>
</CardGroup>
