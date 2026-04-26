---
read_when:
    - Masz problemy z łącznością lub autoryzacją i chcesz skorzystać z naprowadzanych napraw
    - Zaktualizowałeś system i chcesz wykonać kontrolę poprawności
summary: Dokumentacja CLI dla `openclaw doctor` (kontrole stanu + naprowadzane naprawy)
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:26:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e2c21765f8c287c8d2aa066004ac516566c76a455337c377cf282551619e92a
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Kontrole stanu + szybkie naprawy dla Gateway i kanałów.

Powiązane:

- Rozwiązywanie problemów: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Audyt bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## Przykłady

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opcje

- `--no-workspace-suggestions`: wyłącz sugestie pamięci/wyszukiwania workspace
- `--yes`: zaakceptuj wartości domyślne bez pytań
- `--repair`: zastosuj zalecane naprawy bez pytań
- `--fix`: alias dla `--repair`
- `--force`: zastosuj agresywne naprawy, w tym nadpisanie niestandardowej konfiguracji usługi, gdy to konieczne
- `--non-interactive`: uruchom bez promptów; tylko bezpieczne migracje
- `--generate-gateway-token`: wygeneruj i skonfiguruj token Gateway
- `--deep`: przeskanuj usługi systemowe w poszukiwaniu dodatkowych instalacji Gateway

Uwagi:

- Interaktywne prompty (takie jak poprawki keychain/OAuth) są uruchamiane tylko wtedy, gdy stdin jest TTY i **nie** ustawiono `--non-interactive`. Uruchomienia bezgłowe (Cron, Telegram, bez terminala) pomijają prompty.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają wczesne ładowanie Plugin, aby bezgłowe kontrole stanu pozostały szybkie. Sesje interaktywne nadal w pełni ładują Plugin, gdy kontrola wymaga ich udziału.
- `--fix` (alias dla `--repair`) zapisuje kopię zapasową do `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkryptów w katalogu sesji i mogą archiwizować je jako `.deleted.<timestamp>`, aby bezpiecznie odzyskać miejsce.
- Doctor skanuje również `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych kształtów zadań Cron i może przepisać je na miejscu, zanim harmonogram będzie musiał automatycznie znormalizować je w czasie działania.
- Doctor naprawia brakujące zależności środowiska uruchomieniowego dołączonych Plugin bez zapisywania do spakowanych instalacji globalnych. Dla instalacji npm należących do roota lub utwardzonych jednostek systemd ustaw `OPENCLAW_PLUGIN_STAGE_DIR` na katalog z możliwością zapisu, taki jak `/var/lib/openclaw/plugin-runtime-deps`.
- Ustaw `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny supervisor zarządza cyklem życia Gateway. Doctor nadal raportuje stan Gateway/usługi i stosuje naprawy niezwiązane z usługą, ale pomija instalację/uruchomienie/ponowne uruchomienie/bootstrap usługi oraz czyszczenie starszych usług.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie raportują już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Doctor zawiera kontrolę gotowości wyszukiwania pamięci i może zalecić `openclaw configure --section model`, gdy brakuje poświadczeń embeddingów.
- Jeśli tryb sandbox jest włączony, ale Docker jest niedostępny, doctor zgłasza wyraźne ostrzeżenie wraz z działaniami naprawczymi (`install Docker` lub `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje awaryjnych poświadczeń w postaci zwykłego tekstu.
- Jeśli sprawdzanie SecretRef kanału nie powiedzie się w ścieżce naprawy, doctor kontynuuje i zgłasza ostrzeżenie zamiast kończyć działanie przedwcześnie.
- Automatyczne rozwiązywanie nazw użytkowników Telegram w `allowFrom` (`doctor --fix`) wymaga tokena Telegram, który można rozwiązać w bieżącej ścieżce polecenia. Jeśli sprawdzanie tokena jest niedostępne, doctor zgłasza ostrzeżenie i pomija automatyczne rozwiązywanie w tym przebiegu.

## macOS: nadpisania zmiennych środowiskowych `launchctl`

Jeśli wcześniej uruchomiono `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (lub `...PASSWORD`), ta wartość nadpisuje plik konfiguracji i może powodować utrzymujące się błędy „unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor Gateway](/pl/gateway/doctor)
