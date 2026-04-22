---
read_when:
    - エージェント経由で画像を生成する場合
    - 画像生成プロバイダーとモデルの設定
    - '`image_generate` ツールのパラメーターを理解する場合'
summary: 設定済みプロバイダー（OpenAI、Google Gemini、fal、MiniMax、ComfyUI、Vydra）を使って画像を生成・編集します
title: 画像生成
x-i18n:
    generated_at: "2026-04-22T04:28:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e365cd23f4f8d8c9ce88d57e65f06ac5ae5285b8b7f9ea37f0b08ab5f6ff7235
    source_path: tools/image-generation.md
    workflow: 15
---

# 画像生成

`image_generate` ツールを使うと、エージェントは設定済みプロバイダーを使って画像を作成・編集できます。生成された画像は、エージェントの返信にメディア添付として自動配信されます。

<Note>
少なくとも1つの画像生成プロバイダーが利用可能な場合にのみ、このツールが表示されます。エージェントのツール一覧に `image_generate` が表示されない場合は、`agents.defaults.imageGenerationModel` を設定するか、プロバイダーAPIキーを設定してください。
</Note>

## クイックスタート

1. 少なくとも1つのプロバイダーにAPIキーを設定します（例: `OPENAI_API_KEY` または `GEMINI_API_KEY`）。
2. 必要に応じて、好みのモデルを設定します。

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

3. エージェントにこう依頼します: _「フレンドリーなロブスターマスコットの画像を生成して」_

エージェントは自動的に `image_generate` を呼び出します。ツールの許可リスト設定は不要です。プロバイダーが利用可能な場合、デフォルトで有効になります。

## サポートされるプロバイダー

| プロバイダー | デフォルトモデル | 編集対応 | APIキー |
| -------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-2`                    | はい（最大5画像） | `OPENAI_API_KEY` |
| Google   | `gemini-3.1-flash-image-preview` | はい | `GEMINI_API_KEY` または `GOOGLE_API_KEY` |
| fal      | `fal-ai/flux/dev`                | はい | `FAL_KEY` |
| MiniMax  | `image-01`                       | はい（被写体参照） | `MINIMAX_API_KEY` または MiniMax OAuth（`minimax-portal`） |
| ComfyUI  | `workflow`                       | はい（1画像、workflow設定依存） | クラウド用に `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| Vydra    | `grok-imagine`                   | いいえ | `VYDRA_API_KEY` |

ランタイムで利用可能なプロバイダーとモデルを確認するには、`action: "list"` を使ってください。

```
/tool image_generate action=list
```

## ツールパラメーター

