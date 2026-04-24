---
read_when:
    - Implementieren von Laufzeit-Hooks für Provider, Kanallebenszyklus oder Package-Packs
    - Fehlerbehebung bei Plugin-Ladereihenfolge oder Registerzustand
    - Hinzufügen einer neuen Plugin-Fähigkeit oder eines Kontext-Engine-Plugin
summary: 'Plugin-Architektur-Interna: Lade-Pipeline, Register, Laufzeit-Hooks, HTTP-Routen und Referenztabellen'
title: Plugin-Architektur-Interna
x-i18n:
    generated_at: "2026-04-24T06:48:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01e258ab1666f7aff112fa3f897a40bf28dccaa8d06265fcf21e53479ee1ebda
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Für das öffentliche Fähigkeitsmodell, Plugin-Formen und Eigentums-/Ausführungsverträge siehe [Plugin architecture](/de/plugins/architecture). Diese Seite ist die Referenz für die internen Mechanismen: Lade-Pipeline, Register, Laufzeit-Hooks, Gateway-HTTP-Routen, Importpfade und Schema-Tabellen.

## Lade-Pipeline

Beim Start macht OpenClaw grob Folgendes:

1. potenzielle Plugin-Roots entdecken
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module laden: gebaute gebündelte Module verwenden einen nativen Loader;
   ungebaute native Plugins verwenden jiti
7. native Hooks `register(api)` aufrufen und Registrierungen im Plugin-Register sammeln
8. das Register für Befehle/Laufzeitoberflächen bereitstellen

<Note>
`activate` ist ein veralteter Alias für `register` — der Loader löst auf, welcher vorhanden ist (`def.register ?? def.activate`), und ruft ihn an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheitsschranken greifen **vor** der Laufzeitausführung. Kandidaten werden blockiert,
wenn der Einstiegspunkt die Plugin-Root verlässt, der Pfad weltweit beschreibbar ist oder die Pfad-
Eigentümerschaft bei nicht gebündelten Plugins verdächtig aussieht.

### Manifest-first-Verhalten

Das Manifest ist die Quelle der Wahrheit für die Control Plane. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Kanäle/Skills/Konfigurationsschema oder Bundle-Fähigkeiten zu entdecken
- `plugins.entries.<id>.config` zu validieren
- Labels/Platzhalter in der Control UI anzureichern
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Setup-Deskriptoren beizubehalten, ohne die Plugin-Laufzeit zu laden

Für native Plugins ist das Laufzeitmodul der Data-Plane-Teil. Es registriert
tatsächliches Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

Optionale Manifest-Blöcke `activation` und `setup` bleiben in der Control Plane.
Sie sind reine Metadaten-Deskriptoren für Aktivierungsplanung und Setup-Discovery;
sie ersetzen keine Laufzeitregistrierung, kein `register(...)` und keinen `setupEntry`.
Die ersten Live-Aktivierungs-Consumer verwenden jetzt Manifest-Hinweise zu Befehlen, Kanälen und Providern,
um das Laden von Plugins einzugrenzen, bevor eine breitere Materialisierung des Registers erfolgt:

- CLI-Laden grenzt auf Plugins ein, denen der angeforderte primäre Befehl gehört
- Kanal-Setup/Plugin-Auflösung grenzt auf Plugins ein, denen die angeforderte
  Kanal-ID gehört
- explizite Auflösung von Provider-Setup/Laufzeit grenzt auf Plugins ein, denen die
  angeforderte Provider-ID gehört

Der Aktivierungsplaner stellt sowohl eine Nur-IDs-API für bestehende Aufrufer als auch eine
Plan-API für neue Diagnosen bereit. Planeinträge melden, warum ein Plugin ausgewählt wurde,
und trennen explizite Planner-Hinweise aus `activation.*` von Manifest-Eigentums-Fallbacks
wie `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks. Diese Aufteilung der Gründe ist die Kompatibilitätsgrenze:
bestehende Plugin-Metadaten funktionieren weiter, während neuer Code breite Hinweise
oder Fallback-Verhalten erkennen kann, ohne die Semantik des Laufzeitladens zu ändern.

Die Setup-Discovery bevorzugt jetzt descriptor-eigene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor sie auf
`setup-api` für Plugins zurückfällt, die weiterhin Setup-Laufzeit-Hooks benötigen. Wenn mehr als
ein entdecktes Plugin denselben normalisierten Setup-Provider oder dieselbe CLI-Backend-ID beansprucht, verweigert
die Setup-Suche den mehrdeutigen Eigentümer, statt sich auf die Entdeckungsreihenfolge zu verlassen.

### Was der Loader cached

OpenClaw hält kurze In-Process-Caches für:

- Discovery-Ergebnisse
- Daten des Manifest-Registers
- geladene Plugin-Register

Diese Caches reduzieren sprunghaften Start und Overhead bei wiederholten Befehlen. Man kann sie
sicher als kurzlebige Performance-Caches ansehen, nicht als Persistenz.

Hinweis zur Leistung:

- Setzen Sie `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Stimmen Sie Cache-Zeitfenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` ab.

## Registermodell

Geladene Plugins mutieren nicht direkt beliebige globale Core-Zustände. Sie registrieren sich in ein
zentrales Plugin-Register.

Das Register verfolgt:

- Plugin-Einträge (Identität, Quelle, Ursprung, Status, Diagnosen)
- Tools
- veraltete Hooks und typisierte Hooks
- Kanäle
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrars
- Hintergrunddienste
- plugin-eigene Befehle

Core-Funktionen lesen dann aus diesem Register, statt direkt mit Plugin-Modulen
zu sprechen. Dadurch bleibt das Laden einseitig:

- Plugin-Modul -> Register-Registrierung
- Core-Laufzeit -> Register-Verbrauch

Diese Trennung ist wichtig für die Wartbarkeit. Sie bedeutet, dass die meisten Core-Oberflächen
nur einen Integrationspunkt benötigen: „Register lesen“, nicht „jedes Plugin-Modul speziell behandeln“.

## Callbacks für Gesprächsbindungen

Plugins, die ein Gespräch binden, können reagieren, wenn eine Freigabe aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um nach Freigabe oder Ablehnung
einer Bind-Anfrage einen Callback zu erhalten:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Für dieses Plugin + Gespräch existiert jetzt eine Bindung.
        console.log(event.binding?.conversationId);
        return;
      }

      // Die Anfrage wurde abgelehnt; lokalen Pending-Status löschen.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Felder der Callback-Payload:

- `status`: `"approved"` oder `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oder `"deny"`
- `binding`: die aufgelöste Bindung für genehmigte Anfragen
- `request`: die ursprüngliche Anfragesummary, Detach-Hinweis, Absender-ID und
  Gesprächsmetadaten

