---
read_when:
    - エージェント経由で動画を生成する
    - 動画生成 provider とモデルを設定する
    - '`video_generate` ツールのパラメーターを理解する'
summary: 14 の provider バックエンドを使用して、テキスト、画像、または既存の動画から動画を生成する
title: 動画生成
x-i18n:
    generated_at: "2026-04-25T14:02:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a16c56939967a6268e62a267598fe03d2eb3195384ad805652498004fdaf886
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw エージェントは、テキストプロンプト、参照画像、または既存の動画から動画を生成できます。14 の provider バックエンドがサポートされており、それぞれ異なるモデルオプション、入力モード、機能セットを持ちます。エージェントは、設定と利用可能な API キーに基づいて適切な provider を自動的に選択します。

<Note>
`video_generate` ツールは、少なくとも 1 つの動画生成 provider が利用可能な場合にのみ表示されます。エージェントツールに表示されない場合は、provider API キーを設定するか、`agents.defaults.videoGenerationModel` を設定してください。
</Note>

OpenClaw は動画生成を 3 つのランタイムモードとして扱います。

- 参照メディアなしのテキストから動画へのリクエスト用の `generate`
- 1 つ以上の参照画像を含むリクエスト時の `imageToVideo`
- 1 つ以上の参照動画を含むリクエスト時の `videoToVideo`

provider はこれらのモードの任意の部分集合をサポートできます。ツールは送信前にアクティブな
モードを検証し、`action=list` でサポートされているモードを報告します。

## クイックスタート

1. サポートされている任意の provider の API キーを設定します。

```bash
export GEMINI_API_KEY="your-key"
```

2. 必要に応じてデフォルトモデルを固定します。

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. エージェントに依頼します。

> 夕焼けの中でフレンドリーなロブスターがサーフィンする、5 秒のシネマティックな動画を生成して。

エージェントは `video_generate` を自動的に呼び出します。ツール許可リストの設定は不要です。

## 動画を生成するときに何が起こるか

動画生成は非同期です。セッション内でエージェントが `video_generate` を呼び出すと:

1. OpenClaw はリクエストを provider に送信し、すぐにタスク ID を返します。
2. provider はバックグラウンドでジョブを処理します（通常は provider と解像度に応じて 30 秒から 5 分）。
3. 動画の準備ができると、OpenClaw は内部完了イベントで同じセッションを起こします。
4. エージェントは完成した動画を元の会話に投稿します。

ジョブが進行中の間、同じセッション内での重複した `video_generate` 呼び出しは、新しい生成を開始する代わりに現在のタスク状態を返します。CLI から進行状況を確認するには `openclaw tasks list` または `openclaw tasks show <taskId>` を使ってください。

セッションに裏打ちされないエージェント実行の外側（たとえば直接のツール呼び出し）では、ツールはインライン生成にフォールバックし、同じターン内で最終メディアパスを返します。

provider がバイト列を返した場合、生成された動画ファイルは OpenClaw 管理のメディアストレージ配下に保存されます。
デフォルトの生成動画保存上限は動画メディア上限に従い、より大きなレンダリングには `agents.defaults.mediaMaxMb` で引き上げられます。
provider がホストされた出力 URL も返す場合、ローカル永続化がサイズ超過ファイルを拒否しても、OpenClaw はタスク失敗の代わりにその URL を配信できます。

### タスクライフサイクル

各 `video_generate` リクエストは 4 つの状態を移動します。

1. **queued** -- タスクが作成され、provider が受け付けるのを待っている。
2. **running** -- provider が処理中（通常は provider と解像度に応じて 30 秒から 5 分）。
3. **succeeded** -- 動画の準備完了。エージェントが起きて会話に投稿する。
4. **failed** -- provider エラーまたはタイムアウト。エージェントがエラー詳細付きで起きる。

CLI から状態を確認します。

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

重複防止: 現在のセッションですでに動画タスクが `queued` または `running` の場合、`video_generate` は新しいタスクを開始する代わりに既存タスクの状態を返します。新しい生成を引き起こさずに明示的に確認するには `action: "status"` を使用してください。

## サポートされている provider

