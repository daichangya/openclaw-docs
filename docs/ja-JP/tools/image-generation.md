---
read_when:
    - エージェント経由で画像を生成する場合
    - 画像生成プロバイダーとモデルを設定する場合
    - image_generateツールのパラメーターを理解する場合
summary: 設定されたプロバイダー（OpenAI、Google Gemini、fal、MiniMax、ComfyUI、Vydra）を使って画像を生成・編集します
title: 画像生成
x-i18n:
    generated_at: "2026-04-06T04:43:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 903cc522c283a8da2cbd449ae3e25f349a74d00ecfdaf0f323fd8aa3f2107aea
    source_path: tools/image-generation.md
    workflow: 15
---

# 画像生成

`image_generate`ツールを使うと、設定済みのプロバイダーを使用してエージェントが画像を作成・編集できます。生成された画像は、エージェントの返信内でメディア添付として自動的に配信されます。

<Note>
このツールは、少なくとも1つの画像生成プロバイダーが利用可能な場合にのみ表示されます。エージェントのツールに`image_generate`が表示されない場合は、`agents.defaults.imageGenerationModel`を設定するか、プロバイダーのAPIキーを設定してください。
</Note>

## クイックスタート

1. 少なくとも1つのプロバイダーのAPIキーを設定します（例: `OPENAI_API_KEY`または`GEMINI_API_KEY`）。
2. 必要に応じて、優先するモデルを設定します。

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

3. エージェントに次のように依頼します: _「親しみやすいロブスターのマスコット画像を生成して」_

エージェントは自動的に`image_generate`を呼び出します。ツールの許可リスト登録は不要です。プロバイダーが利用可能であれば、デフォルトで有効になります。

## サポートされているプロバイダー

| プロバイダー | デフォルトモデル                 | 編集対応                           | APIキー                                                |
| ------------ | -------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI       | `gpt-image-1`                    | はい（最大5画像）                  | `OPENAI_API_KEY`                                       |
| Google       | `gemini-3.1-flash-image-preview` | はい                               | `GEMINI_API_KEY`または`GOOGLE_API_KEY`                 |
| fal          | `fal-ai/flux/dev`                | はい                               | `FAL_KEY`                                              |
| MiniMax      | `image-01`                       | はい（被写体参照）                 | `MINIMAX_API_KEY`またはMiniMax OAuth（`minimax-portal`） |
| ComfyUI      | `workflow`                       | はい（1画像、ワークフローで設定）  | クラウドでは`COMFY_API_KEY`または`COMFY_CLOUD_API_KEY` |
| Vydra        | `grok-imagine`                   | いいえ                             | `VYDRA_API_KEY`                                        |

実行時に利用可能なプロバイダーとモデルを確認するには、`action: "list"`を使用します。

```
/tool image_generate action=list
```

## ツールのパラメーター

| パラメーター | 型       | 説明                                                                                  |
| ------------ | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | 画像生成プロンプト（`action: "generate"`の場合は必須）                                 |
| `action`      | string   | `"generate"`（デフォルト）または、プロバイダーを確認するための`"list"`                 |
| `model`       | string   | プロバイダー/モデルの上書き。例: `openai/gpt-image-1`                                  |
| `image`       | string   | 編集モード用の単一の参照画像パスまたはURL                                              |
| `images`      | string[] | 編集モード用の複数の参照画像（最大5つ）                                                |
| `size`        | string   | サイズ指定: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`            |
| `aspectRatio` | string   | アスペクト比: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | 解像度指定: `1K`, `2K`, または`4K`                                                     |
| `count`       | number   | 生成する画像数（1〜4）                                                                 |
| `filename`    | string   | 出力ファイル名のヒント                                                                 |

すべてのプロバイダーがすべてのパラメーターをサポートしているわけではありません。このツールは各プロバイダーがサポートする内容を渡し、それ以外は無視し、適用されなかった上書き指定をツール結果で報告します。

## 設定

### モデル選択

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### プロバイダー選択順序

画像を生成する際、OpenClawは次の順序でプロバイダーを試します。

1. ツール呼び出しの**`model`パラメーター**（エージェントが指定した場合）
2. 設定内の**`imageGenerationModel.primary`**
3. 順番どおりの**`imageGenerationModel.fallbacks`**
4. **自動検出** — 認証で利用可能なプロバイダーデフォルトのみを使用:
   - 現在のデフォルトプロバイダーを先に使用
   - 残りの登録済み画像生成プロバイダーをprovider-id順で使用

プロバイダーが失敗した場合（認証エラー、レート制限など）、次の候補が自動的に試されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

注意:

- 自動検出は認証状態を考慮します。プロバイダーのデフォルトは、
  OpenClawがそのプロバイダーで実際に認証できる場合にのみ
  候補リストに入ります。
- 現在登録されているプロバイダー、その
  デフォルトモデル、および認証用env varのヒントを確認するには、
  `action: "list"`を使用してください。

### 画像編集

OpenAI、Google、fal、MiniMax、ComfyUIは参照画像の編集をサポートしています。参照画像のパスまたはURLを渡します。

```
"この写真を水彩画風に生成して" + image: "/path/to/photo.jpg"
```

OpenAIとGoogleは、`images`パラメーターによって最大5つの参照画像をサポートします。fal、MiniMax、ComfyUIは1つをサポートします。

MiniMax画像生成は、バンドルされている両方のMiniMax認証パスで利用できます。

- APIキー設定用の`minimax/image-01`
- OAuth設定用の`minimax-portal/image-01`

## プロバイダーの機能

| 機能                  | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| 生成                  | はい（最大4つ）      | はい（最大4つ）      | はい（最大4つ）     | はい（最大9つ）            | はい（ワークフロー定義の出力）     | はい（1つ） |
| 編集/参照             | はい（最大5画像）    | はい（最大5画像）    | はい（1画像）       | はい（1画像、被写体参照）  | はい（1画像、ワークフローで設定）  | いいえ  |
| サイズ指定            | はい                 | はい                 | はい                | いいえ                     | いいえ                             | いいえ  |
| アスペクト比          | いいえ               | はい                 | はい（生成のみ）    | はい                       | いいえ                             | いいえ  |
| 解像度（1K/2K/4K）    | いいえ               | はい                 | はい                | いいえ                     | いいえ                             | いいえ  |

## 関連

- [ツール概要](/ja-JP/tools) — 利用可能なすべてのエージェントツール
- [fal](/ja-JP/providers/fal) — fal画像・動画プロバイダーの設定
- [ComfyUI](/ja-JP/providers/comfy) — ローカルComfyUIとComfy Cloudワークフローの設定
- [Google (Gemini)](/ja-JP/providers/google) — Gemini画像プロバイダーの設定
- [MiniMax](/ja-JP/providers/minimax) — MiniMax画像プロバイダーの設定
- [OpenAI](/ja-JP/providers/openai) — OpenAI Imagesプロバイダーの設定
- [Vydra](/ja-JP/providers/vydra) — Vydra画像・動画・音声の設定
- [設定リファレンス](/ja-JP/gateway/configuration-reference#agent-defaults) — `imageGenerationModel`設定
- [モデル](/ja-JP/concepts/models) — モデル設定とフェイルオーバー
