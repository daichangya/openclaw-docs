---
read_when:
    - Erstellen oder Prüfen von `openclaw secrets apply`-Plänen
    - Fehlerbehebung bei Fehlern `Invalid plan target path`
    - Verstehen des Verhaltens bei Validierung von Zieltyp und Pfad
summary: 'Vertrag für `secrets apply`-Pläne: Zielvalidierung, Pfadabgleich und Zielbereich für `auth-profiles.json`'
title: Secrets-Apply-Plan-Vertrag
x-i18n:
    generated_at: "2026-04-05T12:43:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb89a426ca937cf4d745f641b43b330c7fbb1aa9e4359b106ecd28d7a65ca327
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

# Secrets-Apply-Plan-Vertrag

Diese Seite definiert den strikten Vertrag, der von `openclaw secrets apply` erzwungen wird.

Wenn ein Ziel nicht diesen Regeln entspricht, schlägt Apply fehl, bevor die Konfiguration verändert wird.

## Struktur der Plandatei

`openclaw secrets apply --from <plan.json>` erwartet ein `targets`-Array aus Planzielen:

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

Planziele werden für unterstützte Anmeldedatenpfade akzeptiert in:

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

## Verhalten des Zieltyps

Allgemeine Regel:

- `target.type` muss erkannt werden und zur normalisierten Form von `target.path` passen.

Kompatibilitätsaliase werden für bestehende Pläne weiterhin akzeptiert:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Regeln zur Pfadvalidierung

Jedes Ziel wird anhand aller folgenden Regeln validiert:

- `type` muss ein erkannter Zieltyp sein.
- `path` muss ein nicht leerer Punktpfad sein.
- `pathSegments` kann weggelassen werden. Falls angegeben, muss es sich genau zu demselben Pfad wie `path` normalisieren.
- Verbotene Segmente werden abgelehnt: `__proto__`, `prototype`, `constructor`.
- Der normalisierte Pfad muss zur registrierten Pfadform für den Zieltyp passen.
- Wenn `providerId` oder `accountId` gesetzt ist, muss es zur im Pfad codierten ID passen.
- Ziele für `auth-profiles.json` erfordern `agentId`.
- Wenn eine neue Zuordnung in `auth-profiles.json` erstellt wird, fügen Sie `authProfileProvider` hinzu.

## Verhalten bei Fehlern

Wenn ein Ziel die Validierung nicht besteht, beendet sich Apply mit einem Fehler wie:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Für einen ungültigen Plan werden keine Schreibvorgänge übernommen.

## Verhalten zur Zustimmung bei Exec-Providern

- `--dry-run` überspringt standardmäßig Prüfungen von exec SecretRef.
- Pläne mit exec SecretRefs/Providern werden im Schreibmodus abgelehnt, sofern `--allow-exec` nicht gesetzt ist.
- Wenn Sie Pläne mit exec-Inhalten validieren/anwenden, übergeben Sie `--allow-exec` sowohl bei Dry-Run- als auch bei Schreibbefehlen.

## Hinweise zu Runtime- und Audit-Bereich

- Nur-Ref-Einträge in `auth-profiles.json` (`keyRef`/`tokenRef`) werden in die Runtime-Auflösung und Audit-Abdeckung einbezogen.
- `secrets apply` schreibt unterstützte Ziele in `openclaw.json`, unterstützte Ziele in `auth-profiles.json` und optionale Bereinigungsziele.

## Operator-Prüfungen

```bash
# Plan ohne Schreibvorgänge validieren
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Dann tatsächlich anwenden
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Bei Plänen mit exec-Inhalten in beiden Modi explizit zustimmen
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Wenn Apply mit einer Meldung zu einem ungültigen Zielpfad fehlschlägt, erzeugen Sie den Plan mit `openclaw secrets configure` neu oder korrigieren Sie den Zielpfad auf eine oben unterstützte Form.

## Verwandte Dokumentation

- [Secrets Management](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [SecretRef Credential Surface](/reference/secretref-credential-surface)
- [Configuration Reference](/gateway/configuration-reference)
