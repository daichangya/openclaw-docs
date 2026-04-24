---
read_when:
    - macOS 로그를 수집하거나 비공개 데이터 로깅을 조사하기
    - 음성 wake/session 수명 주기 문제 디버깅하기
summary: 'OpenClaw 로깅: 롤링 진단 파일 로그 + 통합 로그 privacy 플래그'
title: macOS 로깅
x-i18n:
    generated_at: "2026-04-24T06:24:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# 로깅(macOS)

## 롤링 진단 파일 로그(Debug 창)

OpenClaw는 macOS app 로그를 swift-log를 통해 라우팅하며(기본값은 통합 로깅), 지속적으로 보관되는 캡처가 필요할 때 로컬의 순환 파일 로그를 디스크에 기록할 수 있습니다.

- 상세 수준: **Debug 창 → Logs → App logging → Verbosity**
- 활성화: **Debug 창 → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- 위치: `~/Library/Logs/OpenClaw/diagnostics.jsonl`(자동으로 순환됨. 이전 파일에는 `.1`, `.2`, … 접미사가 붙음)
- 지우기: **Debug 창 → Logs → App logging → “Clear”**

참고:

- 이 기능은 기본적으로 **비활성화**되어 있습니다. 적극적으로 디버깅하는 동안에만 활성화하세요.
- 이 파일은 민감한 정보로 취급하세요. 검토 없이 공유하지 마세요.

## macOS의 통합 로깅 비공개 데이터

통합 로깅은 서브시스템이 `privacy -off`를 선택하지 않는 한 대부분의 페이로드를 마스킹합니다. Peter의 macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) 글에 따르면, 이는 `/Library/Preferences/Logging/Subsystems/`의 plist에서 서브시스템 이름을 키로 사용해 제어됩니다. 새 로그 항목에만 이 플래그가 적용되므로, 문제를 재현하기 전에 활성화해야 합니다.

## OpenClaw (`ai.openclaw`)에 대해 활성화

- 먼저 plist를 임시 파일에 쓴 다음, root로 원자적으로 설치하세요.

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- 재부팅은 필요하지 않습니다. logd가 파일을 빠르게 감지하지만, 비공개 페이로드가 포함되는 것은 새 로그 줄만입니다.
- 더 풍부한 출력은 기존 도우미로 확인하세요. 예: `./scripts/clawlog.sh --category WebChat --last 5m`

## 디버깅 후 비활성화

- 재정의 제거: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`
- 필요하면 `sudo log config --reload`를 실행해 logd가 재정의를 즉시 해제하도록 강제할 수 있습니다.
- 이 경로에는 전화번호와 메시지 본문이 포함될 수 있다는 점을 기억하세요. 추가 세부 정보가 실제로 필요한 동안에만 plist를 유지하세요.

## 관련 항목

- [macOS app](/ko/platforms/macos)
- [Gateway 로깅](/ko/gateway/logging)
