---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten Codex-Abonnement-Auth statt API-Schlüsseln verwenden
summary: OpenAI in OpenClaw über API-Schlüssel oder Codex-Abonnement verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-04-07T06:19:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a2ce1ce5f085fe55ec50b8d20359180b9002c9730820cd5b0e011c3bf807b64
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI bietet Entwickler-APIs für GPT-Modelle. Codex unterstützt die **Anmeldung mit ChatGPT** für abonnementbasierten
Zugriff oder die **Anmeldung mit API-Schlüssel** für nutzungsbasierte Abrechnung. Codex Cloud erfordert eine Anmeldung mit ChatGPT.
OpenAI unterstützt die Nutzung von OAuth-Abonnements in externen Tools/Workflows wie OpenClaw ausdrücklich.

## Standard-Interaktionsstil

OpenClaw kann sowohl für `openai/*`- als auch für
`openai-codex/*`-Läufe ein kleines OpenAI-spezifisches Prompt-Overlay hinzufügen. Standardmäßig hält das Overlay den Assistenten warm,
kollaborativ, knapp, direkt und etwas emotional ausdrucksstärker,
ohne den grundlegenden OpenClaw-System-Prompt zu ersetzen. Das freundliche Overlay
erlaubt außerdem gelegentlich ein Emoji, wenn es natürlich passt, während die Gesamtausgabe
knapp bleibt.

Konfigurationsschlüssel:

`plugins.entries.openai.config.personality`

Zulässige Werte:

- `"friendly"`: Standard; aktiviert das OpenAI-spezifische Overlay.
- `"on"`: Alias für `"friendly"`.
- `"off"`: deaktiviert das Overlay und verwendet nur den grundlegenden OpenClaw-Prompt.

Geltungsbereich:

- Gilt für `openai/*`-Modelle.
- Gilt für `openai-codex/*`-Modelle.
- Betrifft keine anderen Anbieter.

Dieses Verhalten ist standardmäßig aktiviert. Behalten Sie `"friendly"` ausdrücklich bei, wenn Sie möchten, dass dies
künftige lokale Konfigurationsänderungen übersteht:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### Das OpenAI-Prompt-Overlay deaktivieren

Wenn Sie den unveränderten grundlegenden OpenClaw-Prompt möchten, setzen Sie das Overlay auf `"off"`:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

Sie können dies auch direkt mit der Konfigurations-CLI setzen:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

OpenClaw normalisiert diese Einstellung zur Laufzeit ohne Beachtung der Groß-/Kleinschreibung, daher deaktivieren Werte wie
`"Off"` ebenfalls das freundliche Overlay.

## Option A: OpenAI-API-Schlüssel (OpenAI Platform)

**Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.
Holen Sie sich Ihren API-Schlüssel im OpenAI-Dashboard.

Routenübersicht:

- `openai/gpt-5.4` = direkter API-Pfad der OpenAI Platform
- Erfordert `OPENAI_API_KEY` (oder gleichwertige OpenAI-Anbieterkonfiguration)
- In OpenClaw wird die Anmeldung mit ChatGPT/Codex über `openai-codex/*` geleitet, nicht über `openai/*`

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

Die aktuelle Modelldokumentation der OpenAI-API listet `gpt-5.4` und `gpt-5.4-pro` für die direkte
Nutzung der OpenAI-API auf. OpenClaw leitet beide über den `openai/*`-Responses-Pfad weiter.
OpenClaw unterdrückt absichtlich die veraltete Zeile `openai/gpt-5.3-codex-spark`,
weil direkte OpenAI-API-Aufrufe sie im Live-Datenverkehr ablehnen.

OpenClaw stellt `openai/gpt-5.3-codex-spark` **nicht** auf dem direkten OpenAI-
API-Pfad bereit. `pi-ai` liefert zwar weiterhin eine integrierte Zeile für dieses Modell aus, aber Live-OpenAI-API-
Anfragen lehnen es derzeit ab. Spark wird in OpenClaw als nur-Codex behandelt.

## Bildgenerierung

Das gebündelte `openai`-Plugin registriert außerdem die Bildgenerierung über das gemeinsame
Tool `image_generate`.