Dieser Callback ist nur eine Benachrichtigung. Er ändert nicht, wer ein Gespräch binden darf,
und läuft, nachdem die Core-Freigabebehandlung abgeschlossen ist.

## Laufzeit-Hooks für Provider

Provider-Plugins haben drei Ebenen:

- **Manifest-Metadaten** für günstige Lookup vor der Laufzeit: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` und `channelEnvVars`.
- **Hooks zur Konfigurationszeit**: `catalog` (veraltet: `discovery`) plus
  `applyConfigDefaults`.
- **Laufzeit-Hooks**: über 40 optionale Hooks, die Auth, Modellauflösung,
  Stream-Wrapping, Thinking Levels, Replay-Richtlinie und Usage-Endpunkte abdecken. Siehe
  die vollständige Liste unter [Reihenfolge und Verwendung von Hooks](#hook-order-and-usage).

OpenClaw besitzt weiterhin die generische Agent-Schleife, Failover, Transkriptbehandlung und
Tool-Richtlinie. Diese Hooks sind die Erweiterungsoberfläche für providerspezifisches
Verhalten, ohne einen vollständig eigenen Inference-Transport zu benötigen.

Verwenden Sie Manifest-`providerAuthEnvVars`, wenn der Provider Env-basierte Zugangsdaten hat,
die generische Auth-/Status-/Modell-Auswahlpfade sehen sollen, ohne die Plugin-Laufzeit zu laden.
Verwenden Sie Manifest-`providerAuthAliases`, wenn eine Provider-ID die Env-Variablen, Auth-Profile,
konfigurationsgestützte Auth und API-Key-Onboarding-Auswahl einer anderen Provider-ID wiederverwenden soll.
Verwenden Sie Manifest-`providerAuthChoices`, wenn CLI-Oberflächen für Onboarding/Auth-Auswahl
die Choice-ID des Providers, Gruppen-Labels und einfache Auth-Verkabelung über ein Flag kennen sollen, ohne Provider-Laufzeit zu laden. Behalten Sie Provider-Laufzeit-
`envVars` für operatorseitige Hinweise wie Onboarding-Labels oder Setup-Variablen für OAuth-
Client-ID/Client-Secret.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Kanal Env-getriebene Auth oder Setup hat, die
generische Shell-Env-Fallbacks, Konfigurations-/Statusprüfungen oder Setup-Prompts sehen sollen,
ohne Kanal-Laufzeit zu laden.

### Reihenfolge und Verwendung von Hooks

Für Modell-/Provider-Plugins ruft OpenClaw Hooks grob in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist die schnelle Entscheidungshilfe.

| #   | Hook                              | Was er macht                                                                                                   | Wann verwenden                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Provider-Konfiguration während der Generierung von `models.json` in `models.providers` veröffentlichen         | Provider besitzt einen Katalog oder Standardwerte für Basis-URLs                                                                              |
| 2   | `applyConfigDefaults`             | Provider-eigene globale Konfigurations-Standardwerte während der Materialisierung der Konfiguration anwenden  | Standardwerte hängen von Auth-Modus, Env oder Semantik der Provider-Modellfamilie ab                                                         |
| --  | _(integrierte Modellsuche)_       | OpenClaw versucht zuerst den normalen Register-/Katalogpfad                                                    | _(kein Plugin-Hook)_                                                                                                                          |
| 3   | `normalizeModelId`                | Veraltete oder Vorschau-Modell-ID-Aliasse vor der Suche normalisieren                                          | Provider besitzt Alias-Bereinigung vor der kanonischen Modellauflösung                                                                        |
| 4   | `normalizeTransport`              | Provider-Familien-`api` / `baseUrl` vor der generischen Modellassemblierung normalisieren                     | Provider besitzt Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                                     |
| 5   | `normalizeConfig`                 | `models.providers.<id>` vor Laufzeit-/Provider-Auflösung normalisieren                                         | Provider benötigt Konfigurationsbereinigung, die beim Plugin liegen soll; gebündelte Google-Familien-Helfer stützen auch unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Native Streaming-Usage-Kompatibilitäts-Umschreibungen auf Konfigurations-Provider anwenden                    | Provider benötigt endpointgetriebene Korrekturen an nativen Streaming-Usage-Metadaten                                                        |
| 7   | `resolveConfigApiKey`             | Env-Marker-Auth für Konfigurations-Provider vor dem Laden der Laufzeit-Auth auflösen                           | Provider hat provider-eigene Env-Marker-Auflösung für API-Keys; `amazon-bedrock` hat hier außerdem einen integrierten AWS-Env-Marker-Resolver |
| 8   | `resolveSyntheticAuth`            | Lokale/selbstgehostete oder konfigurationsgestützte Auth ohne Persistieren von Klartext bereitstellen         | Provider kann mit einem synthetischen/lokalen Credential-Marker arbeiten                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Provider-eigene externe Auth-Profile überlagern; Standard für `persistence` ist `runtime-only` bei CLI-/app-eigenen Zugangsdaten | Provider verwendet externe Auth-Zugangsdaten wieder, ohne kopierte Refresh-Token zu persistieren; `contracts.externalAuthProviders` im Manifest deklarieren |
| 10  | `shouldDeferSyntheticProfileAuth` | Gespeicherte synthetische Profil-Platzhalter hinter Env-/konfigurationsgestützter Auth zurückstufen           | Provider speichert synthetische Platzhalterprofile, die im Vorrang nicht gewinnen sollten                                                     |
| 11  | `resolveDynamicModel`             | Synchroner Fallback für provider-eigene Modell-IDs, die noch nicht im lokalen Register sind                   | Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                             |
| 12  | `prepareDynamicModel`             | Asynchrones Warm-up, dann läuft `resolveDynamicModel` erneut                                                   | Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden                                                                    |
| 13  | `normalizeResolvedModel`          | Endgültige Umschreibung, bevor der eingebettete Runner das aufgelöste Modell verwendet                         | Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Core-Transport                                                     |
| 14  | `contributeResolvedModelCompat`   | Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport beitragen                  | Provider erkennt eigene Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                                        |
| 15  | `capabilities`                    | Provider-eigene Metadaten für Transkripte/Tooling, die von gemeinsam genutzter Core-Logik verwendet werden    | Provider benötigt Besonderheiten bei Transkripten/Provider-Familien                                                                           |
| 16  | `normalizeToolSchemas`            | Tool-Schemas normalisieren, bevor der eingebettete Runner sie sieht                                            | Provider benötigt Transportfamilien-Bereinigung für Schemas                                                                                   |
| 17  | `inspectToolSchemas`              | Provider-eigene Schema-Diagnosen nach der Normalisierung bereitstellen                                         | Provider möchte Keyword-Warnungen ausgeben, ohne dem Core providerspezifische Regeln beizubringen                                            |
| 18  | `resolveReasoningOutputMode`      | Vertrag für nativen vs. getaggten Reasoning-Output auswählen                                                   | Provider benötigt getaggte Reasoning-/Final-Output statt nativer Felder                                                                       |
| 19  | `prepareExtraParams`              | Normalisierung von Anfrageparametern vor generischen Wrappern für Stream-Optionen                              | Provider benötigt Standard-Anfrageparameter oder Bereinigung von Parametern pro Provider                                                      |
| 20  | `createStreamFn`                  | Den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport ersetzen                        | Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                             |
| 21  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                   | Provider benötigt Kompatibilitäts-Wrapper für Anfrage-Header/Body/Modell ohne benutzerdefinierten Transport                                  |
| 22  | `resolveTransportTurnState`       | Native Header oder Metadaten pro Turn am Transport anhängen                                                    | Provider möchte, dass generische Transporte provider-native Turn-Identität senden                                                             |
| 23  | `resolveWebSocketSessionPolicy`   | Native WebSocket-Header oder Session-Cool-down-Richtlinie anhängen                                             | Provider möchte, dass generische WS-Transporte Session-Header oder Fallback-Richtlinie abstimmen                                              |
| 24  | `formatApiKey`                    | Formatter für Auth-Profile: Gespeichertes Profil wird zur Laufzeit-Zeichenfolge `apiKey`                      | Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Runtime-Token-Form                                        |
| 25  | `refreshOAuth`                    | OAuth-Refresh-Überschreibung für benutzerdefinierte Refresh-Endpunkte oder Refresh-Fehlerrichtlinie           | Provider passt nicht zu den gemeinsam genutzten `pi-ai`-Refreshern                                                                            |
| 26  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                           | Provider benötigt provider-eigene Hinweise zur Auth-Reparatur nach fehlgeschlagenem Refresh                                                   |
| 27  | `matchesContextOverflowError`     | Provider-eigener Matcher für Overflow des Kontextfensters                                                      | Provider hat rohe Overflow-Fehler, die generische Heuristiken übersehen würden                                                                |
| 28  | `classifyFailoverReason`          | Provider-eigene Klassifizierung von Failover-Gründen                                                           | Provider kann rohe API-/Transportfehler auf Ratenbegrenzung/Überlastung/usw. abbilden                                                        |
| 29  | `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                                           | Provider benötigt proxy-spezifische TTL-Begrenzung für Cache                                                                                  |
| 30  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsnachricht bei fehlender Auth                                       | Provider benötigt einen providerspezifischen Hinweis zur Wiederherstellung bei fehlender Auth                                                 |
| 31  | `suppressBuiltInModel`            | Unterdrückung veralteter Upstream-Modelle plus optionaler benutzerseitiger Fehlerhinweis                      | Provider muss veraltete Upstream-Zeilen ausblenden oder durch einen Vendor-Hinweis ersetzen                                                   |
| 32  | `augmentModelCatalog`             | Synthetische/endgültige Katalogzeilen nach der Discovery anhängen                                              | Provider benötigt synthetische Forward-Compat-Zeilen in `models list` und in Pickern                                                          |
| 33  | `resolveThinkingProfile`          | Modellspezifischer `/think`-Level-Satz, Anzeigenamen und Standard                                              | Provider stellt für ausgewählte Modelle eine benutzerdefinierte Thinking-Leiter oder ein binäres Label bereit                                |
| 34  | `isBinaryThinking`                | Kompatibilitäts-Hook für On/Off-Reasoning-Toggle                                                               | Provider stellt nur binäres Thinking ein/aus bereit                                                                                            |
| 35  | `supportsXHighThinking`           | Kompatibilitäts-Hook für `xhigh`-Reasoning-Unterstützung                                                       | Provider möchte `xhigh` nur auf einer Teilmenge von Modellen                                                                                  |
| 36  | `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für den Standard-`/think`-Level                                                           | Provider besitzt die Standard-`/think`-Richtlinie für eine Modellfamilie                                                                      |
| 37  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profilfilter und Smoke-Auswahl                                            | Provider besitzt das Matching bevorzugter Modelle für Live/Smoke                                                                              |
| 38  | `prepareRuntimeAuth`              | Eine konfigurierte Zugangsdaten vor der Inferenz in das tatsächliche Laufzeit-Token/den Schlüssel umtauschen | Provider benötigt einen Token-Austausch oder kurzlebige Anfrage-Zugangsdaten                                                                  |
| 39  | `resolveUsageAuth`                | Zugangsdaten für Usage/Billing für `/usage` und verwandte Statusoberflächen auflösen                           | Provider benötigt benutzerdefiniertes Parsing für Usage-/Quota-Token oder andere Usage-Zugangsdaten                                          |
| 40  | `fetchUsageSnapshot`              | Providerspezifische Usage-/Quota-Snapshots abrufen und normalisieren, nachdem Auth aufgelöst wurde            | Provider benötigt einen providerspezifischen Usage-Endpunkt oder Payload-Parser                                                               |
| 41  | `createEmbeddingProvider`         | Einen provider-eigenen Embedding-Adapter für Memory/Suche bauen                                                | Verhalten von Memory-Embeddings gehört zum Provider-Plugin                                                                                    |
| 42  | `buildReplayPolicy`               | Eine Replay-Richtlinie zurückgeben, die die Behandlung von Transkripten für den Provider steuert              | Provider benötigt eine benutzerdefinierte Transkript-Richtlinie (zum Beispiel Strippen von Thinking-Blöcken)                                 |
| 43  | `sanitizeReplayHistory`           | Replay-Verlauf nach generischer Transkript-Bereinigung umschreiben                                             | Provider benötigt providerspezifische Umschreibungen des Replay jenseits gemeinsam genutzter Helpers für Compaction                          |
| 44  | `validateReplayTurns`             | Endgültige Validierung oder Umformung von Replay-Turns vor dem eingebetteten Runner                            | Provider-Transport benötigt strengere Validierung von Turns nach generischer Bereinigung                                                     |
| 45  | `onModelSelected`                 | Provider-eigene Side Effects nach der Auswahl ausführen                                                        | Provider benötigt Telemetrie oder provider-eigenen Status, wenn ein Modell aktiv wird                                                        |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
passende Provider-Plugin und fallen dann auf andere Hook-fähige Provider-Plugins
zurück, bis eines die Modell-ID oder den Transport/die Konfiguration tatsächlich ändert. Dadurch
funktionieren Alias-/Kompatibilitäts-Shims für Provider weiter, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten
Google-Familien-Konfigurationseintrag umschreibt, wendet der gebündelte Google-Konfigurationsnormalisierer
diese Kompatibilitätsbereinigung weiterhin an.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protokoll oder einen benutzerdefinierten Anfrage-Executor benötigt,
ist das eine andere Klasse von Erweiterung. Diese Hooks sind für Provider-Verhalten gedacht,
das weiterhin in der normalen Inferenzschleife von OpenClaw läuft.

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

Gebündelte Provider-Plugins kombinieren die obigen Hooks so, dass sie zu den Katalog-,
Auth-, Thinking-, Replay- und Usage-Anforderungen jedes Vendors passen. Der maßgebliche Hook-Satz liegt
bei jedem Plugin unter `extensions/`; diese Seite veranschaulicht die Formen, statt
die Liste zu spiegeln.

<AccordionGroup>
  <Accordion title="Pass-through-Katalog-Provider">
    OpenRouter, Kilocode, Z.AI, xAI registrieren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, damit sie Upstream-
    Modell-IDs vor dem statischen Katalog von OpenClaw bereitstellen können.
  </Accordion>
  <Accordion title="OAuth- und Usage-Endpunkt-Provider">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai kombinieren
    `prepareRuntimeAuth` oder `formatApiKey` mit `resolveUsageAuth` +
    `fetchUsageSnapshot`, um Token-Austausch und `/usage`-Integration selbst zu besitzen.
  </Accordion>
  <Accordion title="Replay- und Transkript-Bereinigungsfamilien">
    Gemeinsam genutzte benannte Familien (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) ermöglichen Providern,
    Transkript-Richtlinien über `buildReplayPolicy` zu aktivieren, statt dass jedes Plugin
    die Bereinigung neu implementiert.
  </Accordion>
  <Accordion title="Nur-Katalog-Provider">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` und
    `volcengine` registrieren nur `catalog` und verwenden die gemeinsam genutzte Inferenzschleife.
  </Accordion>
  <Accordion title="Anthropic-spezifische Stream-Helfer">
    Beta-Header, `/fast` / `serviceTier` und `context1m` liegen innerhalb der
    öffentlichen Schnittstelle `api.ts` / `contract-api.ts` des Anthropic-Plugins
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) statt in
    der generischen SDK.
  </Accordion>
