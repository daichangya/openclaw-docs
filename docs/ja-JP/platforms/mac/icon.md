---
read_when:
    - メニューバーアイコンの動作を変更する場合
summary: macOS 上の OpenClaw のメニューバーアイコン状態とアニメーション
title: Menu Bar Icon
x-i18n:
    generated_at: "2026-04-05T12:50:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: a67a6e6bbdc2b611ba365d3be3dd83f9e24025d02366bc35ffcce9f0b121872b
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Menu Bar Icon States

著者: steipete · 更新日: 2025-12-06 · 対象: macOS app（`apps/macos`）

- **Idle:** 通常のアイコンアニメーション（まばたき、時々揺れる）。
- **Paused:** status item は `appearsDisabled` を使用し、動きはありません。
- **Voice trigger（big ears）:** Voice wake detector は、ウェイクワードが聞こえると `AppState.triggerVoiceEars(ttl: nil)` を呼び出し、発話の取得中は `earBoostActive=true` を維持します。耳は拡大し（1.9 倍）、視認性のために円形の耳穴が付き、1 秒間無音になると `stopVoiceEars()` によって元に戻ります。これは app 内の voice パイプラインからのみ発火します。
- **Working（agent 実行中）:** `AppState.isWorking=true` によって「tail/leg scurry」のマイクロモーションが駆動されます。作業が進行中の間、脚の揺れが速くなり、少し位置がずれます。現在は WebChat の agent 実行の前後で切り替えられています。他の長時間タスクにも配線する際は、同じ切り替えを追加してください。

配線ポイント

- Voice wake: runtime/tester は、トリガー時に `AppState.triggerVoiceEars(ttl: nil)` を呼び出し、1 秒の無音後に `stopVoiceEars()` を呼び出して、取得ウィンドウに一致させます。
- Agent activity: 作業スパンの前後で `AppStateStore.shared.setWorking(true/false)` を設定します（WebChat の agent 呼び出しではすでに実施済み）。アニメーションが張り付かないよう、スパンは短く保ち、`defer` ブロックでリセットしてください。

形状とサイズ

- ベースアイコンは `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)` で描画されます。
- 耳のスケールのデフォルトは `1.0` です。voice boost では `earScale=1.9` を設定し、全体フレームは変更せずに `earHoles=true` を切り替えます（18×18 pt のテンプレート画像を 36×36 px の Retina バッキングストアにレンダリング）。
- scurry では脚の揺れが最大およそ `1.0` になり、小さな水平方向の揺れが加わります。これは既存の idle wiggle に加算されます。

動作に関する注意

- ears/working 用の外部 CLI / broker トグルはありません。意図しない頻繁な切り替わりを避けるため、app 自身のシグナル内に留めてください。
- ジョブがハングした場合でもアイコンがすばやく通常状態に戻るよう、TTL は短く（&lt;10s）保ってください。
