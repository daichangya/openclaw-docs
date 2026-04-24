---
read_when:
    - 에이전트가 덜 평범하게 들리길 원합니다
    - SOUL.md를 편집하고 있습니다
    - 안전성이나 간결함을 해치지 않으면서 더 강한 개성을 원합니다
summary: SOUL.md를 사용해 OpenClaw 에이전트에 일반적인 비서 말투 대신 실제 목소리를 부여하세요
title: SOUL.md 개성 가이드
x-i18n:
    generated_at: "2026-04-24T06:12:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 15
---

`SOUL.md`는 에이전트의 목소리가 살아 있는 곳입니다.

OpenClaw는 일반 세션에서 이 파일을 주입하므로, 실제로 꽤 큰 영향을 미칩니다. 에이전트가 밋밋하거나, 지나치게 조심스럽거나, 이상할 정도로 기업형 말투를 쓴다면, 보통 이 파일을 고치면 됩니다.

## SOUL.md에 들어가야 하는 것

에이전트와 대화할 때의 느낌을 바꾸는 요소를 넣으세요:

- 톤
- 의견
- 간결함
- 유머
- 경계
- 기본적인 직설성 수준

다음처럼 만들지는 마세요:

- 인생 이야기
- 변경 로그
- 보안 정책 모음
- 행동상 효과도 없는 거대한 분위기 덩어리

짧은 것이 긴 것보다 낫습니다. 날카로운 것이 모호한 것보다 낫습니다.

## 왜 이게 먹히는가

이건 OpenAI의 프롬프트 가이드와도 맞아떨어집니다:

- 프롬프트 엔지니어링 가이드는 상위 수준의 동작, 톤, 목표, 예시는 사용자 턴에 묻어두지 말고 우선순위가 높은 지시 계층에 넣어야 한다고 말합니다.
- 같은 가이드는 프롬프트를 한 번 쓰고 잊는 마법의 산문이 아니라, 반복해서 다듬고, 고정하고, 평가하는 대상으로 다루라고 권장합니다.

OpenClaw에서 `SOUL.md`가 바로 그 계층입니다.

더 나은 개성을 원한다면 더 강한 지시를 쓰세요. 안정적인 개성을 원한다면 간결하게 유지하고 버전 관리하세요.

OpenAI 참고 자료:

- [프롬프트 엔지니어링](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [메시지 역할과 지시 따르기](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty 프롬프트

이걸 에이전트에 붙여 넣고 `SOUL.md`를 다시 쓰게 하세요.

OpenClaw 워크스페이스용으로 경로가 고정되어 있습니다: `http://SOUL.md`가 아니라 `SOUL.md`를 사용하세요.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## 좋은 예의 모습

좋은 `SOUL.md` 규칙은 이런 식입니다:

- 입장을 가져라
- 군더더기를 빼라
- 어울릴 때는 웃기게 해라
- 나쁜 아이디어는 초기에 지적해라
- 정말 깊이가 유용할 때가 아니면 간결하게 유지해라

나쁜 `SOUL.md` 규칙은 이런 식입니다:

- 항상 전문성을 유지하라
- 포괄적이고 사려 깊은 지원을 제공하라
- 긍정적이고 지지적인 경험을 보장하라

두 번째 목록이 바로 모든 걸 흐물흐물하게 만드는 방식입니다.

## 한 가지 경고

개성은 대충 해도 된다는 허가가 아닙니다.

운영 규칙은 `AGENTS.md`에 두세요. 목소리, 태도, 스타일은 `SOUL.md`에 두세요. 에이전트가 공유 채널, 공개 답변, 고객 대상 표면에서 작동한다면, 그 톤이 그 공간에 여전히 맞는지도 확인하세요.

날카로운 건 좋습니다. 짜증나는 건 아닙니다.

## 관련 문서

- [에이전트 워크스페이스](/ko/concepts/agent-workspace)
- [시스템 프롬프트](/ko/concepts/system-prompt)
- [SOUL.md 템플릿](/ko/reference/templates/SOUL)
