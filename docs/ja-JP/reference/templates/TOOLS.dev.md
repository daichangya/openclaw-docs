---
read_when:
    - 開発用Gatewayテンプレートを使用するとき
    - デフォルトの開発エージェントIDを更新するとき
summary: 開発エージェントツールのメモ（C-3PO）
title: TOOLS.dev テンプレート
x-i18n:
    generated_at: "2026-04-05T12:56:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a7fb38aad160335dec5a5ceb9d71ec542c21a06794ae3e861fa562db7abe69d
    source_path: reference/templates/TOOLS.dev.md
    workflow: 15
---

# TOOLS.md - ユーザーツールのメモ（編集可能）

このファイルは、外部ツールや慣例についての _あなた自身の_ メモのためのものです。
どのツールが存在するかを定義するものではありません。OpenClaw が組み込みツールを内部的に提供します。

## 例

### imsg

- iMessage/SMSを送信する: 誰に何を送るかを説明し、送信前に確認する。
- 短いメッセージを優先する。秘密情報の送信は避ける。

### sag

- テキスト読み上げ: 音声、対象のスピーカー/部屋、ストリーミングするかどうかを指定する。

ローカルのツールチェーンについて、アシスタントに知っておいてほしいことがあれば自由に追加してください。