</AccordionGroup>

## Laufzeit-Helfer

Plugins können auf ausgewählte Core-Helfer über `api.runtime` zugreifen. Für TTS:

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

- `textToSpeech` gibt die normale Core-TTS-Ausgabe-Payload für Datei-/Sprachnotiz-Oberflächen zurück.
- Verwendet die Core-Konfiguration `messages.tts` und Provider-Auswahl.
- Gibt PCM-Audiopuffer + Sample-Rate zurück. Plugins müssen für Provider resamplen/enkodieren.
- `listVoices` ist optional pro Provider. Verwenden Sie es für vendor-eigene Voice-Picker oder Setup-Flows.
- Stimmlisten können umfangreichere Metadaten wie Locale, Geschlecht und Persönlichkeits-Tags für providerbewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telephony. Microsoft nicht.

Plugins können außerdem Sprach-Provider über `api.registerSpeechProvider(...)` registrieren.

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

- Halten Sie TTS-Richtlinie, Fallback und Antwortzustellung im Core.
- Verwenden Sie Sprach-Provider für vendor-eigenes Syntheseverhalten.
- Veraltete Microsoft-`edge`-Eingaben werden auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Eigentumsmodell ist firmenorientiert: Ein Vendor-Plugin kann
  Text-, Sprach-, Bild- und zukünftige Medien-Provider besitzen, während OpenClaw diese
  Fähigkeitsverträge erweitert.

