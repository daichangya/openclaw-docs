---
read_when:
    - 미디어 기능의 개요를 찾고 있습니다
    - 어떤 미디어 provider를 구성할지 결정하고 있습니다
    - 비동기 미디어 생성이 어떻게 동작하는지 이해하고 있습니다
summary: 미디어 생성, 이해, 음성 기능을 위한 통합 랜딩 페이지
title: 미디어 개요
x-i18n:
    generated_at: "2026-04-07T06:02:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfee08eb91ec3e827724c8fa99bff7465356f6f1ac1b146562f35651798e3fd6
    source_path: tools/media-overview.md
    workflow: 15
---

# 미디어 생성 및 이해

OpenClaw는 이미지, 비디오, 음악을 생성하고, 수신 미디어(이미지, 오디오, 비디오)를 이해하며, 텍스트 음성 변환으로 응답을 소리 내어 읽습니다. 모든 미디어 기능은 도구 기반으로 동작합니다. 에이전트는 대화에 따라 언제 사용할지 결정하며, 각 도구는 이를 지원하는 provider가 하나 이상 구성된 경우에만 표시됩니다.

## 기능 한눈에 보기

| 기능 | 도구 | Providers | 수행 내용 |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 이미지 생성 | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra | 텍스트 프롬프트 또는 참조를 기반으로 이미지를 생성하거나 편집 |
| 비디오 생성 | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | 텍스트, 이미지 또는 기존 비디오로 비디오 생성 |
| 음악 생성 | `music_generate` | ComfyUI, Google, MiniMax | 텍스트 프롬프트로 음악 또는 오디오 트랙 생성 |
| 텍스트 음성 변환(TTS) | `tts` | ElevenLabs, Microsoft, MiniMax, OpenAI | 발신 응답을 음성 오디오로 변환 |
| 미디어 이해 | (automatic) | 비전/오디오 지원 모델 provider, 그리고 CLI 대체 경로 | 수신 이미지, 오디오, 비디오 요약 |

## provider 기능 매트릭스

이 표는 플랫폼 전반에서 각 provider가 어떤 미디어 기능을 지원하는지 보여줍니다.

| Provider | Image | Video | Music | TTS | STT / 전사 | 미디어 이해 |
| ---------- | ----- | ----- | ----- | --- | ------------------- | ------------------- |
| Alibaba    |       | Yes   |       |     |                     |                     |
| BytePlus   |       | Yes   |       |     |                     |                     |
| ComfyUI    | Yes   | Yes   | Yes   |     |                     |                     |
| Deepgram   |       |       |       |     | Yes                 |                     |
| ElevenLabs |       |       |       | Yes |                     |                     |
| fal        | Yes   | Yes   |       |     |                     |                     |
| Google     | Yes   | Yes   | Yes   |     |                     | Yes                 |
| Microsoft  |       |       |       | Yes |                     |                     |
| MiniMax    | Yes   | Yes   | Yes   | Yes |                     |                     |
| OpenAI     | Yes   | Yes   |       | Yes | Yes                 | Yes                 |
| Qwen       |       | Yes   |       |     |                     |                     |
| Runway     |       | Yes   |       |     |                     |                     |
| Together   |       | Yes   |       |     |                     |                     |
| Vydra      | Yes   | Yes   |       |     |                     |                     |
| xAI        |       | Yes   |       |     |                     |                     |

<Note>
미디어 이해는 provider config에 등록된 모든 비전 지원 또는 오디오 지원 모델을 사용합니다. 위 표는 전용 미디어 이해 지원이 있는 provider를 강조합니다. 멀티모달 모델이 있는 대부분의 LLM provider(Anthropic, Google, OpenAI 등)도 활성 응답 모델로 구성되어 있으면 수신 미디어를 이해할 수 있습니다.
</Note>

## 비동기 생성이 동작하는 방식

비디오 및 음악 생성은 provider 처리에 보통 30초에서 몇 분까지 걸리므로 백그라운드 작업으로 실행됩니다. 에이전트가 `video_generate` 또는 `music_generate`를 호출하면, OpenClaw는 요청을 provider에 제출하고, 즉시 작업 ID를 반환하며, 작업 원장에 해당 작업을 추적합니다. 작업이 실행되는 동안 에이전트는 다른 메시지에 계속 응답합니다. provider가 작업을 마치면, OpenClaw는 에이전트를 다시 깨워 완료된 미디어를 원래 채널에 게시할 수 있게 합니다. 이미지 생성과 TTS는 동기식이며 응답과 함께 인라인으로 완료됩니다.

## 빠른 링크

- [이미지 생성](/ko/tools/image-generation) -- 이미지 생성 및 편집
- [비디오 생성](/ko/tools/video-generation) -- 텍스트-비디오, 이미지-비디오, 비디오-비디오
- [음악 생성](/ko/tools/music-generation) -- 음악 및 오디오 트랙 생성
- [텍스트 음성 변환](/ko/tools/tts) -- 응답을 음성 오디오로 변환
- [미디어 이해](/ko/nodes/media-understanding) -- 수신 이미지, 오디오, 비디오 이해
