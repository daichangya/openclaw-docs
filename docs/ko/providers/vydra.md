---
read_when:
    - OpenClaw에서 Vydra 미디어 생성을 사용하려는 경우
    - Vydra API 키 설정 가이드가 필요한 경우
summary: OpenClaw에서 Vydra 이미지, 비디오, 음성 사용하기
title: Vydra
x-i18n:
    generated_at: "2026-04-24T06:33:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 15
---

번들 Vydra Plugin은 다음을 추가합니다.

- `vydra/grok-imagine`을 통한 이미지 생성
- `vydra/veo3` 및 `vydra/kling`을 통한 비디오 생성
- Vydra의 ElevenLabs 기반 TTS 경로를 통한 음성 합성

OpenClaw는 세 가지 capability 모두에 동일한 `VYDRA_API_KEY`를 사용합니다.

<Warning>
Base URL로 `https://www.vydra.ai/api/v1`를 사용하세요.

Vydra의 최상위 호스트(`https://vydra.ai/api/v1`)는 현재 `www`로 리디렉션됩니다. 일부 HTTP 클라이언트는 이 교차 호스트 리디렉션에서 `Authorization`을 제거하므로, 유효한 API 키가 오해를 부르는 인증 실패처럼 보일 수 있습니다. 번들 Plugin은 이를 피하기 위해 `www` base URL을 직접 사용합니다.
</Warning>

## 설정

<Steps>
  <Step title="대화형 온보딩 실행">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    또는 환경 변수를 직접 설정하세요.

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="기본 capability 선택">
    아래 capability 중 하나 이상(이미지, 비디오, 음성)을 선택하고 해당 설정을 적용하세요.
  </Step>
</Steps>

## Capabilities

<AccordionGroup>
  <Accordion title="이미지 생성">
    기본 이미지 모델:

    - `vydra/grok-imagine`

    이를 기본 이미지 provider로 설정:

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

    현재 번들 지원은 text-to-image 전용입니다. Vydra의 호스팅 edit 경로는 원격 이미지 URL을 기대하며, OpenClaw는 아직 번들 Plugin에서 Vydra 전용 업로드 브리지를 추가하지 않았습니다.

    <Note>
    공용 도구 매개변수, provider 선택, 장애 조치 동작은 [Image Generation](/ko/tools/image-generation)을 참조하세요.
    </Note>

  </Accordion>

  <Accordion title="비디오 생성">
    등록된 비디오 모델:

    - text-to-video용 `vydra/veo3`
    - image-to-video용 `vydra/kling`

    Vydra를 기본 비디오 provider로 설정:

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

    - `vydra/veo3`는 번들에서 text-to-video 전용입니다.
    - `vydra/kling`은 현재 원격 이미지 URL 참조가 필요합니다. 로컬 파일 업로드는 초기에 거부됩니다.
    - Vydra의 현재 `kling` HTTP 경로는 `image_url` 또는 `video_url` 중 무엇을 요구하는지 일관되지 않았으며, 번들 provider는 동일한 원격 이미지 URL을 두 필드 모두에 매핑합니다.
    - 번들 Plugin은 보수적으로 동작하며 aspect ratio, resolution, watermark, 생성 오디오 같은 문서화되지 않은 스타일 조절 값은 전달하지 않습니다.

    <Note>
    공용 도구 매개변수, provider 선택, 장애 조치 동작은 [Video Generation](/ko/tools/video-generation)을 참조하세요.
    </Note>

  </Accordion>

  <Accordion title="비디오 라이브 테스트">
    provider별 라이브 커버리지:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    번들 Vydra 라이브 파일은 이제 다음을 다룹니다.

    - `vydra/veo3` text-to-video
    - 원격 이미지 URL을 사용하는 `vydra/kling` image-to-video

    필요하면 원격 이미지 fixture를 재정의하세요.

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="음성 합성">
    Vydra를 speech provider로 설정:

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
    - 음성 id: `21m00Tcm4TlvDq8ikWAM`

    번들 Plugin은 현재 하나의 안정적인 기본 음성만 노출하며 MP3 오디오 파일을 반환합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Provider 디렉터리" href="/ko/providers/index" icon="list">
    사용 가능한 모든 provider 찾아보기
  </Card>
  <Card title="Image generation" href="/ko/tools/image-generation" icon="image">
    공용 이미지 도구 매개변수 및 provider 선택
  </Card>
  <Card title="Video generation" href="/ko/tools/video-generation" icon="video">
    공용 비디오 도구 매개변수 및 provider 선택
  </Card>
  <Card title="Configuration reference" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    에이전트 기본값 및 모델 설정
  </Card>
</CardGroup>
