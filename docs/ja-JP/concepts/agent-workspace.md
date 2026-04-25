---
read_when:
    - agent ワークスペースまたはそのファイルレイアウトを説明する必要がある場合
    - agent ワークスペースをバックアップまたは移行したい場合
summary: 'agent ワークスペース: 保存場所、レイアウト、バックアップ戦略'
title: agent ワークスペース
x-i18n:
    generated_at: "2026-04-25T13:45:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f9531dbd0f7d0c297f448a5e37f413bae48d75068f15ac88b6fdf7f153c974
    source_path: concepts/agent-workspace.md
    workflow: 15
---

ワークスペースは agent のホームです。これは
ファイルツールとワークスペースコンテキストで使われる唯一の作業ディレクトリです。非公開に保ち、メモリとして扱ってください。

これは config、資格情報、セッションを保存する `~/.openclaw/` とは別です。

**重要:** ワークスペースはハードな sandbox ではなく、**デフォルトの cwd** です。
ツールは相対パスをワークスペース基準で解決しますが、sandboxing が有効でない限り、絶対パスではホスト上の別の場所にも到達できます。分離が必要な場合は
[`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing)（および/または agent ごとの sandbox config）を使ってください。
sandboxing が有効で、かつ `workspaceAccess` が `"rw"` でない場合、ツールは
ホストのワークスペースではなく `~/.openclaw/sandboxes` 配下の sandbox ワークスペース内で動作します。

## デフォルトの場所

- デフォルト: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` が設定されていて `"default"` でない場合、デフォルトは
  `~/.openclaw/workspace-<profile>` になります。
- `~/.openclaw/openclaw.json` で上書き:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`、`openclaw configure`、または `openclaw setup` は、
ワークスペースが存在しない場合に作成し、bootstrap ファイルを配置します。
sandbox seed のコピーでは、ワークスペース内の通常ファイルだけが受け入れられます。ソースワークスペース外を指す symlink/hardlink
エイリアスは無視されます。

すでにワークスペースファイルを自分で管理している場合は、bootstrap
ファイル作成を無効にできます。

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 追加のワークスペースフォルダー

古いインストールでは `~/openclaw` が作成されていることがあります。
複数のワークスペースディレクトリを残しておくと、同時に有効なのは 1 つだけなので、
認証や状態のずれによって混乱を招くことがあります。

**推奨:** 有効なワークスペースは 1 つだけにしてください。追加フォルダーをもう使っていないなら、
アーカイブするかゴミ箱へ移動してください（例: `trash ~/openclaw`）。
意図的に複数のワークスペースを維持する場合は、
`agents.defaults.workspace` が有効なものを指していることを確認してください。

`openclaw doctor` は、追加のワークスペースディレクトリを検出すると警告します。

## ワークスペースファイルマップ（各ファイルの意味）

これらはワークスペース内で OpenClaw が想定する標準ファイルです。

- `AGENTS.md`
  - agent の運用指示とメモリの使い方。
  - 毎セッション開始時に読み込まれます。
  - ルール、優先順位、「どう振る舞うか」の詳細を書くのに適しています。

- `SOUL.md`
  - ペルソナ、口調、境界。
  - 毎セッションで読み込まれます。
  - ガイド: [SOUL.md Personality Guide](/ja-JP/concepts/soul)

- `USER.md`
  - ユーザーが誰か、どう呼びかけるか。
  - 毎セッションで読み込まれます。

- `IDENTITY.md`
  - agent の名前、雰囲気、絵文字。
  - bootstrap ritual の間に作成/更新されます。

- `TOOLS.md`
  - ローカルツールと慣習に関するメモ。
  - ツールの利用可否は制御せず、あくまでガイダンスです。

- `HEARTBEAT.md`
  - Heartbeat 実行用の任意の小さなチェックリスト。
  - トークン消費を避けるため短く保ってください。

- `BOOT.md`
  - gateway 再起動時に自動実行される任意の起動チェックリスト（[internal hooks](/ja-JP/automation/hooks) が有効な場合）。
  - 短く保ち、送信には message ツールを使ってください。

- `BOOTSTRAP.md`
  - 初回実行時のみの ritual。
  - 真新しいワークスペースに対してのみ作成されます。
  - ritual 完了後に削除してください。

- `memory/YYYY-MM-DD.md`
  - 日次メモリログ（1 日 1 ファイル）。
  - セッション開始時に今日分と昨日分を読むことを推奨します。

- `MEMORY.md`（任意）
  - 厳選された長期メモリ。
  - メインのプライベートセッションでのみ読み込みます（共有/グループコンテキストでは読み込みません）。

ワークフローと自動メモリフラッシュについては [Memory](/ja-JP/concepts/memory) を参照してください。

- `skills/`（任意）
  - ワークスペース固有の Skills。
  - そのワークスペースにおける最優先の Skill 配置場所です。
  - 名前が衝突した場合、project agent skills、personal agent skills、managed skills、bundled skills、および `skills.load.extraDirs` より優先されます。

- `canvas/`（任意）
  - Node 表示用の Canvas UI ファイル（例: `canvas/index.html`）。

bootstrap ファイルが欠けている場合、OpenClaw は
セッションに「missing file」マーカーを注入して続行します。大きな bootstrap
ファイルは注入時に切り詰められます。制限は `agents.defaults.bootstrapMaxChars`（デフォルト: 12000）および
`agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で調整してください。
`openclaw setup` は既存ファイルを上書きせずに、欠けているデフォルトを再作成できます。

## ワークスペースに含まれないもの

これらは `~/.openclaw/` 配下にあり、ワークスペース repo にコミットしてはいけません。

- `~/.openclaw/openclaw.json`（config）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（model auth profile: OAuth + API キー）
- `~/.openclaw/credentials/`（チャネル/provider 状態と旧 OAuth インポートデータ）
- `~/.openclaw/agents/<agentId>/sessions/`（セッショントランスクリプト + メタデータ）
- `~/.openclaw/skills/`（managed skills）

セッションや config を移行する必要がある場合は、それらを別途コピーし、
バージョン管理には含めないでください。

## Git バックアップ（推奨、非公開）

ワークスペースは非公開のメモリとして扱ってください。**非公開** git repo に入れて、
バックアップ可能かつ復旧可能にしておくことを推奨します。

以下の手順は Gateway が動作しているマシン上で実行してください（ワークスペースはそこにあります）。

### 1) repo を初期化

git がインストールされていれば、真新しいワークスペースは自動的に初期化されます。この
ワークスペースがまだ repo でない場合は、以下を実行してください。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) 非公開リモートを追加（初心者向けオプション）

