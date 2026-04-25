---
read_when:
    - Google Gemini モデルを OpenClaw で使いたい場合
    - API キーまたは OAuth 認証フローが必要です
summary: Google Gemini のセットアップ（API キー + OAuth、画像生成、メディア理解、TTS、ウェブ検索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-04-25T13:57:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: de0d6563d1c7a25fe26aa7ce255b1d3ed80e950b7761039e6d0a76f23a14e6f3
    source_path: providers/google.md
    workflow: 15
---

Google プラグインは、Google AI Studio を通じて Gemini モデルへのアクセスに加え、画像生成、メディア理解（画像/音声/動画）、text-to-speech、そして Gemini Grounding によるウェブ検索を提供します。

- Provider: `google`
- 認証: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- ランタイムオプション: `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"` を使うと、モデル参照を `google/*` のまま正規形で維持しつつ、Gemini CLI の OAuth を再利用できます。

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API key">
    **最適な用途:** Google AI Studio を通じた標準の Gemini API アクセス。

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        または、キーを直接渡します。

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
    環境変数 `GEMINI_API_KEY` と `GOOGLE_API_KEY` はどちらも受け付けられます。すでに設定してあるほうを使ってください。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最適な用途:** 別の API キーを使う代わりに、既存の Gemini CLI ログインを PKCE OAuth で再利用する場合。

    <Warning>
    `google-gemini-cli` Provider は非公式の統合です。この方法で OAuth を使うとアカウント制限が発生したという報告もあります。自己責任で利用してください。
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

        OpenClaw は、Homebrew インストールとグローバル npm インストールの両方をサポートしており、一般的な Windows/npm レイアウトにも対応しています。
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

    （または `GEMINI_CLI_*` 系の変数。）

    <Note>
    ログイン後に Gemini CLI OAuth リクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してから再試行してください。
    </Note>

    <Note>
    ブラウザフローが始まる前にログインに失敗する場合は、ローカルの `gemini` コマンドがインストールされていて `PATH` 上にあることを確認してください。
    </Note>

    `google-gemini-cli/*` モデル参照は、後方互換性のためのレガシーエイリアスです。新しい設定では、ローカルの Gemini CLI 実行を使いたい場合、`google/*` のモデル参照と `google-gemini-cli` ランタイムを使ってください。

  </Tab>
</Tabs>

## 機能

| 機能 | サポート |
| ---------------------- | ----------------------------- |
| チャット補完 | はい |
| 画像生成 | はい |
| 音楽生成 | はい |
| Text-to-speech | はい |
| リアルタイム音声 | はい（Google Live API） |
| 画像理解 | はい |
| 音声文字起こし | はい |
| 動画理解 | はい |
| ウェブ検索（Grounding） | はい |
| Thinking/推論 | はい（Gemini 2.5+ / Gemini 3+） |
| Gemma 4 モデル | はい |

<Tip>
Gemini 3 モデルは `thinkingBudget` ではなく `thinkingLevel` を使います。OpenClaw は Gemini 3、Gemini 3.1、および `gemini-*-latest` エイリアスの推論コントロールを `thinkingLevel` にマッピングするため、デフォルト実行や低レイテンシ実行で無効化された `thinkingBudget` 値は送信されません。

`/think adaptive` は、固定の OpenClaw レベルを選ぶ代わりに Google の動的 thinking セマンティクスを維持します。Gemini 3 と Gemini 3.1 は固定の `thinkingLevel` を省略するため Google がレベルを選択でき、Gemini 2.5 は Google の動的センチネル `thinkingBudget: -1` を送信します。

Gemma 4 モデル（例: `gemma-4-26b-a4b-it`）は thinking モードをサポートします。OpenClaw は Gemma 4 について `thinkingBudget` をサポートされている Google の `thinkingLevel` に書き換えます。thinking を `off` に設定すると、`MINIMAL` にマッピングせず、thinking 無効のまま維持されます。
</Tip>

## 画像生成

同梱の `google` 画像生成 Provider のデフォルトは `google/gemini-3.1-flash-image-preview` です。

- `google/gemini-3-pro-image-preview` もサポート
- 生成: リクエストごとに最大 4 枚の画像
- 編集モード: 有効、最大 5 枚の入力画像
- ジオメトリ制御: `size`、`aspectRatio`、`resolution`

Google をデフォルトの画像 Provider として使うには、次のように設定します。

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
共有ツールパラメータ、Provider の選択、フェイルオーバーの動作については、[画像生成](/ja-JP/tools/image-generation) を参照してください。
</Note>

## 動画生成

同梱の `google` プラグインは、共有 `video_generate` ツールを通じた動画生成も登録します。

- デフォルトの動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: text-to-video、image-to-video、単一動画の参照フロー
- `aspectRatio`、`resolution`、`audio` をサポート
- 現在の duration の制限: **4〜8 秒**

Google をデフォルトの動画 Provider として使うには、次のように設定します。

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
共有ツールパラメータ、Provider の選択、フェイルオーバーの動作については、[動画生成](/ja-JP/tools/video-generation) を参照してください。
</Note>

## 音楽生成

