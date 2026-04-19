---
read_when:
    - OpenClawでGoogle Geminiモデルを使いたい場合
    - APIキーまたはOAuth認証フローが必要な場合
summary: Google Geminiのセットアップ（APIキー + OAuth、画像生成、メディア理解、TTS、Web検索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-04-19T01:11:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5e055b02cc51899e11836a882f1f981fedfa5c4dbe42261ac2f2eba5e4d707c
    source_path: providers/google.md
    workflow: 15
---

# Google（Gemini）

Google Pluginは、Google AI Studioを通じたGeminiモデルへのアクセスに加えて、
Gemini Grounding経由の画像生成、メディア理解（画像/音声/動画）、text-to-speech、Web検索を提供します。

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- 代替プロバイダー: `google-gemini-cli`（OAuth）

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="APIキー">
    **最適な用途:** Google AI Studioを通じた標準的なGemini APIアクセス。

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

  <Tab title="Gemini CLI（OAuth）">
    **最適な用途:** 別のAPIキーを使わずに、既存のGemini CLIログインをPKCE OAuth経由で再利用する場合。

    <Warning>
    `google-gemini-cli`プロバイダーは非公式の統合です。一部のユーザーは、
    この方法でOAuthを使用するとアカウント制限が発生したと報告しています。自己責任で使用してください。
    </Warning>

    <Steps>
      <Step title="Gemini CLIをインストール">
        ローカルの`gemini`コマンドが`PATH`上で利用可能である必要があります。

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClawは、Homebrewインストールとグローバルnpmインストールの両方をサポートしており、
        一般的なWindows/npmレイアウトも含まれます。
      </Step>
      <Step title="OAuthでログイン">
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

    （または`GEMINI_CLI_*`バリアント。）

    <Note>
    ログイン後にGemini CLI OAuthリクエストが失敗する場合は、Gatewayホストで`GOOGLE_CLOUD_PROJECT`または
    `GOOGLE_CLOUD_PROJECT_ID`を設定してから再試行してください。
    </Note>

    <Note>
    ブラウザフローが始まる前にログインが失敗する場合は、ローカルの`gemini`
    コマンドがインストールされ、`PATH`上にあることを確認してください。
    </Note>

    OAuth専用の`google-gemini-cli`プロバイダーは、別個のtext-inference
    サーフェスです。画像生成、メディア理解、Gemini Groundingは
    `google`プロバイダーidのままです。

  </Tab>
</Tabs>

## 機能

| 機能                   | サポート状況                  |
| ---------------------- | ----------------------------- |
| チャット補完           | はい                          |
| 画像生成               | はい                          |
| 音楽生成               | はい                          |
| Text-to-speech         | はい                          |
| 画像理解               | はい                          |
| 音声文字起こし         | はい                          |
| 動画理解               | はい                          |
| Web検索（Grounding）   | はい                          |
| Thinking/reasoning     | はい（Gemini 2.5+ / Gemini 3+） |
| Gemma 4モデル          | はい                          |

<Tip>
Gemini 3モデルは`thinkingBudget`ではなく`thinkingLevel`を使用します。OpenClawは、
Gemini 3、Gemini 3.1、および`gemini-*-latest`エイリアスの推論コントロールを
`thinkingLevel`にマッピングするため、デフォルト/低遅延の実行時に無効な
`thinkingBudget`値は送信されません。

Gemma 4モデル（たとえば`gemma-4-26b-a4b-it`）はthinking modeをサポートします。OpenClawは
`thinkingBudget`を、Gemma 4でサポートされるGoogleの`thinkingLevel`に書き換えます。
thinkingを`off`に設定すると、`MINIMAL`にマッピングされることなく、
thinking無効の状態が維持されます。
</Tip>

## 画像生成

バンドルされた`google`画像生成プロバイダーのデフォルトは
`google/gemini-3.1-flash-image-preview`です。

- `google/gemini-3-pro-image-preview`もサポート
- 生成: 1リクエストあたり最大4枚の画像
- 編集モード: 有効、最大5枚の入力画像
- ジオメトリ制御: `size`、`aspectRatio`、`resolution`

