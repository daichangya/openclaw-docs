---
read_when:
    - macOS開発環境をセットアップする場合
summary: OpenClaw macOSアプリを開発する開発者向けセットアップガイド
title: macOS開発セットアップ
x-i18n:
    generated_at: "2026-04-05T12:50:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd13f17391bdd87ef59e4c575e5da3312c4066de00905731263bff655a5db357
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# macOS開発者セットアップ

このガイドでは、OpenClaw macOSアプリケーションをソースからビルドして実行するために必要な手順を説明します。

## 前提条件

アプリをビルドする前に、次のものがインストールされていることを確認してください:

1. **Xcode 26.2+**: Swift開発に必要です。
2. **Node.js 24 & pnpm**: gateway、CLI、およびパッケージングスクリプトに推奨されます。互換性のため、現在`22.14+`のNode 22 LTSも引き続きサポートされています。

## 1. 依存関係をインストールする

プロジェクト全体の依存関係をインストールします:

```bash
pnpm install
```

## 2. アプリをビルドしてパッケージ化する

macOSアプリをビルドし、それを`dist/OpenClaw.app`にパッケージ化するには、次を実行します:

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID証明書がない場合、このスクリプトは自動的に**ad-hoc signing**（`-`）を使用します。

開発実行モード、署名フラグ、Team IDのトラブルシューティングについては、macOSアプリのREADMEを参照してください:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注**: ad-hoc署名されたアプリではセキュリティプロンプトが表示されることがあります。アプリが即座に「Abort trap 6」でクラッシュする場合は、[トラブルシューティング](#troubleshooting)セクションを参照してください。

## 3. CLIをインストールする

macOSアプリは、バックグラウンドタスクを管理するためにグローバルな`openclaw` CLIインストールを前提としています。

**インストールするには（推奨）:**

1. OpenClawアプリを開きます。
2. **General**設定タブへ移動します。
3. **「Install CLI」**をクリックします。

または、手動でインストールします:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>`と`bun add -g openclaw@<version>`も使用できます。
Gatewayランタイムには、引き続きNodeを推奨します。

## トラブルシューティング

### ビルド失敗: toolchainまたはSDKの不一致

macOSアプリのビルドには、最新のmacOS SDKとSwift 6.2 toolchainが必要です。

**システム依存関係（必須）:**

- **Software Updateで利用可能な最新のmacOSバージョン**（Xcode 26.2 SDKに必要）
- **Xcode 26.2**（Swift 6.2 toolchain）

**確認:**

```bash
xcodebuild -version
xcrun swift --version
```

バージョンが一致しない場合は、macOS/Xcodeを更新してから再度ビルドを実行してください。

### 権限付与時にアプリがクラッシュする

**Speech Recognition**または**Microphone**へのアクセスを許可しようとしたときにアプリがクラッシュする場合、破損したTCCキャッシュまたは署名不一致が原因である可能性があります。

**修正:**

1. TCC権限をリセットします:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. それでも解決しない場合は、macOSに「クリーンな初期状態」を強制するために、[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)の`BUNDLE_ID`を一時的に変更してください。

### Gatewayが「Starting...」のままになる

gatewayステータスが「Starting...」のままの場合、ゾンビプロセスがポートを保持していないか確認してください:

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgentを使っていない場合（開発モード / 手動実行）は、listenerを見つける:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

手動実行がポートを保持している場合は、そのプロセスを停止してください（Ctrl+C）。最後の手段として、上で見つけたPIDをkillしてください。
