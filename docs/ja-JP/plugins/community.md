---
read_when:
    - サードパーティーのOpenClaw pluginを探したい
    - 自分のpluginを公開または掲載したい
summary: 'コミュニティが保守するOpenClaw plugin: 探す、インストールする、自分のpluginを登録する'
title: Community Plugins
x-i18n:
    generated_at: "2026-04-05T12:51:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01804563a63399fe564b0cd9b9aadef32e5211b63d8467fdbbd1f988200728de
    source_path: plugins/community.md
    workflow: 15
---

# Community Plugins

Community pluginsは、OpenClawを新しい
channel、tool、provider、またはその他の機能で拡張するサードパーティーパッケージです。これらはコミュニティによって開発・保守され、[ClawHub](/tools/clawhub) またはnpmで公開され、
1つのコマンドでインストールできます。

ClawHubはcommunity pluginの正式なdiscoverability surfaceです。見つけやすくするためだけにここへpluginを追加するdocs-only PRは開かないでください。代わりにClawHubで公開してください。

```bash
openclaw plugins install <package-name>
```

OpenClawはまずClawHubを確認し、自動的にnpmへフォールバックします。

## 掲載されているplugin

### Codex App Server Bridge

Codex App Server会話向けの独立したOpenClaw bridgeです。chatを
Codex threadへbindし、プレーンテキストで会話し、resume、planning、review、model選択、compactionなどをchatネイティブcommandで制御できます。

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream modeを使うenterprise robot integrationです。任意のDingTalk client経由で、text、image、file messageをサポートします。

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw向けのLossless Context Management pluginです。DAGベースの会話
要約とincremental compactionにより、token使用量を減らしながら
完全なcontext fidelityを維持します。

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

agent traceをOpikへエクスポートする公式pluginです。agentの動作、
コスト、token、errorなどを監視できます。

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### QQbot

QQ Bot API経由でOpenClawをQQへ接続します。private chat、group
mention、channel message、およびvoice、image、video、
fileを含むリッチmediaをサポートします。

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeComチームによるOpenClaw向けWeCom channel pluginです。
WeCom Bot WebSocket永続接続を基盤として、
direct messageとgroup chat、streaming reply、proactive messaging、image/file処理、Markdown
formatting、組み込みaccess control、document/meeting/messaging skillをサポートします。

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## あなたのpluginを登録する

有用で、文書化されていて、安全に運用できるcommunity pluginを歓迎します。

<Steps>
  <Step title="ClawHubまたはnpmで公開する">
    あなたのpluginは `openclaw plugins install \<package-name\>` でインストール可能である必要があります。
    [ClawHub](/tools/clawhub)（推奨）またはnpmで公開してください。
    完全なガイドは [Building Plugins](/plugins/building-plugins) を参照してください。

  </Step>

  <Step title="GitHubで公開する">
    ソースコードは、セットアップドキュメントとissue
    trackerを備えた公開repositoryにある必要があります。

  </Step>

  <Step title="docs PRはソースドキュメント変更にのみ使う">
    pluginを見つけやすくするためだけにdocs PRは不要です。代わりにClawHubで公開してください。

    docs PRを開くのは、OpenClawのソースドキュメントに実際の内容変更が必要な場合だけにしてください。
    たとえば、インストール手順の修正や、メインのdocsセットに属する
    cross-repoドキュメントの追加などです。

  </Step>
</Steps>

## 品質基準

| Requirement                 | 理由                                                     |
| --------------------------- | -------------------------------------------------------- |
| ClawHubまたはnpmで公開されている | ユーザーが `openclaw plugins install` を使える必要があるため |
| 公開GitHub repo             | ソースレビュー、issue追跡、透明性のため                 |
| セットアップと利用ドキュメント | ユーザーが設定方法を知る必要があるため                   |
| 継続的な保守                | 最近の更新または迅速なissue対応が必要なため             |

手間の少ないwrapper、所有者が不明確なもの、または保守されていないパッケージは却下される場合があります。

## 関連

- [Install and Configure Plugins](/tools/plugin) — 任意のpluginをインストールする方法
- [Building Plugins](/plugins/building-plugins) — 自分のpluginを作成する
- [Plugin Manifest](/plugins/manifest) — manifest schema
