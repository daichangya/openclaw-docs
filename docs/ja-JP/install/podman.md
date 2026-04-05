---
read_when:
    - Docker ではなく Podman でコンテナー化された Gateway を使いたい
summary: rootless Podman コンテナーで OpenClaw を実行する
title: Podman
x-i18n:
    generated_at: "2026-04-05T12:49:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb06e2d85b4b0c8a8c6e69c81f629c83b447cbcbb32e34b7876a1819c488020
    source_path: install/podman.md
    workflow: 15
---

# Podman

現在の非 root ユーザーが管理する、rootless Podman コンテナー内で OpenClaw Gateway を実行します。

想定されるモデルは次のとおりです。

- Podman が gateway コンテナーを実行する。
- ホスト上の `openclaw` CLI がコントロールプレーンになる。
- 永続 state はデフォルトでホストの `~/.openclaw` 配下に保存される。
- 日常的な管理では `sudo -u openclaw`、`podman exec`、または別の service user ではなく、`openclaw --container <name> ...` を使う。

## 前提条件

- rootless モードの **Podman**
- ホストにインストールされた **OpenClaw CLI**
- **任意:** Quadlet 管理の自動起動が必要なら `systemd --user`
- **任意:** ヘッドレスホストで起動時永続化のために `loginctl enable-linger "$(whoami)"` を使いたい場合のみ `sudo`

## クイックスタート

<Steps>
  <Step title="一度だけのセットアップ">
    リポジトリルートから `./scripts/podman/setup.sh` を実行します。
  </Step>

  <Step title="Gateway コンテナーを起動する">
    `./scripts/run-openclaw-podman.sh launch` でコンテナーを起動します。
  </Step>

  <Step title="コンテナー内でオンボーディングを実行する">
    `./scripts/run-openclaw-podman.sh launch setup` を実行し、その後 `http://127.0.0.1:18789/` を開きます。
  </Step>

  <Step title="ホスト CLI から実行中コンテナーを管理する">
    `OPENCLAW_CONTAINER=openclaw` を設定し、その後ホストから通常の `openclaw` コマンドを使います。
  </Step>
</Steps>

セットアップの詳細:

- `./scripts/podman/setup.sh` は、デフォルトでは rootless Podman ストアに `openclaw:local` をビルドします。`OPENCLAW_IMAGE` または `OPENCLAW_PODMAN_IMAGE` を設定している場合はそれを使います。
- `~/.openclaw/openclaw.json` が存在しない場合、`gateway.mode: "local"` を付けて作成します。
- `~/.openclaw/.env` が存在しない場合、`OPENCLAW_GATEWAY_TOKEN` を含めて作成します。
- 手動起動では、ヘルパーは `~/.openclaw/.env` から Podman 関連キーの小さな allowlist だけを読み取り、明示的なランタイム env 変数をコンテナーに渡します。env ファイル全体を Podman に渡すことはありません。

Quadlet 管理セットアップ:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet は systemd user service に依存するため Linux 専用のオプションです。

`OPENCLAW_PODMAN_QUADLET=1` を設定することもできます。

任意のビルド / セットアップ env 変数:

- `OPENCLAW_IMAGE` または `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local` をビルドせず、既存 / pull 済み image を使う
- `OPENCLAW_DOCKER_APT_PACKAGES` -- image ビルド中に追加の apt package をインストールする
- `OPENCLAW_EXTENSIONS` -- ビルド時に extension 依存関係を事前インストールする

コンテナー起動:

```bash
./scripts/run-openclaw-podman.sh launch
```

このスクリプトは、`--userns=keep-id` を使って現在の uid/gid でコンテナーを起動し、OpenClaw の state をコンテナー内に bind mount します。

オンボーディング:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

その後 `http://127.0.0.1:18789/` を開き、`~/.openclaw/.env` の token を使ってください。

ホスト CLI のデフォルト:

```bash
export OPENCLAW_CONTAINER=openclaw
```