Googleをデフォルトの画像プロバイダーとして使うには:

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
共通のツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[Image Generation](/ja-JP/tools/image-generation)を参照してください。
</Note>

## 動画生成

バンドルされた`google`Pluginは、共通の
`video_generate`ツールを通じて動画生成も登録します。

- デフォルト動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: text-to-video、image-to-video、single-video referenceフロー
- `aspectRatio`、`resolution`、`audio`をサポート
- 現在の長さ制限: **4〜8秒**

Googleをデフォルトの動画プロバイダーとして使うには:

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
共通のツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[Video Generation](/ja-JP/tools/video-generation)を参照してください。
</Note>

## 音楽生成

バンドルされた`google`Pluginは、共通の
`music_generate`ツールを通じて音楽生成も登録します。

- デフォルト音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview`もサポート
- プロンプト制御: `lyrics` と `instrumental`
- 出力形式: デフォルトで`mp3`、加えて`google/lyria-3-pro-preview`では`wav`
- 参照入力: 最大10枚の画像
- セッション対応の実行は、`action: "status"`を含む共通のtask/statusフローを通じてデタッチされます

Googleをデフォルトの音楽プロバイダーとして使うには:

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
共通のツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[Music Generation](/ja-JP/tools/music-generation)を参照してください。
</Note>

## Text-to-speech

バンドルされた`google`音声プロバイダーは、Gemini APIのTTSパスと
`gemini-3.1-flash-tts-preview`を使用します。

- デフォルト音声: `Kore`
- 認証: `messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY`、または`GOOGLE_API_KEY`
- 出力: 通常のTTS添付ではWAV、Talk/テレフォニーではPCM
- ネイティブ音声ノート出力: APIがOpusではなくPCMを返すため、このGemini APIパスではサポートされません

GoogleをデフォルトのTTSプロバイダーとして使うには:

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

Gemini API TTSは、`[whispers]`や`[laughs]`のような表現用の角括弧付き音声タグをテキスト内で受け付けます。
タグを目に見えるチャット返信から除外しつつ
TTSには送るには、それらを`[[tts:text]]...[[/tts:text]]`ブロック内に入れてください:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini APIのみに制限されたGoogle Cloud Console APIキーは、この
プロバイダーで有効です。これは別個のCloud Text-to-Speech APIパスではありません。
</Note>

## 詳細設定

<AccordionGroup>
  <Accordion title="直接のGeminiキャッシュ再利用">
    直接のGemini API実行（`api: "google-generative-ai"`）では、OpenClawは
    設定済みの`cachedContent`ハンドルをGeminiリクエストにそのまま渡します。

    - `cachedContent`または従来の`cached_content`のいずれかで、
      モデルごとまたはグローバルなparamsを設定します
    - 両方が存在する場合は、`cachedContent`が優先されます
    - 値の例: `cachedContents/prebuilt-context`
    - Geminiのキャッシュヒット使用量は、上流の`cachedContentTokenCount`から
      OpenClawの`cacheRead`に正規化されます

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

  <Accordion title="Gemini CLI JSON使用上の注意">
    `google-gemini-cli` OAuthプロバイダーを使用する場合、OpenClawは
    CLIのJSON出力を次のように正規化します:

    - 返信テキストはCLI JSONの`response`フィールドから取得されます。
    - CLIが`usage`を空のままにした場合、使用量は`stats`にフォールバックします。
    - `stats.cached`はOpenClawの`cacheRead`に正規化されます。
    - `stats.input`が存在しない場合、OpenClawは
      `stats.input_tokens - stats.cached`から入力トークン数を導出します。

  </Accordion>

  <Accordion title="環境およびデーモン設定">
    Gatewayがデーモン（launchd/systemd）として動作する場合は、`GEMINI_API_KEY`
    がそのプロセスから利用可能であることを確認してください（たとえば`~/.openclaw/.env`または
    `env.shellEnv`で設定）。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共通の画像ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    共通の音楽ツールパラメーターとプロバイダー選択。
  </Card>
</CardGroup>
