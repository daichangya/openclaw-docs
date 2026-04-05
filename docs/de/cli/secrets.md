---
read_when:
    - SecretRefs zur Laufzeit erneut auflösen
    - Plaintext-Rückstände und nicht aufgelöste Refs prüfen
    - SecretRefs konfigurieren und einseitige Bereinigungsänderungen anwenden
summary: CLI-Referenz für `openclaw secrets` (neu laden, prüfen, konfigurieren, anwenden)
title: secrets
x-i18n:
    generated_at: "2026-04-05T12:39:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: f436ba089d752edb766c0a3ce746ee6bca1097b22c9b30e3d9715cb0bb50bf47
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

Verwenden Sie `openclaw secrets`, um SecretRefs zu verwalten und den aktiven Runtime-Snapshot in einem gesunden Zustand zu halten.

Befehlsrollen:

- `reload`: Gateway-RPC (`secrets.reload`), das Refs erneut auflöst und den Runtime-Snapshot nur bei vollständigem Erfolg austauscht (keine Konfigurationsschreibvorgänge).
- `audit`: schreibgeschützter Scan von Konfigurations-/Auth-/generierten Modell-Stores und veralteten Rückständen auf Klartext, nicht aufgelöste Refs und Prioritätsabweichungen (Exec-Refs werden übersprungen, sofern `--allow-exec` nicht gesetzt ist).
- `configure`: interaktiver Planer für Provider-Einrichtung, Zielzuordnung und Preflight (TTY erforderlich).
- `apply`: einen gespeicherten Plan ausführen (`--dry-run` nur zur Validierung; Dry-Run überspringt Exec-Prüfungen standardmäßig, und der Schreibmodus lehnt Pläne mit Exec-Inhalten ab, sofern `--allow-exec` nicht gesetzt ist), dann gezielte Klartext-Rückstände bereinigen.

Empfohlener Operator-Ablauf:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Wenn Ihr Plan `exec`-SecretRefs/-Provider enthält, übergeben Sie `--allow-exec` sowohl bei Dry-Run- als auch bei schreibenden Apply-Befehlen.

Hinweis zu Exit-Codes für CI/Gates:

- `audit --check` gibt bei Findings `1` zurück.
- Nicht aufgelöste Refs geben `2` zurück.

Verwandt:

- Secrets-Leitfaden: [Secrets Management](/gateway/secrets)
- Credential-Oberfläche: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Sicherheitsleitfaden: [Security](/gateway/security)

## Runtime-Snapshot neu laden

Secret-Refs erneut auflösen und den Runtime-Snapshot atomar austauschen.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Hinweise:

- Verwendet die Gateway-RPC-Methode `secrets.reload`.
- Wenn die Auflösung fehlschlägt, behält das Gateway den zuletzt bekannten funktionierenden Snapshot bei und gibt einen Fehler zurück (keine partielle Aktivierung).
- Die JSON-Antwort enthält `warningCount`.

Optionen:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Prüfung

OpenClaw-Status auf Folgendes scannen:

- Speicherung von Secrets im Klartext
- nicht aufgelöste Refs
- Prioritätsabweichungen (`auth-profiles.json`-Credentials verdecken Refs in `openclaw.json`)
- Rückstände in generierten `agents/*/agent/models.json` (Provider-`apiKey`-Werte und sensible Provider-Header)
- veraltete Rückstände (veraltete Auth-Store-Einträge, OAuth-Erinnerungen)

Hinweis zu Header-Rückständen:

