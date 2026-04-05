---
read_when:
    - マシンからOpenClawを削除したい場合
    - アンインストール後もgatewayサービスが動作し続けている場合
summary: OpenClawを完全にアンインストールする（CLI、サービス、state、workspace）
title: アンインストール
x-i18n:
    generated_at: "2026-04-05T12:49:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34c7d3e4ad17333439048dfda739fc27db47e7f9e4212fe17db0e4eb3d3ab258
    source_path: install/uninstall.md
    workflow: 15
---

# アンインストール

方法は2つあります:

- `openclaw` がまだインストールされている場合の**簡単な方法**。
- CLIは消えているがサービスだけがまだ動作している場合の**手動サービス削除**。

## 簡単な方法（CLIがまだインストールされている）

推奨: 組み込みアンインストーラーを使用します:

```bash
openclaw uninstall
```

非対話式（自動化 / npx）:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

手動手順（結果は同じです）:

1. gatewayサービスを停止します:

```bash
openclaw gateway stop
```

2. gatewayサービスをアンインストールします（launchd/systemd/schtasks）:

```bash
openclaw gateway uninstall
```

3. state + 設定を削除します:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

`OPENCLAW_CONFIG_PATH` をstate dirの外にあるカスタム場所へ設定していた場合は、そのファイルも削除してください。

4. workspaceを削除します（任意、agentファイルも削除されます）:

```bash
rm -rf ~/.openclaw/workspace
```

5. CLIインストールを削除します（使用したものを選んでください）:

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. macOSアプリをインストールしていた場合:

```bash
rm -rf /Applications/OpenClaw.app
```

注意:

- profile（`--profile` / `OPENCLAW_PROFILE`）を使っていた場合は、各state dirに対して手順3を繰り返してください（デフォルトは `~/.openclaw-<profile>`）。
- remote modeでは、state dirは**gateway host** 上にあるため、手順1〜4もそこで実行してください。

## 手動サービス削除（CLIがインストールされていない）

gatewayサービスが動作し続けているのに `openclaw` が見つからない場合に使用します。

### macOS（launchd）

デフォルトラベルは `ai.openclaw.gateway`（または `ai.openclaw.<profile>`。レガシーの `com.openclaw.*` がまだ存在することがあります）です:

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

profileを使っていた場合は、ラベルとplist名を `ai.openclaw.<profile>` に置き換えてください。存在する場合は、レガシーの `com.openclaw.*` plistも削除してください。

### Linux（systemd user unit）

デフォルトのunit名は `openclaw-gateway.service`（または `openclaw-gateway-<profile>.service`）です:

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows（Scheduled Task）

デフォルトのタスク名は `OpenClaw Gateway`（または `OpenClaw Gateway (<profile>)`）です。
タスクスクリプトはstate dir配下にあります。

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

profileを使っていた場合は、一致するタスク名と `~\.openclaw-<profile>\gateway.cmd` を削除してください。

## 通常のインストールとソースcheckoutの違い

### 通常のインストール（install.sh / npm / pnpm / bun）

`https://openclaw.ai/install.sh` または `install.ps1` を使った場合、CLIは `npm install -g openclaw@latest` でインストールされています。
`npm rm -g openclaw`（または、その方法でインストールした場合は `pnpm remove -g` / `bun remove -g`）で削除してください。

### ソースcheckout（git clone）

リポジトリのcheckoutから実行している場合（`git clone` + `openclaw ...` / `bun run openclaw ...`）:

1. リポジトリを削除する**前に**gatewayサービスをアンインストールします（上の簡単な方法または手動サービス削除を使用）。
2. リポジトリディレクトリを削除します。
3. 上記のとおりstate + workspaceを削除します。
