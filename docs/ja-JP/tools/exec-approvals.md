---
read_when:
    - exec 承認または allowlist の設定
    - macOS アプリで exec 承認 UX を実装する
    - sandbox エスケーププロンプトとその影響の確認
summary: exec 承認、allowlist、および sandbox エスケーププロンプト
title: exec 承認
x-i18n:
    generated_at: "2026-04-25T14:00:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44bf7af57d322280f6d0089207041214b1233d0c9eca99656d51fc4aed88941b
    source_path: tools/exec-approvals.md
    workflow: 15
---

exec 承認は、sandbox 化されたエージェントが実際のホスト（`gateway` または `node`）上でコマンドを実行できるようにするための **companion app / node host ガードレール** です。これは安全インターロックであり、コマンドはポリシー + allowlist + （任意の）ユーザー承認のすべてが一致した場合にのみ許可されます。exec 承認は、tool policy および elevated gating の**上に重なって**適用されます（ただし、elevated が `full` に設定されている場合は承認をスキップします）。

<Note>
実効ポリシーは `tools.exec.*` と approvals defaults の**より厳しい方**です。approvals フィールドが省略されている場合は、`tools.exec` の値が使用されます。host exec はそのマシン上のローカル approvals state も使用します。`~/.openclaw/exec-approvals.json` にあるホストローカルの `ask: "always"` は、セッションまたは config の defaults が `ask: "on-miss"` を要求していても、引き続きプロンプトを表示します。
</Note>

## 実効ポリシーの確認

- `openclaw approvals get`、`... --gateway`、`... --node <id|name|ip>` — 要求されたポリシー、ホストポリシーのソース、および実効結果を表示します。
- `openclaw exec-policy show` — ローカルマシンのマージ済みビュー。
- `openclaw exec-policy set|preset` — ローカルで要求されたポリシーとローカルホスト approvals ファイルを 1 ステップで同期します。

ローカルスコープが `host=node` を要求している場合、`exec-policy show` は、そのスコープをローカル approvals ファイルが真実のソースであるかのように見せるのではなく、実行時には node 管理として報告します。

companion app UI が**利用できない**場合、通常はプロンプトを表示するリクエストは **ask fallback**（デフォルト: deny）によって解決されます。

<Tip>
ネイティブ chat approval クライアントは、保留中の承認メッセージに channel 固有の affordance を事前設定できます。たとえば Matrix は、メッセージ内にフォールバックとして `/approve ...` コマンドを残しつつ、reaction ショートカット（`✅`
一度だけ許可、`❌` 拒否、`♾️` 常に許可）を事前設定します。
</Tip>

## 適用される場所

exec 承認は実行ホスト上でローカルに強制されます。

- **gateway host** → gateway マシン上の `openclaw` プロセス
- **node host** → node runner（macOS companion app または headless node host）

trust モデルに関する注意:

- Gateway 認証済みの呼び出し元は、その Gateway の信頼されたオペレーターです。
- ペアリングされた nodes は、その信頼されたオペレーター能力を node host に拡張します。
- exec 承認は偶発的な実行リスクを減らしますが、ユーザー単位の auth 境界ではありません。
- 承認された node-host 実行は、標準化された実行コンテキストをバインドします: 正規化された cwd、正確な argv、存在する場合は env バインディング、該当する場合は固定された executable path。
- shell script および interpreter/runtime の直接ファイル呼び出しでは、OpenClaw は 1 つの具体的なローカル file operand もバインドしようとします。そのバインドされたファイルが承認後かつ実行前に変更された場合、内容がずれたまま実行する代わりに、その実行は拒否されます。
- このファイルバインディングは、あらゆる interpreter/runtime loader path の完全な意味モデルではなく、意図的に best-effort です。承認モードでバインドすべき具体的なローカルファイルをちょうど 1 つ特定できない場合、完全にカバーしているふりをするのではなく、承認付き実行の発行を拒否します。

macOS の分割:

- **node host service** は `system.run` をローカル IPC 経由で **macOS app** に転送します。
- **macOS app** は承認を強制し、UI コンテキストでコマンドを実行します。

## 設定と保存先

承認は、実行ホスト上のローカル JSON ファイルに保存されます。

`~/.openclaw/exec-approvals.json`

スキーマ例:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 承認なしの「YOLO」モード

承認プロンプトなしで host exec を実行したい場合は、**両方**のポリシーレイヤーを開く必要があります。

- OpenClaw config 内の要求 exec policy（`tools.exec.*`）
- `~/.openclaw/exec-approvals.json` 内の host-local approvals policy

これは現在、明示的に厳しくしない限りデフォルトの host 挙動です。

- `tools.exec.security`: `gateway`/`node` で `full`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

重要な違い:

