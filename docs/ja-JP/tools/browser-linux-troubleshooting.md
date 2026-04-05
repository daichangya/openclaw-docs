---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux 上の OpenClaw ブラウザー制御向けに、Chrome/Brave/Edge/Chromium の CDP 起動問題を修正する
title: ブラウザーのトラブルシューティング
x-i18n:
    generated_at: "2026-04-05T12:58:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ff8e6741558c1b5db86826c5e1cbafe35e35afe5cb2a53296c16653da59e516
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

# ブラウザーのトラブルシューティング（Linux）

## 問題: 「Failed to start Chrome CDP on port 18800」

OpenClaw のブラウザー制御サーバーが、次のエラーで Chrome/Brave/Edge/Chromium を起動できません。

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### 根本原因

Ubuntu（および多くの Linux ディストリビューション）では、デフォルトの Chromium インストールは **snap パッケージ** です。snap の AppArmor による制限が、OpenClaw によるブラウザープロセスの起動と監視の方法に干渉します。

`apt install chromium` コマンドは、snap にリダイレクトするスタブパッケージをインストールします。

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

これは実際のブラウザーでは**ありません**。単なるラッパーです。

### 解決策 1: Google Chrome をインストールする（推奨）

snap によるサンドボックス化がない、公式の Google Chrome `.deb` パッケージをインストールします。

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # 依存関係エラーがある場合
```

次に、OpenClaw の config（`~/.openclaw/openclaw.json`）を更新します。

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

### 解決策 2: Snap Chromium を attach-only モードで使う

snap 版の Chromium をどうしても使う必要がある場合は、手動で起動したブラウザーに OpenClaw が接続するよう設定します。

1. config を更新します。

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

2. Chromium を手動で起動します。

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. 必要に応じて、Chrome を自動起動する systemd ユーザーサービスを作成します。

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

### ブラウザーが動作していることを確認する

状態を確認します。

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

ブラウジングをテストします。

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### config リファレンス

| オプション | 説明 | デフォルト |
| ---------- | ---- | ---------- |
| `browser.enabled` | ブラウザー制御を有効にする | `true` |
| `browser.executablePath` | Chromium 系ブラウザーのバイナリーへのパス（Chrome/Brave/Edge/Chromium） | 自動検出（Chromium 系ならデフォルトブラウザーを優先） |
| `browser.headless` | GUI なしで実行する | `false` |
| `browser.noSandbox` | `--no-sandbox` フラグを追加する（一部の Linux 環境で必要） | `false` |
| `browser.attachOnly` | ブラウザーを起動せず、既存のものにのみ接続する | `false` |
| `browser.cdpPort` | Chrome DevTools Protocol のポート | `18800` |

### 問題: 「No Chrome tabs found for profile="user"」

`existing-session` / Chrome MCP プロファイルを使っています。OpenClaw はローカルの Chrome を認識できていますが、接続先にできる開いているタブがありません。

修正方法:

1. **管理対象ブラウザーを使う:** `openclaw browser start --browser-profile openclaw`
   （または `browser.defaultProfile: "openclaw"` を設定する）。
2. **Chrome MCP を使う:** ローカルの Chrome が少なくとも 1 つの開いたタブを持つ状態で実行されていることを確認し、`--browser-profile user` で再試行します。

注意:

- `user` はホスト専用です。Linux サーバー、コンテナー、またはリモートホストでは、CDP プロファイルを優先してください。
- `user` / その他の `existing-session` プロファイルには、現在の Chrome MCP の制限が引き続き適用されます:
  ref ベースの操作、単一ファイルのアップロードフック、ダイアログタイムアウト上書きなし、
  `wait --load networkidle` なし、さらに `responsebody`、PDF エクスポート、ダウンロード
  インターセプト、バッチ操作もありません。
- ローカルの `openclaw` プロファイルは `cdpPort`/`cdpUrl` を自動割り当てします。これらはリモート CDP の場合にのみ設定してください。
- リモート CDP プロファイルでは `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  `/json/version` の検出には HTTP(S) を使い、ブラウザー
  サービスが DevTools のソケット URL を直接提供する場合は WS(S) を使ってください。
