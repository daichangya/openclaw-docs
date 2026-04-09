---
read_when:
    - Ollama経由でクラウドまたはローカルモデルを使ってOpenClawを実行したい
    - Ollamaのセットアップと設定ガイダンスが必要
summary: Ollama経由でOpenClawを実行する（クラウドモデルとローカルモデル）
title: Ollama
x-i18n:
    generated_at: "2026-04-09T01:31:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3295a7c879d3636a2ffdec05aea6e670e54a990ef52bd9b0cae253bc24aa3f7
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollamaは、オープンソースモデルを自分のマシンで簡単に実行できるローカルLLMランタイムです。OpenClawはOllamaのネイティブAPI（`/api/chat`）と統合されており、ストリーミングとツール呼び出しをサポートします。また、`OLLAMA_API_KEY`（または認証プロファイル）を使ってオプトインし、明示的な`models.providers.ollama`エントリーを定義していない場合、ローカルのOllamaモデルを自動検出できます。

<Warning>
**リモートOllama利用者向け**: OpenClawで`/v1`のOpenAI互換URL（`http://host:11434/v1`）を使用しないでください。これによりツール呼び出しが壊れ、モデルが生のツールJSONをプレーンテキストとして出力することがあります。代わりに、ネイティブのOllama API URLを使用してください: `baseUrl: "http://host:11434"`（`/v1`なし）。
</Warning>

## クイックスタート

### オンボーディング（推奨）

Ollamaをセットアップする最も速い方法は、オンボーディングを使うことです:

```bash
openclaw onboard
```

プロバイダー一覧から**Ollama**を選択します。オンボーディングでは次のことを行います:

1. Ollamaインスタンスに到達できるbase URLを尋ねます（デフォルトは`http://127.0.0.1:11434`）。
2. **Cloud + Local**（クラウドモデルとローカルモデル）または**Local**（ローカルモデルのみ）を選べます。
3. **Cloud + Local**を選択し、まだollama.comにサインインしていない場合は、ブラウザーのサインインフローを開きます。
4. 利用可能なモデルを検出し、デフォルト候補を提案します。
5. 選択したモデルがローカルで利用できない場合は、自動でpullします。

非対話モードにも対応しています:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

必要に応じてカスタムbase URLまたはモデルを指定することもできます:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### 手動セットアップ

1. Ollamaをインストールします: [https://ollama.com/download](https://ollama.com/download)

2. ローカル推論を使いたい場合は、ローカルモデルをpullします:

```bash
ollama pull gemma4
# または
ollama pull gpt-oss:20b
# または
ollama pull llama3.3
```

3. クラウドモデルも使いたい場合は、サインインします:

```bash
ollama signin
```

4. オンボーディングを実行して`Ollama`を選択します:

```bash
openclaw onboard
```

- `Local`: ローカルモデルのみ
- `Cloud + Local`: ローカルモデルとクラウドモデル
- `kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`のようなクラウドモデルには、ローカルの`ollama pull`は不要です

OpenClawが現在提案するモデル:

- ローカルのデフォルト: `gemma4`
- クラウドのデフォルト: `kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`

5. 手動セットアップを使いたい場合は、OpenClawでOllamaを直接有効化します（任意の値で構いません。Ollamaに実際のキーは不要です）:

```bash
# 環境変数を設定
export OLLAMA_API_KEY="ollama-local"

# または設定ファイルに設定
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. モデルを確認または切り替えます:

```bash
openclaw models list
openclaw models set ollama/gemma4
```

7. または、configでデフォルトを設定します:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/gemma4" },
    },
  },
}
```

## モデル検出（暗黙のプロバイダー）

`OLLAMA_API_KEY`（または認証プロファイル）を設定し、**`models.providers.ollama`を定義していない**場合、OpenClawは`http://127.0.0.1:11434`にあるローカルOllamaインスタンスからモデルを検出します:

- `/api/tags`を問い合わせます
- 可能な場合は、最善努力の`/api/show`検索を使って`contextWindow`を読み取り、機能（visionを含む）を検出します
- `/api/show`が報告する`vision`機能を持つモデルは、画像対応（`input: ["text", "image"]`）としてマークされるため、OpenClawはそれらのモデルのプロンプトに画像を自動挿入します
- モデル名ヒューリスティック（`r1`、`reasoning`、`think`）で`reasoning`をマークします
- `maxTokens`は、OpenClawが使用するデフォルトのOllama max-token上限に設定します
- すべてのコストを`0`に設定します

これにより、カタログをローカルOllamaインスタンスに合わせたまま、手動のモデルエントリーを省けます。

利用可能なモデルを確認するには:

```bash
ollama list
openclaw models list
```

新しいモデルを追加するには、Ollamaでpullするだけです:

```bash
ollama pull mistral
```

新しいモデルは自動的に検出され、使用可能になります。

`models.providers.ollama`を明示的に設定すると、自動検出はスキップされ、モデルを手動で定義する必要があります（下記参照）。

## 設定

### 基本セットアップ（暗黙の検出）

Ollamaを有効にする最も簡単な方法は、環境変数を使うことです:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### 明示的セットアップ（手動モデル）

次の場合は明示的なconfigを使用してください:

- Ollamaが別のホスト/ポートで動作している。
- 特定のcontext windowまたはモデル一覧を強制したい。
- 完全に手動のモデル定義を使いたい。

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

`OLLAMA_API_KEY`が設定されている場合、プロバイダーエントリー内の`apiKey`は省略でき、OpenClawが可用性チェック用に補います。

### カスタムbase URL（明示的config）

Ollamaが別のホストまたはポートで動作している場合（明示的configでは自動検出が無効になるため、モデルを手動定義してください）:

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // /v1 なし - ネイティブOllama API URLを使う
        api: "ollama", // ネイティブのツール呼び出し動作を確実にするため明示的に設定
      },
    },
  },
}
```

<Warning>
URLに`/v1`を追加しないでください。`/v1`パスはOpenAI互換モードを使用するため、ツール呼び出しの信頼性がありません。パス接尾辞のないOllama base URLを使用してください。
</Warning>

### モデル選択

設定が完了すると、すべてのOllamaモデルが利用可能になります:

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

クラウドモデルを使うと、ローカルモデルと並行してクラウドホスト型モデル（たとえば`kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`）を実行できます。

クラウドモデルを使うには、セットアップ中に**Cloud + Local**モードを選択してください。ウィザードはサインイン済みかどうかを確認し、必要な場合はブラウザーのサインインフローを開きます。認証を確認できない場合、ウィザードはローカルモデルのデフォルトにフォールバックします。

[ollama.com/signin](https://ollama.com/signin)で直接サインインすることもできます。

## Ollama Web Search

OpenClawは、同梱の`web_search`
プロバイダーとして**Ollama Web Search**もサポートしています。

- 設定済みのOllamaホストを使用します（`models.providers.ollama.baseUrl`が
  設定されている場合はそれ、そうでなければ`http://127.0.0.1:11434`）。