- Standard-Bildmodell: `openai/gpt-image-1`
- Generierung: bis zu 4 Bilder pro Anfrage
- Bearbeitungsmodus: aktiviert, bis zu 5 Referenzbilder
- Unterstützt `size`
- Aktueller OpenAI-spezifischer Vorbehalt: OpenClaw leitet `aspectRatio`- oder
  `resolution`-Überschreibungen derzeit nicht an die OpenAI Images API weiter

So verwenden Sie OpenAI als Standardanbieter für Bilder:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

Siehe [Image Generation](/de/tools/image-generation) für die gemeinsamen Tool-
Parameter, die Anbieterauswahl und das Failover-Verhalten.

## Videogenerierung

Das gebündelte `openai`-Plugin registriert außerdem die Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `openai/sora-2`
- Modi: Text-zu-Video-, Bild-zu-Video- und Einzelvideo-Referenz-/Bearbeitungsabläufe
- Aktuelle Grenzen: 1 Bild- oder 1 Video-Referenzeingabe
- Aktueller OpenAI-spezifischer Vorbehalt: OpenClaw leitet derzeit nur `size`-
  Überschreibungen für native OpenAI-Videogenerierung weiter. Nicht unterstützte optionale Überschreibungen
  wie `aspectRatio`, `resolution`, `audio` und `watermark` werden ignoriert
  und als Tool-Warnung zurückgemeldet.

So verwenden Sie OpenAI als Standardanbieter für Videos:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

Siehe [Video Generation](/de/tools/video-generation) für die gemeinsamen Tool-
Parameter, die Anbieterauswahl und das Failover-Verhalten.

## Option B: OpenAI Code (Codex)-Abonnement

**Am besten geeignet für:** die Verwendung von ChatGPT-/Codex-Abonnementzugriff statt eines API-Schlüssels.
Codex Cloud erfordert eine Anmeldung mit ChatGPT, während die Codex-CLI die Anmeldung mit ChatGPT oder API-Schlüssel unterstützt.

Routenübersicht:

- `openai-codex/gpt-5.4` = ChatGPT-/Codex-OAuth-Pfad
- Verwendet die Anmeldung mit ChatGPT/Codex, keinen direkten API-Schlüssel der OpenAI Platform
- Anbieterseitige Limits für `openai-codex/*` können von der Erfahrung in ChatGPT Web/App abweichen

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

Die aktuelle Codex-Dokumentation von OpenAI listet `gpt-5.4` als aktuelles Codex-Modell auf. OpenClaw
ordnet dies für die Nutzung mit ChatGPT-/Codex-OAuth `openai-codex/gpt-5.4` zu.

Dieser Pfad ist absichtlich von `openai/gpt-5.4` getrennt. Wenn Sie den
direkten API-Pfad der OpenAI Platform möchten, verwenden Sie `openai/*` mit einem API-Schlüssel. Wenn Sie
die Anmeldung mit ChatGPT/Codex möchten, verwenden Sie `openai-codex/*`.

Wenn beim Onboarding ein vorhandener Codex-CLI-Login wiederverwendet wird, bleiben diese Zugangsdaten
von der Codex-CLI verwaltet. Nach Ablauf liest OpenClaw zuerst erneut die externe Codex-Quelle
und schreibt die aktualisierte Zugangsinformation, wenn der Anbieter sie aktualisieren kann,
zurück in den Codex-Speicher, anstatt die Kontrolle in einer separaten, nur für OpenClaw bestimmten
Kopie zu übernehmen.

Wenn Ihr Codex-Konto für Codex Spark berechtigt ist, unterstützt OpenClaw außerdem:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw behandelt Codex Spark als nur-Codex. Es stellt keinen direkten
`openai/gpt-5.3-codex-spark`-Pfad mit API-Schlüssel bereit.

OpenClaw behält außerdem `openai-codex/gpt-5.3-codex-spark` bei, wenn `pi-ai`
es entdeckt. Behandeln Sie es als berechtigungsabhängig und experimentell: Codex Spark ist
getrennt von GPT-5.4 `/fast`, und die Verfügbarkeit hängt vom angemeldeten Codex- /
ChatGPT-Konto ab.

