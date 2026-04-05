---
read_when:
    - Entwickeln oder Debuggen nativer OpenClaw-Plugins
    - Verstehen des Plugin-Fähigkeitsmodells oder der Zuständigkeitsgrenzen
    - Arbeiten an der Plugin-Ladepipeline oder dem Registry-System
    - Implementieren von Provider-Laufzeit-Hooks oder Channel-Plugins
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Zuständigkeiten, Verträge, Ladepipeline und Laufzeit-Helper'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-05T12:53:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bc9d7261c3c7878d37140be77f210dd262d6c3edee2491ea534aa599e2800c0
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin-Interna

<Info>
  Dies ist die **tiefgehende Architektur-Referenz**. Praktische Anleitungen findest du hier:
  - [Plugins installieren und verwenden](/tools/plugin) — Benutzerhandbuch
  - [Erste Schritte](/plugins/building-plugins) — erstes Plugin-Tutorial
  - [Channel-Plugins](/plugins/sdk-channel-plugins) — einen Messaging-Kanal erstellen
  - [Provider-Plugins](/plugins/sdk-provider-plugins) — einen Modell-Provider erstellen
  - [SDK-Überblick](/plugins/sdk-overview) — Import-Map und Registrierungs-API
</Info>

Diese Seite behandelt die interne Architektur des OpenClaw-Plugin-Systems.

## Öffentliches Fähigkeitsmodell

Fähigkeiten sind das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes native OpenClaw-Plugin registriert sich für einen oder mehrere Fähigkeitstypen:

| Fähigkeit              | Registrierungsverfahren                         | Beispiel-Plugins                     |
| ---------------------- | ----------------------------------------------- | ------------------------------------ |
| Textinferenz           | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                |
| Speech                 | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Echtzeit-Stimme        | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Web-Abruf              | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Websuche               | `api.registerWebSearchProvider(...)`            | `google`                             |
| Channel / Messaging    | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Ein Plugin, das null Fähigkeiten registriert, aber Hooks, Tools oder Dienste bereitstellt, ist ein **altes reines Hook-Plugin**. Dieses Muster wird weiterhin vollständig unterstützt.

### Haltung zur externen Kompatibilität

Das Fähigkeitsmodell ist im Core verankert und wird heute von gebündelten/nativen Plugins verwendet, aber für die Kompatibilität externer Plugins brauchen wir weiterhin eine höhere Hürde als „es wird exportiert, also ist es eingefroren“.

Aktuelle Leitlinien:

- **bestehende externe Plugins:** Hook-basierte Integrationen funktionsfähig halten; das gilt als Kompatibilitäts-Basis
- **neue gebündelte/native Plugins:** explizite Fähigkeitsregistrierung gegenüber vendor-spezifischen Direkteingriffen oder neuen reinen Hook-Designs bevorzugen
- **externe Plugins, die Fähigkeitsregistrierung übernehmen:** erlaubt, aber fähigkeitsspezifische Helper-Oberflächen als weiterentwickelbar behandeln, sofern die Dokumentation einen Vertrag nicht ausdrücklich als stabil markiert

Praktische Regel:

- APIs zur Fähigkeitsregistrierung sind die beabsichtigte Richtung
- alte Hooks bleiben während des Übergangs der sicherste Pfad ohne Inkompatibilitäten für externe Plugins
- exportierte Helper-Subpaths sind nicht alle gleichwertig; bevorzuge den schmalen dokumentierten Vertrag, nicht zufällig exportierte Helper

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen Registrierungsverhaltens in eine Form, nicht nur anhand statischer Metadaten:

- **plain-capability** -- registriert genau einen Fähigkeitstyp (zum Beispiel ein reines Provider-Plugin wie `mistral`)
- **hybrid-capability** -- registriert mehrere Fähigkeitstypen (zum Beispiel besitzt `openai` Textinferenz, Speech, Medienverständnis und Bildgenerierung)
- **hook-only** -- registriert nur Hooks (typisiert oder benutzerdefiniert), keine Fähigkeiten, Tools, Befehle oder Dienste
- **non-capability** -- registriert Tools, Befehle, Dienste oder Routen, aber keine Fähigkeiten

