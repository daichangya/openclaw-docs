---
read_when:
    - 你想在 OpenClaw 中使用腾讯混元模型
    - 你需要 TokenHub API 密钥或 Token Plan（LKEAP）设置
summary: 腾讯云 TokenHub 和 Token Plan 设置（分离密钥）
title: 腾讯云（TokenHub + Token Plan）
x-i18n:
    generated_at: "2026-04-22T05:01:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0f04fcfcb6e14b17c3bc8f3c7ca3f20f8dabfaa89813a0566c0672439d4afff
    source_path: providers/tencent.md
    workflow: 15
---

# 腾讯云（TokenHub + Token Plan）

腾讯云提供商通过两个使用独立 API 密钥的端点，提供对腾讯混元模型的访问：

- **TokenHub**（`tencent-tokenhub`）—— 通过腾讯 TokenHub Gateway 网关调用混元
- **Token Plan**（`tencent-token-plan`）—— 通过 LKEAP
  Token Plan 端点调用混元

这两个提供商都使用与 OpenAI 兼容的 API。

## 快速开始

TokenHub：

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

Token Plan：

```bash
openclaw onboard --auth-choice tencent-token-plan-api-key
```

## 非交互式示例

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# Token Plan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tencent-token-plan-api-key \
  --tencent-token-plan-api-key "$LKEAP_API_KEY" \
  --skip-health \
  --accept-risk
```

## 提供商和端点

| 提供商 | 端点 | 使用场景 |
| -------------------- | ------------------------------------- | ---------------------- |
| `tencent-tokenhub`   | `tokenhub.tencentmaas.com/v1`         | 通过腾讯 TokenHub 调用混元 |
| `tencent-token-plan` | `api.lkeap.cloud.tencent.com/plan/v3` | 通过 LKEAP Token Plan 调用混元 |

每个提供商都使用各自的 API 密钥。设置时只会注册所选的提供商。

## 可用模型

### tencent-tokenhub

- **hy3-preview** —— 混元 3 预览版（256K 上下文、推理、默认）

### tencent-token-plan

- **hy3-preview** —— 混元 3 预览版（256K 上下文、推理、默认）

## 说明

- TokenHub 模型引用使用 `tencent-tokenhub/<modelId>`。Token Plan 模型引用使用 `tencent-token-plan/<modelId>`。
- 如果需要，可在 `models.providers` 中覆盖定价和上下文元数据。

## 环境说明

如果 Gateway 网关以守护进程方式运行（`launchd`/`systemd`），请确保 `TOKENHUB_API_KEY`
或 `LKEAP_API_KEY` 对该进程可用（例如在
`~/.openclaw/.env` 中，或通过 `env.shellEnv`）。

## 相关文档

- [OpenClaw 配置](/zh-CN/gateway/configuration)
- [模型提供商](/zh-CN/concepts/model-providers)
- [腾讯 TokenHub](https://cloud.tencent.com/document/product/1823/130050)
- [腾讯 Token Plan API](https://cloud.tencent.com/document/product/1823/130060)
