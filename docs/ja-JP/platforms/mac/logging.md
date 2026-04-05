---
read_when:
    - macOSログを取得している場合や、private dataのログ記録を調査している場合
    - voice wake/session lifecycleの問題をデバッグしている場合
summary: 'OpenClawのロギング: ローテーションする診断用ファイルログ + unified logのプライバシーフラグ'
title: macOS Logging
x-i18n:
    generated_at: "2026-04-05T12:50:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: c08d6bc012f8e8bb53353fe654713dede676b4e6127e49fd76e00c2510b9ab0b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Logging（macOS）

## ローテーションする診断用ファイルログ（Debugペイン）

OpenClawはmacOS app logsを swift-log 経由で処理し（デフォルトではunified logging）、必要に応じて、永続的に取得できるローカルのローテーションファイルログをディスクへ書き出せます。

- 詳細度: **Debug pane → Logs → App logging → Verbosity**
- 有効化: **Debug pane → Logs → App logging → 「Write rolling diagnostics log (JSONL)」**
- 場所: `~/Library/Logs/OpenClaw/diagnostics.jsonl`（自動でローテーションされます。古いファイルには `.1`, `.2`, … の接尾辞が付きます）
- クリア: **Debug pane → Logs → App logging → 「Clear」**

注意:

- これは**デフォルトでは無効**です。積極的にデバッグしている間だけ有効にしてください。
- このファイルは機微情報として扱い、確認せずに共有しないでください。

## macOSでのUnified loggingのprivate data

Unified loggingは、subsystemが `privacy -off` にオプトインしない限り、ほとんどのpayloadをredactします。PeterのmacOSにおける [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans)（2025年）の記事によると、これはsubsystem名をキーとする `/Library/Preferences/Logging/Subsystems/` 配下のplistで制御されます。フラグが反映されるのは新しいログエントリだけなので、問題を再現する前に有効化してください。

## OpenClaw（`ai.openclaw`）で有効にする

- まずplistを一時ファイルへ書き出し、その後rootでatomicにインストールします:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- 再起動は不要です。logdはこのファイルにすぐ気付きますが、private payloadsを含むのは新しいログ行だけです。
- 詳細な出力は、既存のヘルパーで確認できます。たとえば `./scripts/clawlog.sh --category WebChat --last 5m`。

## デバッグ後に無効化する

- 上書きを削除します: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 必要なら、`sudo log config --reload` を実行して、logdに即座に上書きを破棄させます。
- この面には電話番号やメッセージ本文が含まれうることを忘れないでください。追加の詳細が本当に必要な間だけ、このplistを残してください。
