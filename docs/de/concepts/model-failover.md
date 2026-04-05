---
read_when:
    - Beim Diagnostizieren von Auth-Profilrotation, Cooldowns oder Modell-Fallback-Verhalten
    - Beim Aktualisieren von Failover-Regeln für Auth-Profile oder Modelle
    - Beim Verstehen, wie Sitzungs-Modellüberschreibungen mit Fallback-Retries interagieren
summary: Wie OpenClaw Auth-Profile rotiert und modellübergreifend Fallbacks verwendet
title: Modell-Failover
x-i18n:
    generated_at: "2026-04-05T12:40:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 899041aa0854e4f347343797649fd11140a01e069e88b1fbc0a76e6b375f6c96
    source_path: concepts/model-failover.md
    workflow: 15
---

# Modell-Failover

OpenClaw behandelt Fehler in zwei Stufen:

1. **Auth-Profilrotation** innerhalb des aktuellen Providers.
2. **Modell-Fallback** auf das nächste Modell in `agents.defaults.model.fallbacks`.

Dieses Dokument erklärt die Laufzeitregeln und die zugrunde liegenden Daten.

## Laufzeitablauf

Für einen normalen Textlauf wertet OpenClaw Kandidaten in dieser Reihenfolge aus:

1. Das aktuell ausgewählte Sitzungsmodell.
2. Konfigurierte `agents.defaults.model.fallbacks` in Reihenfolge.
3. Das konfigurierte primäre Modell am Ende, wenn der Lauf von einer Überschreibung gestartet wurde.

Innerhalb jedes Kandidaten versucht OpenClaw zuerst Auth-Profil-Failover, bevor es
zum nächsten Modellkandidaten übergeht.

Sequenz auf hoher Ebene:

1. Aktives Sitzungsmodell und Auth-Profil-Präferenz auflösen.
2. Die Modell-Kandidatenkette erstellen.
3. Den aktuellen Provider mit Auth-Profilrotation-/Cooldown-Regeln versuchen.
4. Wenn dieser Provider mit einem failover-würdigen Fehler ausgeschöpft ist, zum nächsten
   Modellkandidaten wechseln.
5. Die ausgewählte Fallback-Überschreibung speichern, bevor der Retry startet, damit andere
   Sitzungsleser denselben Provider/dasselbe Modell sehen, den bzw. das der Runner gleich verwenden wird.
6. Wenn der Fallback-Kandidat fehlschlägt, nur die sitzungseigenen Override-Felder des Fallbacks zurücksetzen,
   sofern sie noch mit diesem fehlgeschlagenen Kandidaten übereinstimmen.
7. Wenn jeder Kandidat fehlschlägt, einen `FallbackSummaryError` mit Details pro Versuch
   und dem frühesten Cooldown-Ablauf werfen, sofern einer bekannt ist.

Dies ist absichtlich enger gefasst als „die gesamte Sitzung speichern und wiederherstellen“. Der
Reply-Runner speichert nur die Felder der Modellauswahl, die er selbst für Fallback besitzt:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Dadurch wird verhindert, dass ein fehlgeschlagener Fallback-Retry neuere, nicht zusammenhängende Sitzungs-
Mutationen überschreibt, etwa manuelle `/model`-Änderungen oder Sitzungsrotations-Updates, die
während des Versuchs erfolgt sind.

## Auth-Speicher (Schlüssel + OAuth)

OpenClaw verwendet **Auth-Profile** sowohl für API-Schlüssel als auch für OAuth-Token.

- Secrets liegen in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Legacy: `~/.openclaw/agent/auth-profiles.json`).
- Konfiguration `auth.profiles` / `auth.order` ist **nur Metadaten + Routing** (keine Secrets).
- Legacy-Datei nur für OAuth-Importe: `~/.openclaw/credentials/oauth.json` (wird bei erster Verwendung in `auth-profiles.json` importiert).

Mehr Details: [/concepts/oauth](/concepts/oauth)

Typen von Anmeldeinformationen:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` für einige Provider)

## Profil-IDs

OAuth-Logins erstellen eigene Profile, damit mehrere Accounts nebeneinander existieren können.

- Standard: `provider:default`, wenn keine E-Mail verfügbar ist.
- OAuth mit E-Mail: `provider:<email>` (zum Beispiel `google-antigravity:user@gmail.com`).

Profile befinden sich in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` unter `profiles`.

## Rotationsreihenfolge

Wenn ein Provider mehrere Profile hat, wählt OpenClaw eine Reihenfolge wie folgt:

1. **Explizite Konfiguration**: `auth.order[provider]` (falls gesetzt).
2. **Konfigurierte Profile**: `auth.profiles`, nach Provider gefiltert.
3. **Gespeicherte Profile**: Einträge in `auth-profiles.json` für den Provider.

