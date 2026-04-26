---
read_when:
    - OpenClaw で OpenAI model を使いたいです
    - API キーではなく Codex サブスクリプション認証を使いたいです
    - より厳格な GPT-5 agent 実行動作が必要です
summary: OpenClaw で API キーまたは Codex サブスクリプションを使って OpenAI を利用する
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T11:39:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4c3e734217ca82e1a5965c41686341a8bd87b4d2194c6d9e286e1087fa53320
    source_path: providers/openai.md
    workflow: 15
---

  OpenAI は GPT model 向けの developer API を提供しており、Codex は OpenAI の Codex client を通じて ChatGPT プランの coding agent としても利用できます。OpenClaw は、設定の予測可能性を保つために、これらのサーフェスを分けて扱います。

  OpenClaw は OpenAI ファミリーの 3 つの route をサポートしています。model prefix が
  provider/auth route を選択し、別の runtime 設定が組み込み agent loop を誰が実行するかを選択します。

  - **API key** — 従量課金の direct OpenAI Platform access（`openai/*` model）
  - **PI 経由の Codex subscription** — subscription access を使う ChatGPT/Codex サインイン（`openai-codex/*` model）
  - **Codex app-server harness** — ネイティブな Codex app-server 実行（`openai/*` model と `agents.defaults.agentRuntime.id: "codex"`）

  OpenAI は、OpenClaw のような外部ツールやワークフローでの subscription OAuth 利用を明示的にサポートしています。

  provider、model、runtime、channel はそれぞれ別のレイヤーです。これらのラベルが混同されている場合は、
  設定を変更する前に [Agent runtimes](/ja-JP/concepts/agent-runtimes) を読んでください。

  ## クイック選択

  | 目的                                          | 使用方法                                              | メモ                                                                        |
  | --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
  | API キーによる直接課金                        | `openai/gpt-5.5`                                 | `OPENAI_API_KEY` を設定するか、OpenAI API-key のオンボーディングを実行します。                       |
  | ChatGPT/Codex subscription 認証による GPT-5.5  | `openai-codex/gpt-5.5`                           | Codex OAuth 用のデフォルト PI route。subscription 構成の最初の選択肢として最適です。 |
  | ネイティブ Codex app-server 動作による GPT-5.5 | `openai/gpt-5.5` と `agentRuntime.id: "codex"` | その model ref に対して Codex app-server harness を強制します。                      |
  | 画像生成または編集                   | `openai/gpt-image-2`                             | `OPENAI_API_KEY` と OpenAI Codex OAuth のどちらでも動作します。                    |
  | 透過背景画像                 | `openai/gpt-image-1.5`                           | `outputFormat=png` または `webp` と `openai.background=transparent` を使います。        |

  ## 名前の対応表

  名前は似ていますが、互換ではありません。

  | 表示される名前                       | レイヤー             | 意味                                                                                           |
  | ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
  | `openai`                           | Provider prefix   | direct OpenAI Platform API route。                                                                 |
  | `openai-codex`                     | Provider prefix   | 通常の OpenClaw PI runner を通る OpenAI Codex OAuth/subscription route。                      |
  | `codex` plugin                     | Plugin            | ネイティブ Codex app-server runtime と `/codex` chat control を提供する、バンドル済み OpenClaw plugin。 |
  | `agentRuntime.id: codex`           | Agent runtime     | 組み込み turn に対してネイティブ Codex app-server harness を強制します。                                     |
  | `/codex ...`                       | Chat command set  | 会話から Codex app-server thread を bind/control します。                                        |
  | `runtime: "acp", agentId: "codex"` | ACP session route | ACP/acpx を通して Codex を実行する明示的なフォールバック path。                                          |

  つまり、設定には `openai-codex/*` と
  `codex` plugin の両方を意図的に含めることができます。これは、PI 経由の Codex OAuth を使いつつ、
  ネイティブな `/codex` chat control も利用したい場合には有効です。`openclaw doctor` は
  その組み合わせについて、意図的かどうか確認できるよう警告しますが、書き換えは行いません。

  <Note>
  GPT-5.5 は direct OpenAI Platform API-key access と
  subscription/OAuth route の両方で利用できます。direct `OPENAI_API_KEY`
  通信には `openai/gpt-5.5` を、PI 経由の Codex OAuth には `openai-codex/gpt-5.5` を、
  ネイティブ Codex
  app-server harness には `agentRuntime.id: "codex"` を付けた `openai/gpt-5.5` を使ってください。
  </Note>

  <Note>
  OpenAI plugin を有効化しても、また `openai-codex/*` model を選択しても、
  バンドルされた Codex app-server plugin は有効化されません。OpenClaw がその plugin を有効化するのは、
  `agentRuntime.id: "codex"` でネイティブ Codex harness を明示的に選択した場合か、
  従来の `codex/*` model ref を使った場合だけです。
  バンドルされた `codex` plugin が有効なのに `openai-codex/*` が依然として
  PI 経由で解決される場合、`openclaw doctor` は警告を出し、route は変更しません。
  </Note>

  ## OpenClaw の機能対応範囲

  | OpenAI capability         | OpenClaw サーフェス                                           | 状態                                                 |
  | ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses          | `openai/<model>` model provider                            | はい                                                    |
  | Codex subscription model | `openai-codex/<model>` と `openai-codex` OAuth           | はい                                                    |
  | Codex app-server harness  | `openai/<model>` と `agentRuntime.id: codex`             | はい                                                    |
  | サーバー側 web search    | ネイティブ OpenAI Responses tool                               | はい。web search が有効で、provider が固定されていない場合 |
  | 画像                    | `image_generate`                                           | はい                                                    |
  | 動画                    | `video_generate`                                           | はい                                                    |
  | Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                  | はい                                                    |
  | バッチ speech-to-text      | `tools.media.audio` / media understanding                  | はい                                                    |
  | ストリーミング speech-to-text  | Voice Call `streaming.provider: "openai"`                  | はい                                                    |
  | リアルタイム音声            | Voice Call `realtime.provider: "openai"` / Control UI Talk | はい                                                    |
  | 埋め込み                | memory embedding provider                                  | はい                                                    |

  ## はじめに

  希望する認証方法を選び、セットアップ手順に従ってください。

  <Tabs>
  <Tab title="API キー（OpenAI Platform）">
    **最適な用途:** direct API access と従量課金。

    <Steps>
      <Step title="API キーを取得する">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys) で API キーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        または、キーを直接渡します。

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="model が利用可能か確認する">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### route の概要

    | Model ref              | Runtime config             | Route                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | direct OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | direct OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex app-server harness    | Codex app-server |

    <Note>
    `openai/*` は、明示的に
    Codex app-server harness を強制しない限り、direct OpenAI API-key route です。デフォルトの PI runner を通る Codex OAuth には `openai-codex/*` を使うか、
    ネイティブ Codex app-server 実行には
    `agentRuntime.id: "codex"` を付けた `openai/gpt-5.5` を使ってください。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw は `openai/gpt-5.3-codex-spark` を **公開していません**。実際の OpenAI API リクエストではその model は拒否され、現在の Codex catalog にも公開されていません。
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **最適な用途:** 別の API キーではなく、ChatGPT/Codex subscription を使うこと。Codex cloud には ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または、OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        ヘッドレス環境や callback を受けにくい環境では、localhost のブラウザー callback の代わりに ChatGPT device-code フローでサインインするため、
        `--device-code` を追加してください。

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="デフォルト model を設定する">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="model が利用可能か確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### route の概要

    | Model ref | Runtime config | Route | Auth |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | PI 経由の ChatGPT/Codex OAuth | Codex サインイン |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | plugin が明示的に `openai-codex` を claim しない限り、引き続き PI | Codex サインイン |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server harness | Codex app-server auth |

    <Note>
    auth/profile command には引き続き `openai-codex` provider id を使ってください。
    `openai-codex/*` model prefix も、PI 経由の Codex OAuth 用の明示的な route です。
    これはバンドルされた Codex app-server harness を選択したり、自動有効化したりしません。
    </Note>

    ### 設定例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    オンボーディングは `~/.codex` から OAuth 情報をインポートしなくなりました。ブラウザー OAuth（デフォルト）または上記の device-code フローでサインインしてください。OpenClaw は生成された認証情報を独自の agent auth store で管理します。
    </Note>

    ### ステータス表示

    chat の `/status` は、現在の session でどの model runtime が有効かを表示します。
    デフォルトの PI harness は `Runtime: OpenClaw Pi Default` と表示されます。バンドルされた
    Codex app-server harness が選択されている場合、`/status` は
    `Runtime: OpenAI Codex` を表示します。既存の session は記録済みの harness id を保持するため、新しい PI/Codex の選択を `/status` に反映させたい場合は、
    `agentRuntime` 変更後に `/new` または `/reset` を使ってください。

    ### doctor の警告

    このタブの
    `openai-codex/*` route を選択している状態でバンドルされた `codex` plugin が有効な場合、`openclaw doctor` は
    model が依然として PI 経由で解決されると警告します。それが意図した subscription 認証 route であるなら、
    設定はそのままにしてください。ネイティブ Codex
    app-server 実行が必要な場合にだけ、`agentRuntime.id: "codex"` を付けた `openai/<model>` に切り替えてください。

    ### context window 上限

    OpenClaw は、model metadata と runtime context 上限を別々の値として扱います。

    Codex OAuth 経由の `openai-codex/gpt-5.5` では:

    - ネイティブ `contextWindow`: `1000000`
    - デフォルト runtime の `contextTokens` 上限: `272000`

    より小さいデフォルト上限のほうが、実運用ではレイテンシと品質の特性が優れています。`contextTokens` で上書きできます。

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    ネイティブ model metadata を宣言するには `contextWindow` を使ってください。runtime context 予算を制限するには `contextTokens` を使ってください。
    </Note>

    ### catalog の復旧

    OpenClaw は、`gpt-5.5` に対して upstream の Codex catalog metadata が
    存在する場合はそれを使用します。live Codex discovery で、アカウントが認証済みであるにもかかわらず
    `openai-codex/gpt-5.5` の行が欠けている場合、OpenClaw はその OAuth model 行を合成するため、
    Cron、sub-agent、設定済み default-model 実行が
    `Unknown model` で失敗しません。

  </Tab>