- キー不要です。
- Ollamaが起動しており、`ollama signin`でサインイン済みである必要があります。

`openclaw onboard`または
`openclaw configure --section web`で**Ollama Web Search**を選択するか、次を設定してください:

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

セットアップ全体と動作の詳細については、[Ollama Web Search](/ja-JP/tools/ollama-search)を参照してください。

## 高度な設定

### Reasoningモデル

OpenClawは、`deepseek-r1`、`reasoning`、`think`のような名前を持つモデルを、デフォルトでreasoning対応として扱います:

```bash
ollama pull deepseek-r1:32b
```

### モデルコスト

Ollamaは無料でローカル実行されるため、すべてのモデルコストは$0に設定されます。

### ストリーミング設定

OpenClawのOllama統合は、デフォルトで**ネイティブのOllama API**（`/api/chat`）を使用し、ストリーミングとツール呼び出しの同時利用を完全にサポートします。特別な設定は不要です。

#### レガシーOpenAI互換モード

<Warning>
**OpenAI互換モードではツール呼び出しの信頼性がありません。** このモードは、プロキシのためにOpenAI形式が必要で、ネイティブのツール呼び出し動作に依存しない場合にのみ使ってください。
</Warning>

代わりにOpenAI互換エンドポイントを使う必要がある場合（たとえば、OpenAI形式しかサポートしないプロキシの背後にある場合）は、`api: "openai-completions"`を明示的に設定してください:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // default: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

このモードでは、ストリーミングとツール呼び出しを同時にサポートしないことがあります。モデルconfigで`params: { streaming: false }`としてストリーミングを無効化する必要がある場合があります。

Ollamaで`api: "openai-completions"`を使う場合、OpenClawはデフォルトで`options.num_ctx`を注入するため、Ollamaが黙って4096のcontext windowにフォールバックすることを防げます。プロキシまたは上流が未知の`options`フィールドを拒否する場合は、この動作を無効にしてください:

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

自動検出されたモデルでは、OpenClawは可能な場合はOllamaが報告するcontext windowを使用し、そうでなければOpenClawが使用するデフォルトのOllama context windowにフォールバックします。明示的なプロバイダーconfigでは、`contextWindow`と`maxTokens`を上書きできます。

## トラブルシューティング

### Ollamaが検出されない

Ollamaが起動していること、`OLLAMA_API_KEY`（または認証プロファイル）を設定していること、そして**明示的な`models.providers.ollama`エントリーを定義していない**ことを確認してください:

```bash
ollama serve
```

また、APIにアクセスできることを確認してください:

```bash
curl http://localhost:11434/api/tags
```

### 利用可能なモデルがない

モデルが一覧に表示されない場合は、次のいずれかです:

- モデルをローカルでpullする、または
- `models.providers.ollama`でモデルを明示的に定義する。

モデルを追加するには:

```bash
ollama list  # インストール済みのものを確認
ollama pull gemma4
ollama pull gpt-oss:20b
ollama pull llama3.3     # または別のモデル
```

### Connection refused

Ollamaが正しいポートで動作していることを確認してください:

```bash
# Ollamaが動作中か確認
ps aux | grep ollama

# またはOllamaを再起動
ollama serve
```

## 関連項目

- [Model Providers](/ja-JP/concepts/model-providers) - すべてのプロバイダーの概要
- [Model Selection](/ja-JP/concepts/models) - モデルの選び方
- [Configuration](/ja-JP/gateway/configuration) - 完全な設定リファレンス
