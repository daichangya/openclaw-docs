---
read_when:
    - exec の承認または許可リストを設定しているとき
    - macOSアプリで exec 承認 UX を実装しているとき
    - サンドボックス脱出プロンプトとその影響をレビューしているとき
summary: Exec の承認、許可リスト、サンドボックス脱出プロンプト
title: Exec の承認
x-i18n:
    generated_at: "2026-04-05T13:00:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1efa3b78efe3ca6246acfb37830b103ede40cc5298dcc7da8e9fbc5f6cc88ef
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Exec の承認

Exec の承認は、サンドボックス化されたエージェントが実際のホスト（`gateway` または `node`）上で
コマンドを実行できるようにするための**コンパニオンアプリ / ノードホストのガードレール**です。安全インターロックのようなものだと考えてください:
コマンドは、ポリシー + 許可リスト + （任意の）ユーザー承認のすべてが許可した場合にのみ実行されます。
Exec の承認は、ツールポリシーおよび elevated ゲーティングに**追加で**適用されます（ただし、elevated が `full` に設定されている場合は承認をスキップします）。
有効なポリシーは `tools.exec.*` と承認デフォルトのうち**より厳しい方**です。承認フィールドが省略された場合は、`tools.exec` の値が使われます。
ホスト exec では、そのマシン上のローカル承認状態も使用されます。ホストローカルの
`~/.openclaw/exec-approvals.json` に `ask: "always"` があると、
セッションまたは設定のデフォルトが `ask: "on-miss"` を要求していても常にプロンプトが表示されます。
要求されたポリシー、ホストポリシーのソース、および有効な結果を確認するには、
`openclaw approvals get`、`openclaw approvals get --gateway`、または
`openclaw approvals get --node <id|name|ip>` を使用してください。

コンパニオンアプリ UI が**利用できない**場合、プロンプトが必要なリクエストは
**ask fallback**（デフォルト: deny）によって処理されます。

## 適用箇所

Exec の承認は、実行ホスト上でローカルに適用されます。

- **gateway host** → Gateway マシン上の `openclaw` プロセス
- **node host** → ノードランナー（macOSコンパニオンアプリまたはヘッドレスノードホスト）

信頼モデルに関する注記:

- Gateway に認証された呼び出し元は、その Gateway の信頼されたオペレーターです。
- ペアリングされたノードは、その信頼されたオペレーター能力をノードホストに拡張します。
- Exec の承認は偶発的な実行リスクを減らしますが、ユーザー単位の認証境界ではありません。
- 承認されたノードホスト実行は、標準実行コンテキストを束縛します: 標準 cwd、正確な argv、存在する場合の env 束縛、適用可能な場合の固定された実行ファイルパス。
- シェルスクリプトおよびインタープリター/ランタイムによる直接ファイル実行については、OpenClaw は
  1つの具体的なローカルファイルオペランドも束縛しようとします。承認後から実行前までの間にその束縛対象ファイルが変更された場合、
  変更された内容は実行せず、実行は拒否されます。
- このファイル束縛は意図的にベストエフォートであり、すべての
  インタープリター/ランタイムのローダーパスを完全に意味的にモデル化するものではありません。承認モードで
  束縛すべき具体的なローカルファイルを正確に1つ特定できない場合、完全に保護できているふりをするのではなく、
  承認に裏付けられた実行の発行を拒否します。

macOS の分割:

- **node host service** は、ローカル IPC 経由で `system.run` を **macOS app** に転送します。
- **macOS app** は承認を適用し、UI コンテキストでコマンドを実行します。

## 設定と保存場所

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

## 承認不要の「YOLO」モード

承認プロンプトなしでホスト exec を実行したい場合は、**両方**のポリシーレイヤーを開く必要があります。

- OpenClaw 設定内の要求された exec ポリシー（`tools.exec.*`）
- `~/.openclaw/exec-approvals.json` 内のホストローカル承認ポリシー

これは現在、明示的に厳しくしない限りデフォルトのホスト動作です。

