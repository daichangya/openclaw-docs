---
read_when:
    - 再現可能でロールバック可能なインストールが必要
    - すでに Nix / NixOS / Home Manager を使っている
    - すべてを固定して宣言的に管理したい
summary: Nix を使って OpenClaw を宣言的にインストールする
title: Nix
x-i18n:
    generated_at: "2026-04-05T12:48:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e1e73533db1350d82d3a786092b4328121a082dfeeedee7c7574021dada546
    source_path: install/nix.md
    workflow: 15
---

# Nix インストール

**[nix-openclaw](https://github.com/openclaw/nix-openclaw)** を使って OpenClaw を宣言的にインストールします。これは、必要なものがひととおり揃った Home Manager モジュールです。

<Info>
Nix インストールの正本は [nix-openclaw](https://github.com/openclaw/nix-openclaw) リポジトリです。このページは簡単な概要です。
</Info>

## 得られるもの

- Gateway + macOS app + tools（whisper、spotify、cameras）-- すべて固定済み
- 再起動後も維持される launchd service
- 宣言的設定を備えたプラグインシステム
- 即時ロールバック: `home-manager switch --rollback`

## クイックスタート

<Steps>
  <Step title="Determinate Nix をインストールする">
    まだ Nix をインストールしていない場合は、[Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer) の手順に従ってください。
  </Step>
  <Step title="ローカル flake を作成する">
    nix-openclaw リポジトリの agent-first テンプレートを使用します:
    ```bash
    mkdir -p ~/code/openclaw-local
    # nix-openclaw リポジトリから templates/agent-first/flake.nix をコピー
    ```
  </Step>
  <Step title="シークレットを設定する">
    メッセージング bot token とモデルプロバイダー API キーを設定します。`~/.secrets/` のプレーンファイルで問題ありません。
  </Step>
  <Step title="テンプレートのプレースホルダーを埋めて switch する">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="確認する">
    launchd service が動作していて、ボットがメッセージに応答することを確認します。
  </Step>
</Steps>

完全なモジュールオプションと例については、[nix-openclaw README](https://github.com/openclaw/nix-openclaw) を参照してください。

## Nix モードのランタイム動作

`OPENCLAW_NIX_MODE=1` が設定されると（nix-openclaw では自動）、OpenClaw は自動インストールフローを無効にする決定論的モードに入ります。

手動で設定することもできます:

```bash
export OPENCLAW_NIX_MODE=1
```

macOS では、GUI app はシェル環境変数を自動では継承しません。代わりに defaults 経由で Nix モードを有効にしてください:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix モードで変わること

- 自動インストールと自己変更フローが無効になる
- 依存関係不足では Nix 固有の修復メッセージが表示される
- UI に読み取り専用の Nix モードバナーが表示される

### 設定パスと state パス

OpenClaw は JSON5 設定を `OPENCLAW_CONFIG_PATH` から読み取り、可変データを `OPENCLAW_STATE_DIR` に保存します。Nix 配下で実行する場合は、ランタイム state と設定が不変ストアの外に留まるよう、これらを Nix 管理下の場所に明示的に設定してください。

| Variable               | Default                                 |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

## 関連

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- 完全なセットアップガイド
- [ウィザード](/ja-JP/start/wizard) -- Nix を使わない CLI セットアップ
- [Docker](/install/docker) -- コンテナー化されたセットアップ
