---
read_when:
    - メモリ検索providerやembeddingモデルを設定したい場合
    - QMDバックエンドをセットアップしたい場合
    - ハイブリッド検索、MMR、または時間減衰を調整したい場合
    - マルチモーダルメモリインデックス作成を有効にしたい場合
summary: メモリ検索、embedding provider、QMD、ハイブリッド検索、およびマルチモーダルインデックス作成のすべての設定項目
title: メモリ設定リファレンス
x-i18n:
    generated_at: "2026-04-05T12:55:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e4c9740f71f5a47fc5e163742339362d6b95cb4757650c0c8a095cf3078caa
    source_path: reference/memory-config.md
    workflow: 15
---

# メモリ設定リファレンス

このページでは、OpenClawメモリ検索のすべての設定項目を一覧します。
概念的な概要については、次を参照してください:

- [Memory Overview](/concepts/memory) -- メモリの仕組み
- [Builtin Engine](/concepts/memory-builtin) -- デフォルトのSQLiteバックエンド
- [QMD Engine](/concepts/memory-qmd) -- ローカルファーストのサイドカー
- [Memory Search](/concepts/memory-search) -- 検索パイプラインと調整

特に注記がない限り、すべてのメモリ検索設定は
`openclaw.json` の `agents.defaults.memorySearch` 配下にあります。

---

## プロバイダー選択

| Key        | Type      | Default          | Description                                                                      |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------- |
| `provider` | `string`  | 自動検出         | EmbeddingアダプターID: `openai`、`gemini`、`voyage`、`mistral`、`ollama`、`local` |
| `model`    | `string`  | providerデフォルト | Embeddingモデル名                                                              |
| `fallback` | `string`  | `"none"`         | プライマリ失敗時のフォールバックアダプターID                                   |
| `enabled`  | `boolean` | `true`           | メモリ検索を有効または無効にする                                                |

### 自動検出順序

`provider` が設定されていない場合、OpenClawは最初に利用可能なものを選択します:

1. `local` -- `memorySearch.local.modelPath` が設定されていて、そのファイルが存在する場合。
2. `openai` -- OpenAIキーを解決できる場合。
3. `gemini` -- Geminiキーを解決できる場合。
4. `voyage` -- Voyageキーを解決できる場合。
5. `mistral` -- Mistralキーを解決できる場合。

`ollama` はサポートされていますが自動検出されません（明示的に設定してください）。

### APIキー解決

リモートembeddingにはAPIキーが必要です。OpenClawは次から解決します:
auth profile、`models.providers.*.apiKey`、または環境変数。

| Provider | Env var                        | Config key                        |
| -------- | ------------------------------ | --------------------------------- |
| OpenAI   | `OPENAI_API_KEY`               | `models.providers.openai.apiKey`  |
| Gemini   | `GEMINI_API_KEY`               | `models.providers.google.apiKey`  |
| Voyage   | `VOYAGE_API_KEY`               | `models.providers.voyage.apiKey`  |
| Mistral  | `MISTRAL_API_KEY`              | `models.providers.mistral.apiKey` |
| Ollama   | `OLLAMA_API_KEY` （プレースホルダー） | --                           |

Codex OAuthはchat/completionsのみを対象とし、embedding
リクエストには使えません。

---

## リモートエンドポイント設定

カスタムOpenAI互換エンドポイントやproviderデフォルトを上書きする場合:

| Key              | Type     | Description                             |
| ---------------- | -------- | --------------------------------------- |
| `remote.baseUrl` | `string` | カスタムAPI base URL                    |
| `remote.apiKey`  | `string` | APIキーを上書き                         |
| `remote.headers` | `object` | 追加のHTTP header（providerデフォルトとマージ） |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Gemini固有の設定

| Key                    | Type     | Default                | Description                                |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` もサポート   |
| `outputDimensionality` | `number` | `3072`                 | Embedding 2向け: 768、1536、または3072     |

<Warning>
モデルまたは `outputDimensionality` を変更すると、自動的に完全再インデックスが実行されます。
</Warning>

---

## ローカルembedding設定

| Key                   | Type     | Default                | Description                     |
| --------------------- | -------- | ---------------------- | ------------------------------- |
| `local.modelPath`     | `string` | 自動ダウンロード       | GGUFモデルファイルへのパス      |
| `local.modelCacheDir` | `string` | node-llama-cppデフォルト | ダウンロード済みモデルのキャッシュディレクトリ |

デフォルトモデル: `embeddinggemma-300m-qat-Q8_0.gguf`（約0.6 GB、自動ダウンロード）。
ネイティブビルドが必要です: `pnpm approve-builds` の後に `pnpm rebuild node-llama-cpp`。

---

## ハイブリッド検索設定

すべて `memorySearch.query.hybrid` 配下です:

| Key                   | Type      | Default | Description                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | ハイブリッドBM25 + ベクター検索を有効化 |
| `vectorWeight`        | `number`  | `0.7`   | ベクタースコアの重み（0-1）        |
| `textWeight`          | `number`  | `0.3`   | BM25スコアの重み（0-1）            |
| `candidateMultiplier` | `number`  | `4`     | 候補プールサイズの倍率             |

### MMR（多様性）

| Key           | Type      | Default | Description                          |
| ------------- | --------- | ------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false` | MMRによる再ランキングを有効化        |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多様性、1 = 最大関連性        |

