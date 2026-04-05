---
read_when:
    - Voice wakeまたはPTT経路に取り組んでいる場合
summary: macアプリにおけるVoice wakeとpush-to-talkモード、およびルーティングの詳細
title: Voice Wake（macOS）
x-i18n:
    generated_at: "2026-04-05T12:51:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: fed6524a2e1fad5373d34821c920b955a2b5a3fcd9c51cdb97cf4050536602a7
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Voice Wake & Push-to-Talk

## モード

- **ウェイクワードモード**（デフォルト）: 常時動作するSpeech recognizerがトリガートークン（`swabbleTriggerWords`）を待機します。一致するとキャプチャを開始し、部分テキスト付きのオーバーレイを表示し、無音後に自動送信します。
- **Push-to-talk（右Optionキー長押し）**: 右Optionキーを押し続けると即座にキャプチャを開始します。トリガーは不要です。押している間はオーバーレイが表示され、離すと確定され、短い遅延の後に転送されるため、テキストを微調整できます。

## ランタイム動作（ウェイクワード）

- Speech recognizerは `VoiceWakeRuntime` 内にあります。
- トリガーは、ウェイクワードと次の単語の間に**意味のある間**がある場合にのみ発火します（約0.55秒のギャップ）。オーバーレイ/チャイムは、コマンドが始まる前でもその間で開始されることがあります。
- 無音ウィンドウ: 音声が続いている場合は2.0秒、トリガーだけが聞こえた場合は5.0秒。
- ハードストップ: 暴走セッションを防ぐため120秒。
- セッション間のデバウンス: 350ms。
- オーバーレイは `VoiceWakeOverlayController` により、確定/揮発の色分け付きで制御されます。
- 送信後、recognizerは次のトリガーを待つためにクリーンに再起動します。

## ライフサイクルの不変条件

- Voice Wakeが有効で権限が付与されている場合、ウェイクワードrecognizerは待機状態である必要があります（明示的なpush-to-talkキャプチャ中を除く）。
- オーバーレイの可視状態（Xボタンによる手動dismissを含む）は、recognizerの再開を妨げてはいけません。

## オーバーレイ張り付きの障害モード（以前）

以前は、オーバーレイが表示されたまま固まり、手動で閉じた場合、ランタイムの再起動試行がオーバーレイ表示状態に阻まれ、その後の再起動もスケジュールされないことがあり、その結果Voice Wakeが「死んだ」ように見えることがありました。

ハードニング:

- wake runtimeの再起動は、もはやオーバーレイ表示状態によってブロックされません。
- オーバーレイdismiss完了時に `VoiceSessionCoordinator` 経由で `VoiceWakeRuntime.refresh(...)` がトリガーされるため、Xによる手動dismissでも必ず待機が再開されます。

## Push-to-talk固有事項

- ホットキー検出は、**右Option**（`keyCode 61` + `.option`）に対するグローバルな `.flagsChanged` モニターを使用します。イベントは監視するだけで、横取りはしません。
- キャプチャパイプラインは `VoicePushToTalk` 内にあり、Speechを即座に開始し、部分結果をオーバーレイへストリーミングし、キーを離したときに `VoiceWakeForwarder` を呼び出します。
- push-to-talk開始時には、音声tapの競合を避けるためにウェイクワードランタイムを一時停止し、キーを離した後に自動で再起動します。
- 権限: Microphone + Speech が必要です。イベントを見るには Accessibility/Input Monitoring の承認が必要です。
- 外付けキーボード: 右Optionが想定どおりに露出されないものがあるため、ユーザーから取りこぼし報告があればフォールバックショートカットを用意してください。

## ユーザー向け設定

- **Voice Wake** トグル: ウェイクワードランタイムを有効化します。
- **Hold Cmd+Fn to talk**: push-to-talkモニターを有効化します。macOS < 26 では無効です。
- 言語とマイクのピッカー、ライブレベルメーター、トリガーワードテーブル、テスター（ローカル専用。転送はしません）。
- マイクピッカーは、デバイスが切断されても最後の選択を保持し、切断中のヒントを表示し、復帰するまで一時的にシステムデフォルトへフォールバックします。
- **サウンド**: トリガー検出時と送信時にチャイムを鳴らします。デフォルトはmacOSの「Glass」システムサウンドです。各イベントごとに任意の `NSSound` 読み込み可能ファイル（例: MP3/WAV/AIFF）を選ぶか、**No Sound** を選択できます。

## 転送動作

- Voice Wakeが有効な場合、文字起こしはアクティブなgateway/agentへ転送されます（macアプリのほかの部分と同じlocal/remote modeを使用します）。
- 返信は**最後に使用したmain provider**（WhatsApp/Telegram/Discord/WebChat）へ配信されます。配信に失敗した場合はエラーが記録され、実行結果は引き続きWebChat/session log経由で確認できます。

## 転送ペイロード

- `VoiceWakeForwarder.prefixedTranscript(_:)` は送信前にマシンヒントを先頭に付けます。ウェイクワード経路とpush-to-talk経路の両方で共有されます。

## クイック検証

- push-to-talkをオンにし、Cmd+Fnを押し続けて話し、離します: オーバーレイに部分結果が表示され、その後送信されるはずです。
- 押している間、メニューバーの耳は拡大したままになるはずです（`triggerVoiceEars(ttl:nil)` を使用）。離すと元に戻ります。
