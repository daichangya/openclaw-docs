---
read_when:
    - エージェントワークスペースまたはそのファイルレイアウトを説明する必要がある場合
    - エージェントワークスペースをバックアップまたは移行したい場合
summary: 'エージェントワークスペース: 場所、レイアウト、バックアップ戦略'
title: Agent Workspace
x-i18n:
    generated_at: "2026-04-05T12:40:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3735633f1098c733415369f9836fdbbc0bf869636a24ed42e95e6784610d964a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# Agent Workspace

ワークスペースはエージェントのホームです。これはファイルツールとワークスペースコンテキストで使用される唯一の作業ディレクトリです。
これを非公開に保ち、メモリとして扱ってください。

これは `~/.openclaw/` とは別で、そちらには設定、認証情報、セッションが保存されます。

**重要:** ワークスペースは**デフォルトのcwd**であり、厳格なサンドボックスではありません。ツールは
相対パスをワークスペース基準で解決しますが、サンドボックス化が有効でない限り、絶対パスは引き続きホスト上の
他の場所に到達できます。分離が必要な場合は、
[`agents.defaults.sandbox`](/gateway/sandboxing)（および必要に応じてエージェントごとのサンドボックス設定）を使用してください。
サンドボックス化が有効で、`workspaceAccess` が `"rw"` でない場合、ツールはホストワークスペースではなく、
`~/.openclaw/sandboxes` 配下のサンドボックスワークスペース内で動作します。

## デフォルトの場所

- デフォルト: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` が設定されていて `"default"` でない場合、デフォルトは
  `~/.openclaw/workspace-<profile>` になります。
- `~/.openclaw/openclaw.json` で上書きできます:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`、`openclaw configure`、または `openclaw setup` は、ワークスペースが存在しない場合に
それを作成し、bootstrapファイルを初期投入します。
サンドボックス用のseedコピーは、ワークスペース内の通常ファイルのみを受け付けます。ソースワークスペース外を
指すsymlink/hardlinkエイリアスは無視されます。

すでにワークスペースファイルを自分で管理している場合は、bootstrapファイルの作成を無効にできます:

```json5
{ agent: { skipBootstrap: true } }
```

## 追加のワークスペースフォルダー

古いインストールでは `~/openclaw` が作成されていることがあります。
複数のワークスペースディレクトリを残しておくと、同時にアクティブなのは1つだけであるため、認証や状態のずれで
混乱を招く可能性があります。

**推奨:** アクティブなワークスペースは1つだけにしてください。追加のフォルダーをもう使っていない場合は、
アーカイブするかゴミ箱に移動してください（例: `trash ~/openclaw`）。
意図的に複数のワークスペースを維持する場合は、
`agents.defaults.workspace` がアクティブなものを指していることを確認してください。

`openclaw doctor` は、追加のワークスペースディレクトリを検出すると警告します。

## ワークスペースファイルマップ（各ファイルの意味）

これらは、OpenClawがワークスペース内にあることを想定している標準ファイルです:

- `AGENTS.md`
  - エージェント向けの運用指示と、メモリの使い方。
  - 毎セッションの開始時に読み込まれます。
  - ルール、優先順位、「どう振る舞うか」の詳細を書くのに適しています。

- `SOUL.md`
  - ペルソナ、トーン、境界。
  - 毎セッションで読み込まれます。
  - ガイド: [SOUL.md Personality Guide](/concepts/soul)

- `USER.md`
  - ユーザーが誰で、どう呼びかけるか。
  - 毎セッションで読み込まれます。

- `IDENTITY.md`
  - エージェントの名前、雰囲気、絵文字。
  - bootstrap ritualの間に作成または更新されます。

- `TOOLS.md`
  - ローカルツールと慣習に関するメモ。
  - ツールの可用性は制御せず、ガイダンスにすぎません。

- `HEARTBEAT.md`
  - heartbeat実行用の任意の小さなチェックリスト。
  - トークン消費を避けるため、短く保ってください。

- `BOOT.md`
  - internal hooksが有効な場合に、Gateway再起動時に実行される任意の起動チェックリスト。
  - 短く保ち、外向きの送信にはmessageツールを使ってください。

- `BOOTSTRAP.md`
  - 初回実行時の一度きりのritual。
  - 新規ワークスペースに対してのみ作成されます。
  - ritualが完了したら削除してください。

- `memory/YYYY-MM-DD.md`
  - 日次メモリログ（1日1ファイル）。
  - セッション開始時に今日分と昨日分を読むことを推奨します。

