---
read_when:
    - OpenClawをWeChatまたはWeixinに接続したい場合
    - '`openclaw-weixin`チャンネルPluginをインストールまたはトラブルシューティングしています'
    - 外部チャンネルPluginがGatewayと並行してどのように動作するかを理解する必要があります
summary: 外部のopenclaw-weixin PluginによるWeChatチャンネルのセットアップ
title: WeChat
x-i18n:
    generated_at: "2026-04-19T01:11:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae669f2b6300e0c2b1d1dc57743a0a2ab0c05b9e277ec2ac640a03e6e7ab3b84
    source_path: channels/wechat.md
    workflow: 15
---

# WeChat

OpenClawはTencentの外部`@tencent-weixin/openclaw-weixin`チャンネルPluginを通じてWeChatに接続します。

ステータス: 外部Plugin。ダイレクトチャットとメディアに対応しています。グループチャットは、現在のPlugin capability metadataではサポート対象として案内されていません。

## 命名

- **WeChat** は、このドキュメントで使うユーザー向けの名称です。
- **Weixin** は、TencentのパッケージおよびPlugin idで使われる名称です。
- `openclaw-weixin` はOpenClawのchannel idです。
- `@tencent-weixin/openclaw-weixin` はnpm packageです。

CLIコマンドとconfig pathでは`openclaw-weixin`を使用します。

## 仕組み

WeChatのコードはOpenClaw core repoには存在しません。OpenClawは汎用的なchannel plugin contractを提供し、外部PluginはWeChat固有のruntimeを提供します。

1. `openclaw plugins install` が`@tencent-weixin/openclaw-weixin`をインストールします。
2. GatewayがPlugin manifestを検出し、Plugin entrypointを読み込みます。
3. Pluginがchannel id `openclaw-weixin`を登録します。
4. `openclaw channels login --channel openclaw-weixin` がQRログインを開始します。
5. Pluginはアカウント認証情報をOpenClawのstate directory配下に保存します。
6. Gatewayが起動すると、Pluginは設定済みの各アカウントに対してWeixin monitorを開始します。
7. 受信したWeChatメッセージはchannel contractを通じて正規化され、選択されたOpenClaw agentにルーティングされ、Pluginのoutbound pathを通じて返信されます。

この分離は重要です。OpenClaw coreはチャンネル非依存のままであるべきです。WeChatログイン、Tencent iLink API呼び出し、メディアのアップロード/ダウンロード、context token、アカウント監視は外部Pluginが担います。

## インストール

クイックインストール:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

手動インストール:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

インストール後にGatewayを再起動します。

```bash
openclaw gateway restart
```

## ログイン

Gatewayを実行しているのと同じマシンでQRログインを実行します。

```bash
openclaw channels login --channel openclaw-weixin
```

スマートフォンのWeChatでQRコードをスキャンし、ログインを確認します。スキャンが成功すると、Pluginはアカウントトークンをローカルに保存します。

別のWeChatアカウントを追加するには、同じログインコマンドをもう一度実行します。複数アカウントを使う場合は、アカウント、チャンネル、送信者ごとにダイレクトメッセージセッションを分離してください。

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## アクセス制御

ダイレクトメッセージでは、channel plugins向けの通常のOpenClaw pairingおよびallowlist modelが使われます。

新しい送信者を承認するには:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

アクセス制御モデル全体については、[Pairing](/ja-JP/channels/pairing)を参照してください。

## 互換性

Pluginは起動時にホストのOpenClaw versionを確認します。

| Plugin line | OpenClaw version        | npm tag  |
| ----------- | ----------------------- | -------- |
| `2.x`       | `>=2026.3.22`           | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22` | `legacy` |

PluginからOpenClaw versionが古すぎると報告された場合は、OpenClawを更新するか、legacy Plugin lineをインストールしてください。

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## サイドカープロセス

WeChat Pluginは、Tencent iLink APIを監視している間、Gatewayの横で補助処理を実行できます。issue #68451では、この補助経路によってOpenClawの汎用的なstale-Gateway cleanupにある不具合が露出しました。子プロセスが親Gatewayプロセスのクリーンアップを試み、systemdのようなprocess managerの下で再起動ループを引き起こす可能性がありました。

現在のOpenClaw startup cleanupは現在のプロセスとその祖先プロセスを除外するため、チャンネルヘルパーがそれを起動したGatewayをkillしてはなりません。この修正は汎用的なものであり、core内のWeChat固有の経路ではありません。

## トラブルシューティング

インストール状況とステータスを確認します。

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

チャンネルがインストール済みと表示されても接続しない場合は、Pluginが有効になっていることを確認し、再起動してください。

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

WeChatを有効にした後でGatewayが繰り返し再起動する場合は、OpenClawとPluginの両方を更新してください。

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

一時的に無効化するには:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## 関連ドキュメント

- チャンネル概要: [Chat Channels](/ja-JP/channels)
- Pairing: [Pairing](/ja-JP/channels/pairing)
- チャンネルルーティング: [Channel Routing](/ja-JP/channels/channel-routing)
- Pluginアーキテクチャ: [Plugin Architecture](/ja-JP/plugins/architecture)
- チャンネルPlugin SDK: [Channel Plugin SDK](/ja-JP/plugins/sdk-channel-plugins)
- 外部パッケージ: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
