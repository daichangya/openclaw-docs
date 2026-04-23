---
read_when:
    - OpenClawでGrokモデルを使いたい場合
    - xAIの認証またはモデルIDを設定している場合
summary: OpenClawでxAI Grokモデルを使う
title: xAI
x-i18n:
    generated_at: "2026-04-23T04:50:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a9fd184bab6f7ab363487332752141212a89c7380f6f91a659c78bcc470c9b
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClawには、Grokモデル向けの同梱`xai` provider Pluginが含まれています。

## はじめに

<Steps>
  <Step title="APIキーを作成する">
    [xAI console](https://console.x.ai/)でAPIキーを作成します。
  </Step>
  <Step title="APIキーを設定する">
    `XAI_API_KEY`を設定するか、次を実行します:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="モデルを選ぶ">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClawは、同梱xAIトランスポートとしてxAI Responses APIを使用します。同じ`XAI_API_KEY`で、Grokベースの`web_search`、ファーストクラスの`x_search`、リモートの`code_execution`も利用できます。
`plugins.entries.xai.config.webSearch.apiKey`配下にxAIキーを保存すると、同梱xAIモデルproviderもそれをフォールバックとして再利用します。
`code_execution`の調整は`plugins.entries.xai.config.codeExecution`配下にあります。
</Note>

## 同梱モデルカタログ

OpenClawには、次のxAIモデルファミリーが最初から含まれています。

| ファミリー | モデルID |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3 | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast` |
| Grok 4 | `grok-4`, `grok-4-0709` |
| Grok 4 Fast | `grok-4-fast`, `grok-4-fast-non-reasoning` |
| Grok 4.1 Fast | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning` |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code | `grok-code-fast-1` |

このPluginは、同じAPI形状に従う新しい`grok-4*`および`grok-code-fast*` IDもフォワード解決します。

<Tip>
`grok-4-fast`、`grok-4-1-fast`、および`grok-4.20-beta-*`バリアントは、現在の同梱カタログで画像対応のGrok refです。
</Tip>

## OpenClawの機能カバレッジ

同梱Pluginは、xAIの現在の公開APIサーフェスを、動作が素直に適合する箇所でOpenClawの共有provider契約およびtool契約にマッピングします。

| xAI機能 | OpenClawサーフェス | 状態 |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses | `xai/<model>`モデルprovider | はい |
| サーバーサイドweb search | `web_search` provider `grok` | はい |
| サーバーサイドX search | `x_search` tool | はい |
| サーバーサイドcode execution | `code_execution` tool | はい |
| 画像 | `image_generate` | はい |
| 動画 | `video_generate` | はい |
| バッチtext-to-speech | `messages.tts.provider: "xai"` / `tts` | はい |
| ストリーミングTTS | — | 未公開。OpenClawのTTS契約は完全な音声バッファを返します |
| バッチspeech-to-text | `tools.media.audio` / media understanding | はい |
| ストリーミングspeech-to-text | Voice Call `streaming.provider: "xai"` | はい |
| リアルタイム音声 | — | まだ未公開。異なるsession/WebSocket契約 |
| ファイル / バッチ | 汎用モデルAPI互換のみ | ファーストクラスのOpenClaw toolではない |

<Note>
OpenClawは、media生成、speech、バッチ文字起こしにはxAIのREST image/video/TTS/STT APIを、ライブvoice-call文字起こしにはxAIのストリーミングSTT WebSocketを、モデル、search、code-execution toolsにはResponses APIを使用します。Realtime voice sessionのように異なるOpenClaw契約を必要とする機能は、隠れたPlugin動作ではなく、ここでは上流機能として記載されています。
</Note>

### Fast-modeマッピング

`/fast on`または`agents.defaults.models["xai/<model>"].params.fastMode: true`は、ネイティブxAIリクエストを次のように書き換えます。

| 元モデル | Fast-modeターゲット |
| ------------- | ------------------ |
| `grok-3` | `grok-3-fast` |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4` | `grok-4-fast` |
| `grok-4-0709` | `grok-4-fast` |

### レガシー互換エイリアス

レガシーエイリアスは引き続き正規の同梱IDに正規化されます。

| レガシーエイリアス | 正規ID |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning` | `grok-4-fast` |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast` |
| `grok-4.20-reasoning` | `grok-4.20-beta-latest-reasoning` |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 機能

<AccordionGroup>
  <Accordion title="Web search">
    同梱の`grok` web-search providerも`XAI_API_KEY`を使います:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="動画生成">
    同梱の`xai` Pluginは、共有`video_generate` toolを通じて動画生成を登録します。

    - デフォルトの動画モデル: `xai/grok-imagine-video`
    - モード: text-to-video、image-to-video、リモート動画編集、リモート動画延長
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - 解像度: `480P`, `720P`
    - 長さ: 生成/image-to-videoでは1〜15秒、延長では2〜10秒

    <Warning>
    ローカル動画バッファは受け付けられません。動画編集/延長入力にはリモート`http(s)` URLを使用してください。image-to-videoはローカル画像バッファを受け付けます。OpenClawがそれらをxAI向けのdata URLとしてエンコードできるためです。
    </Warning>

    xAIをデフォルトの動画providerとして使うには:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    共有toolパラメーター、provider選択、フォールオーバー動作については、[Video Generation](/ja-JP/tools/video-generation)を参照してください。
    </Note>

  </Accordion>

  <Accordion title="画像生成">
    同梱の`xai` Pluginは、共有`image_generate` toolを通じて画像生成を登録します。

    - デフォルトの画像モデル: `xai/grok-imagine-image`
    - 追加モデル: `xai/grok-imagine-image-pro`
    - モード: text-to-imageとreference-image編集
    - reference入力: 1つの`image`または最大5つの`images`
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 解像度: `1K`, `2K`
    - 枚数: 最大4画像

    OpenClawは、生成されたmediaを通常のchannel添付パスで保存および配信できるように、xAIに`b64_json`画像レスポンスを要求します。ローカルreference画像はdata URLへ変換され、リモート`http(s)` referenceはそのまま渡されます。

    xAIをデフォルトの画像providerとして使うには:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAIは、`quality`、`mask`、`user`、および`1:2`、`2:1`、`9:20`、`20:9`のような追加のネイティブ比率も文書化しています。OpenClawは現在、共有のクロスprovider画像コントロールのみを転送します。未対応のネイティブ専用ノブは、意図的に`image_generate`を通じて公開されていません。
    </Note>

  </Accordion>

  <Accordion title="text-to-speech">
    同梱の`xai` Pluginは、共有`tts` providerサーフェスを通じてtext-to-speechを登録します。

    - 音声: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - デフォルト音声: `eve`
    - 形式: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - 言語: BCP-47 codeまたは`auto`
    - 速度: providerネイティブの速度上書き
    - ネイティブのOpus音声メモ形式はサポートされません

    xAIをデフォルトのTTS providerとして使うには:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClawはxAIのバッチ`/v1/tts`エンドポイントを使います。xAIはWebSocket経由のストリーミングTTSも提供していますが、OpenClawのspeech provider契約は現在、返信配信前に完全な音声バッファを期待しています。
    </Note>

  </Accordion>

  <Accordion title="speech-to-text">
    同梱の`xai` Pluginは、OpenClawのmedia-understanding文字起こしサーフェスを通じてバッチspeech-to-textを登録します。

    - デフォルトモデル: `grok-stt`
    - エンドポイント: xAI REST `/v1/stt`
    - 入力パス: multipart音声ファイルアップロード
    - OpenClawでの対応箇所: inbound音声文字起こしが`tools.media.audio`を使う場所すべて。Discordのvoice-channelセグメントやchannel音声添付を含みます

    inbound音声文字起こしにxAIを強制するには:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    言語は共有のaudio media設定、または呼び出しごとの文字起こしリクエストで指定できます。promptヒントは共有OpenClawサーフェスで受け付けられますが、xAI REST STT統合は、現在の公開xAIエンドポイントに素直に対応するfile、model、languageのみを転送します。

  </Accordion>

  <Accordion title="ストリーミングspeech-to-text">
    同梱の`xai` Pluginは、ライブvoice-call音声向けのリアルタイム文字起こしproviderも登録します。

    - エンドポイント: xAI WebSocket `wss://api.x.ai/v1/stt`
    - デフォルトencoding: `mulaw`
    - デフォルトsample rate: `8000`
    - デフォルトendpointing: `800ms`
    - 中間文字起こし: デフォルトで有効

    Voice CallのTwilio media streamはG.711 µ-law音声フレームを送信するため、xAI providerはトランスコードなしでそれらのフレームを直接転送できます:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    providerが所有する設定は`plugins.entries.voice-call.config.streaming.providers.xai`配下にあります。対応するkeyは`apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw`、または`alaw`）、`interimResults`、`endpointingMs`、`language`です。

    <Note>
    このストリーミングproviderは、Voice Callのリアルタイム文字起こしパス向けです。Discord voiceは現在、短いセグメントを記録し、代わりにバッチの`tools.media.audio`文字起こしパスを使います。
    </Note>

  </Accordion>

  <Accordion title="x_search設定">
    同梱xAI Pluginは、Grok経由でX（旧Twitter）コンテンツを検索するためのOpenClaw toolとして`x_search`を公開します。

    設定パス: `plugins.entries.xai.config.xSearch`

    | Key | Type | Default | 説明 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled` | boolean | — | `x_search`を有効または無効にする |
    | `model` | string | `grok-4-1-fast` | `x_search`リクエストに使うモデル |
    | `inlineCitations` | boolean | — | 結果にインライン引用を含める |
    | `maxTurns` | number | — | 最大会話ターン数 |
    | `timeoutSeconds` | number | — | リクエストタイムアウト（秒） |
    | `cacheTtlMinutes` | number | — | キャッシュTTL（分） |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="code execution設定">
    同梱xAI Pluginは、xAIのsandbox環境でリモートコード実行を行うOpenClaw toolとして`code_execution`を公開します。

    設定パス: `plugins.entries.xai.config.codeExecution`

    | Key | Type | Default | 説明 |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled` | boolean | キーが利用可能なら`true` | code executionを有効または無効にする |
    | `model` | string | `grok-4-1-fast` | code executionリクエストに使うモデル |
    | `maxTurns` | number | — | 最大会話ターン数 |
    | `timeoutSeconds` | number | — | リクエストタイムアウト（秒） |

    <Note>
    これはローカルの[`exec`](/ja-JP/tools/exec)ではなく、リモートのxAI sandbox実行です。
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="既知の制限">
    - 認証は現時点ではAPIキーのみです。OpenClawにはまだxAI OAuthまたはdevice-codeフローはありません。
    - `grok-4.20-multi-agent-experimental-beta-0304`は、標準のOpenClaw xAIトランスポートとは異なる上流APIサーフェスを必要とするため、通常のxAI providerパスではサポートされません。
    - xAI Realtime voiceは、まだOpenClaw providerとして登録されていません。バッチSTTやストリーミング文字起こしとは異なる双方向音声session契約が必要です。
    - xAI画像の`quality`、画像`mask`、および追加のネイティブ専用アスペクト比は、共有`image_generate` toolに対応するクロスproviderコントロールが追加されるまで公開されません。
  </Accordion>

  <Accordion title="高度な注意点">
    - OpenClawは、共有runnerパス上でxAI固有のtool-schemaおよびtool-call互換修正を自動的に適用します。
    - ネイティブxAIリクエストはデフォルトで`tool_stream: true`です。無効にするには`agents.defaults.models["xai/<model>"].params.tool_stream`を`false`に設定してください。
    - 同梱xAIラッパーは、ネイティブxAIリクエスト送信前に、未対応のstrict tool-schemaフラグとreasoningペイロードkeyを除去します。
    - `web_search`、`x_search`、`code_execution`はOpenClaw toolsとして公開されます。OpenClawは、すべてのネイティブtoolを各チャットターンへ付与する代わりに、各toolリクエスト内で必要な特定のxAI組み込み機能を有効にします。
    - `x_search`と`code_execution`は、coreモデルランタイムにハードコードされているのではなく、同梱xAI Pluginが所有しています。
    - `code_execution`は、ローカルの[`exec`](/ja-JP/tools/exec)ではなく、リモートのxAI sandbox実行です。
  </Accordion>
</AccordionGroup>

## ライブテスト

xAIのmediaパスは、ユニットテストとオプトインのライブスイートでカバーされています。ライブコマンドは、`XAI_API_KEY`を確認する前に、`~/.profile`を含むログインshellからシークレットを読み込みます。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

provider固有のライブファイルは、通常のTTS、電話向けPCM TTS、xAIバッチSTTによる音声文字起こし、同じPCMをxAIリアルタイムSTTでストリーミング、text-to-image出力生成、reference画像編集を行います。共有画像ライブファイルは、OpenClawのランタイム選択、フォールバック、正規化、media添付パスを通じて同じxAI providerを検証します。

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    providerの選択、model ref、フォールオーバー動作。
  </Card>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    共有動画toolパラメーターとprovider選択。
  </Card>
  <Card title="All providers" href="/ja-JP/providers/index" icon="grid-2">
    より広いprovider概要。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的な問題と修正。
  </Card>
</CardGroup>