| パラメーター | 型 | 説明 |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | 画像生成プロンプト（`action: "generate"` の場合は必須） |
| `action`      | string   | `"generate"`（デフォルト）または、プロバイダーを確認する `"list"` |
| `model`       | string   | プロバイダー/モデル上書き。例: `openai/gpt-image-2` |
| `image`       | string   | 編集モード用の単一参照画像パスまたはURL |
| `images`      | string[] | 編集モード用の複数参照画像（最大5） |
| `size`        | string   | サイズヒント: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160` |
| `aspectRatio` | string   | アスペクト比: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | 解像度ヒント: `1K`, `2K`, または `4K` |
| `count`       | number   | 生成する画像数（1–4） |
| `filename`    | string   | 出力ファイル名ヒント |

すべてのプロバイダーがすべてのパラメーターをサポートするわけではありません。フォールバック先のプロバイダーが、要求された正確なジオメトリーではなく近いオプションに対応している場合、OpenClawは送信前に最も近い対応済みのサイズ、アスペクト比、または解像度へ再マップします。本当に未対応の上書きは、引き続きツール結果に報告されます。

ツール結果には、適用された設定が報告されます。プロバイダーフォールバック中にOpenClawがジオメトリーを再マップした場合、返される `size`、`aspectRatio`、`resolution` の値は実際に送信された内容を反映し、`details.normalization` に要求値から適用値への変換が記録されます。

## 設定

### モデル選択

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### プロバイダー選択順序

画像生成時、OpenClawは次の順序でプロバイダーを試行します。

1. ツール呼び出しの **`model` パラメーター**（エージェントが指定した場合）
2. configの **`imageGenerationModel.primary`**
3. 順番どおりの **`imageGenerationModel.fallbacks`**
4. **自動検出** — 認証済みプロバイダーデフォルトのみを使用:
   - 現在のデフォルトプロバイダーを先に
   - 残りの登録済み画像生成プロバイダーをプロバイダーID順に

プロバイダーが失敗した場合（認証エラー、レート制限など）、次の候補が自動的に試されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

注:

- 自動検出は認証対応です。OpenClawがそのプロバイダーを実際に認証できる場合にのみ、
  そのプロバイダーデフォルトが候補一覧に入ります。
- 自動検出はデフォルトで有効です。画像生成で明示的な `model`、`primary`、`fallbacks`
  エントリだけを使いたい場合は、
  `agents.defaults.mediaGenerationAutoProviderFallback: false` を設定してください。
- 現在登録されているプロバイダー、それらの
  デフォルトモデル、認証env varヒントを確認するには `action: "list"` を使ってください。

### 画像編集

OpenAI、Google、fal、MiniMax、ComfyUIは参照画像の編集をサポートします。参照画像のパスまたはURLを渡してください。

```
"この写真を水彩画風にして" + image: "/path/to/photo.jpg"
```

OpenAIとGoogleは、`images` パラメーターで最大5つの参照画像をサポートします。fal、MiniMax、ComfyUIは1つまでです。

### OpenAI `gpt-image-2`

OpenAI画像生成のデフォルトは `openai/gpt-image-2` です。古い
`openai/gpt-image-1` モデルも明示的に選択できますが、新しいOpenAIの
画像生成および画像編集リクエストでは `gpt-image-2` を使うべきです。

`gpt-image-2` は、テキストから画像を生成する機能と、参照画像を使った
編集の両方を、同じ `image_generate` ツールでサポートします。OpenClawは `prompt`、
`count`、`size`、参照画像をOpenAIへ転送します。OpenAIには
`aspectRatio` や `resolution` は直接送られません。可能であればOpenClawがそれらを
対応済み `size` にマップし、できない場合はツールが無視された上書きとして報告します。

4K横長画像を1枚生成:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

正方形画像を2枚生成:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

ローカル参照画像1枚を編集:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

複数参照で編集:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

MiniMax画像生成は、バンドルされた両方のMiniMax認証経路で利用できます。

- APIキー設定向けの `minimax/image-01`
- OAuth設定向けの `minimax-portal/image-01`

## プロバイダー機能

| 機能 | OpenAI | Google | fal | MiniMax | ComfyUI | Vydra |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| 生成 | はい（最大4） | はい（最大4） | はい（最大4） | はい（最大9） | はい（workflow定義出力） | はい（1） |
| 編集/参照 | はい（最大5画像） | はい（最大5画像） | はい（1画像） | はい（1画像、被写体参照） | はい（1画像、workflow設定依存） | いいえ |
| サイズ制御 | はい（最大4K） | はい | はい | いいえ | いいえ | いいえ |
| アスペクト比 | いいえ | はい | はい（生成のみ） | はい | いいえ | いいえ |
| 解像度（1K/2K/4K） | いいえ | はい | はい | いいえ | いいえ | いいえ |

## 関連

- [ツール概要](/ja-JP/tools) — 利用可能なすべてのエージェントツール
- [fal](/ja-JP/providers/fal) — fal画像および動画プロバイダー設定
- [ComfyUI](/ja-JP/providers/comfy) — ローカルComfyUIおよびComfy Cloud workflow設定
- [Google (Gemini)](/ja-JP/providers/google) — Gemini画像プロバイダー設定
- [MiniMax](/ja-JP/providers/minimax) — MiniMax画像プロバイダー設定
- [OpenAI](/ja-JP/providers/openai) — OpenAI Imagesプロバイダー設定
- [Vydra](/ja-JP/providers/vydra) — Vydra画像、動画、音声設定
- [設定リファレンス](/ja-JP/gateway/configuration-reference#agent-defaults) — `imageGenerationModel` config
- [モデル](/ja-JP/concepts/models) — モデル設定とフェイルオーバー
