---
read_when:
    - Ollama経由でクラウドモデルまたはローカルモデルを使ってOpenClawを実行したい場合
    - Ollamaのセットアップと設定ガイダンスが必要な場合
    - 画像理解のためにOllamaのvisionモデルを使いたい場合
summary: OpenClawをOllamaで実行する（クラウドモデルとローカルモデル）
title: Ollama
x-i18n:
    generated_at: "2026-04-23T04:50:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 704beed3bf988d6c2ad50b2a1533f6dcef655e44b34f23104827d2acb71b8655
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClawは、ホスト型クラウドモデルおよびローカル/セルフホスト型Ollamaサーバー向けに、OllamaのネイティブAPI（`/api/chat`）と統合します。Ollamaは3つのモードで使用できます: 到達可能なOllamaホスト経由の `Cloud + Local`、`https://ollama.com` を使う `Cloud only`、到達可能なOllamaホストに対する `Local only` です。

<Warning>
**リモートOllama利用者向け**: OpenClawで `/v1` のOpenAI互換URL（`http://host:11434/v1`）を使わないでください。これによりツール呼び出しが壊れ、モデルが生のツールJSONをプレーンテキストとして出力することがあります。代わりに、ネイティブOllama API URLを使ってください: `baseUrl: "http://host:11434"`（`/v1` なし）。
</Warning>

## はじめに

好みのセットアップ方法とモードを選んでください。

