---
read_when:
    - exec tool を使う、または変更するとき
    - stdin または TTY の挙動をデバッグするとき
summary: Exec tool の使い方、stdin モード、TTY サポート
title: Exec Tool
x-i18n:
    generated_at: "2026-04-05T12:59:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: b73e9900c109910fc4e178c888b7ad7f3a4eeaa34eb44bc816abba9af5d664d7
    source_path: tools/exec.md
    workflow: 15
---

# Exec tool

ワークスペース内でシェルコマンドを実行します。`process` によるフォアグラウンド実行とバックグラウンド実行に対応しています。
`process` が許可されていない場合、`exec` は同期実行され、`yieldMs`/`background` は無視されます。
バックグラウンドセッションはエージェントごとにスコープ分けされます。`process` は同じエージェントのセッションだけを参照できます。

## パラメーター

- `command`（必須）
- `workdir`（デフォルトは cwd）
- `env`（キー/値の上書き）
- `yieldMs`（デフォルト 10000）: 遅延後に自動でバックグラウンド化
- `background`（bool）: 即座にバックグラウンド化
- `timeout`（秒、デフォルト 1800）: 期限切れで強制終了
- `pty`（bool）: 利用可能な場合は疑似端末で実行（TTY 専用 CLI、coding agents、terminal UI）
- `host`（`auto | sandbox | gateway | node`）: 実行場所
- `security`（`deny | allowlist | full`）: `gateway`/`node` の強制モード
- `ask`（`off | on-miss | always`）: `gateway`/`node` の承認プロンプト
- `node`（string）: `host=node` 用の node id/name
- `elevated`（bool）: 昇格モードを要求する（サンドボックスを抜けて設定済みホストパスへ実行する）。`security=full` が強制されるのは、elevated が `full` に解決された場合のみです

注意事項:

- `host` のデフォルトは `auto` です: セッションで sandbox runtime が有効なら sandbox、そうでなければ gateway になります。
- `auto` はデフォルトのルーティング戦略であり、ワイルドカードではありません。1 回ごとの `host=node` は `auto` から許可されます。1 回ごとの `host=gateway` は、sandbox runtime が有効でない場合にのみ許可されます。
- 追加設定がなくても、`host=auto` はそのまま「ちゃんと動作」します: sandbox がなければ `gateway` に解決され、sandbox が動作中なら sandbox 内にとどまります。
- `elevated` は、設定済みホストパスへサンドボックスを抜けます。デフォルトは `gateway`、`tools.exec.host=node`（またはセッションのデフォルトが `host=node`）のときは `node` です。現在のセッション/プロバイダーで昇格アクセスが有効な場合にのみ利用できます。
- `gateway`/`node` の承認は `~/.openclaw/exec-approvals.json` によって制御されます。
- `node` には paired node（companion app または headless node host）が必要です。
- 利用可能な node が複数ある場合は、`exec.node` または `tools.exec.node` を設定して 1 つ選択してください。
- `exec host=node` は node に対する唯一のシェル実行経路です。従来の `nodes.run` ラッパーは削除されました。
- Windows 以外のホストでは、exec は `SHELL` が設定されていればそれを使います。`SHELL` が `fish` の場合は、
  fish 非互換スクリプトを避けるため、`PATH` 上の `bash`（または `sh`）を優先し、
  どちらも存在しない場合に `SHELL` へフォールバックします。
- Windows ホストでは、exec はまず PowerShell 7（`pwsh`）を検出します（Program Files、ProgramW6432、次に PATH）、
  その後 Windows PowerShell 5.1 へフォールバックします。
- ホスト実行（`gateway`/`node`）では、バイナリーハイジャックや注入コードを防ぐため、
  `env.PATH` と loader 上書き（`LD_*`/`DYLD_*`）を拒否します。
- OpenClaw は、spawn されたコマンド環境（PTY と sandbox 実行を含む）に `OPENCLAW_SHELL=exec` を設定するため、シェル/プロファイルのルール側で exec-tool コンテキストを検出できます。
- 重要: sandboxing は**デフォルトでオフ**です。sandboxing がオフの場合、暗黙の `host=auto` は
  `gateway` に解決されます。明示的な `host=sandbox` は、黙って
  gateway host で実行されるのではなく、クローズドに失敗します。sandboxing を有効にするか、承認付きで `host=gateway` を使ってください。
- スクリプトの事前チェック（よくある Python/Node のシェル構文ミス向け）は、実効 `workdir` 境界内のファイルだけを検査します。
  スクリプトパスが `workdir` の外に解決される場合、そのファイルの事前チェックはスキップされます。