Für Bild-/Audio-/Video-Understanding registrieren Plugins einen einzigen typisierten
Provider für Media Understanding statt eines generischen Key/Value-Bags:

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

- Halten Sie Orchestrierung, Fallback, Konfiguration und Kanalverdrahtung im Core.
- Halten Sie Vendor-Verhalten im Provider-Plugin.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Fähigkeiten.
- Video-Generierung folgt bereits demselben Muster:
  - der Core besitzt den Fähigkeitsvertrag und den Laufzeit-Helfer
  - Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Kanal-Plugins konsumieren `api.runtime.videoGeneration.*`

Für Laufzeit-Helfer von Media Understanding können Plugins aufrufen:

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

Für Audio-Transkription können Plugins entweder die Laufzeit von Media Understanding
oder den älteren STT-Alias verwenden:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional, wenn MIME nicht zuverlässig abgeleitet werden kann:
  mime: "audio/ogg",
});
```

Hinweise:

- `api.runtime.mediaUnderstanding.*` ist die bevorzugte gemeinsam genutzte Oberfläche für
  Bild-/Audio-/Video-Understanding.
- Verwendet die Core-Audio-Konfiguration für Media Understanding (`tools.media.audio`) und die Provider-Fallback-Reihenfolge.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungenen/nicht unterstützten Eingaben).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias bestehen.

Plugins können außerdem Hintergrundläufe von Subagents über `api.runtime.subagent` starten:

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

- `provider` und `model` sind optionale Überschreibungen pro Lauf, keine persistenten Sitzungsänderungen.
- OpenClaw berücksichtigt diese Override-Felder nur für vertrauenswürdige Aufrufer.
- Für plugin-eigene Fallback-Läufe müssen Operatoren mit `plugins.entries.<id>.subagent.allowModelOverride: true` optieren.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"`, um jedes Ziel explizit zu erlauben.
- Nicht vertrauenswürdige Subagent-Läufe von Plugins funktionieren weiterhin, aber Override-Anfragen werden abgelehnt, statt stillschweigend zurückzufallen.

