---
read_when:
    - OpenClaw で Google Gemini モデルを使用したい場合
    - API key または OAuth の認証フローが必要です
summary: Google Gemini のセットアップ（API key と OAuth、画像生成、メディア理解、TTS、Web 検索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-04-26T11:38:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 312c7a5bc433831d98d1d47c42c5cac6a4cd8d4948ddbf16f1ae11aaec7a0339
    source_path: providers/google.md
    workflow: 15
---

Google Plugin は、Google AI Studio を通じて Gemini モデルへのアクセスに加え、
Gemini Grounding による画像生成、メディア理解（画像/音声/動画）、text-to-speech、および Web 検索を提供します。

- Provider: `google`
- 認証: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- ランタイムオプション: `agents.defaults.agentRuntime.id: "google-gemini-cli"` は、
  モデル ref を `google/*` の正規形のままに保ちつつ、Gemini CLI OAuth を再利用します。

## はじめに

好みの認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API key">
    **最適な用途:** Google AI Studio を通じた標準の Gemini API アクセス。

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        または、key を直接渡します。

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    環境変数 `GEMINI_API_KEY` と `GOOGLE_API_KEY` はどちらも受け付けられます。すでに設定している方を使用してください。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最適な用途:** 別個の API key ではなく、既存の Gemini CLI ログインを PKCE OAuth 経由で再利用すること。

    <Warning>
    `google-gemini-cli` provider は非公式の統合です。この方法で OAuth を使用すると、アカウント制限が発生したという報告があります。自己責任で使用してください。
    </Warning>

    <Steps>
      <Step title="Gemini CLI をインストールする">
        ローカルの `gemini` コマンドが `PATH` 上で利用可能である必要があります。

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw は、一般的な Windows/npm レイアウトを含め、Homebrew インストールとグローバル npm インストールの両方をサポートしています。
      </Step>
      <Step title="OAuth でログインする">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - デフォルトモデル: `google/gemini-3.1-pro-preview`
    - ランタイム: `google-gemini-cli`
    - エイリアス: `gemini-cli`

    **環境変数:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    （または `GEMINI_CLI_*` バリアント。）

    <Note>
    ログイン後に Gemini CLI OAuth リクエストが失敗する場合は、gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定して再試行してください。
    </Note>

    <Note>
    ブラウザフローが始まる前にログインが失敗する場合は、ローカルの `gemini` コマンドがインストールされており、`PATH` 上にあることを確認してください。
    </Note>

    `google-gemini-cli/*` の model ref はレガシー互換エイリアスです。新しい
    config では、ローカル Gemini CLI 実行を使いたい場合、`google/*` の model ref と `google-gemini-cli` ランタイムを組み合わせて使用してください。

  </Tab>
</Tabs>

## 機能

| Capability             | サポート状況                  |
| ---------------------- | ----------------------------- |
| Chat completions       | はい                          |
| Image generation       | はい                          |
| Music generation       | はい                          |
| Text-to-speech         | はい                          |
| Realtime voice         | はい（Google Live API）       |
| Image understanding    | はい                          |
| Audio transcription    | はい                          |
| Video understanding    | はい                          |
| Web search (Grounding) | はい                          |
| Thinking/reasoning     | はい（Gemini 2.5+ / Gemini 3+） |
| Gemma 4 models         | はい                          |

<Tip>
Gemini 3 モデルは `thinkingBudget` ではなく `thinkingLevel` を使用します。OpenClaw は
Gemini 3、Gemini 3.1、および `gemini-*-latest` エイリアスの reasoning 制御を
`thinkingLevel` にマッピングするため、default/low-latency 実行では無効化された
`thinkingBudget` 値は送信されません。

`/think adaptive` は、固定の OpenClaw レベルを選ぶ代わりに、Google の動的 thinking セマンティクスを維持します。Gemini 3 と Gemini 3.1 では、Google がレベルを選べるよう固定の `thinkingLevel` を省略します。Gemini 2.5 では Google の動的 sentinel
`thinkingBudget: -1` を送信します。

Gemma 4 モデル（たとえば `gemma-4-26b-a4b-it`）は thinking mode をサポートします。OpenClaw は
Gemma 4 向けに `thinkingBudget` をサポートされる Google の `thinkingLevel` に書き換えます。
thinking を `off` に設定すると、`MINIMAL` にマッピングされるのではなく、thinking 無効のまま維持されます。
</Tip>

## 画像生成

同梱の `google` 画像生成 provider のデフォルトは
`google/gemini-3.1-flash-image-preview` です。

- `google/gemini-3-pro-image-preview` もサポート
- 生成: リクエストごとに最大4枚の画像
- 編集モード: 有効、入力画像は最大5枚
- ジオメトリ制御: `size`、`aspectRatio`、`resolution`

Google をデフォルトの画像 provider として使用するには:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
共有 tool パラメーター、provider 選択、およびフェイルオーバー動作については、[Image Generation](/ja-JP/tools/image-generation) を参照してください。
</Note>

## 動画生成

同梱の `google` Plugin は、共有の
`video_generate` tool を通じて動画生成も登録します。

- デフォルト動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: text-to-video、image-to-video、および単一動画参照フロー
- `aspectRatio`、`resolution`、`audio` をサポート
- 現在の duration 制限: **4〜8秒**

Google をデフォルトの動画 provider として使用するには:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
共有 tool パラメーター、provider 選択、およびフェイルオーバー動作については、[Video Generation](/ja-JP/tools/video-generation) を参照してください。
</Note>

