---
read_when:
    - 1 つの API キーで多くの LLM を使いたい場合
    - OpenClaw で OpenRouter 経由の model を実行したい場合
    - image generation に OpenRouter を使いたい場合
summary: OpenClaw で OpenRouter の統一 API を使って多くの model にアクセスする
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T13:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0dfbe92fbe229b3d0c22fa7997adc1906609bc3ee63c780b1f66f545d327f49
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter は、単一の
エンドポイントと API キーの背後で多くの model にリクエストをルーティングする **統一 API** を提供します。OpenAI 互換なので、base URL を切り替えるだけで大半の OpenAI SDK を使えます。

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [openrouter.ai/keys](https://openrouter.ai/keys) で API キーを作成してください。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="（任意）特定の model に切り替える">
    オンボーディングのデフォルトは `openrouter/auto` です。後から具体的な model を選べます。

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## config 例

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## model ref

<Note>
model ref は `openrouter/<provider>/<model>` というパターンに従います。利用可能な
provider と model の完全な一覧は [/concepts/model-providers](/ja-JP/concepts/model-providers) を参照してください。
</Note>

バンドル済みフォールバック例:

| Model ref                            | Notes                         |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | OpenRouter の自動ルーティング |
| `openrouter/moonshotai/kimi-k2.6`    | MoonshotAI 経由の Kimi K2.6   |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alpha ルート |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alpha ルート |

## image generation

OpenRouter は `image_generate` ツールのバックエンドとしても使えます。OpenRouter の image model を `agents.defaults.imageGenerationModel` に指定してください。

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw は image リクエストを `modalities: ["image", "text"]` 付きで OpenRouter の chat completions image API に送信します。Gemini image model には、サポートされている `aspectRatio` と `resolution` のヒントが OpenRouter の `image_config` を通じて渡されます。

## Text-to-speech

OpenRouter は、OpenAI 互換の
`/audio/speech` エンドポイントを通じて TTS provider としても使えます。

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

`messages.tts.providers.openrouter.apiKey` が省略されている場合、TTS は
まず `models.providers.openrouter.apiKey` を再利用し、その後 `OPENROUTER_API_KEY` を使います。

## 認証とヘッダー

OpenRouter は内部的に API キーを Bearer token として使います。

実際の OpenRouter リクエスト（`https://openrouter.ai/api/v1`）では、OpenClaw は
OpenRouter が文書化している app-attribution ヘッダーも追加します。

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter provider を別の proxy や base URL に向け直した場合、OpenClaw は
それらの OpenRouter 固有ヘッダーや Anthropic cache marker を**注入しません**。
</Warning>

## 高度な設定

<AccordionGroup>
  <Accordion title="Anthropic cache marker">
    検証済みの OpenRouter ルートでは、Anthropic model ref は
    OpenClaw が system/developer prompt block の
    prompt-cache 再利用を改善するために使う、OpenRouter 固有の Anthropic `cache_control` marker を維持します。
  </Accordion>

  <Accordion title="thinking / reasoning の注入">
    サポートされている非 `auto` ルートでは、OpenClaw は選択された thinking レベルを
    OpenRouter proxy の reasoning ペイロードにマッピングします。未対応 model ヒントと
    `openrouter/auto` では、その reasoning 注入はスキップされます。
  </Accordion>

  <Accordion title="OpenAI 専用のリクエスト整形">
    OpenRouter は引き続き proxy スタイルの OpenAI 互換経路を通るため、
    `serviceTier`、Responses `store`、
    OpenAI reasoning-compat ペイロード、prompt-cache ヒントのような
    ネイティブ OpenAI 専用リクエスト整形は転送されません。
  </Accordion>

  <Accordion title="Gemini ベースのルート">
    Gemini ベースの OpenRouter ref は引き続き proxy-Gemini 経路に留まります。そこでは OpenClaw は
    Gemini thought-signature のサニタイズを維持しますが、ネイティブ Gemini
    replay 検証や bootstrap 書き換えは有効にしません。
  </Accordion>

  <Accordion title="provider ルーティングメタデータ">
    model params で OpenRouter provider ルーティングを渡した場合、OpenClaw は
    共有 stream wrapper が実行される前に、それを OpenRouter ルーティングメタデータとして転送します。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="model 選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    agent、model、provider の完全な config リファレンス。
  </Card>
</CardGroup>
