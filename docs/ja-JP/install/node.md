---
read_when:
    - OpenClaw をインストールする前に Node.js をインストールする必要がある場合
    - OpenClaw はインストールしたが `openclaw` で command not found になる場合
    - 権限や PATH の問題で `npm install -g` が失敗する場合
summary: OpenClaw 向けに Node.js をインストールして設定する方法 — バージョン要件、インストール方法、PATH のトラブルシューティング
title: Node.js
x-i18n:
    generated_at: "2026-04-05T12:48:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e880f6132359dba8720638669df2d71cf857d516cbf5df2589ffeed269b5120
    source_path: install/node.md
    workflow: 15
---

# Node.js

OpenClaw には **Node 22.14 以降** が必要です。**Node 24 がデフォルトであり、推奨される実行時環境** です。インストール、CI、リリースワークフローでは Node 24 を推奨します。Node 22 もアクティブな LTS 系列として引き続きサポートされます。[インストーラースクリプト](/install#alternative-install-methods) は Node を自動検出してインストールします。このページは、Node を自分でセットアップし、すべてが正しく構成されていること（バージョン、PATH、グローバルインストール）を確認したい場合のためのものです。

## バージョンを確認する

```bash
node -v
```

これが `v24.x.x` 以降を表示する場合、推奨されるデフォルト環境です。`v22.14.x` 以降を表示する場合、サポート対象の Node 22 LTS 環境ですが、可能なときに Node 24 へアップグレードすることを推奨します。Node がインストールされていない、またはバージョンが古すぎる場合は、以下のインストール方法を選んでください。

## Node をインストールする

<Tabs>
  <Tab title="macOS">
    **Homebrew**（推奨）:

    ```bash
    brew install node
    ```

    または [nodejs.org](https://nodejs.org/) から macOS インストーラーをダウンロードしてください。

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    またはバージョンマネージャーを使用してください（下記参照）。

  </Tab>
  <Tab title="Windows">
    **winget**（推奨）:

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    または [nodejs.org](https://nodejs.org/) から Windows インストーラーをダウンロードしてください。

  </Tab>
</Tabs>

<Accordion title="バージョンマネージャーを使う（nvm、fnm、mise、asdf）">
  バージョンマネージャーを使うと、Node のバージョンを簡単に切り替えられます。代表的な選択肢:

- [**fnm**](https://github.com/Schniz/fnm) — 高速でクロスプラットフォーム
- [**nvm**](https://github.com/nvm-sh/nvm) — macOS/Linux で広く使われている
- [**mise**](https://mise.jdx.dev/) — polyglot（Node、Python、Ruby など）

fnm の例:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  バージョンマネージャーがシェルの起動ファイル（`~/.zshrc` または `~/.bashrc`）で初期化されていることを確認してください。そうでないと、新しいターミナルセッションで PATH に Node の bin ディレクトリーが含まれず、`openclaw` が見つからないことがあります。
  </Warning>
</Accordion>

## トラブルシューティング

### `openclaw: command not found`

これはほぼ常に、npm のグローバル bin ディレクトリーが PATH に入っていないことを意味します。

<Steps>
  <Step title="グローバル npm prefix を確認する">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="それが PATH にあるか確認する">
    ```bash
    echo "$PATH"
    ```

    出力の中に `<npm-prefix>/bin`（macOS/Linux）または `<npm-prefix>`（Windows）があるか確認してください。

  </Step>
  <Step title="シェルの起動ファイルに追加する">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` または `~/.bashrc` に追加します:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        その後、新しいターミナルを開いてください（または zsh では `rehash`、bash では `hash -r` を実行します）。
      </Tab>
      <Tab title="Windows">
        `npm prefix -g` の出力を、Settings → System → Environment Variables からシステム PATH に追加してください。
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` で権限エラーが出る場合（Linux）

`EACCES` エラーが表示される場合は、npm のグローバル prefix をユーザーが書き込み可能なディレクトリーに切り替えてください:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

永続化するために、`export PATH=...` の行を `~/.bashrc` または `~/.zshrc` に追加してください。

## 関連

- [Install Overview](/install) — すべてのインストール方法
- [Updating](/install/updating) — OpenClaw を最新の状態に保つ
- [はじめに](/ja-JP/start/getting-started) — インストール後の最初の手順
