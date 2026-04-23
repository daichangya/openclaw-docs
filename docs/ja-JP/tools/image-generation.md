---
read_when:
    - エージェント経由で画像を生成すること
    - 画像生成 provider とモデルを設定すること
    - '`image_generate` ツールのパラメータを理解すること'
summary: 設定済み provider（OpenAI、Google Gemini、fal、MiniMax、ComfyUI、Vydra、xAI）を使って画像を生成および編集する
title: 画像生成
x-i18n:
    generated_at: "2026-04-23T04:51:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 228049c74dd3437544cda6418da665aed375c0494ef36a6927d15c28d7783bbd
    source_path: tools/image-generation.md
    workflow: 15
---

# 画像生成

`image_generate` ツールを使うと、設定済みの provider を使ってエージェントが画像を生成および編集できます。生成された画像は、エージェントの応答内でメディア添付として自動的に配信されます。

<Note>
このツールは、少なくとも1つの画像生成 provider が利用可能な場合にのみ表示されます。エージェントのツールに `image_generate` が表示されない場合は、`agents.defaults.imageGenerationModel` を設定するか、provider の API キーを設定してください。
</Note>

## クイックスタート

1. 少なくとも1つの provider に API キーを設定します（例: `OPENAI_API_KEY` または `GEMINI_API_KEY`）。
2. 必要に応じて希望するモデルを設定します。

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

3. エージェントにこう依頼します: _「親しみやすいロブスターのマスコット画像を生成して」_

エージェントは自動的に `image_generate` を呼び出します。ツールの allow-list 登録は不要です。provider が利用可能であればデフォルトで有効です。

## 対応 provider

| Provider | デフォルトモデル | 編集対応 | API キー |
| -------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-2`                    | はい（最大5画像）               | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | はい                                | `GEMINI_API_KEY` または `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`                | はい                                | `FAL_KEY`                                             |
| MiniMax  | `image-01`                       | はい（subject reference）            | `MINIMAX_API_KEY` または MiniMax OAuth（`minimax-portal`） |
| ComfyUI  | `workflow`                       | はい（1画像、workflow 設定依存） | `COMFY_API_KEY` または cloud 用 `COMFY_CLOUD_API_KEY`    |
| Vydra    | `grok-imagine`                   | いいえ                                 | `VYDRA_API_KEY`                                       |
| xAI      | `grok-imagine-image`             | はい（最大5画像）               | `XAI_API_KEY`                                         |

ランタイムで利用可能な provider とモデルを確認するには、`action: "list"` を使用します。

```
/tool image_generate action=list
```

## ツールパラメータ

| パラメータ | 型 | 説明 |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | 画像生成プロンプト（`action: "generate"` では必須）                           |
| `action`      | string   | `"generate"`（デフォルト）または provider を確認する `"list"`                               |
| `model`       | string   | provider/model の上書き。例: `openai/gpt-image-2`                                    |
| `image`       | string   | 編集モード用の単一参照画像パスまたは URL                                      |
| `images`      | string[] | 編集モード用の複数参照画像（最大5枚）                                     |
| `size`        | string   | サイズヒント: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`            |
| `aspectRatio` | string   | アスペクト比: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | 解像度ヒント: `1K`, `2K`, または `4K`                                                  |
| `count`       | number   | 生成する画像数（1〜4）                                                    |
| `filename`    | string   | 出力ファイル名ヒント                                                                  |

すべての provider がすべてのパラメータをサポートするわけではありません。フォールバック provider が、正確に要求されたものではなく近いジオメトリオプションをサポートしている場合、OpenClaw は送信前に最も近いサポート済みサイズ、アスペクト比、または解像度に再マップします。本当に未対応の上書きは、引き続きツール結果で報告されます。

ツール結果には適用された設定が報告されます。provider フォールバック中に OpenClaw がジオメトリを再マップした場合、返される `size`、`aspectRatio`、`resolution` の値には実際に送信された内容が反映され、`details.normalization` には要求から適用値への変換が記録されます。

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

### provider 選択順序

画像生成時、OpenClaw は次の順で provider を試します。

1. ツール呼び出し内の **`model` パラメータ**（エージェントが指定した場合）
2. 設定内の **`imageGenerationModel.primary`**
3. 順番どおりの **`imageGenerationModel.fallbacks`**
4. **自動検出** — 認証済み provider のデフォルトのみを使用:
   - 現在のデフォルト provider を最初に
   - 残りの登録済み画像生成 provider を provider-id 順に

provider が失敗した場合（認証エラー、レート制限など）、次の候補が自動的に試されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

注意:

- 自動検出は認証を考慮します。provider デフォルトが候補一覧に入るのは、
  OpenClaw がその provider を実際に認証できる場合だけです。
