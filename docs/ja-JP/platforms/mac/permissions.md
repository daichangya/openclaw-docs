---
read_when:
    - 表示されない、または固まった macOS 権限プロンプトをデバッグする場合
    - macOS アプリをパッケージングまたは署名する場合
    - bundle ID またはアプリのインストールパスを変更する場合
summary: macOS の権限永続化（TCC）と署名要件
title: macOS Permissions
x-i18n:
    generated_at: "2026-04-05T12:50:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 250065b964c98c307a075ab9e23bf798f9d247f27befe2e5f271ffef1f497def
    source_path: platforms/mac/permissions.md
    workflow: 15
---

# macOS permissions (TCC)

macOS の権限付与は壊れやすいものです。TCC は、権限付与を
アプリのコード署名、bundle identifier、ディスク上のパスに関連付けます。これらのいずれかが変わると、
macOS はそのアプリを新しいものとして扱い、プロンプトが失われたり表示されなくなったりすることがあります。

## 権限を安定させるための要件

- 同じパス: アプリは固定の場所から実行します（OpenClaw では `dist/OpenClaw.app`）。
- 同じ bundle identifier: bundle ID を変更すると、新しい権限 identity が作られます。
- 署名済みアプリ: 署名なしまたは ad-hoc 署名のビルドでは権限は永続化されません。
- 一貫した署名: 実際の Apple Development または Developer ID certificate
  を使い、再ビルド後も署名が安定するようにします。

Ad-hoc 署名では、ビルドごとに新しい identity が生成されます。macOS は以前の
付与を忘れ、古いエントリをクリアするまでプロンプト自体が完全に消えることもあります。

## プロンプトが消えたときの復旧チェックリスト

1. アプリを終了します。
2. System Settings -> Privacy & Security でアプリのエントリを削除します。
3. 同じパスからアプリを再起動し、権限を再付与します。
4. それでもプロンプトが表示されない場合は、`tccutil` で TCC エントリをリセットして再試行します。
5. 一部の権限は macOS を完全に再起動しないと再表示されません。

リセット例（必要に応じて bundle ID を置き換えてください）:

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## ファイルとフォルダーの権限（Desktop/Documents/Downloads）

macOS は、terminal/background process に対して Desktop、Documents、Downloads も制限することがあります。ファイルの読み取りやディレクトリ一覧取得がハングする場合は、ファイル操作を行うのと同じ process context（たとえば Terminal/iTerm、LaunchAgent 起動アプリ、または SSH process）にアクセスを付与してください。

回避策: フォルダーごとの付与を避けたい場合は、ファイルを OpenClaw workspace（`~/.openclaw/workspace`）へ移動してください。

権限をテストする場合は、必ず実際の証明書で署名してください。Ad-hoc
ビルドが許容されるのは、権限が重要でない短時間のローカル実行だけです。
