---
read_when:
    - channelの連絡先/group/self IDを調べたい場合
    - channel directory adapterを開発している場合
summary: '`openclaw directory`のCLIリファレンス（self、peers、groups）'
title: directory
x-i18n:
    generated_at: "2026-04-05T12:38:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a81a037e0a33f77c24b1adabbc4be16ed4d03c419873f3cbdd63f2ce84a1064
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

対応しているchannels向けのdirectory検索（連絡先/peer、group、「自分」）。

## よく使うフラグ

- `--channel <name>`: channel id/alias（複数のchannelsが設定されている場合は必須。1つだけ設定されている場合は自動）
- `--account <id>`: account id（デフォルト: channel default）
- `--json`: JSONを出力

## 注

- `directory`は、他のコマンドに貼り付けられるIDを見つけるためのものです（特に`openclaw message send --target ...`）。
- 多くのchannelsでは、結果はライブprovider directoryではなく、configベース（allowlist / 設定済みgroups）です。
- デフォルト出力は`id`（場合によっては`name`も）をタブ区切りで表示します。スクリプト用途では`--json`を使用してください。

## `message send`で結果を使う

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID形式（channel別）

- WhatsApp: `+15551234567`（DM）、`1234567890-1234567890@g.us`（group）
- Telegram: `@username`または数値chat id。groupsは数値id
- Slack: `user:U…` および `channel:C…`
- Discord: `user:<id>` および `channel:<id>`
- Matrix (plugin): `user:@user:server`、`room:!roomId:server`、または`#alias:server`
- Microsoft Teams (plugin): `user:<id>` および `conversation:<id>`
- Zalo (plugin): user id（Bot API）
- Zalo Personal / `zalouser` (plugin): `zca`のthread id（DM/group）（`me`、`friend list`、`group list`）

## Self（「自分」）

```bash
openclaw directory self --channel zalouser
```

## Peers（連絡先/users）

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Groups

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```
