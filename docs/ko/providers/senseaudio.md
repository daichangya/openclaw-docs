---
read_when:
    - 오디오 첨부 파일에 SenseAudio speech-to-text를 사용하려고 합니다
    - SenseAudio API 키 env var 또는 오디오 구성 경로가 필요합니다
summary: 인바운드 음성 노트를 위한 SenseAudio 배치 speech-to-text
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T12:28:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

SenseAudio는 OpenClaw의 공유 `tools.media.audio` 파이프라인을 통해 인바운드 오디오/음성 노트 첨부 파일을 전사할 수 있습니다. OpenClaw는 multipart 오디오를 OpenAI 호환 전사 엔드포인트로 전송하고, 반환된 텍스트를 `{{Transcript}}`와 `[Audio]` 블록으로 주입합니다.

| 세부 정보    | 값                                               |
| ------------ | ------------------------------------------------ |
| 웹사이트     | [senseaudio.cn](https://senseaudio.cn)           |
| 문서         | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| 인증         | `SENSEAUDIO_API_KEY`                             |
| 기본 모델    | `senseaudio-asr-pro-1.5-260319`                  |
| 기본 URL     | `https://api.senseaudio.cn/v1`                   |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="오디오 제공자 활성화">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="음성 노트 보내기">
    연결된 아무 채널에서나 오디오 메시지를 보내세요. OpenClaw는 오디오를
    SenseAudio에 업로드하고 응답 파이프라인에서 전사문을 사용합니다.
  </Step>
</Steps>

## 옵션

| 옵션         | 경로                                  | 설명                              |
| ------------ | ------------------------------------- | --------------------------------- |
| `model`      | `tools.media.audio.models[].model`    | SenseAudio ASR 모델 ID            |
| `language`   | `tools.media.audio.models[].language` | 선택적 언어 힌트                  |
| `prompt`     | `tools.media.audio.prompt`            | 선택적 전사 프롬프트              |
| `baseUrl`    | `tools.media.audio.baseUrl` 또는 모델 | OpenAI 호환 base 재정의           |
| `headers`    | `tools.media.audio.request.headers`   | 추가 요청 헤더                    |

<Note>
SenseAudio는 OpenClaw에서 배치 STT 전용입니다. Voice Call 실시간 전사는
계속해서 스트리밍 STT를 지원하는 제공자를 사용합니다.
</Note>
