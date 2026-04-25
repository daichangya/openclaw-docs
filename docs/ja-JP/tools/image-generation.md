---
read_when:
    - エージェント経由で画像を生成する
    - 画像生成 provider と model を設定する
    - '`image_generate` ツールのパラメーターを理解する'
summary: 設定済み provider（OpenAI、OpenAI Codex OAuth、Google Gemini、OpenRouter、fal、MiniMax、ComfyUI、Vydra、xAI）を使って画像を生成および編集する
title: 画像生成
x-i18n:
    generated_at: "2026-04-25T14:00:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02369928fecac147729ca586cd39e1a88791219ffe26d8e94429d0ea4b1af411
    source_path: tools/image-generation.md
    workflow: 15
---

`image_generate` ツールを使うと、エージェントは設定済み provider を使って画像を生成および編集できます。生成された画像は、エージェントの返信内でメディア添付として自動的に配信されます。

<Note>
少なくとも 1 つの画像生成 provider が利用可能な場合にのみ、このツールは表示されます。エージェントのツール内に `image_generate` が表示されない場合は、`agents.defaults.imageGenerationModel` を設定し、provider の API キーをセットアップするか、OpenAI Codex OAuth でサインインしてください。
</Note>

## クイックスタート

1. 少なくとも 1 つの provider に API キーを設定します（例: `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`）または OpenAI Codex OAuth でサインインします。
2. 必要に応じて、優先 model を設定します。

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuth でも同じ `openai/gpt-image-2` model ref を使います。`openai-codex` OAuth プロファイルが設定されている場合、OpenClaw はまず `OPENAI_API_KEY` を試すのではなく、同じ OAuth プロファイルを通して画像リクエストをルーティングします。API キーや custom/Azure base URL のような明示的な `models.providers.openai` 画像 config を設定すると、直接 OpenAI Images API 経路に戻ります。LocalAI のような OpenAI 互換 LAN endpoint では、custom の `models.providers.openai.baseUrl` を維持し、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` で明示的に有効化してください。private/internal の画像 endpoint はデフォルトで引き続きブロックされます。

3. エージェントにこう依頼します: _「親しみやすいロボットのマスコット画像を生成して。」_

エージェントは自動的に `image_generate` を呼び出します。ツールの許可リスト登録は不要です。provider が利用可能な場合、デフォルトで有効になります。

## 一般的な経路

| Goal                                                 | Model ref                                          | Auth                                 |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| API 課金で OpenAI 画像生成を使う                     | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                     |
| Codex サブスクリプション認証で OpenAI 画像生成を使う | `openai/gpt-image-2`                               | OpenAI Codex OAuth                   |
| OpenRouter 画像生成                                  | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                 |
| Google Gemini 画像生成                               | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` or `GOOGLE_API_KEY` |

同じ `image_generate` ツールが、text-to-image と参照画像編集の両方を扱います。参照が 1 枚なら `image`、複数枚なら `images` を使います。`quality`、`outputFormat`、OpenAI 固有の `background` など、provider がサポートする出力ヒントは利用可能な場合に転送され、provider がサポートしていない場合は無視されたことが報告されます。

## サポートされる provider

| Provider   | Default model                           | 編集サポート                        | Auth                                                  |
| ---------- | --------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                           | あり（最大 4 枚）                   | `OPENAI_API_KEY` または OpenAI Codex OAuth            |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | あり（最大 5 枚の入力画像）         | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`        | あり                                | `GEMINI_API_KEY` または `GOOGLE_API_KEY`              |
| fal        | `fal-ai/flux/dev`                       | あり                                | `FAL_KEY`                                             |
| MiniMax    | `image-01`                              | あり（subject reference）           | `MINIMAX_API_KEY` または MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                              | あり（1 枚、workflow 設定依存）     | クラウドでは `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| Vydra      | `grok-imagine`                          | なし                                | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | あり（最大 5 枚）                   | `XAI_API_KEY`                                         |

実行時に利用可能な provider と model を確認するには、`action: "list"` を使います。

```
/tool image_generate action=list
```

## ツールのパラメーター

<ParamField path="prompt" type="string" required>
画像生成プロンプト。`action: "generate"` で必須です。
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
実行時に利用可能な provider と model を確認するには `"list"` を使います。
</ParamField>

<ParamField path="model" type="string">
provider/model の上書き。例: `openai/gpt-image-2`。
</ParamField>

<ParamField path="image" type="string">
編集モード用の単一参照画像パスまたは URL。
</ParamField>

<ParamField path="images" type="string[]">
編集モード用の複数参照画像（最大 5 枚）。
</ParamField>

