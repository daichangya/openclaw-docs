---
read_when:
    - Modelle auswählen oder wechseln, Aliasse konfigurieren
    - Modell-Failover / „All models failed“ debuggen
    - Authentifizierungsprofile verstehen und verwalten
sidebarTitle: Models FAQ
summary: 'FAQ: Modell-Standards, Auswahl, Aliasse, Umschalten, Failover und Authentifizierungsprofile'
title: 'FAQ: Modelle und Authentifizierung'
x-i18n:
    generated_at: "2026-04-24T06:41:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8acc0bc1ea7096ba4743defb2a1766a62ccf6c44202df82ee9c1c04e5ab62222
    source_path: help/faq-models.md
    workflow: 15
---

  Fragen und Antworten zu Modellen und Authentifizierungsprofilen. Für Einrichtung, Sitzungen, Gateway, Kanäle und
  Fehlerbehebung siehe die Haupt-[FAQ](/de/help/faq).

  ## Modelle: Standards, Auswahl, Aliasse, Umschalten

  <AccordionGroup>
  <Accordion title='Was ist das "Standardmodell"?'>
    Das Standardmodell von OpenClaw ist das, was Sie hier setzen:

    ```
    agents.defaults.model.primary
    ```

    Modelle werden als `provider/model` referenziert (Beispiel: `openai/gpt-5.4` oder `openai-codex/gpt-5.5`). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann eine eindeutige Übereinstimmung unter konfigurierten Providern für genau diese Modell-ID und fällt erst danach auf den konfigurierten Standardprovider als veralteten Kompatibilitätspfad zurück. Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw auf das erste konfigurierte Provider-/Modell-Paar zurück, statt einen veralteten entfernten Provider-Standard sichtbar zu machen. Sie sollten dennoch **explizit** `provider/model` setzen.

  </Accordion>

  <Accordion title="Welches Modell empfehlen Sie?">
    **Empfohlener Standard:** Verwenden Sie das stärkste aktuelle Modell, das in Ihrem Provider-Stack verfügbar ist.
    **Für Agenten mit Tools oder nicht vertrauenswürdigen Eingaben:** priorisieren Sie Modellstärke vor Kosten.
    **Für Routine-/Low-Stakes-Chat:** verwenden Sie günstigere Fallback-Modelle und routen Sie nach Agentenrolle.

    MiniMax hat eigene Dokumentation: [MiniMax](/de/providers/minimax) und
    [Lokale Modelle](/de/gateway/local-models).

    Faustregel: Verwenden Sie für Aufgaben mit hohem Einsatz das **beste Modell, das Sie sich leisten können**, und ein günstigeres
    Modell für Routine-Chat oder Zusammenfassungen. Sie können Modelle pro Agent routen und Subagenten verwenden, um
    lange Aufgaben zu parallelisieren (jeder Subagent verbraucht Tokens). Siehe [Modelle](/de/concepts/models) und
    [Subagenten](/de/tools/subagents).

    Deutliche Warnung: Schwächere/überquantisierte Modelle sind anfälliger für Prompt-
    Injection und unsicheres Verhalten. Siehe [Sicherheit](/de/gateway/security).

    Mehr Kontext: [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Wie wechsle ich Modelle, ohne meine Konfiguration zu löschen?">
    Verwenden Sie **Modellbefehle** oder bearbeiten Sie nur die **Modell**-Felder. Vermeiden Sie vollständige Ersetzungen der Konfiguration.

    Sichere Optionen:

    - `/model` im Chat (schnell, pro Sitzung)
    - `openclaw models set ...` (aktualisiert nur die Modellkonfiguration)
    - `openclaw configure --section model` (interaktiv)
    - `agents.defaults.model` in `~/.openclaw/openclaw.json` bearbeiten

    Vermeiden Sie `config.apply` mit einem partiellen Objekt, es sei denn, Sie beabsichtigen, die ganze Konfiguration zu ersetzen.
    Für RPC-Bearbeitungen zuerst mit `config.schema.lookup` prüfen und `config.patch` bevorzugen. Die Lookup-Payload gibt Ihnen den normalisierten Pfad, flache Schema-Dokumentation/-Constraints und Zusammenfassungen der direkten Child-Knoten.
    für partielle Updates.
    Wenn Sie die Konfiguration überschrieben haben, stellen Sie sie aus dem Backup wieder her oder führen Sie `openclaw doctor` erneut aus, um sie zu reparieren.

    Dokumentation: [Modelle](/de/concepts/models), [Configure](/de/cli/configure), [Konfiguration](/de/cli/config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Kann ich selbst gehostete Modelle verwenden (llama.cpp, vLLM, Ollama)?">
    Ja. Ollama ist der einfachste Weg für lokale Modelle.

    Schnellstes Setup:

    1. Installieren Sie Ollama von `https://ollama.com/download`
    2. Laden Sie ein lokales Modell, z. B. `ollama pull gemma4`
    3. Wenn Sie auch Cloud-Modelle möchten, führen Sie `ollama signin` aus
    4. Führen Sie `openclaw onboard` aus und wählen Sie `Ollama`
    5. Wählen Sie `Local` oder `Cloud + Local`

    Hinweise:

    - `Cloud + Local` gibt Ihnen Cloud-Modelle plus Ihre lokalen Ollama-Modelle
    - Cloud-Modelle wie `kimi-k2.5:cloud` benötigen keinen lokalen Pull
    - Für manuelles Umschalten verwenden Sie `openclaw models list` und `openclaw models set ollama/<model>`

    Sicherheitshinweis: Kleinere oder stark quantisierte Modelle sind anfälliger für Prompt-
    Injection. Wir empfehlen dringend **große Modelle** für jeden Bot, der Tools verwenden kann.
    Wenn Sie dennoch kleine Modelle verwenden möchten, aktivieren Sie Sandboxing und strikte Tool-Allowlists.

    Dokumentation: [Ollama](/de/providers/ollama), [Lokale Modelle](/de/gateway/local-models),
    [Modell-Provider](/de/concepts/model-providers), [Sicherheit](/de/gateway/security),
    [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Welche Modelle verwenden OpenClaw, Flawd und Krill?">
    - Diese Deployments können sich unterscheiden und sich im Laufe der Zeit ändern; es gibt keine feste Provider-Empfehlung.
    - Prüfen Sie die aktuelle Laufzeiteinstellung auf jedem Gateway mit `openclaw models status`.
    - Für sicherheitsrelevante/toolfähige Agenten verwenden Sie das stärkste verfügbare Modell der neuesten Generation.
  </Accordion>

  <Accordion title="Wie wechsle ich Modelle on the fly (ohne Neustart)?">
    Verwenden Sie den Befehl `/model` als eigenständige Nachricht:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Dies sind die integrierten Aliasse. Benutzerdefinierte Aliasse können über `agents.defaults.models` hinzugefügt werden.

    Sie können verfügbare Modelle mit `/model`, `/model list` oder `/model status` auflisten.

    `/model` (und `/model list`) zeigt eine kompakte, nummerierte Auswahl. Wählen Sie nach Nummer:

    ```
    /model 3
    ```

    Sie können auch ein bestimmtes Authentifizierungsprofil für den Provider erzwingen (pro Sitzung):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tipp: `/model status` zeigt, welcher Agent aktiv ist, welche Datei `auth-profiles.json` verwendet wird und welches Authentifizierungsprofil als Nächstes versucht wird.
    Außerdem zeigt es den konfigurierten Provider-Endpunkt (`baseUrl`) und den API-Modus (`api`), wenn verfügbar.

    **Wie löse ich die Pinning eines Profils, das ich mit @profile gesetzt habe?**

    Führen Sie `/model` erneut **ohne** den Suffix `@profile` aus:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Wenn Sie zum Standard zurückkehren möchten, wählen Sie ihn aus `/model` aus (oder senden Sie `/model <default provider/model>`).
    Verwenden Sie `/model status`, um zu bestätigen, welches Authentifizierungsprofil aktiv ist.

  </Accordion>

  <Accordion title="Kann ich GPT 5.5 für tägliche Aufgaben und Codex 5.5 für Coding verwenden?">
    Ja. Setzen Sie eines als Standard und wechseln Sie bei Bedarf:

    - **Schneller Wechsel (pro Sitzung):** `/model openai/gpt-5.4` für aktuelle direkte OpenAI-API-Key-Aufgaben oder `/model openai-codex/gpt-5.5` für GPT-5.5-Codex-OAuth-Aufgaben.
    - **Standard:** Setzen Sie `agents.defaults.model.primary` auf `openai/gpt-5.4` für API-Key-Nutzung oder auf `openai-codex/gpt-5.5` für GPT-5.5-Codex-OAuth-Nutzung.
    - **Subagenten:** Routen Sie Coding-Aufgaben an Subagenten mit einem anderen Standardmodell.

    Direkter Zugriff per API-Key für `openai/gpt-5.5` wird unterstützt, sobald OpenAI
    GPT-5.5 auf der öffentlichen API aktiviert. Bis dahin ist GPT-5.5 nur mit Subscription/OAuth nutzbar.

    Siehe [Modelle](/de/concepts/models) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie konfiguriere ich den Fast-Modus für GPT 5.5?">
    Verwenden Sie entweder einen Schalter pro Sitzung oder einen Konfigurationsstandard:

    - **Pro Sitzung:** Senden Sie `/fast on`, während die Sitzung `openai/gpt-5.4` oder `openai-codex/gpt-5.5` verwendet.
    - **Standard pro Modell:** Setzen Sie `agents.defaults.models["openai/gpt-5.4"].params.fastMode` oder `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` auf `true`.

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
          },
        },
      },
    }
    ```

    Für OpenAI wird der Fast-Modus bei unterstützten nativen Responses-Anfragen auf `service_tier = "priority"` abgebildet. Sitzungs-Overrides durch `/fast` haben Vorrang vor Konfigurationsstandards.

    Siehe [Thinking und Fast-Modus](/de/tools/thinking) und [OpenAI-Fast-Modus](/de/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Warum sehe ich "Model ... is not allowed" und dann keine Antwort?'>
    Wenn `agents.defaults.models` gesetzt ist, wird dies zur **Allowlist** für `/model` und alle
    Sitzungs-Overrides. Die Auswahl eines Modells, das nicht in dieser Liste steht, gibt Folgendes zurück:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Dieser Fehler wird **anstelle** einer normalen Antwort zurückgegeben. Lösung: Fügen Sie das Modell zu
    `agents.defaults.models` hinzu, entfernen Sie die Allowlist oder wählen Sie ein Modell aus `/model list`.

  </Accordion>

  <Accordion title='Warum sehe ich "Unknown model: minimax/MiniMax-M2.7"?'>
    Das bedeutet, dass der **Provider nicht konfiguriert** ist (es wurde keine MiniMax-Provider-Konfiguration oder
    kein Authentifizierungsprofil gefunden), sodass das Modell nicht aufgelöst werden kann.

    Checkliste zur Behebung:

    1. Aktualisieren Sie auf eine aktuelle OpenClaw-Version (oder führen Sie die Quelle von `main` aus) und starten Sie dann das Gateway neu.
    2. Stellen Sie sicher, dass MiniMax konfiguriert ist (Assistent oder JSON) oder dass eine MiniMax-Authentifizierung
       in env/Auth-Profilen existiert, damit der passende Provider injiziert werden kann
       (`MINIMAX_API_KEY` für `minimax`, `MINIMAX_OAUTH_TOKEN` oder gespeichertes MiniMax-
       OAuth für `minimax-portal`).
    3. Verwenden Sie die exakte Modell-ID (Groß-/Kleinschreibung beachten) für Ihren Auth-Pfad:
       `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed` für API-Key-
       Setup oder `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` für OAuth-Setup.
    4. Führen Sie aus:

       ```bash
       openclaw models list
       ```

       und wählen Sie aus der Liste (oder `/model list` im Chat).

    Siehe [MiniMax](/de/providers/minimax) und [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich MiniMax als Standard und OpenAI für komplexe Aufgaben verwenden?">
    Ja. Verwenden Sie **MiniMax als Standard** und wechseln Sie **pro Sitzung** bei Bedarf die Modelle.
    Fallbacks sind für **Fehler** gedacht, nicht für „schwierige Aufgaben“; verwenden Sie daher `/model` oder einen separaten Agenten.

    **Option A: pro Sitzung wechseln**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Dann:

    ```
    /model gpt
    ```

    **Option B: separate Agenten**

    - Agent A Standard: MiniMax
    - Agent B Standard: OpenAI
    - Nach Agent routen oder mit `/agent` wechseln

    Dokumentation: [Modelle](/de/concepts/models), [Multi-Agent-Routing](/de/concepts/multi-agent), [MiniMax](/de/providers/minimax), [OpenAI](/de/providers/openai).

  </Accordion>

  <Accordion title="Sind opus / sonnet / gpt integrierte Kurzbefehle?">
    Ja. OpenClaw liefert einige Standard-Kurzformen mit (werden nur angewendet, wenn das Modell in `agents.defaults.models` existiert):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4` für API-Key-Setups oder `openai-codex/gpt-5.5`, wenn für Codex-OAuth konfiguriert
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Wenn Sie einen eigenen Alias mit demselben Namen setzen, gewinnt Ihr Wert.

  </Accordion>

  <Accordion title="Wie definiere/überschreibe ich Modell-Kurzbefehle (Aliasse)?">
    Aliasse kommen von `agents.defaults.models.<modelId>.alias`. Beispiel:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Dann wird `/model sonnet` (oder `/<alias>`, wenn unterstützt) zu dieser Modell-ID aufgelöst.

  </Accordion>

  <Accordion title="Wie füge ich Modelle von anderen Providern wie OpenRouter oder Z.AI hinzu?">
    OpenRouter (Pay-per-Token; viele Modelle):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (GLM-Modelle):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Wenn Sie auf ein Provider-/Modellpaar verweisen, aber der erforderliche Provider-Schlüssel fehlt, erhalten Sie einen Laufzeit-Authentifizierungsfehler (z. B. `No API key found for provider "zai"`).

    **Kein API-Schlüssel für den Provider gefunden, nachdem ein neuer Agent hinzugefügt wurde**

    Das bedeutet normalerweise, dass der **neue Agent** einen leeren Auth-Store hat. Authentifizierung ist pro Agent und
    wird hier gespeichert:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Optionen zur Behebung:

    - Führen Sie `openclaw agents add <id>` aus und konfigurieren Sie die Authentifizierung während des Assistenten.
    - Oder kopieren Sie `auth-profiles.json` aus dem `agentDir` des Haupt-Agenten in das `agentDir` des neuen Agenten.

    Verwenden Sie `agentDir` **nicht** gemeinsam für mehrere Agenten; das verursacht Kollisionen bei Authentifizierung und Sitzungen.

  </Accordion>