### Begrenzung des Codex-Kontextfensters

OpenClaw behandelt die Codex-Modellmetadaten und die Laufzeitbegrenzung des Kontexts als getrennte
Werte.

Für `openai-codex/gpt-5.4`:

- natives `contextWindow`: `1050000`
- Standard-Laufzeitbegrenzung für `contextTokens`: `272000`

So bleiben die Modellmetadaten wahrheitsgetreu, während das kleinere Standard-Laufzeit-
Fenster beibehalten wird, das in der Praxis bessere Latenz- und Qualitätsmerkmale hat.

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

### Transport-Standard

OpenClaw verwendet `pi-ai` für Modell-Streaming. Sowohl für `openai/*` als auch für
`openai-codex/*` ist der Standardtransport `"auto"` (WebSocket zuerst, dann SSE-
Fallback).

Im Modus `"auto"` wiederholt OpenClaw außerdem einen frühen, wiederholbaren WebSocket-Fehler
einmal, bevor auf SSE zurückgefallen wird. Der erzwungene Modus `"websocket"` zeigt Transport-
Fehler weiterhin direkt an, anstatt sie hinter einem Fallback zu verbergen.

Nach einem Verbindungsfehler oder einem frühen WebSocket-Fehler pro Turn im Modus `"auto"` markiert OpenClaw
den WebSocket-Pfad dieser Sitzung für etwa 60 Sekunden als degradiert und sendet
nachfolgende Turns während des Cooldowns über SSE, anstatt zwischen
Transporten hin- und herzuspringen.

Für native Endpunkte der OpenAI-Familie (`openai/*`, `openai-codex/*` und Azure
OpenAI Responses) hängt OpenClaw außerdem einen stabilen Sitzungs- und Turn-Identitätszustand
an Anfragen an, damit Wiederholungen, Neuverbindungen und SSE-Fallback auf dieselbe
Konversationsidentität ausgerichtet bleiben. Auf nativen Routen der OpenAI-Familie umfasst dies stabile
Identitätsheader für Sitzungs-/Turn-Anfragen sowie passende Transportmetadaten.

OpenClaw normalisiert außerdem OpenAI-Nutzungszähler über Transportvarianten hinweg, bevor sie
Status-/Sitzungsoberflächen erreichen. Nativer OpenAI-/Codex-Responses-Datenverkehr kann
die Nutzung entweder als `input_tokens` / `output_tokens` oder
`prompt_tokens` / `completion_tokens` melden; OpenClaw behandelt diese als dieselben Eingabe-
und Ausgabezähler für `/status`, `/usage` und Sitzungsprotokolle. Wenn nativer
WebSocket-Datenverkehr `total_tokens` auslässt (oder `0` meldet), greift OpenClaw auf
die normalisierte Summe aus Eingabe + Ausgabe zurück, damit Sitzungs-/Statusanzeigen gefüllt bleiben.

Sie können `agents.defaults.models.<provider/model>.params.transport` setzen:

- `"sse"`: SSE erzwingen
- `"websocket"`: WebSocket erzwingen
- `"auto"`: WebSocket versuchen, dann auf SSE zurückfallen

Für `openai/*` (Responses API) aktiviert OpenClaw außerdem standardmäßig WebSocket-Warm-up
(`openaiWsWarmup: true`), wenn WebSocket-Transport verwendet wird.

Verwandte OpenAI-Dokumentation:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

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
`openai/*`, um die Latenz beim ersten Turn zu reduzieren, wenn WebSocket-Transport verwendet wird.

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

### Warm-up ausdrücklich aktivieren

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

### Priority-Processing für OpenAI und Codex

Die API von OpenAI stellt Priority-Processing über `service_tier=priority` bereit. In
OpenClaw setzen Sie `agents.defaults.models["<provider>/<model>"].params.serviceTier`,
um dieses Feld auf nativen OpenAI-/Codex-Responses-Endpunkten weiterzureichen.

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
- wenn Sie einen der beiden Anbieter über eine andere Basis-URL oder einen Proxy leiten, lässt OpenClaw `service_tier` unverändert

