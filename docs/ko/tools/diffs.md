---
read_when:
    - 에이전트가 코드 또는 Markdown 편집 내용을 diff로 보여주길 원하시는 것입니다
    - Canvas에서 사용할 viewer URL 또는 렌더링된 diff 파일을 원하시는 것입니다
    - 안전한 기본값을 갖춘 제어된 임시 diff 아티팩트가 필요합니다
summary: 에이전트용 읽기 전용 diff 뷰어 및 파일 렌더러(선택적 Plugin 도구)
title: 차이점 viewer
x-i18n:
    generated_at: "2026-04-24T06:39:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs`는 짧은 내장 시스템 안내와, 변경 내용을 에이전트를 위한 읽기 전용 diff 아티팩트로 바꿔 주는 companion Skill을 갖춘 선택적 Plugin 도구입니다.

다음 중 하나를 받을 수 있습니다:

- `before` 및 `after` 텍스트
- 통합 `patch`

다음 중 하나를 반환할 수 있습니다:

- Canvas 프레젠테이션용 Gateway viewer URL
- 메시지 전달용 렌더링된 파일 경로(PNG 또는 PDF)
- 한 번의 호출에서 두 출력 모두

활성화되면 이 Plugin은 간결한 사용 안내를 시스템 프롬프트 공간 앞부분에 추가하고, 에이전트가 더 자세한 지침이 필요할 때를 위한 상세 Skill도 노출합니다.

## 빠른 시작

1. Plugin을 활성화합니다.
2. Canvas 우선 흐름에는 `mode: "view"`로 `diffs`를 호출합니다.
3. 채팅 파일 전달 흐름에는 `mode: "file"`로 `diffs`를 호출합니다.
4. 두 아티팩트가 모두 필요하면 `mode: "both"`로 `diffs`를 호출합니다.

## Plugin 활성화

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## 내장 시스템 안내 비활성화

`diffs` 도구는 활성화한 채 내장 시스템 프롬프트 안내만 비활성화하려면 `plugins.entries.diffs.hooks.allowPromptInjection`을 `false`로 설정하세요:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

이렇게 하면 Plugin, 도구, companion Skill은 계속 사용 가능한 상태로 두면서 diffs Plugin의 `before_prompt_build` Hook만 차단합니다.

안내와 도구를 모두 비활성화하려면 대신 Plugin 자체를 비활성화하세요.

## 일반적인 에이전트 워크플로

1. 에이전트가 `diffs`를 호출합니다.
2. 에이전트가 `details` 필드를 읽습니다.
3. 에이전트는 다음 중 하나를 수행합니다:
   - `canvas present`로 `details.viewerUrl` 열기
   - `path` 또는 `filePath`를 사용해 `message`로 `details.filePath` 전송
   - 둘 다 수행

## 입력 예시

Before와 after:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## 도구 입력 참조

별도 표시가 없는 한 모든 필드는 선택 사항입니다:

- `before` (`string`): 원본 텍스트. `patch`를 생략할 때 `after`와 함께 필요합니다.
- `after` (`string`): 업데이트된 텍스트. `patch`를 생략할 때 `before`와 함께 필요합니다.
- `patch` (`string`): 통합 diff 텍스트. `before` 및 `after`와 상호 배타적입니다.
- `path` (`string`): before/after 모드용 표시 파일명.
- `lang` (`string`): before/after 모드용 언어 재정의 힌트. 알 수 없는 값은 일반 텍스트로 폴백합니다.
- `title` (`string`): viewer 제목 재정의.
- `mode` (`"view" | "file" | "both"`): 출력 모드. 기본값은 Plugin 기본값 `defaults.mode`입니다.
  사용 중단된 별칭: `"image"`는 `"file"`처럼 동작하며 하위 호환성을 위해 여전히 허용됩니다.
- `theme` (`"light" | "dark"`): viewer 테마. 기본값은 Plugin 기본값 `defaults.theme`입니다.
- `layout` (`"unified" | "split"`): diff 레이아웃. 기본값은 Plugin 기본값 `defaults.layout`입니다.
- `expandUnchanged` (`boolean`): 전체 컨텍스트를 사용할 수 있을 때 변경되지 않은 섹션을 펼칩니다. 호출별 옵션일 뿐이며 Plugin 기본값 키는 아닙니다.
- `fileFormat` (`"png" | "pdf"`): 렌더링 파일 형식. 기본값은 Plugin 기본값 `defaults.fileFormat`입니다.
- `fileQuality` (`"standard" | "hq" | "print"`): PNG 또는 PDF 렌더링용 품질 프리셋.
- `fileScale` (`number`): 장치 스케일 재정의 (`1`-`4`).
- `fileMaxWidth` (`number`): 최대 렌더 폭(CSS 픽셀, `640`-`2400`).
- `ttlSeconds` (`number`): viewer 및 독립 파일 출력용 아티팩트 TTL(초). 기본값 1800, 최대 21600.
- `baseUrl` (`string`): viewer URL origin 재정의. Plugin의 `viewerBaseUrl`을 재정의합니다. 반드시 `http` 또는 `https`여야 하며 query/hash는 허용되지 않습니다.

