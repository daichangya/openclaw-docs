---
read_when:
    - Diagnose von Rotation von Authentifizierungsprofilen, Cooldowns oder Modell-Fallback-Verhalten
    - Aktualisieren von Failover-Regeln für Authentifizierungsprofile oder Modelle
    - Verstehen, wie Sitzungsmodell-Overrides mit Fallback-Wiederholungen interagieren
summary: Wie OpenClaw Authentifizierungsprofile rotiert und modellübergreifend auf Fallbacks zurückgreift
title: Modell-Failover
x-i18n:
    generated_at: "2026-04-24T06:34:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8921c9edd4699d8c623229cd3c82a92768d720fa9711862c270d6edb665841af
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw verarbeitet Fehler in zwei Stufen:

1. **Rotation von Authentifizierungsprofilen** innerhalb des aktuellen Providers.
2. **Modell-Fallback** auf das nächste Modell in `agents.defaults.model.fallbacks`.

Dieses Dokument erklärt die Laufzeitregeln und die Daten, die ihnen zugrunde liegen.

## Laufzeitablauf

Für einen normalen Textlauf bewertet OpenClaw Kandidaten in dieser Reihenfolge:

1. Das aktuell ausgewählte Sitzungsmodell.
2. Konfigurierte `agents.defaults.model.fallbacks` in Reihenfolge.
3. Das konfigurierte Primärmodell am Ende, wenn der Lauf von einem Override aus gestartet wurde.

Innerhalb jedes Kandidaten versucht OpenClaw zunächst Authentifizierungsprofil-Failover, bevor
zum nächsten Modellkandidaten übergegangen wird.

Sequenz auf hoher Ebene:

1. Aktives Sitzungsmodell und Präferenz für Authentifizierungsprofile auflösen.
2. Die Kette der Modellkandidaten aufbauen.
3. Den aktuellen Provider mit den Regeln für Rotation/Cooldown von Authentifizierungsprofilen versuchen.
4. Wenn dieser Provider mit einem für Failover geeigneten Fehler erschöpft ist, zum nächsten
   Modellkandidaten wechseln.
5. Das ausgewählte Fallback-Override persistieren, bevor der Retry beginnt, damit andere
   Sitzungsleser denselben Provider/dasselbe Modell sehen, das der Runner gleich verwenden wird.
6. Wenn der Fallback-Kandidat fehlschlägt, nur die dem Fallback gehörenden Sitzungs-Override-Felder zurückrollen,
   wenn sie weiterhin zu diesem fehlgeschlagenen Kandidaten passen.
7. Wenn jeder Kandidat fehlschlägt, einen `FallbackSummaryError` mit Details pro Versuch
   und dem frühesten Cooldown-Ablauf auslösen, sofern dieser bekannt ist.

Dies ist absichtlich enger gefasst als „die ganze Sitzung speichern und wiederherstellen“. Der
Reply-Runner persistiert für Fallback nur die ihm gehörenden Felder zur Modellauswahl:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dadurch wird verhindert, dass ein fehlgeschlagener Fallback-Retry neuere, nicht zusammenhängende
Sitzungsmutationen überschreibt, etwa manuelle `/model`-Änderungen oder Aktualisierungen der
Sitzungsrotation, die während des Versuchs stattgefunden haben.

## Auth-Speicherung (Schlüssel + OAuth)

OpenClaw verwendet **Authentifizierungsprofile** sowohl für API-Schlüssel als auch für OAuth-Tokens.

- Secrets liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Legacy: `~/.openclaw/agent/auth-profiles.json`).
- Der Laufzeitstatus für Auth-Routing liegt in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfiguration `auth.profiles` / `auth.order` ist **nur für Metadaten + Routing** gedacht (keine Secrets).
- Legacy-Datei nur für OAuth-Import: `~/.openclaw/credentials/oauth.json` (wird bei erster Verwendung in `auth-profiles.json` importiert).

