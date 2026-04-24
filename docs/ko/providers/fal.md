---
read_when:
    - OpenClaw에서 fal 이미지 생성을 사용하려고 합니다.
    - '`FAL_KEY` 인증 흐름이 필요합니다.'
    - '`image_generate` 또는 `video_generate`에 대한 fal 기본값이 필요합니다.'
summary: OpenClaw에서 fal 이미지 및 비디오 생성 설정
title: OpenClaw에서 fal 이미지 및 비디오 생성 설정
x-i18n:
    generated_at: "2026-04-24T06:30:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw는 호스팅 이미지 및 비디오 생성을 위한 번들 `fal` 제공자를 제공합니다.

| Property | Value                                                          |
| -------- | -------------------------------------------------------------- |
| Provider | `fal`                                                          |
| Auth     | `FAL_KEY` (표준값, `FAL_API_KEY`도 대체값으로 동작)            |
| API      | fal 모델 엔드포인트                                            |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="기본 이미지 모델 설정">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## 이미지 생성

번들 `fal` 이미지 생성 제공자의 기본값은
`fal/fal-ai/flux/dev`입니다.

| Capability     | Value                       |
| -------------- | --------------------------- |
| 최대 이미지 수 | 요청당 4개                  |
| 편집 모드      | 활성화됨, 참조 이미지 1개   |
| 크기 재정의    | 지원됨                      |
| 종횡비         | 지원됨                      |
| 해상도         | 지원됨                      |

<Warning>
fal 이미지 편집 엔드포인트는 `aspectRatio` 재정의를 지원하지 않습니다.
</Warning>

fal을 기본 이미지 제공자로 사용하려면 다음과 같이 설정하세요.

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## 비디오 생성

번들 `fal` 비디오 생성 제공자의 기본값은
`fal/fal-ai/minimax/video-01-live`입니다.

| Capability | Value                                                         |
| ---------- | ------------------------------------------------------------- |
| 모드       | 텍스트-투-비디오, 단일 이미지 참조                            |
| 런타임     | 장시간 실행 작업을 위한 큐 기반 submit/status/result 흐름     |

<AccordionGroup>
  <Accordion title="사용 가능한 비디오 모델">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 config 예시">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="HeyGen video-agent config 예시">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
최근 추가된 항목을 포함해 사용 가능한 fal 모델 전체 목록은 `openclaw models list --provider fal`로 확인하세요.
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공통 이미지 도구 매개변수 및 제공자 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공통 비디오 도구 매개변수 및 제공자 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    이미지 및 비디오 모델 선택을 포함한 에이전트 기본값.
  </Card>
</CardGroup>
