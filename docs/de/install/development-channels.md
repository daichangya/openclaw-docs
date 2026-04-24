---
read_when:
    - Sie möchten zwischen stable/beta/dev wechseln
    - Sie möchten eine bestimmte Version, ein Tag oder einen SHA pinnen
    - Sie taggen oder veröffentlichen Prereleases
sidebarTitle: Release Channels
summary: 'Stable-, Beta- und Dev-Kanäle: Semantik, Wechseln, Pinning und Tagging'
title: Release-Kanäle
x-i18n:
    generated_at: "2026-04-24T06:43:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: d892f3b801cb480652e6e7e757c91c000e842689070564f18782c25108dafa3e
    source_path: install/development-channels.md
    workflow: 15
---

# Entwicklungskanäle

OpenClaw liefert drei Update-Kanäle aus:

- **stable**: npm-dist-tag `latest`. Empfohlen für die meisten Benutzer.
- **beta**: npm-dist-tag `beta`, wenn dieser aktuell ist; wenn Beta fehlt oder älter ist als
  das neueste Stable-Release, fällt der Update-Ablauf auf `latest` zurück.
- **dev**: beweglicher Stand von `main` (git). npm-dist-tag: `dev` (wenn veröffentlicht).
  Der Branch `main` ist für Experimente und aktive Entwicklung gedacht. Er kann
  unvollständige Funktionen oder Breaking Changes enthalten. Verwenden Sie ihn nicht für produktive Gateways.

Wir liefern Stable-Builds normalerweise zuerst an **beta** aus, testen sie dort und führen dann einen
expliziten Promotionsschritt aus, der den geprüften Build nach `latest` verschiebt, ohne
die Versionsnummer zu ändern. Maintainer können bei Bedarf ein Stable-Release auch direkt nach
`latest` veröffentlichen. Dist-Tags sind die Quelle der Wahrheit für npm-Installationen.

## Zwischen Kanälen wechseln

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` speichert Ihre Auswahl dauerhaft in der Konfiguration (`update.channel`) und richtet die
Installationsmethode entsprechend aus:

- **`stable`** (Paketinstallationen): Updates über npm-dist-tag `latest`.
- **`beta`** (Paketinstallationen): bevorzugt npm-dist-tag `beta`, fällt aber auf
  `latest` zurück, wenn `beta` fehlt oder älter ist als das aktuelle Stable-Tag.
- **`stable`** (Git-Installationen): checkt das neueste Stable-Git-Tag aus.
- **`beta`** (Git-Installationen): bevorzugt das neueste Beta-Git-Tag, fällt aber auf
  das neueste Stable-Git-Tag zurück, wenn Beta fehlt oder älter ist.
- **`dev`**: stellt einen Git-Checkout sicher (standardmäßig `~/openclaw`, überschreibbar mit
  `OPENCLAW_GIT_DIR`), wechselt zu `main`, rebased auf Upstream, baut und
  installiert die globale CLI aus diesem Checkout.

Tipp: Wenn Sie stable + dev parallel möchten, behalten Sie zwei Klone und richten Sie Ihr
Gateway auf den Stable-Klon aus.

## Einmaliges Ansteuern einer Version oder eines Tags

Verwenden Sie `--tag`, um für ein einzelnes
Update **ohne** Änderung Ihres dauerhaft gespeicherten Kanals ein bestimmtes Dist-Tag, eine Version oder eine Paketspezifikation anzusteuern:

```bash
# Eine bestimmte Version installieren
openclaw update --tag 2026.4.1-beta.1

# Aus dem Beta-Dist-Tag installieren (einmalig, wird nicht gespeichert)
openclaw update --tag beta

# Vom GitHub-Main-Branch installieren (npm-Tarball)
openclaw update --tag main

# Eine bestimmte npm-Paketspezifikation installieren
openclaw update --tag openclaw@2026.4.1-beta.1
```

Hinweise:

- `--tag` gilt **nur für Paketinstallationen (npm)**. Git-Installationen ignorieren dies.
- Das Tag wird nicht gespeichert. Ihr nächstes `openclaw update` verwendet wie gewohnt den konfigurierten
  Kanal.
- Schutz vor Downgrades: Wenn die Zielversion älter ist als Ihre aktuelle Version,
  fordert OpenClaw eine Bestätigung an (mit `--yes` überspringen).
- `--channel beta` unterscheidet sich von `--tag beta`: Der Kanalablauf kann auf
  stable/latest zurückfallen, wenn Beta fehlt oder älter ist, während `--tag beta` für diesen einen Lauf
  das rohe Dist-Tag `beta` ansteuert.

## Dry Run

Vorschau, was `openclaw update` tun würde, ohne Änderungen vorzunehmen:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Der Dry Run zeigt den effektiven Kanal, die Zielversion, die geplanten Aktionen und
ob eine Bestätigung für ein Downgrade erforderlich wäre.

## Plugins und Kanäle

Wenn Sie mit `openclaw update` den Kanal wechseln, synchronisiert OpenClaw auch Plugin-
Quellen:

- `dev` bevorzugt gebündelte Plugins aus dem Git-Checkout.
- `stable` und `beta` stellen npm-installierte Plugin-Pakete wieder her.
- npm-installierte Plugins werden aktualisiert, nachdem das Core-Update abgeschlossen ist.

## Aktuellen Status prüfen

```bash
openclaw update status
```

Zeigt den aktiven Kanal, die Installationsart (git oder Paket), die aktuelle Version und
die Quelle (Konfiguration, Git-Tag, Git-Branch oder Standard).

## Best Practices für Tagging

- Taggen Sie Releases, auf denen Git-Checkouts landen sollen (`vYYYY.M.D` für Stable,
  `vYYYY.M.D-beta.N` für Beta).
- `vYYYY.M.D.beta.N` wird aus Kompatibilitätsgründen ebenfalls erkannt, aber bevorzugen Sie `-beta.N`.
- Legacy-Tags vom Typ `vYYYY.M.D-<patch>` werden weiterhin als Stable (nicht Beta) erkannt.
- Halten Sie Tags unveränderlich: Verschieben oder wiederverwenden Sie niemals ein Tag.
- npm-Dist-Tags bleiben die Quelle der Wahrheit für npm-Installationen:
  - `latest` -> stable
  - `beta` -> Kandidaten-Build oder Beta-first-Stable-Build
  - `dev` -> Main-Snapshot (optional)

## Verfügbarkeit der macOS-App

Beta- und Dev-Builds enthalten möglicherweise **keine** macOS-App-Version. Das ist in Ordnung:

- Das Git-Tag und npm-Dist-Tag können trotzdem veröffentlicht werden.
- Vermerken Sie „keinen macOS-Build für diese Beta“ in den Release Notes oder im Changelog.

## Verwandt

- [Updating](/de/install/updating)
- [Installer internals](/de/install/installer)