Wenn keine explizite Reihenfolge konfiguriert ist, verwendet OpenClaw eine Round-Robin-Reihenfolge:

- **Primärschlüssel:** Profiltyp (**OAuth vor API-Schlüsseln**).
- **Sekundärschlüssel:** `usageStats.lastUsed` (älteste zuerst, innerhalb jedes Typs).
- **Cooldown-/deaktivierte Profile** werden ans Ende verschoben und nach dem frühesten Ablauf sortiert.

### Sitzungs-Stickiness (cache-freundlich)

OpenClaw **pinnt das gewählte Auth-Profil pro Sitzung**, um Provider-Caches warm zu halten.
Es rotiert **nicht** bei jeder Anfrage. Das gepinnte Profil wird wiederverwendet, bis:

- die Sitzung zurückgesetzt wird (`/new` / `/reset`)
- eine Kompaktierung abgeschlossen ist (der Kompaktierungszähler erhöht sich)
- das Profil im Cooldown/deaktiviert ist

Eine manuelle Auswahl über `/model …@<profileId>` setzt eine **Benutzerüberschreibung** für diese Sitzung
und wird nicht automatisch rotiert, bis eine neue Sitzung startet.

Automatisch gepinnte Profile (durch den Sitzungsrouter ausgewählt) werden als **Präferenz** behandelt:
Sie werden zuerst versucht, aber OpenClaw kann bei Rate Limits/Timeouts zu einem anderen Profil rotieren.
Vom Benutzer gepinnte Profile bleiben an dieses Profil gebunden; wenn es fehlschlägt und Modell-Fallbacks
konfiguriert sind, wechselt OpenClaw zum nächsten Modell, statt Profile zu wechseln.

### Warum OAuth „verloren“ aussehen kann

Wenn Sie sowohl ein OAuth-Profil als auch ein API-Schlüssel-Profil für denselben Provider haben, kann Round-Robin zwischen ihnen über Nachrichten hinweg wechseln, sofern nichts gepinnt ist. Um ein einzelnes Profil zu erzwingen:

- Mit `auth.order[provider] = ["provider:profileId"]` pinnen, oder
- Eine Überschreibung pro Sitzung per `/model …` mit einer Profilüberschreibung verwenden (falls von Ihrer UI/Chat-Oberfläche unterstützt).

## Cooldowns

Wenn ein Profil aufgrund von Auth-/Rate-Limit-Fehlern fehlschlägt (oder eines Timeouts, das
wie Rate Limiting aussieht), markiert OpenClaw es als im Cooldown und wechselt zum nächsten Profil.
Dieser Rate-Limit-Bucket ist breiter als nur `429`: Er umfasst auch Provider-
Meldungen wie `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` und periodische Limits für Nutzungsfenster wie
`weekly/monthly limit reached`.
Format-/Invalid-Request-Fehler (zum Beispiel Cloud Code Assist Tool-Call-ID-
Validierungsfehler) werden als failover-würdig behandelt und verwenden dieselben Cooldowns.
OpenAI-kompatible Stop-Reason-Fehler wie `Unhandled stop reason: error`,
`stop reason: error` und `reason: error` werden als Timeout-/Failover-
Signale klassifiziert.
Allgemeiner serverseitiger Text mit Provider-Scope kann ebenfalls in diesen Timeout-Bucket fallen, wenn
die Quelle einem bekannten transienten Muster entspricht. Zum Beispiel werden bei Anthropic
ein schlichtes `An unknown error occurred` und JSON-`api_error`-Payloads mit transientem Server-
Text wie `internal server error`, `unknown error, 520`, `upstream error`
oder `backend error` als failover-würdige Timeouts behandelt. OpenRouter-spezifischer
allgemeiner Upstream-Text wie ein schlichtes `Provider returned error` wird ebenfalls nur dann als
Timeout behandelt, wenn der Provider-Kontext tatsächlich OpenRouter ist. Allgemeiner interner Fallback-
Text wie `LLM request failed with an unknown error.` bleibt konservativ und löst
allein kein Failover aus.

Rate-Limit-Cooldowns können außerdem modellbezogen sein:

- OpenClaw zeichnet `cooldownModel` für Rate-Limit-Fehler auf, wenn die fehlschlagende
  Modell-ID bekannt ist.
- Ein Schwester-Modell desselben Providers kann weiterhin versucht werden, wenn der Cooldown
  auf ein anderes Modell begrenzt ist.
- Billing-/Deaktivierungsfenster blockieren das gesamte Profil weiterhin modellübergreifend.

Cooldowns verwenden exponentielles Backoff:

- 1 Minute
- 5 Minuten
- 25 Minuten
- 1 Stunde (Obergrenze)

Der Status wird in `auth-profiles.json` unter `usageStats` gespeichert:

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

## Billing-Deaktivierungen

