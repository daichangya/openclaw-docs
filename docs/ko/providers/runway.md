---
read_when:
    - OpenClaw에서 Runway 비디오 생성을 사용하려고 합니다
    - Runway API 키/환경 설정이 필요합니다
    - Runway를 기본 비디오 provider로 설정하려고 합니다
summary: OpenClaw에서 Runway 비디오 생성 설정하기
title: Runway
x-i18n:
    generated_at: "2026-04-24T06:32:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
    source_path: providers/runway.md
    workflow: 15
---

OpenClaw에는 호스팅 비디오 생성을 위한 번들 `runway` provider가 포함되어 있습니다.

| Property    | Value                                                             |
| ----------- | ----------------------------------------------------------------- |
| Provider id | `runway`                                                          |
| Auth        | `RUNWAYML_API_SECRET`(기본) 또는 `RUNWAY_API_KEY`                 |
| API         | Runway 작업 기반 비디오 생성(`GET /v1/tasks/{id}` 폴링)           |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Runway를 기본 비디오 provider로 설정">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="비디오 생성">
    에이전트에게 비디오 생성을 요청하세요. Runway가 자동으로 사용됩니다.
  </Step>
</Steps>

## 지원 모드

| Mode           | Model              | Reference input          |
| -------------- | ------------------ | ------------------------ |
| Text-to-video  | `gen4.5` (기본값)  | 없음                     |
| Image-to-video | `gen4.5`           | 로컬 또는 원격 이미지 1개 |
| Video-to-video | `gen4_aleph`       | 로컬 또는 원격 비디오 1개 |

<Note>
로컬 이미지 및 비디오 참조는 data URI를 통해 지원됩니다. 텍스트 전용 실행은 현재 `16:9` 및 `9:16` 화면비를 노출합니다.
</Note>

<Warning>
현재 Video-to-video는 반드시 `runway/gen4_aleph`를 사용해야 합니다.
</Warning>

## 구성

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## 고급 구성

<AccordionGroup>
  <Accordion title="환경 변수 별칭">
    OpenClaw는 `RUNWAYML_API_SECRET`(기본)과 `RUNWAY_API_KEY`를 모두 인식합니다.
    어느 변수를 사용해도 Runway provider 인증이 가능합니다.
  </Accordion>

  <Accordion title="작업 폴링">
    Runway는 작업 기반 API를 사용합니다. 생성 요청을 제출한 뒤 OpenClaw는
    비디오가 준비될 때까지 `GET /v1/tasks/{id}`를 폴링합니다. 폴링 동작에는
    추가 구성이 필요하지 않습니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 도구 매개변수, provider 선택, 비동기 동작.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    비디오 생성 모델을 포함한 에이전트 기본 설정.
  </Card>
</CardGroup>