- `tools.exec.security`: `gateway`/`node` では `full`
- `tools.exec.ask`: `off`
- ホスト `askFallback`: `full`

重要な違い:

- `tools.exec.host=auto` は exec の実行場所を選びます: サンドボックスが利用可能ならサンドボックス、そうでなければ gateway。
- YOLO はホスト exec の承認方法を選びます: `security=full` かつ `ask=off`。
- `auto` は、サンドボックス化されたセッションから gateway ルーティングを自由に上書きできることを意味しません。呼び出しごとの `host=node` リクエストは `auto` から許可されますが、`host=gateway` はサンドボックスランタイムがアクティブでない場合にのみ `auto` から許可されます。安定した非 auto のデフォルトが欲しい場合は、`tools.exec.host` を設定するか、`/exec host=...` を明示的に使用してください。

より保守的な設定にしたい場合は、いずれかのレイヤーを `allowlist` / `on-miss`
または `deny` に戻してください。

gateway host で永続的に「プロンプトを出さない」設定:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

次に、ホスト承認ファイルも合わせて設定します。

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

node host の場合は、代わりにそのノードで同じ承認ファイルを適用します。

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

セッション限定のショートカット:

- `/exec security=full ask=off` は現在のセッションだけを変更します。
- `/elevated full` は、同じくそのセッションの exec 承認をスキップする非常用ショートカットです。

ホスト承認ファイルが設定より厳しいままなら、より厳しいホストポリシーが依然として優先されます。

## ポリシーのノブ

### Security (`exec.security`)

- **deny**: すべてのホスト exec リクエストをブロックします。
- **allowlist**: 許可リストにあるコマンドのみ許可します。
- **full**: すべてを許可します（elevated と同等）。

### Ask (`exec.ask`)

- **off**: プロンプトを一切表示しません。
- **on-miss**: 許可リストに一致しない場合のみプロンプトを表示します。
- **always**: すべてのコマンドでプロンプトを表示します。
- `allow-always` の永続信頼は、有効な ask モードが `always` の場合にはプロンプトを抑制しません

### Ask fallback (`askFallback`)

プロンプトが必要でも UI に到達できない場合、fallback が次を決定します。

- **deny**: ブロック。
- **allowlist**: 許可リストに一致する場合のみ許可。
- **full**: 許可。

### インラインインタープリター eval の強化 (`tools.exec.strictInlineEval`)

`tools.exec.strictInlineEval=true` の場合、OpenClaw はインラインコード eval 形式を、
インタープリターバイナリ自体が許可リストにあっても承認必須として扱います。

例:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

これは、1つの安定したファイルオペランドにきれいに対応しないインタープリターローダーに対する多層防御です。strict モードでは:

- これらのコマンドは依然として明示的な承認が必要です。
- `allow-always` は、それらに対する新しい許可リスト項目を自動では永続化しません。

## 許可リスト（エージェントごと）

許可リストは**エージェントごと**です。複数のエージェントが存在する場合は、macOSアプリで
編集中のエージェントを切り替えてください。パターンは**大文字小文字を区別しない glob 一致**です。
パターンは**バイナリパス**に解決される必要があります（basename のみのエントリは無視されます）。
旧来の `agents.default` エントリは、読み込み時に `agents.main` へ移行されます。
`echo ok && pwd` のようなシェルチェーンでは、各トップレベルセグメントが引き続き許可リスト規則を満たす必要があります。

例:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

各許可リスト項目は、以下を追跡します。

- **id** UI 上の識別に使う安定 UUID（任意）
- **last used** タイムスタンプ
- **last used command**
- **last resolved path**

## Skill CLI の自動許可

**Auto-allow skill CLIs** が有効な場合、既知の Skills で参照されている実行ファイルは、
ノード上（macOS ノードまたはヘッドレスノードホスト）で許可リスト入りとして扱われます。これは、
Gateway RPC 経由で `skills.bins` を使用して Skill の bin リストを取得します。厳格な手動許可リストのみを望む場合は無効にしてください。

重要な信頼に関する注意:

- これは手動のパス許可リスト項目とは別の、**暗黙の利便性許可リスト**です。
- これは Gateway とノードが同じ信頼境界にある信頼済みオペレーター環境を想定しています。
- 厳格な明示的信頼が必要な場合は、`autoAllowSkills: false` のままにし、手動のパス許可リスト項目だけを使用してください。

## Safe bins（stdin のみ）

`tools.exec.safeBins` は、**stdin のみ**で動作する小さなバイナリ一覧（たとえば `cut`）を定義し、
allowlist モードでも明示的な許可リスト項目なしで実行できるようにします。safe bins は
位置指定ファイル引数およびパスのようなトークンを拒否するため、入力ストリームに対してのみ動作できます。
これは汎用的な信頼リストではなく、ストリームフィルター用の狭い高速経路として扱ってください。
インタープリターやランタイムのバイナリ（たとえば `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）を
`safeBins` に追加してはいけません。
コマンドがコード評価、サブコマンド実行、または設計上ファイル読み取りを行える場合は、明示的な許可リスト項目を使い、承認プロンプトを有効のままにしておくことを推奨します。
カスタム safe bins は、`tools.exec.safeBinProfiles.<bin>` に明示的なプロファイルを定義する必要があります。
検証は argv 形状からのみ決定論的に行われ（ホストファイルシステムの存在確認は行わず）、
これにより allow/deny の差によるファイル存在オラクル的な振る舞いを防ぎます。
デフォルト safe bins では、ファイル指向オプションは拒否されます（たとえば `sort -o`、`sort --output`、
`sort --files0-from`、`sort --compress-program`、`sort --random-source`、
`sort --temporary-directory`/`-T`、`wc --files0-from`、`jq -f/--from-file`、
`grep -f/--file`）。
safe bins では、stdin-only の振る舞いを壊すオプションに対して、バイナリごとの明示的なフラグポリシーも適用されます
（たとえば `sort -o/--output/--compress-program` や grep の再帰フラグ）。
long option は safe-bin モードでは fail-closed で検証されます。未知のフラグや曖昧な
省略形は拒否されます。
safe-bin プロファイルごとの拒否フラグ:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

safe bins は、stdin-only セグメントについて argv トークンを実行時に**リテラルテキスト**として扱うことも強制します（glob 展開や `$VARS` 展開は行いません）。そのため、`*` や `$HOME/...` のようなパターンを使って
ファイル読み取りを持ち込むことはできません。
safe bins は、信頼済みバイナリディレクトリから解決される必要もあります（システムデフォルト + 任意の
`tools.exec.safeBinTrustedDirs`）。`PATH` エントリが自動的に信頼されることはありません。
デフォルトの信頼済み safe-bin ディレクトリは意図的に最小限です: `/bin`, `/usr/bin`。
safe-bin 実行ファイルがパッケージマネージャー/ユーザーパス（たとえば
`/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`）にある場合は、
`tools.exec.safeBinTrustedDirs` に明示的に追加してください。
シェルチェーンやリダイレクトは、allowlist モードでは自動許可されません。

シェルチェーン（`&&`、`||`、`;`）は、各トップレベルセグメントが許可リスト
（safe bins や Skill 自動許可を含む）を満たす場合に許可されます。リダイレクトは allowlist モードでは引き続きサポートされません。
コマンド置換（`$()` / バッククォート）は、ダブルクォート内も含め allowlist 解析時に拒否されます。`$()` の文字列をリテラルとして使いたい場合はシングルクォートを使用してください。
macOS コンパニオンアプリの承認では、シェル制御や展開構文
（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）を含む生のシェルテキストは、
シェルバイナリ自体が許可リストにない限り、allowlist miss として扱われます。
シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの env 上書きは、
小さな明示的許可リスト（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に縮小されます。
allowlist モードの allow-always 判断では、既知のディスパッチラッパー
（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）は、ラッパーパスではなく内側の実行ファイルパスを永続化します。
シェル多重化ツール（`busybox`、`toybox`）も、シェル applet（`sh`、`ash` など）については展開され、
多重化バイナリではなく内側の実行ファイルが永続化されます。ラッパーまたは
多重化ツールを安全に展開できない場合、許可リスト項目は自動で永続化されません。
`python3` や `node` のようなインタープリターを許可リストに入れる場合でも、インライン eval が明示的承認を必要とし続けるよう、`tools.exec.strictInlineEval=true` を推奨します。strict モードでは、`allow-always` は無害なインタープリター/スクリプト実行を永続化できますが、インライン eval を運ぶ形式は自動では永続化されません。

デフォルト safe bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` と `sort` はデフォルト一覧に含まれていません。これらを opt in する場合は、
非 stdin ワークフロー向けに明示的な許可リスト項目を維持してください。
safe-bin モードの `grep` では、パターンは `-e`/`--regexp` で指定してください。位置指定パターン形式は
拒否されるため、ファイルオペランドを曖昧な位置指定引数として持ち込めません。