| Provider              | デフォルトモデル                   | テキスト | 画像参照                                            | 動画参照        | API キー                                  |
| --------------------- | ------------------------------- | ---- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | はい  | はい（リモート URL）                                     | はい（リモート URL） | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | はい  | 最大 2 画像（I2V モデルのみ。先頭 + 最終フレーム） | いいえ               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | はい  | 最大 2 画像（role による先頭 + 最終フレーム）         | いいえ               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | はい  | 最大 9 枚の参照画像                             | 最大 3 本の動画   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | はい  | 1 画像                                              | いいえ               | `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | はい  | 1 画像                                              | いいえ               | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | はい  | 1 画像                                              | 1 動画          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | はい  | 1 画像                                              | いいえ               | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | はい  | 1 画像                                              | 1 動画          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | はい  | はい（リモート URL）                                     | はい（リモート URL） | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | はい  | 1 画像                                              | 1 動画          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | はい  | 1 画像                                              | いいえ               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | はい  | 1 画像（`kling`）                                    | いいえ               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | はい  | 1 画像                                              | 1 動画          | `XAI_API_KEY`                            |

一部の provider は、追加または代替の API キー env var を受け付けます。詳細は各 [provider ページ](#related) を参照してください。

実行時に利用可能な provider、モデル、ランタイムモードを確認するには
`video_generate action=list` を実行してください。

### 宣言された capability マトリクス

これは `video_generate`、契約テスト、
および共有 live sweep で使われる明示的なモード契約です。

| Provider | `generate` | `imageToVideo` | `videoToVideo` | 現在の共有 live レーン                                                                                                                  |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | はい        | はい            | はい            | `generate`, `imageToVideo`; この provider はリモート `http(s)` 動画 URL を必要とするため `videoToVideo` はスキップ                               |
| BytePlus | はい        | はい            | いいえ             | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | はい        | はい            | いいえ             | 共有 sweep には含まれない。ワークフロー固有のカバレッジは Comfy テスト側にある                                                               |
| fal      | はい        | はい            | いいえ             | `generate`, `imageToVideo`                                                                                                               |
| Google   | はい        | はい            | はい            | `generate`, `imageToVideo`; 現在のバッファーバック Gemini/Veo sweep がその入力を受け付けないため共有 `videoToVideo` はスキップ  |
| MiniMax  | はい        | はい            | いいえ             | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | はい        | はい            | はい            | `generate`, `imageToVideo`; この org/入力パスは現在 provider 側の inpaint/remix アクセスを必要とするため共有 `videoToVideo` はスキップ |
| Qwen     | はい        | はい            | はい            | `generate`, `imageToVideo`; この provider はリモート `http(s)` 動画 URL を必要とするため `videoToVideo` はスキップ                               |
| Runway   | はい        | はい            | はい            | `generate`, `imageToVideo`; `videoToVideo` は選択されたモデルが `runway/gen4_aleph` の場合にのみ実行                                      |
| Together | はい        | はい            | いいえ             | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | はい        | はい            | いいえ             | `generate`; バンドル済み `veo3` はテキスト専用で、バンドル済み `kling` はリモート画像 URL を必要とするため共有 `imageToVideo` はスキップ            |
| xAI      | はい        | はい            | はい            | `generate`, `imageToVideo`; この provider は現在リモート MP4 URL を必要とするため `videoToVideo` はスキップ                                |

## ツールパラメーター

### 必須

| パラメーター | 型   | 説明                                                                   |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt`  | string | 生成する動画のテキスト説明（`action: "generate"` では必須） |

### コンテンツ入力

