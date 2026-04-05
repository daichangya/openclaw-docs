---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten statt API-Schlüsseln die Codex-Abonnement-Authentifizierung verwenden
summary: OpenAI in OpenClaw über API-Schlüssel oder Codex-Abonnement verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-04-05T12:54:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537119853503d398f9136170ac12ecfdbd9af8aef3c4c011f8ada4c664bdaf6d
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI bietet Entwickler-APIs für GPT-Modelle. Codex unterstützt die **ChatGPT-Anmeldung** für abonnementbasierten
Zugriff oder die **API-Schlüssel**-Anmeldung für nutzungsbasierten Zugriff. Codex Cloud erfordert eine ChatGPT-Anmeldung.
OpenAI unterstützt ausdrücklich die Nutzung von Abonnement-OAuth in externen Tools/Workflows wie OpenClaw.

## Standard-Interaktionsstil

OpenClaw fügt standardmäßig ein kleines OpenAI-spezifisches Prompt-Overlay für sowohl
`openai/*`- als auch `openai-codex/*`-Läufe hinzu. Das Overlay hält den Assistenten warm,
kollaborativ, prägnant und direkt, ohne den grundlegenden OpenClaw-System-
Prompt zu ersetzen.

Konfigurationsschlüssel:

`plugins.entries.openai.config.personalityOverlay`

Erlaubte Werte:

- `"friendly"`: Standard; aktiviert das OpenAI-spezifische Overlay.
- `"off"`: deaktiviert das Overlay und verwendet nur den grundlegenden OpenClaw-Prompt.

Geltungsbereich:

- Gilt für `openai/*`-Modelle.
- Gilt für `openai-codex/*`-Modelle.
- Beeinflusst keine anderen Provider.

Dieses Verhalten ist standardmäßig aktiviert:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "friendly",
        },
      },
    },
  },
}
```

### Das OpenAI-Prompt-Overlay deaktivieren

Wenn Sie den unveränderten grundlegenden OpenClaw-Prompt bevorzugen, deaktivieren Sie das Overlay:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "off",
        },
      },
    },
  },
}
```

Sie können es auch direkt mit der Konfigurations-CLI setzen:

```bash
openclaw config set plugins.entries.openai.config.personalityOverlay off
```

## Option A: OpenAI-API-Schlüssel (OpenAI Platform)

**Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.
Beziehen Sie Ihren API-Schlüssel aus dem OpenAI-Dashboard.

### CLI-Einrichtung