Für Websuche können Plugins den gemeinsam genutzten Laufzeit-Helfer verwenden, statt
in die Verdrahtung der Agent-Tools einzugreifen:

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

Plugins können außerdem Web-Search-Provider über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Halten Sie Provider-Auswahl, Credential-Auflösung und gemeinsam genutzte Anfragesemantik im Core.
- Verwenden Sie Web-Search-Provider für vendor-spezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsam genutzte Oberfläche für Feature-/Kanal-Plugins, die Suchverhalten benötigen, ohne vom Agent-Tool-Wrapper abzuhängen.

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

- `generate(...)`: ein Bild mit der konfigurierten Provider-Kette für Bildgenerierung erzeugen.
- `listProviders(...)`: verfügbare Provider für Bildgenerierung und ihre Fähigkeiten auflisten.

## Gateway-HTTP-Routen

Plugins können HTTP-Endpunkte über `api.registerHttpRoute(...)` bereitstellen.

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

Routenfelder:

- `path`: Routenpfad unter dem HTTP-Server des Gateway.
- `auth`: erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Auth zu verlangen, oder `"plugin"` für pluginverwaltete Auth/Webhook-Verifikation.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene bestehende Routenregistrierung zu ersetzen.
- `handler`: gibt `true` zurück, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und führt zu einem Fehler beim Plugin-Laden. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte Konflikte bei `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halten Sie Fallthrough-Ketten aus `exact`/`prefix` nur auf derselben Auth-Stufe.
- Routen mit `auth: "plugin"` erhalten **nicht** automatisch Runtime-Scopes von Operatoren. Sie sind für pluginverwaltete Webhooks/Signaturverifikation gedacht, nicht für privilegierte Gateway-Helferaufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Runtime-Scopes einer Gateway-Anfrage, aber dieser Scope ist absichtlich konservativ:
  - Shared-Secret-Bearer-Auth (`gateway.auth.mode = "token"` / `"password"`) hält Runtime-Scopes von Plugin-Routen auf `operator.write` festgenagelt, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identitätsträger (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` auf einem privaten Ingress) beachten `x-openclaw-scopes` nur, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei solchen Plugin-Routenanfragen mit Identitätsträger fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine pluginroute mit Gateway-Auth implizit eine Admin-Oberfläche ist. Wenn Ihre Route nur für Admins vorgesehenes Verhalten braucht, verlangen Sie einen Auth-Modus mit Identitätsträger und dokumentieren Sie den expliziten Header-Vertrag für `x-openclaw-scopes`.

