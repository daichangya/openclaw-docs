---
read_when:
    - voice overlayの動作を調整している
summary: wake-wordとpush-to-talkが重なったときのvoice overlayライフサイクル
title: Voice Overlay
x-i18n:
    generated_at: "2026-04-05T12:51:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1efcc26ec05d2f421cb2cf462077d002381995b338d00db77d5fdba9b8d938b6
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Voice Overlay Lifecycle（macOS）

対象読者: macOS appのコントリビューター。目的: wake-wordとpush-to-talkが重なったときでも、voice overlayの動作を予測可能に保つことです。

## 現在の意図

- wake-wordですでにoverlayが表示されている状態でユーザーがhotkeyを押した場合、hotkey sessionは既存のテキストをリセットせずに_引き継ぎます_。hotkeyを押している間、overlayは表示されたままです。ユーザーが離したとき: trim後のテキストがあれば送信し、なければ閉じます。
- wake-word単体では引き続き無音時に自動送信されます。push-to-talkは離した時点ですぐに送信します。

## 実装済み（2025年12月9日）

- overlay sessionは、各capture（wake-wordまたはpush-to-talk）ごとにtokenを持つようになりました。partial/final/send/dismiss/level updateはtokenが一致しない場合に破棄されるため、古いcallbackによる影響を防げます。
- push-to-talkは、表示中のoverlayテキストをprefixとして引き継ぎます（そのため、wake overlayが表示されている間にhotkeyを押すと、テキストを保持したまま新しい音声を追記します）。現在のテキストへフォールバックする前に、最終transcriptを最大1.5秒待機します。
- Chime/overlay loggingは、カテゴリ `voicewake.overlay`、`voicewake.ptt`、`voicewake.chime` で `info` レベル出力されます（session start、partial、final、send、dismiss、chime reason）。

## 次のステップ

1. **VoiceSessionCoordinator（actor）**
   - 常にちょうど1つの `VoiceSession` だけを管理します。
   - API（tokenベース）: `beginWakeCapture`、`beginPushToTalk`、`updatePartial`、`endCapture`、`cancel`、`applyCooldown`。
   - 古いtokenを持つcallbackを破棄します（古いrecognizerがoverlayを再表示するのを防止）。

2. **VoiceSession（model）**
   - フィールド: `token`、`source`（wakeWord|pushToTalk）、committed/volatile text、chime flag、timer（auto-send、idle）、`overlayMode`（display|editing|sending）、cooldown deadline。

3. **Overlay binding**
   - `VoiceSessionPublisher`（`ObservableObject`）がアクティブsessionをSwiftUIへ反映します。
   - `VoiceWakeOverlayView` はpublisher経由でのみ描画され、グローバルsingletonを直接変更しません。
   - overlayのユーザー操作（`sendNow`、`dismiss`、`edit`）は、session token付きでcoordinatorへコールバックします。

4. **統一された送信経路**
   - `endCapture` 時: trim後テキストが空なら閉じ、そうでなければ `performSend(session:)` を実行します（send chimeを1回だけ再生し、転送して閉じる）。
   - push-to-talk: 遅延なし。wake-word: auto-send用の任意遅延あり。
   - push-to-talk完了後は、wake runtimeに短いcooldownを適用し、wake-wordがすぐ再トリガーされないようにします。

5. **Logging**
   - coordinatorはsubsystem `ai.openclaw`、category `voicewake.overlay` と `voicewake.chime` で `.info` ログを出力します。
   - 主なevent: `session_started`、`adopted_by_push_to_talk`、`partial`、`finalized`、`send`、`dismiss`、`cancel`、`cooldown`。

## デバッグチェックリスト

- 固着したoverlayを再現しながらログをstreamします:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- アクティブなsession tokenが1つだけであることを確認してください。古いcallbackはcoordinatorによって破棄されるはずです。
- push-to-talkのreleaseが常にアクティブtoken付きで `endCapture` を呼ぶことを確認してください。テキストが空なら、chimeやsendなしで `dismiss` になるはずです。

## 移行手順（提案）

1. `VoiceSessionCoordinator`、`VoiceSession`、`VoiceSessionPublisher` を追加する。
2. `VoiceWakeRuntime` を、`VoiceWakeOverlayController` を直接触るのではなく、sessionをcreate/update/endするようにリファクタリングする。
3. `VoicePushToTalk` を、既存sessionを引き継いでrelease時に `endCapture` を呼ぶようにリファクタリングし、runtime cooldownを適用する。
4. `VoiceWakeOverlayController` をpublisherへ接続し、runtime/PTTからの直接呼び出しを削除する。
5. session引き継ぎ、cooldown、空テキスト時のdismissに対する統合テストを追加する。
