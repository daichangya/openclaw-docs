---
read_when:
    - Masz problemy z łącznością/uwierzytelnianiem i chcesz napraw z przewodnikiem
    - Zaktualizowałeś i chcesz sprawdzenia poprawności działania
summary: Dokumentacja CLI dla `openclaw doctor` (kontrole stanu + naprawy z przewodnikiem)
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:44:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e185d17d91d1677d0b16152d022b633d012d22d484bd9961820b200d5c4ce5
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Kontrole stanu + szybkie naprawy dla Gateway i kanałów.

Powiązane:

- Rozwiązywanie problemów: [Troubleshooting](/pl/gateway/troubleshooting)
- Audyt bezpieczeństwa: [Security](/pl/gateway/security)

## Przykłady

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opcje

- `--no-workspace-suggestions`: wyłącza sugestie pamięci/wyszukiwania obszaru roboczego
- `--yes`: akceptuje wartości domyślne bez pytania
- `--repair`: stosuje zalecane naprawy bez pytania
- `--fix`: alias dla `--repair`
- `--force`: stosuje agresywne naprawy, w tym nadpisywanie niestandardowej konfiguracji usługi, gdy to potrzebne
- `--non-interactive`: uruchamia bez promptów; tylko bezpieczne migracje
- `--generate-gateway-token`: generuje i konfiguruje token Gateway
- `--deep`: skanuje usługi systemowe w poszukiwaniu dodatkowych instalacji Gateway

Uwagi:

- Interaktywne prompty (takie jak naprawy pęku kluczy/OAuth) działają tylko wtedy, gdy stdin jest TTY i **nie** ustawiono `--non-interactive`. Uruchomienia bezobsługowe (Cron, Telegram, brak terminala) pomijają prompty.
- Wydajność: nieinteraktywne uruchomienia `doctor` pomijają wczesne ładowanie Plugin, aby bezobsługowe kontrole stanu były szybkie. Sesje interaktywne nadal w pełni ładują Pluginy, gdy dana kontrola potrzebuje ich wkładu.
- `--fix` (alias `--repair`) zapisuje kopię zapasową do `~/.openclaw/openclaw.json.bak` i usuwa nieznane klucze konfiguracji, wypisując każde usunięcie.
- Kontrole integralności stanu wykrywają teraz osierocone pliki transkryptów w katalogu sesji i mogą archiwizować je jako `.deleted.<timestamp>`, aby bezpiecznie odzyskać miejsce.
- Doctor skanuje też `~/.openclaw/cron/jobs.json` (lub `cron.store`) pod kątem starszych kształtów zadań Cron i może przepisać je na miejscu, zanim harmonogram będzie musiał automatycznie je normalizować w środowisku wykonawczym.
- Doctor naprawia brakujące zależności wykonawcze dołączonych Plugin bez zapisywania do globalnych instalacji pakietowych. Dla instalacji npm należących do root lub utwardzonych jednostek systemd ustaw `OPENCLAW_PLUGIN_STAGE_DIR` na katalog z prawem zapisu, taki jak `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`.
- Powtórne uruchomienia `doctor --fix` nie raportują już ani nie stosują normalizacji Talk, jeśli jedyną różnicą jest kolejność kluczy obiektu.
- Doctor zawiera kontrolę gotowości wyszukiwania pamięci i może zalecić `openclaw configure --section model`, gdy brakuje poświadczeń do embeddings.
- Jeśli tryb sandbox jest włączony, ale Docker jest niedostępny, doctor zgłasza ostrzeżenie o wysokim sygnale wraz z naprawą (`install Docker` lub `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, doctor zgłasza ostrzeżenie tylko do odczytu i nie zapisuje awaryjnych poświadczeń jawnym tekstem.
- Jeśli inspekcja SecretRef kanału nie powiedzie się na ścieżce naprawy, doctor kontynuuje działanie i zgłasza ostrzeżenie zamiast kończyć wcześniej.
- Automatyczne rozwiązywanie nazw użytkowników Telegram `allowFrom` (`doctor --fix`) wymaga rozwiązywalnego tokenu Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokenu jest niedostępna, doctor zgłasza ostrzeżenie i pomija automatyczne rozwiązywanie w tym przebiegu.

## macOS: nadpisania env `launchctl`

Jeśli wcześniej uruchomiono `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (lub `...PASSWORD`), ta wartość nadpisuje plik konfiguracji i może powodować trwałe błędy „unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor Gateway](/pl/gateway/doctor)