## Importpfade des Plugin SDK

Verwenden Sie schmale SDK-Subpfade statt des monolithischen Root-Barrels `openclaw/plugin-sdk`,
wenn Sie neue Plugins schreiben. Core-Subpfade:

| Subpfad                             | Zweck                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive für Plugin-Registrierung                 |
| `openclaw/plugin-sdk/channel-core`  | Helfer für Kanal-Einstieg/Build                    |
| `openclaw/plugin-sdk/core`          | Generische gemeinsame Helfer und Umbrella-Vertrag  |
| `openclaw/plugin-sdk/config-schema` | Zod-Schema der Root-`openclaw.json` (`OpenClawSchema`) |

Kanal-Plugins wählen aus einer Familie schmaler Seams — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` und `channel-actions`. Freigabeverhalten sollte auf einem
einzigen Vertrag `approvalCapability` konsolidiert werden, statt über nicht verwandte
Plugin-Felder gemischt zu werden. Siehe [Channel plugins](/de/plugins/sdk-channel-plugins).

Laufzeit- und Konfigurations-Helfer befinden sich unter passenden `*-runtime`-Subpfaden
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` usw.).

<Info>
`openclaw/plugin-sdk/channel-runtime` ist veraltet — ein Kompatibilitäts-Shim für
ältere Plugins. Neuer Code sollte stattdessen schmalere generische Primitive importieren.
</Info>

Repo-interne Einstiegspunkte (pro Root eines gebündelten Plugin-Pakets):

- `index.js` — Einstieg für gebündeltes Plugin
- `api.js` — Barrel für Helfer/Typen
- `runtime-api.js` — nur Laufzeit-Barrel
- `setup-entry.js` — Einstieg für Setup-Plugin

Externe Plugins sollten nur `openclaw/plugin-sdk/*`-Subpfade importieren. Importieren Sie niemals
`src/*` eines anderen Plugin-Pakets aus dem Core oder aus einem anderen Plugin.
Über Fassade geladene Einstiegspunkte bevorzugen den aktiven Runtime-Konfigurations-Snapshot, wenn einer existiert, und fallen andernfalls auf die auf dem Datenträger aufgelöste Konfigurationsdatei zurück.

Fähigkeitsspezifische Subpfade wie `image-generation`, `media-understanding`
und `speech` existieren, weil gebündelte Plugins sie heute verwenden. Sie sind nicht
automatisch langfristig eingefrorene externe Verträge — prüfen Sie die relevante SDK-
Referenzseite, wenn Sie sich darauf verlassen.

## Schemas des Message-Tools

Plugins sollten channel-spezifische Beiträge zu Schemas über `describeMessageTool(...)` für Primitive beisteuern, die keine Nachrichten sind, etwa Reaktionen, Reads und Umfragen.
Gemeinsam genutzte Send-Presentation sollte den generischen Vertrag `MessagePresentation`
statt provider-nativer Felder für Buttons, Komponenten, Blöcke oder Karten verwenden.
Siehe [Message Presentation](/de/plugins/message-presentation) für Vertrag,
Fallback-Regeln, Provider-Mapping und Checkliste für Plugin-Autoren.

Sendefähige Plugins deklarieren, was sie über Message-Capabilities rendern können:

- `presentation` für semantische Presentation-Blöcke (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` für Anfragen nach angehefteter Zustellung

Der Core entscheidet, ob die Presentation nativ gerendert oder zu Text degradiert wird.
Stellen Sie keine provider-nativen UI-Escape-Hatches aus dem generischen Message-Tool bereit.
Veraltete SDK-Helfer für veraltete native Schemas bleiben für bestehende
Third-Party-Plugins exportiert, aber neue Plugins sollten sie nicht verwenden.

## Auflösung von Kanalzielen

Kanal-Plugins sollten channel-spezifische Zielsemantik besitzen. Halten Sie den gemeinsam genutzten
ausgehenden Host generisch und verwenden Sie die Messaging-Adapter-Oberfläche für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  als `direct`, `group` oder `channel` behandelt werden soll, bevor ein Directory-Lookup erfolgt.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Core mit, ob eine
  Eingabe direkt zur id-ähnlichen Auflösung überspringen soll, statt eine Directory-Suche auszuführen.
- `messaging.targetResolver.resolveTarget(...)` ist der Fallback des Plugins, wenn
  der Core nach der Normalisierung oder nach einem Directory-Fehlschlag eine endgültige provider-eigene Auflösung braucht.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die providerspezifische Konstruktion der Sitzungsroute, sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor
  der Suche nach Peers/Gruppen getroffen werden sollten.
- Verwenden Sie `looksLikeId` für Prüfungen im Stil „behandele dies als explizite/native Ziel-ID“.
- Verwenden Sie `resolveTarget` für providerspezifischen Normalisierungs-Fallback, nicht für
  breit angelegte Directory-Suche.
- Halten Sie provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-
  IDs innerhalb von `target`-Werten oder providerspezifischen Parametern, nicht in generischen SDK-
  Feldern.

## Konfigurationsgestützte Directories

Plugins, die Directory-Einträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin behalten und die gemeinsam genutzten Helfer aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Kanal konfigurationsgestützte Peers/Gruppen benötigt, etwa:

- Allowlist-gesteuerte DM-Peers
- konfigurierte Kanal-/Gruppen-Mappings
- kontobezogene statische Directory-Fallbacks

Die gemeinsam genutzten Helfer in `directory-runtime` behandeln nur generische Operationen:

- Filtern von Anfragen
- Anwenden von Limits
- Deduplizierung-/Normalisierungs-Helfer
- Erstellen von `ChannelDirectoryEntry[]`

Kanal-spezifische Kontoinspektion und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz definieren mit
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin providerspezifische Modell-IDs, Standardwerte für Base-URLs oder Auth-abhängige Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den integrierten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache API-Key- oder env-getriebene Provider
- `profile`: Provider, die erscheinen, wenn Auth-Profile vorhanden sind
- `paired`: Provider, die mehrere verwandte Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkonflikten, sodass Plugins absichtlich einen
integrierten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als veralteter Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Kanalinspektion

Wenn Ihr Plugin einen Kanal registriert, implementieren Sie vorzugsweise
`plugin.config.inspectAccount(cfg, accountId)` zusammen mit `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Laufzeitpfad. Er darf davon ausgehen, dass Zugangsdaten
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` sowie Doctor-/Config-
  Reparaturabläufe sollten keine Laufzeit-Zugangsdaten materialisieren müssen, nur um die
  Konfiguration zu beschreiben.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Nur beschreibenden Kontostatus zurückgeben.
- `enabled` und `configured` beibehalten.
- Gegebenenfalls Felder für Quelle/Status von Zugangsdaten einschließen, etwa:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um schreibgeschützte
  Verfügbarkeit zu melden. Die Rückgabe von `tokenStatus: "available"` (und dem passenden Quellfeld)
  reicht für statusartige Befehle aus.
- Verwenden Sie `configured_unavailable`, wenn eine Zugangsdaten über SecretRef konfiguriert ist, aber
  im aktuellen Befehlspfad nicht verfügbar.

Dadurch können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“
melden, statt abzustürzen oder das Konto fälschlich als nicht konfiguriert darzustellen.

## Package-Packs

Ein Plugin-Verzeichnis kann eine `package.json` mit `openclaw.extensions` enthalten:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere Extensions auflistet, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie diese in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder `openclaw.extensions`-Eintrag muss nach der Auflösung von Symlinks innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die das Paketverzeichnis verlassen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit
`npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte, keine Dev-Abhängigkeiten zur Laufzeit). Halten Sie Trees von Plugin-Abhängigkeiten „reines JS/TS“ und vermeiden Sie Pakete, die `postinstall`-Builds benötigen.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges Setup-only-Modul zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Kanal-Plugin benötigt oder
wenn ein Kanal-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
statt des vollständigen Plugin-Einstiegs. Das hält Start und Setup leichter,
wenn Ihr Haupteinstieg des Plugins auch Tools, Hooks oder anderen nur zur Laufzeit relevanten
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Kanal-Plugin für dieselbe `setupEntry`-Route während der
Pre-Listen-Startphase des Gateway optieren, selbst wenn der Kanal bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startoberfläche vollständig abdeckt, die existieren
muss, bevor das Gateway auf Verbindungen lauscht. In der Praxis bedeutet das, dass der
Setup-Einstieg jede kanal-eigene Fähigkeit registrieren muss, von der der Start abhängt, etwa:

- die Kanalregistrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway zu lauschen beginnt
- alle Gateway-Methoden, Tools oder Dienste, die in diesem Zeitfenster vorhanden sein müssen

Wenn Ihr vollständiger Einstieg noch irgendeine erforderliche Startfähigkeit besitzt, aktivieren Sie
dieses Flag nicht. Lassen Sie das Plugin beim Standardverhalten und OpenClaw den
vollständigen Einstieg während des Starts laden.

Gebündelte Kanäle können außerdem Setup-only-Helfer der Vertragsoberfläche veröffentlichen, die der Core
konsultieren kann, bevor die vollständige Kanallaufzeit geladen ist. Die aktuelle Oberfläche
für Setup-Promotion ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Core verwendet diese Oberfläche, wenn er eine veraltete Einzelkonto-Kanalkonfiguration
nach `channels.<id>.accounts.*` befördern muss, ohne den vollständigen Plugin-Einstieg zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein
benanntes befördertes Konto, wenn benannte Konten bereits existieren, und kann einen
konfigurierten nicht-kanonischen Standardkonto-Schlüssel beibehalten, statt immer
`accounts.default` zu erstellen.

Diese Setup-Patch-Adapter halten die Discovery gebündelter Vertragsoberflächen lazy. Die Importzeit bleibt leicht; die Promotionsoberfläche wird erst bei der ersten Verwendung geladen, statt den Start gebündelter Kanäle beim Modulimport erneut zu betreten.

