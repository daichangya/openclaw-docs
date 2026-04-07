---
read_when:
    - Diagnose von Auth-Profilrotation, Cooldowns oder Modell-Fallback-Verhalten
    - Aktualisierung von Failover-Regeln für Auth-Profile oder Modelle
    - Verstehen, wie Sitzungs-Modellüberschreibungen mit Fallback-Wiederholungen interagieren
summary: Wie OpenClaw Auth-Profile rotiert und zwischen Modellen zurückfällt
title: Modell-Failover
x-i18n:
    generated_at: "2026-04-07T06:14:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: d88821e229610f236bdab3f798d5e8c173f61a77c01017cc87431126bf465e32
    source_path: concepts/model-failover.md
    workflow: 15
---

# Modell-Failover

OpenClaw behandelt Fehler in zwei Stufen:

1. **Auth-Profilrotation** innerhalb des aktuellen Providers.
2. **Modell-Fallback** zum nächsten Modell in `agents.defaults.model.fallbacks`.

Dieses Dokument erklärt die Laufzeitregeln und die Daten, die ihnen zugrunde liegen.

## Laufzeitablauf

Für einen normalen Textlauf wertet OpenClaw Kandidaten in dieser Reihenfolge aus:

1. Das aktuell ausgewählte Sitzungsmodell.
2. Konfigurierte `agents.defaults.model.fallbacks` in Reihenfolge.
3. Das konfigurierte primäre Modell am Ende, wenn der Lauf mit einer Überschreibung begonnen hat.

Innerhalb jedes Kandidaten versucht OpenClaw zuerst ein Auth-Profil-Failover, bevor
zum nächsten Modellkandidaten weitergegangen wird.

Ablauf auf hoher Ebene:

1. Das aktive Sitzungsmodell und die Auth-Profil-Präferenz auflösen.
2. Die Modellkandidatenkette erstellen.
3. Den aktuellen Provider mit Auth-Profilrotation-/Cooldown-Regeln versuchen.
4. Wenn dieser Provider mit einem Failover-würdigen Fehler ausgeschöpft ist, zum nächsten
   Modellkandidaten wechseln.
5. Die ausgewählte Fallback-Überschreibung beibehalten, bevor die Wiederholung beginnt, damit andere
   Sitzungsleser denselben Provider/dasselbe Modell sehen, das der Runner gleich verwenden wird.
6. Wenn der Fallback-Kandidat fehlschlägt, nur die dem Fallback gehörenden Sitzungs-
   Überschreibungsfelder zurücksetzen, wenn sie noch diesem fehlgeschlagenen Kandidaten entsprechen.
7. Wenn jeder Kandidat fehlschlägt, einen `FallbackSummaryError` mit Details pro Versuch
   und dem frühesten Cooldown-Ablauf auslösen, sofern einer bekannt ist.

Dies ist absichtlich enger gefasst als „die gesamte Sitzung speichern und wiederherstellen“. Der
Antwort-Runner persistiert für den Fallback nur die Modell-Auswahlfelder, die ihm gehören:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dadurch wird verhindert, dass eine fehlgeschlagene Fallback-Wiederholung neuere, nicht zusammenhängende Sitzungs-
Mutationen überschreibt, wie manuelle `/model`-Änderungen oder Sitzungs-Rotationsupdates, die
während des Versuchs passiert sind.

## Auth-Speicherung (Schlüssel + OAuth)

OpenClaw verwendet **Auth-Profile** sowohl für API-Schlüssel als auch für OAuth-Tokens.

- Secrets liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (alt: `~/.openclaw/agent/auth-profiles.json`).
- Der Laufzeitstatus für Auth-Routing liegt in `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Config `auth.profiles` / `auth.order` sind **nur Metadaten + Routing** (keine Secrets).
- Alte OAuth-Datei nur für Import: `~/.openclaw/credentials/oauth.json` (wird bei erster Verwendung in `auth-profiles.json` importiert).

Mehr Details: [/concepts/oauth](/de/concepts/oauth)

Anmeldedatentypen:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` für einige Provider)

## Profil-IDs

OAuth-Anmeldungen erstellen unterschiedliche Profile, damit mehrere Konten koexistieren können.

- Standard: `provider:default`, wenn keine E-Mail verfügbar ist.
- OAuth mit E-Mail: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