Mehr Details: [/concepts/oauth](/de/concepts/oauth)

Typen von Anmeldedaten:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` für einige Provider)

## Profil-IDs

OAuth-Anmeldungen erstellen unterschiedliche Profile, damit mehrere Konten koexistieren können.

- Standard: `provider:default`, wenn keine E-Mail verfügbar ist.
- OAuth mit E-Mail: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

Profile liegen unter `profiles` in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

## Rotationsreihenfolge

Wenn ein Provider mehrere Profile hat, wählt OpenClaw eine Reihenfolge wie folgt:

1. **Explizite Konfiguration**: `auth.order[provider]` (falls gesetzt).
2. **Konfigurierte Profile**: `auth.profiles`, nach Provider gefiltert.
3. **Gespeicherte Profile**: Einträge in `auth-profiles.json` für den Provider.

Wenn keine explizite Reihenfolge konfiguriert ist, verwendet OpenClaw eine Round-Robin-Reihenfolge:

- **Primärschlüssel:** Profiltyp (**OAuth vor API-Schlüsseln**).
- **Sekundärschlüssel:** `usageStats.lastUsed` (ältestes zuerst, innerhalb jedes Typs).
- **Cooldown-/deaktivierte Profile** werden ans Ende verschoben, sortiert nach dem frühesten Ablauf.

### Sitzungs-Stickiness (cache-freundlich)

OpenClaw **pinnt das gewählte Authentifizierungsprofil pro Sitzung**, um Provider-Caches warm zu halten.
Es rotiert **nicht** bei jeder Anfrage. Das gepinnte Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Compaction abgeschlossen ist (Compaction-Zähler wird erhöht)
- das Profil im Cooldown/deaktiviert ist

Die manuelle Auswahl über `/model …@<profileId>` setzt ein **Benutzer-Override** für diese Sitzung
und wird nicht automatisch rotiert, bis eine neue Sitzung beginnt.

Automatisch gepinnte Profile (vom Sitzungsrouter ausgewählt) werden als **Präferenz** behandelt:
Sie werden zuerst versucht, aber OpenClaw kann bei Ratenlimits/Timeouts zu einem anderen Profil rotieren.
Vom Benutzer gepinnte Profile bleiben auf dieses Profil festgelegt; wenn es fehlschlägt und Modell-Fallbacks
konfiguriert sind, wechselt OpenClaw zum nächsten Modell, statt Profile zu wechseln.

### Warum OAuth „verloren wirken“ kann

Wenn Sie sowohl ein OAuth-Profil als auch ein API-Schlüssel-Profil für denselben Provider haben, kann Round-Robin zwischen ihnen über Nachrichten hinweg wechseln, sofern sie nicht gepinnt sind. Um ein einzelnes Profil zu erzwingen:

- Pinnen mit `auth.order[provider] = ["provider:profileId"]`, oder
- Verwenden Sie ein Override pro Sitzung über `/model …` mit einem Profil-Override (sofern Ihre UI/Chat-Oberfläche das unterstützt).

## Cooldowns

Wenn ein Profil aufgrund von Auth-/Ratenlimitfehlern fehlschlägt (oder eines Timeouts, das
wie ein Ratenlimit aussieht), markiert OpenClaw es als im Cooldown und wechselt zum nächsten Profil.
Dieser Ratenlimit-Bucket ist breiter als nur `429`: Er umfasst auch Provider-
Nachrichten wie `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` und periodische Nutzungslimits wie
`weekly/monthly limit reached`.
Format-/Invalid-Request-Fehler (zum Beispiel Validierungsfehler für Tool-Call-IDs in
Cloud Code Assist) gelten als für Failover geeignet und verwenden dieselben Cooldowns.
OpenAI-kompatible Stop-Reason-Fehler wie `Unhandled stop reason: error`,
`stop reason: error` und `reason: error` werden als Timeout-/Failover-
Signale klassifiziert.
Providerspezifischer generischer Servertext kann ebenfalls in diesem Timeout-Bucket landen, wenn
die Quelle einem bekannten transienten Muster entspricht. Zum Beispiel werden bei Anthropic bloßes
`An unknown error occurred` und JSON-`api_error`-Payloads mit transientem Servertext
wie `internal server error`, `unknown error, 520`, `upstream error`
oder `backend error` als für Failover geeignete Timeouts behandelt. OpenRouter-spezifischer
generischer Upstream-Text wie bloßes `Provider returned error` wird ebenfalls als
Timeout behandelt, aber nur, wenn der Provider-Kontext tatsächlich OpenRouter ist. Generischer interner
Fallback-Text wie `LLM request failed with an unknown error.` bleibt
konservativ und löst für sich genommen kein Failover aus.

Einige Provider-SDKs könnten sonst für ein langes `Retry-After`-Fenster schlafen, bevor
sie die Kontrolle an OpenClaw zurückgeben. Für Stainless-basierte SDKs wie Anthropic und
OpenAI begrenzt OpenClaw SDK-interne `retry-after-ms` / `retry-after`-Wartezeiten standardmäßig auf 60
Sekunden und macht längere erneut versuchbare Antworten sofort sichtbar, damit dieser
Failover-Pfad ausgeführt werden kann. Passen Sie die Begrenzung an oder deaktivieren Sie sie mit
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; siehe [/concepts/retry](/de/concepts/retry).

Ratenlimit-Cooldowns können auch modellbezogen sein:

- OpenClaw zeichnet `cooldownModel` für Ratenlimitfehler auf, wenn die fehlgeschlagene
  Modell-ID bekannt ist.
- Ein Geschwistermodell beim selben Provider kann weiterhin versucht werden, wenn der Cooldown
  auf ein anderes Modell beschränkt ist.
- Billing-/Deaktivierungsfenster blockieren weiterhin das gesamte Profil über Modelle hinweg.

Cooldowns verwenden exponentielles Backoff:

- 1 Minute
- 5 Minuten
- 25 Minuten
- 1 Stunde (Obergrenze)

Der Status wird in `auth-state.json` unter `usageStats` gespeichert:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Deaktivierungen wegen Abrechnung

Fehler bei Abrechnung/Guthaben (zum Beispiel „insufficient credits“ / „credit balance too low“) gelten als für Failover geeignet, sind aber normalerweise nicht transient. Statt eines kurzen Cooldowns markiert OpenClaw das Profil als **deaktiviert** (mit längerem Backoff) und rotiert zum nächsten Profil/Provider.

Nicht jede nach Abrechnung aussehende Antwort ist `402`, und nicht jeder HTTP-`402` landet
hier. OpenClaw hält expliziten Billing-Text im Billing-Pfad, selbst wenn ein
Provider stattdessen `401` oder `403` zurückgibt, aber providerspezifische Matcher bleiben auf
den Provider begrenzt, dem sie gehören (zum Beispiel OpenRouter `403 Key limit
exceeded`). Vorübergehende `402`-Nutzungsfenster- und
Ausgabenlimitfehler von Organisationen/Workspaces werden dagegen als `rate_limit` klassifiziert, wenn
die Nachricht retrybar aussieht (zum Beispiel `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` oder `organization spending limit exceeded`).
Diese bleiben auf dem kurzen Cooldown-/Failover-Pfad statt auf dem langen
Billing-Deaktivierungspfad.

Der Status wird in `auth-state.json` gespeichert:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Standards:

- Das Billing-Backoff beginnt bei **5 Stunden**, verdoppelt sich pro Billing-Fehler und ist bei **24 Stunden** gedeckelt.
- Backoff-Zähler werden zurückgesetzt, wenn das Profil **24 Stunden** lang nicht fehlgeschlagen ist (konfigurierbar).
- Überlastete Retries erlauben **1 Rotation desselben Provider-Profils**, bevor zum Modell-Fallback gewechselt wird.
- Überlastete Retries verwenden standardmäßig **0 ms Backoff**.

## Modell-Fallback

Wenn alle Profile für einen Provider fehlschlagen, wechselt OpenClaw zum nächsten Modell in
`agents.defaults.model.fallbacks`. Dies gilt für Auth-Fehler, Ratenlimits und
Timeouts, die die Profilrotation erschöpft haben (andere Fehler führen nicht zum nächsten Fallback).

Überlastete und Ratenlimitfehler werden aggressiver behandelt als Billing-
Cooldowns. Standardmäßig erlaubt OpenClaw einen erneuten Versuch mit einem Authentifizierungsprofil desselben Providers
und wechselt dann ohne Warten zum nächsten konfigurierten Modell-Fallback.
Provider-Busy-Signale wie `ModelNotReadyException` landen in diesem Überlastungs-Bucket.
Passen Sie dies mit `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` und
`auth.cooldowns.rateLimitedProfileRotations` an.

Wenn ein Lauf mit einem Modell-Override beginnt (Hooks oder CLI), enden Fallbacks dennoch bei
`agents.defaults.model.primary`, nachdem alle konfigurierten Fallbacks versucht wurden.

### Regeln für Kandidatenketten

OpenClaw baut die Kandidatenliste aus dem aktuell angeforderten `provider/model`
plus konfigurierten Fallbacks auf.

Regeln:

- Das angeforderte Modell steht immer an erster Stelle.
- Explizit konfigurierte Fallbacks werden dedupliziert, aber nicht durch die Modell-
  Allowlist gefiltert. Sie gelten als explizite Operator-Absicht.
- Wenn der aktuelle Lauf bereits auf einem konfigurierten Fallback in derselben Provider-
  Familie läuft, verwendet OpenClaw weiterhin die vollständige konfigurierte Kette.
- Wenn der aktuelle Lauf auf einem anderen Provider als in der Konfiguration läuft und dieses aktuelle
  Modell nicht bereits Teil der konfigurierten Fallback-Kette ist, hängt OpenClaw keine
  nicht zusammenhängenden konfigurierten Fallbacks eines anderen Providers an.
- Wenn der Lauf von einem Override aus gestartet wurde, wird das konfigurierte Primärmodell am
  Ende angehängt, damit sich die Kette nach Ausschöpfung früherer Kandidaten wieder auf den normalen
  Standard einpendeln kann.

### Welche Fehler den Fallback fortsetzen

Der Modell-Fallback wird fortgesetzt bei:

- Auth-Fehlern
- Ratenlimits und Ausschöpfung des Cooldowns
- Überlastungs-/Provider-busy-Fehlern
- Timeout-artigen Failover-Fehlern
- Deaktivierungen wegen Abrechnung
- `LiveSessionModelSwitchError`, das in einen Failover-Pfad normalisiert wird, damit ein
  veraltetes persistiertes Modell keine äußere Retry-Schleife erzeugt
- anderen nicht erkannten Fehlern, wenn noch weitere Kandidaten übrig sind

Der Modell-Fallback wird nicht fortgesetzt bei:

- expliziten Abbrüchen, die nicht timeout-/failoverartig sind
- Kontextüberlauffehlern, die innerhalb der Compaction-/Retry-Logik bleiben sollten
  (zum Beispiel `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` oder `ollama error: context