</Tabs>

## 画像生成

バンドルされた `openai` plugin は、`image_generate` tool を通じて画像生成を登録します。
同じ `openai/gpt-image-2` model ref を通じて、OpenAI API-key による画像生成と Codex OAuth による画像
生成の両方をサポートします。

| Capability                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth サインイン           |
| Transport                 | OpenAI Images API                  | Codex Responses backend              |
| Max images per request    | 4                                  | 4                                    |
| Edit mode                 | 有効（参照画像は最大 5 枚） | 有効（参照画像は最大 5 枚）   |
| Size overrides            | サポートあり。2K/4K サイズを含む   | サポートあり。2K/4K サイズを含む     |
| Aspect ratio / resolution | OpenAI Images API には転送されない | 安全な場合はサポートされるサイズにマッピングされる |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
共通の tool パラメーター、provider 選択、failover 動作については [画像生成](/ja-JP/tools/image-generation) を参照してください。
</Note>

`gpt-image-2` は、OpenAI の text-to-image 生成と画像
編集の両方のデフォルトです。`gpt-image-1.5`、`gpt-image-1`、`gpt-image-1-mini` は、明示的な
model override として引き続き使用できます。透明背景の
PNG/WebP 出力には `openai/gpt-image-1.5` を使ってください。現在の `gpt-image-2` API は
`background: "transparent"` を拒否します。