オプション A: GitHub web UI

1. GitHub で新しい**非公開** repository を作成します。
2. README 付きで初期化しないでください（マージ競合を避けるため）。
3. HTTPS リモート URL をコピーします。
4. リモートを追加して push します。

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

オプション B: GitHub CLI（`gh`）

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

オプション C: GitLab web UI

1. GitLab で新しい**非公開** repository を作成します。
2. README 付きで初期化しないでください（マージ競合を避けるため）。
3. HTTPS リモート URL をコピーします。
4. リモートを追加して push します。

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) 継続的な更新

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## secret をコミットしないでください

非公開 repo であっても、ワークスペースに secret を保存するのは避けてください。

- API キー、OAuth トークン、パスワード、または非公開資格情報。
- `~/.openclaw/` 配下のものすべて。
- チャットや機密添付ファイルの生ダンプ。

機密参照を保存する必要がある場合は、プレースホルダーを使い、
本物の secret は別の場所に保管してください（パスワードマネージャー、環境変数、または `~/.openclaw/`）。

推奨される `.gitignore` の初期例:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## ワークスペースを新しいマシンへ移動する

1. 目的のパス（デフォルトは `~/.openclaw/workspace`）に repo を clone します。
2. `~/.openclaw/openclaw.json` で `agents.defaults.workspace` をそのパスに設定します。
3. `openclaw setup --workspace <path>` を実行して、不足ファイルを配置します。
4. セッションも必要な場合は、古いマシンから `~/.openclaw/agents/<agentId>/sessions/` を
   別途コピーしてください。

## 高度な注意事項

- マルチ agent ルーティングでは、agent ごとに異なるワークスペースを使えます。
  ルーティング設定については [Channel routing](/ja-JP/channels/channel-routing) を参照してください。
- `agents.defaults.sandbox` が有効な場合、メイン以外のセッションでは
  `agents.defaults.sandbox.workspaceRoot` 配下のセッションごとの sandbox
  ワークスペースを使うことがあります。

## 関連

- [Standing Orders](/ja-JP/automation/standing-orders) — ワークスペースファイル内の永続的な指示
- [Heartbeat](/ja-JP/gateway/heartbeat) — HEARTBEAT.md ワークスペースファイル
- [Session](/ja-JP/concepts/session) — セッション保存パス
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox 環境でのワークスペースアクセス
