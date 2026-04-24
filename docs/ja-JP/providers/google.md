---
read_when:
    - OpenClaw で Google Gemini モデルを使いたい場合
    - API キーまたは OAuth の認証フローが必要です
summary: Google Gemini のセットアップ（API キー + OAuth、画像生成、メディア理解、TTS、Web 検索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-04-24T09:01:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e66c9dd637e26976659d04b9b7e2452e6881945dab6011970f9e1c5e4a9a685
    source_path: providers/google.md
    workflow: 15
---

Google plugin は、Google AI Studio 経由で Gemini モデルへのアクセスに加え、
Gemini Grounding による画像生成、メディア理解（画像/音声/動画）、text-to-speech、Web 検索を提供します。

- Provider: `google`
- Auth: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- 代替 provider: `google-gemini-cli`（OAuth）

## はじめに

希望する認証方式を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API key">
    **最適な用途:** Google AI Studio 経由の標準的な Gemini API アクセス。

    <Steps>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        または、キーを直接渡します:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="デフォルトモデルを設定">
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
      <Step title="モデルが利用可能か確認">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    環境変数 `GEMINI_API_KEY` と `GOOGLE_API_KEY` はどちらも使用できます。すでに設定済みのものを使ってください。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最適な用途:** 別個の API キーではなく、既存の Gemini CLI ログインを PKCE OAuth 経由で再利用する場合。

    <Warning>
    `google-gemini-cli` provider は非公式の統合です。この方法で OAuth を使用すると
    アカウント制限がかかると報告しているユーザーもいます。自己責任で使用してください。
    </Warning>

    <Steps>
      <Step title="Gemini CLI をインストール">
        ローカルの `gemini` コマンドが `PATH` 上で利用可能である必要があります。

        ```bash
        # Homebrew
        brew install gemini-cli

        # または npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw は、一般的な Windows/npm レイアウトを含め、Homebrew インストールとグローバル npm インストールの両方をサポートします。
      </Step>
      <Step title="OAuth でログイン">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="モデルが利用可能か確認">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
    - エイリアス: `gemini-cli`

    **環境変数:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    （または `GEMINI_CLI_*` バリアント。）

    <Note>
    ログイン後に Gemini CLI OAuth リクエストが失敗する場合は、gateway host 上で `GOOGLE_CLOUD_PROJECT` または
    `GOOGLE_CLOUD_PROJECT_ID` を設定して再試行してください。
    </Note>

    <Note>
    ブラウザフローが始まる前にログインが失敗する場合は、ローカルの `gemini`
    コマンドがインストールされ、`PATH` 上にあることを確認してください。
    </Note>

    OAuth 専用の `google-gemini-cli` provider は、別個の text-inference
    サーフェスです。画像生成、メディア理解、Gemini Grounding は
    `google` provider id のままです。

  </Tab>
</Tabs>

## 機能

| 機能                   | サポート状況                  |
| ---------------------- | ----------------------------- |
| Chat completions       | はい                          |
| 画像生成               | はい                          |
| 音楽生成               | はい                          |
| Text-to-speech         | はい                          |
| リアルタイム音声       | はい（Google Live API）       |
| 画像理解               | はい                          |
| 音声文字起こし         | はい                          |
| 動画理解               | はい                          |
| Web 検索（Grounding）  | はい                          |
| Thinking/reasoning     | はい（Gemini 2.5+ / Gemini 3+） |
| Gemma 4 モデル         | はい                          |

<Tip>
Gemini 3 モデルは `thinkingBudget` ではなく `thinkingLevel` を使用します。OpenClaw は
Gemini 3、Gemini 3.1、および `gemini-*-latest` エイリアスの reasoning 制御を
`thinkingLevel` にマッピングするため、デフォルト/低遅延実行で無効な
`thinkingBudget` 値を送信しません。

Gemma 4 モデル（例: `gemma-4-26b-a4b-it`）は thinking モードをサポートしています。OpenClaw
は、Gemma 4 向けに `thinkingBudget` をサポート対象の Google `thinkingLevel` に書き換えます。
thinking を `off` に設定した場合は、`MINIMAL` にマッピングせず、thinking 無効のまま維持されます。
</Tip>

## 画像生成

バンドルされた `google` image-generation provider のデフォルトは
`google/gemini-3.1-flash-image-preview` です。

- `google/gemini-3-pro-image-preview` もサポート
- 生成: 1 リクエストあたり最大 4 枚
- 編集モード: 有効、最大 5 枚の入力画像
- ジオメトリ制御: `size`、`aspectRatio`、`resolution`

Google をデフォルトの画像プロバイダーとして使うには:

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
共有のツールパラメーター、provider 選択、フェイルオーバー動作については [Image Generation](/ja-JP/tools/image-generation) を参照してください。
</Note>

## 動画生成

バンドルされた `google` plugin は、共有の
`video_generate` ツールを通じて動画生成も登録します。

- デフォルト動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: text-to-video、image-to-video、single-video reference フロー
- `aspectRatio`、`resolution`、`audio` をサポート
- 現在の duration の制限: **4～8 秒**

Google をデフォルトの動画プロバイダーとして使うには:

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
共有のツールパラメーター、provider 選択、フェイルオーバー動作については [Video Generation](/ja-JP/tools/video-generation) を参照してください。
</Note>

## 音楽生成

バンドルされた `google` plugin は、共有の
`music_generate` ツールを通じて音楽生成も登録します。

- デフォルト音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` もサポート
- プロンプト制御: `lyrics` と `instrumental`
- 出力形式: デフォルトで `mp3`、`google/lyria-3-pro-preview` では `wav` もサポート
- 参照入力: 最大 10 枚の画像
- セッションバックの実行は、`action: "status"` を含む共有 task/status フローを通じてデタッチされます

