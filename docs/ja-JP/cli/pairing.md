---
read_when:
    - ペアリングモードのDMを使っていて送信者を承認する必要があるとき
summary: '`openclaw pairing`のCLIリファレンス（ペアリング要求の承認/一覧表示）'
title: pairing
x-i18n:
    generated_at: "2026-04-05T12:39:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 122a608ef83ec2b1011fdfd1b59b94950a4dcc8b598335b0956e2eedece4958f
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

DMペアリング要求を承認または確認します（ペアリングをサポートするチャンネル向け）。

関連:

- ペアリングフロー: [Pairing](/channels/pairing)

## コマンド

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

1つのチャンネルに対する保留中のペアリング要求を一覧表示します。

オプション:

- `[channel]`: 位置指定のチャンネルID
- `--channel <channel>`: 明示的なチャンネルID
- `--account <accountId>`: 複数アカウント対応チャンネル用のアカウントID
- `--json`: 機械可読な出力

注記:

- ペアリング対応チャンネルが複数設定されている場合は、位置指定または`--channel`のいずれかでチャンネルを指定する必要があります。
- チャンネルIDが有効であれば、拡張チャンネルも使用できます。

## `pairing approve`

保留中のペアリングコードを承認し、その送信者を許可します。

使用方法:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- ペアリング対応チャンネルが1つだけ設定されている場合は`openclaw pairing approve <code>`

オプション:

- `--channel <channel>`: 明示的なチャンネルID
- `--account <accountId>`: 複数アカウント対応チャンネル用のアカウントID
- `--notify`: 同じチャンネル上で要求元に確認メッセージを返す

## 注記

- チャンネル入力は、位置指定（`pairing list telegram`）または`--channel <channel>`で渡します。
- `pairing list`は、複数アカウント対応チャンネル向けに`--account <accountId>`をサポートします。
- `pairing approve`は、`--account <accountId>`と`--notify`をサポートします。
- ペアリング対応チャンネルが1つだけ設定されている場合は、`pairing approve <code>`を使用できます。
