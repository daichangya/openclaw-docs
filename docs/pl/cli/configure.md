---
read_when:
    - Chcesz interaktywnie dostosować poświadczenia, urządzenia lub domyślne ustawienia agenta
summary: Dokumentacja CLI dla `openclaw configure` (interaktywne prompty konfiguracji)
title: configure
x-i18n:
    generated_at: "2026-04-23T09:58:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Interaktywny prompt do konfiguracji poświadczeń, urządzeń i domyślnych ustawień agenta.

Uwaga: sekcja **Model** zawiera teraz wielokrotny wybór dla listy dozwolonych
`agents.defaults.models` (co pojawia się w `/model` i selektorze modeli).
Wybory konfiguracji ograniczone do providera scalają wybrane modele z istniejącą
listą dozwolonych zamiast zastępować niezwiązanych providerów już obecnych
w konfiguracji.

Gdy configure uruchamia się z wyboru uwierzytelniania providera, selektory
domyślnego modelu i listy dozwolonych automatycznie preferują tego providera. W przypadku sparowanych providerów, takich
jak Volcengine/BytePlus, ta sama preferencja pasuje także do ich wariantów
planu kodowania (`volcengine-plan/*`, `byteplus-plan/*`). Jeśli filtr
preferowanego providera dałby pustą listę, configure wraca do nieprzefiltrowanego
katalogu zamiast pokazywać pusty selektor.

Wskazówka: `openclaw config` bez podpolecenia otwiera ten sam kreator. Użyj
`openclaw config get|set|unset` do zmian nieinteraktywnych.

W przypadku wyszukiwania w sieci `openclaw configure --section web` pozwala wybrać providera
i skonfigurować jego poświadczenia. Niektórzy providerzy pokazują też dalsze prompty specyficzne dla providera:

- **Grok** może oferować opcjonalną konfigurację `x_search` z tym samym `XAI_API_KEY` i
  pozwolić wybrać model `x_search`.
- **Kimi** może zapytać o region Moonshot API (`api.moonshot.ai` vs
  `api.moonshot.cn`) oraz domyślny model wyszukiwania w sieci Kimi.

Powiązane:

- Dokumentacja konfiguracji Gateway: [Configuration](/pl/gateway/configuration)
- CLI Config: [Config](/pl/cli/config)

## Opcje

- `--section <section>`: powtarzalny filtr sekcji

Dostępne sekcje:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Uwagi:

- Wybór miejsca uruchamiania Gateway zawsze aktualizuje `gateway.mode`. Możesz wybrać „Continue” bez innych sekcji, jeśli to wszystko, czego potrzebujesz.
- Usługi zorientowane na kanały (Slack/Discord/Matrix/Microsoft Teams) podczas konfiguracji pytają o listy dozwolonych kanałów/pokoi. Możesz wprowadzać nazwy lub ID; kreator rozwiązuje nazwy do ID, gdy to możliwe.
- Jeśli uruchamiasz krok instalacji daemona, uwierzytelnianie tokenem wymaga tokena, a `gateway.auth.token` jest zarządzane przez SecretRef, configure weryfikuje SecretRef, ale nie zapisuje rozwiązanych jawnych wartości tokena w metadanych środowiska usługi nadzorcy.
- Jeśli uwierzytelnianie tokenem wymaga tokena, a skonfigurowany SecretRef tokena jest nierozwiązany, configure blokuje instalację daemona i pokazuje konkretne wskazówki naprawcze.
- Jeśli skonfigurowano jednocześnie `gateway.auth.token` i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, configure blokuje instalację daemona, dopóki tryb nie zostanie jawnie ustawiony.

## Przykłady

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
