---
x-i18n:
    generated_at: "2026-04-05T12:54:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1066a1d0acebe4ae3500d18c21f7de07f43b9766daf3d13b098936734e9e7a2b
    source_path: providers/qwen_modelstudio.md
    workflow: 15
---

title: "Qwen / Model Studio"
summary: "bundled の qwen provider の endpoint 詳細と、そのレガシーな modelstudio 互換サーフェス"
read_when:

- Qwen Cloud / Alibaba DashScope の endpoint レベルの詳細が必要な場合
- qwen provider の env var 互換性の扱いを知りたい場合
- Standard（従量課金）または Coding Plan endpoint を使いたい場合

---

# Qwen / Model Studio（Alibaba Cloud）

このページでは、OpenClaw の bundled `qwen`
provider の背後にある endpoint マッピングを説明します。この provider は、
`qwen` を正式なサーフェスにしつつ、`modelstudio` provider id、auth-choice id、
および model ref を互換エイリアスとして引き続き動作させます。

<Info>

**`qwen3.6-plus`** が必要な場合は、**Standard（従量課金）** を推奨します。Coding
Plan の提供状況は公開されている Model Studio カタログより遅れることがあり、
そのモデルがプランの対応モデル一覧に現れるまでは、Coding Plan API がそのモデルを拒否する場合があります。

</Info>

- Provider: `qwen`（レガシーエイリアス: `modelstudio`）
- Auth: `QWEN_API_KEY`
- これらも受け付けます: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API: OpenAI 互換

## クイックスタート

### Standard（従量課金）

```bash
# 中国 endpoint
openclaw onboard --auth-choice qwen-standard-api-key-cn

# Global/Intl endpoint
openclaw onboard --auth-choice qwen-standard-api-key
```

### Coding Plan（サブスクリプション）

```bash
# 中国 endpoint
openclaw onboard --auth-choice qwen-api-key-cn

# Global/Intl endpoint
openclaw onboard --auth-choice qwen-api-key
```

レガシーの `modelstudio-*` auth-choice id も互換エイリアスとして引き続き動作しますが、
正式な onboarding id は、上に示した `qwen-*` choice です。

onboarding 後、デフォルトモデルを設定します:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## プラン種別と endpoint

| Plan                       | Region | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard（従量課金）   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard（従量課金）   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan（サブスクリプション） | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan（サブスクリプション） | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

この provider は、auth choice に基づいて endpoint を自動選択します。正式な
choice は `qwen-*` ファミリーを使い、`modelstudio-*` は互換性専用のままです。
config 内のカスタム `baseUrl` で上書きすることもできます。

ネイティブな Model Studio endpoint は、共有の `openai-completions` 転送上で
streaming usage compatibility を告知します。OpenClaw は現在これを endpoint
capability に基づいて判定するため、同じネイティブホストを指す DashScope 互換のカスタム provider id も、
組み込みの `qwen` provider id を特に要求せず、同じ streaming-usage 動作を継承します。

## API キーを取得する

- **キー管理**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **ドキュメント**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## 組み込みカタログ

OpenClaw には現在、次の bundled Qwen カタログが含まれています:

| Model ref                   | Input       | Context   | Notes                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | デフォルトモデル                                      |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | このモデルが必要な場合は Standard endpoint を推奨 |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Qwen Max 系                                      |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | reasoning 有効                                  |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Alibaba 経由の Moonshot AI                            |

モデルが bundled カタログに存在していても、実際の提供状況は endpoint や課金プランによって異なる場合があります。

ネイティブストリーミング usage compatibility は、Coding Plan ホストと
Standard の DashScope 互換ホストの両方に適用されます:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Qwen 3.6 Plus の提供状況

`qwen3.6-plus` は、Standard（従量課金）の Model Studio
endpoint で利用できます:

- 中国: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Coding Plan endpoint が
`qwen3.6-plus` に対して「unsupported model」エラーを返す場合は、Coding Plan の
endpoint / key の組み合わせではなく、Standard（従量課金）へ切り替えてください。

## 環境に関する注意

Gateway が daemon（launchd/systemd）として動作している場合は、
`QWEN_API_KEY` がそのプロセスで利用可能であることを確認してください（たとえば
`~/.openclaw/.env` または `env.shellEnv` 経由）。