Wenn diese Startoberflächen Gateway-RPC-Methoden umfassen, halten Sie sie auf einem
pluginspezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und lösen
immer zu `operator.admin` auf, selbst wenn ein Plugin einen engeren Scope anfordert.

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

### Kanal-Katalogmetadaten

Kanal-Plugins können Setup-/Discovery-Metadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` bewerben. Dadurch bleibt der Core frei von Katalogdaten.

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

Nützliche `openclaw.channel`-Felder über das minimale Beispiel hinaus:

- `detailLabel`: sekundäres Label für reichhaltigere Katalog-/Statusoberflächen
- `docsLabel`: Linktext für den Doku-Link überschreiben
- `preferOver`: Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerung von Texten auf Auswahloberflächen
- `markdownCapable`: markiert den Kanal als markdown-fähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: blendet den Kanal aus Oberflächen zur Auflistung konfigurierter Kanäle aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Kanal aus interaktiven Setup-/Configure-Pickern aus, wenn auf `false` gesetzt
- `exposure.docs`: markiert den Kanal als intern/privat für Navigationsoberflächen der Doku
- `showConfigured` / `showInSetup`: veraltete Aliasse, die aus Kompatibilitätsgründen weiterhin akzeptiert werden; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: aktiviert für den Kanal den standardmäßigen `allowFrom`-Quickstart-Ablauf
- `forceAccountBinding`: verlangt explizite Kontobindung, auch wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: bevorzugt Sitzungs-Lookup beim Auflösen von Announce-Zielen

OpenClaw kann außerdem **externe Kanal-Kataloge** zusammenführen (zum Beispiel einen MPM-
Registry-Export). Legen Sie eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder richten Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als veraltete Aliasse für den Schlüssel `"entries"`.

## Kontext-Engine-Plugins

Kontext-Engine-Plugins besitzen die Orchestrierung des Sitzungskontexts für Ingest, Assembly
und Compaction. Registrieren Sie sie aus Ihrem Plugin mit
`api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine mit
`plugins.slots.contextEngine`.

Verwenden Sie dies, wenn Ihr Plugin die Standard-Kontextpipeline ersetzen oder erweitern muss,
statt nur Memory-Suche oder Hooks hinzuzufügen.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, lassen Sie `compact()`
implementiert und delegieren Sie explizit:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

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
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Eine neue Fähigkeit hinzufügen

Wenn ein Plugin Verhalten benötigt, das nicht in die aktuelle API passt, umgehen Sie nicht
das Plugin-System mit einem privaten Reach-in. Fügen Sie die fehlende Fähigkeit hinzu.

Empfohlene Reihenfolge:

1. den Core-Vertrag definieren
   Entscheiden Sie, welches gemeinsame Verhalten der Core besitzen soll: Richtlinie, Fallback, Konfigurations-Merge,
   Lebenszyklus, kanalbezogene Semantik und Form der Laufzeit-Helfer.
2. typisierte Oberflächen für Plugin-Registrierung/Laufzeit hinzufügen
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Fähigkeitsoberfläche.
3. Core + Kanal-/Feature-Consumer verdrahten
   Kanäle und Feature-Plugins sollten die neue Fähigkeit über den Core konsumieren,
   nicht durch direkten Import einer Vendor-Implementierung.
4. Vendor-Implementierungen registrieren
   Vendor-Plugins registrieren dann ihre Backends gegen diese Fähigkeit.
5. Vertragsabdeckung hinzufügen
   Fügen Sie Tests hinzu, damit Eigentümerschaft und Form der Registrierung im Laufe der Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne sich in die Weltanschauung eines
einzelnen Providers hart zu codieren. Siehe das [Capability Cookbook](/de/plugins/architecture)
für eine konkrete Checkliste von Dateien und ein ausgearbeitetes Beispiel.

### Checkliste für Fähigkeiten

Wenn Sie eine neue Fähigkeit hinzufügen, sollte die Implementierung diese
Oberflächen normalerweise gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner/Laufzeit-Helfer in `src/<capability>/runtime.ts`
- Oberfläche für Plugin-API-Registrierung in `src/plugins/types.ts`
- Verdrahtung des Plugin-Registers in `src/plugins/registry.ts`
- Plugin-Laufzeit-Exposition in `src/plugins/runtime/*`, wenn Feature-/Kanal-
  Plugins sie konsumieren müssen
- Capture-/Test-Helfer in `src/test-utils/plugin-registration.ts`
- Assertions zu Eigentümerschaft/Vertrag in `src/plugins/contracts/registry.ts`
- Operator-/Plugin-Dokumentation in `docs/`

Wenn eine dieser Oberflächen fehlt, ist das meist ein Zeichen dafür, dass die Fähigkeit
noch nicht vollständig integriert ist.

### Vorlage für Fähigkeiten

Minimales Muster:

```ts
// Core-Vertrag
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// Plugin-API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// gemeinsam genutzter Laufzeit-Helfer für Feature-/Kanal-Plugins
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
- Feature-/Kanal-Plugins konsumieren Laufzeit-Helfer
- Vertragstests halten Eigentümerschaft explizit

## Verwandt

- [Plugin architecture](/de/plugins/architecture) — öffentliches Fähigkeitsmodell und Formen
- [Plugin SDK subpaths](/de/plugins/sdk-subpaths)
- [Plugin SDK setup](/de/plugins/sdk-setup)
- [Building plugins](/de/plugins/building-plugins)