- `tools.exec.host=auto` は exec をどこで実行するかを選びます: sandbox が利用可能なら sandbox、そうでなければ gateway。
- YOLO は host exec がどのように承認されるかを選びます: `security=full` と `ask=off`。
- 独自の非対話 permission mode を公開する CLI バック provider は、このポリシーに従えます。
  Claude CLI は、OpenClaw の要求 exec policy が YOLO の場合に `--permission-mode bypassPermissions` を追加します。そのバックエンド動作は、`agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 配下の明示的な Claude 引数、たとえば `--permission-mode default`、`acceptEdits`、`bypassPermissions` で上書きできます。
- YOLO モードでは、OpenClaw は設定済み host exec policy の上に、別個のヒューリスティックなコマンド難読化承認ゲートや script-preflight 拒否レイヤーを追加しません。
- `auto` は、sandbox 化されたセッションから gateway ルーティングを自由に上書きできることを意味しません。呼び出し単位の `host=node` リクエストは `auto` から許可され、`host=gateway` は sandbox ランタイムがアクティブでない場合にのみ `auto` から許可されます。安定した非 auto デフォルトが必要な場合は、`tools.exec.host` を設定するか、`/exec host=...` を明示的に使用してください。

より保守的な設定にしたい場合は、いずれかのレイヤーを `allowlist` / `on-miss`
または `deny` に戻してください。

gateway host の永続的な「プロンプトを出さない」設定:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

次に、host approvals ファイルも一致するように設定します。

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

現在のマシンで同じ gateway-host ポリシーを設定するローカルショートカット:

```bash
openclaw exec-policy preset yolo
```

このローカルショートカットは、次の両方を更新します。

- ローカルの `tools.exec.host/security/ask`
- ローカルの `~/.openclaw/exec-approvals.json` defaults

これは意図的にローカル専用です。gateway-host または node-host approvals を
リモートで変更する必要がある場合は、引き続き `openclaw approvals set --gateway` または
`openclaw approvals set --node <id|name|ip>` を使用してください。

node host については、同じ approvals ファイルをその node に適用してください。

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

重要なローカル専用の制限:

- `openclaw exec-policy` は node approvals を同期しない
- `openclaw exec-policy set --host node` は拒否される
- node exec approvals は実行時に node から取得されるため、node 向け更新には `openclaw approvals --node ...` を使用する必要がある

セッション専用ショートカット:

- `/exec security=full ask=off` は現在のセッションだけを変更します。
- `/elevated full` は、そのセッションの exec 承認もスキップする緊急用ショートカットです。

host approvals ファイルが config より厳しいままである場合は、より厳しい host policy が引き続き優先されます。

## ポリシー設定項目

### Security (`exec.security`)

- **deny**: すべての host exec リクエストをブロックします。
- **allowlist**: allowlist に載っているコマンドのみ許可します。
- **full**: すべてを許可します（elevated と同等）。

### Ask (`exec.ask`)

- **off**: プロンプトを一切表示しない。
- **on-miss**: allowlist に一致しない場合のみプロンプトを表示する。
- **always**: すべてのコマンドでプロンプトを表示する。
- 実効 ask モードが `always` の場合、`allow-always` の永続的信頼はプロンプトを抑制しません

### Ask fallback (`askFallback`)

プロンプトが必要だが到達可能な UI がない場合、fallback で次を決めます。

- **deny**: ブロックする。
- **allowlist**: allowlist に一致する場合のみ許可する。
- **full**: 許可する。

### インライン interpreter eval の hardening (`tools.exec.strictInlineEval`)

`tools.exec.strictInlineEval=true` の場合、OpenClaw は interpreter バイナリ自体が allowlist に載っていても、インライン code-eval 形式を承認専用として扱います。

例:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

これは、1 つの安定した file operand にきれいに対応しない interpreter loader に対する defense-in-depth です。strict モードでは:

- これらのコマンドには引き続き明示的な承認が必要です。
- `allow-always` は、それらに対する新しい allowlist エントリを自動的には永続化しません。

## Allowlist（agent ごと）

allowlist は **agent ごと** です。複数の agents が存在する場合は、macOS app で
編集対象の agent を切り替えてください。パターンは glob 一致です。
パターンには、解決済みバイナリパスの glob か、素のコマンド名 glob を使用できます。素の名前は
PATH 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` であれば `rg` は `/opt/homebrew/bin/rg`
に一致できますが、`./rg` や `/tmp/rg` には一致しません。特定のバイナリ位置だけを
信頼したい場合は、パス glob を使用してください。
レガシーな `agents.default` エントリは読み込み時に `agents.main` へ移行されます。
`echo ok && pwd` のような shell 連結でも、最上位の各セグメントがすべて allowlist ルールを満たす必要があります。

例:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

各 allowlist エントリは次を追跡します。

- **id** UI 識別用の安定 UUID（任意）
- **last used** タイムスタンプ
- **last used command**
- **last resolved path**

## Skill CLI の自動許可

**Auto-allow skill CLIs** が有効な場合、既知の Skills が参照する executable は
nodes（macOS node または headless node host）上で allowlist 済みとして扱われます。これは
Gateway RPC 経由の `skills.bins` を使って skill bin 一覧を取得します。厳格な手動 allowlist を使いたい場合は無効にしてください。

重要な trust に関する注意:

- これは手動パス allowlist エントリとは別の、**暗黙的な利便性 allowlist** です。
- Gateway と node が同じ trust boundary にある、信頼されたオペレーター環境向けです。
- 厳格で明示的な trust が必要な場合は、`autoAllowSkills: false` のままにし、手動パス allowlist エントリのみを使用してください。

## safe bins と承認転送

safe bins（stdin-only fast-path）、interpreter binding の詳細、および
承認プロンプトを Slack/Discord/Telegram に転送する方法（またはそれらをネイティブ承認クライアントとして実行する方法）については、[Exec approvals — advanced](/ja-JP/tools/exec-approvals-advanced) を参照してください。

<!-- moved to /tools/exec-approvals-advanced -->

## Control UI での編集

**Control UI → Nodes → Exec approvals** カードを使用して、defaults、agent ごとの
overrides、および allowlists を編集します。スコープ（Defaults または agent）を選び、ポリシーを調整し、
allowlist パターンを追加/削除してから **Save** を押します。UI には、一覧を整理しやすいよう、
パターンごとの **last used** メタデータが表示されます。

ターゲットセレクターでは **Gateway**（ローカル approvals）または **Node** を選びます。Nodes は
`system.execApprovals.get/set`（macOS app または headless node host）を公開している必要があります。
node がまだ exec approvals を公開していない場合は、そのローカルの
`~/.openclaw/exec-approvals.json` を直接編集してください。

CLI: `openclaw approvals` は gateway または node の編集をサポートしています（[Approvals CLI](/ja-JP/cli/approvals) を参照）。

## 承認フロー

プロンプトが必要な場合、gateway は `exec.approval.requested` を operator クライアントにブロードキャストします。
Control UI と macOS app はこれを `exec.approval.resolve` で解決し、その後 gateway は
承認されたリクエストを node host に転送します。

`host=node` の場合、承認リクエストには正規化された `systemRunPlan` payload が含まれます。gateway は、
承認済み `system.run` リクエストを転送する際、この plan を権威ある command/cwd/session コンテキストとして使用します。

これは非同期承認の待ち時間において重要です。

- node exec パスは最初に 1 つの正規化された plan を準備する
- 承認レコードはその plan とその binding metadata を保存する
- 承認後、最終的に転送される `system.run` 呼び出しは、後からの呼び出し元編集を信用する代わりに、
  保存済み plan を再利用する
- 承認リクエスト作成後に呼び出し元が `command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、gateway は承認不一致として
  転送実行を拒否する

## システムイベント

exec のライフサイクルは system message として公開されます:

- `Exec running`（コマンドが実行中通知のしきい値を超えた場合のみ）
- `Exec finished`
- `Exec denied`

これらは、node がイベントを報告した後に agent のセッションへ投稿されます。
gateway-host exec 承認も、コマンド完了時に同じライフサイクルイベントを発行します
（しきい値より長く実行された場合は、任意で実行中イベントも発行）。
承認ゲート付き exec では、相関付けを容易にするため、これらのメッセージで
承認 id を `runId` として再利用します。

## 承認拒否時の挙動

非同期 exec 承認が拒否されると、OpenClaw はエージェントがそのセッション内で
同じコマンドの以前の実行結果を再利用できないようにします。拒否理由は、
コマンド出力が利用できないという明示的なガイダンス付きで渡されるため、
エージェントが新しい出力があると主張したり、以前の成功実行の古い結果を使って
拒否されたコマンドを繰り返したりすることを防ぎます。

## 影響

- **full** は強力です。可能な限り allowlist を優先してください。
- **ask** を使うと、高速な承認を維持しつつ、確認のループに入れます。
- agent ごとの allowlist により、ある agent の承認が他の agent に漏れるのを防げます。
- 承認は、**認可済み送信者** からの host exec リクエストにのみ適用されます。未認可の送信者は `/exec` を発行できません。
- `/exec security=full` は認可済みオペレーター向けのセッションレベルの利便機能であり、設計上、承認をスキップします。host exec を強制的にブロックしたい場合は、approvals security を `deny` に設定するか、tool policy で `exec` ツールを拒否してください。

## 関連

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/ja-JP/tools/exec-approvals-advanced" icon="gear">
    safe bins、interpreter binding、および chat への承認転送。
  </Card>
  <Card title="Exec tool" href="/ja-JP/tools/exec" icon="terminal">
    シェルコマンド実行ツール。
  </Card>
  <Card title="Elevated mode" href="/ja-JP/tools/elevated" icon="shield-exclamation">
    承認もスキップする緊急用パス。
  </Card>
  <Card title="Sandboxing" href="/ja-JP/gateway/sandboxing" icon="box">
    sandbox モードとワークスペースアクセス。
  </Card>
  <Card title="Security" href="/ja-JP/gateway/security" icon="lock">
    セキュリティモデルと hardening。
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    それぞれの制御をいつ使うべきか。
  </Card>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="sparkles">
    Skill ベースの自動許可動作。
  </Card>
</CardGroup>