- 自動検出はデフォルトで有効です。画像
  生成で明示的な `model`、`primary`、`fallbacks`
  エントリーのみを使いたい場合は、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定してください。
- 現在登録されている provider、その
  デフォルトモデル、および認証 env-var ヒントを確認するには、`action: "list"` を使用してください。

### 画像編集

OpenAI、Google、fal、MiniMax、ComfyUI、xAI は参照画像の編集に対応しています。参照画像パスまたは URL を渡してください。

```
"この写真の水彩画バージョンを生成して" + image: "/path/to/photo.jpg"
```

OpenAI、Google、xAI は `images` パラメータで最大5枚の参照画像をサポートします。fal、MiniMax、ComfyUI は1枚をサポートします。

### OpenAI `gpt-image-2`

OpenAI の画像生成はデフォルトで `openai/gpt-image-2` を使用します。古い
`openai/gpt-image-1` モデルも明示的に選択できますが、新しい OpenAI
画像生成および画像編集リクエストでは `gpt-image-2` を使用してください。

`gpt-image-2` は、テキストから画像生成と参照画像
編集の両方を同じ `image_generate` ツールでサポートします。OpenClaw は `prompt`、
`count`、`size`、参照画像を OpenAI に転送します。OpenAI は
`aspectRatio` や `resolution` を直接受け取りません。可能な場合は OpenClaw がそれらをサポートされた `size` にマップし、そうでなければツールが無視された上書きとして報告します。

4K 横長画像を1枚生成する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw の画像生成用クリーンなエディトリアルポスター" size=3840x2160 count=1
```

正方形画像を2枚生成する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="落ち着いた生産性アプリのアイコンに向けた2つのビジュアル案" size=1024x1024 count=2
```

ローカル参照画像を1枚編集する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="被写体は維持し、背景を明るいスタジオセットに置き換える" image=/path/to/reference.png size=1024x1536
```

複数参照で編集する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="1枚目の画像のキャラクター性と2枚目のカラーパレットを組み合わせる" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

MiniMax の画像生成は、バンドルされた両方の MiniMax 認証パスで利用できます。

- API キー設定用の `minimax/image-01`
- OAuth 設定用の `minimax-portal/image-01`

## provider の機能

| 機能 | OpenAI | Google | fal | MiniMax | ComfyUI | Vydra | xAI |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| 生成 | はい（最大4）        | はい（最大4）        | はい（最大4）       | はい（最大9）              | はい（workflow 定義の出力）     | はい（1） | はい（最大4）        |
| 編集/参照 | はい（最大5画像） | はい（最大5画像） | はい（1画像）       | はい（1画像、subject ref） | はい（1画像、workflow 設定依存） | いいえ      | はい（最大5画像） |
| サイズ制御 | はい（最大4K）       | はい                  | はい                 | いいえ                         | いいえ                                 | いいえ      | いいえ                   |
| アスペクト比 | いいえ                   | はい                  | はい（生成のみ） | はい                        | いいえ                                 | いいえ      | はい                  |
| 解像度（1K/2K/4K） | いいえ                   | はい                  | はい                 | いいえ                         | いいえ                                 | いいえ      | はい（1K/2K）          |

### xAI `grok-imagine-image`

バンドルされた xAI provider は、プロンプトのみのリクエストでは `/v1/images/generations` を使用し、
`image` または `images` がある場合は `/v1/images/edits` を使用します。

- モデル: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- 数: 最大4
- 参照: `image` 1枚または `images` 最大5枚
- アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- 解像度: `1K`, `2K`
- 出力: OpenClaw 管理の画像添付として返される

OpenClaw は、xAI ネイティブの `quality`、`mask`、`user`、または
追加のネイティブ専用アスペクト比については、共有の
cross-provider `image_generate` コントラクトにそれらの制御が存在するまでは、意図的に公開しません。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべてのエージェントツール
- [fal](/ja-JP/providers/fal) — fal 画像および動画 provider のセットアップ
- [ComfyUI](/ja-JP/providers/comfy) — ローカル ComfyUI と Comfy Cloud workflow のセットアップ
- [Google (Gemini)](/ja-JP/providers/google) — Gemini 画像 provider のセットアップ
- [MiniMax](/ja-JP/providers/minimax) — MiniMax 画像 provider のセットアップ
- [OpenAI](/ja-JP/providers/openai) — OpenAI Images provider のセットアップ
- [Vydra](/ja-JP/providers/vydra) — Vydra の画像、動画、speech のセットアップ
- [xAI](/ja-JP/providers/xai) — Grok の画像、動画、search、コード実行、TTS のセットアップ
- [Configuration Reference](/ja-JP/gateway/configuration-reference#agent-defaults) — `imageGenerationModel` 設定
- [Models](/ja-JP/concepts/models) — モデル設定と failover