透明背景リクエストでは、agent は `image_generate` を
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` または `"webp"`、および
`background: "transparent"` で呼び出すべきです。古い `openai.background` provider option も
引き続き受け付けられます。OpenClaw は、公開 OpenAI および
OpenAI Codex OAuth route を保護するため、デフォルトの `openai/gpt-image-2` 透明背景
リクエストを `gpt-image-1.5` に書き換えます。Azure とカスタム OpenAI 互換 endpoint は、
設定された deployment/model 名を保持します。

同じ設定は、ヘッドレス CLI 実行でも利用できます。

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

入力ファイルから始める `openclaw infer image edit` でも、
同じ `--output-format` と `--background` フラグを使ってください。
`--openai-background` も OpenAI 固有の alias として引き続き利用できます。

Codex OAuth インストールでは、同じ `openai/gpt-image-2` ref を使ってください。`openai-codex`
OAuth profile が設定されている場合、OpenClaw は保存されたその OAuth
access token を解決し、Codex Responses backend を通じて画像リクエストを送信します。
そのリクエストで最初に `OPENAI_API_KEY` を試したり、API キーへ黙ってフォールバックしたりはしません。
direct OpenAI Images API
route を使いたい場合は、API キー、カスタム base URL、または Azure endpoint を使って
`models.providers.openai` を明示的に設定してください。
そのカスタム画像 endpoint が信頼できる LAN/private address 上にある場合は、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。OpenClaw は、
この opt-in がない限り、private/internal OpenAI 互換画像 endpoint をブロックしたままにします。

生成:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

透明 PNG を生成:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

編集:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 動画生成

バンドルされた `openai` plugin は、`video_generate` tool を通じて動画生成を登録します。

| Capability       | Value                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Default model    | `openai/sora-2`                                                                   |
| Modes            | テキストから動画、画像から動画、単一動画の編集                                  |
| Reference inputs | 画像 1 枚または動画 1 本                                                                |
| Size overrides   | サポートあり                                                                         |
| Other overrides  | `aspectRatio`、`resolution`、`audio`、`watermark` は tool warning とともに無視される |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
共通の tool パラメーター、provider 選択、failover 動作については [動画生成](/ja-JP/tools/video-generation) を参照してください。
</Note>

## GPT-5 prompt contribution

OpenClaw は、provider をまたぐ GPT-5 ファミリー実行向けに、共有の GPT-5 prompt contribution を追加します。これは model id に基づいて適用されるため、`openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、およびその他の互換 GPT-5 ref は同じ overlay を受け取ります。古い GPT-4.x model には適用されません。

