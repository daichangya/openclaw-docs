---
read_when:
    - エージェント経由で音楽または音声を生成する
    - 音楽生成 provider とモデルを設定する
    - '`music_generate` ツールのパラメータを理解する'
summary: ワークフローベースの Plugin を含む共有 provider で音楽を生成する
title: 音楽生成
x-i18n:
    generated_at: "2026-04-25T14:01:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe66c6dfb54c71b1d08a486c574e8a86cf3731d5339b44b9eef121f045c13cb8
    source_path: tools/music-generation.md
    workflow: 15
---

`music_generate` ツールを使うと、Google、
MiniMax、およびワークフロー設定された ComfyUI のような設定済み provider を通じて、共有の音楽生成 capability で音楽または音声を作成できます。

共有 provider ベースのエージェントセッションでは、OpenClaw は音楽生成を
バックグラウンドタスクとして開始し、task ledger で追跡し、その後トラックの準備ができるとエージェントを再度起こして、完成した音声を元の channel に投稿できるようにします。

<Note>
組み込みの共有ツールは、少なくとも 1 つの音楽生成 provider が利用可能な場合にのみ表示されます。エージェントのツールに `music_generate` が表示されない場合は、`agents.defaults.musicGenerationModel` を設定するか、provider API key を設定してください。
</Note>

## クイックスタート

### 共有 provider ベースの生成

1. 少なくとも 1 つの provider の API key を設定します。たとえば `GEMINI_API_KEY` または
   `MINIMAX_API_KEY`。
2. 任意で preferred model を設定します:

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

3. エージェントにこう依頼します: 「ネオンの街を夜にドライブすることについての、
   アップビートな synthpop トラックを生成して。」

エージェントは `music_generate` を自動的に呼び出します。tool の allow-list 設定は不要です。

セッションを持つエージェント実行ではない、直接的な同期コンテキストでは、組み込み
tool は引き続きインライン生成にフォールバックし、tool result 内に最終メディア path を返します。

プロンプト例:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### ワークフロー駆動の Comfy 生成

バンドル済みの `comfy` Plugin は、
music-generation provider registry を通じて共有 `music_generate` tool に接続されます。

1. `plugins.entries.comfy.config.music` に workflow JSON と
   prompt/output node を設定します。
2. Comfy Cloud を使う場合は、`COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` を設定します。
3. エージェントに音楽を依頼するか、tool を直接呼び出します。

例:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## 共有バンドル済み provider サポート

| Provider | Default model          | Reference inputs | Supported controls                                        | API key                                |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 最大 1 画像      | ワークフロー定義済みの音楽または音声                     | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 最大 10 画像     | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | なし             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                      |

### 宣言済み capability マトリクス

これは、`music_generate`、contract test、
および共有 live sweep で使われる明示的な mode contract です。

| Provider | `generate` | `edit` | Edit limit | Shared live lanes                                                         |
| -------- | ---------- | ------ | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  | Yes        | Yes    | 1 image    | 共有 sweep には含まれない。`extensions/comfy/comfy.live.test.ts` でカバー |
| Google   | Yes        | Yes    | 10 images  | `generate`, `edit`                                                        |
| MiniMax  | Yes        | No     | None       | `generate`                                                                |

実行時に利用可能な共有 provider と model を確認するには、`action: "list"` を使います:

```text
/tool music_generate action=list
```

アクティブなセッションベースの音楽タスクを確認するには、`action: "status"` を使います:

```text
/tool music_generate action=status
```

直接生成の例:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 組み込み tool パラメータ

| Parameter         | Type     | Description                                                                                       |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `prompt`          | string   | 音楽生成プロンプト（`action: "generate"` の場合は必須）                                           |
| `action`          | string   | `"generate"`（デフォルト）、現在のセッションタスク向けの `"status"`、または provider を確認する `"list"` |
| `model`           | string   | provider/model の override。例: `google/lyria-3-pro-preview` または `comfy/workflow`             |
| `lyrics`          | string   | provider が明示的な歌詞入力をサポートする場合の任意の歌詞                                         |
| `instrumental`    | boolean  | provider がサポートする場合、インストゥルメンタルのみの出力を要求                                 |
| `image`           | string   | 単一の参照画像 path または URL                                                                    |
| `images`          | string[] | 複数の参照画像（最大 10）                                                                         |
| `durationSeconds` | number   | provider が duration hint をサポートする場合の目標秒数                                            |
| `timeoutMs`       | number   | 任意の provider request timeout（ミリ秒）                                                         |
| `format`          | string   | provider がサポートする場合の出力形式ヒント（`mp3` または `wav`）                                 |
| `filename`        | string   | 出力 filename ヒント                                                                              |

すべての provider がすべてのパラメータをサポートするわけではありません。OpenClaw は、送信前に入力数などのハード制限を引き続き検証します。provider が duration をサポートしていても、要求値より短い最大値しか使えない場合、OpenClaw は最も近いサポート値に自動で clamp します。選択された provider または model で本当にサポートされない任意ヒントは、warning とともに無視されます。

tool result には適用された設定が報告されます。provider fallback 中に OpenClaw が duration を clamp した場合、返される `durationSeconds` には送信された値が反映され、`details.normalization.durationSeconds` には要求値から適用値への対応が表示されます。

## 共有 provider ベース経路の非同期動作