### Safe bins と許可リストの比較

| Topic            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Goal             | 狭い stdin フィルターを自動許可                        | 特定の実行ファイルを明示的に信頼する                         |
| Match type       | 実行ファイル名 + safe-bin argv ポリシー                | 解決された実行ファイルパスの glob パターン                   |
| Argument scope   | safe-bin プロファイルとリテラルトークン規則で制限      | パス一致のみ。引数はそれ以外では利用者の責任                 |
| Typical examples | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, カスタム CLI              |
| Best use         | パイプライン内の低リスクなテキスト変換                 | より広い振る舞いや副作用を持つ任意のツール                   |

設定場所:

- `safeBins` は設定から取得されます（`tools.exec.safeBins` またはエージェントごとの `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` は設定から取得されます（`tools.exec.safeBinTrustedDirs` またはエージェントごとの `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` は設定から取得されます（`tools.exec.safeBinProfiles` またはエージェントごとの `agents.list[].tools.exec.safeBinProfiles`）。エージェントごとのプロファイルキーがグローバルキーを上書きします。
- 許可リスト項目は、ホストローカルの `~/.openclaw/exec-approvals.json` の `agents.<id>.allowlist` の下に保存されます（または Control UI / `openclaw approvals allowlist ...` 経由）。
- `openclaw security audit` は、インタープリター/ランタイム bin が `safeBins` に明示的プロファイルなしで含まれている場合、`tools.exec.safe_bins_interpreter_unprofiled` を警告します。
- `openclaw doctor --fix` は、不足しているカスタム `safeBinProfiles.<bin>` 項目を `{}` として雛形作成できます（その後に見直して厳しくしてください）。インタープリター/ランタイム bin は自動雛形作成されません。

カスタムプロファイル例:
__OC_I18N_900004__
`jq` を明示的に `safeBins` に opt in した場合でも、OpenClaw は safe-bin
モードでは `env` builtin を引き続き拒否します。そのため `jq -n env` によってホストプロセス環境を
明示的な許可リストパスや承認プロンプトなしに吐き出すことはできません。

## Control UI での編集

**Control UI → Nodes → Exec approvals** カードを使うと、デフォルト、エージェントごとの
上書き、および許可リストを編集できます。スコープ（Defaults またはエージェント）を選び、ポリシーを調整し、
許可リストパターンを追加/削除してから **Save** してください。UI にはパターンごとの **last used** メタデータも表示されるため、
一覧を整理しやすくなっています。

ターゲットセレクターでは **Gateway**（ローカル承認）または **Node** を選びます。ノードは
`system.execApprovals.get/set` を提供している必要があります（macOS app またはヘッドレス node host）。
ノードがまだ exec approvals を提供していない場合は、そのノードのローカル
`~/.openclaw/exec-approvals.json` を直接編集してください。

CLI: `openclaw approvals` は gateway または node の編集をサポートしています（[Approvals CLI](/cli/approvals) を参照）。

## 承認フロー

プロンプトが必要な場合、gateway は `exec.approval.requested` をオペレータークライアントへブロードキャストします。
Control UI と macOS app は `exec.approval.resolve` でこれを処理し、その後 gateway が
承認済みリクエストを node host へ転送します。