<ParamField path="size" type="string">
サイズヒント: `1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>

<ParamField path="aspectRatio" type="string">
アスペクト比: `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`。
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
解像度ヒント。
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
provider がサポートしている場合の品質ヒント。
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
provider がサポートしている場合の出力形式ヒント。
</ParamField>

<ParamField path="count" type="number">
生成する画像数（1～4）。
</ParamField>

<ParamField path="timeoutMs" type="number">
任意の provider リクエストタイムアウト（ミリ秒）。
</ParamField>

<ParamField path="filename" type="string">
出力ファイル名ヒント。
</ParamField>

<ParamField path="openai" type="object">
OpenAI 専用ヒント: `background`、`moderation`、`outputCompression`、`user`。
</ParamField>

すべての provider がすべてのパラメーターをサポートしているわけではありません。fallback provider が完全一致する要求ではなく近いジオメトリオプションをサポートしている場合、OpenClaw は送信前に最も近い対応サイズ、アスペクト比、または解像度へ再マッピングします。`quality` や `outputFormat` などの未サポート出力ヒントは、そのサポートを宣言していない provider では削除され、ツール結果で報告されます。

ツール結果は、適用された設定を報告します。provider fallback 中に OpenClaw がジオメトリを再マッピングした場合、返される `size`、`aspectRatio`、`resolution` の値は実際に送信された内容を反映し、`details.normalization` には要求値から適用値への変換が記録されます。

## 設定

### モデル選択

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Provider 選択順

画像を生成する際、OpenClaw は次の順序で provider を試します。

1. ツール呼び出しの **`model` パラメーター**（エージェントが指定した場合）
2. config の **`imageGenerationModel.primary`**
3. 順番どおりの **`imageGenerationModel.fallbacks`**
4. **自動検出** — 認証で裏付けられた provider デフォルトのみを使用:
   - 現在のデフォルト provider を最初
   - 残りの登録済み画像生成 provider を provider-id 順で

provider が失敗した場合（認証エラー、レート制限など）、次に設定された候補が自動で試されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

注記:

- 呼び出し単位の `model` 上書きは厳密です。OpenClaw はその provider/model のみを試し、設定済みの primary/fallback や自動検出された provider には進みません。
- 自動検出は認証を考慮します。OpenClaw がその provider で実際に認証できる場合にのみ、その provider のデフォルトが候補リストに入ります。
- 自動検出はデフォルトで有効です。画像生成で明示的な `model`、`primary`、`fallbacks` エントリのみを使いたい場合は、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定してください。
- 現在登録されている provider、そのデフォルト model、認証 env var ヒントを確認するには `action: "list"` を使います。

### 画像編集

OpenAI、OpenRouter、Google、fal、MiniMax、ComfyUI、xAI は参照画像の編集をサポートしています。参照画像のパスまたは URL を渡してください。

```
"この写真を水彩画風にして" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google、xAI は `images` パラメーターで最大 5 枚の参照画像をサポートします。fal、MiniMax、ComfyUI は 1 枚をサポートします。

### OpenRouter 画像モデル

OpenRouter 画像生成は同じ `OPENROUTER_API_KEY` を使用し、OpenRouter の chat completions image API を通してルーティングされます。OpenRouter の画像モデルは `openrouter/` プレフィックスで選択します。

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw は `prompt`、`count`、参照画像、および Gemini 互換の `aspectRatio` / `resolution` ヒントを OpenRouter に転送します。現在の組み込み OpenRouter 画像モデルショートカットには `google/gemini-3.1-flash-image-preview`、`google/gemini-3-pro-image-preview`、`openai/gpt-5.4-image-2` が含まれます。設定済み Plugin が何を公開しているかは `action: "list"` を使って確認してください。

### OpenAI `gpt-image-2`

OpenAI 画像生成のデフォルトは `openai/gpt-image-2` です。`openai-codex` OAuth プロファイルが設定されている場合、OpenClaw は Codex サブスクリプション chat model と同じ OAuth プロファイルを再利用し、Codex Responses バックエンド経由で画像リクエストを送信します。`https://chatgpt.com/backend-api` のようなレガシーな Codex base URL は、画像リクエストに対して `https://chatgpt.com/backend-api/codex` に正規化されます。このリクエストで `OPENAI_API_KEY` に黙ってフォールバックすることはありません。直接 OpenAI Images API ルーティングを強制するには、API キー、custom base URL、または Azure endpoint を使って `models.providers.openai` を明示的に設定してください。古い `openai/gpt-image-1` model も引き続き明示的に選択できますが、新しい OpenAI の画像生成および画像編集リクエストでは `gpt-image-2` を使うべきです。