その後、次のようなコマンドは自動的にそのコンテナー内で実行されます。

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # 追加の service スキャンを含む
openclaw doctor
openclaw channels login
```

macOS では、Podman machine によって browser が gateway からローカルに見えないことがあります。
起動後に Control UI が device-auth エラーを報告する場合は、
[Podman + Tailscale](#podman--tailscale) の Tailscale ガイダンスを使用してください。

<a id="podman--tailscale"></a>

## Podman + Tailscale

HTTPS またはリモート browser アクセスについては、メインの Tailscale ドキュメントに従ってください。

Podman 固有の注意:

- Podman の publish host は `127.0.0.1` のままにしてください。
- `openclaw gateway --tailscale serve` より、ホスト管理の `tailscale serve` を優先してください。
- macOS でローカル browser の device-auth コンテキストが不安定な場合は、その場しのぎのローカルトンネル回避策ではなく Tailscale アクセスを使ってください。

参照:

- [Tailscale](/gateway/tailscale)
- [Control UI](/web/control-ui)

## Systemd（Quadlet、任意）

`./scripts/podman/setup.sh --quadlet` を実行した場合、setup は次の場所に Quadlet ファイルをインストールします。

```bash
~/.config/containers/systemd/openclaw.container
```

便利なコマンド:

- **起動:** `systemctl --user start openclaw.service`
- **停止:** `systemctl --user stop openclaw.service`
- **状態:** `systemctl --user status openclaw.service`
- **ログ:** `journalctl --user -u openclaw.service -f`

Quadlet ファイルを編集した後:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH / ヘッドレスホストで起動時永続化が必要な場合は、現在のユーザーに lingering を有効にします。

```bash
sudo loginctl enable-linger "$(whoami)"
```

## 設定、env、ストレージ

- **設定ディレクトリ:** `~/.openclaw`
- **ワークスペースディレクトリ:** `~/.openclaw/workspace`
- **Token ファイル:** `~/.openclaw/.env`
- **起動ヘルパー:** `./scripts/run-openclaw-podman.sh`

起動スクリプトと Quadlet は、ホスト state をコンテナー内に bind mount します。

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

デフォルトでは、これらは無名コンテナー state ではなくホストディレクトリなので、
`openclaw.json`、エージェントごとの `auth-profiles.json`、channel / provider state、
sessions、および workspace はコンテナーを置き換えても保持されます。
Podman setup は、ローカル dashboard がコンテナーの非 loopback bind で動作するよう、公開された gateway port 上の `127.0.0.1` と `localhost` に対して `gateway.controlUi.allowedOrigins` も seed します。

手動ランチャーで便利な env 変数:

- `OPENCLAW_PODMAN_CONTAINER` -- コンテナー名（デフォルトは `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- 実行する image
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- コンテナー `18789` にマップされるホスト port
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- コンテナー `18790` にマップされるホスト port
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- 公開 port 用のホスト interface。デフォルトは `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- コンテナー内の gateway bind モード。デフォルトは `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id`（デフォルト）、`auto`、または `host`

手動ランチャーは、コンテナー / image のデフォルトを確定する前に `~/.openclaw/.env` を読み取るため、これらをそこに永続化できます。

デフォルト以外の `OPENCLAW_CONFIG_DIR` または `OPENCLAW_WORKSPACE_DIR` を使う場合は、`./scripts/podman/setup.sh` と後続の `./scripts/run-openclaw-podman.sh launch` の両方で同じ変数を設定してください。リポジトリローカルのランチャーは、カスタムパス上書きをシェル間で永続化しません。

Quadlet に関する注意:

- 生成される Quadlet service は、意図的に固定されたハードニング済みデフォルト形状を維持します: `127.0.0.1` の公開 port、コンテナー内での `--bind lan`、および `keep-id` user namespace。
- `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure`、`TimeoutStartSec=300` を固定します。
- `127.0.0.1:18789:18789`（gateway）と `127.0.0.1:18790:18790`（bridge）の両方を公開します。
- `OPENCLAW_GATEWAY_TOKEN` のような値のために、`~/.openclaw/.env` をランタイム `EnvironmentFile` として読み込みますが、手動ランチャーの Podman 固有上書き allowlist は消費しません。
- カスタム publish port、publish host、またはその他の container-run フラグが必要な場合は、手動ランチャーを使うか、`~/.config/containers/systemd/openclaw.container` を直接編集し、その後 service を reload / restart してください。

## 便利なコマンド

- **コンテナーログ:** `podman logs -f openclaw`
- **コンテナー停止:** `podman stop openclaw`
- **コンテナー削除:** `podman rm -f openclaw`
- **ホスト CLI から dashboard URL を開く:** `openclaw dashboard --no-open`
- **ホスト CLI 経由の health / status:** `openclaw gateway status --deep`（RPC probe + 追加の
  service スキャン）

## トラブルシューティング

- **設定または workspace で Permission denied（EACCES）:** コンテナーはデフォルトで `--userns=keep-id` と `--user <your uid>:<your gid>` で実行されます。ホストの config / workspace パスが現在のユーザー所有であることを確認してください。
- **Gateway 起動がブロックされる（`gateway.mode=local` がない）:** `~/.openclaw/openclaw.json` が存在し、`gateway.mode="local"` を設定していることを確認してください。`scripts/podman/setup.sh` は、存在しない場合これを作成します。
- **コンテナー CLI コマンドが誤ったターゲットに到達する:** `openclaw --container <name> ...` を明示的に使うか、シェルで `OPENCLAW_CONTAINER=<name>` を export してください。
- **`--container` 付きの `openclaw update` が失敗する:** 想定内です。image を rebuild / pull し、その後コンテナーまたは Quadlet service を再起動してください。
- **Quadlet service が起動しない:** `systemctl --user daemon-reload` を実行し、その後 `systemctl --user start openclaw.service` を実行してください。ヘッドレスシステムでは `sudo loginctl enable-linger "$(whoami)"` も必要になることがあります。
- **SELinux が bind mount をブロックする:** デフォルトの mount 動作はそのままにしてください。SELinux が enforcing または permissive のとき、ランチャーは Linux で自動的に `:Z` を追加します。

## 関連

- [Docker](/install/docker)
- [Gateway background process](/gateway/background-process)
- [Gateway troubleshooting](/gateway/troubleshooting)