| パラメーター    | 型     | 説明                                                                                                                            |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | 単一の参照画像（パスまたは URL）                                                                                                   |
| `images`     | string[] | 複数の参照画像（最大 9 件）                                                                                                    |
| `imageRoles` | string[] | 結合後の画像リストと位置対応する任意の role ヒント。正規値: `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | 単一の参照動画（パスまたは URL）                                                                                                   |
| `videos`     | string[] | 複数の参照動画（最大 4 件）                                                                                                    |
| `videoRoles` | string[] | 結合後の動画リストと位置対応する任意の role ヒント。正規値: `reference_video`                               |
| `audioRef`   | string   | 単一の参照音声（パスまたは URL）。provider が音声入力をサポートする場合、たとえば BGM や音声参照に使用されます        |
| `audioRefs`  | string[] | 複数の参照音声（最大 3 件）                                                                                                    |
| `audioRoles` | string[] | 結合後の音声リストと位置対応する任意の role ヒント。正規値: `reference_audio`                               |

role ヒントはそのまま provider に転送されます。正規値は
`VideoGenerationAssetRole` ユニオンから来ますが、provider は追加の
role 文字列を受け付ける場合があります。`*Roles` 配列は、対応する
参照リストより多くのエントリを持ってはいけません。1 つずれた指定は
明確なエラーで失敗します。スロットを未設定のままにするには空文字列を使用してください。

### スタイル制御

| パラメーター         | 型    | 説明                                                                             |
| ----------------- | ------- | --------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, または `adaptive`  |
| `resolution`      | string  | `480P`, `720P`, `768P`, または `1080P`                                                      |
| `durationSeconds` | number  | 目標の長さ（秒）。最も近い provider 対応値に丸められます                |
| `size`            | string  | provider がサポートする場合のサイズヒント                                                 |
| `audio`           | boolean | サポートされている場合、出力で生成音声を有効にする。`audioRef*`（入力）とは別です |
| `watermark`       | boolean | サポートされている場合、provider のウォーターマークを切り替える                                             |

`adaptive` は provider 固有のセンチネルです。`adaptive` を capability に宣言している
provider に対しては、そのまま転送されます（たとえば BytePlus
Seedance は、入力画像の寸法から比率を自動検出するためにこれを使用します）。これを宣言していない provider は、
ツール結果の `details.ignoredOverrides` を通じてその値を表示するため、
ドロップされたことがわかるようになっています。

### 高度な設定

| パラメーター         | 型   | 説明                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"`（デフォルト）、`"status"`、または `"list"`                                                                                                                                                                                                                                                                                                      |
| `model`           | string | provider/model オーバーライド（例: `runway/gen4.5`）                                                                                                                                                                                                                                                                                                       |
| `filename`        | string | 出力ファイル名ヒント                                                                                                                                                                                                                                                                                                                                 |
| `timeoutMs`       | number | 任意の provider リクエストタイムアウト（ミリ秒）                                                                                                                                                                                                                                                                                                    |
| `providerOptions` | object | JSON オブジェクトとして渡す provider 固有オプション（例: `{"seed": 42, "draft": true}`）。型付きスキーマを宣言している provider はキーと型を検証し、未知のキーまたは不一致はフォールバック時にその候補をスキップします。宣言済みスキーマのない provider にはオプションがそのまま渡されます。各 provider が何を受け付けるかは `video_generate action=list` を実行して確認してください |

すべての provider がすべてのパラメーターをサポートしているわけではありません。OpenClaw はすでに長さを最も近い provider 対応値に正規化し、さらにフォールバック provider が異なる制御サーフェスを公開している場合は、size-to-aspect-ratio のような翻訳済みジオメトリヒントも再マップします。本当に未対応のオーバーライドはベストエフォートで無視され、ツール結果に警告として報告されます。真の capability 制限（参照入力が多すぎるなど）は送信前に失敗します。

ツール結果は適用された設定を報告します。OpenClaw が provider フォールバック中に長さやジオメトリを再マップした場合、返される `durationSeconds`、`size`、`aspectRatio`、`resolution` の値は送信された内容を反映し、`details.normalization` には要求値から適用値への変換が記録されます。

参照入力はランタイムモードも選択します。

- 参照メディアなし: `generate`
- 画像参照あり: `imageToVideo`
- 動画参照あり: `videoToVideo`
- 参照音声入力は解決されるモードを変更しません。画像/動画参照が選んだモードの上に適用され、`maxInputAudios` を宣言する provider でのみ動作します

画像参照と動画参照の混在は、安定した共有 capability サーフェスではありません。
1 リクエストにつき 1 種類の参照タイプを推奨します。