하위 호환성을 위해 여전히 허용되는 레거시 입력 별칭:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

검증 및 한도:

- `before`와 `after`는 각각 최대 512 KiB.
- `patch`는 최대 2 MiB.
- `path`는 최대 2048바이트.
- `lang`는 최대 128바이트.
- `title`은 최대 1024바이트.
- Patch 복잡도 상한: 최대 128개 파일, 총 120000줄.
- `patch`와 `before` 또는 `after`를 함께 사용하면 거부됩니다.
- 렌더링 파일 안전 한도(PNG와 PDF 모두 적용):
  - `fileQuality: "standard"`: 최대 8 MP (8,000,000 렌더링 픽셀)
  - `fileQuality: "hq"`: 최대 14 MP (14,000,000 렌더링 픽셀)
  - `fileQuality: "print"`: 최대 24 MP (24,000,000 렌더링 픽셀)
  - PDF는 최대 50페이지 제한도 있습니다.

## 출력 details 계약

도구는 `details` 아래에 구조화된 메타데이터를 반환합니다.

viewer를 생성하는 모드에서 공유되는 필드:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` 사용 가능한 경우)

PNG 또는 PDF가 렌더링될 때의 파일 필드:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (`filePath`와 동일한 값, message tool 호환용)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

기존 호출자를 위한 호환성 별칭도 반환됩니다:

- `format` (`fileFormat`과 동일한 값)
- `imagePath` (`filePath`와 동일한 값)
- `imageBytes` (`fileBytes`와 동일한 값)
- `imageQuality` (`fileQuality`와 동일한 값)
- `imageScale` (`fileScale`와 동일한 값)
- `imageMaxWidth` (`fileMaxWidth`와 동일한 값)

모드 동작 요약:

- `mode: "view"`: viewer 필드만 반환.
- `mode: "file"`: 파일 필드만 반환, viewer 아티팩트 없음.
- `mode: "both"`: viewer 필드와 파일 필드를 모두 반환. 파일 렌더링에 실패하더라도 viewer는 `fileError`와 호환성 별칭 `imageError`와 함께 계속 반환됩니다.

## 접힌 변경 없음 섹션

- viewer는 `N unmodified lines` 같은 행을 표시할 수 있습니다.
- 해당 행의 expand 제어는 조건부이며 모든 입력 종류에서 보장되지는 않습니다.
- 렌더링된 diff에 확장 가능한 컨텍스트 데이터가 있을 때 expand 제어가 표시되며, 이는 일반적으로 before/after 입력에서 발생합니다.
- 많은 통합 patch 입력의 경우 생략된 컨텍스트 본문이 파싱된 patch hunk에 없으므로, expand 제어 없이 행만 표시될 수 있습니다. 이는 예상된 동작입니다.
- `expandUnchanged`는 확장 가능한 컨텍스트가 존재할 때만 적용됩니다.

## Plugin 기본값

Plugin 전역 기본값은 `~/.openclaw/openclaw.json`에 설정하세요:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

지원되는 기본값:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

명시적인 도구 매개변수는 이 기본값들을 재정의합니다.

영구 viewer URL 구성:

- `viewerBaseUrl` (`string`, 선택 사항)
  - 도구 호출에서 `baseUrl`을 전달하지 않을 때 반환되는 viewer 링크용 Plugin 소유 fallback
  - 반드시 `http` 또는 `https`여야 하며 query/hash는 허용되지 않음

예시:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## 보안 구성

- `security.allowRemoteViewer` (`boolean`, 기본값 `false`)
  - `false`: viewer 경로에 대한 non-loopback 요청은 거부됩니다.
  - `true`: 토큰화된 경로가 유효하면 원격 viewer가 허용됩니다.

예시:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## 아티팩트 수명 주기 및 저장소

- 아티팩트는 임시 하위 폴더 `$TMPDIR/openclaw-diffs` 아래에 저장됩니다.
- Viewer 아티팩트 메타데이터에는 다음이 포함됩니다:
  - 임의 아티팩트 ID(20 hex 문자)
  - 임의 토큰(48 hex 문자)
  - `createdAt` 및 `expiresAt`
  - 저장된 `viewer.html` 경로
- 아티팩트 TTL을 지정하지 않으면 기본값은 30분입니다.
- 허용되는 최대 viewer TTL은 6시간입니다.
- 정리는 아티팩트 생성 후 기회적으로 실행됩니다.
- 만료된 아티팩트는 삭제됩니다.
- 메타데이터가 누락된 경우 fallback 정리는 24시간보다 오래된 오래된 폴더를 제거합니다.

## Viewer URL 및 네트워크 동작

Viewer 경로:

- `/plugins/diffs/view/{artifactId}/{token}`

Viewer 자산:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

viewer 문서는 해당 자산을 viewer URL 기준 상대 경로로 확인하므로, 선택적 `baseUrl` 경로 접두사도
해당 자산 요청에 그대로 보존됩니다.

URL 구성 동작:

- 도구 호출 `baseUrl`이 제공되면 엄격한 검증 후 이를 사용합니다.
- 그렇지 않고 Plugin `viewerBaseUrl`이 구성되어 있으면 이를 사용합니다.
- 둘 다 없으면 viewer URL은 loopback `127.0.0.1`을 기본값으로 사용합니다.
- Gateway bind 모드가 `custom`이고 `gateway.customBindHost`가 설정되어 있으면 해당 호스트가 사용됩니다.

`baseUrl` 규칙:

- 반드시 `http://` 또는 `https://`여야 합니다.
- Query와 hash는 거부됩니다.
- origin과 선택적 base path는 허용됩니다.

