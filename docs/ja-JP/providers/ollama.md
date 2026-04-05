---
read_when:
    - Ollama 経由でクラウドまたはローカルモデルを使って OpenClaw を実行したい
    - Ollama のセットアップと設定方法が必要
summary: Ollama 経由でクラウドモデルとローカルモデルを使って OpenClaw を実行する
title: Ollama
x-i18n:
    generated_at: "2026-04-05T12:54:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 337b8ec3a7756e591e6d6f82e8ad13417f0f20c394ec540e8fc5756e0fc13c29
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama は、オープンソースモデルを自分のマシン上で簡単に実行できるローカル LLM ランタイムです。OpenClaw は Ollama のネイティブ API（`/api/chat`）と統合し、ストリーミングと tool calling をサポートし、`OLLAMA_API_KEY`（または auth profile）を設定して明示的な `models.providers.ollama` エントリーを定義していない場合は、ローカル Ollama モデルを自動検出できます。

<Warning>
**Remote Ollama ユーザー向け**: OpenClaw では `/v1` の OpenAI 互換 URL（`http://host:11434/v1`）を使わないでください。これでは tool calling が壊れ、モデルが raw tool JSON を平文として出力することがあります。代わりに、ネイティブ Ollama API URL を使ってください: `baseUrl: "http://host:11434"`（`/v1` なし）。
</Warning>

## クイックスタート

### オンボーディング（推奨）

Ollama をセットアップする最速の方法はオンボーディングです。

```bash
openclaw onboard
```

プロバイダー一覧から **Ollama** を選んでください。オンボーディングでは次を行います。

1. Ollama インスタンスに到達できる base URL を尋ねます（デフォルトは `http://127.0.0.1:11434`）。
2. **Cloud + Local**（クラウドモデル + ローカルモデル）または **Local**（ローカルモデルのみ）を選ばせます。
3. **Cloud + Local** を選び、まだ ollama.com にサインインしていない場合は、ブラウザーのサインインフローを開きます。
4. 利用可能なモデルを検出し、デフォルト候補を提案します。
5. 選択したモデルがローカルに存在しない場合は自動で pull します。

非対話モードもサポートされています。

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

必要に応じてカスタム base URL やモデルを指定できます。

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### 手動セットアップ

1. Ollama をインストール: [https://ollama.com/download](https://ollama.com/download)

2. ローカル推論を使いたい場合はローカルモデルを pull します。

```bash
ollama pull glm-4.7-flash
# または
ollama pull gpt-oss:20b
# または
ollama pull llama3.3
```

3. クラウドモデルも使いたい場合はサインインします。

```bash
ollama signin
```

4. オンボーディングを実行し、`Ollama` を選びます。

```bash
openclaw onboard
```

- `Local`: ローカルモデルのみ
- `Cloud + Local`: ローカルモデル + クラウドモデル
- `kimi-k2.5:cloud`、`minimax-m2.5:cloud`、`glm-5:cloud` のようなクラウドモデルには、ローカルの `ollama pull` は**不要**です

現在 OpenClaw が提案するもの:

- ローカルデフォルト: `glm-4.7-flash`
- クラウドデフォルト: `kimi-k2.5:cloud`、`minimax-m2.5:cloud`、`glm-5:cloud`

5. 手動セットアップを好む場合は、OpenClaw 用に直接 Ollama を有効化します（任意の値で動作します。Ollama 自体は実際のキーを必要としません）。

```bash
# 環境変数を設定
export OLLAMA_API_KEY="ollama-local"

# または設定ファイルに設定
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. モデルを確認または切り替えます。

```bash
openclaw models list
openclaw models set ollama/glm-4.7-flash
```

7. または config でデフォルトを設定します。

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## モデル検出（暗黙の provider）

`OLLAMA_API_KEY`（または auth profile）を設定し、**`models.providers.ollama` を定義していない**場合、OpenClaw は `http://127.0.0.1:11434` のローカル Ollama インスタンスからモデルを検出します。

- `/api/tags` に問い合わせる
- 利用可能な場合は、ベストエフォートで `/api/show` を参照して `contextWindow` を読む
- モデル名ヒューリスティック（`r1`、`reasoning`、`think`）で `reasoning` をマークする
- `maxTokens` は OpenClaw が使うデフォルトの Ollama max-token cap に設定する
- すべてのコストを `0` にする

これにより、カタログをローカル Ollama インスタンスと整合させたまま、手動のモデル定義を避けられます。

利用可能なモデルを確認するには:

```bash
ollama list
openclaw models list
```

新しいモデルを追加するには、単に Ollama で pull します。

```bash
ollama pull mistral
```

新しいモデルは自動的に検出され、すぐに使えるようになります。

`models.providers.ollama` を明示的に設定すると、自動検出はスキップされ、モデルを手動定義する必要があります（下記参照）。

## 設定

### 基本セットアップ（暗黙の検出）

Ollama を有効にする最も簡単な方法は環境変数です。

```bash
export OLLAMA_API_KEY="ollama-local"
```

### 明示的セットアップ（手動モデル）

明示的 config を使うのは次のような場合です。

- Ollama が別ホスト / 別ポートで動いている。
- 特定の context window や model list を強制したい。
- 完全に手動のモデル定義をしたい。

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

`OLLAMA_API_KEY` が設定されている場合は、provider エントリー内の `apiKey` を省略でき、OpenClaw が availability check 用に補います。

### カスタム base URL（明示的 config）

Ollama が別ホストまたは別ポートで動いている場合（明示的 config は自動検出を無効にするため、モデルは手動定義してください）:

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // /v1 なし - ネイティブ Ollama API URL を使う
        api: "ollama", // ネイティブの tool-calling 動作を保証するため明示的に設定
      },
    },
  },
}
```

<Warning>
URL に `/v1` を付けないでください。`/v1` パスは OpenAI 互換モードを使うため、tool calling の信頼性がありません。パス接尾辞のないベースの Ollama URL を使ってください。
</Warning>

### モデル選択

設定後は、すべての Ollama モデルが利用可能になります。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## クラウドモデル

クラウドモデルを使うと、ローカルモデルと並行してクラウドホスト型モデル（たとえば `kimi-k2.5:cloud`、`minimax-m2.5:cloud`、`glm-5:cloud`）を実行できます。

クラウドモデルを使うには、セットアップ中に **Cloud + Local** モードを選択してください。ウィザードはサインイン済みかどうかを確認し、必要であればブラウザーのサインインフローを開きます。認証が確認できない場合、ウィザードはローカルモデルのデフォルトにフォールバックします。

[ollama.com/signin](https://ollama.com/signin) で直接サインインすることもできます。

## Ollama Web Search

OpenClaw は、バンドル済みの `web_search`
provider として **Ollama Web Search** もサポートしています。

- 設定済みの Ollama host（
  `models.providers.ollama.baseUrl` が設定されていればそれ、なければ `http://127.0.0.1:11434`）を使います。
