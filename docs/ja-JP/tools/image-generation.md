---
read_when:
    - エージェント経由で画像を生成するとき
    - 画像生成プロバイダーとモデルを設定するとき
    - image_generate ツールのパラメータを理解したいとき
summary: 構成済みプロバイダー（OpenAI、Google Gemini、fal、MiniMax）を使用して画像を生成および編集
title: 画像生成
x-i18n:
    generated_at: "2026-04-05T12:59:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: d38a8a583997ceff6523ce4f51808c97a2b59fe4e5a34cf79cdcb70d7e83aec2
    source_path: tools/image-generation.md
    workflow: 15
---

# 画像生成

`image_generate` ツールを使うと、エージェントは構成済みのプロバイダーを使用して画像を作成および編集できます。生成された画像は、エージェントの返信にメディア添付として自動的に配信されます。

<Note>
このツールは、少なくとも1つの画像生成プロバイダーが利用可能な場合にのみ表示されます。エージェントのツールに `image_generate` が表示されない場合は、`agents.defaults.imageGenerationModel` を設定するか、プロバイダーの API キーを設定してください。
</Note>

## クイックスタート

1. 少なくとも1つのプロバイダーの API キーを設定します（例: `OPENAI_API_KEY` または `GEMINI_API_KEY`）。
2. 必要に応じて使用したいモデルを設定します。

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: "openai/gpt-image-1",
    },
  },
}
```

3. エージェントにこう依頼します: _「親しみやすいロブスターマスコットの画像を生成して。」_

エージェントは自動的に `image_generate` を呼び出します。ツールの allow-list 追加は不要です。プロバイダーが利用可能であればデフォルトで有効になります。

## 対応プロバイダー

| Provider | デフォルトモデル                    | 編集対応            | API キー                                               |
| -------- | ----------------------------------- | ------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-1`                       | はい（最大5画像）   | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview`    | はい                | `GEMINI_API_KEY` または `GOOGLE_API_KEY`              |
| fal      | `fal-ai/flux/dev`                   | はい                | `FAL_KEY`                                             |
| MiniMax  | `image-01`                          | はい（subject reference） | `MINIMAX_API_KEY` または MiniMax OAuth（`minimax-portal`） |

実行時に利用可能なプロバイダーとモデルを確認するには、`action: "list"` を使用します。

```
/tool image_generate action=list
```

## ツールパラメータ

| Parameter     | Type     | 説明                                                                           |
| ------------- | -------- | ------------------------------------------------------------------------------ |
| `prompt`      | string   | 画像生成プロンプト（`action: "generate"` の場合は必須）                        |
| `action`      | string   | `"generate"`（デフォルト）またはプロバイダー確認用の `"list"`                 |
| `model`       | string   | プロバイダー/モデルの上書き。例: `openai/gpt-image-1`                          |
| `image`       | string   | 編集モード用の単一参照画像パスまたは URL                                       |
| `images`      | string[] | 編集モード用の複数参照画像（最大5枚）                                          |
| `size`        | string   | サイズヒント: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024` |
| `aspectRatio` | string   | アスペクト比: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | 解像度ヒント: `1K`, `2K`, または `4K`                                          |
| `count`       | number   | 生成する画像数（1〜4）                                                         |
| `filename`    | string   | 出力ファイル名のヒント                                                         |

すべてのプロバイダーがすべてのパラメータに対応しているわけではありません。このツールは、各プロバイダーが対応するものを渡し、それ以外は無視します。

## 設定

### モデル選択

```json5
{
  agents: {
    defaults: {
      // 文字列形式: プライマリモデルのみ
      imageGenerationModel: "google/gemini-3.1-flash-image-preview",

      // オブジェクト形式: プライマリ + 順序付きフォールバック
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### プロバイダー選択順序

画像を生成するとき、OpenClaw は次の順序でプロバイダーを試します。

1. ツール呼び出しの **`model` パラメータ**（エージェントが指定した場合）
2. config の **`imageGenerationModel.primary`**
3. 順番どおりの **`imageGenerationModel.fallbacks`**
4. **自動検出** — 認証に裏打ちされたプロバイダーデフォルトのみを使用:
   - 現在のデフォルトプロバイダーを最初に使用
   - 残りの登録済み画像生成プロバイダーを provider-id 順で使用

あるプロバイダーが失敗した場合（認証エラー、レート制限など）、次の候補が自動的に試されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

注意:

- 自動検出は認証を考慮します。OpenClaw がそのプロバイダーを実際に認証できる場合にのみ、プロバイダーデフォルトが候補リストに入ります。
- 現在登録されているプロバイダー、そのデフォルトモデル、認証用 env var のヒントを確認するには、`action: "list"` を使用してください。

### 画像編集

OpenAI、Google、fal、MiniMax は参照画像の編集に対応しています。参照画像のパスまたは URL を渡してください。

```
"この写真を水彩画風にして" + image: "/path/to/photo.jpg"
```

OpenAI と Google は `images` パラメータで最大5枚の参照画像に対応します。fal と MiniMax は1枚に対応します。

MiniMax の画像生成は、バンドルされた両方の MiniMax 認証パスで利用できます。

- API キー構成用の `minimax/image-01`
- OAuth 構成用の `minimax-portal/image-01`

## プロバイダー機能

| Capability            | OpenAI               | Google               | fal                 | MiniMax                    |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- |
| 生成                  | はい（最大4枚）      | はい（最大4枚）      | はい（最大4枚）     | はい（最大9枚）            |
| 編集/参照             | はい（最大5画像）    | はい（最大5画像）    | はい（1画像）       | はい（1画像、subject ref） |
| サイズ制御            | はい                 | はい                 | はい                | いいえ                     |
| アスペクト比          | いいえ               | はい                 | はい（生成のみ）    | はい                       |
| 解像度（1K/2K/4K）    | いいえ               | はい                 | はい                | いいえ                     |

## 関連項目

- [ツール概要](/tools) — 利用可能なすべてのエージェントツール
- [設定リファレンス](/ja-JP/gateway/configuration-reference#agent-defaults) — `imageGenerationModel` 設定
- [モデル](/ja-JP/concepts/models) — モデル設定とフェイルオーバー
