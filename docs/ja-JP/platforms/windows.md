---
read_when:
    - WindowsにOpenClawをインストールする
    - ネイティブWindowsとWSL2のどちらを選ぶか検討している
    - Windows companion appの状況を知りたい
summary: 'Windowsサポート: ネイティブ環境とWSL2のインストール経路、daemon、現在の注意点'
title: Windows
x-i18n:
    generated_at: "2026-04-05T12:51:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d9819206bdd65cf03519c1bc73ed0c7889b0ab842215ea94343262300adfd14
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClawは**ネイティブWindows**と**WSL2**の両方をサポートしています。WSL2のほうが
より安定した経路であり、完全な体験には推奨されます。CLI、Gateway、toolingは
Linux内で動作し、完全な互換性があります。ネイティブWindowsでも
コアのCLIとGatewayは利用できますが、以下の注意点があります。

ネイティブWindows companion appは計画中です。

## WSL2（推奨）

- [はじめに](/ja-JP/start/getting-started)（WSL内で使用）
- [インストールと更新](/install/updating)
- 公式WSL2ガイド（Microsoft）: [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## ネイティブWindowsの現状

ネイティブWindowsのCLIフローは改善が進んでいますが、依然としてWSL2が推奨経路です。

現在ネイティブWindowsでうまく動作するもの:

- `install.ps1` によるwebsite installer
- `openclaw --version`、`openclaw doctor`、`openclaw plugins list --json` などのローカルCLI利用
- 次のような埋め込みlocal-agent/provider smoke:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

現在の注意点:

- `openclaw onboard --non-interactive` は、`--skip-health` を渡さない限り、到達可能なローカルGatewayを引き続き前提とします
- `openclaw onboard --non-interactive --install-daemon` と `openclaw gateway install` は、まずWindows Scheduled Tasksを試します
- Scheduled Taskの作成が拒否された場合、OpenClawはユーザーごとのStartupフォルダーのlogin itemにフォールバックし、すぐにGatewayを起動します
- `schtasks` 自体がハングしたり応答しなくなったりした場合、OpenClawは永遠に待機する代わりに、その経路をすばやく中止してフォールバックします
- より良いsupervisor statusを提供するため、利用可能な場合は引き続きScheduled Tasksが優先されます

ネイティブCLIのみを使い、Gateway service installを行わない場合は、次のいずれかを使ってください。

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

ネイティブWindowsで管理された自動起動が必要な場合:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Scheduled Taskの作成がブロックされる場合でも、フォールバックservice modeは現在のユーザーのStartupフォルダーを通じてログイン後に自動起動します。

## Gateway

- [Gateway runbook](/gateway)
- [Configuration](/gateway/configuration)

## Gateway service install（CLI）

WSL2内では:

```
openclaw onboard --install-daemon
```

または:

```
openclaw gateway install
```

または:

```
openclaw configure
```

プロンプトが表示されたら **Gateway service** を選択してください。

修復/移行:

```
openclaw doctor
```

## Windowsログイン前にGatewayを自動起動する

ヘッドレス構成では、誰も
Windowsへログインしていなくても、完全な起動チェーンが動作するようにしてください。

### 1) ログインなしでもユーザーserviceを動かし続ける

WSL内で:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) OpenClaw Gateway user serviceをインストールする

WSL内で:

```bash
openclaw gateway install
```

### 3) Windows起動時にWSLを自動起動する

PowerShellをAdministratorとして開いて実行:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

`Ubuntu` は次のコマンドで確認できるdistro名に置き換えてください。

```powershell
wsl --list --verbose
```

### 起動チェーンを確認する

再起動後（Windowsサインイン前）、WSLから次を確認します。

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 高度な設定: WSL serviceをLANへ公開する（portproxy）

WSLには独自の仮想ネットワークがあります。別のマシンから
**WSL内で**動作するservice（SSH、ローカルTTS server、またはGateway）へ到達する必要がある場合、
Windowsのportを現在のWSL IPへ転送する必要があります。WSL IPは再起動後に変わるため、
転送ルールを更新する必要がある場合があります。

例（PowerShellを**Administratorとして**実行）:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

そのportをWindows Firewallで許可します（1回のみ）:

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

WSL再起動後にportproxyを更新します:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

注意:

- 別のマシンからのSSHは**Windows host IP**を対象にします（例: `ssh user@windows-host -p 2222`）。
- リモートnodeは、到達可能なGateway URL（`127.0.0.1` ではない）を指す必要があります。
  確認には `openclaw status --all` を使ってください。
- LANアクセスには `listenaddress=0.0.0.0` を使ってください。`127.0.0.1` ならローカル専用です。
- これを自動化したい場合は、ログイン時に更新手順を実行するScheduled Taskを登録してください。

## WSL2インストール手順

### 1) WSL2 + Ubuntuをインストールする

PowerShellをAdminで開きます:

```powershell
wsl --install
# または、distroを明示的に選択:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Windowsから求められたら再起動してください。

### 2) systemdを有効にする（Gateway installに必須）

WSLターミナルで:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

その後PowerShellから:

```powershell
wsl --shutdown
```

Ubuntuを再度開き、次で確認します:

```bash
systemctl --user status
```

### 3) OpenClawをインストールする（WSL内）

WSL内でLinux向けのはじめにフローに従ってください:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # 初回実行時にUI依存関係を自動インストール
pnpm build
openclaw onboard
```

完全なガイド: [はじめに](/ja-JP/start/getting-started)

## Windows companion app

まだWindows companion appはありません。実現したい場合は、
コントリビューションを歓迎します。