Verwende `openclaw plugins inspect <id>`, um die Form und Aufschlüsselung der Fähigkeiten eines Plugins zu sehen. Details findest du in der [CLI-Referenz](/cli/plugins#inspect).

### Alte Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für reine Hook-Plugins unterstützt. Alte reale Plugins sind weiterhin davon abhängig.

Richtung:

- funktionsfähig halten
- als alt dokumentieren
- für Arbeit an Modell-/Provider-Überschreibungen `before_model_resolve` bevorzugen
- für Prompt-Mutationen `before_prompt_build` bevorzugen
- erst entfernen, wenn die reale Nutzung sinkt und Fixture-Abdeckung die Sicherheit der Migration belegt

### Kompatibilitätssignale

Wenn du `openclaw doctor` oder `openclaw plugins inspect <id>` ausführst, kannst du eines dieser Labels sehen:

| Signal                     | Bedeutung                                                   |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, das veraltet ist     |
| **hard error**             | Konfiguration ist ungültig oder Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` führen heute zum Ausfall deines Plugins -- `hook-only` ist nur ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Ebenen:

1. **Manifest + Discovery**
   OpenClaw findet Kandidaten-Plugins aus konfigurierten Pfaden, Workspace-Wurzeln, globalen Erweiterungswurzeln und gebündelten Erweiterungen. Discovery liest zuerst native `openclaw.plugin.json`-Manifeste sowie unterstützte Bundle-Manifeste.
2. **Aktivierung + Validierung**
   Der Core entscheidet, ob ein entdecktes Plugin aktiviert, deaktiviert, blockiert oder für einen exklusiven Slot wie Memory ausgewählt wird.
3. **Laufzeitladen**
   Native OpenClaw-Plugins werden im selben Prozess über jiti geladen und registrieren Fähigkeiten in einer zentralen Registry. Kompatible Bundles werden in Registry-Einträge normalisiert, ohne Laufzeitcode zu importieren.
4. **Nutzung der Oberflächen**
   Der Rest von OpenClaw liest die Registry, um Tools, Channels, Provider-Setup, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.

Speziell für die Plugin-CLI ist die Discovery von Root-Befehlen in zwei Phasen aufgeteilt:

- Parse-Zeit-Metadaten stammen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche Plugin-CLI-Modul kann lazy bleiben und sich beim ersten Aufruf registrieren

Dadurch bleibt Plugin-eigener CLI-Code im Plugin, während OpenClaw Root-Befehlsnamen schon vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- Discovery und Konfigurationsvalidierung sollten auf Basis von **Manifest-/Schema-Metadaten** funktionieren, ohne Plugin-Code auszuführen
- natives Laufzeitverhalten kommt aus dem Pfad `register(api)` des Plugin-Moduls

Diese Aufteilung erlaubt es OpenClaw, Konfigurationen zu validieren, fehlende/deaktivierte Plugins zu erklären und UI-/Schema-Hinweise aufzubauen, bevor die vollständige Laufzeit aktiv ist.

### Channel-Plugins und das gemeinsame Message-Tool

Channel-Plugins müssen für normale Chat-Aktionen kein separates Send/Edit/React-Tool registrieren. OpenClaw behält ein gemeinsames `message`-Tool im Core, und Channel-Plugins besitzen die channelspezifische Discovery und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Core besitzt den gemeinsamen `message`-Tool-Host, Prompt-Verdrahtung, Session-/Thread-Buchführung und Ausführungs-Dispatch
- Channel-Plugins besitzen scoped Action-Discovery, Capability-Discovery und etwaige channelspezifische Schema-Fragmente
- Channel-Plugins besitzen die providerspezifische Grammatik für Session-Konversationen, also zum Beispiel wie Konversations-IDs Thread-IDs codieren oder von übergeordneten Konversationen erben
- Channel-Plugins führen die endgültige Aktion über ihren Action-Adapter aus

Für Channel-Plugins ist die SDK-Oberfläche `ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser einheitliche Discovery-Aufruf erlaubt es einem Plugin, seine sichtbaren Aktionen, Fähigkeiten und Schema-Beiträge gemeinsam zurückzugeben, sodass diese Teile nicht auseinanderlaufen.

Der Core übergibt den Laufzeit-Scope in diesen Discovery-Schritt. Wichtige Felder sind unter anderem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist für kontextsensitive Plugins wichtig. Ein Channel kann Message-Aktionen abhängig vom aktiven Konto, dem aktuellen Raum/Thread/Nachricht oder der vertrauenswürdigen Identität des Anfragenden ausblenden oder anzeigen, ohne channelspezifische Verzweigungen im zentralen `message`-Tool zu hart zu codieren.

Deshalb bleiben Änderungen am Embedded-Runner-Routing Plugin-Arbeit: Der Runner ist dafür verantwortlich, die aktuelle Chat-/Session-Identität an die Plugin-Discovery-Grenze weiterzugeben, damit das gemeinsame `message`-Tool für den aktuellen Zug die richtige plugin-eigene Oberfläche bereitstellt.

Für channel-eigene Ausführungs-Helper sollten gebündelte Plugins die Ausführungs-Laufzeit in ihren eigenen Erweiterungsmodulen behalten. Der Core besitzt nicht länger die Message-Action-Laufzeiten für Discord, Slack, Telegram oder WhatsApp unter `src/agents/tools`. Wir veröffentlichen keine separaten `plugin-sdk/*-action-runtime`-Subpaths, und gebündelte Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren erweiterungseigenen Modulen importieren.

Dieselbe Grenze gilt allgemein für provider-benannte SDK-Übergänge: Der Core sollte keine channelspezifischen Convenience-Barrels für Slack, Discord, Signal, WhatsApp oder ähnliche Erweiterungen importieren. Wenn der Core ein Verhalten benötigt, sollte er entweder das plugin-eigene `api.ts` / `runtime-api.ts`-Barrel des gebündelten Plugins verwenden oder den Bedarf in eine schmale generische Fähigkeit im gemeinsamen SDK überführen.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Channels, die zum gemeinsamen Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für channelspezifische Umfragesemantik oder zusätzliche Umfrageparameter

Der Core verzögert jetzt das gemeinsame Umfrage-Parsing, bis der plugin-eigene Umfrage-Dispatch die Aktion ablehnt, sodass plugin-eigene Umfrage-Handler channelspezifische Umfragefelder akzeptieren können, ohne zuvor vom generischen Umfrage-Parser blockiert zu werden.

Die vollständige Startsequenz findest du unter [Ladepipeline](#load-pipeline).

## Modell der Fähigkeitszuständigkeit

OpenClaw behandelt ein natives Plugin als Zuständigkeitsgrenze für ein **Unternehmen** oder ein **Feature**, nicht als Sammelsurium unverbundener Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte in der Regel alle OpenClaw-bezogenen Oberflächen dieses Unternehmens besitzen
- ein Feature-Plugin sollte in der Regel die vollständige von ihm eingeführte Feature-Oberfläche besitzen
- Channels sollten gemeinsame Core-Fähigkeiten verwenden, statt Provider-Verhalten ad hoc neu zu implementieren

Beispiele:

- das gebündelte Plugin `openai` besitzt das OpenAI-Modell-Provider-Verhalten und das OpenAI-Verhalten für Speech + Echtzeit-Stimme + Medienverständnis + Bildgenerierung
- das gebündelte Plugin `elevenlabs` besitzt das ElevenLabs-Speech-Verhalten
- das gebündelte Plugin `microsoft` besitzt das Microsoft-Speech-Verhalten
- das gebündelte Plugin `google` besitzt das Google-Modell-Provider-Verhalten sowie Google-Medienverständnis + Bildgenerierung + Websuche
- das gebündelte Plugin `firecrawl` besitzt das Firecrawl-Web-Abruf-Verhalten
- die gebündelten Plugins `minimax`, `mistral`, `moonshot` und `zai` besitzen ihre Backends für Medienverständnis
- das gebündelte Plugin `qwen` besitzt das Qwen-Text-Provider-Verhalten sowie Medienverständnis und Videogenerierung
- das Plugin `voice-call` ist ein Feature-Plugin: Es besitzt Call-Transport, Tools, CLI, Routen und Twilio-Media-Stream-Bridging, verwendet aber gemeinsame Fähigkeiten für Speech sowie Echtzeit-Transkription und Echtzeit-Stimme, statt Vendor-Plugins direkt zu importieren

Der beabsichtigte Endzustand ist:

- OpenAI lebt in einem Plugin, auch wenn es Textmodelle, Speech, Bilder und künftig Video umfasst
- ein anderer Vendor kann dasselbe für seinen eigenen Bereich tun
- Channels ist es egal, welches Vendor-Plugin den Provider besitzt; sie verwenden den gemeinsamen vom Core bereitgestellten Fähigkeitsvertrag

Das ist die entscheidende Unterscheidung:

- **Plugin** = Zuständigkeitsgrenze
- **Fähigkeit** = Core-Vertrag, den mehrere Plugins implementieren oder verwenden können

Wenn OpenClaw also einen neuen Bereich wie Video hinzufügt, lautet die erste Frage nicht: „Welcher Provider soll die Video-Verarbeitung hart codieren?“ Die erste Frage lautet: „Wie sieht der Core-Vertrag für die Videofähigkeit aus?“ Sobald dieser Vertrag existiert, können Vendor-Plugins sich dafür registrieren und Channel-/Feature-Plugins ihn verwenden.

Wenn die Fähigkeit noch nicht existiert, ist der richtige Schritt in der Regel:

1. die fehlende Fähigkeit im Core definieren
2. sie typisiert über die Plugin-API/Laufzeit bereitstellen
3. Channels/Features gegen diese Fähigkeit verdrahten
4. Vendor-Plugins Implementierungen registrieren lassen

So bleiben Zuständigkeiten explizit und es wird vermieden, dass Core-Verhalten von einem einzelnen Vendor oder einem einmaligen pluginspezifischen Codepfad abhängt.

### Fähigkeits-Schichtung

Verwende dieses mentale Modell, wenn du entscheidest, wo Code hingehört:

- **Core-Fähigkeitsschicht**: gemeinsame Orchestrierung, Richtlinien, Fallback, Regeln zum Konfigurationszusammenführen, Zustellungssemantik und typisierte Verträge
- **Vendor-Plugin-Schicht**: vendor-spezifische APIs, Auth, Modellkataloge, Sprachsynthese, Bildgenerierung, künftige Video-Backends, Usage-Endpunkte
- **Channel-/Feature-Plugin-Schicht**: Integration von Slack/Discord/voice-call/usw., die Core-Fähigkeiten verwendet und an einer Oberfläche bereitstellt

Zum Beispiel folgt TTS dieser Struktur:

- der Core besitzt Richtlinien für TTS zur Antwortzeit, Fallback-Reihenfolge, Präferenzen und Channel-Zustellung
- `openai`, `elevenlabs` und `microsoft` besitzen die Synthese-Implementierungen
- `voice-call` verwendet den Telephony-TTS-Laufzeit-Helper

Dasselbe Muster sollte für künftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Fähigkeiten

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame Verträge für Modelle, Speech, Echtzeit-Transkription, Echtzeit-Stimme, Medienverständnis, Bildgenerierung, Videogenerierung, Web-Abruf und Websuche hat, kann ein Vendor alle seine Oberflächen an einer Stelle besitzen:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Entscheidend sind nicht die exakten Helper-Namen. Entscheidend ist die Form:

- ein Plugin besitzt die Vendor-Oberfläche
- der Core besitzt weiterhin die Fähigkeitsverträge
- Channels und Feature-Plugins verwenden `api.runtime.*`-Helper, nicht Vendor-Code
- Vertragstests können überprüfen, dass das Plugin die Fähigkeiten registriert hat, für die es vorgibt zuständig zu sein

### Fähigkeitsbeispiel: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame Fähigkeit. Dasselbe Zuständigkeitsmodell gilt auch dort:

1. der Core definiert den Vertrag für Medienverständnis
2. Vendor-Plugins registrieren je nach Anwendbarkeit `describeImage`, `transcribeAudio` und `describeVideo`
3. Channels und Feature-Plugins verwenden das gemeinsame Core-Verhalten, statt direkt Vendor-Code anzubinden

So wird vermieden, die Video-Annahmen eines einzelnen Providers in den Core einzubrennen. Das Plugin besitzt die Vendor-Oberfläche; der Core besitzt den Fähigkeitsvertrag und das Fallback-Verhalten.

Videogenerierung folgt bereits genau diesem Ablauf: Der Core besitzt den typisierten Fähigkeitsvertrag und den Laufzeit-Helper, und Vendor-Plugins registrieren Implementierungen über `api.registerVideoGenerationProvider(...)`.

Du brauchst eine konkrete Einführungs-Checkliste? Siehe [Capability Cookbook](/tools/capability-cookbook).

## Verträge und Durchsetzung

Die Plugin-API-Oberfläche ist bewusst typisiert und in `OpenClawPluginApi` zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und die Laufzeit-Helper, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Core kann doppelte Zuständigkeiten zurückweisen, z. B. wenn zwei Plugins dieselbe Provider-ID registrieren
- beim Start können umsetzbare Diagnosen für fehlerhafte Registrierungen angezeigt werden
- Vertragstests können Zuständigkeiten gebündelter Plugins durchsetzen und stilles Abdriften verhindern

Es gibt zwei Ebenen der Durchsetzung:

1. **Durchsetzung bei der Laufzeit-Registrierung**
   Die Plugin-Registry validiert Registrierungen beim Laden der Plugins. Beispiele: doppelte Provider-IDs, doppelte Speech-Provider-IDs und fehlerhafte Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
2. **Vertragstests**
   Gebündelte Plugins werden während Testläufen in Vertrags-Registries erfasst, sodass OpenClaw Zuständigkeiten explizit prüfen kann. Heute wird das für Modell-Provider, Speech-Provider, Websuch-Provider und die Zuständigkeit gebündelter Registrierungen verwendet.

Die praktische Wirkung ist, dass OpenClaw im Voraus weiß, welches Plugin welche Oberfläche besitzt. Das erlaubt es Core und Channels, nahtlos zu komponieren, weil Zuständigkeit deklariert, typisiert und testbar ist, statt implizit zu sein.

### Was in einen Vertrag gehört

Gute Plugin-Verträge sind:

- typisiert
- klein
- fähigkeitsspezifisch
- vom Core besessen
- von mehreren Plugins wiederverwendbar
- von Channels/Features ohne Vendor-Wissen verwendbar

Schlechte Plugin-Verträge sind:

- vendorspezifische Richtlinien, die im Core versteckt sind
- einmalige Plugin-Notausgänge, die die Registry umgehen
- Channel-Code, der direkt in eine Vendor-Implementierung greift
- ad hoc-Laufzeitobjekte, die nicht Teil von `OpenClawPluginApi` oder `api.runtime` sind

Im Zweifel solltest du die Abstraktionsebene anheben: zuerst die Fähigkeit definieren, dann Plugins daran andocken lassen.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **im selben Prozess** wie das Gateway. Sie sind nicht sandboxed. Ein geladenes natives Plugin hat dieselbe vertrauensbezogene Prozessgrenze wie Core-Code.

Folgen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren
- ein Fehler in einem nativen Plugin kann das Gateway zum Absturz bringen oder destabilisieren
- ein bösartiges natives Plugin entspricht beliebiger Codeausführung innerhalb des OpenClaw-Prozesses

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit als Metadaten-/Content-Pakete behandelt. In aktuellen Releases bedeutet das hauptsächlich gebündelte Skills.

Verwende Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Betrachte Workspace-Plugins als Entwicklungscode, nicht als Produktionsstandard.

Bei gebündelten Workspace-Paketnamen sollte die Plugin-ID im npm-Namen verankert bleiben: standardmäßig `@openclaw/<id>` oder ein genehmigtes typisiertes Suffix wie `-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn das Paket bewusst eine engere Plugin-Rolle bereitstellt.

Wichtiger Vertrauenshinweis:

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft des Quellcodes.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert bzw. auf der Allowlist steht.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.

## Exportgrenze

OpenClaw exportiert Fähigkeiten, nicht Komfort-Implementierungen.

Die Fähigkeitsregistrierung soll öffentlich bleiben. Nicht-vertragliche Helper-Exporte sollten reduziert werden:

- Helper-Subpaths, die spezifisch für gebündelte Plugins sind
- Laufzeit-Plumbing-Subpaths, die nicht als öffentliche API gedacht sind
- vendorspezifische Convenience-Helper
- Setup-/Onboarding-Helper, die Implementierungsdetails sind

Einige Helper-Subpaths gebündelter Plugins sind aus Kompatibilitätsgründen und für die Wartung gebündelter Plugins weiterhin in der generierten SDK-Export-Map vorhanden. Aktuelle Beispiele sind `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` und mehrere `plugin-sdk/matrix*`-Übergänge. Behandle diese als reservierte, implementierungsbezogene Exporte und nicht als empfohlenes SDK-Muster für neue Drittanbieter-Plugins.

## Ladepipeline

Beim Start führt OpenClaw ungefähr Folgendes aus:

1. Kandidaten-Plugin-Wurzeln entdecken
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`, `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten festlegen
6. aktivierte native Module über jiti laden
7. native Hooks `register(api)` (oder `activate(api)` — ein alter Alias) aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry an Befehls-/Laufzeit-Oberflächen bereitstellen

<Note>
`activate` ist ein alter Alias für `register` — der Loader löst auf, welches vorhanden ist (`def.register ?? def.activate`), und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzuge `register` für neue Plugins.
</Note>

Die Sicherheitsprüfungen finden **vor** der Laufzeitausführung statt. Kandidaten werden blockiert, wenn der Einstiegspunkt die Plugin-Wurzel verlässt, der Pfad weltbeschreibbar ist oder die Pfad-Eigentümerschaft bei nicht gebündelten Plugins verdächtig aussieht.

### Manifest-First-Verhalten

Das Manifest ist die Quelle der Wahrheit für die Control Plane. OpenClaw nutzt es, um:

- das Plugin zu identifizieren
- deklarierte Channels/Skills/Konfigurationsschema oder Bundle-Fähigkeiten zu entdecken
- `plugins.entries.<id>.config` zu validieren
- Labels/Platzhalter in der Control UI zu ergänzen
- Installations-/Katalog-Metadaten anzuzeigen

Bei nativen Plugins ist das Laufzeitmodul der Data-Plane-Teil. Es registriert tatsächliches Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

### Was der Loader cached

OpenClaw hält kurze prozessinterne Caches für:

- Discovery-Ergebnisse
- Daten der Manifest-Registry
- geladene Plugin-Registries

Diese Caches reduzieren spitzenartige Startlast und den Overhead wiederholter Befehle. Man kann sie als kurzlebige Performance-Caches verstehen, nicht als Persistenz.

Hinweis zur Performance:

- Setze `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Passe die Cache-Fenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` an.

## Registry-Modell

Geladene Plugins verändern nicht direkt beliebige globale Core-Zustände. Sie registrieren sich in einer zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Einträge (Identität, Quelle, Ursprung, Status, Diagnosen)
- Tools
- alte Hooks und typisierte Hooks
- Channels
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrar-Funktionen
- Hintergrunddienste
- plugin-eigene Befehle

Core-Features lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen zu sprechen. Dadurch bleibt das Laden einseitig:

- Plugin-Modul -> Registrierung in der Registry
- Core-Laufzeit -> Nutzung der Registry

Diese Trennung ist für die Wartbarkeit wichtig. Sie bedeutet, dass die meisten Core-Oberflächen nur einen Integrationspunkt brauchen: „die Registry lesen“, nicht „jedes Plugin-Modul speziell behandeln“.

## Callbacks für Konversations-Bindung

Plugins, die eine Konversation binden, können reagieren, wenn eine Genehmigung aufgelöst wurde.

Verwende `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem ein Bindungsantrag genehmigt oder abgelehnt wurde:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Felder der Callback-Nutzlast:

- `status`: `"approved"` oder `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oder `"deny"`
- `binding`: die aufgelöste Bindung für genehmigte Anfragen
- `request`: die ursprüngliche Anfragezusammenfassung, Detach-Hinweis, Sender-ID und Konversationsmetadaten

Dieser Callback ist nur eine Benachrichtigung. Er ändert nicht, wer eine Konversation binden darf, und er läuft erst, nachdem die Genehmigungsbehandlung des Core abgeschlossen ist.

## Provider-Laufzeit-Hooks

Provider-Plugins haben jetzt zwei Ebenen:

- Manifest-Metadaten: `providerAuthEnvVars` für kostengünstige Env-Auth-Ermittlung vor dem Laufzeitladen sowie `providerAuthChoices` für kostengünstige Labels für Onboarding/Auth-Auswahl und CLI-Flag-Metadaten vor dem Laufzeitladen
- Hooks zur Konfigurationszeit: `catalog` / altes `discovery` sowie `applyConfigDefaults`
- Laufzeit-Hooks: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw besitzt weiterhin die generische Agent-Schleife, Failover, Transkriptbehandlung und Tool-Richtlinien. Diese Hooks sind die Erweiterungsoberfläche für providerspezifisches Verhalten, ohne einen vollständig benutzerdefinierten Inferenz-Transport zu benötigen.

Verwende das Manifest-Feld `providerAuthEnvVars`, wenn der Provider env-basierte Zugangsdaten hat, die generische Auth-/Status-/Modellpicker-Pfade sehen sollen, ohne die Plugin-Laufzeit zu laden. Verwende das Manifest-Feld `providerAuthChoices`, wenn Onboarding-/Auth-Choice-CLI-Oberflächen die Choice-ID, Gruppenlabels und einfache One-Flag-Auth-Verdrahtung des Providers kennen sollen, ohne die Provider-Laufzeit zu laden. Behalte Provider-Laufzeit-`envVars` für operatororientierte Hinweise wie Onboarding-Labels oder Setup-Variablen für OAuth-Client-ID/Client-Secret.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks ungefähr in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist die schnelle Entscheidungshilfe.

| #   | Hook                              | Was er tut                                                                              | Wann verwenden                                                                                                                              |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Provider-Konfiguration während der Generierung von `models.json` in `models.providers` veröffentlichen | Der Provider besitzt einen Katalog oder Standardwerte für Base-URLs                                                                         |
| 2   | `applyConfigDefaults`             | globale providerspezifische Konfigurationsstandardwerte während der Materialisierung anwenden | Standardwerte hängen von Auth-Modus, Env oder Semantik der Provider-Modellfamilie ab                                                       |
| --  | _(integrierte Modellsuche)_       | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                             | _(kein Plugin-Hook)_                                                                                                                        |
| 3   | `normalizeModelId`                | alte oder Preview-Aliasse für Modell-IDs vor der Suche normalisieren                    | Der Provider besitzt Alias-Bereinigung vor der kanonischen Modellauflösung                                                                  |
| 4   | `normalizeTransport`              | providerspezifische `api` / `baseUrl` vor der generischen Modellerstellung normalisieren | Der Provider besitzt Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                               |
| 5   | `normalizeConfig`                 | `models.providers.<id>` vor Laufzeit-/Provider-Auflösung normalisieren                  | Der Provider benötigt Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Google-Familien-Helper stützen außerdem unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | native Streaming-Usage-Kompatibilitäts-Umschreibungen auf Konfigurations-Provider anwenden | Der Provider braucht endpointgesteuerte Korrekturen für native Streaming-Usage-Metadaten                                                   |
| 7   | `resolveConfigApiKey`             | Env-Marker-Auth für Konfigurations-Provider vor dem Laden der Laufzeit-Auth auflösen    | Der Provider besitzt providerspezifische Auflösung von Env-Marker-API-Keys; `amazon-bedrock` hat hier außerdem einen integrierten AWS-Env-Marker-Resolver |
| 8   | `resolveSyntheticAuth`            | lokale/self-hosted oder konfigurationsbasierte Auth anzeigen, ohne Klartext zu persistieren | Der Provider kann mit einem synthetischen/lokalen Credential-Marker arbeiten                                                                |
| 9   | `shouldDeferSyntheticProfileAuth` | gespeicherte synthetische Profil-Platzhalter hinter Env-/konfigurationsgestützter Auth zurückstufen | Der Provider speichert synthetische Platzhalterprofile, die keinen Vorrang haben sollten                                                   |
| 10  | `resolveDynamicModel`             | synchroner Fallback für provider-eigene Modell-IDs, die noch nicht in der lokalen Registry sind | Der Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                       |
| 11  | `prepareDynamicModel`             | asynchrones Warm-up, danach läuft `resolveDynamicModel` erneut                          | Der Provider benötigt Netzwerk-Metadaten, bevor unbekannte IDs aufgelöst werden können                                                     |
| 12  | `normalizeResolvedModel`          | endgültige Umschreibung, bevor der Embedded Runner das aufgelöste Modell verwendet      | Der Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Core-Transport                                               |
| 13  | `contributeResolvedModelCompat`   | Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport beitragen | Der Provider erkennt seine eigenen Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                           |
| 14  | `capabilities`                    | providerspezifische Metadaten für Transkripte/Tooling, die von gemeinsamer Core-Logik genutzt werden | Der Provider benötigt Transkript-/Providerfamilien-Sonderfälle                                                                              |
| 15  | `normalizeToolSchemas`            | Tool-Schemata normalisieren, bevor der Embedded Runner sie sieht                        | Der Provider benötigt Bereinigung von Schemata für eine Transportfamilie                                                                    |
| 16  | `inspectToolSchemas`              | providerspezifische Schema-Diagnosen nach der Normalisierung bereitstellen              | Der Provider will Keyword-Warnungen anzeigen, ohne dem Core providerspezifische Regeln beizubringen                                        |
| 17  | `resolveReasoningOutputMode`      | nativen oder getaggten Vertrag für den Reasoning-Output auswählen                       | Der Provider benötigt getaggten Reasoning-/Final-Output statt nativer Felder                                                               |
| 18  | `prepareExtraParams`              | Request-Param-Normalisierung vor generischen Stream-Option-Wrappern                     | Der Provider benötigt Standard-Request-Parameter oder providerspezifische Param-Bereinigung                                                 |
| 19  | `createStreamFn`                  | den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport ersetzen | Der Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                      |
| 20  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                            | Der Provider benötigt Wrapper für Request-Header/Body/Modell-Kompatibilität ohne benutzerdefinierten Transport                             |
| 21  | `resolveTransportTurnState`       | native Turn-spezifische Transport-Header oder Metadaten anhängen                        | Der Provider will, dass generische Transporte provider-native Turn-Identität senden                                                         |
| 22  | `resolveWebSocketSessionPolicy`   | native WebSocket-Header oder Session-Cool-down-Richtlinien anhängen                     | Der Provider will, dass generische WS-Transporte Session-Header oder Fallback-Richtlinien abstimmen                                        |
| 23  | `formatApiKey`                    | Formatter für Auth-Profile: gespeichertes Profil wird zur Laufzeit-`apiKey`-Zeichenkette | Der Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Laufzeit-Tokenform                                  |
| 24  | `refreshOAuth`                    | OAuth-Refresh-Override für benutzerdefinierte Refresh-Endpunkte oder Refresh-Fehler-Richtlinien | Der Provider passt nicht zu den gemeinsamen `pi-ai`-Refresh-Mechanismen                                                                    |
| 25  | `buildAuthDoctorHint`             | Reparaturhinweis anhängen, wenn OAuth-Refresh fehlschlägt                               | Der Provider benötigt providerspezifische Hinweise zur Auth-Reparatur nach einem fehlgeschlagenen Refresh                                  |
| 26  | `matchesContextOverflowError`     | providerspezifische Erkennung für Context-Window-Überlauf                               | Der Provider hat rohe Overflow-Fehler, die generische Heuristiken übersehen würden                                                         |
| 27  | `classifyFailoverReason`          | providerspezifische Klassifizierung des Failover-Grunds                                 | Der Provider kann rohe API-/Transport-Fehler auf Rate-Limit/Überlast/usw. abbilden                                                         |
| 28  | `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                    | Der Provider braucht proxiespezifisches Cache-TTL-Gating                                                                                    |
| 29  | `buildMissingAuthMessage`         | Ersatz für die generische Recovery-Meldung bei fehlender Auth                           | Der Provider benötigt einen providerspezifischen Recovery-Hinweis bei fehlender Auth                                                        |
| 30  | `suppressBuiltInModel`            | Unterdrückung veralteter Upstream-Modelle plus optionaler benutzerseitiger Fehlerhinweis | Der Provider muss veraltete Upstream-Zeilen ausblenden oder durch einen Vendor-Hinweis ersetzen                                            |
| 31  | `augmentModelCatalog`             | synthetische/endgültige Katalogzeilen nach der Discovery anhängen                       | Der Provider benötigt synthetische Vorwärtskompatibilitäts-Zeilen in `models list` und Pickern                                             |
| 32  | `isBinaryThinking`                | Reasoning-Umschalter Ein/Aus für Provider mit binärem Thinking                          | Der Provider bietet nur binäres Thinking Ein/Aus an                                                                                         |
| 33  | `supportsXHighThinking`           | Unterstützung für `xhigh`-Reasoning bei ausgewählten Modellen                           | Der Provider möchte `xhigh` nur bei einer Teilmenge von Modellen                                                                            |
| 34  | `resolveDefaultThinkingLevel`     | Standard-`/think`-Stufe für eine bestimmte Modellfamilie                                | Der Provider besitzt die Standard-`/think`-Richtlinie für eine Modellfamilie                                                               |
| 35  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profilfilter und Smoke-Auswahl                     | Der Provider besitzt die Zuordnung bevorzugter Modelle für Live-/Smoke-Tests                                                                |
| 36  | `prepareRuntimeAuth`              | eine konfigurierte Credential unmittelbar vor der Inferenz in das eigentliche Laufzeit-Token/den Schlüssel umwandeln | Der Provider benötigt einen Token-Austausch oder kurzlebige Request-Credentials                                                            |
| 37  | `resolveUsageAuth`                | Credentials für Usage/Abrechnung für `/usage` und verwandte Status-Oberflächen auflösen | Der Provider benötigt benutzerdefiniertes Parsing von Usage-/Quota-Tokens oder andere Usage-Credentials                                    |
| 38  | `fetchUsageSnapshot`              | providerspezifische Usage-/Quota-Snapshots abrufen und normalisieren, nachdem Auth aufgelöst ist | Der Provider benötigt einen providerspezifischen Usage-Endpunkt oder Payload-Parser                                                        |
| 39  | `createEmbeddingProvider`         | einen provider-eigenen Embedding-Adapter für Memory/Suche erstellen                     | Verhalten für Memory-Embeddings gehört zum Provider-Plugin                                                                                  |
| 40  | `buildReplayPolicy`               | eine Replay-Richtlinie zurückgeben, die die Transkriptbehandlung für den Provider steuert | Der Provider benötigt eine benutzerdefinierte Transkript-Richtlinie (z. B. Entfernen von Thinking-Blöcken)                                 |
| 41  | `sanitizeReplayHistory`           | Replay-Historie nach generischer Transkript-Bereinigung umschreiben                     | Der Provider benötigt providerspezifische Replay-Umschreibungen jenseits gemeinsamer Kompaktierungs-Helper                                 |
| 42  | `validateReplayTurns`             | abschließende Replay-Turn-Validierung oder Umformung vor dem Embedded Runner            | Der Provider-Transport benötigt strengere Turn-Validierung nach generischer Bereinigung                                                     |
| 43  | `onModelSelected`                 | providerspezifische Nebeneffekte nach der Modellauswahl ausführen                       | Der Provider benötigt Telemetrie oder provider-eigenen Zustand, wenn ein Modell aktiv wird                                                  |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das passende Provider-Plugin und fallen dann auf andere Hook-fähige Provider-Plugins zurück, bis tatsächlich eines die Modell-ID oder den Transport/die Konfiguration ändert. Dadurch bleiben Alias-/Kompatibilitäts-Shims für Provider funktionsfähig, ohne dass der Aufrufer wissen muss, welches gebündelte Plugin für die Umschreibung zuständig ist. Wenn kein Provider-Hook einen unterstützten Google-Familien-Konfigurationseintrag umschreibt, greift weiterhin der gebündelte Google-Konfigurations-Normalizer für diese Kompatibilitäts-Bereinigung.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protokoll oder einen benutzerdefinierten Request-Executor benötigt, ist das eine andere Klasse von Erweiterung. Diese Hooks sind für Provider-Verhalten gedacht, das weiterhin auf der normalen Inferenzschleife von OpenClaw läuft.

### Provider-Beispiel

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Integrierte Beispiele

- Anthropic verwendet `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  und `wrapStreamFn`, weil es Vorwärtskompatibilität für Claude 4.6,
  Hinweise für die Provider-Familie, Anleitung zur Auth-Reparatur, Integration
  des Usage-Endpunkts, Prompt-Cache-Berechtigung, auth-bewusste Konfigurationsstandardwerte, Claude-
  Standard-/adaptive Thinking-Richtlinien und Anthropic-spezifische Stream-Formung für
  Beta-Header, `/fast` / `serviceTier` und `context1m` besitzt.
- Die Claude-spezifischen Stream-Helper von Anthropic bleiben vorerst im eigenen
  öffentlichen Übergang `api.ts` / `contract-api.ts` des gebündelten Plugins. Diese
  Paketoberfläche exportiert `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die Low-Level-
  Wrapper-Builder für Anthropic, statt das generische SDK um die Beta-Header-Regeln
  eines einzigen Providers zu verbreitern.
- OpenAI verwendet `resolveDynamicModel`, `normalizeResolvedModel` und
  `capabilities` sowie `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` und `isModernModelRef`,
  weil es Vorwärtskompatibilität für GPT-5.4, die direkte OpenAI-
  Normalisierung `openai-completions` -> `openai-responses`, auth-Hinweise
  mit Codex-Bezug, Spark-Unterdrückung, synthetische OpenAI-Listenzeilen und die Richtlinien
  für GPT-5-Thinking / Live-Modelle besitzt; die Stream-Familie `openai-responses-defaults`
  besitzt die gemeinsamen nativen OpenAI-Responses-Wrapper für
  Attributions-Header, `/fast`/`serviceTier`, Text-Verbosity, native Codex-Websuche,
  Formung von Reasoning-Kompatibilitäts-Payloads und Responses-Context-Management.
- OpenRouter verwendet `catalog` sowie `resolveDynamicModel` und
  `prepareDynamicModel`, weil der Provider pass-through ist und neue
  Modell-IDs anzeigen kann, bevor der statische Katalog von OpenClaw aktualisiert wurde; es verwendet auch
  `capabilities`, `wrapStreamFn` und `isCacheTtlEligible`, um
  providerspezifische Request-Header, Routing-Metadaten, Reasoning-Patches und
  Prompt-Cache-Richtlinien aus dem Core herauszuhalten. Seine Replay-Richtlinie stammt aus der
  Familie `passthrough-gemini`, während die Stream-Familie `openrouter-thinking`
  Proxy-Reasoning-Injektion und das Überspringen nicht unterstützter Modelle / von `auto` besitzt.
- GitHub Copilot verwendet `catalog`, `auth`, `resolveDynamicModel` und
  `capabilities` sowie `prepareRuntimeAuth` und `fetchUsageSnapshot`,
  weil es providerspezifischen Device-Login, Fallback-Verhalten bei Modellen, Claude-Transkript-Sonderfälle,
  einen Austausch GitHub-Token -> Copilot-Token und einen provider-eigenen Usage-Endpunkt benötigt.
- OpenAI Codex verwendet `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` und `augmentModelCatalog` sowie
  `prepareExtraParams`, `resolveUsageAuth` und `fetchUsageSnapshot`,
  weil es weiterhin auf den OpenAI-Transporten des Core läuft, aber
  seine Transport-/Base-URL-Normalisierung, OAuth-Refresh-Fallback-Richtlinie, Standardwahl
  des Transports, synthetische Codex-Katalogzeilen und die Integration des ChatGPT-Usage-Endpunkts besitzt;
  es teilt sich dieselbe Stream-Familie `openai-responses-defaults` mit direktem OpenAI.
- Google AI Studio und Gemini CLI OAuth verwenden `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` und `isModernModelRef`, weil die
  Replay-Familie `google-gemini` Vorwärtskompatibilitäts-Fallback für Gemini 3.1,
  native Gemini-Replay-Validierung, Bootstrap-Replay-Bereinigung, getaggten
  Reasoning-Output-Modus und modernes Modell-Matching besitzt, während die
  Stream-Familie `google-thinking` die Normalisierung der Gemini-Thinking-Payload besitzt;
  Gemini CLI OAuth verwendet außerdem `formatApiKey`, `resolveUsageAuth` und
  `fetchUsageSnapshot` für Token-Formatierung, Token-Parsing und Verdrahtung des
  Quota-Endpunkts.
- Anthropic Vertex verwendet `buildReplayPolicy` über die Replay-Familie
  `anthropic-by-model`, damit Claude-spezifische Replay-Bereinigung auf Claude-IDs begrenzt bleibt
  statt auf jeden `anthropic-messages`-Transport.
- Amazon Bedrock verwendet `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` und `resolveDefaultThinkingLevel`, weil es
  Bedrock-spezifische Klassifizierung von Drosselungs-/Not-ready-/Context-Overflow-Fehlern
  für Anthropic-on-Bedrock-Datenverkehr besitzt; seine Replay-Richtlinie teilt weiterhin denselben
  nur für Claude geltenden Schutz `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode und Opencode Go verwenden `buildReplayPolicy`
  über die Replay-Familie `passthrough-gemini`, weil sie Gemini-
  Modelle über OpenAI-kompatible Transporte proxien und daher
  Thought-Signature-Bereinigung für Gemini benötigen, aber keine native Gemini-Replay-Validierung oder
  Bootstrap-Umschreibungen.
- MiniMax verwendet `buildReplayPolicy` über die Replay-Familie
  `hybrid-anthropic-openai`, weil ein Provider sowohl
  Anthropic-Message- als auch OpenAI-kompatible Semantik besitzt; so bleibt das Entfernen von Thinking-Blöcken
  nur für Claude auf der Anthropic-Seite erhalten, während der Reasoning-
  Output-Modus wieder auf nativ überschrieben wird, und die Stream-Familie `minimax-fast-mode`
  besitzt Fast-Mode-Modell-Umschreibungen auf dem gemeinsamen Stream-Pfad.
- Moonshot verwendet `catalog` plus `wrapStreamFn`, weil es weiterhin den gemeinsamen
  OpenAI-Transport verwendet, aber providerspezifische Normalisierung der Thinking-Payload benötigt; die
  Stream-Familie `moonshot-thinking` bildet Konfiguration plus `/think`-Status auf ihre
  native Payload für binäres Thinking ab.
- Kilocode verwendet `catalog`, `capabilities`, `wrapStreamFn` und
  `isCacheTtlEligible`, weil es providerspezifische Request-Header,
  Normalisierung der Reasoning-Payload, Gemini-Transkript-Hinweise und Anthropic-
  Cache-TTL-Gating benötigt; die Stream-Familie `kilocode-thinking` hält die
  Kilo-Thinking-Injektion auf dem gemeinsamen Proxy-Stream-Pfad, während `kilo/auto` und
  andere Proxy-Modell-IDs übersprungen werden, die keine expliziten Reasoning-Payloads unterstützen.
- Z.AI verwendet `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` und `fetchUsageSnapshot`, weil es GLM-5-Fallback,
  Standardwerte für `tool_stream`, binäre Thinking-UX, Matching moderner Modelle und sowohl
  Usage-Auth als auch Quota-Abruf besitzt; die Stream-Familie `tool-stream-default-on`
  hält den standardmäßig aktiven `tool_stream`-Wrapper aus handgeschriebenem Glue pro Provider heraus.
- xAI verwendet `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` und `isModernModelRef`,
  weil es die Normalisierung auf nativen xAI-Responses-Transport, Umschreibungen von Grok-Fast-Mode-
  Aliasen, Standard-`tool_stream`, Bereinigung von strict-tool / Reasoning-Payload,
  Wiederverwendung von Fallback-Auth für plugin-eigene Tools, Vorwärtskompatibilitäts-
  Auflösung von Grok-Modellen und providerspezifische Kompatibilitäts-Patches wie xAI-Tool-Schema-
  Profil, nicht unterstützte Schema-Keywords, natives `web_search` und Dekodierung von
  Tool-Call-Argumenten mit HTML-Entities besitzt.
- Mistral, OpenCode Zen und OpenCode Go verwenden nur `capabilities`, um
  Transkript-/Tooling-Sonderfälle aus dem Core herauszuhalten.
- Katalog-only-Provider unter den gebündelten Plugins wie `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` und `volcengine` verwenden
  nur `catalog`.
- Qwen verwendet `catalog` für seinen Text-Provider sowie gemeinsame Registrierungen für Medienverständnis und
  Videogenerierung für seine multimodalen Oberflächen.
- MiniMax und Xiaomi verwenden `catalog` plus Usage-Hooks, weil ihr `/usage`-
  Verhalten dem Plugin gehört, obwohl die Inferenz weiterhin über die gemeinsamen
  Transporte läuft.

## Laufzeit-Helper

Plugins können über `api.runtime` auf ausgewählte Core-Helper zugreifen. Für TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Hinweise:

- `textToSpeech` gibt die normale Core-TTS-Ausgabe-Payload für Datei-/Sprachnachrichten-Oberflächen zurück.
- Verwendet die Core-Konfiguration `messages.tts` und die Providerauswahl.
- Gibt PCM-Audiopuffer + Sampling-Rate zurück. Plugins müssen für Provider resamplen/kodieren.
- `listVoices` ist je nach Provider optional. Verwende es für vendor-eigene Voice-Picker oder Setup-Flows.
- Stimmenlisten können umfangreichere Metadaten wie Locale, Geschlecht und Personality-Tags für providerbewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telephony. Microsoft nicht.

Plugins können außerdem Speech-Provider über `api.registerSpeechProvider(...)` registrieren.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Hinweise:

- Behalte TTS-Richtlinien, Fallback und Antwortzustellung im Core.
- Verwende Speech-Provider für vendor-eigenes Syntheseverhalten.
- Alte Microsoft-Eingaben vom Typ `edge` werden auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Zuständigkeitsmodell ist unternehmensorientiert: Ein Vendor-Plugin kann
  Text-, Speech-, Bild- und künftige Medien-Provider besitzen, wenn OpenClaw diese
  Fähigkeitsverträge hinzufügt.

Für Bild-/Audio-/Videoverständnis registrieren Plugins einen typisierten
Provider für Medienverständnis statt eines generischen Key/Value-Bags:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Hinweise:

- Behalte Orchestrierung, Fallback, Konfiguration und Channel-Verdrahtung im Core.
- Behalte Vendor-Verhalten im Provider-Plugin.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Fähigkeiten.
- Videogenerierung folgt bereits demselben Muster:
  - der Core besitzt den Fähigkeitsvertrag und den Laufzeit-Helper
  - Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Channel-Plugins verwenden `api.runtime.videoGeneration.*`

Für Laufzeit-Helper des Medienverständnisses können Plugins Folgendes aufrufen:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Für Audio-Transkription können Plugins entweder die Laufzeit des Medienverständnisses
oder den älteren STT-Alias verwenden:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Hinweise:

- `api.runtime.mediaUnderstanding.*` ist die bevorzugte gemeinsame Oberfläche für
  Bild-/Audio-/Videoverständnis.
- Verwendet die Core-Audiokonfiguration für Medienverständnis (`tools.media.audio`) und die Fallback-Reihenfolge der Provider.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungenen/nicht unterstützten Eingaben).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitäts-Alias bestehen.

Plugins können außerdem Hintergrund-Subagent-Läufe über `api.runtime.subagent` starten:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Hinweise:

- `provider` und `model` sind optionale Überschreibungen pro Lauf, keine dauerhaften Sitzungsänderungen.
- OpenClaw berücksichtigt diese Überschreibungsfelder nur für vertrauenswürdige Aufrufer.
- Für plugin-eigene Fallback-Läufe müssen Operatoren dies mit `plugins.entries.<id>.subagent.allowModelOverride: true` aktiv erlauben.
- Verwende `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"`, um jedes Ziel ausdrücklich zu erlauben.
- Läufe von Subagents untrusted Plugins funktionieren weiterhin, aber Überschreibungsanfragen werden abgelehnt, statt stillschweigend auf einen Fallback auszuweichen.

Für Websuche können Plugins den gemeinsamen Laufzeit-Helper verwenden, statt
in die Verdrahtung von Agent-Tools einzugreifen:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugins können außerdem Websuch-Provider über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Behalte Providerauswahl, Credential-Auflösung und gemeinsame Request-Semantik im Core.
- Verwende Websuch-Provider für vendor-spezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Channel-Plugins, die Suchverhalten benötigen, ohne von dem Agent-Tool-Wrapper abzuhängen.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: ein Bild mit der konfigurierten Kette von Bildgenerierungs-Providern erzeugen.
- `listProviders(...)`: verfügbare Bildgenerierungs-Provider und ihre Fähigkeiten auflisten.

## Gateway-HTTP-Routen

Plugins können mit `api.registerHttpRoute(...)` HTTP-Endpunkte bereitstellen.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Felder einer Route:

- `path`: Routenpfad unter dem Gateway-HTTP-Server.
- `auth`: erforderlich. Verwende `"gateway"`, um normale Gateway-Auth zu verlangen, oder `"plugin"` für Plugin-verwaltete Auth/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene vorhandene Routenregistrierung zu ersetzen.
- `handler`: `true` zurückgeben, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Fehler beim Laden des Plugins. Verwende stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Konflikte bei identischem `path + match` werden abgelehnt, außer `replaceExisting: true` ist gesetzt, und ein Plugin kann keine Route eines anderen Plugins ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halte `exact`-/`prefix`-Fallthrough-Ketten nur auf derselben `auth`-Stufe.
- Routen mit `auth: "plugin"` erhalten nicht automatisch Runtime-Scopes für Operatoren. Sie sind für Plugin-verwaltete Webhooks/Signaturprüfung gedacht, nicht für privilegierte Gateway-Helper-Aufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Gateway-Request-Runtime-Scopes, aber dieser Scope ist bewusst konservativ:
  - Bearer-Auth mit gemeinsamem Secret (`gateway.auth.mode = "token"` / `"password"`) hält Runtime-Scopes für Plugin-Routen auf `operator.write` fest, auch wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identität (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` auf einem privaten Ingress) beachten `x-openclaw-scopes` nur, wenn der Header ausdrücklich vorhanden ist
  - fehlt `x-openclaw-scopes` bei solchen Plugin-Routen-Anfragen mit Identität, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehe nicht davon aus, dass eine per Gateway authentifizierte Plugin-Route implizit eine Admin-Oberfläche ist. Wenn deine Route admin-only-Verhalten benötigt, verlange einen Auth-Modus mit Identität und dokumentiere den expliziten Header-Vertrag für `x-openclaw-scopes`.

## Importpfade des Plugin SDK

Verwende SDK-Subpaths statt des monolithischen Imports `openclaw/plugin-sdk`, wenn
du Plugins entwickelst:

- `openclaw/plugin-sdk/plugin-entry` für Primitiven zur Plugin-Registrierung.
- `openclaw/plugin-sdk/core` für den generischen gemeinsamen Vertrag auf Plugin-Seite.
- `openclaw/plugin-sdk/config-schema` für den Zod-Schema-Export des Root-`openclaw.json`
  (`OpenClawSchema`).
- Stabile Channel-Primitiven wie `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` und
  `openclaw/plugin-sdk/webhook-ingress` für gemeinsame Verdrahtung von Setup/Auth/Antwort/Webhooks.
  `channel-inbound` ist das gemeinsame Zuhause für Debounce, Mention-Matching,
  Envelope-Formatierung und Kontext-Helper für eingehende Envelopes.
  `channel-setup` ist der schmale Setup-Übergang für optionale Installationen.
  `setup-runtime` ist die runtime-sichere Setup-Oberfläche, die von `setupEntry` /
  verzögertem Start verwendet wird, einschließlich import-sicherer Setup-Patch-Adapter.
  `setup-adapter-runtime` ist der env-bewusste Übergang für Account-Setup-Adapter.
  `setup-tools` ist der kleine Übergang für CLI-/Archiv-/Docs-Helper (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Domain-Subpaths wie `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` und
  `openclaw/plugin-sdk/directory-runtime` für gemeinsame Laufzeit-/Konfigurations-Helper.
  `telegram-command-config` ist der schmale öffentliche Übergang für die Normalisierung/Validierung
  benutzerdefinierter Telegram-Befehle und bleibt verfügbar, auch wenn die gebündelte
  Telegram-Vertragsoberfläche vorübergehend nicht verfügbar ist.
  `text-runtime` ist der gemeinsame Übergang für Text/Markdown/Logging, einschließlich
  des Entfernens von für Assistenten sichtbarem Text, Helpern zum Rendern/Chunking von Markdown,
  Helpern zur Redigierung, Helpern für Directive-Tags und Hilfsfunktionen für sicheren Text.
- Approval-spezifische Channel-Übergänge sollten einen einzigen Vertrag `approvalCapability`
  auf dem Plugin bevorzugen. Der Core liest dann Auth, Zustellung, Rendering und
  natives Routing für Approvals über diese eine Fähigkeit, statt Approval-Verhalten
  in nicht zusammengehörige Plugin-Felder zu mischen.
- `openclaw/plugin-sdk/channel-runtime` ist veraltet und bleibt nur als
  Kompatibilitäts-Shim für ältere Plugins bestehen. Neuer Code sollte stattdessen die
  schmaleren generischen Primitiven importieren, und Repo-Code sollte keine neuen
  Importe dieses Shims hinzufügen.
- Interne Bestandteile gebündelter Erweiterungen bleiben privat. Externe Plugins sollten nur
  `openclaw/plugin-sdk/*`-Subpaths verwenden. OpenClaw-Core-/Test-Code darf die
  öffentlichen Repo-Einstiegspunkte unter einer Plugin-Paketwurzel wie `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` und eng gefasste Dateien wie
  `login-qr-api.js` verwenden. Importiere niemals `src/*` eines Plugin-Pakets aus dem Core oder aus einer anderen Erweiterung.
- Aufteilung der Repo-Einstiegspunkte:
  `<plugin-package-root>/api.js` ist das Barrel für Helper/Typen,
  `<plugin-package-root>/runtime-api.js` ist das reine Runtime-Barrel,
  `<plugin-package-root>/index.js` ist der Einstieg des gebündelten Plugins
  und `<plugin-package-root>/setup-entry.js` ist der Einstieg des Setup-Plugins.
- Aktuelle Beispiele für gebündelte Provider:
  - Anthropic verwendet `api.js` / `contract-api.js` für Claude-Stream-Helper wie
    `wrapAnthropicProviderStream`, Helper für Beta-Header und Parsing von `service_tier`.
  - OpenAI verwendet `api.js` für Provider-Builder, Default-Modell-Helper und
    Realtime-Provider-Builder.
  - OpenRouter verwendet `api.js` für seinen Provider-Builder sowie Onboarding-/Konfigurations-
    Helper, während `register.runtime.js` weiterhin generische
    `plugin-sdk/provider-stream`-Helper für repo-lokale Nutzung re-exportieren kann.
- Öffentlich zugängliche Einstiegspunkte, die über eine Fassade geladen werden, bevorzugen den aktiven Runtime-Konfigurations-Snapshot,
  falls vorhanden, und greifen andernfalls auf die auf der Platte aufgelöste Konfigurationsdatei zurück,
  wenn OpenClaw noch keinen Runtime-Snapshot bereitstellt.
- Generische gemeinsame Primitiven bleiben der bevorzugte öffentliche SDK-Vertrag. Eine kleine
  reservierte Kompatibilitätsmenge von gebündelten channel-markierten Helper-Übergängen existiert weiterhin.
  Behandle diese als Übergänge für gebündelte Wartung/Kompatibilität, nicht als neue Importziele für Drittanbieter; neue kanalübergreifende Verträge sollten weiterhin auf
  generischen `plugin-sdk/*`-Subpaths oder den plugin-lokalen Barrels `api.js` /
  `runtime-api.js` landen.

Kompatibilitätshinweis:

- Vermeide für neuen Code das Root-Barrel `openclaw/plugin-sdk`.
- Bevorzuge zuerst die schmalen stabilen Primitiven. Die neueren Setup-/Pairing-/Reply-/
  Feedback-/Contract-/Inbound-/Threading-/Command-/Secret-input-/Webhook-/Infra-/
  Allowlist-/Status-/Message-Tool-Subpaths sind der beabsichtigte Vertrag für neue
  gebündelte und externe Plugin-Arbeit.
  Target-Parsing/-Matching gehört auf `openclaw/plugin-sdk/channel-targets`.
  Gates für Message-Actions und Helper für Reaktions-Message-IDs gehören auf
  `openclaw/plugin-sdk/channel-actions`.
- Erweiterungsspezifische Helper-Barrels gebündelter Erweiterungen sind standardmäßig nicht stabil. Wenn ein
  Helper nur für eine gebündelte Erweiterung benötigt wird, halte ihn hinter dem
  lokalen Übergang `api.js` oder `runtime-api.js` dieser Erweiterung, statt ihn nach
  `openclaw/plugin-sdk/<extension>` zu befördern.
- Neue gemeinsame Helper-Übergänge sollten generisch sein, nicht channel-markiert. Gemeinsames Target-
  Parsing gehört auf `openclaw/plugin-sdk/channel-targets`; channelspezifische
  Interna bleiben hinter dem lokalen Übergang `api.js` oder `runtime-api.js`
  des zuständigen Plugins.
- Fähigkeitsspezifische Subpaths wie `image-generation`,
  `media-understanding` und `speech` existieren, weil gebündelte/native Plugins sie
  heute verwenden. Ihre Existenz bedeutet für sich genommen nicht, dass jeder exportierte Helper ein
  langfristig eingefrorener externer Vertrag ist.

## Message-Tool-Schemata

Plugins sollten channelspezifische Schema-Beiträge für `describeMessageTool(...)`
besitzen. Halte providerspezifische Felder im Plugin, nicht im gemeinsamen Core.

Für gemeinsame portable Schema-Fragmente verwende die generischen Helper, die über
`openclaw/plugin-sdk/channel-actions` exportiert werden:

- `createMessageToolButtonsSchema()` für Payloads im Stil von Button-Rastern
- `createMessageToolCardSchema()` für strukturierte Card-Payloads

Wenn eine Schemaform nur für einen Provider sinnvoll ist, definiere sie im
eigenen Quellcode dieses Plugins, statt sie in das gemeinsame SDK zu befördern.

## Auflösung von Channel-Zielen

Channel-Plugins sollten channelspezifische Zielsemantik besitzen. Halte den gemeinsamen
Outbound-Host generisch und verwende die Messaging-Adapter-Oberfläche für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  vor der Verzeichnisabfrage als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Core mit, ob eine
  Eingabe direkt in eine id-ähnliche Auflösung übergehen soll statt in eine Verzeichnissuche.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn
  der Core nach der Normalisierung oder nach einem Verzeichnis-Fehlschlag eine endgültige provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die providerspezifische Konstruktion der Session-Route, sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwende `inferTargetChatType` für Kategorieentscheidungen, die vor dem
  Durchsuchen von Peers/Gruppen getroffen werden sollten.
- Verwende `looksLikeId` für Prüfungen der Art „dies als explizite/native Ziel-ID behandeln“.
- Verwende `resolveTarget` als providerspezifischen Normalisierungs-Fallback, nicht für eine breite Verzeichnissuche.
- Halte provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-IDs in
  `target`-Werten oder providerspezifischen Parametern, nicht in generischen SDK-Feldern.

## Verzeichnisse auf Konfigurationsbasis

Plugins, die Verzeichniseinträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin behalten und die gemeinsamen Helper aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwende dies, wenn ein Channel konfigurationsgestützte Peers/Gruppen benötigt, etwa:

- von der Allowlist gesteuerte DM-Peers
- konfigurierte Channel-/Gruppen-Zuordnungen
- kontobezogene statische Verzeichnis-Fallbacks

Die gemeinsamen Helper in `directory-runtime` behandeln nur generische Operationen:

- Query-Filterung
- Anwendung von Limits
- Helper für Deduplizierung/Normalisierung
- Erstellen von `ChannelDirectoryEntry[]`

Channelspezifische Kontoinspektion und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz mit
`registerProvider({ catalog: { run(...) { ... } } })` definieren.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen einzelnen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwende `catalog`, wenn das Plugin providerspezifische Modell-IDs, Standardwerte für Base-URLs oder auth-gesteuerte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
integrierten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache Provider mit API-Key oder env-gesteuert
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere zusammengehörige Provider-Einträge synthetisieren
- `late`: letzter Durchgang, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkollisionen, sodass Plugins bewusst einen
integrierten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als alter Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Channel-Inspektion

Wenn dein Plugin einen Channel registriert, solltest du
`plugin.config.inspectAccount(cfg, accountId)` zusammen mit `resolveAccount(...)` implementieren.

Warum:

- `resolveAccount(...)` ist der Laufzeitpfad. Es darf annehmen, dass Zugangsdaten
  vollständig materialisiert sind, und schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` sowie Doctor-/Konfigurations-
  Reparaturflüsse sollten keine Laufzeit-Zugangsdaten materialisieren müssen, nur um
  die Konfiguration zu beschreiben.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Nur beschreibenden Kontostatus zurückgeben.
- `enabled` und `configured` beibehalten.
- Relevante Felder für Quelle/Status von Zugangsdaten aufnehmen, z. B.:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Du musst keine rohen Token-Werte zurückgeben, nur um schreibgeschützte
  Verfügbarkeit zu melden. `tokenStatus: "available"` zurückzugeben (und das passende Quellfeld) reicht für statusartige Befehle aus.
- Verwende `configured_unavailable`, wenn eine Credential über SecretRef konfiguriert ist,
  aber im aktuellen Befehlspfad nicht verfügbar.

So können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“ melden, statt abzustürzen oder das Konto fälschlich als nicht konfiguriert auszugeben.

## Paket-Packs

Ein Plugin-Verzeichnis kann ein `package.json` mit `openclaw.extensions` enthalten:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere Erweiterungen auflistet, wird die Plugin-ID zu `name/<fileBase>`.

Wenn dein Plugin npm-Abhängigkeiten importiert, installiere sie in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder Eintrag in `openclaw.extensions` muss nach der Auflösung von Symlinks innerhalb des Plugin-Verzeichnisses bleiben. Einträge, die das Paketverzeichnis verlassen, werden abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit
`npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte, keine Dev-Abhängigkeiten zur Laufzeit). Halte Abhängigkeitsbäume von Plugins „reines JS/TS“ und vermeide Pakete, die `postinstall`-Builds benötigen.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges Modul nur für Setup zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Channel-Plugin benötigt oder
wenn ein Channel-Plugin aktiviert, aber noch unkonfiguriert ist, lädt es `setupEntry`
statt des vollständigen Plugin-Einstiegs. Das hält Start und Setup schlanker,
wenn dein Haupteinstieg auch Tools, Hooks oder anderen reinen Laufzeit-Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Channel-Plugin in denselben `setupEntry`-Pfad während der
Pre-Listen-Startphase des Gateways optieren, auch wenn der Channel bereits konfiguriert ist.

Verwende das nur, wenn `setupEntry` die Oberfläche beim Start vollständig abdeckt, die
vor dem Lauschen des Gateways vorhanden sein muss. In der Praxis bedeutet das, dass der
Setup-Einstieg jede vom Channel besessene Fähigkeit registrieren muss, von der der Start abhängt, wie zum Beispiel:

- die Channel-Registrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway zu lauschen beginnt
- alle Gateway-Methoden, Tools oder Dienste, die in diesem selben Zeitfenster vorhanden sein müssen

Wenn dein vollständiger Einstieg weiterhin eine erforderliche Start-Fähigkeit besitzt, aktiviere
dieses Flag nicht. Bleibe beim Standardverhalten und lass OpenClaw den vollständigen
Einstieg während des Starts laden.

Gebündelte Channels können auch reine Setup-Helper mit Vertragsoberfläche veröffentlichen, die der Core
abfragen kann, bevor die vollständige Channel-Laufzeit geladen ist. Die aktuelle Oberfläche für Setup-Promotion ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Core verwendet diese Oberfläche, wenn er eine alte Single-Account-Channel-
Konfiguration nach `channels.<id>.accounts.*` hochstufen muss, ohne den vollständigen Plugin-Einstieg zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein
benanntes hochgestuftes Konto, wenn benannte Konten bereits existieren, und es kann einen
konfigurierten nicht-kanonischen Default-Account-Schlüssel beibehalten, statt immer
`accounts.default` zu erstellen.

Diese Setup-Patch-Adapter halten die Discovery der Vertragsoberfläche gebündelter Channels lazy. Die Importzeit bleibt gering; die Promotion-Oberfläche wird nur beim ersten Gebrauch geladen, statt beim Modulimport erneut in den Start gebündelter Channels einzusteigen.

Wenn diese Start-Oberflächen Gateway-RPC-Methoden enthalten, halte sie auf einem
plugin-spezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
zu `operator.admin` aufgelöst, auch wenn ein Plugin einen engeren Scope anfordert.

Beispiel:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Channel-Katalog-Metadaten

Channel-Plugins können Setup-/Discovery-Metadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` bekannt geben. Dadurch bleiben die Core-Katalogdaten frei von Inhalten.

Beispiel:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Nützliche Felder in `openclaw.channel` über das Minimalbeispiel hinaus:

- `detailLabel`: sekundäres Label für umfangreichere Katalog-/Status-Oberflächen
- `docsLabel`: Linktext für den Docs-Link überschreiben
- `preferOver`: Plugin-/Channel-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerung des Texts auf Auswahloberflächen
- `markdownCapable`: markiert den Channel für Entscheidungen zur Outbound-Formatierung als markdownfähig
- `showConfigured`: blendet den Channel in Oberflächen zur Auflistung konfigurierter Channels aus, wenn auf `false` gesetzt
- `quickstartAllowFrom`: optiert den Channel in den Standard-Quickstart-Flow `allowFrom` ein
- `forceAccountBinding`: explizite Kontobindung verlangen, auch wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: Session-Lookup bevorzugen, wenn Ziele für Ankündigungen aufgelöst werden

OpenClaw kann außerdem **externe Channel-Kataloge** zusammenführen (zum Beispiel einen Export aus einer MPM-
Registry). Lege eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder setze `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als alte Aliasse für den Schlüssel `"entries"`.

## Context-Engine-Plugins

Context-Engine-Plugins besitzen die Orchestrierung des Session-Kontexts für Ingest, Zusammenstellung
und Kompaktierung. Registriere sie in deinem Plugin mit
`api.registerContextEngine(id, factory)` und wähle dann die aktive Engine über
`plugins.slots.contextEngine` aus.

Verwende dies, wenn dein Plugin die Standard-Context-Pipeline ersetzen oder erweitern muss,
anstatt nur Memory-Suche oder Hooks hinzuzufügen.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Wenn deine Engine den Kompaktierungsalgorithmus **nicht** besitzt, implementiere
`compact()` trotzdem und delegiere ihn explizit:

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Eine neue Fähigkeit hinzufügen

Wenn ein Plugin Verhalten benötigt, das nicht in die aktuelle API passt, umgehe
das Plugin-System nicht mit einem privaten Direkteingriff. Füge die fehlende Fähigkeit hinzu.

Empfohlene Reihenfolge:

1. den Core-Vertrag definieren
   Entscheide, welches gemeinsame Verhalten dem Core gehören sollte: Richtlinien, Fallback, Konfigurations-Zusammenführung,
   Lebenszyklus, channelseitige Semantik und Form des Laufzeit-Helpers.
2. typisierte Oberflächen für Plugin-Registrierung/Laufzeit hinzufügen
   Erweitere `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Fähigkeitsoberfläche.
3. Core- und Channel-/Feature-Consumers verdrahten
   Channels und Feature-Plugins sollten die neue Fähigkeit über den Core verwenden,
   nicht durch direkten Import einer Vendor-Implementierung.
4. Vendor-Implementierungen registrieren
   Vendor-Plugins registrieren dann ihre Backends für die Fähigkeit.
5. Vertragsabdeckung hinzufügen
   Füge Tests hinzu, damit Zuständigkeit und Form der Registrierung im Laufe der Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne an die Sichtweise eines einzelnen
Providers hart gebunden zu werden. Eine konkrete Datei-Checkliste und ein ausgearbeitetes Beispiel findest du im [Capability Cookbook](/tools/capability-cookbook).

### Fähigkeits-Checkliste

Wenn du eine neue Fähigkeit hinzufügst, sollte die Implementierung diese
Oberflächen in der Regel gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner/Laufzeit-Helper in `src/<capability>/runtime.ts`
- Oberfläche zur Plugin-API-Registrierung in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Bereitstellung der Plugin-Laufzeit in `src/plugins/runtime/*`, wenn Feature-/Channel-
  Plugins sie verwenden müssen
- Capture-/Test-Helper in `src/test-utils/plugin-registration.ts`
- Assertions zu Zuständigkeit/Verträgen in `src/plugins/contracts/registry.ts`
- Dokumentation für Operatoren/Plugins in `docs/`

Wenn eine dieser Oberflächen fehlt, ist das meist ein Zeichen dafür, dass die Fähigkeit
noch nicht vollständig integriert ist.

### Fähigkeitsvorlage

Minimales Muster:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Muster für Vertragstests:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Damit bleibt die Regel einfach:

- der Core besitzt den Fähigkeitsvertrag + die Orchestrierung
- Vendor-Plugins besitzen Vendor-Implementierungen
- Feature-/Channel-Plugins verwenden Laufzeit-Helper
- Vertragstests halten Zuständigkeit explizit