- 今すぐ開始する長時間実行の作業は、一度だけ開始し、
  有効なら、コマンドが出力を出すか失敗したときの自動完了 wake に任せてください。
  ログ、状態、入力、介入には `process` を使ってください。sleep ループ、timeout ループ、繰り返しポーリングで
  スケジューリングを模倣しないでください。
- 後で実行する、またはスケジュールに従うべき作業には、
  `exec` の sleep/delay パターンではなく cron を使ってください。

## config

- `tools.exec.notifyOnExit`（デフォルト: true）: true の場合、バックグラウンド化された exec セッションは終了時に system event をキューに積み、heartbeat を要求します。
- `tools.exec.approvalRunningNoticeMs`（デフォルト: 10000）: 承認ゲート付き exec がこれより長く動作したとき、1 回だけ「running」通知を出します（0 で無効）。
- `tools.exec.host`（デフォルト: `auto`。sandbox runtime が有効なら `sandbox`、そうでなければ `gateway` に解決）
- `tools.exec.security`（デフォルト: sandbox では `deny`、未設定時の gateway + node では `full`）
- `tools.exec.ask`（デフォルト: `off`）
- 承認なしの host exec は gateway + node のデフォルトです。承認/allowlist 動作を使いたい場合は、`tools.exec.*` とホスト側の `~/.openclaw/exec-approvals.json` の両方を厳しくしてください。詳細は [Exec approvals](/tools/exec-approvals#no-approval-yolo-mode) を参照してください。
- YOLO は `host=auto` 由来ではなく、ホストポリシーのデフォルト（`security=full`, `ask=off`）由来です。gateway または node へのルーティングを強制したい場合は、`tools.exec.host` を設定するか `/exec host=...` を使ってください。
- `tools.exec.node`（デフォルト: 未設定）
- `tools.exec.strictInlineEval`（デフォルト: false）: true の場合、`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e` のようなインラインインタープリター eval 形式は常に明示的な承認が必要です。`allow-always` により無害なインタープリター/スクリプト呼び出しを永続化することはできますが、インライン eval 形式は毎回引き続きプロンプトされます。
- `tools.exec.pathPrepend`: exec 実行時に `PATH` の先頭へ追加するディレクトリー一覧（gateway + sandbox のみ）。
- `tools.exec.safeBins`: 明示的な allowlist 項目なしで実行できる、stdin 専用の安全なバイナリー。挙動の詳細は [Safe bins](/tools/exec-approvals#safe-bins-stdin-only) を参照してください。
- `tools.exec.safeBinTrustedDirs`: `safeBins` のパス検査で信頼する追加の明示ディレクトリー。`PATH` 項目は自動では決して信頼されません。組み込みデフォルトは `/bin` と `/usr/bin` です。
- `tools.exec.safeBinProfiles`: safe bin ごとの任意のカスタム argv ポリシー（`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`）。

例:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH の扱い

- `host=gateway`: ログインシェルの `PATH` を exec 環境にマージします。`env.PATH` の上書きは
  ホスト実行では拒否されます。一方、デーモン自体は引き続き最小限の `PATH` で動作します:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: コンテナー内で `sh -lc`（ログインシェル）を実行するため、`/etc/profile` が `PATH` をリセットする場合があります。
  OpenClaw は、profile 読み込み後に内部 env var を使って `env.PATH` を先頭追加します（シェル補間なし）。
  `tools.exec.pathPrepend` もここで適用されます。
- `host=node`: 渡した env 上書きのうちブロックされていないものだけが node に送られます。`env.PATH` の上書きは
  ホスト実行では拒否され、node host では無視されます。node で追加の PATH 項目が必要な場合は、
  node host サービス環境（systemd/launchd）を設定するか、標準的な場所にツールをインストールしてください。

エージェントごとの node バインディング（config では agent list の index を使います）:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes タブには、同じ設定を行うための小さな「Exec node binding」パネルがあります。

## セッション上書き（`/exec`）

`/exec` を使うと、`host`、`security`、`ask`、`node` の**セッションごとの**デフォルトを設定できます。
引数なしで `/exec` を送ると、現在の値が表示されます。

例:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 認可モデル

`/exec` は**認可された送信者**に対してのみ有効です（チャンネルの allowlist/pairing と `commands.useAccessGroups`）。
これは**セッション状態のみ**を更新し、config には書き込みません。exec を強制的に無効化するには、tool
policy（`tools.deny: ["exec"]` またはエージェント単位）で拒否してください。
`security=full` と `ask=off` を明示的に設定しない限り、ホスト承認は引き続き適用されます。

## Exec approvals（companion app / node host）

サンドボックス化されたエージェントでは、`exec` が gateway または node host 上で実行される前に、リクエストごとの承認を要求できます。
ポリシー、allowlist、UI フローについては [Exec approvals](/tools/exec-approvals) を参照してください。

承認が必要な場合、exec tool は
`status: "approval-pending"` と承認 id を返して即座に戻ります。承認されると（または拒否/タイムアウトされると）、
Gateway は system event（`Exec finished` / `Exec denied`）を発行します。コマンドが
`tools.exec.approvalRunningNoticeMs` を超えてまだ動作している場合は、1 回だけ `Exec running` 通知が発行されます。
ネイティブの承認カード/ボタンを持つチャンネルでは、エージェントはまずその
ネイティブ UI に依存すべきであり、manual `/approve` コマンドを含めるのは、tool の
結果がチャット承認を利用できないと明示した場合、または manual approval が
唯一の経路である場合に限るべきです。

## Allowlist + safe bins

手動 allowlist の強制は、**解決済みバイナリーパスのみ**に一致します（basename 一致はありません）。
`security=allowlist` の場合、すべてのパイプライン区間が
allowlist 済みまたは safe bin のときにのみ、シェルコマンドは自動許可されます。連結（`;`, `&&`, `||`）とリダイレクトは、
各トップレベル区間が allowlist を満たす場合（safe bins を含む）を除き、allowlist モードでは拒否されます。
リダイレクトは引き続き未対応です。
永続的な `allow-always` の信頼でも、このルールは回避できません。連結コマンドでは依然として、各
トップレベル区間の一致が必要です。

`autoAllowSkills` は exec approvals における別の利便性パスです。これは
手動のパス allowlist 項目と同じではありません。厳格で明示的な信頼を求めるなら、`autoAllowSkills` は無効のままにしてください。

2 つの制御は用途が異なります。

- `tools.exec.safeBins`: 小さな stdin 専用ストリームフィルター。
- `tools.exec.safeBinTrustedDirs`: safe-bin 実行ファイルパス用の明示的な追加信頼ディレクトリー。
- `tools.exec.safeBinProfiles`: カスタム safe bins 用の明示的な argv ポリシー。
- allowlist: 実行ファイルパスへの明示的な信頼。

`safeBins` を汎用 allowlist として扱わないでください。また、インタープリター/ランタイムのバイナリー（たとえば `python3`、`node`、`ruby`、`bash`）を追加しないでください。そうしたものが必要なら、明示的な allowlist 項目を使い、承認プロンプトは有効のままにしてください。
`openclaw security audit` は、インタープリター/ランタイムの `safeBins` 項目に明示的な profile が欠けている場合に警告し、`openclaw doctor --fix` は不足しているカスタム `safeBinProfiles` 項目を雛形生成できます。
`openclaw security audit` と `openclaw doctor` は、`jq` のような広い挙動を持つバイナリーを明示的に `safeBins` に戻した場合も警告します。
インタープリターを明示的に allowlist する場合は、インラインコード eval 形式に毎回新しい承認が必要になるよう `tools.exec.strictInlineEval` を有効にしてください。

完全なポリシー詳細と例については、[Exec approvals](/tools/exec-approvals#safe-bins-stdin-only) と [Safe bins versus allowlist](/tools/exec-approvals#safe-bins-versus-allowlist) を参照してください。

## 例

フォアグラウンド:

```json
{ "tool": "exec", "command": "ls -la" }
```

バックグラウンド + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

polling はオンデマンドの状態確認用であり、待機ループ用ではありません。自動完了 wake
が有効なら、コマンドは出力を出すか失敗したときにセッションを起こせます。

キー送信（tmux 風）:

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

送信（CR のみ送る）:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼り付け（デフォルトで bracketed）:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` は、構造化された複数ファイル編集のための `exec` の subtool です。
OpenAI および OpenAI Codex モデルではデフォルトで有効です。config を使うのは、
無効化したい場合、または特定モデルに制限したい場合だけです。

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

注意事項:

- OpenAI/OpenAI Codex モデルでのみ利用可能です。
- tool policy は引き続き適用されます。`allow: ["write"]` は暗黙に `apply_patch` も許可します。
- config は `tools.exec.applyPatch` 配下にあります。
- `tools.exec.applyPatch.enabled` のデフォルトは `true` です。OpenAI モデルでこのツールを無効にするには `false` に設定してください。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true`（ワークスペース内限定）です。`apply_patch` でワークスペースディレクトリー外に書き込みまたは削除したい意図がある場合にのみ、`false` に設定してください。

## 関連

- [Exec Approvals](/tools/exec-approvals) — シェルコマンドの承認ゲート
- [Sandboxing](/ja-JP/gateway/sandboxing) — サンドボックス環境でのコマンド実行
- [Background Process](/ja-JP/gateway/background-process) — 長時間実行の exec と process tool
- [Security](/ja-JP/gateway/security) — tool policy と昇格アクセス
