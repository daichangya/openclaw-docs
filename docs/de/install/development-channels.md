---
read_when:
    - Sie möchten zwischen stable/beta/dev wechseln
    - Sie möchten eine bestimmte Version, einen Tag oder eine SHA pinnen
    - Sie taggen oder veröffentlichen Prereleases
sidebarTitle: Release Channels
summary: 'Stable-, Beta- und Dev-Kanäle: Semantik, Wechsel, Pinning und Tagging'
title: Release-Kanäle
x-i18n:
    generated_at: "2026-04-05T12:45:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f33a77bf356f989cd4de5f8bb57f330c276e7571b955bea6994a4527e40258d
    source_path: install/development-channels.md
    workflow: 15
---

# Entwicklungskanäle

OpenClaw wird über drei Update-Kanäle ausgeliefert:

- **stable**: npm-dist-tag `latest`. Für die meisten Benutzer empfohlen.
- **beta**: npm-dist-tag `beta`, wenn er aktuell ist; wenn `beta` fehlt oder älter als
  die neueste stabile Version ist, greift der Update-Ablauf auf `latest` zurück.
- **dev**: aktueller Stand von `main` (git). npm-dist-tag: `dev` (wenn veröffentlicht).
  Der Branch `main` ist für Experimente und aktive Entwicklung gedacht. Er kann
  unvollständige Features oder inkompatible Änderungen enthalten. Verwenden Sie ihn nicht für produktive Gateways.

Wir liefern stabile Builds gewöhnlich zuerst an **beta** aus, testen sie dort und führen dann einen
expliziten Promotionsschritt aus, der den geprüften Build auf `latest` verschiebt, ohne
die Versionsnummer zu ändern. Maintainer können bei Bedarf auch eine stabile Version
direkt nach `latest` veröffentlichen. Dist-tags sind die maßgebliche Quelle für npm-
Installationen.

## Kanäle wechseln

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` speichert Ihre Auswahl in der Konfiguration (`update.channel`) und richtet die
Installationsmethode entsprechend aus:

- **`stable`** (Paketinstallationen): aktualisiert über npm-dist-tag `latest`.
- **`beta`** (Paketinstallationen): bevorzugt npm-dist-tag `beta`, greift aber auf
  `latest` zurück, wenn `beta` fehlt oder älter als der aktuelle stabile Tag ist.
- **`stable`** (git-Installationen): checkt den neuesten stabilen git-Tag aus.
- **`beta`** (git-Installationen): bevorzugt den neuesten Beta-git-Tag, greift aber auf
  den neuesten stabilen git-Tag zurück, wenn Beta fehlt oder älter ist.
- **`dev`**: stellt ein Git-Checkout sicher (standardmäßig `~/openclaw`, überschreibbar mit
  `OPENCLAW_GIT_DIR`), wechselt zu `main`, rebased auf upstream, baut und
  installiert die globale CLI aus diesem Checkout.

Tipp: Wenn Sie stable + dev parallel verwenden möchten, halten Sie zwei Klone vor und verweisen Sie Ihr
Gateway auf den stabilen.

## Einmaliges Zielen auf Version oder Tag

Verwenden Sie `--tag`, um für ein einzelnes
Update **ohne** Änderung Ihres gespeicherten Kanals auf ein bestimmtes Dist-tag, eine Version oder eine Paket-Spezifikation zu zielen:

```bash
# Eine bestimmte Version installieren
openclaw update --tag 2026.4.1-beta.1

# Aus dem beta-dist-tag installieren (einmalig, wird nicht gespeichert)
openclaw update --tag beta

# Aus dem GitHub-Branch main installieren (npm-Tarball)
openclaw update --tag main

# Eine bestimmte npm-Paket-Spezifikation installieren
openclaw update --tag openclaw@2026.4.1-beta.1
```

Hinweise:

- `--tag` gilt **nur für Paketinstallationen (npm)**. Git-Installationen ignorieren es.
- Der Tag wird nicht gespeichert. Ihr nächstes `openclaw update` verwendet wie gewohnt Ihren konfigurierten
  Kanal.
- Schutz vor Downgrades: Wenn die Zielversion älter als Ihre aktuelle Version ist,
  fordert OpenClaw eine Bestätigung an (mit `--yes` überspringen).
- `--channel beta` unterscheidet sich von `--tag beta`: Der Kanalablauf kann auf
  stable/latest zurückfallen, wenn Beta fehlt oder älter ist, während `--tag beta` für diesen einen Lauf direkt auf das rohe
  Dist-tag `beta` zielt.

## Dry Run

Vorschau darauf, was `openclaw update` tun würde, ohne Änderungen vorzunehmen:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Der Dry Run zeigt den effektiven Kanal, die Zielversion, geplante Aktionen und
ob eine Bestätigung für ein Downgrade erforderlich wäre.

## Plugins und Kanäle

Wenn Sie mit `openclaw update` den Kanal wechseln, synchronisiert OpenClaw auch die Quellen der Plugins:

- `dev` bevorzugt gebündelte Plugins aus dem Git-Checkout.
- `stable` und `beta` stellen per npm installierte Plugin-Pakete wieder her.
- Per npm installierte Plugins werden aktualisiert, nachdem das Core-Update abgeschlossen ist.

## Aktuellen Status prüfen

```bash
openclaw update status
```

Zeigt den aktiven Kanal, die Installationsart (git oder Paket), die aktuelle Version und
die Quelle (Konfiguration, git-Tag, git-Branch oder Standard) an.

## Best Practices für das Tagging

- Vergeben Sie Tags für Versionen, auf denen Git-Checkouts landen sollen (`vYYYY.M.D` für stable,
  `vYYYY.M.D-beta.N` für beta).
- `vYYYY.M.D.beta.N` wird aus Kompatibilitätsgründen ebenfalls erkannt, aber bevorzugen Sie `-beta.N`.
- Veraltete Tags im Format `vYYYY.M.D-<patch>` werden weiterhin als stabile (nicht-Beta-)Versionen erkannt.
- Halten Sie Tags unveränderlich: Verschieben oder wiederverwenden Sie niemals einen Tag.
- npm-dist-tags bleiben die maßgebliche Quelle für npm-Installationen:
  - `latest` -> stable
  - `beta` -> Kandidaten-Build oder zuerst an Beta ausgelieferter Stable-Build
  - `dev` -> main-Snapshot (optional)

## Verfügbarkeit der macOS-App

Beta- und Dev-Builds enthalten möglicherweise **keine** Release der macOS-App. Das ist in Ordnung:

- Der git-Tag und das npm-dist-tag können trotzdem veröffentlicht werden.
- Erwähnen Sie „keinen macOS-Build für diese Beta“ in den Release Notes oder im Changelog.
