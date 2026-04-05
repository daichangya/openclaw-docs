---
read_when:
    - Gatewayサービスやローカル状態を削除したい場合
    - まずドライランを実行したい場合
summary: '`openclaw uninstall` のCLIリファレンス（Gatewayサービス + ローカルデータを削除）'
title: uninstall
x-i18n:
    generated_at: "2026-04-05T12:40:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2123a4f9c7a070ef7e13c60dafc189053ef61ce189fa4f29449dd50987c1894c
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Gatewayサービス + ローカルデータをアンインストールします（CLIは残ります）。

オプション:

- `--service`: Gatewayサービスを削除
- `--state`: 状態と設定を削除
- `--workspace`: ワークスペースディレクトリを削除
- `--app`: macOSアプリを削除
- `--all`: サービス、状態、ワークスペース、アプリを削除
- `--yes`: 確認プロンプトをスキップ
- `--non-interactive`: プロンプトを無効化します。`--yes` が必要です
- `--dry-run`: ファイルを削除せずに実行内容を表示

例:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

注意:

- 状態またはワークスペースを削除する前に復元可能なスナップショットが必要な場合は、まず `openclaw backup create` を実行してください。
- `--all` は、サービス、状態、ワークスペース、アプリをまとめて削除するための短縮指定です。
- `--non-interactive` には `--yes` が必要です。
