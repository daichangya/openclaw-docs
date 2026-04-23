---
read_when:
    - OpenClaw で Tencent Hy モデルを使いたい場合
    - TokenHub API キーのセットアップが必要な場合
summary: Tencent Cloud TokenHub セットアップ
title: Tencent Cloud（TokenHub）
x-i18n:
    generated_at: "2026-04-23T04:50:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud（TokenHub）

Tencent Cloud provider は、TokenHub
エンドポイント（`tencent-tokenhub`）を通じて Tencent Hy モデルへのアクセスを提供します。

この provider は OpenAI 互換 API を使用します。

## クイックスタート

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## 非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Provider とエンドポイント

| Provider           | エンドポイント                      | 用途                |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Tencent TokenHub 経由の Hy |

## 利用可能なモデル

### tencent-tokenhub

- **hy3-preview** — Hy3 preview（256K コンテキスト、reasoning、デフォルト）

## 注記

- TokenHub のモデル参照は `tencent-tokenhub/<modelId>` を使用します。
- 必要に応じて `models.providers` で料金およびコンテキストメタデータを上書きしてください。

## 環境に関する注記

Gateway をデーモン（launchd/systemd）として実行する場合は、`TOKENHUB_API_KEY` が
そのプロセスから参照可能であることを確認してください（たとえば `~/.openclaw/.env` や
`env.shellEnv` 経由）。

## 関連ドキュメント

- [OpenClaw 設定](/ja-JP/gateway/configuration)
- [Model Providers](/ja-JP/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