同梱の `google` プラグインは、共有 `music_generate` ツールを通じた音楽生成も登録します。

- デフォルトの音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` もサポート
- プロンプト制御: `lyrics` と `instrumental`
- 出力形式: デフォルトは `mp3`、`google/lyria-3-pro-preview` では `wav` も対応
- 参照入力: 最大 10 枚の画像
- セッション対応実行は、`action: "status"` を含む共有の task/status フローを通じて切り離されます

Google をデフォルトの音楽 Provider として使うには、次のように設定します。

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
共有ツールパラメータ、Provider の選択、フェイルオーバーの動作については、[音楽生成](/ja-JP/tools/music-generation) を参照してください。
</Note>

## Text-to-speech

同梱の `google` 音声 Provider は、`gemini-3.1-flash-tts-preview` を使う Gemini API TTS パスを使用します。

- デフォルト音声: `Kore`
- 認証: `messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY`
- 出力: 通常の TTS 添付では WAV、Talk/電話では PCM
- ネイティブなボイスノート出力: この Gemini API パスでは API が Opus ではなく PCM を返すため未対応

Google をデフォルトの TTS Provider として使うには、次のように設定します。

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

Gemini API TTS は、スタイル制御に自然言語プロンプトを使います。話されるテキストの前に再利用可能なスタイルプロンプトを付けるには `audioProfile` を設定します。プロンプトテキストが名前付きの話者を参照している場合は `speakerName` を設定してください。

Gemini API TTS は、`[whispers]` や `[laughs]` のような表現用の角括弧オーディオタグもテキスト内で受け付けます。タグを可視のチャット返信には含めず、TTS には送るには、それらを `[[tts:text]]...[[/tts:text]]` ブロック内に入れてください。

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API のみに制限された Google Cloud Console API キーは、この Provider で有効です。これは別個の Cloud Text-to-Speech API パスではありません。
</Note>

## リアルタイム音声

同梱の `google` プラグインは、Voice Call や Google Meet などのバックエンド音声ブリッジ向けに、Gemini Live API を基盤とするリアルタイム音声 Provider を登録します。

| 設定 | 設定パス | デフォルト |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| モデル | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025` |
| 音声 | `...google.voice` | `Kore` |
| Temperature | `...google.temperature` | （未設定） |
| VAD 開始感度 | `...google.startSensitivity` | （未設定） |
| VAD 終了感度 | `...google.endSensitivity` | （未設定） |
| 無音時間 | `...google.silenceDurationMs` | （未設定） |
| API キー | `...google.apiKey` | `models.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_API_KEY` にフォールバック |

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
Google Live API は、WebSocket 上で双方向音声と関数呼び出しを使います。OpenClaw は電話/Meet ブリッジ音声を Gemini の PCM Live API ストリームに適応し、ツール呼び出しを共有のリアルタイム音声契約上に維持します。サンプリング変更が必要でない限り、`temperature` は未設定のままにしてください。Google Live は `temperature: 0` に対して音声なしの文字起こしを返すことがあるため、OpenClaw は 0 以下の値を送信しません。Gemini API の文字起こしは `languageCodes` なしで有効化されます。現在の Google SDK は、この API パスで言語コードのヒントを拒否します。
</Note>

<Note>
Control UI Talk のブラウザセッションでは、引き続きブラウザ WebRTC セッション実装を持つリアルタイム音声 Provider が必要です。現時点ではそのパスは OpenAI Realtime です。Google Provider はバックエンドのリアルタイムブリッジ用です。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Gemini キャッシュの直接再利用">
    直接の Gemini API 実行（`api: "google-generative-ai"`）では、OpenClaw は設定済みの `cachedContent` ハンドルを Gemini リクエストへそのまま渡します。

    - モデルごと、またはグローバルのパラメータとして、`cachedContent` またはレガシーの `cached_content` のいずれかを設定できます
    - 両方が存在する場合は、`cachedContent` が優先されます
    - 値の例: `cachedContents/prebuilt-context`
    - Gemini のキャッシュヒット使用量は、上流の `cachedContentTokenCount` から OpenClaw の `cacheRead` に正規化されます

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

  <Accordion title="Gemini CLI JSON 使用上の注意">
    `google-gemini-cli` OAuth Provider を使用する場合、OpenClaw は CLI の JSON 出力を次のように正規化します。

    - 返信テキストは CLI JSON の `response` フィールドから取得されます。
    - CLI の `usage` が空の場合、使用量は `stats` にフォールバックします。
    - `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
    - `stats.input` が欠けている場合、OpenClaw は `stats.input_tokens - stats.cached` から入力トークンを導出します。

  </Accordion>

  <Accordion title="環境とデーモンのセットアップ">
    Gateway がデーモン（launchd/systemd）として動作する場合、`GEMINI_API_KEY` がそのプロセスから利用可能であることを確認してください（たとえば `~/.openclaw/.env` または `env.shellEnv` 経由）。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    Provider、モデル参照、フェイルオーバー動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールのパラメータと Provider の選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメータと Provider の選択。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    共有音楽ツールのパラメータと Provider の選択。
  </Card>
</CardGroup>