length exceeded`)
- einem letzten unbekannten Fehler, wenn keine Kandidaten mehr übrig sind

### Verhalten bei Cooldown-Skip vs. Probe

Wenn jedes Authentifizierungsprofil für einen Provider bereits im Cooldown ist, überspringt OpenClaw diesen
Provider nicht einfach für immer automatisch. Es trifft stattdessen eine Entscheidung pro Kandidat:

- Persistente Authentifizierungsfehler überspringen den gesamten Provider sofort.
- Deaktivierungen wegen Abrechnung werden normalerweise übersprungen, aber der primäre Kandidat kann gedrosselt dennoch geprüft werden, damit eine Wiederherstellung ohne Neustart möglich ist.
- Der primäre Kandidat kann nahe dem Cooldown-Ablauf geprüft werden, mit einer Drosselung pro Provider.
- Fallback-Geschwister desselben Providers können trotz Cooldown versucht werden, wenn der Fehler transient wirkt (`rate_limit`, `overloaded` oder unbekannt). Das ist besonders relevant, wenn ein Ratenlimit auf ein Modell beschränkt ist und sich ein Geschwistermodell möglicherweise sofort wieder erholen kann.
- Probes bei transientem Cooldown sind auf eine pro Provider und Fallback-Lauf begrenzt, damit ein einzelner Provider den providerübergreifenden Fallback nicht blockiert.

## Sitzungs-Overrides und Live-Modellwechsel

Änderungen des Sitzungsmodells sind gemeinsam genutzter Zustand. Der aktive Runner, der Befehl `/model`,
Compaction-/Sitzungsaktualisierungen und Live-Session-Reconciliation lesen oder schreiben jeweils Teile desselben Sitzungseintrags.

Das bedeutet, dass Fallback-Retries mit Live-Modellwechseln koordiniert werden müssen:

- Nur explizite, vom Benutzer ausgelöste Modelländerungen markieren einen ausstehenden Live-Wechsel. Dazu gehören `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Rotation, Heartbeat-Overrides
  oder Compaction markieren nicht von sich aus einen ausstehenden Live-Wechsel.
