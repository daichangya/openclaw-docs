---
read_when:
    - Chcesz przeprowadzić szybki audyt bezpieczeństwa konfiguracji/stanu
    - Chcesz zastosować bezpieczne sugestie „fix” (uprawnienia, zaostrzenie ustawień domyślnych)
summary: Dokumentacja CLI dla `openclaw security` (audyt i naprawa typowych pułapek bezpieczeństwa)
title: bezpieczeństwo
x-i18n:
    generated_at: "2026-04-23T09:59:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Narzędzia bezpieczeństwa (audyt + opcjonalne poprawki).

Powiązane:

- Przewodnik bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## Audyt

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Audyt ostrzega, gdy wielu nadawców DM współdzieli główną sesję, i zaleca **bezpieczny tryb DM**: `session.dmScope="per-channel-peer"` (lub `per-account-channel-peer` dla kanałów wielokontowych) dla współdzielonych skrzynek odbiorczych.
To służy do utwardzania współdzielonych/kooperacyjnych skrzynek odbiorczych. Pojedynczy Gateway współdzielony przez wzajemnie nieufnych/wrogich operatorów nie jest zalecaną konfiguracją; rozdziel granice zaufania za pomocą osobnych gatewayów (lub osobnych użytkowników OS/hostów).
Audyt emituje też `security.trust_model.multi_user_heuristic`, gdy konfiguracja sugeruje prawdopodobny współdzielony ingress użytkowników (na przykład otwarta polityka DM/grup, skonfigurowane cele grupowe lub reguły nadawców z wildcard), i przypomina, że OpenClaw domyślnie zakłada model zaufania osobistego asystenta.
Dla celowych konfiguracji współdzielonych użytkowników wskazówka audytu brzmi: sandboxuj wszystkie sesje, ogranicz dostęp do filesystem do zakresu workspace i nie trzymaj osobistych/prywatnych tożsamości ani poświadczeń w tym runtime.
Audyt ostrzega też, gdy małe modele (`<=300B`) są używane bez sandboxingu i z włączonymi narzędziami web/browser.
Dla ingress webhooków ostrzega, gdy `hooks.token` ponownie używa tokenu Gateway, gdy `hooks.token` jest krótki, gdy `hooks.path="/"`, gdy `hooks.defaultSessionKey` nie jest ustawione, gdy `hooks.allowedAgentIds` jest nieograniczone, gdy włączone są nadpisania `sessionKey` w żądaniach i gdy nadpisania są włączone bez `hooks.allowedSessionKeyPrefixes`.
Ostrzega też, gdy ustawienia sandbox Docker są skonfigurowane, ale tryb sandbox jest wyłączony, gdy `gateway.nodes.denyCommands` używa nieskutecznych wpisów przypominających wzorce/nieznanych wpisów (tylko dokładne dopasowanie nazw poleceń Node, bez filtrowania tekstu shell), gdy `gateway.nodes.allowCommands` jawnie włącza niebezpieczne polecenia Node, gdy globalne `tools.profile="minimal"` jest nadpisane profilami narzędzi agentów, gdy otwarte grupy udostępniają narzędzia runtime/filesystem bez zabezpieczeń sandbox/workspace oraz gdy narzędzia zainstalowanych pluginów mogą być osiągalne przy liberalnej polityce narzędzi.
Oznacza też `gateway.allowRealIpFallback=true` (ryzyko spoofingu nagłówków przy błędnej konfiguracji proxy) oraz `discovery.mdns.mode="full"` (wyciek metadanych przez rekordy TXT mDNS).
Ostrzega też, gdy przeglądarka sandbox używa sieci Docker `bridge` bez `sandbox.browser.cdpSourceRange`.
Oznacza również niebezpieczne tryby sieci Docker dla sandboxa (w tym `host` i dołączenia do przestrzeni nazw `container:*`).
Ostrzega też, gdy istniejące kontenery Docker przeglądarki sandbox mają brakujące/nieaktualne etykiety hash (na przykład kontenery sprzed migracji bez `openclaw.browserConfigEpoch`) i zaleca `openclaw sandbox recreate --browser --all`.
Ostrzega też, gdy rekordy instalacji pluginów/hooków opartych na npm nie są przypięte, nie mają metadanych integralności lub odbiegają od aktualnie zainstalowanych wersji pakietów.
Ostrzega, gdy listy dozwolonych kanałów opierają się na mutowalnych nazwach/e-mailach/tagach zamiast stabilnych ID (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, zakresy IRC tam, gdzie ma to zastosowanie).
Ostrzega, gdy `gateway.auth.mode="none"` pozostawia HTTP API Gateway osiągalne bez współdzielonego sekretu (`/tools/invoke` oraz każdy włączony endpoint `/v1/*`).
Ustawienia z prefiksem `dangerous`/`dangerously` to jawne awaryjne nadpisania operatora; samo włączenie jednego z nich nie jest raportem o luce bezpieczeństwa.
Pełny wykaz niebezpiecznych parametrów znajdziesz w sekcji „Insecure or dangerous flags summary” w [Bezpieczeństwo](/pl/gateway/security).

Zachowanie SecretRef:

- `security audit` rozwiązuje obsługiwane SecretRef w trybie tylko do odczytu dla swoich docelowych ścieżek.
- Jeśli SecretRef jest niedostępny w bieżącej ścieżce polecenia, audyt kontynuuje i raportuje `secretDiagnostics` (zamiast się wykrzaczyć).
- `--token` i `--password` nadpisują uwierzytelnianie deep-probe tylko dla tego wywołania polecenia; nie przepisują konfiguracji ani mapowań SecretRef.

## Wyjście JSON

Używaj `--json` do kontroli CI/polityk:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Jeśli połączysz `--fix` i `--json`, wyjście zawiera zarówno działania naprawcze, jak i końcowy raport:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Co zmienia `--fix`

`--fix` stosuje bezpieczne, deterministyczne remediacje:

- przełącza typowe `groupPolicy="open"` na `groupPolicy="allowlist"` (w tym warianty kont w obsługiwanych kanałach)
- gdy polityka grup WhatsApp zostaje przełączona na `allowlist`, zasila `groupAllowFrom` na podstawie zapisanego pliku `allowFrom`, jeśli ta lista istnieje, a konfiguracja nie definiuje już `allowFrom`
- ustawia `logging.redactSensitive` z `"off"` na `"tools"`
- zaostrza uprawnienia dla stanu/konfiguracji i typowych plików wrażliwych
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sesyjne
  `*.jsonl`)
- zaostrza też pliki include konfiguracji wskazywane z `openclaw.json`
- używa `chmod` na hostach POSIX i resetów `icacls` w Windows

`--fix` **nie**:

- obraca tokenów/haseł/kluczy API
- wyłącza narzędzi (`gateway`, `cron`, `exec` itd.)
- nie zmienia opcji powiązania/uwierzytelniania/ekspozycji sieci Gateway
- nie usuwa ani nie przepisuje pluginów/Skills
