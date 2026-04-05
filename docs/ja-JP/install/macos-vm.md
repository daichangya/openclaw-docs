---
read_when:
    - 普段使いの macOS 環境から OpenClaw を分離したい場合
    - サンドボックス内で iMessage 統合（BlueBubbles）が必要な場合
    - 複製可能でリセットしやすい macOS 環境が欲しい場合
    - ローカルとホスト型の macOS VM オプションを比較したい場合
summary: 分離や iMessage が必要なときに、サンドボックス化された macOS VM（ローカルまたはホスト型）で OpenClaw を実行する
title: macOS VMs
x-i18n:
    generated_at: "2026-04-05T12:48:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1f7c5691fd2686418ee25f2c38b1f9badd511daeef2906d21ad30fb523b013f
    source_path: install/macos-vm.md
    workflow: 15
---

# macOS VM 上の OpenClaw（サンドボックス化）

## 推奨されるデフォルト（ほとんどのユーザー向け）

- **小規模な Linux VPS** を、常時稼働の Gateway と低コストのために使用します。[VPS hosting](/vps) を参照してください。
- **専用ハードウェア**（Mac mini または Linux マシン）を使うと、完全な制御と、ブラウザー自動化向けの **住宅用 IP** を得られます。多くのサイトはデータセンター IP をブロックするため、ローカルブラウジングのほうがうまくいくことが多いです。
- **ハイブリッド:** Gateway は安価な VPS 上に置き、ブラウザー / UI 自動化が必要なときだけ Mac を **node** として接続します。[Nodes](/nodes) と [Gateway remote](/gateway/remote) を参照してください。

macOS VM は、macOS 専用機能（iMessage / BlueBubbles）が必要な場合、または普段使いの Mac から厳密に分離したい場合に使用してください。

## macOS VM の選択肢

### Apple Silicon Mac 上のローカル VM（Lume）

既存の Apple Silicon Mac 上で、[Lume](https://cua.ai/docs/lume) を使ってサンドボックス化された macOS VM 内で OpenClaw を実行します。

これにより、次が得られます:

- 分離された完全な macOS 環境（ホスト環境を汚さない）
- BlueBubbles 経由の iMessage サポート（Linux / Windows では不可能）
- VM を複製するだけで即座にリセット可能
- 追加のハードウェアやクラウド費用が不要

### ホスト型 Mac プロバイダー（クラウド）

クラウド上の macOS が欲しい場合は、ホスト型 Mac プロバイダーも利用できます:

- [MacStadium](https://www.macstadium.com/)（ホスト型 Mac）
- その他のホスト型 Mac ベンダーでも動作します。各社の VM + SSH ドキュメントに従ってください

macOS VM への SSH アクセスができたら、以下の手順 6 に進んでください。

---

## クイックパス（Lume、経験者向け）

1. Lume をインストールする
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant を完了し、Remote Login（SSH）を有効にする
4. `lume run openclaw --no-display`
5. SSH 接続し、OpenClaw をインストールしてチャネルを設定する
6. 完了

---

## 必要なもの（Lume）

- Apple Silicon Mac（M1 / M2 / M3 / M4）
- ホスト側で macOS Sequoia 以降
- VM ごとに約 60 GB の空きディスク容量
- 約 20 分

---

## 1) Lume をインストールする

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

`~/.local/bin` が PATH に入っていない場合:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

確認:

```bash
lume --version
```

ドキュメント: [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) macOS VM を作成する

```bash
lume create openclaw --os macos --ipsw latest
```

これにより macOS がダウンロードされ、VM が作成されます。VNC ウィンドウが自動で開きます。

注: ダウンロードには、接続状況によってしばらく時間がかかることがあります。

---

## 3) Setup Assistant を完了する

VNC ウィンドウで次を行います:

1. 言語と地域を選択する
2. Apple ID はスキップする（後で iMessage が必要ならサインインしてもよい）
3. ユーザーアカウントを作成する（ユーザー名とパスワードを覚えておいてください）
4. すべての任意機能をスキップする

セットアップ完了後、SSH を有効にします:

1. System Settings → General → Sharing を開く
2. 「Remote Login」を有効にする

---

## 4) VM の IP アドレスを取得する

```bash
lume get openclaw
```

IP アドレス（通常は `192.168.64.x`）を確認します。

---

## 5) VM に SSH 接続する

```bash
ssh youruser@192.168.64.X
```

`youruser` は作成したアカウントに、IP は VM の IP に置き換えてください。

---

## 6) OpenClaw をインストールする

VM 内で次を実行します:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

オンボーディングのプロンプトに従って、モデルプロバイダー（Anthropic、OpenAI など）を設定します。

---

## 7) チャネルを設定する

config ファイルを編集します:

```bash
nano ~/.openclaw/openclaw.json
```

チャネルを追加します:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

次に WhatsApp にログインします（QR をスキャン）:

```bash
openclaw channels login
```

---

## 8) VM をヘッドレスで実行する

VM を停止し、画面なしで再起動します:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM はバックグラウンドで動作します。OpenClaw の daemon が gateway を動かし続けます。

状態確認:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## おまけ: iMessage 統合

これは macOS 上で実行する最大の利点です。[BlueBubbles](https://bluebubbles.app) を使って OpenClaw に iMessage を追加します。

VM 内で:

1. bluebubbles.app から BlueBubbles をダウンロードする
2. Apple ID でサインインする
3. Web API を有効にし、パスワードを設定する
4. BlueBubbles の webhook を gateway に向ける（例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）

OpenClaw の config に追加します:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

gateway を再起動します。これでエージェントが iMessage を送受信できるようになります。

完全な設定手順: [BlueBubbles channel](/ja-JP/channels/bluebubbles)

---

## ゴールデンイメージを保存する

さらにカスタマイズする前に、クリーンな状態をスナップショットしておきます:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

いつでもリセットできます:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24 時間 365 日実行する

VM を動かし続けるには:

- Mac を電源接続したままにする
- System Settings → Energy Saver でスリープを無効にする
- 必要に応じて `caffeinate` を使う

本当に常時稼働させるなら、専用の Mac mini または小規模 VPS を検討してください。[VPS hosting](/vps) を参照してください。

---

## トラブルシューティング

| Problem                  | Solution                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| VM に SSH 接続できない        | VM の System Settings で「Remote Login」が有効になっているか確認する                            |
| VM の IP が表示されない        | VM が完全に起動するまで待ち、再度 `lume get openclaw` を実行する                           |
| `lume` コマンドが見つからない   | `~/.local/bin` を PATH に追加する                                                    |
| WhatsApp の QR を読み取れない | `openclaw channels login` を実行しているのがホストではなく VM 内であることを確認する |

---

## 関連ドキュメント

- [VPS hosting](/vps)
- [Nodes](/nodes)
- [Gateway remote](/gateway/remote)
- [BlueBubbles channel](/ja-JP/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)（上級者向け）
- [Docker Sandboxing](/install/docker)（別の分離アプローチ）