### 時間減衰（新しさ）

| Key                          | Type      | Default | Description               |
| ---------------------------- | --------- | ------- | ------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | 新しさブーストを有効化    |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | スコアがN日ごとに半減     |

常設ファイル（`MEMORY.md`、`memory/` 内の非日付ファイル）は減衰しません。

### 完全な例

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## 追加メモリパス

| Key          | Type       | Description                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | インデックス化する追加のディレクトリまたはファイル |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

パスは絶対パスでもworkspace相対でもかまいません。ディレクトリは
`.md` ファイルを再帰的にスキャンします。symlinkの扱いはアクティブなバックエンドに依存します:
組み込みengineはsymlinkを無視しますが、QMDは基盤となるQMD
スキャナーの動作に従います。

agentスコープのcross-agent transcript検索には、
`memory.qmd.paths` ではなく
`agents.list[].memorySearch.qmd.extraCollections` を使用してください。
これらの追加コレクションも同じ `{ path, name, pattern? }` 形式に従いますが、
agentごとにマージされ、パスが現在のworkspace外を指す場合でも明示的な共有名を保持できます。
同じ解決済みパスが `memory.qmd.paths` と
`memorySearch.qmd.extraCollections` の両方に現れた場合、QMDは最初のエントリーを保持し、
重複はスキップします。

---

## マルチモーダルメモリ（Gemini）

Gemini Embedding 2を使って、Markdownと並行して画像や音声もインデックス化します:

| Key                       | Type       | Default    | Description                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | マルチモーダルインデックスを有効化     |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]`、または `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | インデックス対象ファイルの最大サイズ   |

`extraPaths` 内のファイルにのみ適用されます。デフォルトのメモリルートは引き続きMarkdown専用です。
`gemini-embedding-2-preview` が必要です。`fallback` は `"none"` でなければなりません。

サポートされる形式: `.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`
（画像）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音声）。

---

## Embeddingキャッシュ

| Key                | Type      | Default | Description                         |
| ------------------ | --------- | ------- | ----------------------------------- |
| `cache.enabled`    | `boolean` | `false` | チャンクembeddingをSQLiteにキャッシュ |
| `cache.maxEntries` | `number`  | `50000` | 最大キャッシュembedding数            |

再インデックスやtranscript更新時に、変更のないテキストの再embeddingを防ぎます。

---

## バッチインデックス作成

| Key                           | Type      | Default | Description                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | バッチembedding APIを有効化 |
| `remote.batch.concurrency`    | `number`  | `2`     | 並列バッチジョブ数         |
| `remote.batch.wait`           | `boolean` | `true`  | バッチ完了を待機           |
| `remote.batch.pollIntervalMs` | `number`  | --      | ポーリング間隔             |
| `remote.batch.timeoutMinutes` | `number`  | --      | バッチタイムアウト         |

`openai`、`gemini`、`voyage` で利用できます。OpenAIバッチは通常、
大規模なバックフィルで最も高速かつ低コストです。

---

## セッションメモリ検索（実験的）

session transcriptをインデックス化し、`memory_search` 経由で公開します:

| Key                           | Type       | Default      | Description                                |
| ----------------------------- | ---------- | ------------ | ------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`      | セッションインデックスを有効化             |
| `sources`                     | `string[]` | `["memory"]` | transcriptを含めるには `"sessions"` を追加 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 再インデックスのバイト閾値                 |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 再インデックスのメッセージ閾値             |

セッションインデックス作成はopt-inで、非同期に実行されます。結果はわずかに
古くなることがあります。セッションログはディスクに保存されるため、ファイルシステムアクセスを信頼
境界として扱ってください。

---

## SQLiteベクター高速化（sqlite-vec）

| Key                          | Type      | Default | Description                          |
| ---------------------------- | --------- | ------- | ------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`  | ベクタークエリにsqlite-vecを使用     |
| `store.vector.extensionPath` | `string`  | 同梱版  | sqlite-vecのパスを上書き             |

sqlite-vecが利用できない場合、OpenClawは自動的にプロセス内コサイン
類似度へフォールバックします。

---

## インデックス保存先