Profile liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` unter `profiles`.

## Rotationsreihenfolge

Wenn ein Provider mehrere Profile hat, wählt OpenClaw die Reihenfolge so:

1. **Explizite Konfiguration**: `auth.order[provider]` (falls gesetzt).
2. **Konfigurierte Profile**: `auth.profiles`, nach Provider gefiltert.
3. **Gespeicherte Profile**: Einträge in `auth-profiles.json` für den Provider.

Wenn keine explizite Reihenfolge konfiguriert ist, verwendet OpenClaw eine Round-Robin-Reihenfolge:

- **Primärschlüssel:** Profiltyp (**OAuth vor API-Schlüsseln**).
- **Sekundärschlüssel:** `usageStats.lastUsed` (älteste zuerst, innerhalb jedes Typs).
- **Cooldown-/deaktivierte Profile** werden an das Ende verschoben, sortiert nach dem frühesten Ablauf.

### Sitzungs-Stickiness (cachefreundlich)

OpenClaw **pinnt das gewählte Auth-Profil pro Sitzung**, um Provider-Caches warm zu halten.
Es rotiert **nicht** bei jeder Anfrage. Das gepinnte Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Kompaktierung abgeschlossen ist (die Kompaktierungsanzahl erhöht sich)
- das Profil im Cooldown/deaktiviert ist

Die manuelle Auswahl über `/model …@<profileId>` setzt eine **Benutzerüberschreibung** für diese Sitzung
und wird nicht automatisch rotiert, bis eine neue Sitzung startet.

Automatisch gepinnte Profile (vom Sitzungsrouter ausgewählt) werden als **Präferenz** behandelt:
Sie werden zuerst versucht, aber OpenClaw kann bei Ratenlimits/Timeouts zu einem anderen Profil rotieren.
Vom Benutzer gepinnte Profile bleiben auf dieses Profil festgelegt; wenn es fehlschlägt und Modell-Fallbacks
konfiguriert sind, wechselt OpenClaw zum nächsten Modell, anstatt Profile zu wechseln.

### Warum OAuth „verloren wirken“ kann

Wenn Sie sowohl ein OAuth-Profil als auch ein API-Schlüsselprofil für denselben Provider haben, kann Round-Robin ohne Pinning zwischen ihnen über Nachrichten hinweg wechseln. Um ein einzelnes Profil zu erzwingen:

- Mit `auth.order[provider] = ["provider:profileId"]` pinnen, oder
- Eine Überschreibung pro Sitzung über `/model …` mit einer Profilüberschreibung verwenden (wenn von Ihrer UI-/Chat-Oberfläche unterstützt).

## Cooldowns

Wenn ein Profil aufgrund von Auth-/Ratenlimit-Fehlern fehlschlägt (oder eines Timeouts, das
wie ein Ratenlimit aussieht), markiert OpenClaw es als im Cooldown und wechselt zum nächsten Profil.
Dieser Ratenlimit-Bucket ist breiter als ein einfaches `429`: Er umfasst auch Provider-
Meldungen wie `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` und periodische Nutzungsfenster-Grenzen wie
`weekly/monthly limit reached`.
Format-/Ungültige-Anfrage-Fehler (zum Beispiel Cloud Code Assist-Tool-Call-ID-
Validierungsfehler) werden als Failover-würdig behandelt und verwenden dieselben Cooldowns.
OpenAI-kompatible Stop-Reason-Fehler wie `Unhandled stop reason: error`,
`stop reason: error` und `reason: error` werden als Timeout-/Failover-
Signale klassifiziert.
Providerbezogener generischer Servertext kann ebenfalls in diesem Timeout-Bucket landen, wenn
die Quelle einem bekannten transienten Muster entspricht. Zum Beispiel werden bei Anthropic
bloße `An unknown error occurred`-Meldungen und JSON-`api_error`-Payloads mit transientem Server-
Text wie `internal server error`, `unknown error, 520`, `upstream error`
oder `backend error` als Failover-würdige Timeouts behandelt. OpenRouter-spezifischer
generischer Upstream-Text wie ein bloßes `Provider returned error` wird ebenfalls nur dann als
Timeout behandelt, wenn der Provider-Kontext tatsächlich OpenRouter ist. Generischer interner
Fallback-Text wie `LLM request failed with an unknown error.` bleibt
konservativ und löst für sich genommen kein Failover aus.

Ratenlimit-Cooldowns können auch modellbezogen sein:

- OpenClaw zeichnet `cooldownModel` für Ratenlimit-Fehler auf, wenn die ID des fehlgeschlagenen
  Modells bekannt ist.
- Ein verwandtes Modell beim selben Provider kann trotzdem versucht werden, wenn der Cooldown
  auf ein anderes Modell begrenzt ist.
- Abrechnungs-/deaktivierte Zeitfenster blockieren weiterhin das gesamte Profil über Modelle hinweg.

Cooldowns verwenden exponentiellen Backoff:

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

## Durch Abrechnung bedingte Deaktivierungen

Abrechnungs-/Guthabenfehler (zum Beispiel „unzureichendes Guthaben“ / „Guthabenstand zu niedrig“) werden als Failover-würdig behandelt, sind aber normalerweise nicht transient. Statt eines kurzen Cooldowns markiert OpenClaw das Profil als **deaktiviert** (mit längerem Backoff) und rotiert zum nächsten Profil/Provider.

Nicht jede abrechnungsähnliche Antwort ist `402`, und nicht jedes HTTP-`402` landet
hier. OpenClaw hält expliziten Abrechnungstext im Abrechnungszweig, auch wenn ein
Provider stattdessen `401` oder `403` zurückgibt, aber providerspezifische Matcher bleiben
auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter `403 Key limit
exceeded`). Gleichzeitig werden temporäre `402`-Nutzungsfenster- und
Organisations-/Workspace-Ausgabenlimit-Fehler als `rate_limit` klassifiziert, wenn
die Meldung wiederholbar aussieht (zum Beispiel `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` oder `organization spending limit exceeded`).
Diese bleiben auf dem Pfad für kurzen Cooldown/Failover statt auf dem langen
Pfad für durch Abrechnung bedingte Deaktivierung.

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

Standardeinstellungen:

- Abrechnungs-Backoff beginnt bei **5 Stunden**, verdoppelt sich pro Abrechnungsfehler und ist bei **24 Stunden** gedeckelt.
- Backoff-Zähler werden zurückgesetzt, wenn das Profil **24 Stunden** lang nicht fehlgeschlagen ist (konfigurierbar).
- Wiederholungen bei Überlastung erlauben **1 Profilrotation beim selben Provider**, bevor ein Modell-Fallback erfolgt.
- Wiederholungen bei Überlastung verwenden standardmäßig **0 ms Backoff**.

## Modell-Fallback

Wenn alle Profile für einen Provider fehlschlagen, wechselt OpenClaw zum nächsten Modell in
`agents.defaults.model.fallbacks`. Dies gilt für Auth-Fehler, Ratenlimits und
Timeouts, bei denen die Profilrotation ausgeschöpft wurde (andere Fehler führen nicht zum nächsten Fallback).

Fehler durch Überlastung und Ratenlimits werden aggressiver behandelt als Cooldowns durch Abrechnung.
Standardmäßig erlaubt OpenClaw eine Wiederholung desselben Providers mit einem anderen Auth-Profil,
wechselt dann ohne Wartezeit zum nächsten konfigurierten Modell-Fallback.
Provider-Ausgelastet-Signale wie `ModelNotReadyException` fallen in diesen Überlastungs-Bucket.
Passen Sie dies mit `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` und
`auth.cooldowns.rateLimitedProfileRotations` an.

Wenn ein Lauf mit einer Modellüberschreibung beginnt (Hooks oder CLI), enden Fallbacks trotzdem bei
`agents.defaults.model.primary`, nachdem konfigurierte Fallbacks versucht wurden.

### Regeln für die Kandidatenkette

OpenClaw erstellt die Kandidatenliste aus dem aktuell angeforderten `provider/model`
plus konfigurierten Fallbacks.

Regeln:

- Das angeforderte Modell steht immer an erster Stelle.
- Explizit konfigurierte Fallbacks werden dedupliziert, aber nicht anhand der Modell-
  Allowlist gefiltert. Sie gelten als explizite Betreiberabsicht.
- Wenn der aktuelle Lauf bereits auf einem konfigurierten Fallback in derselben Provider-
  Familie läuft, verwendet OpenClaw weiterhin die vollständige konfigurierte Kette.
- Wenn der aktuelle Lauf auf einem anderen Provider als in der Konfiguration läuft und dieses aktuelle
  Modell nicht bereits Teil der konfigurierten Fallback-Kette ist, hängt OpenClaw keine
  nicht zusammenhängenden konfigurierten Fallbacks eines anderen Providers an.
- Wenn der Lauf mit einer Überschreibung begonnen hat, wird das konfigurierte primäre Modell am
  Ende angehängt, damit die Kette sich wieder auf dem normalen Standard einpendeln kann, sobald frühere
  Kandidaten ausgeschöpft sind.

### Welche Fehler zum nächsten Fallback führen

Der Modell-Fallback wird fortgesetzt bei:

- Auth-Fehlern
- Ratenlimits und Ausschöpfung von Cooldowns
- Überlastungs-/Provider-ausgelastet-Fehlern
- Timeout-förmigen Failover-Fehlern
- durch Abrechnung bedingten Deaktivierungen
- `LiveSessionModelSwitchError`, das in einen Failover-Pfad normalisiert wird, damit ein
  veraltetes persistiertes Modell keine äußere Wiederholungsschleife erzeugt
- anderen nicht erkannten Fehlern, wenn noch Kandidaten übrig sind

Der Modell-Fallback wird nicht fortgesetzt bei:

- expliziten Abbrüchen, die nicht Timeout-/Failover-förmig sind
- Kontextüberlauffehlern, die innerhalb der Kompaktierungs-/Wiederholungslogik bleiben sollten
  (zum Beispiel `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` oder `ollama error: context
