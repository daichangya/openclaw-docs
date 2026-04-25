---
read_when:
    - Chcesz konfiguracji z przewodnikiem dla gateway, przestrzeni roboczej, uwierzytelniania, kanałów i Skills
summary: Dokumentacja referencyjna CLI dla `openclaw onboard` (interaktywny onboarding)
title: Onboard
x-i18n:
    generated_at: "2026-04-25T13:44:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 234c308ea554195df1bd880bda7e30770e926af059740458d056e4a909aaeb07
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Interaktywny onboarding do lokalnej lub zdalnej konfiguracji Gateway.

## Powiązane przewodniki

- Centrum onboardingu CLI: [Onboarding (CLI)](/pl/start/wizard)
- Omówienie onboardingu: [Onboarding Overview](/pl/start/onboarding-overview)
- Dokumentacja referencyjna onboardingu CLI: [CLI Setup Reference](/pl/start/wizard-cli-reference)
- Automatyzacja CLI: [CLI Automation](/pl/start/wizard-cli-automation)
- Onboarding macOS: [Onboarding (macOS App)](/pl/start/onboarding)

## Przykłady

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--modern` uruchamia podgląd konwersacyjnego onboardingu Crestodian. Bez
`--modern` polecenie `openclaw onboard` zachowuje klasyczny przepływ onboardingu.

Dla celów `ws://` w prywatnej sieci korzystających z czystego tekstu (tylko zaufane sieci) ustaw
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w środowisku procesu onboardingu.
Nie ma odpowiednika w `openclaw.json` dla tego awaryjnego obejścia
transportu po stronie klienta.

Niestandardowy dostawca w trybie nieinteraktywnym:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` jest opcjonalne w trybie nieinteraktywnym. Jeśli zostanie pominięte, onboarding sprawdzi `CUSTOM_API_KEY`.

LM Studio obsługuje również flagę klucza specyficzną dla dostawcy w trybie nieinteraktywnym:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Nieinteraktywny Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` domyślnie ma wartość `http://127.0.0.1:11434`. `--custom-model-id` jest opcjonalne; jeśli zostanie pominięte, onboarding użyje sugerowanych domyślnych ustawień Ollama. Identyfikatory modeli chmurowych, takie jak `kimi-k2.5:cloud`, również tutaj działają.

