---
read_when:
    - アウトバウンド返信に Inworld の音声合成を使用したい場合
    - Inworld から PCM の電話音声または OGG_OPUS のボイスノート出力が必要な場合
summary: OpenClaw の返信向け Inworld ストリーミング text-to-speech
title: Inworld
x-i18n:
    generated_at: "2026-04-26T11:39:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

Inworld はストリーミング text-to-speech（TTS）プロバイダです。OpenClaw では、アウトバウンド返信音声（デフォルトでは MP3、ボイスノートでは OGG_OPUS）と、Voice Call などの電話チャネル向け PCM 音声を合成します。

OpenClaw は Inworld のストリーミング TTS エンドポイントに POST し、返された base64 音声チャンクを 1 つのバッファに連結して、標準の返信音声パイプラインに渡します。

| 詳細        | 値                                                       |
| ------------- | ----------------------------------------------------------- |
| Web サイト       | [inworld.ai](https://inworld.ai)                            |
| ドキュメント          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| 認証          | `INWORLD_API_KEY`（HTTP Basic、Base64 ダッシュボード認証情報） |
| デフォルト音声 | `Sarah`                                                     |
| デフォルトモデル | `inworld-tts-1.5-max`                                       |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    Inworld ダッシュボード（Workspace > API Keys）から認証情報をコピーし、
    env var として設定します。この値は HTTP Basic
    認証情報としてそのまま送信されるため、再度 Base64 エンコードしたり bearer
    token に変換したりしないでください。

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="messages.tts で Inworld を選択する">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="メッセージを送信する">
    接続済みの任意のチャネルを通じて返信を送信します。OpenClaw は
    Inworld で音声を合成し、MP3 として配信します（チャネルがボイスノートを
    想定している場合は OGG_OPUS）。
  </Step>
</Steps>

## 設定オプション

| オプション        | パス                                         | 説明                                                       |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 ダッシュボード認証情報。`INWORLD_API_KEY` にフォールバックします。     |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Inworld API base URL を上書きします（デフォルトは `https://api.inworld.ai`）。 |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | 音声識別子（デフォルトは `Sarah`）。                               |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS model id（デフォルトは `inworld-tts-1.5-max`）。                     |
| `temperature` | `messages.tts.providers.inworld.temperature` | サンプリング temperature `0..2`（任意）。                           |

## 注記

<AccordionGroup>
  <Accordion title="認証">
    Inworld は、単一の Base64 エンコード済み認証文字列による HTTP Basic 認証を使用します。Inworld ダッシュボードからそのままコピーしてください。プロバイダは
    それを `Authorization: Basic <apiKey>` として追加のエンコードなしで送信するため、自分で Base64 エンコードしたり、bearer 形式のトークンを渡したりしないでください。
    同じ注意点については [TTS auth notes](/ja-JP/tools/tts#inworld-primary) も参照してください。
  </Accordion>
  <Accordion title="モデル">
    サポートされている model id: `inworld-tts-1.5-max`（デフォルト）、
    `inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="音声出力">
    返信ではデフォルトで MP3 を使用します。チャネルターゲットが `voice-note` の場合、
    OpenClaw は Inworld に `OGG_OPUS` を要求するため、音声はネイティブな
    ボイスバブルとして再生されます。電話音声合成では、電話ブリッジに渡すために
    22050 Hz の生 `PCM` を使用します。
  </Accordion>
  <Accordion title="カスタムエンドポイント">
    `messages.tts.providers.inworld.baseUrl` で API ホストを上書きします。
    リクエスト送信前に末尾のスラッシュは削除されます。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/ja-JP/tools/tts" icon="waveform-lines">
    TTS の概要、プロバイダ、`messages.tts` 設定。
  </Card>
  <Card title="Configuration" href="/ja-JP/gateway/configuration" icon="gear">
    `messages.tts` 設定を含む完全な設定リファレンス。
  </Card>
  <Card title="Providers" href="/ja-JP/providers" icon="grid">
    同梱されているすべての OpenClaw プロバイダ。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的な問題とデバッグ手順。
  </Card>
</CardGroup>
