---
read_when:
    - macOS/iOS/Android에서 Talk 모드 구현하기
    - 음성/TTS/중단 동작 변경하기
summary: 'Talk 모드: ElevenLabs TTS를 사용한 연속 음성 대화'
title: Talk 모드
x-i18n:
    generated_at: "2026-04-24T06:23:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49286cd39a104d4514eb1df75627a2f64182313b11792bb246f471178a702198
    source_path: nodes/talk.md
    workflow: 15
---

Talk 모드는 연속 음성 대화 루프입니다:

1. 음성을 듣습니다
2. 전사를 모델에 보냅니다(main 세션, chat.send)
3. 응답을 기다립니다
4. 구성된 Talk Provider(`talk.speak`)로 응답을 말합니다

## 동작 (macOS)

- Talk 모드가 활성화되어 있는 동안 **항상 켜진 오버레이**가 표시됩니다.
- **Listening → Thinking → Speaking** 단계 전환이 있습니다.
- **짧은 멈춤**(무음 구간)이 감지되면 현재 전사가 전송됩니다.
- 응답은 **WebChat에 기록**됩니다(타이핑과 동일).
- **음성에 의한 중단**(기본값 켜짐): 어시스턴트가 말하는 도중 사용자가 말을 시작하면, 재생을 중지하고 다음 프롬프트를 위해 중단 타임스탬프를 기록합니다.

## 응답의 음성 지시문

어시스턴트는 음성을 제어하기 위해 응답 앞에 **단일 JSON 줄**을 붙일 수 있습니다:

```json
{ "voice": "<voice-id>", "once": true }
```

규칙:

- 비어 있지 않은 첫 번째 줄만 사용합니다.
- 알 수 없는 키는 무시됩니다.
- `once: true`는 현재 응답에만 적용됩니다.
- `once`가 없으면 해당 음성이 Talk 모드의 새 기본값이 됩니다.
- JSON 줄은 TTS 재생 전에 제거됩니다.

지원되는 키:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## 구성 (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

기본값:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 설정하지 않으면 Talk는 전사를 보내기 전에 플랫폼 기본 일시정지 구간을 유지합니다(`macOS와 Android는 700 ms, iOS는 900 ms`)
- `voiceId`: `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`로 폴백(또는 API 키가 있으면 첫 번째 ElevenLabs 음성)
- `modelId`: 설정하지 않으면 기본값은 `eleven_v3`
- `apiKey`: `ELEVENLABS_API_KEY`로 폴백(또는 가능하면 Gateway 셸 프로필)
- `outputFormat`: macOS/iOS에서는 기본 `pcm_44100`, Android에서는 `pcm_24000`(MP3 스트리밍을 강제하려면 `mp3_*` 설정)

## macOS UI

- 메뉴 막대 토글: **Talk**
- 구성 탭: **Talk Mode** 그룹(voice id + interrupt 토글)
- 오버레이:
  - **Listening**: 마이크 레벨에 따라 구름이 펄스
  - **Thinking**: 가라앉는 애니메이션
  - **Speaking**: 퍼져 나가는 링
  - 구름 클릭: 말하기 중지
  - X 클릭: Talk 모드 종료

## 참고

- Speech + Microphone 권한이 필요합니다.
- 세션 키 `main`에 대해 `chat.send`를 사용합니다.
- Gateway는 활성 Talk Provider를 사용해 `talk.speak`를 통해 Talk 재생을 해석합니다. Android는 해당 RPC를 사용할 수 없을 때만 로컬 시스템 TTS로 폴백합니다.
- `eleven_v3`의 `stability`는 `0.0`, `0.5`, `1.0`으로 검증되며, 다른 모델은 `0..1`을 허용합니다.
- `latency_tier`는 설정된 경우 `0..4`로 검증됩니다.
- Android는 낮은 지연 AudioTrack 스트리밍을 위해 `pcm_16000`, `pcm_22050`, `pcm_24000`, `pcm_44100` 출력 형식을 지원합니다.

## 관련 문서

- [Voice wake](/ko/nodes/voicewake)
- [오디오 및 음성 노트](/ko/nodes/audio)
- [미디어 이해](/ko/nodes/media-understanding)