`host=node` の場合、承認リクエストには標準化された `systemRunPlan` ペイロードが含まれます。gateway は、
承認済み `system.run` リクエストを転送する際に、その plan を権威ある command/cwd/session コンテキストとして使用します。

これは非同期承認の遅延において重要です:

- node exec 経路は先に1つの標準 plan を準備します
- 承認レコードにはその plan と束縛メタデータが保存されます
- 承認後、最終的に転送される `system.run` 呼び出しでは、後からの呼び出し元の編集を信頼せず、
  保存済みの plan を再利用します
- 承認リクエスト作成後に呼び出し元が `command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、gateway は
  その転送実行を承認不一致として拒否します

## インタープリター/ランタイムコマンド

承認に裏付けられたインタープリター/ランタイム実行は、意図的に保守的です。

- 正確な argv/cwd/env コンテキストは常に束縛されます。
- 直接シェルスクリプトおよび直接ランタイムファイル形式は、1つの具体的なローカル
  ファイルスナップショットにベストエフォートで束縛されます。
- 依然として1つの直接ローカルファイルに解決できる一般的なパッケージマネージャーラッパー形式（たとえば
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`）は、束縛前に展開されます。
- OpenClaw がインタープリター/ランタイムコマンドに対して、具体的なローカルファイルを正確に1つ特定できない場合
  （たとえば package scripts、eval 形式、ランタイム固有ローダーチェーン、または曖昧な複数ファイル形式）、
  意味的な保護を提供できていると主張する代わりに、承認に裏付けられた実行は拒否されます。
- そのようなワークフローでは、サンドボックス化、別のホスト境界、または、より広いランタイム意味論を
  オペレーターが受け入れる明示的な trusted allowlist/full ワークフローを推奨します。

承認が必要な場合、exec ツールは承認 id を返してすぐに戻ります。後続の system event
（`Exec finished` / `Exec denied`）との相関付けにはその id を使用してください。タイムアウト前に決定が届かない場合、
そのリクエストは承認タイムアウトとして扱われ、拒否理由として表面化します。

### フォローアップ配信の動作

承認済みの非同期 exec が完了すると、OpenClaw は同じセッションにフォローアップの `agent` ターンを送信します。

- 有効な外部配信ターゲット（配信可能なチャネル + ターゲット `to`）が存在する場合、フォローアップ配信はそのチャネルを使います。
- 外部ターゲットのない webchat 専用または内部セッションフローでは、フォローアップ配信はセッション限定のままです（`deliver: false`）。
- 解決可能な外部チャネルがないのに呼び出し元が厳格な外部配信を明示的に要求した場合、そのリクエストは `INVALID_REQUEST` で失敗します。
- `bestEffortDeliver` が有効で、外部チャネルを解決できない場合、失敗させる代わりに配信はセッション限定へダウングレードされます。

確認ダイアログには次が含まれます。

- command + args
- cwd
- agent id
- 解決された実行ファイルパス
- host + policy メタデータ

操作:

- **Allow once** → 今回だけ実行
- **Always allow** → 許可リストに追加して実行
- **Deny** → ブロック

## チャットチャネルへの承認転送

exec 承認プロンプトは、任意のチャットチャネル（プラグインチャネルを含む）へ転送し、
`/approve` で承認できます。これは通常の送信配信パイプラインを使用します。

設定:
__OC_I18N_900005__
チャットで返信:
__OC_I18N_900006__
`/approve` コマンドは、exec 承認とプラグイン承認の両方を処理します。ID が保留中の exec 承認に一致しない場合、
自動的にプラグイン承認を確認します。

### プラグイン承認の転送

プラグイン承認の転送は exec 承認と同じ配信パイプラインを使いますが、`approvals.plugin` の下に
独立した設定を持ちます。どちらか一方を有効または無効にしても、もう一方には影響しません。
__OC_I18N_900007__
設定の形は `approvals.exec` と同一です: `enabled`、`mode`、`agentFilter`、
`sessionFilter`、`targets` は同じように機能します。

