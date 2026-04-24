---
read_when:
    - 미디어 파이프라인 또는 첨부 파일 수정하기
summary: send, Gateway, 에이전트 응답을 위한 이미지 및 미디어 처리 규칙
title: 이미지 및 미디어 지원
x-i18n:
    generated_at: "2026-04-24T06:22:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26fa460f7dcdac9f15c9d79c3c3370adbce526da5cfa9a6825a8ed20b41e0a29
    source_path: nodes/images.md
    workflow: 15
---

# 이미지 및 미디어 지원 (2025-12-05)

WhatsApp 채널은 **Baileys Web**을 통해 실행됩니다. 이 문서는 send, Gateway, 에이전트 응답에 대한 현재 미디어 처리 규칙을 정리합니다.

## 목표

- `openclaw message send --media`를 통해 선택적 캡션과 함께 미디어를 전송합니다.
- 웹 받은편지함의 자동 응답이 텍스트와 함께 미디어도 포함할 수 있도록 합니다.
- 유형별 제한을 합리적이고 예측 가능하게 유지합니다.

## CLI 표면

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media`는 선택 사항이며, 미디어 전용 전송을 위해 캡션은 비워 둘 수 있습니다.
  - `--dry-run`은 해석된 페이로드를 출력하고, `--json`은 `{ channel, to, messageId, mediaUrl, caption }`를 출력합니다.

## WhatsApp Web 채널 동작

- 입력: 로컬 파일 경로 **또는** HTTP(S) URL.
- 흐름: Buffer로 로드하고, 미디어 종류를 감지한 뒤, 올바른 페이로드를 구성합니다:
  - **이미지:** `channels.whatsapp.mediaMaxMb`(기본값: 50 MB)를 목표로 JPEG로 리사이즈 및 재압축(최대 변 2048px).
  - **오디오/음성/비디오:** 16 MB까지는 그대로 통과하며, 오디오는 음성 노트(`ptt: true`)로 전송됩니다.
  - **문서:** 그 외 모든 항목은 100 MB까지 허용하며, 가능한 경우 파일명을 보존합니다.
- WhatsApp GIF 스타일 재생: `gifPlayback: true`가 포함된 MP4를 전송합니다(CLI: `--gif-playback`). 그러면 모바일 클라이언트에서 인라인 반복 재생됩니다.
- MIME 감지는 매직 바이트를 우선하고, 그다음 헤더, 그다음 파일 확장자를 사용합니다.
- 캡션은 `--message` 또는 `reply.text`에서 오며, 빈 캡션도 허용됩니다.
- 로깅: 비상세 모드에서는 `↩️`/`✅`만 표시하고, 상세 모드에서는 크기와 소스 경로/URL도 포함합니다.

## 자동 응답 파이프라인

- `getReplyFromConfig`는 `{ text?, mediaUrl?, mediaUrls? }`를 반환합니다.
- 미디어가 존재하면 웹 전송기는 `openclaw message send`와 동일한 파이프라인을 사용해 로컬 경로나 URL을 해석합니다.
- 여러 개의 미디어 항목이 제공되면 순차적으로 전송됩니다.

## 명령(Pi)에 대한 인바운드 미디어

- 인바운드 웹 메시지에 미디어가 포함되어 있으면, OpenClaw는 이를 임시 파일에 다운로드하고 다음 템플릿 변수들을 노출합니다:
  - `{{MediaUrl}}` 인바운드 미디어를 가리키는 pseudo-URL.
  - `{{MediaPath}}` 명령 실행 전에 기록되는 로컬 임시 경로.
- 세션별 Docker 샌드박스가 활성화된 경우, 인바운드 미디어는 샌드박스 워크스페이스로 복사되며 `MediaPath`/`MediaUrl`은 `media/inbound/<filename>` 같은 상대 경로로 다시 작성됩니다.
- 미디어 이해(`tools.media.*` 또는 공유 `tools.media.models`로 구성된 경우)는 템플릿 적용 전에 실행되며, `Body`에 `[Image]`, `[Audio]`, `[Video]` 블록을 삽입할 수 있습니다.
  - 오디오는 `{{Transcript}}`를 설정하고, 슬래시 명령이 계속 동작하도록 명령 파싱에 전사 텍스트를 사용합니다.
  - 비디오 및 이미지 설명은 명령 파싱을 위해 캡션 텍스트를 보존합니다.
  - 활성 기본 이미지 모델이 이미 네이티브 비전 지원을 한다면, OpenClaw는 `[Image]` 요약 블록을 건너뛰고 원본 이미지를 모델에 직접 전달합니다.
- 기본적으로 일치하는 첫 번째 이미지/오디오/비디오 첨부 파일만 처리됩니다. 여러 첨부 파일을 처리하려면 `tools.media.<cap>.attachments`를 설정하세요.

## 제한 및 오류

**아웃바운드 전송 한도(WhatsApp 웹 전송)**

- 이미지: 재압축 후 `channels.whatsapp.mediaMaxMb`(기본값: 50 MB)까지.
- 오디오/음성/비디오: 16 MB 제한, 문서: 100 MB 제한.
- 너무 크거나 읽을 수 없는 미디어 → 로그에 명확한 오류를 남기고 응답은 건너뜁니다.

**미디어 이해 한도(전사/설명)**

- 이미지 기본값: 10 MB (`tools.media.image.maxBytes`).
- 오디오 기본값: 20 MB (`tools.media.audio.maxBytes`).
- 비디오 기본값: 50 MB (`tools.media.video.maxBytes`).
- 너무 큰 미디어는 이해 단계를 건너뛰지만, 원래 본문을 포함한 응답 자체는 여전히 진행됩니다.

## 테스트 참고

- 이미지/오디오/문서 사례에 대해 send + reply 흐름을 다루세요.
- 이미지 재압축(크기 제한)과 오디오의 음성 노트 플래그를 검증하세요.
- 다중 미디어 응답이 순차 전송으로 분기되는지 확인하세요.

## 관련 문서

- [카메라 캡처](/ko/nodes/camera)
- [미디어 이해](/ko/nodes/media-understanding)
- [오디오 및 음성 노트](/ko/nodes/audio)
