---
read_when:
    - 「はじめに」のクイックスタート以外のインストール方法が必要です
    - クラウドプラットフォームにデプロイしたい場合
    - 更新、移行、またはアンインストールを行う必要がある場合
summary: OpenClawをインストール — インストーラースクリプト、npm/pnpm/bun、ソースから、Docker、その他
title: インストール
x-i18n:
    generated_at: "2026-04-20T04:46:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0a5fdbbf13dcaf2fed6840f35aa22b2e9e458509509f98303c8d87c2556a6f
    source_path: install/index.md
    workflow: 15
---

# インストール

## 推奨: インストーラースクリプト

最も速くインストールする方法です。OSを検出し、必要に応じてNodeをインストールし、OpenClawをインストールして、オンボーディングを開始します。

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

すべてのフラグとCI/自動化オプションについては、[インストーラーの内部](/ja-JP/install/installer)を参照してください。

## システム要件

- **Node 24**（推奨）またはNode 22.14+ — インストーラースクリプトがこれを自動的に処理します
- **macOS、Linux、またはWindows** — ネイティブWindowsとWSL2の両方をサポートしています。WSL2のほうがより安定しています。[Windows](/ja-JP/platforms/windows)を参照してください。
- ソースからビルドする場合にのみ`pnpm`が必要です

## 代替のインストール方法

### ローカルプレフィックスインストーラー（`install-cli.sh`）

システム全体のNodeインストールに依存せず、`~/.openclaw`のようなローカルプレフィックス配下にOpenClawとNodeを保持したい場合に使用します:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

デフォルトでnpmインストールをサポートし、同じプレフィックスフロー内でgitチェックアウトからのインストールにも対応しています。完全なリファレンス: [インストーラーの内部](/ja-JP/install/installer#install-clish)。

### npm、pnpm、またはbun

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
    pnpmでは、ビルドスクリプトを含むパッケージに対して明示的な承認が必要です。最初のインストール後に`pnpm approve-builds -g`を実行してください。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    BunはグローバルCLIインストール経路でサポートされています。Gatewayランタイムについては、引き続きNodeが推奨のデーモンランタイムです。
    </Note>

  </Tab>
</Tabs>

<Accordion title="トラブルシューティング: sharpのビルドエラー（npm）">
  グローバルにインストールされたlibvipsが原因で`sharp`が失敗する場合:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### ソースから

コントリビューターや、ローカルのチェックアウトから実行したい人向け:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

または、linkをスキップして、リポジトリ内で`pnpm openclaw ...`を使用してください。完全な開発ワークフローについては、[セットアップ](/ja-JP/start/setup)を参照してください。

### GitHub mainからインストール

```bash
npm install -g github:openclaw/openclaw#main
```

### コンテナとパッケージマネージャー

<CardGroup cols={2}>
  <Card title="Docker" href="/ja-JP/install/docker" icon="container">
    コンテナ化またはヘッドレスデプロイ。
  </Card>
  <Card title="Podman" href="/ja-JP/install/podman" icon="container">
    Dockerのrootlessなコンテナ代替手段。
  </Card>
  <Card title="Nix" href="/ja-JP/install/nix" icon="snowflake">
    Nix flakeによる宣言的インストール。
  </Card>
  <Card title="Ansible" href="/ja-JP/install/ansible" icon="server">
    自動化されたフリートプロビジョニング。
  </Card>
  <Card title="Bun" href="/ja-JP/install/bun" icon="zap">
    Bunランタイム経由のCLI専用利用。
  </Card>
</CardGroup>

## インストールを確認する

```bash
openclaw --version      # CLIが利用可能であることを確認
openclaw doctor         # 設定の問題を確認
openclaw gateway status # Gatewayが実行中であることを確認
```

インストール後に管理された起動を使用したい場合:

- macOS: `openclaw onboard --install-daemon`または`openclaw gateway install`によるLaunchAgent
- Linux/WSL2: 同じコマンドによるsystemdユーザーサービス
- ネイティブWindows: まずScheduled Task、タスク作成が拒否された場合はユーザーごとのStartupフォルダーのログイン項目にフォールバック

## ホスティングとデプロイ

クラウドサーバーまたはVPSにOpenClawをデプロイします:

<CardGroup cols={3}>
  <Card title="VPS" href="/ja-JP/vps">任意のLinux VPS</Card>
  <Card title="Docker VM" href="/ja-JP/install/docker-vm-runtime">共通のDocker手順</Card>
  <Card title="Kubernetes" href="/ja-JP/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/ja-JP/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/ja-JP/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/ja-JP/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/ja-JP/install/azure">Azure</Card>
  <Card title="Railway" href="/ja-JP/install/railway">Railway</Card>
  <Card title="Render" href="/ja-JP/install/render">Render</Card>
  <Card title="Northflank" href="/ja-JP/install/northflank">Northflank</Card>
</CardGroup>

## 更新、移行、またはアンインストール

<CardGroup cols={3}>
  <Card title="更新" href="/ja-JP/install/updating" icon="refresh-cw">
    OpenClawを最新の状態に保ちます。
  </Card>
  <Card title="移行" href="/ja-JP/install/migrating" icon="arrow-right">
    新しいマシンに移動します。
  </Card>
  <Card title="アンインストール" href="/ja-JP/install/uninstall" icon="trash-2">
    OpenClawを完全に削除します。
  </Card>
</CardGroup>

## トラブルシューティング: `openclaw`が見つからない

インストールは成功したのに、ターミナルで`openclaw`が見つからない場合:

```bash
node -v           # Nodeはインストール済みですか？
npm prefix -g     # グローバルパッケージはどこにありますか？
echo "$PATH"      # グローバルbinディレクトリはPATHに含まれていますか？
```

`$(npm prefix -g)/bin`が`$PATH`に含まれていない場合は、シェルの起動ファイル（`~/.zshrc`または`~/.bashrc`）に追加してください:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

その後、新しいターミナルを開いてください。詳細は[Nodeセットアップ](/ja-JP/install/node)を参照してください。
