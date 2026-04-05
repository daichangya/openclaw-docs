---
read_when:
    - 何もない状態から初めてセットアップするとき
    - 動くチャットまで最短でたどり着きたいとき
summary: OpenClaw をインストールして、数分で最初のチャットを始めましょう。
title: はじめに
x-i18n:
    generated_at: "2026-04-05T12:57:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c43eee6f0d3f593e3cf0767bfacb3e0ae38f51a2615d594303786ae1d4a6d2c3
    source_path: start/getting-started.md
    workflow: 15
---

# はじめに

OpenClaw をインストールし、オンボーディングを実行して、AI アシスタントとチャットしましょう。所要時間はおよそ 5 分です。完了時には、稼働中の Gateway、設定済みの認証情報、そして動作するチャットセッションが手に入ります。

## 必要なもの

- **Node.js** — Node 24 推奨（Node 22.14+ もサポート）
- **モデルプロバイダーの API キー**（Anthropic、OpenAI、Google など）— オンボーディング中に入力を求められます

<Tip>
`node --version` で Node のバージョンを確認してください。
**Windows ユーザー:** ネイティブ Windows と WSL2 の両方に対応しています。フル機能を使うには WSL2 のほうが安定しており、推奨です。[Windows](/ja-JP/platforms/windows) を参照してください。
Node のインストールが必要ですか？ [Node setup](/ja-JP/install/node) を参照してください。
</Tip>

## クイックセットアップ

<Steps>
  <Step title="OpenClaw をインストール">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="インストールスクリプトの処理"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    ほかのインストール方法（Docker、Nix、npm）: [インストール](/ja-JP/install)。
    </Note>

  </Step>
  <Step title="オンボーディングを実行">
    ```bash
    openclaw onboard --install-daemon
    ```

    このウィザードでは、モデルプロバイダーの選択、API キーの設定、Gateway の構成を順に進めます。所要時間はおよそ 2 分です。

    完全なリファレンスは [オンボーディング（CLI）](/ja-JP/start/wizard) を参照してください。

  </Step>
  <Step title="Gateway が動作していることを確認">
    ```bash
    openclaw gateway status
    ```

    Gateway がポート 18789 で待ち受けていることが表示されるはずです。

  </Step>
  <Step title="ダッシュボードを開く">
    ```bash
    openclaw dashboard
    ```

    これによりブラウザーでコントロール UI が開きます。読み込まれれば、すべて正常に動作しています。

  </Step>
  <Step title="最初のメッセージを送る">
    コントロール UI のチャットにメッセージを入力すると、AI の返信が返ってくるはずです。

    代わりにスマートフォンからチャットしたいですか？ 最もすばやく設定できるチャンネルは [Telegram](/ja-JP/channels/telegram) です（必要なのは bot token だけです）。すべての選択肢は [チャンネル](/ja-JP/channels) を参照してください。

  </Step>
</Steps>

<Accordion title="高度な設定: カスタムのコントロール UI ビルドをマウントする">
  ローカライズ版またはカスタマイズ版のダッシュボードビルドを管理している場合は、
  ビルド済みの静的アセットと `index.html` を含むディレクトリーを
  `gateway.controlUi.root` に指定してください。

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# そのディレクトリーにビルド済みの静的ファイルをコピーします。
```

次に、以下を設定します。

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Gateway を再起動して、ダッシュボードを再度開きます。

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 次にやること

<Columns>
  <Card title="チャンネルを接続" href="/ja-JP/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo など。
  </Card>
  <Card title="ペアリングと安全性" href="/ja-JP/channels/pairing" icon="shield">
    だれがあなたのエージェントにメッセージを送れるかを制御します。
  </Card>
  <Card title="Gateway を設定" href="/ja-JP/gateway/configuration" icon="settings">
    モデル、ツール、sandbox、高度な設定。
  </Card>
  <Card title="ツールを見る" href="/tools" icon="wrench">
    Browser、exec、web search、Skills、plugins。
  </Card>
</Columns>

<Accordion title="高度な設定: 環境変数">
  OpenClaw をサービスアカウントとして実行する場合や、カスタムパスを使いたい場合:

- `OPENCLAW_HOME` — 内部パス解決用のホームディレクトリー
- `OPENCLAW_STATE_DIR` — state ディレクトリーを上書き
- `OPENCLAW_CONFIG_PATH` — config ファイルのパスを上書き

完全なリファレンス: [環境変数](/ja-JP/help/environment)。
</Accordion>
