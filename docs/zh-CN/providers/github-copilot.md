---
read_when:
    - 你想将 GitHub Copilot 用作模型提供商
    - 你需要 `openclaw models auth login-github-copilot` 流程
summary: 通过设备流程从 OpenClaw 登录 GitHub Copilot
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-23T21:00:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b54a063e30e9202c6b9de35a1a3736ef8c36020296215491fb719afe73a0c3e
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot 是 GitHub 的 AI 编码助手。它会根据你的 GitHub 账户和订阅计划提供 Copilot
模型访问能力。OpenClaw 可以通过两种不同方式将 Copilot 用作模型
提供商。

## 在 OpenClaw 中使用 Copilot 的两种方式

<Tabs>
  <Tab title="内置提供商（github-copilot）">
    使用原生设备登录流程获取 GitHub 令牌，然后在 OpenClaw 运行时将其交换为
    Copilot API 令牌。这是**默认**且最简单的路径，
    因为它不需要 VS Code。

    <Steps>
      <Step title="运行登录命令">
        ```bash
        openclaw models auth login-github-copilot
        ```

        系统会提示你访问一个 URL 并输入一次性代码。请保持
        终端打开，直到流程完成。
      </Step>
      <Step title="设置默认模型">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        或在配置中：

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy 插件（copilot-proxy）">
    使用 **Copilot Proxy** VS Code 扩展作为本地桥接。OpenClaw 会连接到
    该代理的 `/v1` 端点，并使用你在其中配置的模型列表。

    <Note>
    当你已经在 VS Code 中运行 Copilot Proxy，或者需要通过它进行路由时，
    请选择这种方式。你必须启用该插件，并保持 VS Code 扩展持续运行。
    </Note>

  </Tab>
</Tabs>

## 可选标志

| 标志 | 描述 |
| --------------- | --------------------------------------------------- |
| `--yes` | 跳过确认提示 |
| `--set-default` | 同时应用该提供商推荐的默认模型 |

```bash
# 跳过确认
openclaw models auth login-github-copilot --yes

# 登录并一步设置默认模型
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="需要交互式 TTY">
    设备登录流程需要交互式 TTY。请直接在
    终端中运行，不要在非交互式脚本或 CI 流水线中运行。
  </Accordion>

  <Accordion title="模型可用性取决于你的订阅计划">
    Copilot 模型可用性取决于你的 GitHub 订阅计划。如果某个模型
    被拒绝，请尝试其他 ID（例如 `github-copilot/gpt-4.1`）。
  </Accordion>

  <Accordion title="传输选择">
    Claude 模型 ID 会自动使用 Anthropic Messages 传输。GPT、
    o 系列以及 Gemini 模型则继续使用 OpenAI Responses 传输。OpenClaw
    会根据模型引用选择正确的传输方式。
  </Accordion>

  <Accordion title="环境变量解析顺序">
    OpenClaw 会按以下优先级顺序解析 Copilot 认证环境变量：

    | 优先级 | 变量 | 说明 |
    | -------- | --------------------- | -------------------------------- |
    | 1 | `COPILOT_GITHUB_TOKEN` | 最高优先级，Copilot 专用 |
    | 2 | `GH_TOKEN` | GitHub CLI 令牌（回退） |
    | 3 | `GITHUB_TOKEN` | 标准 GitHub 令牌（最低） |

    当设置了多个变量时，OpenClaw 会使用优先级最高的那个。
    设备登录流程（`openclaw models auth login-github-copilot`）会将
    令牌存储到 auth profile store 中，并优先于所有环境
    变量。

  </Accordion>

  <Accordion title="令牌存储">
    登录流程会将 GitHub 令牌存储在 auth profile store 中，并在 OpenClaw 运行时将其交换
    为 Copilot API 令牌。你无需手动管理该
    令牌。
  </Accordion>
</AccordionGroup>

<Warning>
需要交互式 TTY。请直接在终端中运行登录命令，不要
在无头脚本或 CI 任务中执行。
</Warning>

## Memory 搜索嵌入

GitHub Copilot 还可以作为
[memory 搜索](/zh-CN/concepts/memory-search) 的嵌入提供商。如果你拥有 Copilot 订阅并且
已经登录，OpenClaw 就可以在无需额外 API 密钥的情况下将它用于嵌入。

### 自动检测

当 `memorySearch.provider` 为 `"auto"`（默认值）时，GitHub Copilot 会在优先级 15 被尝试——位于本地嵌入之后、OpenAI 和其他付费
提供商之前。如果存在 GitHub 令牌，OpenClaw 会从 Copilot API 中发现可用的
嵌入模型，并自动选择最佳模型。

### 显式配置

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // 可选：覆盖自动发现的模型
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 工作原理

1. OpenClaw 解析你的 GitHub 令牌（来自环境变量或 auth profile）。
2. 将其交换为一个短期 Copilot API 令牌。
3. 查询 Copilot `/models` 端点以发现可用的嵌入模型。
4. 选择最佳模型（优先 `text-embedding-3-small`）。
5. 将嵌入请求发送到 Copilot `/embeddings` 端点。

模型可用性取决于你的 GitHub 订阅计划。如果没有可用的嵌入模型，
OpenClaw 会跳过 Copilot 并尝试下一个提供商。

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用以及故障切换行为。
  </Card>
  <Card title="OAuth 与认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节与凭证复用规则。
  </Card>
</CardGroup>
