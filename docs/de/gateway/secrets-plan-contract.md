---
read_when:
    - '`openclaw secrets apply`-Pläne erzeugen oder prüfen'
    - Fehler bei `Invalid plan target path` beheben
    - Verhalten bei Validierung von Zieltyp und Pfad verstehen
summary: 'Vertrag für `secrets apply`-Pläne: Zielvalidierung, Pfadabgleich und Zielbereich von `auth-profiles.json`'
title: Vertrag für Secrets-apply-Pläne
x-i18n:
    generated_at: "2026-04-24T06:39:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

Diese Seite definiert den strikten Vertrag, der von `openclaw secrets apply` erzwungen wird.

Wenn ein Ziel nicht zu diesen Regeln passt, schlägt apply fehl, bevor die Konfiguration verändert wird.

## Struktur der Plan-Datei

`openclaw secrets apply --from <plan.json>` erwartet ein `targets`-Array mit Plan-Zielen:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## Unterstützter Zielbereich

Plan-Ziele werden für unterstützte Anmeldedatenpfade akzeptiert in:

- [SecretRef Credential Surface](/de/reference/secretref-credential-surface)

## Verhalten des Zieltyps

Allgemeine Regel:

- `target.type` muss erkannt werden und mit der normalisierten Form von `target.path` übereinstimmen.

Kompatibilitätsaliase bleiben für bestehende Pläne weiterhin akzeptiert:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Regeln zur Pfadvalidierung

Jedes Ziel wird mit allen folgenden Regeln validiert:

- `type` muss ein erkannter Zieltyp sein.
- `path` muss ein nicht leerer Punktpfad sein.
- `pathSegments` kann weggelassen werden. Wenn angegeben, muss es sich zu genau demselben Pfad wie `path` normalisieren.
- Verbotene Segmente werden abgelehnt: `__proto__`, `prototype`, `constructor`.
- Der normalisierte Pfad muss mit der registrierten Pfadform für den Zieltyp übereinstimmen.
- Wenn `providerId` oder `accountId` gesetzt ist, muss es mit der im Pfad kodierten ID übereinstimmen.
- Ziele für `auth-profiles.json` erfordern `agentId`.
- Wenn eine neue Zuordnung in `auth-profiles.json` erstellt wird, muss `authProfileProvider` enthalten sein.

## Fehlerverhalten

Wenn ein Ziel die Validierung nicht besteht, beendet apply den Vorgang mit einem Fehler wie:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Für einen ungültigen Plan werden keine Schreibvorgänge übernommen.

## Verhalten bei Zustimmung für Exec-Anbieter

- `--dry-run` überspringt standardmäßig Exec-SecretRef-Prüfungen.
- Pläne mit Exec-SecretRefs/-Anbietern werden im Schreibmodus abgelehnt, sofern `--allow-exec` nicht gesetzt ist.
- Wenn Pläne mit Exec-Inhalt validiert/angewendet werden, übergeben Sie `--allow-exec` sowohl bei Dry-Run- als auch bei Schreibbefehlen.

## Hinweise zu Laufzeit- und Audit-Bereich

- Rein referenzielle Einträge in `auth-profiles.json` (`keyRef`/`tokenRef`) sind in der Laufzeitauflösung und im Audit-Bereich enthalten.
- `secrets apply` schreibt unterstützte Ziele in `openclaw.json`, unterstützte Ziele in `auth-profiles.json` und optionale Scrub-Ziele.

## Operator-Prüfungen

```bash
# Plan ohne Schreibvorgänge validieren
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Dann wirklich anwenden
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Für Pläne mit Exec-Inhalt in beiden Modi explizit aktivieren
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Wenn apply mit einer Meldung zu einem ungültigen Zielpfad fehlschlägt, generieren Sie den Plan mit `openclaw secrets configure` neu oder korrigieren Sie den Zielpfad auf eine oben unterstützte Form.

## Verwandte Dokumente

- [Secrets Management](/de/gateway/secrets)
- [CLI `secrets`](/de/cli/secrets)
- [SecretRef Credential Surface](/de/reference/secretref-credential-surface)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