- Die Erkennung sensibler Provider-Header basiert heuristisch auf Namen (gängige Auth-/Credential-Headernamen und Fragmente wie `authorization`, `x-api-key`, `token`, `secret`, `password` und `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Exit-Verhalten:

- `--check` beendet mit einem Nicht-Null-Code bei Findings.
- Nicht aufgelöste Refs beenden mit einem höher priorisierten Nicht-Null-Code.

Wichtige Punkte der Berichtsform:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- Finding-Codes:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Konfigurieren (interaktiver Helfer)

Provider- und SecretRef-Änderungen interaktiv erstellen, Preflight ausführen und optional anwenden:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Ablauf:

- Zuerst die Provider-Einrichtung (`add/edit/remove` für `secrets.providers`-Aliasse).
- Danach die Credential-Zuordnung (Felder auswählen und `{source, provider, id}`-Refs zuweisen).
- Zum Schluss Preflight und optionales Anwenden.

Flags:

- `--providers-only`: nur `secrets.providers` konfigurieren, Credential-Zuordnung überspringen.
- `--skip-provider-setup`: Provider-Einrichtung überspringen und Credentials vorhandenen Providern zuordnen.
- `--agent <id>`: die Ermittlung von `auth-profiles.json`-Zielen und Schreibvorgänge auf einen Agent-Store beschränken.
- `--allow-exec`: Exec-SecretRef-Prüfungen während Preflight/Apply zulassen (kann Provider-Befehle ausführen).

Hinweise:

- Erfordert ein interaktives TTY.
- Sie können `--providers-only` nicht mit `--skip-provider-setup` kombinieren.
- `configure` zielt auf Felder mit Secrets in `openclaw.json` sowie auf `auth-profiles.json` für den ausgewählten Agent-Bereich.
- `configure` unterstützt das direkte Erstellen neuer `auth-profiles.json`-Zuordnungen im Picker-Ablauf.
- Kanonisch unterstützte Oberfläche: [SecretRef Credential Surface](/reference/secretref-credential-surface).
- Führt vor dem Anwenden eine Preflight-Auflösung aus.
- Wenn Preflight/Apply Exec-Refs enthält, lassen Sie `--allow-exec` für beide Schritte gesetzt.
- Generierte Pläne setzen standardmäßig Bereinigungsoptionen (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` alle aktiviert).
- Der Apply-Pfad ist für bereinigte Klartextwerte nur in eine Richtung.
- Ohne `--apply` fragt die CLI nach dem Preflight trotzdem `Apply this plan now?`.
- Mit `--apply` (und ohne `--yes`) fragt die CLI zusätzlich nach einer irreversiblen Bestätigung.
- `--json` gibt den Plan + den Preflight-Bericht aus, aber der Befehl erfordert weiterhin ein interaktives TTY.

Hinweis zur Sicherheit von Exec-Providern:

- Homebrew-Installationen stellen Binärdateien häufig über Symlinks unter `/opt/homebrew/bin/*` bereit.
- Setzen Sie `allowSymlinkCommand: true` nur bei Bedarf für vertrauenswürdige Paketmanager-Pfade und kombinieren Sie es mit `trustedDirs` (zum Beispiel `["/opt/homebrew"]`).
- Unter Windows schlägt OpenClaw fehl-geschlossen fehl, wenn die ACL-Verifizierung für einen Provider-Pfad nicht verfügbar ist. Setzen Sie `allowInsecurePath: true` auf diesem Provider nur für vertrauenswürdige Pfade, um die Pfadsicherheitsprüfungen zu umgehen.

## Einen gespeicherten Plan anwenden

Einen zuvor generierten Plan anwenden oder im Preflight prüfen:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Exec-Verhalten:

- `--dry-run` validiert den Preflight, ohne Dateien zu schreiben.
- Exec-SecretRef-Prüfungen werden bei Dry-Run standardmäßig übersprungen.
- Der Schreibmodus lehnt Pläne ab, die Exec-SecretRefs/-Provider enthalten, sofern `--allow-exec` nicht gesetzt ist.
- Verwenden Sie `--allow-exec`, um in beiden Modi Exec-Provider-Prüfungen/-Ausführung ausdrücklich zuzulassen.

Details zum Planvertrag (zulässige Zielpfade, Validierungsregeln und Fehlersemantik):

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

Was `apply` aktualisieren kann:

- `openclaw.json` (SecretRef-Ziele + Provider-Upserts/-Löschungen)
- `auth-profiles.json` (Bereinigung von Provider-Zielen)
- veraltete `auth.json`-Rückstände
- bekannte Secret-Schlüssel in `~/.openclaw/.env`, deren Werte migriert wurden

## Warum keine Rollback-Backups

`secrets apply` schreibt absichtlich keine Rollback-Backups mit alten Klartextwerten.

Die Sicherheit kommt von strengem Preflight + quasi-atomarem Apply mit Best-Effort-Wiederherstellung im Speicher bei Fehlern.

## Beispiel

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Wenn `audit --check` weiterhin Klartext-Findings meldet, aktualisieren Sie die verbleibenden gemeldeten Zielpfade und führen Sie die Prüfung erneut aus.