共有の対話型返信をサポートするチャネルでは、exec 承認とプラグイン承認の両方に同じ承認ボタンが表示されます。
共有の対話型 UI を持たないチャネルでは、`/approve`
手順付きのプレーンテキストへフォールバックします。

### 任意のチャネルでの同一チャット承認

exec またはプラグイン承認リクエストが配信可能なチャットサーフェスから発生した場合、
その同じチャットがデフォルトで `/approve` によって承認できるようになりました。これは Slack、Matrix、
Microsoft Teams などのチャネルに、既存の Web UI と terminal UI フローに加えて適用されます。

この共有テキストコマンド経路は、その会話に対する通常のチャネル認証モデルを使用します。発生元のチャットが
すでにコマンド送信と返信受信を行えるなら、承認リクエストは保留のままにするためだけに
別個のネイティブ配信アダプターを必要としなくなります。

Discord と Telegram も同一チャット `/approve` をサポートしますが、これらのチャネルでは
ネイティブ承認配信が無効でも、認可には引き続き解決済み approver 一覧が使用されます。

Gateway を直接呼び出す Telegram やその他のネイティブ承認クライアントについては、
このフォールバックは意図的に「approval not found」失敗に限定されています。実際の
exec 承認拒否/エラーでは、黙ってプラグイン承認として再試行されることはありません。

### ネイティブ承認配信

一部のチャネルはネイティブ承認クライアントとしても機能できます。ネイティブクライアントは、
共有の同一チャット `/approve` フローに加えて、approver DM、発生元チャット fanout、
チャネル固有の対話型承認 UX を追加します。

ネイティブ承認カード/ボタンが利用できる場合、そのネイティブ UI が
エージェント向けの主要経路です。ツール結果がチャット承認を利用できない、
または手動承認が唯一の残る経路であると示していない限り、エージェントは重複するプレーンなチャット
`/approve` コマンドを重ねて出力すべきではありません。

一般モデル:

- ホスト exec ポリシーが、依然として exec 承認が必要かどうかを決定します
- `approvals.exec` が、承認プロンプトを他のチャット宛先へ転送するかどうかを制御します
- `channels.<channel>.execApprovals` が、そのチャネルをネイティブ承認クライアントとして動作させるかどうかを制御します

ネイティブ承認クライアントは、次のすべてが真であるとき、自動的に DM 優先配信を有効にします。

- そのチャネルがネイティブ承認配信をサポートしている
- approver を明示的な `execApprovals.approvers` または、その
  チャネルで文書化された fallback ソースから解決できる
- `channels.<channel>.execApprovals.enabled` が未設定または `"auto"` である

ネイティブ承認クライアントを明示的に無効にするには `enabled: false` を設定してください。approver が解決できるときに
強制的に有効化するには `enabled: true` を設定してください。公開の発生元チャット配信は
`channels.<channel>.execApprovals.target` による明示設定のままです。