### Schneller Modus für OpenAI

OpenClaw stellt einen gemeinsamen Umschalter für den schnellen Modus sowohl für `openai/*`- als auch
`openai-codex/*`-Sitzungen bereit:

- Chat/UI: `/fast status|on|off`
- Konfiguration: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Wenn der schnelle Modus aktiviert ist, ordnet OpenClaw ihn dem Priority-Processing von OpenAI zu:

- direkte `openai/*`-Responses-Aufrufe an `api.openai.com` senden `service_tier = "priority"`
- `openai-codex/*`-Responses-Aufrufe an `chatgpt.com/backend-api` senden ebenfalls `service_tier = "priority"`
- vorhandene Payload-Werte für `service_tier` bleiben erhalten
- der schnelle Modus schreibt `reasoning` oder `text.verbosity` nicht um

Speziell für GPT 5.4 ist die häufigste Einrichtung:

- senden Sie `/fast on` in einer Sitzung mit `openai/gpt-5.4` oder `openai-codex/gpt-5.4`
- oder setzen Sie `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- wenn Sie auch Codex OAuth verwenden, setzen Sie zusätzlich `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true`

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

### Native OpenAI- im Vergleich zu OpenAI-kompatiblen Routen

OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders
als generische OpenAI-kompatible `/v1`-Proxys:

- native `openai/*`-, `openai-codex/*`- und Azure-OpenAI-Routen behalten
  `reasoning: { effort: "none" }` unverändert bei, wenn Sie Reasoning ausdrücklich deaktivieren
- native Routen der OpenAI-Familie setzen Tool-Schemas standardmäßig auf den strikten Modus
- versteckte OpenClaw-Attributionsheader (`originator`, `version` und
  `User-Agent`) werden nur an verifizierte native OpenAI-Hosts
  (`api.openai.com`) und native Codex-Hosts (`chatgpt.com/backend-api`) angehängt
- native OpenAI-/Codex-Routen behalten nur-OpenAI-Anforderungs-Shaping wie
  `service_tier`, Responses-`store`, OpenAI-Reasoning-Kompatibilitäts-Payloads und
  Prompt-Cache-Hinweise bei
- proxyartige OpenAI-kompatible Routen behalten das lockerere Kompatibilitätsverhalten bei und
  erzwingen weder strikte Tool-Schemas noch natives Anforderungs-Shaping oder versteckte
  OpenAI-/Codex-Attributionsheader

Azure OpenAI bleibt für Transport- und Kompatibilitätsverhalten im Bucket für natives Routing,
erhält jedoch nicht die versteckten OpenAI-/Codex-Attributionsheader.

Dadurch bleibt das aktuelle native Verhalten von OpenAI Responses erhalten, ohne ältere
OpenAI-kompatible Shims auf Drittanbieter-Backends unter `/v1` zu erzwingen.

### Serverseitige Kompaktierung von OpenAI Responses

Für direkte OpenAI-Responses-Modelle (`openai/*` mit `api: "openai-responses"` und
`baseUrl` auf `api.openai.com`) aktiviert OpenClaw jetzt automatisch serverseitige
Payload-Hinweise zur Kompaktierung von OpenAI:

- Erzwingt `store: true` (es sei denn, die Modellkompatibilität setzt `supportsStore: false`)
- Injiziert `context_management: [{ type: "compaction", compact_threshold: ... }]`

Standardmäßig beträgt `compact_threshold` `70%` des Modell-`contextWindow` (oder `80000`,
wenn nicht verfügbar).

### Serverseitige Kompaktierung ausdrücklich aktivieren

Verwenden Sie dies, wenn Sie die Injektion von `context_management` auf kompatiblen
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

### Mit benutzerdefiniertem Schwellenwert aktivieren

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
Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, sofern die Kompatibilität nicht
`supportsStore: false` setzt.

## Hinweise

- Modellreferenzen verwenden immer `provider/model` (siehe [/concepts/models](/de/concepts/models)).
- Auth-Details + Regeln zur Wiederverwendung finden Sie unter [/concepts/oauth](/de/concepts/oauth).