- `MEMORY.md`（任意）
  - キュレーションされた長期メモリ。
  - mainの非公開セッションでのみ読み込んでください（共有/グループコンテキストでは読み込まないでください）。

ワークフローと自動メモリフラッシュについては [Memory](/concepts/memory) を参照してください。

- `skills/`（任意）
  - ワークスペース固有のSkills。
  - そのワークスペースにおける最優先のSkill配置場所です。
  - 名前が衝突した場合、project agent skills、personal agent skills、managed skills、bundled skills、
    および `skills.load.extraDirs` より優先されます。

- `canvas/`（任意）
  - ノード表示用のCanvas UIファイル（例: `canvas/index.html`）。

bootstrapファイルが欠けている場合、OpenClawはセッションに「missing file」マーカーを挿入して継続します。
大きなbootstrapファイルは挿入時に切り詰められます。
上限は `agents.defaults.bootstrapMaxChars`（デフォルト: 20000）および
`agents.defaults.bootstrapTotalMaxChars`（デフォルト: 150000）で調整してください。
`openclaw setup` は、既存ファイルを上書きせずに不足しているデフォルトを再作成できます。

## ワークスペースに含まれないもの

これらは `~/.openclaw/` 配下にあり、ワークスペースrepoにはコミットすべきではありません:

- `~/.openclaw/openclaw.json`（設定）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（モデル認証プロファイル: OAuth + API keys）
- `~/.openclaw/credentials/`（channel/provider状態とレガシーOAuthインポートデータ）
- `~/.openclaw/agents/<agentId>/sessions/`（セッショントランスクリプト + メタデータ）
- `~/.openclaw/skills/`（managed skills）

セッションや設定を移行する必要がある場合は、それらを別途コピーし、
バージョン管理の対象外にしてください。

## Gitバックアップ（推奨、非公開）

ワークスペースは非公開のメモリとして扱ってください。バックアップと復旧ができるように、
**非公開**のgit repoに入れてください。

これらの手順は、Gatewayが動作しているマシン上で実行してください（ワークスペースはそこにあります）。

### 1) repoを初期化する

gitがインストールされていれば、新規ワークスペースは自動的に初期化されます。
このワークスペースがまだrepoでない場合は、次を実行してください:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) 非公開のremoteを追加する（初心者向けオプション）

オプションA: GitHub web UI

1. GitHubで新しい**非公開**リポジトリを作成します。
2. READMEで初期化しないでください（マージ競合を避けるため）。
3. HTTPSのremote URLをコピーします。
4. remoteを追加してpushします:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

オプションB: GitHub CLI（`gh`）

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

オプションC: GitLab web UI

1. GitLabで新しい**非公開**リポジトリを作成します。
2. READMEで初期化しないでください（マージ競合を避けるため）。
3. HTTPSのremote URLをコピーします。
4. remoteを追加してpushします:

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

## シークレットをコミットしないでください

非公開repoであっても、ワークスペースにシークレットを保存しないでください:

- API keys、OAuth tokens、passwords、または非公開の認証情報。
- `~/.openclaw/` 配下のあらゆるもの。
- チャットや機密添付ファイルの生ダンプ。

機密参照をどうしても保存する必要がある場合は、プレースホルダーを使い、実際の
シークレットは別の場所に保管してください（パスワードマネージャー、環境変数、または `~/.openclaw/`）。

推奨される `.gitignore` の開始例:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## ワークスペースを新しいマシンに移す

1. 目的のパスにrepoをcloneします（デフォルトは `~/.openclaw/workspace`）。
2. `~/.openclaw/openclaw.json` で `agents.defaults.workspace` をそのパスに設定します。
3. `openclaw setup --workspace <path>` を実行して、不足しているファイルを初期投入します。
4. セッションが必要な場合は、古いマシンから `~/.openclaw/agents/<agentId>/sessions/` を
   別途コピーしてください。

## 高度な注意事項

- マルチエージェントルーティングでは、エージェントごとに異なるワークスペースを使用できます。
  ルーティング設定については [Channel routing](/ja-JP/channels/channel-routing) を参照してください。
- `agents.defaults.sandbox` が有効な場合、main以外のセッションは
  `agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのサンドボックスワークスペースを使用できます。

## 関連

- [Standing Orders](/ja-JP/automation/standing-orders) — ワークスペースファイル内の永続的な指示
- [Heartbeat](/gateway/heartbeat) — HEARTBEAT.mdワークスペースファイル
- [Session](/concepts/session) — セッション保存パス
- [Sandboxing](/gateway/sandboxing) — サンドボックス環境でのワークスペースアクセス