- Bevor ein Fallback-Retry beginnt, persistiert der Reply-Runner die ausgewählten
  Fallback-Override-Felder im Sitzungseintrag.
- Live-Session-Reconciliation bevorzugt persistierte Sitzungs-Overrides gegenüber veralteten
  Laufzeitmodellfeldern.
- Wenn der Fallback-Versuch fehlschlägt, rollt der Runner nur die Override-Felder zurück,
  die er geschrieben hat, und auch nur dann, wenn sie weiterhin zu diesem fehlgeschlagenen Kandidaten passen.

Das verhindert die klassische Race Condition:

1. Das Primärmodell schlägt fehl.
2. Der Fallback-Kandidat wird im Speicher gewählt.
3. Im Sitzungs-Store steht noch das alte Primärmodell.
4. Live-Session-Reconciliation liest den veralteten Sitzungszustand.
5. Der Retry wird auf das alte Modell zurückgesetzt, bevor der Fallback-Versuch
   beginnt.

Das persistierte Fallback-Override schließt dieses Zeitfenster, und das enge Rollback
lässt neuere manuelle oder Laufzeitänderungen der Sitzung intakt.

## Beobachtbarkeit und Fehlerzusammenfassungen

`runWithModelFallback(...)` zeichnet Details pro Versuch auf, die in Logs und
benutzerseitige Cooldown-Meldungen einfließen:

- versuchter Provider/versuchtes Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und
  ähnliche Failover-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Wenn jeder Kandidat fehlschlägt, löst OpenClaw `FallbackSummaryError` aus. Der äußere
Reply-Runner kann dies verwenden, um eine spezifischere Meldung zu erzeugen, etwa „alle Modelle
sind vorübergehend ratenlimitiert“, und den frühesten Cooldown-Ablauf einzuschließen, sofern bekannt.

Diese Cooldown-Zusammenfassung ist modellbewusst:

- nicht zusammenhängende modellbezogene Ratenlimits werden für die versuchte
  Provider-/Modellkette ignoriert
- wenn die verbleibende Blockade ein passendes modellbezogenes Ratenlimit ist, meldet OpenClaw
  den letzten passenden Ablaufzeitpunkt, der dieses Modell noch blockiert

## Zugehörige Konfiguration

Siehe [Gateway-Konfiguration](/de/gateway/configuration) für:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel`-Routing

Siehe [Modelle](/de/concepts/models) für den umfassenderen Überblick über Modellauswahl und Fallback.
