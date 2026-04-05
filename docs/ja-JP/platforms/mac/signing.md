---
read_when:
    - macOS デバッグビルドをビルドまたは署名する場合
summary: パッケージングスクリプトで生成された macOS デバッグビルドの署名手順
title: macOS Signing
x-i18n:
    generated_at: "2026-04-05T12:51:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b16d726549cf6dc34dc9c60e14d8041426ebc0699ab59628aca1d094380334a
    source_path: platforms/mac/signing.md
    workflow: 15
---

# mac 署名（デバッグビルド）

この app は通常 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) からビルドされ、現在は次を行います:

- 安定したデバッグ bundle identifier を設定する: `ai.openclaw.mac.debug`
- その bundle id で Info.plist を書き込む（`BUNDLE_ID=...` で上書き可能）
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) を呼び出してメインバイナリと app bundle に署名し、macOS が各再ビルドを同じ署名済み bundle として扱い、TCC 権限（通知、アクセシビリティ、画面収録、マイク、音声）を維持できるようにする。安定した権限のためには実際の署名 identity を使用してください。ad-hoc は明示的なオプトインであり不安定です（[macOS permissions](/platforms/mac/permissions) を参照）。
- デフォルトで `CODESIGN_TIMESTAMP=auto` を使用する。これにより Developer ID 署名向けに信頼された timestamp が有効になります。timestamp をスキップするには `CODESIGN_TIMESTAMP=off` を設定します（オフラインのデバッグビルド）。
- ビルドメタデータを Info.plist に注入する: `OpenClawBuildTimestamp`（UTC）と `OpenClawGitCommit`（短いハッシュ）。これにより About ペインで build、git、debug/release channel を表示できます。
- **パッケージングのデフォルトは Node 24**: このスクリプトは TS ビルドと Control UI ビルドを実行します。互換性のため、Node 22 LTS（現在 `22.14+`）も引き続きサポートされます。
- 環境変数から `SIGN_IDENTITY` を読み取る。常に自分の証明書で署名するには、`export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`（または Developer ID Application 証明書）をシェルの rc に追加します。ad-hoc 署名には `ALLOW_ADHOC_SIGNING=1` または `SIGN_IDENTITY="-"` による明示的なオプトインが必要です（権限テストには非推奨）。
- 署名後に Team ID 監査を実行し、app bundle 内のいずれかの Mach-O が別の Team ID で署名されていると失敗します。バイパスするには `SKIP_TEAM_ID_CHECK=1` を設定します。

## 使用方法

```bash
# リポジトリールートから
scripts/package-mac-app.sh               # identity を自動選択。見つからない場合はエラー
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 実際の証明書
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc（権限は維持されません）
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # 明示的な ad-hoc（同じ注意点あり）
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # 開発専用の Sparkle Team ID 不一致回避策
```

### Ad-hoc 署名に関する注意

`SIGN_IDENTITY="-"`（ad-hoc）で署名する場合、スクリプトは自動的に **Hardened Runtime**（`--options runtime`）を無効にします。これは、app が同じ Team ID を共有しない埋め込み framework（Sparkle など）を読み込もうとしたときのクラッシュを防ぐために必要です。ad-hoc 署名では TCC 権限の永続性も壊れます。復旧手順については [macOS permissions](/platforms/mac/permissions) を参照してください。

## About 向けのビルドメタデータ

`package-mac-app.sh` は bundle に次を刻印します:

- `OpenClawBuildTimestamp`: パッケージ時点の ISO8601 UTC
- `OpenClawGitCommit`: 短い git ハッシュ（利用できない場合は `unknown`）

About タブはこれらのキーを読み取り、バージョン、ビルド日、git commit、およびデバッグビルドかどうか（`#if DEBUG` 経由）を表示します。コード変更後にこれらの値を更新するには、packager を実行してください。

## 理由

TCC 権限は bundle identifier _と_ code signature に結び付けられています。UUID が変わる未署名のデバッグビルドでは、再ビルドのたびに macOS が付与を忘れてしまっていました。バイナリに署名し（デフォルトでは ad-hoc）、固定された bundle id / path（`dist/OpenClaw.app`）を保つことで、VibeTunnel のアプローチと同様に、ビルド間で付与を維持できます。
