---
read_when:
    - 미디어 기능 개요를 찾고 있습니다
    - 구성할 미디어 제공자를 결정 중입니다
    - 비동기 미디어 생성이 어떻게 작동하는지 이해 중입니다
summary: 미디어 생성, 이해 및 음성 기능을 위한 통합 랜딩 페이지
title: 미디어 개요
x-i18n:
    generated_at: "2026-04-25T12:29:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: c674df701b88c807842078b2e2e53821f1b2fc6037fd2e4d688caea147e769f1
    source_path: tools/media-overview.md
    workflow: 15
---

# 미디어 생성 및 이해

OpenClaw는 이미지, 비디오, 음악을 생성하고, 인바운드 미디어(이미지, 오디오, 비디오)를 이해하며, text-to-speech로 응답을 음성으로 읽을 수 있습니다. 모든 미디어 기능은 도구 기반입니다. 에이전트가 대화에 따라 언제 사용할지 결정하며, 각 도구는 이를 지원하는 제공자가 하나 이상 구성된 경우에만 표시됩니다.

## 기능 한눈에 보기

| 기능                  | 도구             | 제공자                                                                                      | 수행 내용                                                |
| --------------------- | ---------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 이미지 생성           | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                           | 텍스트 프롬프트 또는 참조로 이미지를 생성하거나 편집     |
| 비디오 생성           | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | 텍스트, 이미지 또는 기존 비디오로 비디오 생성            |
| 음악 생성             | `music_generate` | ComfyUI, Google, MiniMax                                                                    | 텍스트 프롬프트로 음악 또는 오디오 트랙 생성             |
| Text-to-speech (TTS)  | `tts`            | ElevenLabs, Google, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI, Xiaomi MiMo | 아웃바운드 응답을 음성 오디오로 변환                     |
| 미디어 이해           | (자동)           | 모든 비전/오디오 가능 모델 제공자 및 CLI 폴백                                               | 인바운드 이미지, 오디오, 비디오 요약                     |

## 제공자 기능 매트릭스

이 표는 플랫폼 전체에서 각 제공자가 어떤 미디어 기능을 지원하는지 보여줍니다.

| 제공자      | 이미지 | 비디오 | 음악 | TTS | STT / 전사 | 실시간 음성 | 미디어 이해 |
| ----------- | ------ | ------ | ---- | --- | ---------- | ----------- | ----------- |
| Alibaba     |        | Yes    |      |     |            |             |             |
| BytePlus    |        | Yes    |      |     |            |             |             |
| ComfyUI     | Yes    | Yes    | Yes  |     |            |             |             |
| Deepgram    |        |        |      |     | Yes        | Yes         |             |
| ElevenLabs  |        |        |      | Yes | Yes        |             |             |
| fal         | Yes    | Yes    |      |     |            |             |             |
| Google      | Yes    | Yes    | Yes  | Yes |            | Yes         | Yes         |
| Gradium     |        |        |      | Yes |            |             |             |
| Local CLI   |        |        |      | Yes |            |             |             |
| Microsoft   |        |        |      | Yes |            |             |             |
| MiniMax     | Yes    | Yes    | Yes  | Yes |            |             |             |
| Mistral     |        |        |      |     | Yes        |             |             |
| OpenAI      | Yes    | Yes    |      | Yes | Yes        | Yes         | Yes         |
| Qwen        |        | Yes    |      |     |            |             |             |
| Runway      |        | Yes    |      |     |            |             |             |
| SenseAudio  |        |        |      |     | Yes        |             |             |
| Together    |        | Yes    |      |     |            |             |             |
| Vydra       | Yes    | Yes    |      | Yes |            |             |             |
| xAI         | Yes    | Yes    |      | Yes | Yes        |             | Yes         |
| Xiaomi MiMo | Yes    |        |      | Yes |            |             | Yes         |

<Note>
미디어 이해는 제공자 구성에 등록된 모든 비전 가능 또는 오디오 가능 모델을 사용합니다. 위 표는 전용 미디어 이해 지원이 있는 제공자를 강조한 것입니다. 대부분의 멀티모달 모델 제공자(Anthropic, Google, OpenAI 등)도 활성 응답 모델로 구성되어 있으면 인바운드 미디어를 이해할 수 있습니다.
</Note>

## 비동기 생성 방식

비디오 및 음악 생성은 제공자 처리가 일반적으로 30초에서 수분까지 걸리기 때문에 백그라운드 작업으로 실행됩니다. 에이전트가 `video_generate` 또는 `music_generate`를 호출하면 OpenClaw는 요청을 제공자에게 제출하고, 즉시 작업 ID를 반환하며, task ledger에서 작업을 추적합니다. 작업이 실행되는 동안에도 에이전트는 다른 메시지에 계속 응답합니다. 제공자 처리가 완료되면 OpenClaw가 에이전트를 깨워 원래 채널에 완성된 미디어를 다시 게시할 수 있게 합니다. 이미지 생성과 TTS는 동기식이며 응답과 함께 인라인으로 완료됩니다.

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio, xAI는 구성된 경우 배치 `tools.media.audio` 경로를 통해 인바운드 오디오를 전사할 수 있습니다. Deepgram, ElevenLabs, Mistral, OpenAI, xAI는 Voice Call 스트리밍 STT 제공자도 등록하므로, 실시간 전화 오디오를 완료된 녹음을 기다리지 않고 선택한 공급업체로 전달할 수 있습니다.

Google은 OpenClaw의 이미지, 비디오, 음악, 배치 TTS, 백엔드 실시간 음성, 미디어 이해 표면에 매핑됩니다. OpenAI는 OpenClaw의 이미지, 비디오, 배치 TTS, 배치 STT, Voice Call 스트리밍 STT, 백엔드 실시간 음성, 메모리 임베딩 표면에 매핑됩니다. xAI는 현재 OpenClaw의 이미지, 비디오, 검색, 코드 실행, 배치 TTS, 배치 STT, Voice Call 스트리밍 STT 표면에 매핑됩니다. xAI Realtime 음성은 업스트림 기능이지만, 공유 실시간 음성 계약이 이를 표현할 수 있을 때까지 OpenClaw에는 등록되지 않습니다.

## 빠른 링크

- [Image Generation](/ko/tools/image-generation) -- 이미지 생성 및 편집
- [Video Generation](/ko/tools/video-generation) -- text-to-video, image-to-video, video-to-video
- [Music Generation](/ko/tools/music-generation) -- 음악 및 오디오 트랙 생성
- [Text-to-Speech](/ko/tools/tts) -- 응답을 음성 오디오로 변환
- [Media Understanding](/ko/nodes/media-understanding) -- 인바운드 이미지, 오디오, 비디오 이해

## 관련 문서

- [Image generation](/ko/tools/image-generation)
- [Video generation](/ko/tools/video-generation)
- [Music generation](/ko/tools/music-generation)
- [Text-to-speech](/ko/tools/tts)
