---
read_when:
    - Skills 設定を追加または変更するとき
    - バンドルされた allowlist やインストール動作を調整するとき
summary: Skills の設定スキーマと例
title: Skills 設定
x-i18n:
    generated_at: "2026-04-05T13:00:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7839f39f68c1442dcf4740b09886e0ef55762ce0d4b9f7b4f493a8c130c84579
    source_path: tools/skills-config.md
    workflow: 15
---

# Skills 設定

Skills ローダー/インストール設定の大部分は
`~/.openclaw/openclaw.json` の `skills` 配下にあります。エージェントごとの Skill 可視性は
`agents.defaults.skills` と `agents.list[].skills` 配下にあります。

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime は引き続き Node。bun は非推奨)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // または平文文字列
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

組み込みの画像生成/編集については、`agents.defaults.imageGenerationModel`
とコアの `image_generate` ツールを優先してください。`skills.entries.*` はカスタムまたは
サードパーティ Skill ワークフロー専用です。

特定の画像プロバイダー/モデルを選ぶ場合は、そのプロバイダーの
認証/API キーも設定してください。典型的な例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、
`openai/*` には `OPENAI_API_KEY`、`fal/*` には `FAL_KEY` です。

例:

- ネイティブ Nano Banana 風セットアップ: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- ネイティブ fal セットアップ: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## エージェント Skill allowlist

同じマシン/ワークスペースの Skill ルートを使いつつ、
エージェントごとに表示される Skill セットだけを変えたい場合はエージェント設定を使ってください。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // デフォルトを継承 -> github, weather
      { id: "docs", skills: ["docs-search"] }, // デフォルトを置き換える
      { id: "locked-down", skills: [] }, // Skills なし
    ],
  },
}
```

ルール:

- `agents.defaults.skills`: `agents.list[].skills` を省略した
  エージェント向けの共通ベースライン allowlist。
- デフォルトで Skills を無制限にしたい場合は `agents.defaults.skills` を省略します。
- `agents.list[].skills`: そのエージェント向けの明示的な最終 Skill セット。デフォルトとは
  マージされません。
- `agents.list[].skills: []`: そのエージェントには Skill を公開しません。

## フィールド

- 組み込み Skill ルートには常に `~/.openclaw/skills`、`~/.agents/skills`、
  `<workspace>/.agents/skills`、`<workspace>/skills` が含まれます。
- `allowBundled`: **バンドルされた** Skills のみを対象にした任意の allowlist。設定すると、
  リスト内のバンドル Skill のみが対象になります（managed、agent、workspace Skills には影響しません）。
- `load.extraDirs`: 追加でスキャンする Skill ディレクトリ（最も低い優先度）。
- `load.watch`: Skill フォルダを監視し、Skills スナップショットを更新します（デフォルト: true）。
- `load.watchDebounceMs`: Skill watcher イベントのデバウンス時間（ミリ秒、デフォルト: 250）。
- `install.preferBrew`: 利用可能な場合は brew インストーラーを優先します（デフォルト: true）。
- `install.nodeManager`: Node インストーラーの優先設定（`npm` | `pnpm` | `yarn` | `bun`、デフォルト: `npm`）。
  これは **Skill インストール** のみに影響します。Gateway runtime は引き続き Node を使うべきです
  （WhatsApp/Telegram では Bun は非推奨）。
  - `openclaw setup --node-manager` はより限定的で、現時点では `npm`、
    `pnpm`、`bun` のみ受け付けます。Yarn ベースの Skill インストールを使いたい場合は、
    `skills.install.nodeManager: "yarn"` を手動で設定してください。
- `entries.<skillKey>`: Skill ごとの上書き。
- `agents.defaults.skills`: `agents.list[].skills` を省略したエージェントが
  継承する任意のデフォルト Skill allowlist。
- `agents.list[].skills`: エージェントごとの任意の最終 Skill allowlist。明示的な
  リストは継承されたデフォルトをマージせずに置き換えます。

Skill ごとのフィールド:

- `enabled`: バンドル済み/インストール済みであっても Skill を無効化したい場合は `false` にします。
- `env`: エージェント実行時に注入される環境変数（まだ設定されていない場合のみ）。
- `apiKey`: 主要な env var を宣言する Skills 向けの任意の簡易指定。
  平文文字列または SecretRef オブジェクト（`{ source, provider, id }`）に対応します。

## 注意

- `entries` 配下のキーは、デフォルトでは Skill 名に対応します。Skill が
  `metadata.openclaw.skillKey` を定義している場合は、代わりにそのキーを使ってください。
- 読み込み優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → バンドル Skills →
  `skills.load.extraDirs` です。
- Skills への変更は、watcher が有効なら次のエージェントターンで反映されます。

### サンドボックス化された Skills と env vars

セッションが**サンドボックス化**されている場合、Skill プロセスは Docker 内で実行されます。sandbox は
ホストの `process.env` を継承**しません**。

次のいずれかを使ってください。

- `agents.defaults.sandbox.docker.env`（またはエージェントごとの `agents.list[].sandbox.docker.env`）
- カスタム sandbox イメージに env を焼き込む

グローバル `env` と `skills.entries.<skill>.env/apiKey` は **host** 実行にのみ適用されます。
