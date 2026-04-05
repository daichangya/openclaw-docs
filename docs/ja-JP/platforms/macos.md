---
read_when:
    - macOS appの機能を実装している場合
    - macOSでgatewayライフサイクルまたはnodeブリッジを変更している場合
summary: OpenClaw macOS companion app（メニューバー + gatewayブローカー）
title: macOS App
x-i18n:
    generated_at: "2026-04-05T12:51:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfac937e352ede495f60af47edf3b8e5caa5b692ba0ea01d9fb0de9a44bbc135
    source_path: platforms/macos.md
    workflow: 15
---

# OpenClaw macOS Companion（メニューバー + gatewayブローカー）

macOS appは、OpenClawの**メニューバーコンパニオン**です。権限を管理し、
ローカルでGatewayを管理または接続し（launchdまたは手動）、macOSの
機能をnodeとしてagentに公開します。

## 何をするか

- メニューバーにネイティブ通知とステータスを表示します。
- TCCプロンプト（Notifications、Accessibility、Screen Recording、Microphone、
  Speech Recognition、Automation/AppleScript）を管理します。
- Gatewayを実行または接続します（localまたはremote）。
- macOS専用ツール（Canvas、Camera、Screen Recording、`system.run`）を公開します。
- **remote** modeではローカルnode host serviceを開始し（launchd）、**local** modeでは停止します。
- 必要に応じて **PeekabooBridge** をホストします。
- 要求に応じてnpm、pnpm、またはbun経由でグローバルCLI（`openclaw`）をインストールします
  （appはnpm、次にpnpm、最後にbunを優先します。Nodeは引き続き推奨されるGatewayランタイムです）。

## local modeとremote mode

- **Local**（デフォルト）: appは、実行中のローカルGatewayがあればそこへ接続します。
  なければ `openclaw gateway install` 経由でlaunchd serviceを有効化します。
- **Remote**: appはSSH/Tailscale経由でGatewayへ接続し、ローカルprocessは決して起動しません。
  appはローカルの**node host service**を起動し、remote GatewayがこのMacへ到達できるようにします。
  appはGatewayを子プロセスとして起動しません。
  Gateway discoveryは現在、raw tailnet IPよりもTailscale MagicDNS名を優先するため、
  tailnet IPが変わったときでもMac appはより確実に復旧できます。

## Launchd制御

appは、ユーザーごとのLaunchAgent `ai.openclaw.gateway`
（`--profile`/`OPENCLAW_PROFILE` 使用時は `ai.openclaw.<profile>`。legacyな `com.openclaw.*` も引き続きunload対象）を管理します。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付きprofileで実行している場合は、ラベルを `ai.openclaw.<profile>` に置き換えてください。

LaunchAgentがインストールされていない場合は、appから有効化するか、
`openclaw gateway install` を実行してください。

## Node capabilities（mac）

macOS appは自分自身をnodeとして提示します。一般的なコマンド:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.record`
- System: `system.run`, `system.notify`

nodeは `permissions` マップを報告し、agentsが何が許可されているか判断できるようにします。

Node service + app IPC:

- ヘッドレスのnode host serviceが実行中（remote mode）であるとき、それはnodeとしてGateway WSへ接続します。
- `system.run` はローカルUnix socket経由でmacOS app（UI/TCCコンテキスト）内で実行されます。プロンプトと出力はapp内にとどまります。

図（SCI）:

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec approvals（`system.run`）

`system.run` は、macOS app内の**Exec approvals**（Settings → Exec approvals）で制御されます。
Security + ask + allowlistは、Mac上の次の場所にローカル保存されます:

```
~/.openclaw/exec-approvals.json
```

例:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

注意:

- `allowlist` エントリは、解決済みバイナリパスに対するglobパターンです。
- shell制御または展開構文（`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`）を含む
  生のshell command textはallowlist missとして扱われ、明示的承認が必要です
  （またはshell binary自体をallowlistする必要があります）。
- プロンプトで「Always Allow」を選ぶと、そのcommandがallowlistに追加されます。
- `system.run` のenvironment overridesはフィルタされ（`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` を削除）、
  その後appのenvironmentとマージされます。
- shell wrapper（`bash|sh|zsh ... -c/-lc`）では、request単位のenvironment overridesは、
  小さな明示allowlist（`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`）に絞られます。
- allowlist modeでのallow-always判断では、既知のdispatch wrapper（`env`, `nice`, `nohup`, `stdbuf`, `timeout`）については、
  wrapper pathではなく内側の実行ファイルパスが永続化されます。安全にunwrapできない場合は、
  allowlistエントリは自動では永続化されません。

## ディープリンク

appはローカルアクション用に `openclaw://` URL schemeを登録します。