#### フォールバックと型付きオプション

一部の capability チェックは、ツール境界ではなくフォールバックレイヤーで適用されます。これにより、プライマリ provider の制限を超えるリクエストでも、
対応可能なフォールバック上で引き続き実行できます。

- アクティブ候補が `maxInputAudios` を宣言していない（または
  `0` として宣言している）場合、リクエストに音声参照が含まれているとその候補はスキップされ、
  次の候補が試されます。
- アクティブ候補の `maxDurationSeconds` が要求された
  `durationSeconds` より小さく、かつ候補が
  `supportedDurationSeconds` リストを宣言していない場合、その候補はスキップされます。
- リクエストに `providerOptions` が含まれ、アクティブ候補が
  型付き `providerOptions` スキーマを明示的に宣言している場合、与えられたキーがスキーマ内にない、または値の型が一致しないと、
  その候補はスキップされます。まだスキーマを宣言していない provider には、
  オプションがそのまま渡されます（後方互換のパススルー）。provider は
  空のスキーマ
  （`capabilities.providerOptions: {}`）を宣言することで、すべての provider オプションを明示的に拒否できます。この場合も
  型不一致と同様にスキップされます。

リクエスト中の最初のスキップ理由は `warn` でログされるため、オペレーターは
プライマリ provider がなぜ見送られたかを確認できます。後続のスキップは
長いフォールバックチェーンを静かに保つため `debug` でログされます。すべての候補がスキップされた場合、
集約エラーには各候補のスキップ理由が含まれます。

## アクション

- **generate**（デフォルト） -- 与えられたプロンプトと任意の参照入力から動画を作成します。
- **status** -- 現在のセッションで進行中の動画タスクの状態を、新しい生成を開始せずに確認します。
- **list** -- 利用可能な provider、モデル、およびその capabilities を表示します。

## モデル選択

動画を生成するとき、OpenClaw は次の順序でモデルを解決します。

1. **`model` ツールパラメーター** -- エージェントが呼び出しで指定した場合。
2. **`videoGenerationModel.primary`** -- config から。
3. **`videoGenerationModel.fallbacks`** -- 順に試行。
4. **自動検出** -- 有効な認証を持つ provider を使用し、現在のデフォルト provider から始め、その後残りの provider をアルファベット順で試します。

provider が失敗した場合、次の候補が自動的に試されます。すべての候補が失敗した場合、エラーには各試行の詳細が含まれます。

動画生成で明示的な `model`、`primary`、`fallbacks`
エントリだけを使いたい場合は、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定してください。

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