- セッションベースのエージェント実行: `music_generate` はバックグラウンドタスクを作成し、started/task response を即座に返し、完成したトラックは後続のエージェントメッセージで後から投稿します。
- 重複防止: そのバックグラウンドタスクが同じセッションでまだ `queued` または `running` の間は、後続の `music_generate` 呼び出しは新しい生成を開始せず、タスク status を返します。
- Status 確認: 新しい生成を開始せずに、アクティブなセッションベース音楽タスクを確認するには `action: "status"` を使います。
- タスク追跡: `openclaw tasks list` または `openclaw tasks show <taskId>` を使うと、生成に対する queued、running、および terminal status を確認できます。
- Completion wake: OpenClaw は内部 completion event を同じセッションに再注入するため、モデル自身がユーザー向け follow-up を書けます。
- Prompt hint: 同じセッションで後続の user/manual turn には、小さな runtime hint が付きます。音楽タスクがすでに進行中であることを示し、モデルが盲目的に `music_generate` を再度呼び出さないようにします。
- No-session fallback: 実際のエージェントセッションを持たない direct/local context では、引き続きインライン実行され、同じターン内で最終音声 result を返します。

### タスクライフサイクル

各 `music_generate` request は 4 つの状態を移動します。

1. **queued** -- タスクが作成され、provider が受け付けるのを待っている。
2. **running** -- provider が処理中（通常 30 秒から 3 分。provider と duration に依存）。
3. **succeeded** -- トラックの準備完了。エージェントが起きて会話へ投稿する。
4. **failed** -- provider error または timeout。エージェントが error 詳細付きで起きる。

CLI から status を確認:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

重複防止: 現在のセッションに対して音楽タスクがすでに `queued` または `running` である場合、`music_generate` は新しいタスクを開始せず、既存のタスク status を返します。新しい生成をトリガーせずに明示的に確認するには `action: "status"` を使ってください。

## 設定

### モデル選択

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Provider 選択順序

音楽を生成する際、OpenClaw は provider を次の順序で試します。

1. エージェントが指定した場合、tool 呼び出しの `model` パラメータ
2. config の `musicGenerationModel.primary`
3. 順番どおりの `musicGenerationModel.fallbacks`
4. auth が設定された provider デフォルトのみを使う自動検出:
   - 現在のデフォルト provider を最初に
   - 残りの登録済み音楽生成 provider を provider-id 順で

provider が失敗した場合、次の candidate が自動的に試されます。すべて失敗した場合、
error には各試行の詳細が含まれます。

音楽生成で明示的な `model`、`primary`、および `fallbacks`
エントリのみを使いたい場合は、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定してください。

## Provider に関する注意

- Google は Lyria 3 バッチ生成を使用します。現在のバンドル済みフローは、
  prompt、任意の lyrics text、および任意の reference image をサポートします。
- MiniMax はバッチ `music_generation` endpoint を使います。現在のバンドル済みフローは
  prompt、任意の lyrics、instrumental mode、duration steering、および
  mp3 出力をサポートします。
- ComfyUI のサポートはワークフロー駆動であり、設定された graph と
  prompt/output field の node mapping に依存します。

## Provider capability mode

共有の music-generation contract は現在、明示的な mode 宣言をサポートします。

- prompt-only 生成向けの `generate`
- 1 つ以上の参照画像を request に含む場合の `edit`

新しい provider 実装では、明示的な mode block を優先してください。

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

`maxInputImages`, `supportsLyrics`, および
`supportsFormat` のようなレガシーな flat field だけでは、edit support を広告するには不十分です。provider は
`generate` と `edit` を明示的に宣言し、live test、contract test、および
共有 `music_generate` tool が mode support を決定的に検証できるようにする必要があります。

## 適切な経路の選び方

- model selection、provider failover、および組み込みの async task/status flow を使いたい場合は、共有 provider ベースの経路を使ってください。
- カスタム workflow graph や、共有バンドル済み音楽 capability に含まれない provider が必要な場合は、ComfyUI のような Plugin 経路を使ってください。
- ComfyUI 固有の動作をデバッグしている場合は [ComfyUI](/ja-JP/providers/comfy) を参照してください。共有 provider 動作をデバッグしている場合は、[Google (Gemini)](/ja-JP/providers/google) または [MiniMax](/ja-JP/providers/minimax) から始めてください。

## Live test

共有バンドル済み provider の opt-in live coverage:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

repo wrapper:

```bash
pnpm test:live:media music
```

この live file は、欠けている provider env var を `~/.profile` から読み込み、
デフォルトでは保存済み auth profile より live/env API key を優先し、provider が edit mode を有効にしている場合は
`generate` と宣言済み `edit` coverage の両方を実行します。

現時点では次のとおりです。

- `google`: `generate` と `edit`
- `minimax`: `generate` のみ
- `comfy`: 共有 provider sweep ではなく、個別の Comfy live coverage

バンドル済み ComfyUI 音楽経路の opt-in live coverage:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy の live file は、それらのセクションが設定されている場合、comfy の画像および動画 workflow もカバーします。

## 関連

- [Background Tasks](/ja-JP/automation/tasks) - 分離された `music_generate` 実行のタスク追跡
- [Configuration Reference](/ja-JP/gateway/config-agents#agent-defaults) - `musicGenerationModel` 設定
- [ComfyUI](/ja-JP/providers/comfy)
- [Google (Gemini)](/ja-JP/providers/google)
- [MiniMax](/ja-JP/providers/minimax)
- [Models](/ja-JP/concepts/models) - モデル設定と failover
- [Tools Overview](/ja-JP/tools)
