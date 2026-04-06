---
read_when:
    - エージェント経由で動画を生成する場合
    - 動画生成のプロバイダーとモデルを設定する場合
    - video_generateツールのパラメータを理解する場合
summary: 12のプロバイダーバックエンドを使用して、テキスト、画像、または既存の動画から動画を生成します
title: 動画生成
x-i18n:
    generated_at: "2026-04-06T04:43:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90d8a392b35adbd899232b02c55c10895b9d7ffc9858d6ca448f2e4e4a57f12f
    source_path: tools/video-generation.md
    workflow: 15
---

# 動画生成

OpenClawエージェントは、テキストプロンプト、参照画像、または既存の動画から動画を生成できます。12のプロバイダーバックエンドに対応しており、それぞれモデルオプション、入力モード、機能セットが異なります。エージェントは、設定と利用可能なAPIキーに基づいて適切なプロバイダーを自動的に選択します。

<Note>
`video_generate`ツールは、少なくとも1つの動画生成プロバイダーが利用可能な場合にのみ表示されます。エージェントツールに表示されない場合は、プロバイダーのAPIキーを設定するか、`agents.defaults.videoGenerationModel`を構成してください。
</Note>

## クイックスタート

1. 対応している任意のプロバイダーのAPIキーを設定します。

```bash
export GEMINI_API_KEY="your-key"
```

2. 必要に応じてデフォルトモデルを固定します。

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. エージェントに依頼します。

> 夕暮れの中、フレンドリーなロブスターがサーフィンをしている5秒間のシネマティックな動画を生成して。

エージェントは自動的に`video_generate`を呼び出します。ツールの許可リスト設定は不要です。

## 動画を生成するときの動作

動画生成は非同期です。セッション内でエージェントが`video_generate`を呼び出すと、次のように動作します。

1. OpenClawがプロバイダーにリクエストを送信し、ただちにタスクIDを返します。
2. プロバイダーがバックグラウンドでジョブを処理します（通常はプロバイダーと解像度に応じて30秒から5分）。
3. 動画の準備ができると、OpenClawが同じセッションを内部完了イベントで再開します。
4. エージェントが完成した動画を元の会話に投稿します。

ジョブの実行中に同じセッションで重複した`video_generate`呼び出しを行うと、新しい生成を開始する代わりに現在のタスクステータスが返されます。CLIから進行状況を確認するには、`openclaw tasks list`または`openclaw tasks show <taskId>`を使用します。

セッションに紐づいたエージェント実行の外部（たとえば、ツールの直接呼び出し）では、ツールはインライン生成にフォールバックし、同じターンで最終的なメディアパスを返します。

## 対応プロバイダー

| Provider | デフォルトモデル                  | テキスト | 画像参照          | 動画参照         | APIキー                                   |
| -------- | ------------------------------- | ---- | --------------- | --------------- | ---------------------------------------- |
| Alibaba  | `wan2.6-t2v`                    | Yes  | Yes (リモートURL) | Yes (リモートURL) | `MODELSTUDIO_API_KEY`                    |
| BytePlus | `seedance-1-0-lite-t2v-250428`  | Yes  | 画像1枚           | No              | `BYTEPLUS_API_KEY`                       |
| ComfyUI  | `workflow`                      | Yes  | 画像1枚           | No              | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`  | Yes  | 画像1枚           | No              | `FAL_KEY`                                |
| Google   | `veo-3.1-fast-generate-preview` | Yes  | 画像1枚           | 動画1本          | `GEMINI_API_KEY`                         |
| MiniMax  | `MiniMax-Hailuo-2.3`            | Yes  | 画像1枚           | No              | `MINIMAX_API_KEY`                        |
| OpenAI   | `sora-2`                        | Yes  | 画像1枚           | 動画1本          | `OPENAI_API_KEY`                         |
| Qwen     | `wan2.6-t2v`                    | Yes  | Yes (リモートURL) | Yes (リモートURL) | `QWEN_API_KEY`                           |
| Runway   | `gen4.5`                        | Yes  | 画像1枚           | 動画1本          | `RUNWAYML_API_SECRET`                    |
| Together | `Wan-AI/Wan2.2-T2V-A14B`        | Yes  | 画像1枚           | No              | `TOGETHER_API_KEY`                       |
| Vydra    | `veo3`                          | Yes  | 画像1枚 (`kling`) | No              | `VYDRA_API_KEY`                          |
| xAI      | `grok-imagine-video`            | Yes  | 画像1枚           | 動画1本          | `XAI_API_KEY`                            |

一部のプロバイダーは、追加または代替のAPIキー環境変数にも対応しています。詳しくは各[プロバイダーページ](#related)を参照してください。

実行時に利用可能なプロバイダーとモデルを確認するには、`video_generate action=list`を実行します。

## ツールパラメータ

### 必須

| Parameter | Type   | Description                                                                   |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt`  | string | 動画生成のテキスト説明（`action: "generate"`に必須） |

### コンテンツ入力

