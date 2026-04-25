---
read_when:
    - TUI の初心者向けウォークスルーが必要です
    - TUI の機能、コマンド、ショートカットの完全な一覧が必要です
summary: 'Terminal UI (TUI): Gateway に接続するか、組み込みモードでローカル実行する'
title: TUI
x-i18n:
    generated_at: "2026-04-25T14:02:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6eaa938fb3a50b7478341fe51cafb09e352f6d3cb402373222153ed93531a5f5
    source_path: web/tui.md
    workflow: 15
---

## クイックスタート

### Gateway モード

1. Gateway を起動します。

```bash
openclaw gateway
```

2. TUI を開きます。

```bash
openclaw tui
```

3. メッセージを入力して Enter を押します。

リモート Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gateway が password auth を使っている場合は `--password` を使ってください。

### ローカルモード

Gateway なしで TUI を実行します。

```bash
openclaw chat
# or
openclaw tui --local
```

注記:

- `openclaw chat` と `openclaw terminal` は `openclaw tui --local` のエイリアスです。
- `--local` は `--url`、`--token`、`--password` と組み合わせられません。
- ローカルモードは組み込みエージェントランタイムを直接使います。ほとんどのローカルツールは動作しますが、Gateway 専用機能は利用できません。
- `openclaw` と `openclaw crestodian` もこの TUI シェルを使い、Crestodian はローカルのセットアップおよび修復 chat バックエンドとして動作します。

## 画面に表示されるもの

- ヘッダー: 接続 URL、現在のエージェント、現在のセッション。
- チャットログ: ユーザーメッセージ、assistant 返信、system 通知、ツールカード。
- ステータス行: 接続/実行状態（connecting、running、streaming、idle、error）。
- フッター: 接続状態 + agent + session + model + think/fast/verbose/trace/reasoning + token 数 + deliver。
- 入力欄: オートコンプリート付きテキストエディター。

## メンタルモデル: agents + sessions

- Agents は一意な slug です（例: `main`、`research`）。Gateway がその一覧を公開します。
- Sessions は現在の agent に属します。
- セッションキーは `agent:<agentId>:<sessionKey>` として保存されます。
  - `/session main` と入力すると、TUI はそれを `agent:<currentAgent>:main` に展開します。
  - `/session agent:other:main` と入力すると、その agent セッションへ明示的に切り替えます。
- セッションスコープ:
  - `per-sender`（デフォルト）: 各 agent は複数の session を持ちます。
  - `global`: TUI は常に `global` session を使います（picker が空になることがあります）。
- 現在の agent + session は常にフッターに表示されます。

## 送信 + 配信

- メッセージは Gateway に送信されます。provider への配信はデフォルトでオフです。
- 配信をオンにするには:
  - `/deliver on`
  - または Settings パネル
  - または `openclaw tui --deliver` で起動

## Pickers + overlays

- モデル picker: 利用可能なモデルを一覧し、session override を設定します。
- エージェント picker: 別の agent を選択します。
- セッション picker: 現在の agent 用の session のみを表示します。
- Settings: deliver、ツール出力の展開、thinking 可視化を切り替えます。

## キーボードショートカット

- Enter: メッセージ送信
- Esc: アクティブな実行を中断
- Ctrl+C: 入力をクリア（2 回押すと終了）
- Ctrl+D: 終了
- Ctrl+L: モデル picker
- Ctrl+G: エージェント picker
- Ctrl+P: セッション picker
- Ctrl+O: ツール出力の展開切り替え
- Ctrl+T: thinking 表示の切り替え（履歴を再読み込み）

## スラッシュコマンド

コア:

- `/help`
- `/status`
- `/agent <id>`（または `/agents`）
- `/session <key>`（または `/sessions`）
- `/model <provider/model>`（または `/models`）