Billing-/Guthabenfehler (zum Beispiel „insufficient credits“ / „credit balance too low“) werden als failover-würdig behandelt, sind aber normalerweise nicht transient. Statt eines kurzen Cooldowns markiert OpenClaw das Profil als **deaktiviert** (mit längerem Backoff) und rotiert zum nächsten Profil/Provider.

Nicht jede Billing-ähnliche Antwort ist `402`, und nicht jede HTTP-`402` landet
hier. OpenClaw behält expliziten Billing-Text auch dann in der Billing-Schiene, wenn ein
Provider stattdessen `401` oder `403` zurückgibt, aber providerspezifische Matcher bleiben
auf den Provider begrenzt, zu dem sie gehören (zum Beispiel OpenRouter `403 Key limit
exceeded`). Gleichzeitig werden temporäre `402`-Nutzungsfenster- und
Spending-Limit-Fehler für Organization/Workspace als `rate_limit` klassifiziert, wenn
die Nachricht retrybar aussieht (zum Beispiel `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` oder `organization spending limit exceeded`).
Diese bleiben auf dem Pfad für kurze Cooldowns/Failover statt auf dem langen
Pfad für Billing-Deaktivierung.

Der Status wird in `auth-profiles.json` gespeichert:

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

- Billing-Backoff beginnt bei **5 Stunden**, verdoppelt sich pro Billing-Fehler und ist auf **24 Stunden** begrenzt.
- Backoff-Zähler werden zurückgesetzt, wenn das Profil **24 Stunden** lang nicht fehlgeschlagen ist (konfigurierbar).
- Überlastete Retries erlauben **1 Rotation desselben Provider-Profils**, bevor auf Modell-Fallback umgeschaltet wird.
- Überlastete Retries verwenden standardmäßig **0 ms Backoff**.

## Modell-Fallback

Wenn alle Profile für einen Provider fehlschlagen, wechselt OpenClaw zum nächsten Modell in
`agents.defaults.model.fallbacks`. Dies gilt für Auth-Fehler, Rate Limits und
Timeouts, bei denen die Profilrotation ausgeschöpft ist (andere Fehler führen nicht zu weiterem Fallback).

Überlastete und Rate-Limit-Fehler werden aggressiver behandelt als Billing-
Cooldowns. Standardmäßig erlaubt OpenClaw einen Auth-Profil-Retry mit demselben Provider
und wechselt dann ohne Warten zum nächsten konfigurierten Modell-Fallback.
Provider-Busy-Signale wie `ModelNotReadyException` fallen in diesen Überlastungs-Bucket.
Passen Sie dies mit `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` und
`auth.cooldowns.rateLimitedProfileRotations` an.

Wenn ein Lauf mit einer Modellüberschreibung startet (Hooks oder CLI), enden Fallbacks nach
dem Versuch aller konfigurierten Fallbacks trotzdem bei `agents.defaults.model.primary`.

### Regeln für Kandidatenketten

OpenClaw erstellt die Kandidatenliste aus dem aktuell angeforderten `provider/model`
plus konfigurierten Fallbacks.

Regeln:

- Das angeforderte Modell ist immer zuerst.
- Explizit konfigurierte Fallbacks werden dedupliziert, aber nicht durch die Modell-
  Allowlist gefiltert. Sie gelten als explizite Operator-Absicht.
- Wenn der aktuelle Lauf bereits auf einem konfigurierten Fallback derselben Provider-
  Familie läuft, verwendet OpenClaw weiterhin die vollständige konfigurierte Kette.
- Wenn der aktuelle Lauf auf einem anderen Provider als in der Konfiguration läuft und dieses aktuelle
  Modell noch nicht Teil der konfigurierten Fallback-Kette ist, hängt OpenClaw keine
  nicht zusammenhängenden konfigurierten Fallbacks eines anderen Providers an.
- Wenn der Lauf von einer Überschreibung gestartet wurde, wird das konfigurierte primäre Modell am
  Ende angehängt, damit sich die Kette wieder auf den normalen Standard einpendeln kann, sobald frühere
  Kandidaten ausgeschöpft sind.

### Welche Fehler Fallback voranbringen

Modell-Fallback setzt fort bei:

- Auth-Fehlern
- Rate Limits und erschöpftem Cooldown
- überlasteten/Provider-busy-Fehlern
- timeoutförmigen Failover-Fehlern
- Billing-Deaktivierungen
- `LiveSessionModelSwitchError`, das in einen Failover-Pfad normalisiert wird, damit ein
  veraltetes persistiertes Modell keine äußere Retry-Schleife erzeugt
- anderen nicht erkannten Fehlern, wenn noch Kandidaten übrig sind

Modell-Fallback setzt nicht fort bei:

