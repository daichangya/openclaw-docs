---
read_when:
    - OpenClawでZalo Personal（非公式）サポートを使いたい場合
    - zalouser pluginを設定または開発している場合
summary: 'ネイティブ`zca-js`を使ったZalo Personalプラグイン: QRログイン + メッセージング（pluginインストール + channel設定 + tool）'
title: Zalo Personal Plugin
x-i18n:
    generated_at: "2026-04-05T12:52:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3218c3ee34f36466d952aec1b479d451a6235c7c46918beb28698234a7fd0968
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal（plugin）

通常のZalo個人アカウントを自動化するネイティブ`zca-js`を使用した、OpenClaw向けZalo Personalサポートpluginです。

> **Warning:** 非公式の自動化により、アカウント停止/banにつながる可能性があります。自己責任で使用してください。

## 命名

channel idは`zalouser`です。これは、**個人用Zaloユーザーアカウント**（非公式）を自動化することを明示するためです。`zalo`は、将来的な公式Zalo API統合のために予約したままにしています。

## 実行場所

このpluginは**Gatewayプロセス内**で動作します。

remote Gatewayを使用している場合は、**Gatewayを実行しているマシン**上でインストール/設定し、その後Gatewayを再起動してください。

外部の`zca`/`openzca` CLIバイナリは不要です。

## インストール

### オプションA: npmからインストール

```bash
openclaw plugins install @openclaw/zalouser
```

その後、Gatewayを再起動してください。

### オプションB: ローカルフォルダーからインストール（開発用）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

その後、Gatewayを再起動してください。

## 設定

channel設定は`plugins.entries.*`ではなく、`channels.zalouser`配下にあります:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Agent tool

tool名: `zalouser`

アクション: `send`、`image`、`link`、`friends`、`groups`、`me`、`status`

channel messageアクションは、メッセージリアクション用の`react`もサポートします。
