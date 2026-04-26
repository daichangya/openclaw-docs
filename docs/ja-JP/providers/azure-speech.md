---
read_when:
    - アウトバウンド返信に Azure Speech の音声合成を使用したい場合
    - Azure Speech からネイティブな Ogg Opus ボイスノート出力が必要な場合
summary: OpenClaw の返信向け Azure AI Speech text-to-speech
title: Azure Speech
x-i18n:
    generated_at: "2026-04-26T11:38:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 15
---

Azure Speech は Azure AI Speech の text-to-speech プロバイダです。OpenClaw では、アウトバウンド返信音声をデフォルトで MP3、ボイスノート向けにはネイティブな Ogg/Opus、Voice Call などの電話チャネル向けには 8 kHz mulaw 音声として合成します。

OpenClaw は Azure Speech REST API を SSML とともに直接使用し、プロバイダ所有の出力形式を `X-Microsoft-OutputFormat` で送信します。

| 詳細                  | 値                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Web サイト                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| ドキュメント                    | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| 認証                    | `AZURE_SPEECH_KEY` と `AZURE_SPEECH_REGION`                                                                  |
| デフォルト音声           | `en-US-JennyNeural`                                                                                            |
| デフォルトのファイル出力     | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| デフォルトのボイスノートファイル出力 | `ogg-24khz-16bit-mono-opus`                                                                                    |

## はじめに

<Steps>
  <Step title="Azure Speech リソースを作成する">
    Azure ポータルで Speech リソースを作成します。Resource Management > Keys and Endpoint から **KEY 1** をコピーし、`eastus` などのリソースのロケーションもコピーします。

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="messages.tts で Azure Speech を選択する">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="メッセージを送信する">
    接続済みの任意のチャネルを通じて返信を送信します。OpenClaw は Azure Speech で音声を合成し、標準音声には MP3 を、チャネルがボイスノートを想定している場合は Ogg/Opus を配信します。
  </Step>
</Steps>

## 設定オプション

| オプション                  | パス                                                        | 説明                                                                                           |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Azure Speech リソースキー。`AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY`、または `SPEECH_KEY` にフォールバックします。 |
| `region`                | `messages.tts.providers.azure-speech.region`                | Azure Speech リソースリージョン。`AZURE_SPEECH_REGION` または `SPEECH_REGION` にフォールバックします。                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | 任意の Azure Speech endpoint/base URL 上書き。                                                     |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | 任意の Azure Speech base URL 上書き。                                                              |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | Azure 音声の ShortName（デフォルトは `en-US-JennyNeural`）。                                                  |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | SSML 言語コード（デフォルトは `en-US`）。                                                                 |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | 音声ファイルの出力形式（デフォルトは `audio-24khz-48kbitrate-mono-mp3`）。                                 |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | ボイスノートの出力形式（デフォルトは `ogg-24khz-16bit-mono-opus`）。                                       |

## 注記

<AccordionGroup>
  <Accordion title="認証">
    Azure Speech は Azure OpenAI キーではなく、Speech リソースキーを使用します。キーは `Ocp-Apim-Subscription-Key` として送信されます。OpenClaw は、`endpoint` または `baseUrl` を指定しない限り、`region` から
    `https://<region>.tts.speech.microsoft.com` を導出します。
  </Accordion>
  <Accordion title="音声名">
    たとえば `en-US-JennyNeural` のように、Azure Speech 音声の `ShortName` 値を使用します。同梱プロバイダは同じ Speech リソースを通じて音声一覧を取得でき、deprecated または retired とマークされた音声を除外します。
  </Accordion>
  <Accordion title="音声出力">
    Azure は `audio-24khz-48kbitrate-mono-mp3`、
    `ogg-24khz-16bit-mono-opus`、`riff-24khz-16bit-mono-pcm` などの出力形式を受け付けます。OpenClaw は `voice-note` ターゲットに対して Ogg/Opus を要求するため、チャネルは追加の MP3 変換なしでネイティブなボイスバブルを送信できます。
  </Accordion>
  <Accordion title="別名">
    `azure` は既存の PR とユーザー設定のためのプロバイダ別名として受け付けられますが、Azure OpenAI モデルプロバイダとの混同を避けるため、新しい設定では `azure-speech` を使用してください。
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
