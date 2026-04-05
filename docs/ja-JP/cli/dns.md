---
read_when:
    - Tailscale + CoreDNS 経由で広域ディスカバリー（DNS-SD）を使いたいとき
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` の CLI リファレンス（広域ディスカバリーヘルパー）'
title: dns
x-i18n:
    generated_at: "2026-04-05T12:38:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4831fbb7791adfed5195bc4ba36bb248d2bc8830958334211d3c96f824617927
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

広域ディスカバリー（Tailscale + CoreDNS）用の DNS ヘルパーです。現在は macOS + Homebrew CoreDNS に主に対応しています。

関連:

- Gateway ディスカバリー: [ディスカバリー](/gateway/discovery)
- 広域ディスカバリー設定: [設定](/gateway/configuration)

## セットアップ

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

ユニキャスト DNS-SD ディスカバリー向けの CoreDNS セットアップを計画または適用します。

オプション:

- `--domain <domain>`: 広域ディスカバリードメイン（例 `openclaw.internal`）
- `--apply`: CoreDNS 設定をインストールまたは更新し、サービスを再起動します（sudo が必要。macOS のみ）

表示内容:

- 解決されたディスカバリードメイン
- ゾーンファイルのパス
- 現在の tailnet IP
- 推奨される `openclaw.json` ディスカバリー設定
- 設定すべき Tailscale Split DNS の nameserver/domain 値

注意:

- `--apply` を付けない場合、このコマンドは計画用ヘルパーのみとして動作し、推奨セットアップを表示します。
- `--domain` を省略した場合、OpenClaw は設定の `discovery.wideArea.domain` を使います。
- `--apply` は現在 macOS のみ対応で、Homebrew CoreDNS を前提としています。
- `--apply` は必要に応じてゾーンファイルを初期化し、CoreDNS の import stanza が存在することを保証し、`coredns` の brew service を再起動します。
