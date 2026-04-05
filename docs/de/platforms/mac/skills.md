---
read_when:
    - Aktualisieren der UI für macOS-Skills-Einstellungen
    - Ändern des Skill-Gatings oder des Installationsverhaltens
summary: UI für macOS-Skills-Einstellungen und gateway-gestützter Status
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-05T12:49:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ffd6744646d2c8770fa12a5e511f84a40b5ece67181139250ec4cc4301b49b8
    source_path: platforms/mac/skills.md
    workflow: 15
---

# Skills (macOS)

Die macOS-App stellt OpenClaw-Skills über das Gateway bereit; sie parst Skills nicht lokal.

## Datenquelle

- `skills.status` (Gateway) gibt alle Skills sowie Eignung und fehlende Anforderungen zurück
  (einschließlich Allowlist-Sperren für gebündelte Skills).
- Anforderungen werden aus `metadata.openclaw.requires` in jeder `SKILL.md` abgeleitet.

## Installationsaktionen

- `metadata.openclaw.install` definiert Installationsoptionen (brew/node/go/uv).
- Die App ruft `skills.install` auf, um Installer auf dem Gateway-Host auszuführen.
- Integrierte `critical`-Befunde für gefährlichen Code blockieren `skills.install` standardmäßig; verdächtige Befunde lösen weiterhin nur Warnungen aus. Die Überschreibung für gefährlichen Code existiert in der Gateway-Anfrage, aber der Standardablauf der App bleibt standardmäßig restriktiv.
- Wenn jede Installationsoption `download` ist, stellt das Gateway alle Download-Optionen bereit.
- Andernfalls wählt das Gateway anhand der aktuellen Installationspräferenzen und Host-Binärdateien ein bevorzugtes Installationsprogramm aus: zuerst Homebrew, wenn `skills.install.preferBrew` aktiviert ist und `brew` vorhanden ist, dann `uv`, dann der konfigurierte Node-Manager aus `skills.install.nodeManager`, dann spätere Fallbacks wie `go` oder `download`.
- Node-Installationsbezeichnungen spiegeln den konfigurierten Node-Manager wider, einschließlich `yarn`.

## Env/API-Schlüssel

- Die App speichert Schlüssel in `~/.openclaw/openclaw.json` unter `skills.entries.<skillKey>`.
- `skills.update` patcht `enabled`, `apiKey` und `env`.

## Remote-Modus

- Installations- und Konfigurationsaktualisierungen erfolgen auf dem Gateway-Host (nicht auf dem lokalen Mac).
