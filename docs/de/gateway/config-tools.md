---
read_when:
    - '`tools.*`-Richtlinie, Allowlists oder experimentelle Funktionen konfigurieren'
    - Benutzerdefinierte Provider registrieren oder Base-URLs überschreiben
    - Selbst gehostete OpenAI-kompatible Endpunkte einrichten
summary: Tools-Konfiguration (Richtlinie, experimentelle Toggles, providergestützte Tools) und Einrichtung von benutzerdefiniertem Provider/Base-URL
title: Konfiguration — Tools und benutzerdefinierte Provider
x-i18n:
    generated_at: "2026-04-24T06:36:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92535fb937f688c7cd39dcf5fc55f4663c8d234388a46611527efad4b7ee85eb
    source_path: gateway/config-tools.md
    workflow: 15
---

Konfigurationsschlüssel `tools.*` sowie Einrichtung von benutzerdefiniertem Provider / Base-URL. Für Agenten,
Channels und andere Top-Level-Konfigurationsschlüssel siehe
[Configuration reference](/de/gateway/configuration-reference).

## Tools

### Tool-Profile

`tools.profile` setzt eine Basis-Allowlist vor `tools.allow`/`tools.deny`:

Lokales Onboarding setzt für neue lokale Konfigurationen standardmäßig `tools.profile: "coding"`, wenn nichts gesetzt ist (bestehende explizite Profile bleiben erhalten).

| Profil      | Enthält                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | nur `session_status`                                                                                                            |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Keine Einschränkung (wie nicht gesetzt)                                                                                         |

### Tool-Gruppen

| Gruppe             | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wird als Alias für `exec` akzeptiert)                                      |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Alle integrierten Tools (ohne Provider-Plugins)                                                                         |

### `tools.allow` / `tools.deny`