## provider に関する注意

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope / Model Studio の非同期エンドポイントを使用します。参照画像と動画はリモート `http(s)` URL である必要があります。
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    Provider ID: `byteplus`。

    モデル: `seedance-1-0-pro-250528`（デフォルト）、`seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、`seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V モデル（`*-t2v-*`）は画像入力を受け付けません。I2V モデルと一般的な `*-pro-*` モデルは単一の参照画像（先頭フレーム）をサポートします。画像は位置指定で渡すか、`role: "first_frame"` を設定してください。T2V モデル ID は、画像が指定されると対応する I2V バリアントに自動的に切り替えられます。

    サポートされる `providerOptions` キー: `seed`（number）、`draft`（boolean — 480p を強制）、`camera_fixed`（boolean）。

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin が必要です。Provider ID: `byteplus-seedance15`。モデル: `seedance-1-5-pro-251215`。

    統一された `content[]` API を使用します。最大 2 枚の入力画像（`first_frame` + `last_frame`）をサポートします。すべての入力はリモート `https://` URL である必要があります。各画像に `role: "first_frame"` / `"last_frame"` を設定するか、位置指定で画像を渡してください。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。`audio: true` は `generate_audio` にマップされます。`providerOptions.seed`（number）が転送されます。

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin が必要です。Provider ID: `byteplus-seedance2`。モデル: `dreamina-seedance-2-0-260128`、`dreamina-seedance-2-0-fast-260128`。

    統一された `content[]` API を使用します。最大 9 枚の参照画像、3 本の参照動画、3 件の参照音声をサポートします。すべての入力はリモート `https://` URL である必要があります。各アセットに `role` を設定してください — サポートされる値: `"first_frame"`、`"last_frame"`、`"reference_image"`、`"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。`audio: true` は `generate_audio` にマップされます。`providerOptions.seed`（number）が転送されます。

  </Accordion>

  <Accordion title="ComfyUI">
    ワークフロー駆動のローカルまたはクラウド実行です。設定されたグラフを通じて text-to-video と image-to-video をサポートします。
  </Accordion>

  <Accordion title="fal">
    長時間実行ジョブにキューバックドのフローを使用します。単一画像参照のみです。
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    1 枚の画像または 1 本の動画参照をサポートします。
  </Accordion>

  <Accordion title="MiniMax">
    単一画像参照のみです。
  </Accordion>

  <Accordion title="OpenAI">
    `size` オーバーライドのみが転送されます。その他のスタイルオーバーライド（`aspectRatio`、`resolution`、`audio`、`watermark`）は警告付きで無視されます。
  </Accordion>

  <Accordion title="Qwen">
    Alibaba と同じ DashScope バックエンドです。参照入力はリモート `http(s)` URL である必要があり、ローカルファイルは事前に拒否されます。
  </Accordion>

  <Accordion title="Runway">
    data URI を介してローカルファイルをサポートします。video-to-video には `runway/gen4_aleph` が必要です。テキスト専用実行では `16:9` と `9:16` のアスペクト比が公開されます。
  </Accordion>

  <Accordion title="Together">
    単一画像参照のみです。
  </Accordion>

  <Accordion title="Vydra">
    認証が落ちるリダイレクトを避けるため、`https://www.vydra.ai/api/v1` を直接使用します。`veo3` は text-to-video 専用として同梱され、`kling` はリモート画像 URL を必要とします。
  </Accordion>

  <Accordion title="xAI">
    text-to-video、image-to-video、リモート動画の編集/延長フローをサポートします。
  </Accordion>
</AccordionGroup>

## provider capability モード

共有の動画生成契約では、provider がフラットな集約上限だけでなく、モード固有の capability を宣言できるようになりました。新しい provider 実装では、明示的なモードブロックを優先してください。

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

`maxInputImages` や `maxInputVideos` のようなフラットな集約フィールドだけでは、transform モード対応を示すには不十分です。provider は `generate`、`imageToVideo`、`videoToVideo` を明示的に宣言し、live テスト、契約テスト、および共有 `video_generate` ツールがモード対応を決定的に検証できるようにしてください。

## live テスト

共有のバンドル済み provider 向けオプトイン live カバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

リポジトリラッパー:

```bash
pnpm test:live:media video
```

この live ファイルは、欠けている provider env var を `~/.profile` から読み込み、デフォルトで保存済み auth profile より live/env API キーを優先し、デフォルトでリリース安全なスモークを実行します。

- sweep 内の FAL 以外のすべての provider に対する `generate`
- 1 秒のロブスタープロンプト
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  からの provider ごとの操作上限（デフォルト `180000`）

FAL は、provider 側キュー遅延がリリース時間を支配する可能性があるためオプトインです。

```bash
pnpm test:live:media video --video-providers fal
```

共有 sweep がローカルメディアで安全に実行できる宣言済み transform
モードも実行するには、`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定してください。

- `capabilities.imageToVideo.enabled` のときの `imageToVideo`
- `capabilities.videoToVideo.enabled` かつ provider/model
  が共有 sweep でバッファーバックのローカル動画入力を受け付けるときの `videoToVideo`

現在、共有 `videoToVideo` live レーンは次をカバーしています。

- `runway`（`runway/gen4_aleph` を選択した場合のみ）

## config

OpenClaw config でデフォルトの動画生成モデルを設定します。

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

または CLI から:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 関連

- [Tools Overview](/ja-JP/tools)
- [Background Tasks](/ja-JP/automation/tasks) -- 非同期動画生成のタスク追跡
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
- [Configuration Reference](/ja-JP/gateway/config-agents#agent-defaults)
- [Models](/ja-JP/concepts/models)