バンドルされたネイティブ Codex harness は、Codex app-server developer instructions を通じて同じ GPT-5 の動作と Heartbeat overlay を使用するため、`agentRuntime.id: "codex"` で強制された `openai/gpt-5.x` session でも、harness prompt の残りを Codex が管理していても、同じ follow-through と先回りした Heartbeat ガイダンスが維持されます。

GPT-5 contribution は、persona の持続、実行安全性、tool の規律、出力形式、完了チェック、検証のためのタグ付き動作契約を追加します。channel 固有の reply と silent-message の動作は、共有 OpenClaw system prompt と outbound delivery policy に残ります。GPT-5 ガイダンスは、該当する model に対して常に有効です。親しみやすい interaction-style レイヤーは別で、設定可能です。

| Value                  | Effect                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (default) | 親しみやすい interaction-style レイヤーを有効にする |
| `"on"`                 | `"friendly"` の alias                      |
| `"off"`                | 親しみやすい style レイヤーのみを無効にする       |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
値は runtime では大文字小文字を区別しないため、`"Off"` と `"off"` はどちらも親しみやすい style レイヤーを無効にします。
</Tip>

<Note>
従来の `plugins.entries.openai.config.personality` も、共有の `agents.defaults.promptOverlays.gpt5.personality` 設定が未設定の場合は、互換性のためのフォールバックとして引き続き読み取られます。
</Note>

