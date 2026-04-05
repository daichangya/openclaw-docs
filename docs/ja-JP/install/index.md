---
read_when:
    - はじめにのクイックスタート以外のインストール方法が必要な場合
    - クラウドプラットフォームにデプロイしたい場合
    - 更新、移行、またはアンインストールが必要な場合
summary: OpenClawのインストール — インストーラースクリプト、npm/pnpm/bun、ソースから、Dockerなど
title: インストール
x-i18n:
    generated_at: "2026-04-05T12:48:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: eca17c76a2a66166b3d8cda9dc3144ab920d30ad0ed2a220eb9389d7a383ba5d
    source_path: install/index.md
    workflow: 15
---

# インストール

## 推奨: インストーラースクリプト

最も速いインストール方法です。OSを検出し、必要に応じてNodeをインストールし、OpenClawをインストールして、オンボーディングを開始します。

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

オンボーディングを実行せずにインストールするには:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

すべてのフラグとCI/自動化オプションについては、[Installer internals](/install/installer) を参照してください。

## システム要件

- **Node 24**（推奨）または Node 22.14+ — インストーラースクリプトがこれを自動で処理します
- **macOS、Linux、またはWindows** — ネイティブWindowsとWSL2の両方をサポートしています。WSL2のほうがより安定しています。[Windows](/platforms/windows) を参照してください。
- `pnpm` はソースからビルドする場合にのみ必要です

## 別のインストール方法

### ローカルプレフィックスインストーラー（`install-cli.sh`）

システム全体のNodeインストールに依存せず、
`~/.openclaw` のようなローカルプレフィックス配下にOpenClawとNodeを保持したい場合に使用します:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

デフォルトでnpmインストールをサポートし、同じ
プレフィックスフローでgit checkoutインストールにも対応しています。完全なリファレンス: [Installer internals](/install/installer#install-clish)。

### npm、pnpm、または bun

すでに自分でNodeを管理している場合:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpmでは、ビルドスクリプトを持つパッケージに明示的な承認が必要です。最初のインストール後に `pnpm approve-builds -g` を実行してください。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    BunはグローバルCLIインストール経路でサポートされています。Gatewayランタイムについては、引き続きNodeが推奨デーモンランタイムです。
    </Note>

  </Tab>
</Tabs>

<Accordion title="トラブルシューティング: sharp のビルドエラー（npm）">
  グローバルにインストールされたlibvipsが原因で `sharp` が失敗する場合:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### ソースから

コントリビューターや、ローカルcheckoutから実行したい人向け:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

または、linkをスキップしてリポジトリ内から `pnpm openclaw ...` を使用することもできます。完全な開発ワークフローについては [Setup](/start/setup) を参照してください。

### GitHub main からインストール

```bash
npm install -g github:openclaw/openclaw#main
```

### コンテナとパッケージマネージャー

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    コンテナ化またはヘッドレスのデプロイ。
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Dockerのrootlessコンテナ代替。
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Nix flakeによる宣言的インストール。
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    自動化されたフリートプロビジョニング。
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    BunランタイムによるCLI専用利用。
  </Card>
</CardGroup>

## インストールを確認する

```bash
openclaw --version      # CLIが利用可能であることを確認
openclaw doctor         # 設定の問題を確認
openclaw gateway status # Gatewayが動作していることを確認
```

インストール後に管理された起動を使いたい場合:

- macOS: `openclaw onboard --install-daemon` または `openclaw gateway install` によるLaunchAgent
- Linux/WSL2: 同じコマンドによるsystemd user service
- ネイティブWindows: まずScheduled Task、タスク作成が拒否された場合はユーザーごとのStartup-folderログイン項目へフォールバック

## ホスティングとデプロイ

クラウドサーバーまたはVPSにOpenClawをデプロイします:

<CardGroup cols={3}>
  <Card title="VPS" href="/vps">任意のLinux VPS</Card>
  <Card title="Docker VM" href="/install/docker-vm-runtime">共通のDocker手順</Card>
  <Card title="Kubernetes" href="/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/install/azure">Azure</Card>
  <Card title="Railway" href="/install/railway">Railway</Card>
  <Card title="Render" href="/install/render">Render</Card>
  <Card title="Northflank" href="/install/northflank">Northflank</Card>
</CardGroup>

## 更新、移行、またはアンインストール

<CardGroup cols={3}>
  <Card title="Updating" href="/install/updating" icon="refresh-cw">
    OpenClawを最新に保ちます。
  </Card>
  <Card title="Migrating" href="/install/migrating" icon="arrow-right">
    新しいマシンへ移行します。
  </Card>
  <Card title="Uninstall" href="/install/uninstall" icon="trash-2">
    OpenClawを完全に削除します。
  </Card>
</CardGroup>

## トラブルシューティング: `openclaw` が見つからない

インストールは成功したのに、ターミナルで `openclaw` が見つからない場合:

```bash
node -v           # Nodeはインストール済み?
npm prefix -g     # グローバルパッケージはどこにある?
echo "$PATH"      # グローバルbinディレクトリはPATHに入っている?
```

`$(npm prefix -g)/bin` が `$PATH` にない場合は、シェル起動ファイル（`~/.zshrc` または `~/.bashrc`）に追加してください:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

その後、新しいターミナルを開いてください。詳細は [Node setup](/install/node) を参照してください。