| Key                   | Type     | Default                               | Description                                  |
| --------------------- | -------- | ------------------------------------- | -------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | インデックス保存場所（`{agentId}` トークン対応） |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 tokenizer（`unicode61` または `trigram`） |

---

## QMDバックエンド設定

有効にするには `memory.backend = "qmd"` を設定します。すべてのQMD設定は
`memory.qmd` 配下にあります:

| Key                      | Type      | Default  | Description                                  |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD実行ファイルパス                          |
| `searchMode`             | `string`  | `search` | 検索コマンド: `search`、`vsearch`、`query`   |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` を自動インデックス化 |
| `paths[]`                | `array`   | --       | 追加パス: `{ name, path, pattern? }`         |
| `sessions.enabled`       | `boolean` | `false`  | セッショントランスクリプトをインデックス化    |
| `sessions.retentionDays` | `number`  | --       | transcript保持期間                           |
| `sessions.exportDir`     | `string`  | --       | エクスポートディレクトリ                     |

### 更新スケジュール

| Key                       | Type      | Default | Description                           |
| ------------------------- | --------- | ------- | ------------------------------------- |
| `update.interval`         | `string`  | `5m`    | 更新間隔                              |
| `update.debounceMs`       | `number`  | `15000` | ファイル変更のデバウンス              |
| `update.onBoot`           | `boolean` | `true`  | 起動時に更新                          |
| `update.waitForBootSync`  | `boolean` | `false` | 更新完了まで起動をブロック            |
| `update.embedInterval`    | `string`  | --      | embedding用の独立した周期             |
| `update.commandTimeoutMs` | `number`  | --      | QMDコマンドのタイムアウト             |
| `update.updateTimeoutMs`  | `number`  | --      | QMD更新処理のタイムアウト             |
| `update.embedTimeoutMs`   | `number`  | --      | QMD embedding処理のタイムアウト       |

### 制限

| Key                       | Type     | Default | Description                   |
| ------------------------- | -------- | ------- | ----------------------------- |
| `limits.maxResults`       | `number` | `6`     | 最大検索結果数                |
| `limits.maxSnippetChars`  | `number` | --      | snippet長の制限               |
| `limits.maxInjectedChars` | `number` | --      | 注入文字数合計の制限          |
| `limits.timeoutMs`        | `number` | `4000`  | 検索タイムアウト              |

### スコープ

どのsessionがQMD検索結果を受け取れるかを制御します。スキーマは
[`session.sendPolicy`](/gateway/configuration-reference#session) と同じです:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

デフォルトはDMのみです。`match.keyPrefix` は正規化されたsession keyに一致し、
`match.rawKeyPrefix` は `agent:<id>:` を含む生のkeyに一致します。

### 引用

`memory.citations` はすべてのバックエンドに適用されます:

| Value            | Behavior                                            |
| ---------------- | --------------------------------------------------- |
| `auto` (default) | snippetに `Source: <path#line>` フッターを含める    |
| `on`             | 常にフッターを含める                                |
| `off`            | フッターを省略する（パスは引き続き内部的にagentへ渡される） |

### 完全なQMDの例

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming（実験的）

Dreamingは `agents.defaults.memorySearch` ではなく、
`plugins.entries.memory-core.config.dreaming` 配下で設定します。概念的な詳細とチャット
コマンドについては、[Dreaming](/concepts/memory-dreaming) を参照してください。

| Key                | Type     | Default        | Description                               |
| ------------------ | -------- | -------------- | ----------------------------------------- |
| `mode`             | `string` | `"off"`        | プリセット: `off`、`core`、`rem`、または `deep` |
| `cron`             | `string` | プリセットデフォルト | スケジュール用cron式の上書き         |
| `timezone`         | `string` | ユーザーのタイムゾーン | スケジュール評価用のタイムゾーン     |
| `limit`            | `number` | プリセットデフォルト | 1サイクルあたりに昇格する候補の最大数 |
| `minScore`         | `number` | プリセットデフォルト | 昇格に必要な最小加重スコア           |
| `minRecallCount`   | `number` | プリセットデフォルト | 最小想起回数閾値                     |
| `minUniqueQueries` | `number` | プリセットデフォルト | 最小ユニーククエリ数閾値             |

### プリセットデフォルト

| Mode   | 間隔           | minScore | minRecallCount | minUniqueQueries |
| ------ | -------------- | -------- | -------------- | ---------------- |
| `off`  | 無効           | --       | --             | --               |
| `core` | 毎日午前3時    | 0.75     | 3              | 2                |
| `rem`  | 6時間ごと      | 0.85     | 4              | 3                |
| `deep` | 12時間ごと     | 0.80     | 3              | 3                |

### 例

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            mode: "core",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```
