---
read_when:
    - OpenClaw에서 Qwen을 사용하려는 경우
    - 이전에 Qwen OAuth를 사용했던 경우
summary: OpenClaw의 번들 qwen provider를 통해 Qwen Cloud 사용하기
title: Qwen
x-i18n:
    generated_at: "2026-04-24T06:32:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth는 제거되었습니다.** `portal.qwen.ai` 엔드포인트를 사용하던 무료 티어 OAuth 통합
(`qwen-portal`)은 더 이상 사용할 수 없습니다.
배경은 [Issue #49557](https://github.com/openclaw/openclaw/issues/49557)를 참조하세요.

</Warning>

OpenClaw는 이제 Qwen을 정식 번들 provider로 취급하며 정식 ID는
`qwen`입니다. 번들 provider는 Qwen Cloud / Alibaba DashScope 및
Coding Plan 엔드포인트를 대상으로 하며, 레거시 `modelstudio` ID는
호환성 별칭으로 계속 동작합니다.

- Provider: `qwen`
- 권장 env 변수: `QWEN_API_KEY`
- 호환성을 위해 추가 허용: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API 스타일: OpenAI 호환

<Tip>
`qwen3.6-plus`를 원한다면 **Standard (pay-as-you-go)** 엔드포인트를 선호하세요.
Coding Plan 지원은 공개 카탈로그보다 늦을 수 있습니다.
</Tip>

## 시작하기

플랜 유형을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="Coding Plan (구독)">
    **가장 적합한 경우:** Qwen Coding Plan을 통한 구독 기반 액세스.

    <Steps>
      <Step title="API 키 받기">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)에서 API 키를 생성하거나 복사하세요.
      </Step>
      <Step title="온보딩 실행">
        **글로벌** 엔드포인트용:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **중국** 엔드포인트용:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="기본 모델 설정">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    레거시 `modelstudio-*` auth-choice ID와 `modelstudio/...` 모델 ref도
    호환성 별칭으로 여전히 동작하지만, 새 설정 흐름에서는 정식
    `qwen-*` auth-choice ID와 `qwen/...` 모델 ref를 선호해야 합니다.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **가장 적합한 경우:** `qwen3.6-plus`처럼 Coding Plan에서는 제공되지 않을 수 있는 모델을 포함해, Standard Model Studio 엔드포인트를 통한 종량제 액세스.

    <Steps>
      <Step title="API 키 받기">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)에서 API 키를 생성하거나 복사하세요.
      </Step>
      <Step title="온보딩 실행">
        **글로벌** 엔드포인트용:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **중국** 엔드포인트용:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="기본 모델 설정">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    레거시 `modelstudio-*` auth-choice ID와 `modelstudio/...` 모델 ref도
    호환성 별칭으로 여전히 동작하지만, 새 설정 흐름에서는 정식
    `qwen-*` auth-choice ID와 `qwen/...` 모델 ref를 선호해야 합니다.
    </Note>

  </Tab>
</Tabs>

## 플랜 유형 및 엔드포인트