Google をデフォルトの音楽プロバイダーとして使うには:

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
共有のツールパラメーター、provider 選択、フェイルオーバー動作については [Music Generation](/ja-JP/tools/music-generation) を参照してください。
</Note>

## Text-to-speech

バンドルされた `google` speech provider は、
`gemini-3.1-flash-tts-preview` を使う Gemini API TTS パスを使用します。

- デフォルト音声: `Kore`
- Auth: `messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY`
- 出力: 通常の TTS 添付では WAV、Talk/telephony では PCM
- ネイティブ voice-note 出力: API が Opus ではなく PCM を返すため、この Gemini API パスではサポートされません

Google をデフォルトの TTS provider として使うには:

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
        },
      },
    },
  },
}
```

Gemini API TTS は、`[whispers]` や `[laughs]` のような表現力のある角括弧付き音声タグをテキスト内で受け付けます。表示されるチャット返信からタグを除外しつつ、TTS には送信するには、それらを `[[tts:text]]...[[/tts:text]]` ブロック内に置いてください:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API のみに制限された Google Cloud Console API キーは、この
provider で有効です。これは別個の Cloud Text-to-Speech API パスではありません。
</Note>

## リアルタイム音声

バンドルされた `google` plugin は、Voice Call や Google Meet のようなバックエンド音声ブリッジ向けに、
Gemini Live API をバックエンドとするリアルタイム音声 provider を登録します。

| 設定                  | 設定パス                                                            | デフォルト                                                                              |
| --------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| モデル                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                         |
| 音声                  | `...google.voice`                                                   | `Kore`                                                                                  |
| Temperature           | `...google.temperature`                                             | （未設定）                                                                              |
| VAD 開始感度          | `...google.startSensitivity`                                        | （未設定）                                                                              |
| VAD 終了感度          | `...google.endSensitivity`                                          | （未設定）                                                                              |
| 無音継続時間          | `...google.silenceDurationMs`                                       | （未設定）                                                                              |
| API キー              | `...google.apiKey`                                                  | `models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY` にフォールバック |

Voice Call のリアルタイム設定例:

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
OpenClaw は telephony/Meet bridge の音声を Gemini の PCM Live API ストリームに適応し、
ツール呼び出しは共有のリアルタイム音声契約上に維持します。sampling の変更が必要でない限り、
`temperature` は未設定のままにしてください。Google Live は `temperature: 0` の場合に
音声なしの transcript を返すことがあるため、OpenClaw は正でない値を省略します。
Gemini API の transcription は `languageCodes` なしで有効化されます。現在の Google
SDK はこの API パスで language-code ヒントを拒否します。
</Note>

<Note>
Control UI Talk のブラウザセッションでは、引き続きブラウザ WebRTC セッション実装を持つリアルタイム音声 provider が必要です。
現時点ではそのパスは OpenAI Realtime です。Google provider はバックエンドのリアルタイムブリッジ用です。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Direct Gemini キャッシュ再利用">
    直接の Gemini API 実行（`api: "google-generative-ai"`）では、OpenClaw
    は設定済みの `cachedContent` ハンドルを Gemini リクエストに渡します。

    - モデルごとまたはグローバルな params は、
      `cachedContent` または旧来の `cached_content` のどちらでも設定できます
    - 両方ある場合は `cachedContent` が優先されます
    - 値の例: `cachedContents/prebuilt-context`
    - Gemini のキャッシュヒット usage は、上流の `cachedContentTokenCount` から
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

  <Accordion title="Gemini CLI の JSON 使用上の注意">
    `google-gemini-cli` OAuth provider を使用する場合、OpenClaw は
    CLI の JSON 出力を次のように正規化します:

    - 返信テキストは CLI JSON の `response` フィールドから取得されます。
    - CLI が `usage` を空のままにした場合、usage は `stats` にフォールバックします。
    - `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
    - `stats.input` が欠けている場合、OpenClaw は入力トークンを
      `stats.input_tokens - stats.cached` から導出します。

  </Accordion>

  <Accordion title="環境とデーモン設定">
    Gateway をデーモン（launchd/systemd）として実行する場合は、`GEMINI_API_KEY`
    がそのプロセスで利用可能であることを確認してください（たとえば `~/.openclaw/.env` または
    `env.shellEnv` 内）。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有の画像ツールパラメーターと provider 選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有の動画ツールパラメーターと provider 選択。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    共有の音楽ツールパラメーターと provider 選択。
  </Card>
</CardGroup>
