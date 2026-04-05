---
read_when:
    - OpenClaw で Google Gemini モデルを使いたい場合
    - API キーまたは OAuth の auth フローが必要な場合
summary: Google Gemini のセットアップ（API キー + OAuth、画像生成、media understanding、web search）
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-05T12:53:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa3c4326e83fad277ae4c2cb9501b6e89457afcfa7e3e1d57ae01c9c0c6846e2
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Google plugin は、Google AI Studio 経由で Gemini モデルへのアクセスを提供し、さらに
画像生成、media understanding（画像 / 音声 / 動画）、および
Gemini Grounding 経由の web search も提供します。

- Provider: `google`
- Auth: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- 代替 provider: `google-gemini-cli`（OAuth）

## クイックスタート

1. API キーを設定します:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. デフォルトモデルを設定します:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## 非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth（Gemini CLI）

代替 provider の `google-gemini-cli` は、API
キーの代わりに PKCE OAuth を使用します。これは非公式な統合であり、一部ユーザーから
アカウント制限が報告されています。自己責任で使用してください。

- デフォルトモデル: `google-gemini-cli/gemini-3.1-pro-preview`
- エイリアス: `gemini-cli`
- インストール前提条件: ローカルで `gemini` として利用可能な Gemini CLI
  - Homebrew: `brew install gemini-cli`
  - npm: `npm install -g @google/gemini-cli`
- ログイン:

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

環境変数:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

（または `GEMINI_CLI_*` バリアント。）

ログイン後に Gemini CLI OAuth リクエストが失敗する場合は、
gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定し、
再試行してください。

ブラウザーフロー開始前にログインが失敗する場合は、ローカルの `gemini`
コマンドがインストールされており、`PATH` 上にあることを確認してください。OpenClaw は、
Homebrew インストールとグローバル npm インストールの両方をサポートしており、一般的な Windows / npm レイアウトも含まれます。

Gemini CLI JSON の使用に関する注意:

- reply テキストは CLI JSON の `response` フィールドから取得されます。
- CLI が `usage` を空のままにした場合、使用量は `stats` にフォールバックします。
- `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
- `stats.input` が欠けている場合、OpenClaw は
  `stats.input_tokens - stats.cached` から input token を導出します。

## 機能

| Capability             | Supported         |
| ---------------------- | ----------------- |
| Chat completions       | Yes               |
| Image generation       | Yes               |
| Image understanding    | Yes               |
| Audio transcription    | Yes               |
| Video understanding    | Yes               |
| Web search (Grounding) | Yes               |
| Thinking/reasoning     | Yes (Gemini 3.1+) |

## 直接の Gemini cache 再利用

直接の Gemini API 実行（`api: "google-generative-ai"`）では、OpenClaw は現在、
設定済みの `cachedContent` ハンドルを Gemini リクエストにそのまま渡します。

- モデル単位またはグローバルの params で
  `cachedContent` またはレガシーの `cached_content` のいずれかを設定します
- 両方ある場合は `cachedContent` が優先されます
- 例の値: `cachedContents/prebuilt-context`
- Gemini の cache hit 使用量は、上流の `cachedContentTokenCount` から
  OpenClaw の `cacheRead` に正規化されます

例:

```json5
{
  agents: {
    defaults: {
      models: {
        "google/gemini-2.5-pro": {
          params: {
            cachedContent: "cachedContents/prebuilt-context",
          },
        },
      },
    },
  },
}
```

## 画像生成

bundled の `google` 画像生成 provider は、デフォルトで
`google/gemini-3.1-flash-image-preview` を使用します。

- `google/gemini-3-pro-image-preview` もサポートします
- Generate: 1 リクエストあたり最大 4 枚の画像
- Edit mode: 有効、最大 5 枚の入力画像
- ジオメトリー制御: `size`、`aspectRatio`、`resolution`

OAuth 専用の `google-gemini-cli` provider は、別個の text inference
サーフェスです。画像生成、media understanding、および Gemini Grounding は引き続き
`google` provider id 上にあります。

## 環境に関する注意

Gateway が daemon（launchd/systemd）として実行される場合は、`GEMINI_API_KEY` が
そのプロセスから利用可能であることを確認してください（たとえば `~/.openclaw/.env` または
`env.shellEnv` 経由）。