セッション制御:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>`（エイリアス: `/elev`）
- `/activation <mention|always>`
- `/deliver <on|off>`

セッションライフサイクル:

- `/new` または `/reset`（セッションをリセット）
- `/abort`（アクティブな実行を中断）
- `/settings`
- `/exit`

ローカルモードのみ:

- `/auth [provider]` は、TUI 内で provider の auth/login フローを開きます。

その他の Gateway スラッシュコマンド（たとえば `/context`）は Gateway に転送され、system 出力として表示されます。[Slash commands](/ja-JP/tools/slash-commands) を参照してください。

## ローカルシェルコマンド

- 行頭に `!` を付けると、TUI ホスト上でローカルシェルコマンドを実行します。
- TUI は、ローカル実行を許可するかをセッションごとに 1 回だけ確認します。拒否すると、そのセッションでは `!` は無効のままになります。
- コマンドは TUI の作業ディレクトリで、新しい非対話シェル内で実行されます（`cd`/env は永続化されません）。
- ローカルシェルコマンドの環境には `OPENCLAW_SHELL=tui-local` が渡されます。
- 単独の `!` は通常メッセージとして送信されます。先頭に空白がある場合はローカル実行をトリガーしません。

## ローカル TUI から config を修復する

現在の config がすでに検証を通っていて、組み込みエージェントに同じマシン上でそれを調査させ、docs と比較し、実行中の Gateway に依存せずにずれを修復したい場合は、ローカルモードを使ってください。

`openclaw config validate` がすでに失敗している場合は、まず `openclaw configure`
または `openclaw doctor --fix` から始めてください。`openclaw chat` は無効な
config ガードを回避しません。

一般的な流れ:

1. ローカルモードを開始します。

```bash
openclaw chat
```

2. たとえば、確認したい内容をエージェントに依頼します。

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. 正確な証拠と検証のためにローカルシェルコマンドを使います。

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` または `openclaw configure` で狭い変更を適用し、その後 `!openclaw config validate` を再実行します。
5. Doctor が自動移行または修復を推奨した場合は、それを確認してから `!openclaw doctor --fix` を実行します。

ヒント:

- `openclaw.json` を手で編集するより、`openclaw config set` または `openclaw configure` を優先してください。
- `openclaw docs "<query>"` は、同じマシンから live docs index を検索します。
- `openclaw config validate --json` は、構造化された schema エラーや SecretRef/解決可能性エラーが欲しいときに便利です。

## ツール出力

- ツール呼び出しは args + results 付きカードとして表示されます。
- Ctrl+O で折りたたみ/展開表示を切り替えます。
- ツール実行中は、部分更新が同じカードにストリーミングされます。

## ターミナルカラー

- TUI は assistant 本文テキストをターミナルのデフォルト前景色のままに保つため、ダーク/ライトどちらのターミナルでも読みやすさを維持します。
- ターミナルが明るい背景で、自動検出が誤っている場合は、`openclaw tui` 起動前に `OPENCLAW_THEME=light` を設定してください。
- 元のダークパレットを強制するには、代わりに `OPENCLAW_THEME=dark` を設定してください。

## 履歴 + ストリーミング

- 接続時に、TUI は最新の履歴を読み込みます（デフォルト 200 メッセージ）。
- ストリーミング応答は、確定するまでその場で更新されます。
- TUI は、より豊かなツールカードのために agent のツールイベントも受信します。

## 接続の詳細

- TUI は `mode: "tui"` として Gateway に登録されます。
- 再接続時は system メッセージが表示され、イベント欠落はログに表示されます。

## オプション

- `--local`: ローカル組み込みエージェントランタイムに対して実行
- `--url <url>`: Gateway WebSocket URL（デフォルトは config または `ws://127.0.0.1:<port>`）
- `--token <token>`: Gateway token（必要な場合）
- `--password <password>`: Gateway password（必要な場合）
- `--session <key>`: セッションキー（デフォルト: `main`、スコープが global の場合は `global`）
- `--deliver`: assistant の返信を provider に配信する（デフォルトではオフ）
- `--thinking <level>`: 送信時の thinking level を上書き
- `--message <text>`: 接続後に最初のメッセージを送信
- `--timeout-ms <ms>`: エージェントタイムアウト（ミリ秒）。デフォルトは `agents.defaults.timeoutSeconds`
- `--history-limit <n>`: 読み込む履歴エントリ数（デフォルト `200`）

注記: `--url` を設定した場合、TUI は config や環境認証情報にはフォールバックしません。
`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。
ローカルモードでは、`--url`、`--token`、`--password` を渡さないでください。

## トラブルシューティング

メッセージ送信後に出力がない場合:

- TUI 内で `/status` を実行し、Gateway が接続済みで idle/busy のどちらかを確認してください。
- Gateway ログを確認してください: `openclaw logs --follow`。
- エージェントが実行可能か確認してください: `openclaw status` と `openclaw models status`。
- chat channel へのメッセージを期待している場合は、配信を有効にしてください（`/deliver on` または `--deliver`）。

## 接続トラブルシューティング

- `disconnected`: Gateway が実行中であり、`--url/--token/--password` が正しいことを確認してください。
- picker に agents が出ない: `openclaw agents list` とルーティング config を確認してください。
- session picker が空: global スコープか、まだ session が存在しない可能性があります。

## 関連

- [Control UI](/ja-JP/web/control-ui) — Web ベースの操作インターフェース
- [Config](/ja-JP/cli/config) — `openclaw.json` の確認、検証、編集
- [Doctor](/ja-JP/cli/doctor) — ガイド付き修復と移行チェック
- [CLI Reference](/ja-JP/cli) — CLI コマンドの完全リファレンス
