---
read_when:
    - OpenClawでMistral modelを使いたいです
    - Voice CallでVoxtral realtime transcriptionを使いたいです
    - Mistral API keyのオンボーディングとmodel refが必要です
summary: OpenClawでMistral modelとVoxtral transcriptionを使う
title: Mistral
x-i18n:
    generated_at: "2026-04-23T04:50:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8aec3c47fee12588b28ea2b652b89f0ff136399d25ca47174d7cb6e7b5d5d97f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClawは、テキスト/画像modelルーティング（`mistral/...`）と、
media understandingにおけるVoxtral経由の音声文字起こしの両方でMistralをサポートします。
Mistralは、memory embedding（`memorySearch.provider = "mistral"`）にも使用できます。

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions（`https://api.mistral.ai/v1`）

## はじめに

<Steps>
  <Step title="API keyを取得する">
    [Mistral Console](https://console.mistral.ai/) でAPI keyを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    または、keyを直接渡します。

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="デフォルトmodelを設定する">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="modelが利用可能か確認する">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 組み込みLLMカタログ

OpenClawには現在、次のMistralカタログが同梱されています。

| Model ref                        | Input       | Context | Max output | Notes                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384     | デフォルトmodel                                                    |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384     | Mistral Small 4。API `reasoning_effort` によるadjustable reasoning対応 |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096      | コーディング                                                           |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000 | 40,000     | reasoning有効                                                |

## 音声文字起こし（Voxtral）

media understanding
pipeline経由のバッチ音声文字起こしにVoxtralを使います。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
media文字起こし経路では `/v1/audio/transcriptions` を使います。Mistralのデフォルト音声modelは `voxtral-mini-latest` です。
</Tip>

## Voice CallストリーミングSTT

同梱の `mistral` pluginは、Voxtral RealtimeをVoice Callの
ストリーミングSTT providerとして登録します。

| Setting      | Config path                                                            | Default                                 |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API key      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | `MISTRAL_API_KEY` にフォールバック         |
| Model        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Encoding     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Sample rate  | `...mistral.sampleRate`                                                | `8000`                                  |
| Target delay | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClawは、Voice Call
がTwilio media frameを直接転送できるように、Mistral realtime STTのデフォルトを8 kHzの `pcm_mulaw` にしています。上流streamがすでにraw PCMである場合にのみ、`encoding: "pcm_s16le"` と対応する `sampleRate` を使ってください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Adjustable reasoning（mistral-small-latest）">
    `mistral/mistral-small-latest` はMistral Small 4に対応し、Chat Completions APIで `reasoning_effort` を通じた[adjustable reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) をサポートします（`none` は出力中の余分なthinkingを最小化し、`high` は最終回答の前に完全なthinking traceを出力します）。

    OpenClawは、sessionの **thinking** レベルをMistralのAPIへ次のようにマッピングします。

    | OpenClawのthinkingレベル                          | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    他の同梱Mistralカタログmodelではこのパラメータは使われません。Mistral本来のreasoning優先動作を使いたい場合は、引き続き `magistral-*` modelを使ってください。
    </Note>

  </Accordion>

  <Accordion title="メモリembedding">
    Mistralは `/v1/embeddings` 経由でmemory embeddingを提供できます（デフォルトmodel: `mistral-embed`）。

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Authとbase URL">
    - Mistral authは `MISTRAL_API_KEY` を使います。
    - Provider base URLのデフォルトは `https://api.mistral.ai/v1` です。
    - オンボーディング時のデフォルトmodelは `mistral/mistral-large-latest` です。
    - Z.AIはAPI keyによるBearer authを使います。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、およびfailover動作の選び方。
  </Card>
  <Card title="Media understanding" href="/tools/media-understanding" icon="microphone">
    音声文字起こしの設定とprovider選択。
  </Card>
</CardGroup>
