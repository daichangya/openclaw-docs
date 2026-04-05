---
read_when:
    - TUIの初心者向けウォークスルーが欲しい
    - TUIの機能、コマンド、ショートカットの完全な一覧が必要
summary: 'ターミナルUI (TUI): どのマシンからでもGatewayに接続'
title: TUI
x-i18n:
    generated_at: "2026-04-05T13:01:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: a73f70d65ecc7bff663e8df28c07d70d2920d4732fbb8288c137d65b8653ac52
    source_path: web/tui.md
    workflow: 15
---

# TUI (ターミナルUI)

## クイックスタート

1. Gatewayを起動します。

```bash
openclaw gateway
```

2. TUIを開きます。

```bash
openclaw tui
```

3. メッセージを入力してEnterを押します。

リモートGateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gatewayがpassword認証を使っている場合は`--password`を使用してください。

## 表示されるもの

- ヘッダー: 接続URL、現在のagent、現在のsession。
- チャットログ: ユーザーメッセージ、assistant返信、システム通知、toolカード。
- ステータス行: 接続 / 実行状態（connecting、running、streaming、idle、error）。
- フッター: 接続状態 + agent + session + model + think/fast/verbose/reasoning + token数 + deliver。
- 入力欄: オートコンプリート付きテキストエディター。

## メンタルモデル: agents + sessions

- Agentsは一意なslugです（例: `main`、`research`）。Gatewayがその一覧を公開します。
- Sessionsは現在のagentに属します。
- Session keyは`agent:<agentId>:<sessionKey>`として保存されます。
  - `/session main`と入力すると、TUIはそれを`agent:<currentAgent>:main`に展開します。
  - `/session agent:other:main`と入力すると、そのagent sessionに明示的に切り替わります。
- Session scope:
  - `per-sender`（デフォルト）: 各agentは複数のsessionを持ちます。
  - `global`: TUIは常に`global` sessionを使用します（pickerは空の場合があります）。
- 現在のagent + sessionは常にフッターに表示されます。

## 送信 + 配信

- メッセージはGatewayへ送信されます。プロバイダーへの配信はデフォルトでオフです。
- 配信をオンにする:
  - `/deliver on`
  - またはSettingsパネル
  - または`openclaw tui --deliver`で開始

## Pickers + overlays

- Model picker: 利用可能なmodelを一覧表示し、session overrideを設定します。
- Agent picker: 別のagentを選択します。
- Session picker: 現在のagentのsessionだけを表示します。
- Settings: deliver、tool出力の展開、thinking表示を切り替えます。

## キーボードショートカット

- Enter: メッセージ送信
- Esc: アクティブな実行を中断
- Ctrl+C: 入力をクリア（2回押すと終了）
- Ctrl+D: 終了
- Ctrl+L: model picker
- Ctrl+G: agent picker
- Ctrl+P: session picker
- Ctrl+O: tool出力の展開を切り替え
- Ctrl+T: thinking表示を切り替え（履歴を再読み込み）

## スラッシュコマンド

コア:

- `/help`
- `/status`
- `/agent <id>`（または`/agents`）
- `/session <key>`（または`/sessions`）
- `/model <provider/model>`（または`/models`）

Session controls:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>`（エイリアス: `/elev`）
- `/activation <mention|always>`
- `/deliver <on|off>`

Session lifecycle:

- `/new`または`/reset`（sessionをリセット）
- `/abort`（アクティブな実行を中断）
- `/settings`
- `/exit`

その他のGatewayスラッシュコマンド（たとえば`/context`）はGatewayへ転送され、システム出力として表示されます。詳細は[Slash commands](/tools/slash-commands)を参照してください。

## local shellコマンド

- 行頭に`!`を付けると、TUIホスト上でlocal shellコマンドを実行します。
- TUIはsessionごとに一度だけlocal実行の許可を求めます。拒否すると、そのsessionでは`!`が無効のままになります。
- コマンドは、TUIの作業ディレクトリで新しい非対話型shell内で実行されます（`cd` / envは永続化されません）。
- local shellコマンドは、環境変数として`OPENCLAW_SHELL=tui-local`を受け取ります。
- 単独の`!`は通常のメッセージとして送信されます。先頭の空白ではlocal execはトリガーされません。

## tool出力

- Tool呼び出しは、args + results付きカードとして表示されます。
- Ctrl+Oで折りたたみ / 展開表示を切り替えます。
- tool実行中は、部分更新が同じカードにストリームされます。

## ターミナルの色

- TUIはassistant本文テキストをターミナルのデフォルト前景色のままにするため、ダークターミナルでもライトターミナルでも読みやすさが保たれます。
- ターミナルが明るい背景を使っていて自動検出が誤っている場合は、`openclaw tui`を起動する前に`OPENCLAW_THEME=light`を設定してください。
- 元のダークパレットを強制するには、代わりに`OPENCLAW_THEME=dark`を設定してください。

## 履歴 + ストリーミング

- 接続時に、TUIは最新の履歴を読み込みます（デフォルト200メッセージ）。
- ストリーミング返信は、確定されるまでその場で更新されます。
- TUIは、よりリッチなtoolカードのためにagent toolイベントもリッスンします。

## 接続の詳細

- TUIは`mode: "tui"`としてGatewayに登録されます。
- 再接続時はシステムメッセージが表示され、イベントの欠落はログに表面化されます。

## オプション

- `--url <url>`: Gateway WebSocket URL（デフォルトはconfigまたは`ws://127.0.0.1:<port>`）
- `--token <token>`: Gateway token（必要な場合）
- `--password <password>`: Gateway password（必要な場合）
- `--session <key>`: Session key（デフォルト: `main`、scopeがglobalの場合は`global`）
- `--deliver`: assistant返信をプロバイダーへ配信（デフォルトはオフ）
- `--thinking <level>`: 送信時のthinking levelを上書き
- `--message <text>`: 接続後に初期メッセージを送信
- `--timeout-ms <ms>`: ms単位のagent timeout（デフォルトは`agents.defaults.timeoutSeconds`）
- `--history-limit <n>`: 読み込む履歴エントリー数（デフォルト`200`）

注意: `--url`を設定すると、TUIはconfigや環境の認証情報へフォールバックしません。
`--token`または`--password`を明示的に渡してください。明示的な認証情報が不足している場合はエラーです。

## トラブルシューティング

メッセージ送信後に出力がない場合:

- TUIで`/status`を実行し、Gatewayが接続済みでidleまたはbusyであることを確認してください。
- Gatewayログを確認してください: `openclaw logs --follow`。
- agentが実行可能であることを確認してください: `openclaw status`と`openclaw models status`。
- チャットチャネルにメッセージが出る想定なら、配信を有効にしてください（`/deliver on`または`--deliver`）。

## 接続トラブルシューティング

- `disconnected`: Gatewayが動作中であり、`--url/--token/--password`が正しいことを確認してください。
- pickerにagentがない: `openclaw agents list`とルーティング設定を確認してください。
- session pickerが空: global scopeにいるか、まだsessionがない可能性があります。

## 関連

- [Control UI](/web/control-ui) — Webベースのコントロールインターフェース
- [CLI Reference](/cli) — 完全なCLIコマンドリファレンス
