---
read_when:
    - 你希望通过引导式设置完成 gateway、工作区、认证、渠道和 Skills 的配置
summary: '`openclaw onboard` 的 CLI 参考（交互式新手引导）'
title: 新手引导
x-i18n:
    generated_at: "2026-04-23T20:44:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab92ff5651b7db18850558cbb47527bf0486f278c8aed0929eaeff0017b6c280
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

用于本地或远程 Gateway 网关设置的交互式新手引导。

## 相关指南

- CLI 新手引导总览：[新手引导（CLI）](/zh-CN/start/wizard)
- 新手引导概览：[新手引导概览](/zh-CN/start/onboarding-overview)
- CLI 新手引导参考：[CLI 设置参考](/zh-CN/start/wizard-cli-reference)
- CLI 自动化：[CLI 自动化](/zh-CN/start/wizard-cli-automation)
- macOS 新手引导：[新手引导（macOS App）](/zh-CN/start/onboarding)

## 示例

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

对于明文私有网络 `ws://` 目标（仅限受信任网络），请在新手引导进程环境中设置
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

非交互式自定义 provider：

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

在非交互模式下，`--custom-api-key` 是可选的。如果省略，新手引导会检查 `CUSTOM_API_KEY`。

LM Studio 在非交互模式下也支持 provider 专用密钥标志：

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

非交互式 Ollama：

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` 默认值为 `http://127.0.0.1:11434`。`--custom-model-id` 是可选的；如果省略，新手引导会使用 Ollama 建议的默认值。像 `kimi-k2.5:cloud` 这样的云模型 ID 也可在此使用。

将 provider 密钥存储为引用而不是明文：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 时，新手引导会写入由环境变量支持的引用，而不是明文密钥值。
对于基于 auth-profile 的 providers，这会写入 `keyRef` 条目；对于自定义 providers，这会将 `models.providers.<id>.apiKey` 写为环境变量引用（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非交互式 `ref` 模式契约：

- 在新手引导进程环境中设置 provider 环境变量（例如 `OPENAI_API_KEY`）。
- 不要传递内联密钥标志（例如 `--openai-api-key`），除非该环境变量也已设置。
- 如果传递了内联密钥标志但缺少所需环境变量，新手引导会快速失败并给出指引。

非交互模式下的 Gateway 网关 token 选项：

- `--gateway-auth token --gateway-token <token>` 存储明文 token。
- `--gateway-auth token --gateway-token-ref-env <name>` 将 `gateway.auth.token` 存储为环境变量 SecretRef。
- `--gateway-token` 和 `--gateway-token-ref-env` 互斥。
- `--gateway-token-ref-env` 要求在新手引导进程环境中存在一个非空环境变量。
- 配合 `--install-daemon` 使用时，当 token 认证要求 token 时，由 SecretRef 管理的 Gateway 网关 token 会被验证，但不会以已解析的明文形式持久化到 supervisor 服务环境元数据中。
- 配合 `--install-daemon` 使用时，如果 token 模式要求 token，且配置的 token SecretRef 未解析，新手引导会以失败关闭方式终止，并提供修复指引。
- 配合 `--install-daemon` 使用时，如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但未设置 `gateway.auth.mode`，新手引导会阻止安装，直到显式设置 mode。
- 本地新手引导会将 `gateway.mode="local"` 写入配置。如果之后的配置文件缺少 `gateway.mode`，应视为配置损坏或不完整的手动编辑，而不是合法的本地模式快捷方式。
- `--allow-unconfigured` 是单独的 Gateway 网关运行时逃生开关。它并不意味着新手引导可以省略 `gateway.mode`。

示例：

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

非交互式本地 Gateway 网关健康检查：

- 除非你传递 `--skip-health`，否则新手引导会在本地 Gateway 网关可连接之前一直等待，只有成功后才退出。
- `--install-daemon` 会先启动受管理的 Gateway 网关安装路径。如果不使用它，你必须已经运行本地 Gateway 网关，例如 `openclaw gateway run`。
- 如果你在自动化中只想写入配置/工作区/引导文件，请使用 `--skip-health`。
- 在原生 Windows 上，`--install-daemon` 会先尝试 Scheduled Tasks；如果任务创建被拒绝，则回退到每用户 Startup 文件夹登录项。

启用引用模式时的交互式新手引导行为：

- 出现提示时选择**使用 secret reference**。
- 然后选择以下之一：
  - 环境变量
  - 已配置的 secret provider（`file` 或 `exec`）
- 新手引导会在保存引用前执行快速预检验证。
  - 如果验证失败，新手引导会显示错误并允许你重试。

非交互式 Z.AI 端点选项：

注意：`--auth-choice zai-api-key` 现在会自动为你的密钥检测最佳 Z.AI 端点（优先使用通用 API 和 `zai/glm-5.1`）。
如果你特别想使用 GLM Coding Plan 端点，请选择 `zai-coding-global` 或 `zai-coding-cn`。

```bash
# 无提示端点选择
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# 其他 Z.AI 端点选项：
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

非交互式 Mistral 示例：

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

流程说明：

- `quickstart`：最少提示，自动生成 gateway token。
- `manual`：针对 port/bind/auth 提供完整提示（`advanced` 的别名）。
- 当某个认证选项暗示首选 provider 时，新手引导会将默认模型和允许列表选择器预过滤到该 provider。对于 Volcengine 和 BytePlus（国际版），这也会匹配 coding-plan 变体
  （`volcengine-plan/*`、`byteplus-plan/*`）。
- 如果首选 provider 过滤后尚未得到任何已加载模型，新手引导会回退到未过滤目录，而不是让选择器保持为空。
- 在网页搜索步骤中，某些 providers 可能触发 provider 专用的后续提示：
  - **Grok** 可以提供可选的 `x_search` 设置，使用同一个 `XAI_API_KEY` 和一个 `x_search` 模型选择。
  - **Kimi** 可能会询问 Moonshot API 区域（`api.moonshot.ai` 与 `api.moonshot.cn`）以及默认的 Kimi Web 搜索模型。
- 本地新手引导私信范围行为：[CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)。
- 最快开始首次聊天的方式：`openclaw dashboard`（Control UI，无需设置渠道）。
- 自定义 Provider：连接任意兼容 OpenAI 或 Anthropic 的端点，包括未列出的托管 provider。使用 Unknown 进行自动检测。

## 常见后续命令

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不代表非交互模式。脚本中请使用 `--non-interactive`。
</Note>
