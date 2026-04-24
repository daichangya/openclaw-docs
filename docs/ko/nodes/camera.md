---
read_when:
    - iOS/Android Node 또는 macOS에서 카메라 캡처를 추가하거나 수정하는 중입니다.
    - 에이전트가 접근 가능한 MEDIA 임시 파일 워크플로를 확장하는 중입니다.
summary: '에이전트 사용을 위한 카메라 캡처(iOS/Android Node + macOS 앱): 사진(jpg) 및 짧은 동영상 클립(mp4)'
title: 카메라 캡처
x-i18n:
    generated_at: "2026-04-24T06:22:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 15
---

OpenClaw는 에이전트 워크플로를 위한 **카메라 캡처**를 지원합니다.

- **iOS node**(Gateway를 통해 페어링): `node.invoke`를 통해 **사진**(`jpg`) 또는 **짧은 비디오 클립**(`mp4`, 오디오 선택 가능)을 캡처할 수 있습니다.
- **Android node**(Gateway를 통해 페어링): `node.invoke`를 통해 **사진**(`jpg`) 또는 **짧은 비디오 클립**(`mp4`, 오디오 선택 가능)을 캡처할 수 있습니다.
- **macOS app**(Gateway를 통한 node): `node.invoke`를 통해 **사진**(`jpg`) 또는 **짧은 비디오 클립**(`mp4`, 오디오 선택 가능)을 캡처할 수 있습니다.

모든 카메라 접근은 **사용자 제어 설정** 뒤에서 제한됩니다.

## iOS node

### 사용자 설정(기본값: 켜짐)

- iOS Settings 탭 → **Camera** → **Allow Camera** (`camera.enabled`)
  - 기본값: **켜짐**(키가 없으면 활성화된 것으로 처리됨)
  - 꺼져 있을 때: `camera.*` 명령은 `CAMERA_DISABLED`를 반환합니다.

### 명령(Gateway `node.invoke` 경유)

- `camera.list`
  - 응답 페이로드:
    - `devices`: `{ id, name, position, deviceType }` 배열

- `camera.snap`
  - Params:
    - `facing`: `front|back` (기본값: `front`)
    - `maxWidth`: 숫자(선택 사항, iOS node의 기본값은 `1600`)
    - `quality`: `0..1` (선택 사항, 기본값 `0.9`)
    - `format`: 현재 `jpg`
    - `delayMs`: 숫자(선택 사항, 기본값 `0`)
    - `deviceId`: 문자열(선택 사항, `camera.list`에서 가져옴)
  - 응답 페이로드:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - 페이로드 보호: 사진은 base64 페이로드가 5MB 미만이 되도록 다시 압축됩니다.

- `camera.clip`
  - Params:
    - `facing`: `front|back` (기본값: `front`)
    - `durationMs`: 숫자(기본값 `3000`, 최대 `60000`으로 제한)
    - `includeAudio`: 불리언(기본값 `true`)
    - `format`: 현재 `mp4`
    - `deviceId`: 문자열(선택 사항, `camera.list`에서 가져옴)
  - 응답 페이로드:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### 포그라운드 요구 사항

`canvas.*`와 마찬가지로 iOS node는 **포그라운드**에서만 `camera.*` 명령을 허용합니다. 백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE`을 반환합니다.

### CLI 도우미(임시 파일 + MEDIA)

첨부 파일을 가장 쉽게 가져오는 방법은 CLI 도우미를 사용하는 것입니다. 이 도우미는 디코딩된 미디어를 임시 파일에 기록하고 `MEDIA:<path>`를 출력합니다.

예시:

```bash
openclaw nodes camera snap --node <id>               # 기본값: front + back 모두(2개의 MEDIA 줄)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

참고:

- `nodes camera snap`은 에이전트에 양쪽 시야를 모두 제공하기 위해 기본적으로 **양쪽** 방향을 사용합니다.
- 출력 파일은 자체 래퍼를 만들지 않는 한 임시 파일입니다(OS 임시 디렉터리 내).

## Android node

### Android 사용자 설정(기본값: 켜짐)

- Android Settings 시트 → **Camera** → **Allow Camera** (`camera.enabled`)
  - 기본값: **켜짐**(키가 없으면 활성화된 것으로 처리됨)
  - 꺼져 있을 때: `camera.*` 명령은 `CAMERA_DISABLED`를 반환합니다.

### 권한

- Android는 런타임 권한이 필요합니다.
  - `camera.snap`과 `camera.clip` 모두에 `CAMERA`
  - `camera.clip`에서 `includeAudio=true`일 때 `RECORD_AUDIO`

권한이 없으면 앱이 가능할 때 권한 요청을 표시하며, 거부되면 `camera.*` 요청은
`*_PERMISSION_REQUIRED` 오류와 함께 실패합니다.

### Android 포그라운드 요구 사항

`canvas.*`와 마찬가지로 Android node는 **포그라운드**에서만 `camera.*` 명령을 허용합니다. 백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE`을 반환합니다.

### Android 명령(Gateway `node.invoke` 경유)

- `camera.list`
  - 응답 페이로드:
    - `devices`: `{ id, name, position, deviceType }` 배열

### 페이로드 보호

사진은 base64 페이로드가 5MB 미만이 되도록 다시 압축됩니다.

## macOS app

### 사용자 설정(기본값: 꺼짐)

macOS 컴패니언 앱은 다음 체크박스를 제공합니다.

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - 기본값: **꺼짐**
  - 꺼져 있을 때: 카메라 요청은 “사용자가 카메라를 비활성화함”을 반환합니다.

### CLI 도우미(node invoke)

주요 `openclaw` CLI를 사용해 macOS node에서 카메라 명령을 호출합니다.

예시:

```bash
openclaw nodes camera list --node <id>            # 카메라 id 목록 표시
openclaw nodes camera snap --node <id>            # MEDIA:<path> 출력
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # MEDIA:<path> 출력
openclaw nodes camera clip --node <id> --duration-ms 3000      # MEDIA:<path> 출력(레거시 플래그)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

참고:

- `openclaw nodes camera snap`은 재정의하지 않으면 기본적으로 `maxWidth=1600`을 사용합니다.
- macOS에서 `camera.snap`은 캡처 전에 워밍업/노출 안정화 이후 `delayMs`(기본값 2000ms)만큼 대기합니다.
- 사진 페이로드는 base64가 5MB 미만이 되도록 다시 압축됩니다.

## 안전 + 실용적 제한

- 카메라 및 마이크 접근은 일반적인 OS 권한 요청을 표시하며(그리고 Info.plist에 usage string이 필요함),
- 비디오 클립은 과도하게 큰 node 페이로드(base64 오버헤드 + 메시지 제한)를 피하기 위해 제한됩니다(현재 `<= 60s`).

## macOS 화면 비디오(OS 수준)

_화면_ 비디오(카메라 아님)의 경우 macOS 컴패니언을 사용하세요.

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # MEDIA:<path> 출력
```

참고:

- macOS **Screen Recording** 권한(TCC)이 필요합니다.

## 관련 항목

- [이미지 및 미디어 지원](/ko/nodes/images)
- [미디어 이해](/ko/nodes/media-understanding)
- [위치 명령](/ko/nodes/location-command)