</AccordionGroup>

## Modell-Failover und „All models failed“

<AccordionGroup>
  <Accordion title="Wie funktioniert Failover?">
    Failover erfolgt in zwei Stufen:

    1. **Rotation von Authentifizierungsprofilen** innerhalb desselben Providers.
    2. **Modell-Fallback** auf das nächste Modell in `agents.defaults.model.fallbacks`.

    Für fehlschlagende Profile gelten Cooldowns (exponentielles Backoff), sodass OpenClaw weiter antworten kann, selbst wenn ein Provider ratenlimitiert ist oder vorübergehend fehlschlägt.

    Der Bucket für Ratenlimits umfasst mehr als nur einfache `429`-Antworten. OpenClaw
    behandelt auch Meldungen wie `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` und periodische
    Nutzungsfenster-Limits (`weekly/monthly limit reached`) als für Failover geeignete
    Ratenlimits.

    Einige nach Abrechnung aussehende Antworten sind kein `402`, und einige HTTP-`402`-
    Antworten bleiben ebenfalls in diesem transienten Bucket. Wenn ein Provider
    expliziten Billing-Text auf `401` oder `403` zurückgibt, kann OpenClaw diesen weiterhin im
    Billing-Pfad halten, aber providerspezifische Text-Matcher bleiben auf den
    Provider begrenzt, dem sie gehören (zum Beispiel OpenRouter `Key limit exceeded`). Wenn eine `402`-
    Nachricht stattdessen wie ein retrybares Nutzungsfenster oder
    ein Spend-Limit einer Organisation/eines Workspace aussieht (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), behandelt OpenClaw dies als
    `rate_limit`, nicht als lange Billing-Deaktivierung.

    Kontextüberlauffehler sind anders: Signaturen wie
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` oder `ollama error: context length
    exceeded` bleiben auf dem Pfad von Compaction/Retry, statt den Modell-
    Fallback voranzutreiben.

    Generischer Serverfehler-Text ist absichtlich enger gefasst als „alles, was
    unknown/error enthält“. OpenClaw behandelt providerspezifische transiente Formen
    wie Anthropic ohne Zusatz `An unknown error occurred`, OpenRouter ohne Zusatz
    `Provider returned error`, Stop-Reason-Fehler wie `Unhandled stop reason:
    error`, JSON-`api_error`-Payloads mit transientem Servertext
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) und Provider-busy-Fehler wie `ModelNotReadyException` als
    für Failover geeignete Timeout-/Überlastungssignale, wenn der Provider-Kontext
    passt.
    Generischer interner Fallback-Text wie `LLM request failed with an unknown
    error.` bleibt konservativ und löst Modell-Fallback nicht von sich aus aus.

  </Accordion>

  <Accordion title='Was bedeutet "No credentials found for profile anthropic:default"?'>
    Es bedeutet, dass das System versucht hat, die Authentifizierungsprofil-ID `anthropic:default` zu verwenden, aber dafür keine Anmeldedaten im erwarteten Auth-Store finden konnte.

    **Checkliste zur Behebung:**

    - **Bestätigen Sie, wo Authentifizierungsprofile liegen** (neue vs. Legacy-Pfade)
      - Aktuell: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (wird durch `openclaw doctor` migriert)
    - **Bestätigen Sie, dass Ihre Env-Variable vom Gateway geladen wird**
      - Wenn Sie `ANTHROPIC_API_KEY` in Ihrer Shell setzen, das Gateway aber über systemd/launchd ausführen, wird diese Variable möglicherweise nicht geerbt. Legen Sie sie in `~/.openclaw/.env` ab oder aktivieren Sie `env.shellEnv`.
    - **Stellen Sie sicher, dass Sie den richtigen Agenten bearbeiten**
      - In Multi-Agent-Setups kann es mehrere Dateien `auth-profiles.json` geben.
    - **Modell-/Auth-Status grob prüfen**
      - Verwenden Sie `openclaw models status`, um konfigurierte Modelle zu sehen und zu prüfen, ob Provider authentifiziert sind.

    **Checkliste zur Behebung für "No credentials found for profile anthropic"**

    Das bedeutet, dass der Lauf auf ein Anthropic-Authentifizierungsprofil festgelegt ist, das Gateway
    es aber nicht in seinem Auth-Store finden kann.

    - **Claude CLI verwenden**
      - Führen Sie `openclaw models auth login --provider anthropic --method cli --set-default` auf dem Gateway-Host aus.
    - **Wenn Sie stattdessen einen API-Schlüssel verwenden möchten**
      - Legen Sie `ANTHROPIC_API_KEY` in `~/.openclaw/.env` auf dem **Gateway-Host** ab.
      - Löschen Sie jede festgelegte Reihenfolge, die ein fehlendes Profil erzwingt:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Bestätigen Sie, dass Sie Befehle auf dem Gateway-Host ausführen**
      - Im Remote-Modus liegen Authentifizierungsprofile auf dem Gateway-Rechner, nicht auf Ihrem Laptop.

  </Accordion>

  <Accordion title="Warum wurde auch Google Gemini versucht und ist fehlgeschlagen?">
    Wenn Ihre Modellkonfiguration Google Gemini als Fallback enthält (oder Sie zu einer Gemini-Kurzform gewechselt haben), versucht OpenClaw dies während des Modell-Fallbacks. Wenn Sie keine Google-Anmeldedaten konfiguriert haben, sehen Sie `No API key found for provider "google"`.

    Lösung: Stellen Sie entweder Google-Authentifizierung bereit oder entfernen/vermeiden Sie Google-Modelle in `agents.defaults.model.fallbacks` / Aliasen, damit Fallback nicht dorthin routet.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Ursache: Die Sitzungshistorie enthält **Thinking-Blöcke ohne Signaturen** (oft aus
    einem abgebrochenen/partiellen Stream). Google Antigravity verlangt Signaturen für Thinking-Blöcke.

    Lösung: OpenClaw entfernt jetzt unsignierte Thinking-Blöcke für Google-Antigravity-Claude. Wenn es dennoch auftritt, starten Sie eine **neue Sitzung** oder setzen Sie für diesen Agenten `/thinking off`.

  </Accordion>
</AccordionGroup>

## Authentifizierungsprofile: was sie sind und wie man sie verwaltet

Verwandt: [/concepts/oauth](/de/concepts/oauth) (OAuth-Flows, Token-Speicherung, Muster für mehrere Konten)

<AccordionGroup>
  <Accordion title="Was ist ein Authentifizierungsprofil?">
    Ein Authentifizierungsprofil ist ein benannter Datensatz mit Anmeldedaten (OAuth oder API-Schlüssel), der an einen Provider gebunden ist. Profile liegen hier:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Wie sehen typische Profil-IDs aus?">
    OpenClaw verwendet IDs mit Provider-Präfix wie:

    - `anthropic:default` (häufig, wenn keine E-Mail-Identität existiert)
    - `anthropic:<email>` für OAuth-Identitäten
    - benutzerdefinierte IDs, die Sie wählen (z. B. `anthropic:work`)

  </Accordion>

  <Accordion title="Kann ich steuern, welches Authentifizierungsprofil zuerst versucht wird?">
    Ja. Die Konfiguration unterstützt optionale Metadaten für Profile und eine Reihenfolge pro Provider (`auth.order.<provider>`). Dadurch werden **keine** Secrets gespeichert; es ordnet IDs Provider/Modus zu und legt die Rotationsreihenfolge fest.

    OpenClaw kann ein Profil vorübergehend überspringen, wenn es sich in einem kurzen **Cooldown** (Ratenlimits/Timeouts/Auth-Fehler) oder in einem längeren **deaktivierten** Zustand (Abrechnung/zu wenig Guthaben) befindet. Um dies zu prüfen, führen Sie `openclaw models status --json` aus und prüfen Sie `auth.unusableProfiles`. Tuning: `auth.cooldowns.billingBackoffHours*`.

    Ratenlimit-Cooldowns können modellbezogen sein. Ein Profil, das
    für ein Modell im Cooldown ist, kann für ein Geschwistermodell beim selben Provider weiterhin verwendbar sein,
    während Billing-/Deaktivierungsfenster weiterhin das gesamte Profil blockieren.

    Sie können auch ein **Override pro Agent** für die Reihenfolge setzen (gespeichert in der `auth-state.json` dieses Agenten) über die CLI:

    ```bash
    # Standardmäßig wird der konfigurierte Standard-Agent verwendet (lassen Sie --agent weg)
    openclaw models auth order get --provider anthropic

    # Rotation auf ein einzelnes Profil festlegen (nur dieses versuchen)
    openclaw models auth order set --provider anthropic anthropic:default

    # Oder eine explizite Reihenfolge setzen (Fallback innerhalb des Providers)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Override löschen (auf config auth.order / Round-Robin zurückfallen)
    openclaw models auth order clear --provider anthropic
    ```

    Um einen bestimmten Agenten anzusprechen:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Um zu prüfen, was tatsächlich versucht wird, verwenden Sie:

    ```bash
    openclaw models status --probe
    ```

    Wenn ein gespeichertes Profil in der expliziten Reihenfolge ausgelassen wird, meldet Probe
    `excluded_by_auth_order` für dieses Profil, statt es stillschweigend zu versuchen.

  </Accordion>

  <Accordion title="OAuth vs. API-Schlüssel – was ist der Unterschied?">
    OpenClaw unterstützt beides:

    - **OAuth** nutzt häufig Subscription-Zugriff (wo zutreffend).
    - **API-Schlüssel** verwenden Abrechnung nach Token.

    Der Assistent unterstützt explizit Anthropic Claude CLI, OpenAI Codex OAuth und API-Schlüssel.

  </Accordion>
</AccordionGroup>

## Verwandt

- [FAQ](/de/help/faq) — die Haupt-FAQ
- [FAQ — Schnellstart und Einrichtung beim ersten Start](/de/help/faq-first-run)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