<Tabs>
  <Tab title="オンボーディング（推奨）">
    **最適なケース:** 動作するOllamaクラウドまたはローカルセットアップへの最短経路。

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard
        ```

        プロバイダー一覧から **Ollama** を選択します。
      </Step>
      <Step title="モードを選ぶ">
        - **Cloud + Local** — ローカルOllamaホスト + そのホスト経由でルーティングされるクラウドモデル
        - **Cloud only** — `https://ollama.com` 経由のホスト型Ollamaモデル
        - **Local only** — ローカルモデルのみ
      </Step>
      <Step title="モデルを選ぶ">
        `Cloud only` では `OLLAMA_API_KEY` を求められ、ホスト型クラウドのデフォルト候補が提示されます。`Cloud + Local` と `Local only` では、Ollamaのbase URLを尋ねられ、利用可能なモデルを検出し、選んだローカルモデルがまだ存在しなければ自動でpullします。`Cloud + Local` では、そのOllamaホストがクラウドアクセス用にサインイン済みかどうかも確認されます。
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### 非対話モード

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    必要に応じて、カスタムbase URLまたはモデルも指定できます。

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="手動セットアップ">
    **最適なケース:** クラウドまたはローカルセットアップを完全に制御したい場合。

    <Steps>
      <Step title="クラウドかローカルかを選ぶ">
        - **Cloud + Local**: Ollamaをインストールし、`ollama signin` でサインインし、そのホスト経由でクラウドリクエストをルーティングする
        - **Cloud only**: `https://ollama.com` と `OLLAMA_API_KEY` を使う
        - **Local only**: [ollama.com/download](https://ollama.com/download) からOllamaをインストールする
      </Step>
      <Step title="ローカルモデルをpullする（ローカルのみ）">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="OpenClawでOllamaを有効にする">
        `Cloud only` では実際の `OLLAMA_API_KEY` を使ってください。ホストベースのセットアップでは、任意のプレースホルダー値で動作します。

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="モデルを確認して設定する">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        または、設定でデフォルトを指定します。

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## クラウドモデル

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` は、ローカルモデルとクラウドモデルの両方の制御点として、到達可能なOllamaホストを使います。これはOllamaが推奨するハイブリッドフローです。

    セットアップ時に **Cloud + Local** を使ってください。OpenClawはOllamaのbase URLを尋ね、そのホストからローカルモデルを検出し、ホストが `ollama signin` によってクラウドアクセス用にサインイン済みかどうかを確認します。ホストがサインイン済みなら、OpenClawは `kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud` などのホスト型クラウドデフォルトも提示します。

    ホストがまだサインインしていない場合、OpenClawは `ollama signin` を実行するまでセットアップをローカル専用のまま維持します。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` は、`https://ollama.com` 上のOllamaホスト型APIに対して実行されます。

    セットアップ時に **Cloud only** を使ってください。OpenClawは `OLLAMA_API_KEY` を求め、`baseUrl: "https://ollama.com"` を設定し、ホスト型クラウドモデル一覧を初期投入します。この経路では、ローカルOllamaサーバーも `ollama signin` も不要です。

    `openclaw onboard` 中に表示されるクラウドモデル一覧は、`https://ollama.com/api/tags` からライブ取得され、500件に制限されます。そのため、ピッカーには静的な初期候補ではなく、現在のホスト型カタログが反映されます。セットアップ時に `ollama.com` に到達できない、またはモデルが返らない場合、OpenClawは以前のハードコード済み候補にフォールバックするため、オンボーディング自体は完了できます。

  </Tab>

  <Tab title="Local only">
    ローカル専用モードでは、OpenClawは設定されたOllamaインスタンスからモデルを検出します。この経路は、ローカルまたはセルフホスト型Ollamaサーバー向けです。

    OpenClawは現在、ローカルのデフォルトとして `gemma4` を提案します。

  </Tab>
</Tabs>

## モデル検出（暗黙プロバイダー）

`OLLAMA_API_KEY`（または認証プロファイル）を設定し、**`models.providers.ollama` を定義していない** 場合、OpenClawは `http://127.0.0.1:11434` にあるローカルOllamaインスタンスからモデルを検出します。

| 挙動             | 詳細                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| カタログ照会     | `/api/tags` を照会する                                                                                                                                             |
| 機能検出         | `/api/show` へのベストエフォート照会を使って `contextWindow` を読み取り、機能（visionを含む）を検出する                                                           |
| Visionモデル     | `/api/show` で `vision` 機能が報告されたモデルは、画像対応（`input: ["text", "image"]`）としてマークされるため、OpenClawが画像を自動的にプロンプトへ注入する |
| Reasoning検出    | モデル名ヒューリスティック（`r1`、`reasoning`、`think`）で `reasoning` をマークする                                                                                |
| トークン制限     | `maxTokens` は、OpenClawが使用するOllamaデフォルトのmax-token上限に設定される                                                                                     |
| コスト           | すべてのコストを `0` に設定する                                                                                                                                     |

これにより、ローカルOllamaインスタンスとカタログを整合させたまま、手動のモデル定義を避けられます。

```bash
# See what models are available
ollama list
openclaw models list
```

新しいモデルを追加するには、単にOllamaでpullしてください。

```bash
ollama pull mistral
```

新しいモデルは自動的に検出され、使用可能になります。

<Note>
`models.providers.ollama` を明示的に設定した場合、自動検出はスキップされ、モデルを手動で定義する必要があります。下の明示設定セクションを参照してください。
</Note>

## Visionと画像説明

バンドルされたOllama Pluginは、Ollamaを画像対応のメディア理解プロバイダーとして登録します。これにより、OpenClawは、明示的な画像説明要求や、設定されたimage-modelデフォルトを、ローカルまたはホスト型のOllama visionモデル経由でルーティングできます。

ローカルvisionでは、画像対応モデルをpullしてください。

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

その後、infer CLIで確認します。

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` は完全な `<provider/model>` 参照である必要があります。これが設定されている場合、`openclaw infer image describe` は、そのモデルがネイティブvisionをサポートしているため説明をスキップするのではなく、そのモデルを直接実行します。

受信メディア向けのデフォルト画像理解モデルとしてOllamaを使うには、`agents.defaults.imageModel` を設定してください。

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

`models.providers.ollama.models` を手動で定義する場合は、visionモデルを画像入力対応としてマークしてください。

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClawは、画像対応としてマークされていないモデルに対する画像説明要求を拒否します。暗黙の検出では、`/api/show` がvision機能を報告した場合に、OpenClawがこれをOllamaから読み取ります。

## 設定

<Tabs>
  <Tab title="Basic（暗黙検出）">
    最も簡単なローカル専用の有効化経路は、環境変数を使う方法です。

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` が設定されていれば、プロバイダーエントリーで `apiKey` を省略でき、OpenClawが可用性チェック用に補完します。
    </Tip>

  </Tab>

  <Tab title="Explicit（手動モデル）">
    ホスト型クラウド設定を使いたい場合、Ollamaが別ホスト/ポートで動いている場合、特定のcontext windowやモデル一覧を強制したい場合、または完全に手動でモデル定義したい場合は、明示設定を使ってください。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Custom base URL">
    Ollamaが別のホストまたはポートで動いている場合（明示設定では自動検出が無効になるため、モデルを手動で定義してください）:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
          },
        },
      },
    }
    ```

    <Warning>
    URLに `/v1` を追加しないでください。`/v1` 経路はOpenAI互換モードを使うため、ツール呼び出しの信頼性がありません。パス接尾辞なしのベースOllama URLを使ってください。
    </Warning>

  </Tab>
</Tabs>

### モデル選択

設定すると、すべてのOllamaモデルが使用可能になります。

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

## Ollama Web Search

OpenClawは、バンドルされた `web_search` プロバイダーとして **Ollama Web Search** をサポートしています。

| Property    | Detail                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| Host        | 設定済みのOllamaホストを使用（`models.providers.ollama.baseUrl` が設定されていればそれを、そうでなければ `http://127.0.0.1:11434`） |
| Auth        | キー不要                                                                                                          |
| Requirement | Ollamaが実行中で、`ollama signin` によりサインイン済みである必要がある                                                         |

