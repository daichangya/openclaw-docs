---
read_when:
    - 完全な CLI オンボーディングなしで初回セットアップを行っている
    - デフォルトの workspace パスを設定したい
summary: '`openclaw setup` の CLI リファレンス（config + workspace を初期化）'
title: setup
x-i18n:
    generated_at: "2026-04-05T12:39:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f538aac341c749043ad959e35f2ed99c844ab8c3500ff59aa159d940bd301792
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

`~/.openclaw/openclaw.json` とエージェント workspace を初期化します。

関連:

- はじめに: [はじめに](/ja-JP/start/getting-started)
- CLI オンボーディング: [Onboarding (CLI)](/ja-JP/start/wizard)

## 例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## オプション

- `--workspace <dir>`: エージェント workspace ディレクトリ（`agents.defaults.workspace` として保存）
- `--wizard`: オンボーディングを実行
- `--non-interactive`: プロンプトなしでオンボーディングを実行
- `--mode <local|remote>`: オンボーディングモード
- `--remote-url <url>`: リモート Gateway WebSocket URL
- `--remote-token <token>`: リモート Gateway トークン

setup 経由でオンボーディングを実行するには:

```bash
openclaw setup --wizard
```

注意:

- 単純な `openclaw setup` は、完全なオンボーディングフローなしで config + workspace を初期化します。
- オンボーディング用フラグ（`--wizard`、`--non-interactive`、`--mode`、`--remote-url`、`--remote-token`）のいずれかが存在すると、オンボーディングが自動実行されます。