`gpt-image-2` は、同じ `image_generate` ツールで text-to-image 生成と参照画像編集の両方をサポートします。OpenClaw は `prompt`、`count`、`size`、`quality`、`outputFormat`、参照画像を OpenAI に転送します。OpenAI には `aspectRatio` や `resolution` は直接送られません。可能な場合、OpenClaw がそれらをサポートされる `size` にマッピングし、そうでない場合はツールが無視された上書きとして報告します。

OpenAI 固有オプションは `openai` オブジェクト配下にあります。

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` は `transparent`、`opaque`、`auto` を受け付けます。透過出力には `outputFormat` として `png` または `webp` が必要です。`openai.outputCompression` は JPEG/WebP 出力に適用されます。

4K 横長画像を 1 枚生成する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw image generation のためのクリーンなエディトリアルポスター" size=3840x2160 count=1
```

正方形画像を 2 枚生成する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="落ち着いた生産性アプリのアイコンに向けた 2 つのビジュアル方向" size=1024x1024 count=2
```

ローカル参照画像 1 枚を編集する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="被写体は維持し、背景を明るいスタジオセットに置き換えて" image=/path/to/reference.png size=1024x1536
```

複数参照で編集する:

```  
/tool image_generate action=generate model=openai/gpt-image-2 prompt="1 枚目の画像のキャラクター性と 2 枚目の画像のカラーパレットを組み合わせて" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

OpenAI 画像生成を `api.openai.com` ではなく Azure OpenAI デプロイ経由でルーティングするには、OpenAI provider docs の [Azure OpenAI endpoints](/ja-JP/providers/openai#azure-openai-endpoints) を参照してください。

MiniMax 画像生成は、同梱された両方の MiniMax 認証経路で利用できます。

- API キーセットアップでは `minimax/image-01`
- OAuth セットアップでは `minimax-portal/image-01`

## Provider の capabilities

| Capability            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| 生成                  | Yes（最大 4）        | Yes（最大 4）        | Yes（最大 4）       | Yes（最大 9）              | Yes（workflow 定義の出力）         | Yes（1） | Yes（最大 4）        |
| 編集/参照             | Yes（最大 5 枚）     | Yes（最大 5 枚）     | Yes（1 枚）         | Yes（1 枚、subject ref）   | Yes（1 枚、workflow 設定依存）     | No      | Yes（最大 5 枚）     |
| サイズ制御            | Yes（最大 4K）       | Yes                  | Yes                 | No                         | No                                 | No      | No                   |
| アスペクト比          | No                   | Yes                  | Yes（生成のみ）     | Yes                        | No                                 | No      | Yes                  |
| 解像度（1K/2K/4K）    | No                   | Yes                  | Yes                 | No                         | No                                 | No      | Yes（1K/2K）         |

### xAI `grok-imagine-image`

同梱の xAI provider は、プロンプトのみのリクエストには `/v1/images/generations` を使用し、`image` または `images` が存在する場合は `/v1/images/edits` を使用します。

- モデル: `xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
- Count: 最大 4
- 参照: 1 つの `image` または最大 5 つの `images`
- アスペクト比: `1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
- 解像度: `1K`、`2K`
- 出力: OpenClaw 管理の画像添付として返されます

OpenClaw は、共有された cross-provider の `image_generate` コントラクトにそれらの制御が存在するまで、xAI ネイティブの `quality`、`mask`、`user`、または追加のネイティブ専用アスペクト比を意図的に公開しません。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべてのエージェントツール
- [fal](/ja-JP/providers/fal) — fal の画像および動画 provider セットアップ
- [ComfyUI](/ja-JP/providers/comfy) — ローカル ComfyUI および Comfy Cloud workflow セットアップ
- [Google (Gemini)](/ja-JP/providers/google) — Gemini 画像 provider セットアップ
- [MiniMax](/ja-JP/providers/minimax) — MiniMax 画像 provider セットアップ
- [OpenAI](/ja-JP/providers/openai) — OpenAI Images provider セットアップ
- [Vydra](/ja-JP/providers/vydra) — Vydra の画像、動画、speech セットアップ
- [xAI](/ja-JP/providers/xai) — Grok の画像、動画、検索、code execution、TTS セットアップ
- [Configuration Reference](/ja-JP/gateway/config-agents#agent-defaults) — `imageGenerationModel` config
- [Models](/ja-JP/concepts/models) — model 設定とフェイルオーバー