FAQ: [チャット承認用の exec 承認設定が2つあるのはなぜですか？](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

これらのネイティブ承認クライアントは、共有の同一チャット `/approve` フローと共有承認ボタンの上に、
DM ルーティングと任意のチャネル fanout を追加します。

共有動作:

- Slack、Matrix、Microsoft Teams、および同様の配信可能チャットは、同一チャット `/approve` に通常のチャネル認証モデルを使用します
- ネイティブ承認クライアントが自動有効化された場合、デフォルトのネイティブ配信先は approver DM です
- Discord と Telegram では、解決済み approver のみが承認または拒否できます
- Discord approver は明示的なもの（`execApprovals.approvers`）か、`commands.ownerAllowFrom` から推測されたものです
- Telegram approver は明示的なもの（`execApprovals.approvers`）か、既存の owner 設定（`allowFrom`、およびサポートされる場合はダイレクトメッセージの `defaultTo`）から推測されたものです
- Slack approver は明示的なもの（`execApprovals.approvers`）か、`commands.ownerAllowFrom` から推測されたものです
- Slack のネイティブボタンは承認 id の種類を保持するため、`plugin:` id は2つ目の Slack ローカル fallback レイヤーなしでプラグイン承認を解決できます
- Matrix のネイティブ DM/チャネルルーティングは exec 専用です。Matrix のプラグイン承認は共有の
  同一チャット `/approve` と任意の `approvals.plugin` 転送経路に留まります
- リクエスターが approver である必要はありません
- 発生元チャットがすでにコマンドと返信をサポートしていれば、そのチャットから `/approve` で直接承認できます
- ネイティブ Discord 承認ボタンは承認 id の種類でルーティングします: `plugin:` id は
  直接プラグイン承認へ、それ以外はすべて exec 承認へ送られます
- ネイティブ Telegram 承認ボタンは `/approve` と同じく、境界付きの exec-to-plugin fallback に従います
- ネイティブ `target` が発生元チャット配信を有効にしている場合、承認プロンプトにはコマンドテキストが含まれます
- 保留中の exec 承認はデフォルトで 30 分後に期限切れになります
- オペレーター UI または設定済み承認クライアントがどちらもリクエストを受け付けられない場合、プロンプトは `askFallback` にフォールバックします

Telegram のデフォルトは approver DM（`target: "dm"`）です。承認プロンプトも発生元の Telegram チャット/トピックに表示したい場合は、
`channel` または `both` に切り替えられます。Telegram フォーラムトピックでは、OpenClaw は承認プロンプトと承認後フォローアップの両方で
そのトピックを保持します。

参照:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC フロー
__OC_I18N_900008__
セキュリティに関する注記:

- Unix socket モード `0600`、token は `exec-approvals.json` に保存されます。
- 同一 UID ピアチェック。
- Challenge/response（nonce + HMAC token + request hash）+ 短い TTL。

## システムイベント

Exec のライフサイクルはシステムメッセージとして公開されます。

- `Exec running`（コマンドが running notice threshold を超えた場合のみ）
- `Exec finished`
- `Exec denied`

これらはノードがイベントを報告した後、エージェントのセッションに投稿されます。
gateway host exec 承認も、コマンド完了時（および必要に応じて running threshold を超えた場合）に同じライフサイクルイベントを発行します。
承認ゲート付き exec は、相関付けを容易にするため、これらのメッセージで承認 id を `runId` として再利用します。

## 承認拒否時の動作

非同期 exec 承認が拒否された場合、OpenClaw はセッション内で同じコマンドの
以前の実行結果をエージェントが再利用することを防ぎます。拒否理由は、
利用可能なコマンド出力が存在しないことを明示するガイダンス付きで渡され、
これにより、エージェントが新しい出力があると主張したり、以前の成功実行の古い結果で
拒否されたコマンドを繰り返したりすることを防ぎます。

## 影響

- **full** は強力です。可能なら許可リストを優先してください。
- **ask** を使えば、すばやい承認を維持しつつ確認ループに留まれます。
- エージェントごとの許可リストにより、あるエージェントの承認が他のエージェントへ漏れるのを防げます。
- 承認は、**認可された送信者**からのホスト exec リクエストにのみ適用されます。未認可の送信者は `/exec` を発行できません。
- `/exec security=full` は認可済みオペレーター向けのセッションレベルの利便機能であり、設計上承認をスキップします。
  ホスト exec を確実にブロックしたい場合は、承認 security を `deny` に設定するか、ツールポリシーで `exec` ツールを拒否してください。

関連:

- [Exec ツール](/tools/exec)
- [昇格モード](/tools/elevated)
- [Skills](/tools/skills)

## 関連

- [Exec](/tools/exec) — シェルコマンド実行ツール
- [サンドボックス化](/ja-JP/gateway/sandboxing) — サンドボックスモードとワークスペースアクセス
- [セキュリティ](/ja-JP/gateway/security) — セキュリティモデルとハードニング
- [サンドボックスとツールポリシーと Elevated の違い](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) — それぞれをいつ使うか