## 보안 모델

Viewer 강화:

- 기본적으로 loopback 전용.
- 엄격한 ID 및 토큰 검증을 사용하는 토큰화된 viewer 경로.
- Viewer 응답 CSP:
  - `default-src 'none'`
  - 스크립트와 자산은 self에서만
  - 아웃바운드 `connect-src` 없음
- 원격 액세스가 활성화되었을 때의 원격 miss throttling:
  - 60초당 40회 실패
  - 60초 잠금 (`429 Too Many Requests`)

파일 렌더링 강화:

- 스크린샷 browser 요청 라우팅은 기본 거부입니다.
- `http://127.0.0.1/plugins/diffs/assets/*`의 로컬 viewer 자산만 허용됩니다.
- 외부 네트워크 요청은 차단됩니다.

## 파일 모드용 브라우저 요구 사항

`mode: "file"` 및 `mode: "both"`에는 Chromium 호환 브라우저가 필요합니다.

확인 순서:

1. OpenClaw 구성의 `browser.executablePath`
2. 환경 변수:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. 플랫폼 명령/경로 검색 fallback

일반적인 실패 메시지:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome, Chromium, Edge, Brave 중 하나를 설치하거나 위의 실행 파일 경로 옵션 중 하나를 설정해 해결하세요.

## 문제 해결

입력 검증 오류:

- `Provide patch or both before and after text.`
  - `before`와 `after`를 모두 포함하거나 `patch`를 제공하세요.
- `Provide either patch or before/after input, not both.`
  - 입력 모드를 혼합하지 마세요.
- `Invalid baseUrl: ...`
  - query/hash가 없는 `http(s)` origin과 선택적 경로를 사용하세요.
- `{field} exceeds maximum size (...)`
  - 페이로드 크기를 줄이세요.
- 큰 patch 거부
  - patch 파일 수 또는 총 줄 수를 줄이세요.

Viewer 접근성 문제:

- Viewer URL은 기본적으로 `127.0.0.1`로 확인됩니다.
- 원격 액세스 시나리오에서는 다음 중 하나를 사용하세요:
  - Plugin `viewerBaseUrl` 설정, 또는
  - 도구 호출마다 `baseUrl` 전달, 또는
  - `gateway.bind=custom` 및 `gateway.customBindHost` 사용
- `gateway.trustedProxies`에 동일 호스트 프록시(예: Tailscale Serve)를 위한 loopback이 포함되어 있으면, 전달된 클라이언트 IP 헤더가 없는 원시 loopback viewer 요청은 설계상 닫힌 실패를 합니다.
- 해당 프록시 토폴로지에서는:
  - 첨부 파일만 필요하다면 `mode: "file"` 또는 `mode: "both"`를 우선 사용하거나,
  - 공유 가능한 viewer URL이 필요하다면 의도적으로 `security.allowRemoteViewer`를 활성화하고 Plugin `viewerBaseUrl`을 설정하거나 프록시/공개 `baseUrl`을 전달하세요
- 외부 viewer 액세스를 의도한 경우에만 `security.allowRemoteViewer`를 활성화하세요.

변경 없음 행에 expand 버튼이 없음:

- patch 입력에서 patch가 확장 가능한 컨텍스트를 포함하지 않을 때 발생할 수 있습니다.
- 이는 예상된 동작이며 viewer 실패를 의미하지 않습니다.

아티팩트를 찾을 수 없음:

- TTL로 인해 아티팩트가 만료됨
- 토큰 또는 경로가 변경됨
- 정리가 오래된 데이터를 제거함

## 운영 지침

- Canvas에서 로컬 대화형 검토에는 `mode: "view"`를 우선 사용하세요.
- 첨부 파일이 필요한 아웃바운드 채팅 채널에는 `mode: "file"`을 우선 사용하세요.
- 배포에 원격 viewer URL이 필요한 경우가 아니라면 `allowRemoteViewer`를 비활성화 상태로 유지하세요.
- 민감한 diff에는 명시적으로 짧은 `ttlSeconds`를 설정하세요.
- 필요하지 않은 경우 diff 입력에 secret을 보내지 마세요.
- 채널이 이미지를 강하게 압축하는 경우(예: Telegram 또는 WhatsApp) PDF 출력(`fileFormat: "pdf"`)을 우선 사용하세요.

Diff 렌더링 엔진:

- [Diffs](https://diffs.com) 기반입니다.

## 관련 문서

- [도구 개요](/ko/tools)
- [Plugins](/ko/tools/plugin)
- [Browser](/ko/tools/browser)