| 플랜                       | 지역   | 인증 선택지               | 엔드포인트                                      |
| -------------------------- | ------ | ------------------------- | ----------------------------------------------- |
| Standard (pay-as-you-go)   | 중국   | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`     |
| Standard (pay-as-you-go)   | 글로벌 | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (구독)         | 중국   | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`              |
| Coding Plan (구독)         | 글로벌 | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`         |

provider는 인증 선택지에 따라 엔드포인트를 자동 선택합니다. 정식
선택지는 `qwen-*` 계열을 사용하며, `modelstudio-*`는 호환성 전용으로 남아 있습니다.
config의 사용자 지정 `baseUrl`로 재정의할 수 있습니다.

<Tip>
**키 관리:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**문서:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 내장 카탈로그

OpenClaw는 현재 다음 번들 Qwen 카탈로그를 제공합니다. 구성된 카탈로그는
엔드포인트 인식 방식이며, Coding Plan config에서는
Standard 엔드포인트에서만 동작하는 것으로 알려진 모델을 생략합니다.

| 모델 ref                    | 입력         | 컨텍스트  | 참고                                                  |
| --------------------------- | ------------ | --------- | ----------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image  | 1,000,000 | 기본 모델                                             |
| `qwen/qwen3.6-plus`         | text, image  | 1,000,000 | 이 모델이 필요하면 Standard 엔드포인트 권장          |
| `qwen/qwen3-max-2026-01-23` | text         | 262,144   | Qwen Max 계열                                         |
| `qwen/qwen3-coder-next`     | text         | 262,144   | 코딩                                                  |
| `qwen/qwen3-coder-plus`     | text         | 1,000,000 | 코딩                                                  |
| `qwen/MiniMax-M2.5`         | text         | 1,000,000 | reasoning 활성화됨                                    |
| `qwen/glm-5`                | text         | 202,752   | GLM                                                   |
| `qwen/glm-4.7`              | text         | 202,752   | GLM                                                   |
| `qwen/kimi-k2.5`            | text, image  | 262,144   | Alibaba를 통한 Moonshot AI                            |

<Note>
모델이 번들 카탈로그에 존재하더라도 엔드포인트와 과금 플랜에 따라 사용 가능 여부는 여전히 달라질 수 있습니다.
</Note>

## 멀티모달 추가 기능

`qwen` Plugin은 또한 **Standard**
DashScope 엔드포인트(Coding Plan 엔드포인트 아님)에서 멀티모달 capability를 노출합니다.

- **비디오 이해** via `qwen-vl-max-latest`
- **Wan 비디오 생성** via `wan2.6-t2v` (기본값), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Qwen을 기본 비디오 provider로 사용하려면:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
공용 도구 매개변수, provider 선택, failover 동작은 [비디오 생성](/ko/tools/video-generation)을 참조하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="이미지 및 비디오 이해">
    번들 Qwen Plugin은 **Standard** DashScope 엔드포인트(Coding Plan 엔드포인트 아님)에서
    이미지와 비디오에 대한 미디어 이해를 등록합니다.

    | 속성            | 값                    |
    | --------------- | --------------------- |
    | 모델            | `qwen-vl-max-latest`  |
    | 지원 입력       | 이미지, 비디오        |

    미디어 이해는 구성된 Qwen 인증에서 자동으로 확인되므로
    추가 config가 필요하지 않습니다. 미디어 이해 지원을 위해서는 Standard (pay-as-you-go)
    엔드포인트를 사용 중인지 확인하세요.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus 사용 가능 여부">
    `qwen3.6-plus`는 Standard (pay-as-you-go) Model Studio
    엔드포인트에서 사용할 수 있습니다.

    - 중국: `dashscope.aliyuncs.com/compatible-mode/v1`
    - 글로벌: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Coding Plan 엔드포인트가 `qwen3.6-plus`에 대해 "unsupported model" 오류를 반환하면,
    Coding Plan 엔드포인트/키 조합 대신 Standard (pay-as-you-go)로 전환하세요.

  </Accordion>

  <Accordion title="Capability 계획">
    `qwen` Plugin은 단순한 coding/text 모델뿐 아니라
    전체 Qwen Cloud 표면의 벤더 홈으로 자리잡고 있습니다.

    - **텍스트/채팅 모델:** 현재 번들 제공
    - **Tool calling, structured output, thinking:** OpenAI 호환 전송에서 상속
    - **이미지 생성:** provider-plugin 계층에서 계획됨
    - **이미지/비디오 이해:** 현재 Standard 엔드포인트에서 번들 제공
    - **Speech/오디오:** provider-plugin 계층에서 계획됨
    - **메모리 임베딩/reranking:** 임베딩 adapter 표면을 통해 계획됨
    - **비디오 생성:** 공용 비디오 생성 capability를 통해 현재 번들 제공

  </Accordion>

  <Accordion title="비디오 생성 세부 정보">
    비디오 생성의 경우 OpenClaw는 작업 제출 전에 구성된 Qwen 지역을
    일치하는 DashScope AIGC 호스트로 매핑합니다.

    - 글로벌/국제: `https://dashscope-intl.aliyuncs.com`
    - 중국: `https://dashscope.aliyuncs.com`

    즉, Coding Plan 또는 Standard Qwen 호스트를 가리키는 일반적인 `models.providers.qwen.baseUrl`도
    비디오 생성이 올바른 지역 DashScope 비디오 엔드포인트에 유지되게 합니다.

    현재 번들 Qwen 비디오 생성 제한:

    - 요청당 출력 비디오는 최대 **1개**
    - 입력 이미지는 최대 **1개**
    - 입력 비디오는 최대 **4개**
    - 길이는 최대 **10초**
    - `size`, `aspectRatio`, `resolution`, `audio`, `watermark` 지원
    - 참조 이미지/비디오 모드는 현재 **원격 http(s) URL**이 필요합니다. DashScope 비디오 엔드포인트가 해당 참조에 대해 업로드된 로컬 버퍼를
      받지 않기 때문에 로컬 파일 경로는 초기에 거부됩니다.

  </Accordion>

  <Accordion title="스트리밍 사용량 호환성">
    native Model Studio 엔드포인트는 공용
    `openai-completions` 전송에서 스트리밍 사용량 호환성을 광고합니다. OpenClaw는 이제 이를 엔드포인트
    capability로 판단하므로, 동일한 native 호스트를 대상으로 하는 DashScope 호환 사용자 지정 provider ID는
    내장 `qwen` provider ID를 특별히 요구하지 않고도 같은 스트리밍 사용량 동작을 상속합니다.

    native-streaming 사용량 호환성은 Coding Plan 호스트와
    Standard DashScope 호환 호스트 모두에 적용됩니다.

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="멀티모달 엔드포인트 지역">
    멀티모달 표면(비디오 이해 및 Wan 비디오 생성)은
    Coding Plan 엔드포인트가 아니라 **Standard** DashScope 엔드포인트를 사용합니다.

    - 글로벌/국제 Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - 중국 Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="환경 및 데몬 설정">
    Gateway가 데몬(launchd/systemd)으로 실행된다면, `QWEN_API_KEY`가
    해당 프로세스에서 사용 가능하도록 해야 합니다(예: `~/.openclaw/.env` 또는
    `env.shellEnv`를 통해).
  </Accordion>
</AccordionGroup>

## 관련

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, model ref, failover 동작 선택하기.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공용 비디오 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/ko/providers/alibaba" icon="cloud">
    레거시 ModelStudio provider 및 마이그레이션 참고.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반 문제 해결 및 FAQ.
  </Card>
</CardGroup>
