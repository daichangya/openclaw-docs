---
read_when:
    - 音声添付ファイルに対してDeepgramのspeech-to-textを使いたい場合
    - Voice Call向けにDeepgramのストリーミング文字起こしを使いたい場合
    - Deepgramの簡単な設定例が必要な場合
summary: 受信音声メモ向けのDeepgram文字起こし
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T04:49:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddc55436ebae295db9bd979765fbccab3ba7f25a6f5354a4e7964d151faffa22
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram（音声文字起こし）

Deepgramはspeech-to-text APIです。OpenClawでは、`tools.media.audio`を通じた受信音声/音声メモの文字起こし、および`plugins.entries.voice-call.config.streaming`を通じたVoice CallのストリーミングSTTに使われます。

バッチ文字起こしでは、OpenClawは完全な音声ファイルをDeepgramにアップロードし、文字起こし結果を返信パイプライン（`{{Transcript}}` + `[Audio]`ブロック）に注入します。Voice Callストリーミングでは、OpenClawはライブのG.711 u-lawフレームをDeepgramのWebSocket `listen`エンドポイントへ転送し、Deepgramが返すたびに部分的または最終的な文字起こしを出力します。

| 詳細 | 値 |
| ------------- | ---------------------------------------------------------- |
| Webサイト | [deepgram.com](https://deepgram.com) |
| ドキュメント | [developers.deepgram.com](https://developers.deepgram.com) |
| 認証 | `DEEPGRAM_API_KEY` |
| デフォルトモデル | `nova-3` |

## はじめに

<Steps>
  <Step title="APIキーを設定する">
    Deepgram APIキーを環境変数に追加します:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="音声providerを有効にする">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="音声メモを送信する">
    接続済みchannelのいずれかを通じて音声メッセージを送信します。OpenClawがDeepgram経由で文字起こしし、その結果を返信パイプラインに注入します。
  </Step>
</Steps>

## 設定オプション

| オプション | パス | 説明 |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model` | `tools.media.audio.models[].model` | DeepgramモデルID（デフォルト: `nova-3`） |
| `language` | `tools.media.audio.models[].language` | 言語ヒント（任意） |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | 言語検出を有効にする（任意） |
| `punctuate` | `tools.media.audio.providerOptions.deepgram.punctuate` | 句読点を有効にする（任意） |
| `smart_format` | `tools.media.audio.providerOptions.deepgram.smart_format` | smart formattingを有効にする（任意） |

<Tabs>
  <Tab title="言語ヒントあり">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Deepgramオプションあり">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Voice CallストリーミングSTT

同梱の`deepgram` Pluginは、Voice Call Plugin向けのリアルタイム文字起こしproviderも登録します。

| 設定 | 設定パス | デフォルト |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| APIキー | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | `DEEPGRAM_API_KEY`にフォールバック |
| モデル | `...deepgram.model` | `nova-3` |
| 言語 | `...deepgram.language` | （未設定） |
| エンコーディング | `...deepgram.encoding` | `mulaw` |
| サンプルレート | `...deepgram.sampleRate` | `8000` |
| Endpointing | `...deepgram.endpointingMs` | `800` |
| 中間結果 | `...deepgram.interimResults` | `true` |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
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
Voice Callは、8 kHz G.711 u-lawの電話音声を受信します。Deepgramのストリーミングproviderはデフォルトで`encoding: "mulaw"`と`sampleRate: 8000`を使うため、Twilioのmediaフレームをそのまま転送できます。
</Note>

## 注意事項

<AccordionGroup>
  <Accordion title="認証">
    認証は標準のprovider認証順序に従います。最も簡単な方法は`DEEPGRAM_API_KEY`です。
  </Accordion>
  <Accordion title="プロキシとカスタムエンドポイント">
    プロキシを使用する場合は、`tools.media.audio.baseUrl`と`tools.media.audio.headers`でエンドポイントまたはヘッダーを上書きしてください。
  </Accordion>
  <Accordion title="出力動作">
    出力は、他のproviderと同じ音声ルール（サイズ上限、タイムアウト、文字起こし注入）に従います。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Media tools" href="/tools/media" icon="photo-film">
    音声、画像、動画の処理パイプライン概要。
  </Card>
  <Card title="Configuration" href="/ja-JP/gateway/configuration" icon="gear">
    media tool設定を含む完全な設定リファレンス。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的な問題とデバッグ手順。
  </Card>
  <Card title="FAQ" href="/ja-JP/help/faq" icon="circle-question">
    OpenClawセットアップに関するよくある質問。
  </Card>
</CardGroup>