`openclaw onboard` または `openclaw configure --section web` のときに **Ollama Web Search** を選ぶか、次を設定してください:

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

<Note>
完全なセットアップと挙動の詳細については、[Ollama Web Search](/ja-JP/tools/ollama-search) を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="レガシーOpenAI互換モード">
    <Warning>
    **OpenAI互換モードではツール呼び出しの信頼性がありません。** このモードは、プロキシのためにOpenAI形式が必要で、ネイティブなツール呼び出し挙動に依存しない場合にのみ使用してください。
    </Warning>

    OpenAI互換エンドポイントを使う必要がある場合（たとえば、OpenAI形式しかサポートしないプロキシの背後にある場合）は、`api: "openai-completions"` を明示的に設定してください。

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

    このモードでは、ストリーミングとツール呼び出しを同時にサポートしないことがあります。モデル設定で `params: { streaming: false }` を設定して、ストリーミングを無効にする必要がある場合があります。

    Ollamaで `api: "openai-completions"` を使う場合、Ollamaが黙って4096のcontext windowへフォールバックしないように、OpenClawはデフォルトで `options.num_ctx` を注入します。プロキシ/上流が未知の `options` フィールドを拒否する場合は、この挙動を無効にしてください。

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

  </Accordion>

  <Accordion title="Context windows">
    自動検出されたモデルでは、利用可能ならOpenClawはOllamaが報告したcontext windowを使い、そうでなければOpenClawが使用するOllamaのデフォルトcontext windowへフォールバックします。

    明示的なプロバイダー設定では、`contextWindow` と `maxTokens` を上書きできます。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Reasoningモデル">
    OpenClawは、`deepseek-r1`、`reasoning`、`think` などの名前を持つモデルを、デフォルトでreasoning対応として扱います。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    追加設定は不要です。OpenClawが自動的にマークします。

  </Accordion>

  <Accordion title="モデルコスト">
    Ollamaは無料でローカル実行されるため、すべてのモデルコストは $0 に設定されます。これは、自動検出モデルにも手動定義モデルにも適用されます。
  </Accordion>

  <Accordion title="Memory embeddings">
    バンドルされたOllama Pluginは、
    [memory search](/ja-JP/concepts/memory) 向けのmemory embeddingプロバイダーを登録します。設定されたOllama base URL
    とAPIキーを使用します。

    | Property      | Value               |
    | ------------- | ------------------- |
    | デフォルトモデル | `nomic-embed-text`  |
    | Auto-pull     | はい — embeddingモデルがローカルに存在しない場合は自動的にpullされます |

    Ollamaをmemory searchのembeddingプロバイダーとして選択するには:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ストリーミング設定">
    OpenClawのOllama統合は、デフォルトで **ネイティブOllama API**（`/api/chat`）を使います。これは、ストリーミングとツール呼び出しの同時利用を完全にサポートします。特別な設定は不要です。

    ネイティブ `/api/chat` リクエストでは、OpenClawはthinking制御も直接Ollamaへ渡します: `/think off` と `openclaw agent --thinking off` はトップレベルの `think: false` を送信し、`off` 以外のthinkingレベルでは `think: true` を送信します。

    <Tip>
    OpenAI互換エンドポイントを使う必要がある場合は、上の「レガシーOpenAI互換モード」セクションを参照してください。そのモードでは、ストリーミングとツール呼び出しが同時に動作しないことがあります。
    </Tip>

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Ollamaが検出されない">
    Ollamaが実行中であること、`OLLAMA_API_KEY`（または認証プロファイル）を設定していること、そして明示的な `models.providers.ollama` エントリーを**定義していない**ことを確認してください。

    ```bash
    ollama serve
    ```

    APIにアクセスできることを確認します。

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="利用可能なモデルがない">
    モデルが一覧に表示されない場合は、ローカルでモデルをpullするか、`models.providers.ollama` に明示的に定義してください。

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="接続が拒否される">
    Ollamaが正しいポートで動作していることを確認してください。

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
さらにヘルプが必要な場合: [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="Model providers" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、およびフェイルオーバー動作の概要。
  </Card>
  <Card title="Model selection" href="/ja-JP/concepts/models" icon="brain">
    モデルの選び方と設定方法。
  </Card>
  <Card title="Ollama Web Search" href="/ja-JP/tools/ollama-search" icon="magnifying-glass">
    Ollamaを使ったweb searchの完全なセットアップと挙動の詳細。
  </Card>
  <Card title="Configuration" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
</CardGroup>