```bash
openclaw onboard --auth-choice openai-api-key
# oder nicht interaktiv
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Konfigurationsbeispiel

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

In der aktuellen API-Modell-Dokumentation von OpenAI werden `gpt-5.4` und `gpt-5.4-pro` für die direkte
Nutzung der OpenAI-API aufgeführt. OpenClaw leitet beide über den `openai/*`-Responses-Pfad weiter.
OpenClaw unterdrückt absichtlich die veraltete Zeile `openai/gpt-5.3-codex-spark`,
weil direkte OpenAI-API-Aufrufe sie im Live-Verkehr ablehnen.

OpenClaw stellt `openai/gpt-5.3-codex-spark` nicht auf dem direkten OpenAI-
API-Pfad bereit. `pi-ai` liefert weiterhin eine integrierte Zeile für dieses Modell,
aber Live-Anfragen an die OpenAI-API lehnen es derzeit ab. Spark wird in OpenClaw als nur für Codex behandelt.

## Option B: Abonnement von OpenAI Code (Codex)

**Am besten geeignet für:** die Nutzung des ChatGPT-/Codex-Abonnementzugriffs statt eines API-Schlüssels.
Codex Cloud erfordert eine ChatGPT-Anmeldung, während die Codex CLI die Anmeldung per ChatGPT oder API-Schlüssel unterstützt.

### CLI-Einrichtung (Codex OAuth)

```bash
# Codex OAuth im Assistenten ausführen
openclaw onboard --auth-choice openai-codex

# Oder OAuth direkt ausführen
openclaw models auth login --provider openai-codex
```

### Konfigurationsbeispiel (Codex-Abonnement)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

In der aktuellen Codex-Dokumentation von OpenAI wird `gpt-5.4` als aktuelles Codex-Modell aufgeführt. OpenClaw
ordnet dies `openai-codex/gpt-5.4` für die Nutzung mit ChatGPT-/Codex-OAuth zu.

Wenn beim Onboarding eine vorhandene Codex-CLI-Anmeldung wiederverwendet wird, bleiben diese Anmeldedaten
von der Codex CLI verwaltet. Bei Ablauf liest OpenClaw zuerst erneut aus der externen Codex-Quelle
und schreibt die aktualisierte Berechtigung, wenn der Provider sie aktualisieren kann,
zurück in den Codex-Speicher, statt in einer separaten nur für OpenClaw bestimmten Kopie die Kontrolle zu übernehmen.

Wenn Ihr Codex-Konto Anspruch auf Codex Spark hat, unterstützt OpenClaw außerdem:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw behandelt Codex Spark als nur für Codex. Es stellt keinen direkten
API-Schlüssel-Pfad `openai/gpt-5.3-codex-spark` bereit.

OpenClaw bewahrt außerdem `openai-codex/gpt-5.3-codex-spark`, wenn `pi-ai`
es erkennt. Behandeln Sie es als anspruchsabhängig und experimentell: Codex Spark ist
getrennt von GPT-5.4 `/fast`, und die Verfügbarkeit hängt vom angemeldeten Codex-/
ChatGPT-Konto ab.

### Begrenzung des Codex-Kontextfensters

OpenClaw behandelt die Codex-Modellmetadaten und die Laufzeitbegrenzung des Kontexts als getrennte
Werte.

Für `openai-codex/gpt-5.4`:

- natives `contextWindow`: `1050000`
- standardmäßige Laufzeitbegrenzung für `contextTokens`: `272000`

Dadurch bleiben die Modellmetadaten korrekt, während das kleinere Standard-Laufzeitfenster erhalten bleibt,
das in der Praxis bessere Latenz- und Qualitätsmerkmale hat.

Wenn Sie eine andere effektive Begrenzung möchten, setzen Sie `models.providers.<provider>.models[].contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Verwenden Sie `contextWindow` nur, wenn Sie native Modellmetadaten deklarieren oder überschreiben.
Verwenden Sie `contextTokens`, wenn Sie das Laufzeitbudget für den Kontext begrenzen möchten.

### Standard-Transport

OpenClaw verwendet `pi-ai` für das Modell-Streaming. Für sowohl `openai/*` als auch
`openai-codex/*` ist der Standardtransport `"auto"` (zuerst WebSocket, dann
SSE-Fallback).

Im Modus `"auto"` versucht OpenClaw bei einem frühen, wiederholbaren WebSocket-Fehler außerdem einen erneuten Versuch,
bevor auf SSE zurückgefallen wird. Der erzwungene Modus `"websocket"` zeigt Transportfehler weiterhin direkt an,
statt sie hinter einem Fallback zu verbergen.

Nach einem Verbindungs- oder frühen WebSocket-Fehler in einem Zug im Modus `"auto"` markiert OpenClaw
den WebSocket-Pfad dieser Sitzung für etwa 60 Sekunden als beeinträchtigt und sendet
nachfolgende Züge während der Abkühlphase über SSE, statt zwischen den
Transports zu wechseln.

Für native Endpunkte der OpenAI-Familie (`openai/*`, `openai-codex/*` und Azure
OpenAI Responses) hängt OpenClaw an Anfragen außerdem stabile Sitzungs- und Zugidentitätszustände an,
damit Wiederholungen, Neuverbindungen und SSE-Fallback an derselben
Gesprächsidentität ausgerichtet bleiben. Auf nativen Routen der OpenAI-Familie umfasst dies stabile
Anfrage-Identitäts-Header für Sitzung/Zug plus passende Transportmetadaten.

OpenClaw normalisiert außerdem OpenAI-Nutzungszähler transportübergreifend, bevor sie
Sitzungs-/Statusoberflächen erreichen. Nativer OpenAI-/Codex-Responses-Verkehr kann
Nutzung entweder als `input_tokens` / `output_tokens` oder
`prompt_tokens` / `completion_tokens` melden; OpenClaw behandelt diese als dieselben Eingabe-
und Ausgabewerte für `/status`, `/usage` und Sitzungslogs. Wenn nativer
WebSocket-Verkehr `total_tokens` auslässt (oder `0` meldet), greift OpenClaw auf die normalisierte
Summe aus Eingabe + Ausgabe zurück, damit Anzeigen für Sitzung/Status gefüllt bleiben.

Sie können `agents.defaults.models.<provider/model>.params.transport` setzen:

- `"sse"`: SSE erzwingen
- `"websocket"`: WebSocket erzwingen
- `"auto"`: WebSocket versuchen, dann auf SSE zurückfallen

Für `openai/*` (Responses API) aktiviert OpenClaw standardmäßig außerdem das WebSocket-Warm-up
(`openaiWsWarmup: true`), wenn WebSocket-Transport verwendet wird.

Verwandte OpenAI-Dokumentation:

- [Realtime API mit WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming von API-Antworten (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### OpenAI-WebSocket-Warm-up

Die OpenAI-Dokumentation beschreibt Warm-up als optional. OpenClaw aktiviert es standardmäßig für
`openai/*`, um die Latenz des ersten Zuges bei Verwendung von WebSocket-Transport zu reduzieren.

### Warm-up deaktivieren

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Warm-up explizit aktivieren

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Prioritätsverarbeitung für OpenAI und Codex

Die API von OpenAI stellt Prioritätsverarbeitung über `service_tier=priority` bereit. In
OpenClaw setzen Sie `agents.defaults.models["<provider>/<model>"].params.serviceTier`,
um dieses Feld an native OpenAI-/Codex-Responses-Endpunkte weiterzugeben.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Unterstützte Werte sind `auto`, `default`, `flex` und `priority`.

OpenClaw leitet `params.serviceTier` sowohl an direkte `openai/*`-Responses-
Anfragen als auch an `openai-codex/*`-Codex-Responses-Anfragen weiter, wenn diese Modelle auf
die nativen OpenAI-/Codex-Endpunkte zeigen.

Wichtiges Verhalten:

- direktes `openai/*` muss auf `api.openai.com` zielen
- `openai-codex/*` muss auf `chatgpt.com/backend-api` zielen
- wenn Sie einen der Provider über eine andere Basis-URL oder einen Proxy leiten, lässt OpenClaw `service_tier` unverändert

### OpenAI-Schnellmodus

OpenClaw bietet einen gemeinsamen Schalter für den Schnellmodus für sowohl `openai/*`- als auch
`openai-codex/*`-Sitzungen:

- Chat/UI: `/fast status|on|off`
- Konfiguration: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Wenn der Schnellmodus aktiviert ist, ordnet OpenClaw ihn der Prioritätsverarbeitung von OpenAI zu:

- direkte `openai/*`-Responses-Aufrufe an `api.openai.com` senden `service_tier = "priority"`
- `openai-codex/*`-Responses-Aufrufe an `chatgpt.com/backend-api` senden ebenfalls `service_tier = "priority"`
- bestehende Payload-Werte für `service_tier` bleiben erhalten
- der Schnellmodus schreibt `reasoning` oder `text.verbosity` nicht um

Beispiel:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Das Löschen der Sitzungsüberschreibung in der Sitzungs-UI
setzt die Sitzung auf den konfigurierten Standard zurück.

### Native OpenAI- versus OpenAI-kompatible Routen

OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders
als generische OpenAI-kompatible `/v1`-Proxys:

- native `openai/*`-, `openai-codex/*`- und Azure-OpenAI-Routen behalten
  `reasoning: { effort: "none" }` unverändert bei, wenn Sie Reasoning ausdrücklich deaktivieren
- native Routen der OpenAI-Familie verwenden standardmäßig den Strict-Modus für Tool-Schemas
- versteckte OpenClaw-Attributions-Header (`originator`, `version` und
  `User-Agent`) werden nur an verifizierte native OpenAI-Hosts
  (`api.openai.com`) und native Codex-Hosts (`chatgpt.com/backend-api`) angehängt
- native OpenAI-/Codex-Routen behalten OpenAI-spezifisches Request-Shaping wie
  `service_tier`, Responses-`store`, OpenAI-Reasoning-Kompatibilitäts-Payloads und
  Hinweise für den Prompt-Cache bei
- OpenAI-kompatible Routen im Proxy-Stil behalten das lockerere Kompatibilitätsverhalten bei und
  erzwingen weder den Strict-Modus für Tool-Schemas noch natives Request-Shaping oder versteckte
  Attributions-Header für OpenAI/Codex

Azure OpenAI bleibt für Transport- und Kompatibilitätsverhalten in der nativen Routing-Kategorie,
erhält aber nicht die versteckten OpenAI-/Codex-Attributions-Header.

Dadurch bleibt das aktuelle native Verhalten von OpenAI Responses erhalten, ohne ältere
OpenAI-kompatible Shims auf Drittanbieter-Backends mit `/v1` zu erzwingen.

### Serverseitige Kompaktierung für OpenAI Responses

Für direkte OpenAI-Responses-Modelle (`openai/*` mit `api: "openai-responses"` und
`baseUrl` auf `api.openai.com`) aktiviert OpenClaw jetzt automatisch serverseitige
Payload-Hinweise für die OpenAI-Kompaktierung:

- Erzwingt `store: true` (es sei denn, die Modellkompatibilität setzt `supportsStore: false`)
- Injiziert `context_management: [{ type: "compaction", compact_threshold: ... }]`

Standardmäßig ist `compact_threshold` `70%` von `contextWindow` des Modells (oder `80000`,
wenn nicht verfügbar).

### Serverseitige Kompaktierung explizit aktivieren

Verwenden Sie dies, wenn Sie die Injektion von `context_management` bei kompatiblen
Responses-Modellen erzwingen möchten (zum Beispiel Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Mit einem benutzerdefinierten Schwellenwert aktivieren

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Serverseitige Kompaktierung deaktivieren

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` steuert nur die Injektion von `context_management`.
Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, es sei denn, die Kompatibilität setzt
`supportsStore: false`.

## Hinweise

- Modellreferenzen verwenden immer `provider/model` (siehe [/concepts/models](/de/concepts/models)).
- Details zur Authentifizierung und Regeln zur Wiederverwendung finden Sie unter [/concepts/oauth](/de/concepts/oauth).