length exceeded`)
- einem letzten unbekannten Fehler, wenn keine Kandidaten mehr übrig sind

### Cooldown-Überspringen vs. Probe-Verhalten

Wenn sich jedes Auth-Profil für einen Provider bereits im Cooldown befindet, überspringt OpenClaw
diesen Provider nicht automatisch für immer. Es trifft eine Entscheidung pro Kandidat:

- Persistente Auth-Fehler überspringen sofort den gesamten Provider.
- Durch Abrechnung bedingte Deaktivierungen führen normalerweise zum Überspringen, aber der primäre Kandidat kann dennoch
  gedrosselt geprüft werden, damit eine Wiederherstellung ohne Neustart möglich ist.
- Der primäre Kandidat kann kurz vor Ablauf des Cooldowns geprüft werden, mit einer providerbezogenen
  Drosselung.
- Fallback-Geschwister beim selben Provider können trotz Cooldown versucht werden, wenn der
  Fehler transient aussieht (`rate_limit`, `overloaded` oder unbekannt). Dies ist
  besonders relevant, wenn ein Ratenlimit modellbezogen ist und ein verwandtes Modell sich
  möglicherweise sofort wieder erholen kann.
- Transiente Cooldown-Probes sind auf eine pro Provider und Fallback-Lauf begrenzt, damit
  ein einzelner Provider nicht das providerübergreifende Fallback blockiert.

## Sitzungsüberschreibungen und Live-Modellwechsel

Sitzungs-Modelländerungen sind gemeinsam genutzter Zustand. Der aktive Runner, der `/model`-Befehl,
Kompaktierungs-/Sitzungsaktualisierungen und der Live-Sitzungs-Abgleich lesen oder schreiben
alle Teile desselben Sitzungseintrags.

Das bedeutet, dass Fallback-Wiederholungen sich mit Live-Modellwechseln koordinieren müssen:

- Nur explizite, vom Benutzer ausgelöste Modelländerungen markieren einen ausstehenden Live-Wechsel. Dazu
  gehören `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Rotation, Heartbeat-Überschreibungen
  oder Kompaktierung markieren niemals selbstständig einen ausstehenden Live-Wechsel.