## 音声と speech

<AccordionGroup>
  <Accordion title="音声合成 (TTS)">
    バンドルされた `openai` plugin は、`messages.tts` サーフェスに対して音声合成を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voice | `messages.tts.providers.openai.voice` | `coral` |
    | Speed | `messages.tts.providers.openai.speed` | （未設定） |
    | Instructions | `messages.tts.providers.openai.instructions` | （未設定、`gpt-4o-mini-tts` のみ） |
    | Format | `messages.tts.providers.openai.responseFormat` | voice note では `opus`、file では `mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    利用可能な model: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`。利用可能な voice: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    chat API endpoint に影響を与えずに TTS の base URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定してください。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    バンドルされた `openai` plugin は、
    OpenClaw の media-understanding transcription サーフェスを通じて batch speech-to-text を登録します。

    - デフォルト model: `gpt-4o-transcribe`
    - endpoint: OpenAI REST `/v1/audio/transcriptions`
    - 入力 path: multipart 音声 file upload
    - Discord の voice-channel segment や channel の
      音声添付を含め、inbound 音声 transcription が `tools.media.audio` を使う場所ならどこでも OpenClaw でサポートされます

    inbound 音声 transcription で OpenAI を強制するには:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    言語と prompt のヒントは、共有 audio media config または呼び出しごとの transcription request で指定された場合、OpenAI に転送されます。

  </Accordion>

  <Accordion title="Realtime transcription">
    バンドルされた `openai` plugin は、Voice Call plugin 向けに realtime transcription を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Language | `...openai.language` | （未設定） |
    | Prompt | `...openai.prompt` | （未設定） |
    | Silence duration | `...openai.silenceDurationMs` | `800` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    `wss://api.openai.com/v1/realtime` への WebSocket 接続を、G.711 u-law (`g711_ulaw` / `audio/pcmu`) 音声で使用します。この streaming provider は Voice Call の realtime transcription path 用です。Discord voice は現在、短い segment を録音し、代わりに batch の `tools.media.audio` transcription path を使用します。
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    バンドルされた `openai` plugin は、Voice Call plugin 向けに realtime voice を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voice | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | Silence duration | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    `azureEndpoint` と `azureDeployment` config key により Azure OpenAI をサポートします。双方向の tool calling をサポートします。G.711 u-law 音声形式を使用します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI endpoint

バンドルされた `openai` provider は、base URL を上書きすることで、画像
生成に Azure OpenAI resource を利用できます。画像生成 path では、OpenClaw は
`models.providers.openai.baseUrl` 上の Azure hostname を検出すると、自動的に
Azure の request 形式へ切り替えます。

