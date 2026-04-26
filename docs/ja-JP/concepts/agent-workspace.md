---
read_when:
    - エージェントワークスペースまたはそのファイルレイアウトを説明する必要がある
    - エージェントワークスペースをバックアップまたは移行したい
sidebarTitle: Agent workspace
summary: 'エージェントワークスペース: 場所、レイアウト、バックアップ戦略'
title: エージェントワークスペース
x-i18n:
    generated_at: "2026-04-26T11:27:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

ワークスペースはエージェントのホームです。これは、ファイルツールとワークスペースコンテキストで使用される唯一の作業ディレクトリです。プライベートに保ち、メモリとして扱ってください。

これは、config、credentials、sessions を保存する `~/.openclaw/` とは別です。

<Warning>
ワークスペースはハードなサンドボックスではなく、**デフォルトの cwd** です。ツールは相対パスをワークスペース基準で解決しますが、sandboxing が有効でない限り、絶対パスでは引き続きホスト上の他の場所に到達できます。分離が必要な場合は、[`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing)（および/またはエージェントごとのsandbox config）を使用してください。

sandboxing が有効で、`workspaceAccess` が `"rw"` でない場合、ツールはホストのワークスペースではなく、`~/.openclaw/sandboxes` 配下のsandboxワークスペース内で動作します。
</Warning>

## デフォルトの場所

- デフォルト: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` が設定されていて `"default"` でない場合、デフォルトは `~/.openclaw/workspace-<profile>` になります。
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

`openclaw onboard`、`openclaw configure`、または `openclaw setup` は、ワークスペースを作成し、不足している場合はbootstrapファイルを初期配置します。

<Note>
Sandbox seed のコピーでは、ワークスペース内の通常ファイルのみ受け付けます。ソースワークスペースの外を指す symlink/hardlink エイリアスは無視されます。
</Note>

すでにワークスペースファイルを自分で管理している場合は、bootstrapファイル作成を無効にできます。

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 追加のワークスペースフォルダー

古いインストールでは `~/openclaw` が作成されている場合があります。複数のワークスペースディレクトリを残しておくと、同時にアクティブなのは1つだけなので、認証や状態のずれがわかりにくくなることがあります。

<Note>
**推奨:** アクティブなワークスペースは1つだけにしてください。追加フォルダーをもう使っていない場合は、アーカイブするかゴミ箱へ移動してください（例: `trash ~/openclaw`）。意図的に複数のワークスペースを保持する場合は、`agents.defaults.workspace` がアクティブなものを指していることを確認してください。

`openclaw doctor` は、追加のワークスペースディレクトリを検出すると警告します。
</Note>

## ワークスペースファイルマップ

これらは、OpenClaw がワークスペース内にあることを想定する標準ファイルです。

<AccordionGroup>
  <Accordion title="AGENTS.md — 運用指示">
    エージェント向けの運用指示と、メモリの使い方。すべてのセッション開始時に読み込まれます。ルール、優先順位、「どう振る舞うか」の詳細を書くのに適しています。
  </Accordion>
  <Accordion title="SOUL.md — ペルソナとトーン">
    ペルソナ、トーン、境界。毎セッション読み込まれます。ガイド: [SOUL.md personality guide](/ja-JP/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md — ユーザー情報">
    ユーザーが誰か、どう呼びかけるか。毎セッション読み込まれます。
  </Accordion>
  <Accordion title="IDENTITY.md — 名前、雰囲気、絵文字">
    エージェントの名前、雰囲気、絵文字。bootstrap ritual 中に作成/更新されます。
  </Accordion>
  <Accordion title="TOOLS.md — ローカルツールの慣例">
    ローカルツールや慣例に関するメモ。ツールの可用性は制御せず、ガイダンスのみです。
  </Accordion>
  <Accordion title="HEARTBEAT.md — Heartbeatチェックリスト">
    Heartbeat実行用の任意の小さなチェックリスト。トークン消費を避けるため短く保ってください。
  </Accordion>
  <Accordion title="BOOT.md — 起動チェックリスト">
    gateway再起動時に自動実行される任意の起動チェックリスト（[internal hooks](/ja-JP/automation/hooks) が有効な場合）。短く保ち、送信にはmessageツールを使ってください。
  </Accordion>
  <Accordion title="BOOTSTRAP.md — 初回実行ritual">
    一度きりの初回実行ritual。真新しいワークスペースにのみ作成されます。ritual が完了したら削除してください。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — 日次メモリログ">
    日次メモリログ（1日1ファイル）。セッション開始時に今日分と昨日分を読むことを推奨します。
  </Accordion>
  <Accordion title="MEMORY.md — キュレートされた長期メモリ（任意）">
    キュレートされた長期メモリ。メインのプライベートセッションでのみ読み込んでください（共有/グループコンテキストではありません）。ワークフローと自動メモリflushについては [Memory](/ja-JP/concepts/memory) を参照してください。
  </Accordion>
  <Accordion title="skills/ — ワークスペースSkills（任意）">
    ワークスペース固有のSkills。そのワークスペースで最も優先度の高いskillの場所です。名前が衝突した場合、project agent skills、personal agent skills、managed skills、bundled skills、`skills.load.extraDirs` より優先されます。
  </Accordion>
  <Accordion title="canvas/ — Canvas UIファイル（任意）">
    Node表示用のCanvas UIファイル（例: `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
bootstrapファイルが欠けている場合、OpenClaw はセッションに「missing file」マーカーを注入して続行します。大きいbootstrapファイルは注入時に切り詰められます。上限は `agents.defaults.bootstrapMaxChars`（デフォルト: 12000）と `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で調整できます。`openclaw setup` は既存ファイルを上書きせずに、不足しているデフォルトを再作成できます。
</Note>

## ワークスペースに含まれないもの

これらは `~/.openclaw/` 配下にあり、ワークスペースrepoにコミットすべきではありません。

- `~/.openclaw/openclaw.json`（config）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（モデル認証プロファイル: OAuth + API keys）
- `~/.openclaw/credentials/`（チャネル/プロバイダー状態およびレガシーOAuthインポートデータ）
- `~/.openclaw/agents/<agentId>/sessions/`（session transcript + metadata）
- `~/.openclaw/skills/`（managed Skills）

sessions や config を移行する必要がある場合は、それらを別途コピーし、バージョン管理には入れないでください。

## Gitバックアップ（推奨、プライベート）

ワークスペースはプライベートメモリとして扱ってください。**プライベートな** git repo に入れて、バックアップおよび復旧可能にしてください。

これらの手順は、Gateway が動作しているマシン上で実行してください（ワークスペースはそこにあります）。

<Steps>
  <Step title="repoを初期化する">
    git がインストールされていれば、真新しいワークスペースは自動的に初期化されます。このワークスペースがまだrepoでない場合は、次を実行してください。

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="プライベートremoteを追加する">
    <Tabs>
      <Tab title="GitHub web UI">
        1. GitHubで新しい**プライベート**リポジトリを作成します。
        2. README付きでは初期化しないでください（merge conflict を避けるため）。
        3. HTTPSのremote URLをコピーします。
        4. remoteを追加してpushします。

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. GitLabで新しい**プライベート**リポジトリを作成します。
        2. README付きでは初期化しないでください（merge conflict を避けるため）。
        3. HTTPSのremote URLをコピーします。
        4. remoteを追加してpushします。

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="継続的な更新">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## secrets をコミットしない

<Warning>
プライベートrepoであっても、ワークスペースにsecretsを保存するのは避けてください。

- API keys、OAuth tokens、passwords、またはprivate credentials。
- `~/.openclaw/` 配下のもの。
- チャットや機密添付の生ダンプ。

機密参照を保存する必要がある場合は、placeholder を使い、実際のsecretは別の場所（password manager、environment variables、または `~/.openclaw/`）に保持してください。
</Warning>

推奨される `.gitignore` の初期例:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## ワークスペースを新しいマシンへ移動する

<Steps>
  <Step title="repoをcloneする">
    目的のパス（デフォルトは `~/.openclaw/workspace`）にrepoをcloneします。
  </Step>
  <Step title="configを更新する">
    `~/.openclaw/openclaw.json` の `agents.defaults.workspace` をそのパスに設定します。
  </Step>
  <Step title="不足ファイルを初期配置する">
    `openclaw setup --workspace <path>` を実行して、不足しているファイルを初期配置します。
  </Step>
  <Step title="sessions をコピーする（任意）">
    sessions が必要な場合は、古いマシンの `~/.openclaw/agents/<agentId>/sessions/` を別途コピーしてください。
  </Step>
</Steps>

## 高度な注意事項

- マルチエージェントルーティングでは、エージェントごとに異なるワークスペースを使用できます。ルーティング設定については [Channel routing](/ja-JP/channels/channel-routing) を参照してください。
- `agents.defaults.sandbox` が有効な場合、non-main sessions は `agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのsandboxワークスペースを使用できます。

## 関連

- [Heartbeat](/ja-JP/gateway/heartbeat) — HEARTBEAT.md ワークスペースファイル
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox環境でのワークスペースアクセス
- [Session](/ja-JP/concepts/session) — session保存パス
- [Standing orders](/ja-JP/automation/standing-orders) — ワークスペースファイル内の永続的な指示