- Bevor eine Fallback-Wiederholung beginnt, persistiert der Antwort-Runner die ausgewählten
  Fallback-Überschreibungsfelder im Sitzungseintrag.
- Der Live-Sitzungs-Abgleich bevorzugt persistierte Sitzungsüberschreibungen gegenüber veralteten
  Laufzeit-Modellfeldern.
- Wenn der Fallback-Versuch fehlschlägt, setzt der Runner nur die Überschreibungsfelder zurück,
  die er geschrieben hat, und nur wenn sie noch diesem fehlgeschlagenen Kandidaten entsprechen.

Dies verhindert das klassische Race:

1. Das primäre Modell schlägt fehl.
2. Ein Fallback-Kandidat wird im Speicher ausgewählt.
3. Der Sitzungsspeicher enthält noch das alte primäre Modell.
4. Der Live-Sitzungs-Abgleich liest den veralteten Sitzungszustand.
5. Die Wiederholung wird zurück auf das alte Modell geschnappt, bevor der Fallback-Versuch
   beginnt.

Die persistierte Fallback-Überschreibung schließt dieses Fenster, und das enge Zurücksetzen
hält neuere manuelle oder laufzeitbedingte Sitzungsänderungen intakt.

## Beobachtbarkeit und Fehlerzusammenfassungen

`runWithModelFallback(...)` zeichnet Details pro Versuch auf, die Logs und
benutzerseitige Cooldown-Meldungen speisen:

- versuchter Provider/versuchtes Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und
  ähnliche Failover-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Wenn jeder Kandidat fehlschlägt, löst OpenClaw `FallbackSummaryError` aus. Der äußere
Antwort-Runner kann dies verwenden, um eine spezifischere Nachricht zu erstellen, etwa „alle Modelle
sind vorübergehend ratenlimitiert“, und den frühesten Cooldown-Ablauf einschließen, wenn einer
bekannt ist.

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

Siehe [Models](/de/concepts/models) für den umfassenderen Überblick über Modellauswahl und Fallback.
