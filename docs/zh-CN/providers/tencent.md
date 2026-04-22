---
read_when:
    - 你想在 OpenClaw 中使用腾讯混元模型
    - 你需要设置 TokenHub API 密钥
summary: 腾讯云 TokenHub 设置
title: 腾讯云（TokenHub）
x-i18n:
    generated_at: "2026-04-22T05:47:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# 腾讯云（TokenHub）

腾讯云提供商通过 TokenHub 端点（`tencent-tokenhub`）提供对腾讯混元模型的访问。

该提供商使用与 OpenAI 兼容的 API。

## 快速开始

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## 提供商和端点

| 提供商 | 端点 | 用例 |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | 通过腾讯 TokenHub 使用混元 |

## 可用模型

### tencent-tokenhub

- **hy3-preview** — Hy3 预览版（256K 上下文、推理、默认）

## 说明

- TokenHub 模型引用使用 `tencent-tokenhub/<modelId>`。
- 如有需要，可在 `models.providers` 中覆盖定价和上下文元数据。

## 环境说明

如果 Gateway 网关 以守护进程方式运行（`launchd`/`systemd`），请确保 `TOKENHUB_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。

## 相关文档

- [OpenClaw 配置](/zh-CN/gateway/configuration)
- [模型提供商](/zh-CN/concepts/model-providers)
- [腾讯 TokenHub](https://cloud.tencent.com/document/product/1823/130050)
