---
read_when:
    - OpenClawでGoogle Geminiモデルを使いたい場合
    - APIキーまたはOAuth認証フローが必要な場合
summary: Google Geminiのセットアップ（APIキー + OAuth、画像生成、メディア理解、Web検索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-04-09T01:30:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: fad2ff68987301bd86145fa6e10de8c7b38d5bd5dbcd13db9c883f7f5b9a4e01
    source_path: providers/google.md
    workflow: 15
---

# Google（Gemini）

Googleプラグインは、Google AI Studio経由のGeminiモデルに加えて、
Gemini Grounding経由の画像生成、メディア理解（画像/音声/動画）、Web検索へのアクセスを提供します。

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY` または `GOOGLE_API_KEY`
- API: Google Gemini API
- 代替プロバイダー: `google-gemini-cli`（OAuth）

## クイックスタート

1. APIキーを設定します:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. デフォルトモデルを設定します:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## 非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth（Gemini CLI）

代替プロバイダー`google-gemini-cli`は、API
キーの代わりにPKCE OAuthを使用します。これは非公式の統合であり、一部のユーザーはアカウント
制限を報告しています。自己責任で使用してください。

- デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
- エイリアス: `gemini-cli`
- インストール前提条件: ローカルでGemini CLIが`gemini`として利用可能であること
  - Homebrew: `brew install gemini-cli`
  - npm: `npm install -g @google/gemini-cli`
- ログイン:

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

環境変数:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

（または`GEMINI_CLI_*`バリアント。）

Gemini CLI OAuthリクエストがログイン後に失敗する場合は、
Gatewayホストで`GOOGLE_CLOUD_PROJECT`または`GOOGLE_CLOUD_PROJECT_ID`を設定してから
再試行してください。

ブラウザフローが始まる前にログインが失敗する場合は、ローカルの`gemini`
コマンドがインストールされ、`PATH`に入っていることを確認してください。OpenClawはHomebrewインストールと
グローバルnpmインストールの両方をサポートしており、一般的なWindows/npmレイアウトも含みます。

Gemini CLI JSONの使用量に関する注記:

- 応答テキストはCLI JSONの`response`フィールドから取得されます。
- CLIが`usage`を空のままにした場合、使用量は`stats`へフォールバックします。
- `stats.cached`はOpenClawの`cacheRead`へ正規化されます。
- `stats.input`がない場合、OpenClawは
  `stats.input_tokens - stats.cached`から入力トークンを導出します。

## 機能

| 機能                     | サポート状況      |
| ------------------------ | ----------------- |
| チャット補完             | はい              |
| 画像生成                 | はい              |
| 音楽生成                 | はい              |
| 画像理解                 | はい              |
| 音声文字起こし           | はい              |
| 動画理解                 | はい              |
| Web検索（Grounding）     | はい              |
| Thinking/reasoning       | はい（Gemini 3.1+） |
| Gemma 4モデル            | はい              |

Gemma 4モデル（たとえば`gemma-4-26b-a4b-it`）はthinkingモードをサポートします。OpenClawはGemma 4向けに、`thinkingBudget`をサポートされたGoogleの`thinkingLevel`へ書き換えます。thinkingを`off`に設定すると、`MINIMAL`へマッピングするのではなく、thinking無効の状態を維持します。

## 直接Geminiキャッシュの再利用

直接Gemini API実行（`api: "google-generative-ai"`）では、OpenClawは現在、
設定された`cachedContent`ハンドルをGeminiリクエストへそのまま渡します。

- モデルごとまたはグローバルなparamsに、`cachedContent`または
  旧式の`cached_content`のいずれかを設定できます
- 両方が存在する場合は、`cachedContent`が優先されます
- 値の例: `cachedContents/prebuilt-context`
- Geminiのキャッシュヒット使用量は、上流の`cachedContentTokenCount`から
  OpenClawの`cacheRead`へ正規化されます

例:

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

## 画像生成

バンドル済みの`google`画像生成プロバイダーのデフォルトは
`google/gemini-3.1-flash-image-preview`です。

- `google/gemini-3-pro-image-preview`もサポートします
- 生成: 1リクエストあたり最大4枚の画像
- 編集モード: 有効、最大5枚の入力画像
- ジオメトリ制御: `size`, `aspectRatio`, `resolution`

OAuth専用の`google-gemini-cli`プロバイダーは、別のテキスト推論
サーフェスです。画像生成、メディア理解、Gemini Groundingは引き続き
`google`プロバイダーID上にあります。

Googleをデフォルトの画像プロバイダーとして使用するには:

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

共有ツールの
パラメータ、プロバイダー選択、フェイルオーバー挙動については、[Image Generation](/ja-JP/tools/image-generation)を参照してください。

## 動画生成

バンドル済みの`google`プラグインは、共有の
`video_generate`ツール経由で動画生成も登録します。

- デフォルト動画モデル: `google/veo-3.1-fast-generate-preview`
- モード: text-to-video、image-to-video、single-video referenceフロー
- `aspectRatio`, `resolution`, `audio`をサポート
- 現在のdurationクランプ: **4〜8秒**

Googleをデフォルトの動画プロバイダーとして使用するには:

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

共有ツールの
パラメータ、プロバイダー選択、フェイルオーバー挙動については、[Video Generation](/ja-JP/tools/video-generation)を参照してください。

## 音楽生成

バンドル済みの`google`プラグインは、共有の
`music_generate`ツール経由で音楽生成も登録します。

- デフォルト音楽モデル: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview`もサポートします
- プロンプト制御: `lyrics` と `instrumental`
- 出力形式: デフォルトは`mp3`、加えて`google/lyria-3-pro-preview`では`wav`
- 参照入力: 最大10枚の画像
- セッション対応の実行は、`action: "status"`を含む共有のタスク/ステータスフローを通じて分離実行されます

Googleをデフォルトの音楽プロバイダーとして使用するには:

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

共有ツールの
パラメータ、プロバイダー選択、フェイルオーバー挙動については、[Music Generation](/ja-JP/tools/music-generation)を参照してください。

## 環境に関する注記

Gatewayがデーモン（launchd/systemd）として実行される場合は、`GEMINI_API_KEY`が
そのプロセスから利用可能であることを確認してください（たとえば`~/.openclaw/.env`や
`env.shellEnv`経由）。
