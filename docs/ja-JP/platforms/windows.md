---
read_when:
    - WindowsへのOpenClawのインストール
    - ネイティブWindowsとWSL2の選び方
    - Windowsコンパニオンアプリの状況を確認する
summary: 'Windowsサポート: ネイティブおよびWSL2のインストールパス、デーモン、現在の注意事項'
title: Windows
x-i18n:
    generated_at: "2026-04-20T04:46:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e7451c785a1d75c809522ad93e2c44a00b211f77f14c5c489fd0b01840d3fe2
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClawは**ネイティブWindows**と**WSL2**の両方をサポートしています。WSL2のほうがより安定したパスであり、フル体験には推奨されています。CLI、Gateway、各種ツールはLinux内で完全な互換性をもって動作します。ネイティブWindowsでも中核となるCLIとGatewayの利用は可能ですが、以下に記載するいくつかの注意事項があります。

ネイティブWindows向けコンパニオンアプリは計画中です。

## WSL2（推奨）

- [はじめに](/ja-JP/start/getting-started)（WSL内で使用）
- [インストールと更新](/ja-JP/install/updating)
- 公式WSL2ガイド（Microsoft）: [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## ネイティブWindowsの現状

ネイティブWindowsでのCLIフローは改善が進んでいますが、依然としてWSL2が推奨パスです。

現在ネイティブWindowsで問題なく動作するもの:

- `install.ps1` を使ったWebサイト経由のインストーラー
- `openclaw --version`、`openclaw doctor`、`openclaw plugins list --json` などのローカルCLI利用
- 次のような組み込みのlocal-agent/providerスモークテスト:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

現在の注意事項:

- `openclaw onboard --non-interactive` は、`--skip-health` を渡さない限り、到達可能なローカルGatewayを引き続き必要とします
- `openclaw onboard --non-interactive --install-daemon` と `openclaw gateway install` は、まずWindowsのScheduled Tasksを試します
- Scheduled Taskの作成が拒否された場合、OpenClawはユーザーごとのStartupフォルダー内ログイン項目にフォールバックし、ただちにGatewayを起動します
- `schtasks` 自体がハングしたり応答しなくなった場合、OpenClawはそのパスをすばやく中止し、無限に待機するのではなくフォールバックするようになりました
- 利用可能な場合でも、より良い supervisor の状態確認を提供できるため、引き続きScheduled Tasksが優先されます

ネイティブCLIのみを使いたい場合で、Gatewayサービスのインストールが不要なら、次のいずれかを使ってください:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

ネイティブWindowsで管理された自動起動が必要な場合:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Scheduled Taskの作成がブロックされる場合でも、フォールバックのサービスモードは現在のユーザーのStartupフォルダー経由で、ログイン後に自動起動します。

## Gateway

- [Gatewayランブック](/ja-JP/gateway)
- [設定](/ja-JP/gateway/configuration)

## Gatewayサービスのインストール（CLI）

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

プロンプトが表示されたら、**Gateway service** を選択してください。

修復／移行:

```
openclaw doctor
```

## Windowsログイン前にGatewayを自動起動する

ヘッドレス構成では、誰もWindowsにログインしなくても、起動チェーン全体が実行されるようにしてください。

### 1) ログインなしでもユーザーサービスを動かし続ける

WSL内で:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) OpenClaw Gatewayユーザーサービスをインストールする

WSL内で:

```bash
openclaw gateway install
```

### 3) Windows起動時にWSLを自動起動する

管理者としてPowerShellで:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

`Ubuntu` は、次のコマンドで表示されるディストリビューション名に置き換えてください:

```powershell
wsl --list --verbose
```

### 起動チェーンを確認する

再起動後（Windowsサインイン前）、WSLから次を確認してください:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 高度な設定: WSLのサービスをLAN上に公開する（portproxy）

WSLは独自の仮想ネットワークを持っています。別のマシンから**WSL内**で動作しているサービス（SSH、ローカルTTSサーバー、またはGateway）に到達する必要がある場合、Windowsのポートを現在のWSL IPへ転送しなければなりません。WSL IPは再起動後に変わるため、転送ルールを更新する必要がある場合があります。

例（**管理者として**PowerShellで実行）:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Windows Firewallでそのポートを許可します（1回だけ）:

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

- 別のマシンからのSSHは**WindowsホストのIP**を対象にします（例: `ssh user@windows-host -p 2222`）。
- リモートNodeは、**到達可能な** Gateway URL（`127.0.0.1` ではない）を指す必要があります。確認には `openclaw status --all` を使ってください。
- LANアクセスには `listenaddress=0.0.0.0` を使います。`127.0.0.1` ならローカル専用のままです。
- これを自動化したい場合は、ログイン時に更新手順を実行するScheduled Taskを登録してください。

## WSL2のステップ別インストール

### 1) WSL2 + Ubuntuをインストールする

PowerShell（管理者）を開きます:

```powershell
wsl --install
# または、ディストリビューションを明示的に選択:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Windowsに求められたら再起動してください。

### 2) systemdを有効にする（Gatewayのインストールに必須）

WSLターミナルで:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

その後、PowerShellから:

```powershell
wsl --shutdown
```

Ubuntuを再度開いて、次を確認します:

```bash
systemctl --user status
```

### 3) OpenClawをインストールする（WSL内）

WSL内で通常の初回セットアップを行う場合は、Linux向けの「はじめに」フローに従ってください:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

初回オンボーディングではなくソースから開発する場合は、[Setup](/ja-JP/start/setup) のソース開発ループを使ってください:

```bash
pnpm install
# 初回実行時のみ（またはローカルのOpenClaw config/workspaceをリセットした後）
pnpm openclaw setup
pnpm gateway:watch
```

完全なガイド: [はじめに](/ja-JP/start/getting-started)

## Windowsコンパニオンアプリ

まだWindowsコンパニオンアプリはありません。実現に向けた貢献をしたい場合は、コントリビューションを歓迎します。
