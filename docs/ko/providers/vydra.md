---
read_when:
    - OpenClaw에서 Vydra 미디어 생성을 사용하려는 경우
    - Vydra API 키 설정 가이드가 필요한 경우
summary: OpenClaw에서 Vydra 이미지, 비디오, 음성을 사용합니다
title: Vydra
x-i18n:
    generated_at: "2026-04-07T05:59:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24006a687ed6f9792e7b2b10927cc7ad71c735462a92ce03d5fa7c2b2ee2fcc2
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

번들된 Vydra 플러그인은 다음을 추가합니다:

- `vydra/grok-imagine`를 통한 이미지 생성
- `vydra/veo3` 및 `vydra/kling`을 통한 비디오 생성
- Vydra의 ElevenLabs 기반 TTS 경로를 통한 음성 합성

OpenClaw는 이 세 가지 기능 모두에 동일한 `VYDRA_API_KEY`를 사용합니다.

## 중요한 기본 URL

`https://www.vydra.ai/api/v1`을 사용하세요.

Vydra의 apex 호스트(`https://vydra.ai/api/v1`)는 현재 `www`로 리디렉션됩니다. 일부 HTTP 클라이언트는 이 교차 호스트 리디렉션에서 `Authorization`을 삭제하므로, 유효한 API 키가 오해를 부르는 인증 실패로 바뀔 수 있습니다. 번들된 플러그인은 이를 피하기 위해 `www` 기본 URL을 직접 사용합니다.

## 설정

대화형 온보딩:

```bash
openclaw onboard --auth-choice vydra-api-key
```

또는 환경 변수를 직접 설정하세요:

```bash
export VYDRA_API_KEY="vydra_live_..."
```

## 이미지 생성

기본 이미지 모델:

- `vydra/grok-imagine`

기본 이미지 프로바이더로 설정:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "vydra/grok-imagine",
      },
    },
  },
}
```

현재 번들 지원은 text-to-image만 포함합니다. Vydra의 호스팅된 편집 경로는 원격 이미지 URL을 기대하며, OpenClaw는 아직 번들 플러그인에 Vydra 전용 업로드 브리지를 추가하지 않았습니다.

공유 도구 동작은 [이미지 생성](/ko/tools/image-generation)을 참조하세요.

## 비디오 생성

등록된 비디오 모델:

- text-to-video용 `vydra/veo3`
- image-to-video용 `vydra/kling`

Vydra를 기본 비디오 프로바이더로 설정:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "vydra/veo3",
      },
    },
  },
}
```

참고:

- `vydra/veo3`는 번들에서 text-to-video 전용으로 제공됩니다.
- `vydra/kling`은 현재 원격 이미지 URL 참조가 필요합니다. 로컬 파일 업로드는 시작 전에 거부됩니다.
- Vydra의 현재 `kling` HTTP 경로는 `image_url`과 `video_url` 중 무엇을 요구하는지 일관되지 않았습니다. 번들 프로바이더는 동일한 원격 이미지 URL을 두 필드 모두에 매핑합니다.
- 번들 플러그인은 보수적으로 동작하며 종횡비, 해상도, 워터마크, 생성된 오디오와 같은 문서화되지 않은 스타일 옵션은 전달하지 않습니다.

프로바이더별 live 커버리지:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_VYDRA_VIDEO=1 \
pnpm test:live -- extensions/vydra/vydra.live.test.ts
```

번들된 Vydra live 파일은 이제 다음을 다룹니다:

- `vydra/veo3` text-to-video
- 원격 이미지 URL을 사용하는 `vydra/kling` image-to-video

필요한 경우 원격 이미지 픽스처를 재정의하세요:

```bash
export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
```

공유 도구 동작은 [비디오 생성](/ko/tools/video-generation)을 참조하세요.

## 음성 합성

Vydra를 음성 프로바이더로 설정:

```json5
{
  messages: {
    tts: {
      provider: "vydra",
      providers: {
        vydra: {
          apiKey: "${VYDRA_API_KEY}",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
        },
      },
    },
  },
}
```

기본값:

- 모델: `elevenlabs/tts`
- 음성 ID: `21m00Tcm4TlvDq8ikWAM`

번들 플러그인은 현재 정상 동작이 확인된 기본 음성 하나를 노출하며 MP3 오디오 파일을 반환합니다.

## 관련 항목

- [프로바이더 디렉터리](/ko/providers/index)
- [이미지 생성](/ko/tools/image-generation)
- [비디오 생성](/ko/tools/video-generation)
