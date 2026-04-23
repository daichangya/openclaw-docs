---
read_when:
    - 你想在 OpenClaw 中使用腾讯 Hy3 预览版
    - 你需要设置 TokenHub API 密钥
summary: Hy3 预览版的腾讯云 TokenHub 设置
title: 腾讯云（TokenHub）
x-i18n:
    generated_at: "2026-04-23T15:31:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77ad001f0bbdf2cfe2e0e9b01a89bd9d190deb558a0478a08d3ac62995d2a9f1
    source_path: providers/tencent.md
    workflow: 15
---

# 腾讯云 TokenHub

腾讯云在 OpenClaw 中作为**内置提供商插件**提供。它通过 TokenHub 端点（`tencent-tokenhub`）提供对腾讯 Hy3 预览版的访问。

该提供商使用与 OpenAI 兼容的 API。

| 属性 | 值 |
| ------------- | ------------------------------------------ |
| 提供商 | `tencent-tokenhub` |
| 默认模型 | `tencent-tokenhub/hy3-preview` |
| 凭证 | `TOKENHUB_API_KEY` |
| API | 与 OpenAI 兼容的聊天补全 |
| 基础 URL | `https://tokenhub.tencentmaas.com/v1` |
| 全球 URL | `https://tokenhub-intl.tencentmaas.com/v1` |

## 快速开始

<Steps>
  <Step title="创建 TokenHub API 密钥">
    在腾讯云 TokenHub 中创建一个 API 密钥。如果你为该密钥选择了受限访问范围，请将**Hy3 预览版**包含在允许的模型中。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="验证模型">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## 非交互式设置

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## 模型目录

| 模型引用 | 名称 | 输入 | 上下文 | 最大输出 | 备注 |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 预览版（TokenHub） | text | 256,000 | 64,000 | 默认；启用推理 |

Hy3 预览版是腾讯混元用于推理、长上下文指令跟随、代码和智能体工作流的大型 MoE 语言模型。腾讯与 OpenAI 兼容的示例使用 `hy3-preview` 作为模型 id，并支持标准聊天补全工具调用以及 `reasoning_effort`。

<Tip>
模型 id 是 `hy3-preview`。不要将它与腾讯的 `HY-3D-*` 模型混淆，后者是 3D 生成 API，并不是此提供商在 OpenClaw 中配置的聊天模型。
</Tip>

## 端点覆盖

OpenClaw 默认使用腾讯云的 `https://tokenhub.tencentmaas.com/v1` 端点。腾讯还提供了一个国际版 TokenHub 端点：

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

仅当你的 TokenHub 账户或区域要求时，才覆盖该端点。

## 说明

- TokenHub 模型引用使用 `tencent-tokenhub/<modelId>`。
- 当前内置目录包含 `hy3-preview`。
- 该插件将 Hy3 预览版标记为支持推理能力和流式传输用量统计。
- 该插件内置了分层 Hy3 定价元数据，因此无需手动覆盖定价即可填充成本估算。
- 仅在需要时，才在 `models.providers` 中覆盖定价、上下文或端点元数据。

## 环境说明

如果 Gateway 网关 以守护进程方式运行（launchd/systemd），请确保 `TOKENHUB_API_KEY`
可供该进程使用（例如在 `~/.openclaw/.env` 中，或通过
`env.shellEnv`）。

## 相关文档

- [OpenClaw 配置](/zh-CN/gateway/configuration)
- [模型提供商](/zh-CN/concepts/model-providers)
- [腾讯 TokenHub 产品页面](https://cloud.tencent.com/product/tokenhub)
- [腾讯 TokenHub 文本生成](https://cloud.tencent.com/document/product/1823/130079)
- [腾讯 TokenHub 用于 Hy3 预览版的 Cline 设置](https://cloud.tencent.com/document/product/1823/130932)
- [腾讯 Hy3 预览版模型卡](https://huggingface.co/tencent/Hy3-preview)
