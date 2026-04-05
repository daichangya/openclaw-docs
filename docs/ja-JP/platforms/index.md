---
read_when:
    - OS 対応やインストール方法を探している場合
    - Gateway をどこで実行するか決める場合
summary: プラットフォーム対応の概要（Gateway + companion apps）
title: Platforms
x-i18n:
    generated_at: "2026-04-05T12:50:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5be4743fd39eca426d65db940f04f3a8fc3ff2c5e10b0e82bc55fc35a7d1399
    source_path: platforms/index.md
    workflow: 15
---

# Platforms

OpenClaw のコアは TypeScript で書かれています。**Node が推奨ランタイム**です。
Bun は Gateway には推奨されません（WhatsApp/Telegram の不具合があります）。

companion apps は macOS（メニューバーアプリ）とモバイルノード（iOS/Android）向けに存在します。Windows と
Linux の companion apps も計画されていますが、Gateway はすでに今日フルサポートされています。
Windows 向けネイティブ companion apps も計画中です。Gateway は WSL2 経由での利用を推奨します。

## OS を選ぶ

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS とホスティング

- VPS ハブ: [VPS hosting](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner（Docker）: [Hetzner](/install/hetzner)
- GCP（Compute Engine）: [GCP](/install/gcp)
- Azure（Linux VM）: [Azure](/install/azure)
- exe.dev（VM + HTTPS proxy）: [exe.dev](/install/exe-dev)

## 共通リンク

- インストールガイド: [はじめに](/ja-JP/start/getting-started)
- Gateway ランブック: [Gateway](/gateway)
- Gateway 設定: [Configuration](/gateway/configuration)
- サービス状態: `openclaw gateway status`

## Gateway サービスのインストール（CLI）

次のいずれかを使います（すべてサポートされています）:

- ウィザード（推奨）: `openclaw onboard --install-daemon`
- 直接実行: `openclaw gateway install`
- 設定フロー: `openclaw configure` → **Gateway service** を選択
- 修復/移行: `openclaw doctor`（サービスのインストールまたは修復を提案します）

サービスの対象は OS によって異なります:

- macOS: LaunchAgent（`ai.openclaw.gateway` または `ai.openclaw.<profile>`、レガシーでは `com.openclaw.*`）
- Linux/WSL2: systemd user service（`openclaw-gateway[-<profile>].service`）
- ネイティブ Windows: Scheduled Task（`OpenClaw Gateway` または `OpenClaw Gateway (<profile>)`）。タスク作成が拒否された場合はユーザーごとの Startup-folder ログイン項目へフォールバック