- キー不要です。
- Ollama が実行中であり、`ollama signin` でサインイン済みである必要があります。

`openclaw onboard` または
`openclaw configure --section web` で **Ollama Web Search** を選ぶか、次を設定してください。

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

完全なセットアップと動作の詳細については、[Ollama Web Search](/tools/ollama-search) を参照してください。

## 高度な設定

### Reasoning モデル

OpenClaw は、`deepseek-r1`、`reasoning`、`think` のような名前を持つモデルを、デフォルトで reasoning 対応として扱います。

```bash
ollama pull deepseek-r1:32b
```

### モデルコスト

Ollama は無料でローカル実行されるため、すべてのモデルコストは $0 に設定されます。

### ストリーミング設定

OpenClaw の Ollama 統合は、デフォルトで **ネイティブ Ollama API**（`/api/chat`）を使い、ストリーミングと tool calling の同時利用を完全にサポートします。特別な設定は不要です。

#### レガシー OpenAI 互換モード

<Warning>
**OpenAI 互換モードでは tool calling の信頼性がありません。** このモードは、OpenAI 形式だけをサポートするプロキシが必要で、ネイティブな tool calling 動作に依存しない場合にのみ使ってください。
</Warning>

代わりに OpenAI 互換 endpoint を使う必要がある場合（たとえば OpenAI 形式しかサポートしないプロキシの背後など）は、`api: "openai-completions"` を明示的に設定してください。

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // デフォルト: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

このモードでは、ストリーミング + tool calling を同時にサポートしないことがあります。モデル config の `params: { streaming: false }` でストリーミングを無効にする必要があるかもしれません。

Ollama で `api: "openai-completions"` を使う場合、Ollama が黙って 4096 context window にフォールバックしないよう、OpenClaw はデフォルトで `options.num_ctx` を注入します。プロキシ / 上流が未知の `options` フィールドを拒否する場合は、この動作を無効にしてください。

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: false,
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

### Context window

自動検出されたモデルでは、OpenClaw は利用可能な場合は Ollama が報告する context window を使い、そうでなければ OpenClaw が使うデフォルトの Ollama context window にフォールバックします。明示的な provider config では、`contextWindow` と `maxTokens` を上書きできます。

## トラブルシューティング

### Ollama が検出されない

Ollama が実行中であること、`OLLAMA_API_KEY`（または auth profile）を設定したこと、そして明示的な `models.providers.ollama` エントリーを**定義していない**ことを確認してください。

```bash
ollama serve
```

また、API に到達可能であることも確認してください。

```bash
curl http://localhost:11434/api/tags
```

### 利用可能なモデルがない

モデルが一覧に出ない場合は、次のいずれかです。

- モデルをローカルで pull する、または
- `models.providers.ollama` にモデルを明示的に定義する。

モデルを追加するには:

```bash
ollama list  # インストール済みモデルを確認
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # または別のモデル
```

### Connection refused

Ollama が正しいポートで動作しているか確認してください。

```bash
# Ollama が動作中か確認
ps aux | grep ollama

# または Ollama を再起動
ollama serve
```

## 関連項目

- [Model Providers](/concepts/model-providers) - すべての provider の概要
- [Model Selection](/concepts/models) - モデルの選び方
- [Configuration](/gateway/configuration) - 完全な config リファレンス