- expliziten Abbrüchen, die nicht timeout-/failover-förmig sind
- Kontextüberlauf-Fehlern, die innerhalb der Kompaktierungs-/Retry-Logik bleiben sollen
  (zum Beispiel `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` oder `ollama error: context
length exceeded`)
- einem letzten unbekannten Fehler, wenn keine Kandidaten mehr übrig sind

### Cooldown-Skip vs. Probe-Verhalten

Wenn sich bereits alle Auth-Profile für einen Provider im Cooldown befinden, überspringt OpenClaw
diesen Provider nicht automatisch für immer. Es trifft eine Entscheidung pro Kandidat:

- Persistente Auth-Fehler überspringen sofort den gesamten Provider.
- Billing-Deaktivierungen führen normalerweise zum Überspringen, aber der primäre Kandidat kann weiterhin
  gedrosselt geprobt werden, damit eine Wiederherstellung ohne Neustart möglich ist.
- Der primäre Kandidat kann nahe am Cooldown-Ablauf geprobt werden, mit einer Drossel pro Provider.
- Schwester-Fallbacks desselben Providers können trotz Cooldown versucht werden, wenn der
  Fehler transient aussieht (`rate_limit`, `overloaded` oder unbekannt). Das ist
  besonders relevant, wenn ein Rate Limit auf ein Modell begrenzt ist und ein Schwester-Modell sich
  möglicherweise sofort wieder erholt.
- Transiente Cooldown-Probes sind auf eine pro Provider und Fallback-Lauf begrenzt, damit
  ein einzelner Provider nicht providerübergreifendes Fallback blockiert.

## Sitzungsüberschreibungen und Live-Modellwechsel

Änderungen des Sitzungsmodells sind geteilter Status. Der aktive Runner, der `/model`-Befehl,
Kompaktierungs-/Sitzungs-Updates und Live-Session-Reconciliation lesen oder schreiben
Teile desselben Sitzungseintrags.

Das bedeutet, dass Fallback-Retries mit Live-Modellwechseln koordiniert werden müssen:

- Nur explizite benutzergesteuerte Modelländerungen markieren einen ausstehenden Live-Switch. Das
  umfasst `/model`, `session_status(model=...)` und `sessions.patch`.
- Systemgesteuerte Modelländerungen wie Fallback-Rotation, Heartbeat-Überschreibungen
  oder Kompaktierung markieren niemals selbst einen ausstehenden Live-Switch.
- Bevor ein Fallback-Retry startet, speichert der Reply-Runner die ausgewählten
  Fallback-Override-Felder im Sitzungseintrag.
- Live-Session-Reconciliation bevorzugt persistierte Sitzungsüberschreibungen gegenüber veralteten
  Laufzeit-Modellfeldern.
- Wenn der Fallback-Versuch fehlschlägt, setzt der Runner nur die Override-Felder zurück,
  die er geschrieben hat, und auch nur dann, wenn sie noch mit diesem fehlgeschlagenen Kandidaten übereinstimmen.

Dadurch wird das klassische Race verhindert:

1. Primäres Modell schlägt fehl.
2. Fallback-Kandidat wird im Speicher ausgewählt.
3. Der Sitzungsspeicher sagt weiterhin das alte primäre Modell.
4. Live-Session-Reconciliation liest den veralteten Sitzungsstatus.
5. Der Retry wird zurück auf das alte Modell gezogen, bevor der Fallback-Versuch
   startet.

Die persistierte Fallback-Überschreibung schließt dieses Fenster, und das enge Rollback
hält neuere manuelle oder laufzeitbezogene Sitzungsänderungen intakt.

## Beobachtbarkeit und Fehlerzusammenfassungen

`runWithModelFallback(...)` zeichnet Details pro Versuch auf, die in Logs und
benutzerseitige Cooldown-Meldungen einfließen:

- versuchter Provider/versuchtes Modell
- Grund (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` und
  ähnliche Failover-Gründe)
- optionaler Status/Code
- menschenlesbare Fehlerzusammenfassung

Wenn jeder Kandidat fehlschlägt, wirft OpenClaw `FallbackSummaryError`. Der äußere
Reply-Runner kann dies verwenden, um eine spezifischere Nachricht zu erstellen, etwa „alle Modelle
sind vorübergehend rate-limited“, und den frühesten Cooldown-Ablauf einzuschließen, sofern einer
bekannt ist.

Diese Cooldown-Zusammenfassung ist modellbewusst:

- nicht zusammenhängende modellbezogene Rate Limits werden für die versuchte
  Provider-/Modellkette ignoriert
- wenn der verbleibende Block ein passendes modellbezogenes Rate Limit ist, meldet OpenClaw
  den letzten passenden Ablauf, der dieses Modell weiterhin blockiert

## Verwandte Konfiguration

Siehe [Gateway-Konfiguration](/gateway/configuration) für:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel`-Routing

Siehe [Models](/concepts/models) für den umfassenderen Überblick über Modellauswahl und Fallback.
