---
read_when:
    - Linux companion app の状況を確認する場合
    - プラットフォーム対応やコントリビューションを計画する場合
summary: Linux のサポートと companion app の状況
title: Linux App
x-i18n:
    generated_at: "2026-04-05T12:50:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5dbfc89eb65e04347479fc6c9a025edec902fb0c544fb8d5bd09c24558ea03b1
    source_path: platforms/linux.md
    workflow: 15
---

# Linux App

Gateway は Linux で完全にサポートされています。**Node が推奨ランタイム**です。
Bun は Gateway には推奨されません（WhatsApp/Telegram の不具合があります）。

ネイティブ Linux companion apps は計画中です。構築を手伝いたい場合はコントリビューションを歓迎します。

## クイックスタート（VPS）

1. Node 24 をインストールします（推奨。互換性のため Node 22 LTS（現在 `22.14+`）も引き続き動作します）
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. ラップトップから: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` を開き、設定した shared secret で認証します（デフォルトは token。`gateway.auth.mode: "password"` を設定した場合は password）

完全な Linux サーバーガイド: [Linux Server](/vps)。ステップごとの VPS 例: [exe.dev](/install/exe-dev)

## インストール

- [はじめに](/ja-JP/start/getting-started)
- [Install & updates](/install/updating)
- 任意のフロー: [Bun（実験的）](/install/bun)、[Nix](/install/nix)、[Docker](/install/docker)

## Gateway

- [Gateway runbook](/gateway)
- [Configuration](/gateway/configuration)

## Gateway サービスのインストール（CLI）

次のいずれかを使います:

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

プロンプトが表示されたら **Gateway service** を選択します。

修復/移行:

```
openclaw doctor
```

## システム制御（systemd user unit）

OpenClaw は、デフォルトで systemd **user** サービスをインストールします。共有サーバーや常時稼働サーバーでは **system** サービスを使用してください。`openclaw gateway install` と
`openclaw onboard --install-daemon` は、現在の正式な unit をすでに生成してくれます。手動で書くのは、カスタムの system/service-manager
セットアップが必要な場合だけにしてください。完全なサービスガイダンスは [Gateway runbook](/gateway) にあります。

最小構成:

`~/.config/systemd/user/openclaw-gateway[-<profile>].service` を作成します:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

有効化します:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