Globale Tool-Allow-/Deny-Richtlinie (Deny gewinnt). Case-insensitive, unterstützt `*`-Wildcards. Wird auch angewendet, wenn die Docker-Sandbox deaktiviert ist.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Schränkt Tools für bestimmte Provider oder Modelle weiter ein. Reihenfolge: Basisprofil → Provider-Profil → Allow/Deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Steuert erhöhten `exec`-Zugriff außerhalb der Sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Die Überschreibung pro Agent (`agents.list[].tools.elevated`) kann nur weiter einschränken.
- `/elevated on|off|ask|full` speichert den Zustand pro Sitzung; Inline-Direktiven gelten für eine einzelne Nachricht.
- Erhöhtes `exec` umgeht die Sandbox und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das `exec`-Ziel `node` ist).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Sicherheitsprüfungen für Tool-Loops sind **standardmäßig deaktiviert**. Setzen Sie `enabled: true`, um die Erkennung zu aktivieren.
Einstellungen können global in `tools.loopDetection` definiert und pro Agent unter `agents.list[].tools.loopDetection` überschrieben werden.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: maximale Tool-Call-Historie, die für die Loop-Analyse behalten wird.
- `warningThreshold`: Schwellenwert für Warnungen bei sich wiederholenden Mustern ohne Fortschritt.
- `criticalThreshold`: höherer Wiederholungsschwellenwert zum Blockieren kritischer Loops.
- `globalCircuitBreakerThreshold`: Hard-Stop-Schwellenwert für jeden Lauf ohne Fortschritt.
- `detectors.genericRepeat`: bei wiederholten Calls mit demselben Tool/denselben Argumenten warnen.
- `detectors.knownPollNoProgress`: bei bekannten Poll-Tools (`process.poll`, `command_status` usw.) ohne Fortschritt warnen/blockieren.
- `detectors.pingPong`: bei alternierenden Paarmustern ohne Fortschritt warnen/blockieren.
- Wenn `warningThreshold >= criticalThreshold` oder `criticalThreshold >= globalCircuitBreakerThreshold` ist, schlägt die Validierung fehl.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // oder BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; für automatische Erkennung weglassen
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Konfiguriert die Verarbeitung eingehender Medien (Bild/Audio/Video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // Opt-in: abgeschlossene asynchrone Musik/Videos direkt an den Channel senden
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Felder für Media-Modell-Einträge">

**Provider-Eintrag** (`type: "provider"` oder weggelassen):

- `provider`: API-Provider-ID (`openai`, `anthropic`, `google`/`gemini`, `groq` usw.)
- `model`: Überschreibung der Modell-ID
- `profile` / `preferredProfile`: Profilauswahl aus `auth-profiles.json`

**CLI-Eintrag** (`type: "cli"`):

- `command`: auszuführendes Programm
- `args`: templatisierte Argumente (unterstützt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` usw.)

**Gemeinsame Felder:**

- `capabilities`: optionale Liste (`image`, `audio`, `video`). Standardwerte: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: Überschreibungen pro Eintrag.
- Bei Fehlern wird auf den nächsten Eintrag zurückgegriffen.

Provider-Authentifizierung folgt der Standardreihenfolge: `auth-profiles.json` → Env-Variablen → `models.providers.*.apiKey`.

**Felder für asynchronen Abschluss:**

- `asyncCompletion.directSend`: wenn `true`, versuchen abgeschlossene asynchrone Tasks von `music_generate`
  und `video_generate` zuerst eine direkte Zustellung an den Channel. Standard: `false`
  (Legacy-Pfad über Requester-Session-Aufwecken/Modell-Zustellung).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Steuert, welche Sitzungen von den Session-Tools (`sessions_list`, `sessions_history`, `sessions_send`) angesprochen werden können.

Standard: `tree` (aktuelle Sitzung + von ihr gestartete Sitzungen, etwa Subagenten).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Hinweise:

- `self`: nur der aktuelle Sitzungsschlüssel.
- `tree`: aktuelle Sitzung + von der aktuellen Sitzung gestartete Sitzungen (Subagenten).
- `agent`: jede Sitzung, die zur aktuellen Agent-ID gehört (kann auch andere Benutzer umfassen, wenn Sie Sitzungen pro Absender unter derselben Agent-ID ausführen).
- `all`: jede Sitzung. Agent-übergreifendes Targeting erfordert weiterhin `tools.agentToAgent`.
- Sandbox-Begrenzung: Wenn die aktuelle Sitzung sandboxed ist und `agents.defaults.sandbox.sessionToolsVisibility="spawned"` gesetzt ist, wird die Sichtbarkeit auf `tree` erzwungen, selbst wenn `tools.sessions.visibility="all"` gesetzt ist.

### `tools.sessions_spawn`

Steuert die Unterstützung für Inline-Anhänge bei `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // Opt-in: auf true setzen, um Inline-Dateianhänge zu erlauben
        maxTotalBytes: 5242880, // insgesamt 5 MB über alle Dateien
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB pro Datei
        retainOnSessionKeep: false, // Anhänge beibehalten, wenn cleanup="keep"
      },
    },
  },
}
```

Hinweise:

- Anhänge werden nur für `runtime: "subagent"` unterstützt. ACP-Runtime lehnt sie ab.
- Dateien werden im Child-Workspace unter `.openclaw/attachments/<uuid>/` mit einer `.manifest.json` materialisiert.
- Anhangsinhalte werden bei der Transkript-Persistenz automatisch redigiert.
- Base64-Eingaben werden mit strikten Prüfungen für Alphabet/Padding und einer Größenprüfung vor dem Decoding validiert.
- Dateiberechtigungen sind `0700` für Verzeichnisse und `0600` für Dateien.
- Cleanup folgt der Richtlinie `cleanup`: `delete` entfernt Anhänge immer; `keep` behält sie nur, wenn `retainOnSessionKeep: true` gesetzt ist.

<a id="toolsexperimental"></a>

### `tools.experimental`

Experimentelle Flags für integrierte Tools. Standardmäßig aus, außer wenn eine Auto-Enable-Regel für streng agentisches GPT-5 greift.

```json5
{
  tools: {
    experimental: {
      planTool: true, // experimentelles update_plan aktivieren
    },
  },
}
```

Hinweise:

- `planTool`: aktiviert das strukturierte Tool `update_plan` zur Nachverfolgung nicht-trivialer mehrstufiger Arbeit.
- Standard: `false`, außer `agents.defaults.embeddedPi.executionContract` (oder eine Überschreibung pro Agent) ist für einen OpenAI- oder OpenAI Codex-GPT-5-Familienlauf auf `"strict-agentic"` gesetzt. Setzen Sie `true`, um das Tool auch außerhalb dieses Bereichs zu erzwingen, oder `false`, um es selbst bei streng agentischen GPT-5-Läufen deaktiviert zu halten.
- Wenn aktiviert, ergänzt der System-Prompt auch Nutzungshinweise, damit das Modell es nur für substanzielle Arbeit verwendet und höchstens einen Schritt als `in_progress` hält.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: Standardmodell für gestartete Subagenten. Wenn weggelassen, erben Subagenten das Modell des Aufrufers.
- `allowAgents`: Standard-Allowlist der Ziel-Agent-IDs für `sessions_spawn`, wenn der anfragende Agent nicht seine eigene `subagents.allowAgents` setzt (`["*"]` = beliebig; Standard: nur derselbe Agent).
- `runTimeoutSeconds`: Standard-Timeout (Sekunden) für `sessions_spawn`, wenn der Tool-Aufruf `runTimeoutSeconds` weglässt. `0` bedeutet kein Timeout.
- Tool-Richtlinie pro Subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Benutzerdefinierte Provider und Base-URLs

OpenClaw verwendet den integrierten Modellkatalog. Fügen Sie benutzerdefinierte Provider über `models.providers` in der Konfiguration oder `~/.openclaw/agents/<agentId>/agent/models.json` hinzu.

```json5
{
  models: {
    mode: "merge", // merge (Standard) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Verwenden Sie `authHeader: true` + `headers` für benutzerdefinierte Authentifizierungsanforderungen.
- Überschreiben Sie das Root der Agent-Konfiguration mit `OPENCLAW_AGENT_DIR` (oder `PI_CODING_AGENT_DIR`, ein Legacy-Alias für Umgebungsvariablen).
- Merge-Priorität für übereinstimmende Provider-IDs:
  - Nicht-leere `baseUrl`-Werte aus `models.json` des Agenten gewinnen.
  - Nicht-leere `apiKey`-Werte des Agenten gewinnen nur dann, wenn dieser Provider im aktuellen Kontext von Config/Auth-Profil nicht per SecretRef verwaltet wird.
  - Per SecretRef verwaltete `apiKey`-Werte des Providers werden aus Quellmarkern aktualisiert (`ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs), statt aufgelöste Secrets zu persistieren.
  - Per SecretRef verwaltete Header-Werte des Providers werden aus Quellmarkern aktualisiert (`secretref-env:ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs).
  - Leere oder fehlende `apiKey`/`baseUrl` des Agenten fallen auf `models.providers` in der Konfiguration zurück.
  - Übereinstimmende `contextWindow`/`maxTokens` des Modells verwenden den höheren Wert aus expliziter Konfiguration und impliziten Katalogwerten.
  - Übereinstimmende `contextTokens` des Modells behalten eine explizite Runtime-Begrenzung bei, wenn sie vorhanden ist; verwenden Sie dies, um den effektiven Kontext zu begrenzen, ohne native Modellmetadaten zu ändern.
  - Verwenden Sie `models.mode: "replace"`, wenn die Konfiguration `models.json` vollständig neu schreiben soll.
  - Marker-Persistenz ist quellenautoritativ: Marker werden aus dem aktiven Snapshot der Quellkonfiguration (vor der Auflösung) geschrieben, nicht aus aufgelösten Runtime-Secret-Werten.

### Details zu Provider-Feldern

- `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
- `models.providers`: benutzerdefinierte Provider-Map, nach Provider-ID indiziert.
  - Sichere Änderungen: Verwenden Sie `openclaw config set models.providers.<id> '<json>' --strict-json --merge` oder `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` für additive Aktualisierungen. `config set` verweigert destruktive Ersetzungen, sofern Sie nicht `--replace` übergeben.
- `models.providers.*.api`: Request-Adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` usw.).
- `models.providers.*.apiKey`: Provider-Zugangsdaten (bevorzugt SecretRef-/Env-Substitution).
- `models.providers.*.auth`: Authentifizierungsstrategie (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: für Ollama + `openai-completions` `options.num_ctx` in Requests injizieren (Standard: `true`).
- `models.providers.*.authHeader`: Transport der Zugangsdaten im Header `Authorization` erzwingen, wenn erforderlich.
- `models.providers.*.baseUrl`: Base-URL der Upstream-API.
- `models.providers.*.headers`: zusätzliche statische Header für Proxy-/Tenant-Routing.
- `models.providers.*.request`: Transport-Überschreibungen für HTTP-Requests des Modell-Providers.
  - `request.headers`: zusätzliche Header (werden mit den Provider-Standards zusammengeführt). Werte akzeptieren SecretRef.
  - `request.auth`: Überschreibung der Authentifizierungsstrategie. Modi: `"provider-default"` (eingebaute Provider-Authentifizierung verwenden), `"authorization-bearer"` (mit `token`), `"header"` (mit `headerName`, `value`, optional `prefix`).
  - `request.proxy`: Überschreibung des HTTP-Proxys. Modi: `"env-proxy"` (verwende `HTTP_PROXY`/`HTTPS_PROXY`-Env-Variablen), `"explicit-proxy"` (mit `url`). Beide Modi akzeptieren optional ein Unterobjekt `tls`.
  - `request.tls`: TLS-Überschreibung für direkte Verbindungen. Felder: `ca`, `cert`, `key`, `passphrase` (alle akzeptieren SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: wenn `true`, HTTPS zu `baseUrl` erlauben, wenn DNS auf private, CGNAT- oder ähnliche Bereiche auflöst, über die HTTP-Fetch-Leitplanke des Providers (Opt-in des Operators für vertrauenswürdige selbst gehostete OpenAI-kompatible Endpunkte). WebSocket verwendet dieselbe `request` für Header/TLS, aber nicht diese Fetch-SSRF-Leitplanke. Standard `false`.
- `models.providers.*.models`: explizite Einträge des Provider-Modellkatalogs.
- `models.providers.*.models.*.contextWindow`: native Metadaten zum Kontextfenster des Modells.
- `models.providers.*.models.*.contextTokens`: optionale Runtime-Kontextbegrenzung. Verwenden Sie dies, wenn Sie ein kleineres effektives Kontextbudget als das native `contextWindow` des Modells möchten.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: optionaler Kompatibilitätshinweis. Für `api: "openai-completions"` mit einer nicht-leeren, nicht nativen `baseUrl` (Host nicht `api.openai.com`) erzwingt OpenClaw dies zur Laufzeit auf `false`. Leere/weggelassene `baseUrl` behält das Standardverhalten von OpenAI bei.
- `models.providers.*.models.*.compat.requiresStringContent`: optionaler Kompatibilitätshinweis für OpenAI-kompatible Chat-Endpunkte, die nur Strings unterstützen. Wenn `true`, flacht OpenClaw reine Text-Arrays in `messages[].content` vor dem Senden der Anfrage zu einfachen Strings ab.
- `plugins.entries.amazon-bedrock.config.discovery`: Root der Bedrock-Auto-Discovery-Einstellungen.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: implizite Discovery ein-/ausschalten.
- `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-Region für Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optionaler Filter nach Provider-ID für gezielte Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: Polling-Intervall für die Aktualisierung der Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: Fallback-Kontextfenster für erkannte Modelle.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: Fallback-Maximum an Output-Tokens für erkannte Modelle.

### Provider-Beispiele

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Verwenden Sie `cerebras/zai-glm-4.7` für Cerebras; `zai/glm-4.7` für Z.AI direkt.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Setzen Sie `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`). Verwenden Sie `opencode/...`-Referenzen für den Zen-Katalog oder `opencode-go/...`-Referenzen für den Go-Katalog. Abkürzung: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Setzen Sie `ZAI_API_KEY`. `z.ai/*` und `z-ai/*` sind akzeptierte Aliase. Abkürzung: `openclaw onboard --auth-choice zai-api-key`.

- Allgemeiner Endpunkt: `https://api.z.ai/api/paas/v4`
- Coding-Endpunkt (Standard): `https://api.z.ai/api/coding/paas/v4`
- Für den allgemeinen Endpunkt definieren Sie einen benutzerdefinierten Provider mit überschriebenem Base-URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Für den China-Endpunkt: `baseUrl: "https://api.moonshot.cn/v1"` oder `openclaw onboard --auth-choice moonshot-api-key-cn`.

Native Moonshot-Endpunkte melden Streaming-Usage-Kompatibilität über den gemeinsamen
Transport `openai-completions`, und OpenClaw richtet sich dabei nach den Fähigkeiten des Endpunkts
und nicht nur nach der eingebauten Provider-ID.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic-kompatibler, eingebauter Provider. Abkürzung: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (Anthropic-kompatibel)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Die Base-URL sollte `/v1` weglassen (der Anthropic-Client hängt es an). Abkürzung: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direkt)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Setzen Sie `MINIMAX_API_KEY`. Abkürzungen:
`openclaw onboard --auth-choice minimax-global-api` oder
`openclaw onboard --auth-choice minimax-cn-api`.
Der Modellkatalog verwendet standardmäßig nur M2.7.
Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax-Thinking
standardmäßig, sofern Sie `thinking` nicht selbst explizit setzen. `/fast on` oder
`params.fastMode: true` schreibt `MiniMax-M2.7` auf
`MiniMax-M2.7-highspeed` um.

</Accordion>

<Accordion title="Lokale Modelle (LM Studio)">

Siehe [Local Models](/de/gateway/local-models). Kurzfassung: Führen Sie ein großes lokales Modell über die LM Studio Responses API auf leistungsfähiger Hardware aus; behalten Sie gehostete Modelle zur Absicherung zusammengeführt.

</Accordion>

---

## Verwandt

- [Configuration reference](/de/gateway/configuration-reference) — andere Top-Level-Schlüssel
- [Configuration — agents](/de/gateway/config-agents)
- [Configuration — channels](/de/gateway/config-channels)
- [Tools and plugins](/de/tools)
