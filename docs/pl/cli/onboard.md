---
read_when:
    - Chcesz przejść przez konfigurację z przewodnikiem dla Gateway, obszaru roboczego, uwierzytelniania, kanałów i Skills
summary: Dokumentacja CLI dla `openclaw onboard` (interaktywny onboarding)
title: onboard
x-i18n:
    generated_at: "2026-04-23T09:59:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 348ee9cbc14ff78b588f10297e728473668a72f9f16be385f25022bf5108340c
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Interaktywny onboarding do lokalnej lub zdalnej konfiguracji Gateway.

## Powiązane przewodniki

- Centrum onboardingu CLI: [Onboarding (CLI)](/pl/start/wizard)
- Przegląd onboardingu: [Przegląd onboardingu](/pl/start/onboarding-overview)
- Dokumentacja onboardingu CLI: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference)
- Automatyzacja CLI: [Automatyzacja CLI](/pl/start/wizard-cli-automation)
- Onboarding macOS: [Onboarding (aplikacja macOS)](/pl/start/onboarding)

## Przykłady

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Dla nieszyfrowanych celów `ws://` w sieci prywatnej (tylko zaufane sieci) ustaw
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w środowisku procesu onboardingu.

Niestandardowy provider w trybie nieinteraktywnym:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` jest opcjonalne w trybie nieinteraktywnym. Jeśli zostanie pominięte, onboarding sprawdza `CUSTOM_API_KEY`.

LM Studio obsługuje też flagę klucza specyficzną dla providera w trybie nieinteraktywnym:

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

`--custom-base-url` domyślnie ma wartość `http://127.0.0.1:11434`. `--custom-model-id` jest opcjonalne; jeśli zostanie pominięte, onboarding użyje sugerowanych ustawień domyślnych Ollama. Identyfikatory modeli chmurowych, takie jak `kimi-k2.5:cloud`, również tutaj działają.

Przechowuj klucze providerów jako refy zamiast zwykłego tekstu:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Przy `--secret-input-mode ref` onboarding zapisuje refy oparte na env zamiast kluczy w postaci zwykłego tekstu.
Dla providerów opartych na profilach auth zapisuje to wpisy `keyRef`; dla providerów niestandardowych zapisuje `models.providers.<id>.apiKey` jako env ref (na przykład `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrakt trybu nieinteraktywnego `ref`:

- Ustaw zmienną środowiskową providera w środowisku procesu onboardingu (na przykład `OPENAI_API_KEY`).
- Nie przekazuj flag z kluczem inline (na przykład `--openai-api-key`), chyba że ta zmienna środowiskowa jest również ustawiona.
- Jeśli flaga z kluczem inline zostanie przekazana bez wymaganej zmiennej środowiskowej, onboarding kończy się natychmiast błędem z instrukcją.

Opcje tokena Gateway w trybie nieinteraktywnym:

- `--gateway-auth token --gateway-token <token>` zapisuje token w postaci zwykłego tekstu.
- `--gateway-auth token --gateway-token-ref-env <name>` zapisuje `gateway.auth.token` jako env SecretRef.
- `--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.
- `--gateway-token-ref-env` wymaga niepustej zmiennej środowiskowej w środowisku procesu onboardingu.
- Przy `--install-daemon`, gdy uwierzytelnianie tokenem wymaga tokena, tokeny Gateway zarządzane przez SecretRef są walidowane, ale nie są utrwalane jako rozwiązany zwykły tekst w metadanych środowiska usługi supervisora.
- Przy `--install-daemon`, jeśli tryb tokena wymaga tokena, a skonfigurowany token SecretRef nie jest rozwiązany, onboarding kończy się w trybie fail-closed z instrukcją naprawczą.
- Przy `--install-daemon`, jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, onboarding blokuje instalację, dopóki tryb nie zostanie ustawiony jawnie.
- Lokalny onboarding zapisuje `gateway.mode="local"` w konfiguracji. Jeśli w późniejszym czasie w pliku konfiguracji brakuje `gateway.mode`, traktuj to jako uszkodzenie konfiguracji albo niekompletną ręczną edycję, a nie jako poprawny skrót dla trybu lokalnego.
- `--allow-unconfigured` to osobny mechanizm awaryjny runtime Gateway. Nie oznacza, że onboarding może pominąć `gateway.mode`.

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

Stan lokalnego Gateway w trybie nieinteraktywnym:

- O ile nie przekażesz `--skip-health`, onboarding czeka na osiągalny lokalny Gateway, zanim zakończy się powodzeniem.
- `--install-daemon` najpierw uruchamia ścieżkę instalacji zarządzanego Gateway. Bez tego musisz już mieć uruchomiony lokalny Gateway, na przykład `openclaw gateway run`.
- Jeśli w automatyzacji chcesz tylko zapisy konfiguracji/obszaru roboczego/bootstrapu, użyj `--skip-health`.
- W natywnym Windows `--install-daemon` najpierw próbuje użyć Harmonogramu zadań, a jeśli utworzenie zadania zostanie odrzucone, przechodzi do elementu logowania per użytkownik w folderze Autostart.

Zachowanie interaktywnego onboardingu w trybie referencji:

- Po wyświetleniu monitu wybierz **Use secret reference**.
- Następnie wybierz jedną z opcji:
  - Zmienna środowiskowa
  - Skonfigurowany provider sekretów (`file` lub `exec`)
- Onboarding wykonuje szybką walidację wstępną przed zapisaniem refa.
  - Jeśli walidacja się nie powiedzie, onboarding pokaże błąd i pozwoli spróbować ponownie.

Wybór endpointów Z.AI w trybie nieinteraktywnym:

Uwaga: `--auth-choice zai-api-key` teraz automatycznie wykrywa najlepszy endpoint Z.AI dla Twojego klucza (preferuje ogólne API z `zai/glm-5.1`).
Jeśli konkretnie chcesz endpointy GLM Coding Plan, wybierz `zai-coding-global` lub `zai-coding-cn`.

```bash
# Wybór endpointu bez promptów
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Inne opcje endpointów Z.AI:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Przykład Mistral w trybie nieinteraktywnym:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Uwagi o przepływach:

- `quickstart`: minimalna liczba promptów, automatycznie generuje token Gateway.
- `manual`: pełne prompty dla portu/bind/auth (alias `advanced`).
- Gdy wybór auth sugeruje preferowanego providera, onboarding wstępnie filtruje selektory modelu domyślnego i allowlist do tego providera. Dla Volcengine i BytePlus obejmuje to także warianty coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).
- Jeśli filtr preferowanego providera nie daje jeszcze żadnych załadowanych modeli, onboarding wraca do niefiltrowanego katalogu zamiast pozostawiać pusty selektor.
- W kroku wyszukiwania w sieci niektórzy providerzy mogą wywołać dodatkowe prompty specyficzne dla providera:
  - **Grok** może oferować opcjonalną konfigurację `x_search` z tym samym `XAI_API_KEY` i wyborem modelu `x_search`.
  - **Kimi** może pytać o region API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) oraz domyślny model Kimi do wyszukiwania w sieci.
- Zachowanie zakresu DM w lokalnym onboardingu: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals).
- Najszybszy pierwszy czat: `openclaw dashboard` (Control UI, bez konfiguracji kanału).
- Custom Provider: połącz dowolny endpoint zgodny z OpenAI lub Anthropic, w tym hostowanych providerów niewymienionych na liście. Użyj Unknown do automatycznego wykrywania.

## Typowe polecenia po konfiguracji

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie implikuje trybu nieinteraktywnego. W skryptach użyj `--non-interactive`.
</Note>
