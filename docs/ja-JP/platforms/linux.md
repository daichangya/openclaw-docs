---
read_when:
    - Linux コンパニオンアプリの状況を探していること
    - プラットフォーム対応やコントリビューションを計画していること
    - VPS またはコンテナでの Linux の OOM kill または exit 137 をデバッグすること
summary: Linux サポート + コンパニオンアプリの状況
title: Linux アプリ
x-i18n:
    generated_at: "2026-04-23T04:46:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56151406517a1259e66626b8f4b48c16917b10580e7626463afd8a68dc286f7
    source_path: platforms/linux.md
    workflow: 15
---

# Linux アプリ

Gateway は Linux で完全にサポートされています。**推奨ランタイムは Node** です。
Gateway での Bun は推奨されません（WhatsApp/Telegram のバグがあります）。

ネイティブの Linux コンパニオンアプリは計画中です。構築に協力したい場合、コントリビューションを歓迎します。

## 初心者向けクイックパス（VPS）

1. Node 24 をインストールします（推奨。互換性のために Node 22 LTS、現在の `22.14+` も引き続き動作します）
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. ラップトップから: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` を開き、設定済みの共有シークレットで認証します（デフォルトはトークン。`gateway.auth.mode: "password"` を設定した場合はパスワード）

完全な Linux サーバーガイド: [Linux Server](/ja-JP/vps)。ステップごとの VPS 例: [exe.dev](/ja-JP/install/exe-dev)

## インストール

- [はじめに](/ja-JP/start/getting-started)
- [インストールと更新](/ja-JP/install/updating)
- 任意のフロー: [Bun（実験的）](/ja-JP/install/bun)、[Nix](/ja-JP/install/nix)、[Docker](/ja-JP/install/docker)

## Gateway

- [Gateway runbook](/ja-JP/gateway)
- [設定](/ja-JP/gateway/configuration)

## Gateway サービスのインストール（CLI）

次のいずれかを使用します。

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

## システム制御（systemd ユーザーユニット）

OpenClaw はデフォルトで systemd の**ユーザー**サービスをインストールします。共有サーバーまたは常時稼働サーバーでは**システム**サービスを使用してください。`openclaw gateway install` と
`openclaw onboard --install-daemon` は、現在の正規ユニットをすでに生成します。カスタムの system/service-manager
構成が必要な場合にのみ手書きしてください。完全なサービスガイダンスは [Gateway runbook](/ja-JP/gateway) にあります。

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

## メモリ圧迫と OOM kill

Linux では、ホスト、VM、またはコンテナの cgroup の
メモリが不足すると、カーネルが OOM victim を選びます。Gateway は、長寿命の
セッションとチャネル接続を所有しているため、不適切な victim になることがあります。そのため OpenClaw は、
可能な場合、Gateway より先に一時的な子プロセスが kill されるようにバイアスをかけています。

対象となる Linux の子プロセス spawn では、OpenClaw は短い
`/bin/sh` ラッパーを介して子を起動し、その子自身の `oom_score_adj` を `1000` に引き上げてから、
実際のコマンドを `exec` します。これは、子プロセスが
自分自身の OOM kill されやすさを高めているだけなので、非特権操作です。

対象となる子プロセスの起動面には、次が含まれます。

- supervisor 管理のコマンド子プロセス
- PTY シェル子プロセス
- MCP stdio サーバー子プロセス
- OpenClaw が起動する browser/Chrome プロセス

このラッパーは Linux 専用で、`/bin/sh` が利用できない場合はスキップされます。また、
子プロセスの env に `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`、`false`、
`no`、または `off` が設定されている場合もスキップされます。

子プロセスを確認するには:

```bash
cat /proc/<child-pid>/oom_score_adj
```

対象の子プロセスで期待される値は `1000` です。Gateway プロセスは通常のスコアを維持する必要があり、
通常は `0` です。

これは通常のメモリ調整に代わるものではありません。VPS またはコンテナで子プロセスが繰り返し kill される場合は、メモリ制限を増やすか、並行性を下げるか、systemd の `MemoryMax=` やコンテナレベルのメモリ制限など、より強力なリソース制御を追加してください。