### `openclaw://agent`

Gatewayの `agent` リクエストをトリガーします。
__OC_I18N_900004__
クエリパラメーター:

- `message`（必須）
- `sessionKey`（任意）
- `thinking`（任意）
- `deliver` / `to` / `channel`（任意）
- `timeoutSeconds`（任意）
- `key`（任意、unattended modeキー）

安全性:

- `key` がない場合、appは確認を求めます。
- `key` がない場合、appは確認プロンプトに対して短いメッセージ上限を適用し、`deliver` / `to` / `channel` は無視します。
- 有効な `key` がある場合、その実行はunattendedになります（個人用automation向け）。

## オンボーディングフロー（典型例）

1. **OpenClaw.app** をインストールして起動します。
2. 権限チェックリストを完了します（TCCプロンプト）。
3. **Local** modeが有効で、Gatewayが動作していることを確認します。
4. terminalアクセスが必要ならCLIをインストールします。

## State dirの配置（macOS）

OpenClaw state dirをiCloudやその他のクラウド同期フォルダーに置くのは避けてください。
同期バックエンドのパスは遅延を増やし、sessionsやcredentialsに対して
ファイルロックや同期競合を起こすことがあります。

次のような、ローカルで非同期のstate pathを推奨します:
__OC_I18N_900005__
`openclaw doctor` が次の配下にstateを検出した場合:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

警告を出し、ローカルパスへ戻すことを推奨します。

## Build & 開発ワークフロー（ネイティブ）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（またはXcode）
- appをパッケージ化: `scripts/package-mac-app.sh`

## Gateway接続をデバッグする（macOS CLI）

このデバッグCLIを使うと、appを起動せずに、
macOS appが使うのと同じGateway WebSocketハンドシェイクとdiscovery
ロジックを試せます。
__OC_I18N_900006__
connectオプション:

- `--url <ws://host:port>`: configを上書き
- `--mode <local|remote>`: configから解決（デフォルト: configまたはlocal）
- `--probe`: 新しいhealth probeを強制
- `--timeout <ms>`: リクエストタイムアウト（デフォルト: `15000`）
- `--json`: 差分確認向けの構造化出力

discoveryオプション:

- `--include-local`: 「local」として除外されるはずのgatewaysも含める
- `--timeout <ms>`: discovery全体の待機時間（デフォルト: `2000`）
- `--json`: 差分確認向けの構造化出力

ヒント: `openclaw gateway discover --json` と比較すると、
macOS appのdiscoveryパイプライン（`local.` と設定済みwide-area domain、さらに
wide-areaとTailscale Serveのフォールバック付き）が、
Node CLIの `dns-sd` ベースdiscoveryと異なるかどうかを確認できます。

## remote接続の内部構成（SSH tunnels）

macOS appが **Remote** modeで動作するとき、ローカルUI
コンポーネントがremote Gatewayをlocalhost上にあるかのように扱えるよう、
SSH tunnelを開きます。

### Control tunnel（Gateway WebSocket port）

- **目的:** health checks、status、Web Chat、config、その他のcontrol-plane呼び出し。
- **ローカルポート:** Gateway port（デフォルト `18789`）。常に固定です。
- **リモートポート:** remote host上の同じGateway port。
- **挙動:** ランダムなローカルポートは使いません。appは既存の健全なtunnelを再利用し、
  必要なら再起動します。
- **SSH形状:** `ssh -N -L <local>:127.0.0.1:<remote>` に、BatchMode +
  ExitOnForwardFailure + keepaliveオプションを付けます。
- **IP報告:** SSH tunnelはloopbackを使うため、gatewayから見えるnode
  IPは `127.0.0.1` になります。実際のclient IPを表示したい場合は、
  **Direct (ws/wss)** transportを使用してください（[macOS remote access](/platforms/mac/remote) を参照）。

セットアップ手順は [macOS remote access](/platforms/mac/remote) を参照してください。プロトコルの
詳細は [Gateway protocol](/gateway/protocol) を参照してください。

## 関連ドキュメント

- [Gateway runbook](/gateway)
- [Gateway (macOS)](/platforms/mac/bundled-gateway)
- [macOS permissions](/platforms/mac/permissions)
- [Canvas](/platforms/mac/canvas)