Przechowuj klucze dostawców jako odwołania zamiast w postaci zwykłego tekstu:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Przy `--secret-input-mode ref` onboarding zapisuje odwołania oparte na env zamiast wartości kluczy w postaci zwykłego tekstu.
Dla dostawców opartych na profilu uwierzytelniania zapisuje to wpisy `keyRef`; dla dostawców niestandardowych zapisuje `models.providers.<id>.apiKey` jako odwołanie env (na przykład `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrakt trybu nieinteraktywnego `ref`:

- Ustaw zmienną env dostawcy w środowisku procesu onboardingu (na przykład `OPENAI_API_KEY`).
- Nie przekazuj flag klucza inline (na przykład `--openai-api-key`), chyba że ta zmienna env jest również ustawiona.
- Jeśli flaga klucza inline zostanie przekazana bez wymaganej zmiennej env, onboarding zakończy się od razu błędem z instrukcjami.

Opcje tokena Gateway w trybie nieinteraktywnym:

- `--gateway-auth token --gateway-token <token>` zapisuje token w postaci zwykłego tekstu.
- `--gateway-auth token --gateway-token-ref-env <name>` zapisuje `gateway.auth.token` jako env SecretRef.
- `--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.
- `--gateway-token-ref-env` wymaga niepustej zmiennej env w środowisku procesu onboardingu.
- Z `--install-daemon`, gdy uwierzytelnianie tokenem wymaga tokena, tokeny Gateway zarządzane przez SecretRef są walidowane, ale nie są utrwalane jako rozwiązany zwykły tekst w metadanych środowiska usługi nadzorcy.
- Z `--install-daemon`, jeśli tryb tokena wymaga tokena, a skonfigurowany token SecretRef nie może zostać rozwiązany, onboarding kończy się bezpiecznie błędem z instrukcjami naprawy.
- Z `--install-daemon`, jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, onboarding blokuje instalację do czasu jawnego ustawienia trybu.
- Lokalny onboarding zapisuje `gateway.mode="local"` do config. Jeśli w późniejszym pliku config brakuje `gateway.mode`, traktuj to jako uszkodzenie config albo niepełną ręczną edycję, a nie jako prawidłowy skrót trybu lokalnego.
- `--allow-unconfigured` to osobna awaryjna furtka runtime Gateway. Nie oznacza, że onboarding może pominąć `gateway.mode`.

Przykład:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Kondycja lokalnego Gateway w trybie nieinteraktywnym:

- O ile nie przekażesz `--skip-health`, onboarding czeka na osiągalny lokalny Gateway, zanim zakończy się powodzeniem.
- `--install-daemon` najpierw uruchamia ścieżkę instalacji zarządzanego Gateway. Bez niej musisz mieć już uruchomiony lokalny Gateway, na przykład `openclaw gateway run`.
- Jeśli w automatyzacji chcesz tylko zapisów config/przestrzeni roboczej/bootstrap, użyj `--skip-health`.
- Jeśli samodzielnie zarządzasz plikami przestrzeni roboczej, przekaż `--skip-bootstrap`, aby ustawić `agents.defaults.skipBootstrap: true` i pominąć tworzenie `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` i `BOOTSTRAP.md`.
- W natywnym Windows `--install-daemon` najpierw próbuje użyć Zaplanowanych zadań, a jeśli utworzenie zadania zostanie odrzucone, wraca do elementu logowania per użytkownik w folderze Startup.

Zachowanie interaktywnego onboardingu z trybem odwołań:

- Po wyświetleniu monitu wybierz **Use secret reference**.
- Następnie wybierz jedną z opcji:
  - Zmienna środowiskowa
  - Skonfigurowany dostawca sekretów (`file` lub `exec`)
- Onboarding wykonuje szybką walidację wstępną przed zapisaniem odwołania.
  - Jeśli walidacja się nie powiedzie, onboarding pokaże błąd i pozwoli spróbować ponownie.

Nieinteraktywne wybory endpointów Z.AI:

Uwaga: `--auth-choice zai-api-key` teraz automatycznie wykrywa najlepszy endpoint Z.AI dla Twojego klucza (preferuje ogólne API z `zai/glm-5.1`).
Jeśli konkretnie chcesz endpointy GLM Coding Plan, wybierz `zai-coding-global` lub `zai-coding-cn`.

```bash
# Wybór endpointu bez monitu
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Inne wybory endpointów Z.AI:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Nieinteraktywny przykład Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Uwagi o przepływach:

- `quickstart`: minimalna liczba monitów, automatycznie generuje token Gateway.
- `manual`: pełne monity dla portu/bind/auth (alias `advanced`).
- Gdy wybór uwierzytelniania sugeruje preferowanego dostawcę, onboarding wstępnie filtruje
  selektory modelu domyślnego i listy dozwolonych do tego dostawcy. Dla Volcengine i
  BytePlus obejmuje to również warianty coding-plan
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Jeśli filtr preferowanego dostawcy nie zwróci jeszcze żadnych załadowanych modeli,
  onboarding wraca do katalogu bez filtrowania zamiast pozostawiać pusty selektor.
- W kroku wyszukiwania w sieci niektórzy dostawcy mogą wywołać dodatkowe monity specyficzne dla dostawcy:
  - **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym `XAI_API_KEY`
    oraz wybór modelu `x_search`.
  - **Kimi** może zapytać o region Moonshot API (`api.moonshot.ai` vs
    `api.moonshot.cn`) oraz domyślny model wyszukiwania w sieci Kimi.
- Zachowanie zakresu DM lokalnego onboardingu: [CLI Setup Reference](/pl/start/wizard-cli-reference#outputs-and-internals).
- Najszybszy pierwszy czat: `openclaw dashboard` (Control UI, bez konfiguracji kanałów).
- Custom Provider: połącz dowolny endpoint zgodny z OpenAI lub Anthropic,
  w tym hostowanych dostawców niewymienionych na liście. Użyj Unknown do automatycznego wykrywania.

## Typowe polecenia po onboardingu

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie oznacza trybu nieinteraktywnego. W skryptach używaj `--non-interactive`.
</Note>