## 音楽生成

同梱の `google` Plugin は、共有の
`music_generate` tool を通じて音楽生成も登録します。

- デフォルト音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` もサポート
- プロンプト制御: `lyrics` と `instrumental`
- 出力形式: デフォルトは `mp3`、加えて `google/lyria-3-pro-preview` では `wav`
- 参照入力: 最大10枚の画像
- セッション対応実行は、`action: "status"` を含む共有 task/status フローを通じてデタッチされます

Google をデフォルトの音楽 provider として使用するには:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
共有 tool パラメーター、provider 選択、およびフェイルオーバー動作については、[Music Generation](/ja-JP/tools/music-generation) を参照してください。
</Note>

## Text-to-speech

同梱の `google` speech provider は、Gemini API TTS パスを
`gemini-3.1-flash-tts-preview` とともに使用します。

- デフォルト音声: `Kore`
- 認証: `messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY`
- 出力: 通常の TTS 添付には WAV、voice-note ターゲットには Opus、Talk/telephony には PCM
- voice-note 出力: Google PCM は WAV としてラップされ、`ffmpeg` で 48 kHz Opus にトランスコードされます

Google をデフォルトの TTS provider として使用するには:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS は、スタイル制御に自然言語プロンプトを使用します。話されるテキストの前に再利用可能なスタイルプロンプトを付加するには、`audioProfile` を設定してください。プロンプトテキストで名前付き話者に言及する場合は、`speakerName` を設定してください。

Gemini API TTS は、`[whispers]` や `[laughs]` のような表現付きの角括弧 audio tag も受け付けます。タグを表示チャット返信から除外しつつ TTS に送るには、それらを `[[tts:text]]...[[/tts:text]]`
ブロック内に入れてください。

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API に制限された Google Cloud Console API key は、この
provider で有効です。これは別個の Cloud Text-to-Speech API パスではありません。
</Note>

## Realtime voice

同梱の `google` Plugin は、Voice Call や Google Meet のようなバックエンド音声ブリッジ向けに、
Gemini Live API をバックエンドとする realtime voice provider を登録します。

| Setting               | Config path                                                         | デフォルト                                                                          |
| --------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                     |
| Voice                 | `...google.voice`                                                   | `Kore`                                                                              |
| Temperature           | `...google.temperature`                                             | （未設定）                                                                          |
| VAD start sensitivity | `...google.startSensitivity`                                        | （未設定）                                                                          |
| VAD end sensitivity   | `...google.endSensitivity`                                          | （未設定）                                                                          |
| Silence duration      | `...google.silenceDurationMs`                                       | （未設定）                                                                          |
| API key               | `...google.apiKey`                                                  | `models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY` にフォールバック |

Voice Call の realtime config の例:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
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
Google Live API は、WebSocket 上で双方向音声と function calling を使用します。
OpenClaw は telephony/Meet ブリッジ音声を Gemini の PCM Live API ストリームに適応し、
tool call を共有 realtime voice 契約上に維持します。sampling を変更する必要がない限り、
`temperature` は未設定のままにしてください。Google Live では `temperature: 0` に対して音声のない transcript が返ることがあるため、OpenClaw は非正の値を省略します。
Gemini API transcription は `languageCodes` なしで有効になります。現在の Google
SDK は、この API パスでは language-code ヒントを拒否します。
</Note>

<Note>
Control UI Talk ブラウザセッションでは、引き続きブラウザ WebRTC セッション実装を持つ realtime voice provider が必要です。現在そのパスは OpenAI Realtime です。Google provider はバックエンド realtime ブリッジ用です。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    直接の Gemini API 実行（`api: "google-generative-ai"`）では、OpenClaw は
    設定済みの `cachedContent` ハンドルを Gemini リクエストにそのまま渡します。

    - モデル単位またはグローバルの params を、`cachedContent` または
      レガシーな `cached_content` のいずれかで設定できます
    - 両方が存在する場合は、`cachedContent` が優先されます
    - 値の例: `cachedContents/prebuilt-context`
    - Gemini の cache-hit usage は、上流の `cachedContentTokenCount` から
      OpenClaw の `cacheRead` に正規化されます

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

  </Accordion>

  <Accordion title="Gemini CLI JSON usage notes">
    `google-gemini-cli` OAuth provider を使用する場合、OpenClaw は
    CLI JSON 出力を次のように正規化します。

    - 返信テキストは CLI JSON の `response` フィールドから取得されます。
    - CLI の `usage` が空の場合、usage は `stats` にフォールバックします。
    - `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
    - `stats.input` が欠けている場合、OpenClaw は
      `stats.input_tokens - stats.cached` から入力トークン数を導出します。

  </Accordion>

  <Accordion title="環境とデーモンのセットアップ">
    Gateway がデーモン（launchd/systemd）として動作する場合は、`GEMINI_API_KEY`
    がそのプロセスから利用可能であることを確認してください（たとえば `~/.openclaw/.env` または
    `env.shellEnv` 経由）。
  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、およびフェイルオーバー動作を選択します。
  </Card>
  <Card title="Image generation" href="/ja-JP/tools/image-generation" icon="image">
    共有 image tool パラメーターと provider 選択。
  </Card>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    共有 video tool パラメーターと provider 選択。
  </Card>
  <Card title="Music generation" href="/ja-JP/tools/music-generation" icon="music">
    共有 music tool パラメーターと provider 選択。
  </Card>
</CardGroup>
