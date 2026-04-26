---
read_when:
    - Zmiana zachowania lub wartości domyślnych słów wybudzania głosowego
    - Dodawanie nowych platform Node, które wymagają synchronizacji słowa wybudzającego
summary: Globalne słowa wybudzania głosowego (zarządzane przez Gateway) i sposób ich synchronizacji między Node
title: Wybudzanie głosowe
x-i18n:
    generated_at: "2026-04-26T11:35:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw traktuje **słowa wybudzające jako jedną globalną listę** należącą do **Gateway**.

- Nie ma **niestandardowych słów wybudzających per Node**.
- **Każdy interfejs Node/aplikacji może edytować** listę; zmiany są zapisywane przez Gateway i rozgłaszane do wszystkich.
- macOS i iOS zachowują lokalne przełączniki **Voice Wake enabled/disabled** (lokalne UX i uprawnienia różnią się).
- Android obecnie ma wyłączone Voice Wake i używa ręcznego przepływu mikrofonu na karcie Voice.

## Przechowywanie (host Gateway)

Słowa wybudzające są przechowywane na maszynie gateway pod adresem:

- `~/.openclaw/settings/voicewake.json`

Kształt:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protokół

### Metody

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` z parametrami `{ triggers: string[] }` → `{ triggers: string[] }`

Uwagi:

- Wyzwalacze są normalizowane (przycinane, puste usuwane). Puste listy wracają do wartości domyślnych.
- Limity są egzekwowane dla bezpieczeństwa (limity liczby/długości).

### Metody routingu (wyzwalacz → cel)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` z parametrami `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Kształt `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Cele tras obsługują dokładnie jedno z poniższych:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Zdarzenia

- `voicewake.changed` ładunek `{ triggers: string[] }`
- `voicewake.routing.changed` ładunek `{ config: VoiceWakeRoutingConfig }`

Kto to otrzymuje:

- Wszyscy klienci WebSocket (aplikacja macOS, WebChat itd.)
- Wszystkie podłączone Node (iOS/Android), a także przy połączeniu Node jako początkowe wypchnięcie „bieżącego stanu”.

## Zachowanie klienta

### Aplikacja macOS

- Używa globalnej listy do bramkowania wyzwalaczy `VoiceWakeRuntime`.
- Edytowanie „Trigger words” w ustawieniach Voice Wake wywołuje `voicewake.set`, a następnie polega na rozgłoszeniu, aby utrzymać synchronizację innych klientów.

### Node iOS

- Używa globalnej listy do wykrywania wyzwalaczy przez `VoiceWakeManager`.
- Edytowanie Wake Words w Ustawieniach wywołuje `voicewake.set` (przez Gateway WS), a także utrzymuje lokalne wykrywanie słów wybudzających w responsywnym stanie.

### Node Android

- Voice Wake jest obecnie wyłączone w środowisku uruchomieniowym/ustawieniach Androida.
- Głos na Androidzie używa ręcznego przechwytywania mikrofonu na karcie Voice zamiast wyzwalaczy słów wybudzających.

## Powiązane

- [Tryb rozmowy](/pl/nodes/talk)
- [Audio i notatki głosowe](/pl/nodes/audio)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
