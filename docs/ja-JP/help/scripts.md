---
read_when:
    - リポジトリ内のスクリプトを実行する場合
    - '`./scripts` 配下のスクリプトを追加または変更する場合'
summary: 'リポジトリスクリプト: 目的、スコープ、安全上の注意'
title: Scripts
x-i18n:
    generated_at: "2026-04-05T12:46:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: de53d64d91c564931bdd4e8b9f4a8e88646332a07cc2a6bf1d517b89debb29cd
    source_path: help/scripts.md
    workflow: 15
---

# Scripts

`scripts/` ディレクトリには、ローカルワークフローや運用タスク向けのヘルパースクリプトが含まれています。
タスクが明確にスクリプトに結び付いている場合はそれらを使い、それ以外では CLI を優先してください。

## 規約

- スクリプトは、ドキュメントやリリースチェックリストで参照されていない限り **任意** です。
- 利用可能な場合は CLI サーフェスを優先してください（例: 認証監視には `openclaw models status --check` を使います）。
- スクリプトはホスト固有である前提で扱い、新しいマシンで実行する前に内容を確認してください。

## 認証監視スクリプト

認証監視については [Authentication](/gateway/authentication) で扱っています。`scripts/` 配下のスクリプトは、systemd/Termux phone ワークフロー向けの任意の追加機能です。

## スクリプトを追加する場合

- スクリプトは焦点を絞り、文書化してください。
- 関連するドキュメントに短い項目を追加してください（存在しない場合は作成してください）。
