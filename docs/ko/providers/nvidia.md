---
read_when:
    - OpenClaw에서 오픈 모델을 무료로 사용하려는 경우
    - NVIDIA_API_KEY 설정이 필요한 경우
summary: OpenClaw에서 NVIDIA의 OpenAI 호환 API 사용하기
title: NVIDIA
x-i18n:
    generated_at: "2026-04-08T02:17:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: b00f8cedaf223a33ba9f6a6dd8cf066d88cebeea52d391b871e435026182228a
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA는 오픈 모델용 OpenAI 호환 API를 `https://integrate.api.nvidia.com/v1`에서 무료로 제공합니다. [build.nvidia.com](https://build.nvidia.com/settings/api-keys)의 API 키로 인증하세요.

## CLI 설정

키를 한 번 export한 다음, 온보딩을 실행하고 NVIDIA 모델을 설정하세요:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
```

여전히 `--token`을 전달하는 경우, 셸 기록과 `ps` 출력에 남는다는 점을 기억하세요. 가능하면 환경 변수를 사용하는 것이 좋습니다.

## Config 예시

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## 모델 ID

| Model ref                                  | Name                         | Context | Max output |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## 참고

- OpenAI 호환 `/v1` 엔드포인트이며, [build.nvidia.com](https://build.nvidia.com/)의 API 키를 사용하세요.
- `NVIDIA_API_KEY`가 설정되면 provider가 자동으로 활성화됩니다.
- 번들 카탈로그는 정적이며, 비용은 소스에서 기본값 `0`을 사용합니다.
