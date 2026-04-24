---
read_when:
    - 미디어 기능 개요를 찾고 계신가요?
    - 구성할 미디어 제공자를 결정하기
    - 비동기 미디어 생성이 작동하는 방식을 이해하기
summary: 미디어 생성, 이해 및 음성 기능을 위한 통합 랜딩 페이지
title: 미디어 개요
x-i18n:
    generated_at: "2026-04-24T09:51:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39848c6104ebd4feeb37b233b70f3312fa076b535c3b3780336729eb9fdfa4e6
    source_path: tools/media-overview.md
    workflow: 15
---

# 미디어 생성 및 이해

OpenClaw는 이미지, 비디오, 음악을 생성하고, 수신 미디어(이미지, 오디오, 비디오)를 이해하며, 텍스트 음성 변환으로 응답을 소리 내어 말합니다. 모든 미디어 기능은 도구 기반으로 동작합니다. 에이전트는 대화를 바탕으로 언제 사용할지 결정하며, 각 도구는 이를 지원하는 제공자가 하나 이상 구성된 경우에만 표시됩니다.

## 한눈에 보는 기능

| 기능                 | 도구             | 제공자                                                                                      | 수행 작업                                                |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 이미지 생성          | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                           | 텍스트 프롬프트 또는 참조를 바탕으로 이미지를 생성하거나 편집합니다 |
| 비디오 생성          | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | 텍스트, 이미지 또는 기존 비디오로 비디오를 생성합니다    |
| 음악 생성            | `music_generate` | ComfyUI, Google, MiniMax                                                                    | 텍스트 프롬프트로 음악 또는 오디오 트랙을 생성합니다     |
| 텍스트 음성 변환(TTS) | `tts`            | ElevenLabs, Google, Microsoft, MiniMax, OpenAI, xAI                                         | 발신 응답을 음성 오디오로 변환합니다                     |
| 미디어 이해          | (자동)           | 비전/오디오 지원 모델 제공자 또는 CLI 대체 경로                                             | 수신 이미지, 오디오, 비디오를 요약합니다                |

## 제공자 기능 매트릭스

이 표는 플랫폼 전체에서 각 제공자가 어떤 미디어 기능을 지원하는지 보여줍니다.

| 제공자     | 이미지 | 비디오 | 음악 | TTS | STT / 전사 | 실시간 음성 | 미디어 이해 |
| ---------- | ------ | ------ | ---- | --- | ---------- | ----------- | ----------- |
| Alibaba    |        | 예     |      |     |            |             |             |
| BytePlus   |        | 예     |      |     |            |             |             |
| ComfyUI    | 예     | 예     | 예   |     |            |             |             |
| Deepgram   |        |        |      |     | 예         |             |             |
| ElevenLabs |        |        |      | 예  | 예         |             |             |
| fal        | 예     | 예     |      |     |            |             |             |
| Google     | 예     | 예     | 예   | 예  |            | 예          | 예          |
| Microsoft  |        |        |      | 예  |            |             |             |
| MiniMax    | 예     | 예     | 예   | 예  |            |             |             |
| Mistral    |        |        |      |     | 예         |             |             |
| OpenAI     | 예     | 예     |      | 예  | 예         | 예          | 예          |
| Qwen       |        | 예     |      |     |            |             |             |
| Runway     |        | 예     |      |     |            |             |             |
| Together   |        | 예     |      |     |            |             |             |
| Vydra      | 예     | 예     |      |     |            |             |             |
| xAI        | 예     | 예     |      | 예  | 예         |             | 예          |

<Note>
미디어 이해는 제공자 구성에 등록된 비전 지원 또는 오디오 지원 모델을 사용합니다. 위 표는 전용 미디어 이해 지원이 있는 제공자를 강조해 보여줍니다. 멀티모달 모델을 지원하는 대부분의 LLM 제공자(Anthropic, Google, OpenAI 등)도 활성 응답 모델로 구성되어 있으면 수신 미디어를 이해할 수 있습니다.
</Note>

## 비동기 생성 작동 방식

비디오 및 음악 생성은 제공자 처리에 일반적으로 30초에서 몇 분까지 걸리므로 백그라운드 작업으로 실행됩니다. 에이전트가 `video_generate` 또는 `music_generate`를 호출하면 OpenClaw는 요청을 제공자에 제출하고, 즉시 작업 ID를 반환한 다음, 작업 원장에 해당 작업을 추적합니다. 작업이 실행되는 동안 에이전트는 다른 메시지에 계속 응답합니다. 제공자 처리가 완료되면 OpenClaw는 에이전트를 다시 깨워 원래 채널에 완성된 미디어를 게시할 수 있게 합니다. 이미지 생성과 TTS는 동기식으로 실행되며 응답과 함께 인라인으로 완료됩니다.

Deepgram, ElevenLabs, Mistral, OpenAI, xAI는 모두 구성된 경우 일괄 `tools.media.audio` 경로를 통해 수신 오디오를 전사할 수 있습니다. Deepgram, ElevenLabs, Mistral, OpenAI, xAI는 Voice Call 스트리밍 STT 제공자도 등록하므로, 완료된 녹음을 기다리지 않고 실시간 전화 오디오를 선택한 벤더로 전달할 수 있습니다.

Google은 OpenClaw의 이미지, 비디오, 음악, 일괄 TTS, 백엔드 실시간 음성 및 미디어 이해 표면에 매핑됩니다. OpenAI는 OpenClaw의 이미지, 비디오, 일괄 TTS, 일괄 STT, Voice Call 스트리밍 STT, 백엔드 실시간 음성 및 메모리 임베딩 표면에 매핑됩니다. xAI는 현재 OpenClaw의 이미지, 비디오, 검색, 코드 실행, 일괄 TTS, 일괄 STT 및 Voice Call 스트리밍 STT 표면에 매핑됩니다. xAI Realtime 음성은 업스트림 기능이지만, 공유 실시간 음성 계약이 이를 표현할 수 있을 때까지는 OpenClaw에 등록되지 않습니다.

## 빠른 링크

- [이미지 생성](/ko/tools/image-generation) -- 이미지 생성 및 편집
- [비디오 생성](/ko/tools/video-generation) -- 텍스트-비디오, 이미지-비디오 및 비디오-비디오
- [음악 생성](/ko/tools/music-generation) -- 음악 및 오디오 트랙 생성
- [텍스트 음성 변환](/ko/tools/tts) -- 응답을 음성 오디오로 변환
- [미디어 이해](/ko/nodes/media-understanding) -- 수신 이미지, 오디오 및 비디오 이해

## 관련 항목

- [이미지 생성](/ko/tools/image-generation)
- [비디오 생성](/ko/tools/video-generation)
- [음악 생성](/ko/tools/music-generation)
- [텍스트 음성 변환](/ko/tools/tts)