| Parameter | Type     | Description                      |
| --------- | -------- | -------------------------------- |
| `image`   | string   | 単一の参照画像（パスまたはURL） |
| `images`  | string[] | 複数の参照画像（最大5枚）       |
| `video`   | string   | 単一の参照動画（パスまたはURL） |
| `videos`  | string[] | 複数の参照動画（最大4本）       |

### スタイル制御

| Parameter         | Type    | Description                                                            |
| ----------------- | ------- | ---------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`      | string  | `480P`, `720P`, または `1080P`                                         |
| `durationSeconds` | number  | 目標の長さ（秒、最も近いプロバイダー対応値に丸められます）             |
| `size`            | string  | プロバイダーが対応している場合のサイズ指定                            |
| `audio`           | boolean | 対応している場合に生成音声を有効化                                    |
| `watermark`       | boolean | 対応している場合にプロバイダーの透かしを切り替え                      |

### 高度な設定

| Parameter  | Type   | Description                                     |
| ---------- | ------ | ----------------------------------------------- |
| `action`   | string | `"generate"`（デフォルト）、`"status"`、または `"list"` |
| `model`    | string | プロバイダー/モデルの上書き（例: `runway/gen4.5`） |
| `filename` | string | 出力ファイル名のヒント                            |

すべてのプロバイダーがすべてのパラメータに対応しているわけではありません。未対応の上書き指定はベストエフォートで無視され、ツール結果で警告として報告されます。厳密な機能制限（参照入力が多すぎる場合など）は、送信前に失敗します。

## アクション

- **generate**（デフォルト） -- 指定したプロンプトと任意の参照入力から動画を生成します。
- **status** -- 現在のセッションで実行中の動画タスクの状態を確認します。新しい生成は開始しません。
- **list** -- 利用可能なプロバイダー、モデル、およびその機能を表示します。

## モデル選択

動画を生成する際、OpenClawは次の順序でモデルを解決します。

1. **`model`ツールパラメータ** -- エージェントが呼び出しで指定した場合。
2. **`videoGenerationModel.primary`** -- configから。
3. **`videoGenerationModel.fallbacks`** -- 順番に試行。
4. **自動検出** -- 有効な認証があるプロバイダーを使用し、現在のデフォルトプロバイダーから開始し、その後は残りのプロバイダーをアルファベット順で試します。

プロバイダーが失敗した場合、次の候補が自動的に試されます。すべての候補が失敗した場合、エラーには各試行の詳細が含まれます。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## プロバイダーに関する注意

| Provider | Notes                                                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | DashScope/Model Studioの非同期エンドポイントを使用します。参照画像と動画はリモートの`http(s)` URLである必要があります。                     |
| BytePlus | 参照画像は1枚のみ対応です。                                                                                                                  |
| ComfyUI  | ワークフロー駆動のローカルまたはクラウド実行です。設定されたグラフを通じてテキストから動画、画像から動画に対応します。                    |
| fal      | 長時間実行ジョブにキュー対応フローを使用します。参照画像は1枚のみ対応です。                                                                 |
| Google   | Gemini/Veoを使用します。画像1枚または動画1本の参照に対応します。                                                                            |
| MiniMax  | 参照画像は1枚のみ対応です。                                                                                                                  |
| OpenAI   | 転送されるのは`size`上書きのみです。その他のスタイル上書き（`aspectRatio`、`resolution`、`audio`、`watermark`）は警告付きで無視されます。 |
| Qwen     | Alibabaと同じDashScopeバックエンドです。参照入力はリモートの`http(s)` URLである必要があり、ローカルファイルは事前に拒否されます。         |
| Runway   | data URI経由でローカルファイルに対応します。動画から動画への変換には`runway/gen4_aleph`が必要です。テキストのみの実行では`16:9`と`9:16`のアスペクト比が使えます。 |
| Together | 参照画像は1枚のみ対応です。                                                                                                                  |
| Vydra    | 認証が失われるリダイレクトを避けるため、`https://www.vydra.ai/api/v1`を直接使用します。`veo3`はテキストから動画専用として含まれており、`kling`にはリモート画像URLが必要です。 |
| xAI      | テキストから動画、画像から動画、およびリモート動画の編集/延長フローに対応します。                                                           |

## 設定

OpenClaw configでデフォルトの動画生成モデルを設定します。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

またはCLIから設定します。

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 関連

- [ツール概要](/ja-JP/tools)
- [バックグラウンドタスク](/ja-JP/automation/tasks) -- 非同期動画生成のタスク追跡
- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [BytePlus](/ja-JP/concepts/model-providers#byteplus-international)
- [ComfyUI](/ja-JP/providers/comfy)
- [fal](/ja-JP/providers/fal)
- [Google (Gemini)](/ja-JP/providers/google)
- [MiniMax](/ja-JP/providers/minimax)
- [OpenAI](/ja-JP/providers/openai)
- [Qwen](/ja-JP/providers/qwen)
- [Runway](/ja-JP/providers/runway)
- [Together AI](/ja-JP/providers/together)
- [Vydra](/ja-JP/providers/vydra)
- [xAI](/ja-JP/providers/xai)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#agent-defaults)
- [モデル](/ja-JP/concepts/models)
