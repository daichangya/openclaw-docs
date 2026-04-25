---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux で OpenClaw の browser 制御向け Chrome/Brave/Edge/Chromium の CDP 起動問題を修正する
title: browser トラブルシューティング
x-i18n:
    generated_at: "2026-04-25T13:59:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6540de2c3141a92ad8bf7f6aedfc0ecb68293c939da2fed59e7fe2dd07ce8901
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## 問題: 「Failed to start Chrome CDP on port 18800」

OpenClaw の browser control server が、次のエラーで Chrome/Brave/Edge/Chromium を起動できません。

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### 根本原因

Ubuntu（および多くの Linux ディストリビューション）では、デフォルトの Chromium インストールは **snap パッケージ**です。snap の AppArmor confinement が、OpenClaw の browser プロセス起動および監視方法に干渉します。

`apt install chromium` コマンドは、snap にリダイレクトするスタブパッケージをインストールします。

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

これは本物の browser ではなく、単なるラッパーです。

Linux でよくある他の起動失敗:

- `The profile appears to be in use by another Chromium process` は、Chrome が管理対象 profile ディレクトリ内に古い `Singleton*` ロックファイルを見つけたことを意味します。OpenClaw は、そのロックが停止済みまたは別ホスト上のプロセスを指している場合、それらのロックを削除して 1 回だけ再試行します。
- `Missing X server or $DISPLAY` は、desktop session のないホストで可視 browser が明示的に要求されたことを意味します。デフォルトでは、`DISPLAY` と `WAYLAND_DISPLAY` の両方が未設定なら、ローカル管理 profile は Linux 上で headless mode にフォールバックするようになりました。`OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless: false`、または `browser.profiles.<name>.headless: false` を設定している場合は、その headed 上書きを削除するか、`OPENCLAW_BROWSER_HEADLESS=1` を設定するか、`Xvfb` を起動するか、1 回限りの管理起動として `openclaw browser start --headless` を実行するか、実際の desktop session で OpenClaw を実行してください。

### 解決策 1: Google Chrome をインストールする（推奨）

snap によって sandbox 化されていない公式の Google Chrome `.deb` パッケージをインストールします。

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # 依存関係エラーがある場合
```

その後、OpenClaw の config（`~/.openclaw/openclaw.json`）を更新します。

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### 解決策 2: Attach-Only モードで Snap Chromium を使う

どうしても snap Chromium を使う必要がある場合は、手動で起動した browser に OpenClaw が attach するよう設定してください。

1. config を更新:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Chromium を手動起動:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. 任意で、Chrome を自動起動する systemd user service を作成:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

有効化するには: `systemctl --user enable --now openclaw-browser.service`

### browser が動作することを確認する

status を確認:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

ブラウジングをテスト:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### config リファレンス

| オプション                        | 説明                                                                 | デフォルト                                                    |
| --------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| `browser.enabled`                 | browser control を有効化                                             | `true`                                                        |
| `browser.executablePath`          | Chromium 系 browser バイナリへのパス（Chrome/Brave/Edge/Chromium）    | 自動検出（Chromium 系ならデフォルト browser を優先）          |
| `browser.headless`                | GUI なしで実行                                                       | `false`                                                       |
| `OPENCLAW_BROWSER_HEADLESS`       | ローカル管理 browser の headless mode に対するプロセス単位上書き     | 未設定                                                        |
| `browser.noSandbox`               | `--no-sandbox` フラグを追加（一部 Linux 構成で必要）                 | `false`                                                       |
| `browser.attachOnly`              | browser を起動せず、既存のものにのみ attach                          | `false`                                                       |
| `browser.cdpPort`                 | Chrome DevTools Protocol ポート                                      | `18800`                                                       |
| `browser.localLaunchTimeoutMs`    | ローカル管理 Chrome の検出タイムアウト                               | `15000`                                                       |
| `browser.localCdpReadyTimeoutMs`  | ローカル管理起動後の CDP readiness タイムアウト                      | `8000`                                                        |

Raspberry Pi、古い VPS ホスト、または遅いストレージでは、
Chrome が CDP HTTP
endpoint を公開するまでにより時間がかかる場合、`browser.localLaunchTimeoutMs` を上げてください。起動自体は成功しても
`openclaw browser start` が `not reachable after start` を報告する場合は、
`browser.localCdpReadyTimeoutMs` を上げてください。値の上限は 120000 ms です。

### 問題: 「No Chrome tabs found for profile="user"」

`existing-session` / Chrome MCP profile を使っています。OpenClaw はローカル Chrome を見つけられていますが、attach 可能な開いているタブがありません。

対処方法:

1. **管理 browser を使う:** `openclaw browser start --browser-profile openclaw`
   （または `browser.defaultProfile: "openclaw"` を設定）。
2. **Chrome MCP を使う:** 少なくとも 1 つの開いたタブを持つローカル Chrome が実行中であることを確認し、その後 `--browser-profile user` で再試行。

注意:

- `user` はホスト専用です。Linux サーバー、コンテナ、リモートホストでは、CDP profile を優先してください。
- `user` / その他の `existing-session` profile には、現在の Chrome MCP の制限が引き続きあります:
  ref 駆動アクション、1 ファイル upload hook、dialog timeout 上書きなし、`wait --load networkidle` なし、
  `responsebody`、PDF export、download interception、batch action なし。
- ローカル `openclaw` profile は `cdpPort`/`cdpUrl` を自動割り当てします。これらはリモート CDP にのみ設定してください。
- リモート CDP profile は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  `/json/version` 検出には HTTP(S) を使い、browser
  service が直接の DevTools socket URL を提供する場合は WS(S) を使ってください。

## 関連

- [Browser](/ja-JP/tools/browser)
- [Browser login](/ja-JP/tools/browser-login)
- [Browser WSL2 troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
