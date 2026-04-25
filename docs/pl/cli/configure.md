---
read_when:
    - Chcesz interaktywnie dostosować poświadczenia, urządzenia lub ustawienia domyślne agenta
summary: Dokumentacja CLI dla `openclaw configure` (interaktywne prompty konfiguracji)
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-25T13:43:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f445b1b5dd7198175c718d51ae50f9c9c0f3dcbb199adacf9155f6a512d93a
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Interaktywny prompt do konfigurowania poświadczeń, urządzeń i ustawień domyślnych agenta.

Uwaga: sekcja **Model** zawiera teraz wybór wielokrotny dla allowlisty
`agents.defaults.models` (co pojawia się w `/model` i selektorze modeli).
Wybory konfiguracji zależne od dostawcy scalają wybrane modele z istniejącą
allowlistą zamiast zastępować niezwiązanych dostawców już obecnych w konfiguracji.
Ponowne uruchomienie uwierzytelniania dostawcy z poziomu konfiguracji zachowuje
istniejące `agents.defaults.model.primary`; użyj `openclaw models auth login --provider <id> --set-default`
lub `openclaw models set <model>`, gdy celowo chcesz zmienić model domyślny.

Gdy konfiguracja startuje od wyboru uwierzytelniania dostawcy, selektory modelu
domyślnego i allowlisty automatycznie preferują tego dostawcę. Dla sparowanych dostawców, takich
jak Volcengine/BytePlus, ta sama preferencja dopasowuje również ich warianty
coding-plan (`volcengine-plan/*`, `byteplus-plan/*`). Jeśli filtr
preferowanego dostawcy zwróciłby pustą listę, konfiguracja wraca do
niefiltrowanego katalogu zamiast wyświetlać pusty selektor.

Wskazówka: `openclaw config` bez podpolecenia otwiera ten sam kreator. Użyj
`openclaw config get|set|unset` do nieinteraktywnych edycji.

Dla wyszukiwania w sieci `openclaw configure --section web` pozwala wybrać dostawcę
i skonfigurować jego poświadczenia. Niektórzy dostawcy pokazują też
dodatkowe prompty specyficzne dla dostawcy:

- **Grok** może oferować opcjonalną konfigurację `x_search` z tym samym `XAI_API_KEY` oraz
  pozwolić wybrać model `x_search`.
- **Kimi** może zapytać o region API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) oraz domyślny model wyszukiwania w sieci Kimi.

Powiązane:

- Dokumentacja referencyjna konfiguracji Gateway: [Configuration](/pl/gateway/configuration)
- CLI konfiguracji: [Config](/pl/cli/config)

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

- Wybór miejsca działania Gateway zawsze aktualizuje `gateway.mode`. Możesz wybrać „Continue” bez innych sekcji, jeśli to wszystko, czego potrzebujesz.
- Usługi zorientowane na kanały (Slack/Discord/Matrix/Microsoft Teams) podczas konfiguracji pytają o allowlisty kanałów/pokoi. Możesz podać nazwy lub identyfikatory; kreator rozwiązuje nazwy do identyfikatorów, gdy to możliwe.
- Jeśli uruchamiasz krok instalacji demona, uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, konfiguracja waliduje SecretRef, ale nie utrwala rozwiązanego jawnego tekstu tokenu w metadanych środowiska usługi nadzorcy.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef nie jest rozwiązany, konfiguracja blokuje instalację demona i pokazuje możliwe do wykonania wskazówki naprawcze.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, konfiguracja blokuje instalację demona do czasu jawnego ustawienia trybu.

## Przykłady

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Configuration](/pl/gateway/configuration)