<Note>
realtime voice は別の設定 path
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`）
を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure
設定については、[音声と speech](#voice-and-speech) の **Realtime
voice** アコーディオンを参照してください。
</Note>

次のような場合は Azure OpenAI を使ってください。

- すでに Azure OpenAI の subscription、quota、または enterprise agreement がある
- Azure が提供するリージョン別のデータ所在地やコンプライアンス制御が必要
- 既存の Azure tenancy 内にトラフィックを維持したい

### 設定

バンドルされた `openai` provider を通じて Azure 画像生成を使うには、
`models.providers.openai.baseUrl` を Azure resource に向け、
`apiKey` に Azure OpenAI key（OpenAI Platform key ではなく）を設定します。

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw は、Azure 画像生成
route に対して次の Azure host suffix を認識します。

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure host 上の画像生成 request に対して、OpenClaw は次を行います。

- `Authorization: Bearer` ではなく `api-key` header を送信する
- deployment 単位の path（`/openai/deployments/{deployment}/...`）を使用する
- 各 request に `?api-version=...` を付加する
- Azure 画像生成呼び出しにはデフォルトで 600 秒の request timeout を使用する。
  呼び出しごとの `timeoutMs` 値は引き続きこのデフォルトを上書きします。

それ以外の base URL（公開 OpenAI、OpenAI 互換 proxy）では、標準の
OpenAI 画像 request 形式が維持されます。

<Note>
`openai` provider の画像生成 path に対する Azure routing には、
OpenClaw 2026.4.22 以降が必要です。これより前のバージョンでは、カスタム
`openai.baseUrl` はすべて公開 OpenAI endpoint と同様に扱われるため、Azure
画像 deployment では失敗します。
</Note>

### API version

Azure 画像生成 path 用に、特定の Azure preview または GA version を固定するには
`AZURE_OPENAI_API_VERSION` を設定してください。

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

この変数が未設定の場合、デフォルトは `2024-12-01-preview` です。

### model 名は deployment 名

Azure OpenAI は model を deployment に結び付けます。バンドルされた `openai` provider を通る Azure 画像生成 request では、OpenClaw の `model` field は
公開 OpenAI model id ではなく、Azure portal で設定した **Azure deployment 名** である必要があります。

`gpt-image-2` を提供する `gpt-image-2-prod` という deployment を作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じ deployment 名ルールは、バンドルされた `openai` provider を通る
画像生成呼び出しにも適用されます。

### リージョンでの利用可能性

Azure 画像生成は現在、一部のリージョンでのみ利用可能です
（例: `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`）。deployment を作成する前に Microsoft の最新リージョン一覧を確認し、
特定の model がそのリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI と公開 OpenAI は、常に同じ画像パラメーターを受け付けるとは限りません。
Azure は、公開 OpenAI が許可するオプション（たとえば
`gpt-image-2` での特定の `background` 値）を拒否したり、特定の model version でのみ
公開したりする場合があります。これらの違いは Azure と基盤 model に由来するものであり、
OpenClaw に由来するものではありません。Azure request が validation error で失敗した場合は、
Azure portal で、その deployment と API version がサポートする
パラメーターセットを確認してください。

<Note>
Azure OpenAI はネイティブ transport と compat 動作を使用しますが、
OpenClaw の非表示 attribution header は受け取りません。詳しくは
[高度な設定](#advanced-configuration) の **Native vs OpenAI-compatible
routes** アコーディオンを参照してください。

画像生成以外の chat または Responses トラフィックを Azure で使う場合は、
オンボーディングフローまたは専用の Azure provider config を使用してください。`openai.baseUrl` だけでは
Azure の API/auth 形式は選択されません。別途
`azure-openai-responses/*` provider が存在します。詳しくは
下の Server-side Compaction アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw は、`openai/*` と `openai-codex/*` の両方で、SSE フォールバック付きの WebSocket 優先（`"auto"`）を使用します。

    `"auto"` モードでは、OpenClaw は次を行います。
    - SSE にフォールバックする前に、初期 WebSocket failure を 1 回再試行する
    - failure 後、WebSocket を約 60 秒間 degraded として扱い、cool-down 中は SSE を使用する
    - retry と reconnect のために、安定した session と turn の identity header を付与する
    - transport の種類をまたいで usage counter（`input_tokens` / `prompt_tokens`）を正規化する

    | Value | 動作 |
    |-------|----------|
    | `"auto"` (default) | WebSocket 優先、SSE フォールバック |
    | `"sse"` | SSE のみを強制 |
    | `"websocket"` | WebSocket のみを強制 |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    関連する OpenAI docs:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClaw は、最初の turn のレイテンシを減らすため、`openai/*` と `openai-codex/*` でデフォルトで WebSocket warm-up を有効にしています。

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fast mode">
    OpenClaw は、`openai/*` と `openai-codex/*` に対して共有の fast-mode toggle を提供します。

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効時、OpenClaw は fast mode を OpenAI priority processing（`service_tier = "priority"`）にマッピングします。既存の `service_tier` 値は維持され、fast mode は `reasoning` や `text.verbosity` を書き換えません。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    session override は config より優先されます。Sessions UI で session override をクリアすると、その session は設定済みデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    OpenAI の API は `service_tier` による priority processing を提供します。OpenClaw では model ごとに設定できます。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    サポートされる値: `auto`, `default`, `flex`, `priority`。

    <Warning>
    `serviceTier` は、ネイティブ OpenAI endpoint（`api.openai.com`）とネイティブ Codex endpoint（`chatgpt.com/backend-api`）にのみ転送されます。いずれかの provider を proxy 経由で route する場合、OpenClaw は `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    direct OpenAI Responses model（`api.openai.com` 上の `openai/*`）では、OpenAI plugin の Pi-harness stream wrapper が server-side Compaction を自動有効化します。

    - `store: true` を強制する（model compat が `supportsStore: false` を設定している場合を除く）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入する
    - デフォルトの `compact_threshold`: `contextWindow` の 70%（取得できない場合は `80000`）

    これは、組み込みの Pi harness path と、組み込み実行で使われる OpenAI provider hook に適用されます。ネイティブ Codex app-server harness は、Codex を通じて独自に context を管理し、`agents.defaults.agentRuntime.id` で別途設定されます。

    <Tabs>
      <Tab title="明示的に有効にする">
        Azure OpenAI Responses のような互換 endpoint で有用です。

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="カスタム threshold">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="無効にする">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` が制御するのは `context_management` の注入だけです。direct OpenAI Responses model は、compat が `supportsStore: false` を設定しない限り、引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    `openai/*` 上の GPT-5 ファミリー実行では、OpenClaw はより厳格な組み込み実行契約を使えます。

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` では、OpenClaw は次を行います。
    - tool action が利用可能なとき、plan のみの turn を成功した進捗として扱わない
    - act-now steer を付けて turn を再試行する
    - 実質的な作業に対して `update_plan` を自動有効化する
    - model が行動せずに計画を続ける場合、明示的な blocked state を表示する

    <Note>
    OpenAI と Codex の GPT-5 ファミリー実行のみに適用されます。その他の provider と古い model ファミリーはデフォルト動作のままです。
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw は、direct OpenAI、Codex、Azure OpenAI endpoint を、汎用的な OpenAI-compatible `/v1` proxy とは別に扱います。

    **Native routes** (`openai/*`, Azure OpenAI):
    - OpenAI の `none` effort をサポートする model に対してのみ `reasoning: { effort: "none" }` を維持する
    - `reasoning.effort: "none"` を拒否する model や proxy では、無効化された reasoning を省略する
    - tool schema をデフォルトで strict mode にする
    - 検証済みのネイティブ host にのみ非表示 attribution header を付与する
    - OpenAI 専用の request 形式（`service_tier`, `store`, reasoning-compat, prompt-cache hint）を維持する

    **Proxy/compatible routes:**
    - より緩い compat 動作を使う
    - ネイティブでない `openai-completions` payload から Completions `store` を削除する
    - OpenAI-compatible Completions proxy 向けに、高度な `params.extra_body`/`params.extraBody` pass-through JSON を受け付ける
    - vLLM などの OpenAI-compatible Completions proxy 向けに `params.chat_template_kwargs` を受け付ける
    - strict な tool schema やネイティブ専用 header を強制しない

    Azure OpenAI はネイティブ transport と compat 動作を使いますが、非表示 attribution header は受け取りません。

  </Accordion>
</AccordionGroup>

## 関連情報

<CardGroup cols={2}>
  <Card title="model 選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、failover 動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共通の画像 tool パラメーターと provider 選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画 tool パラメーターと provider 選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と credential 再利用ルール。
  </Card>
</CardGroup>
