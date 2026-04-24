---
read_when:
    - Suche nach Definitionen der öffentlichen Release-Kanäle.
    - Suche nach Versionsbenennung und Taktung.
summary: Öffentliche Release-Kanäle, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-04-24T06:57:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32c6d904e21f6d4150cf061ae27594bc2364f0927c48388362b16d8bf97491dc
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder bei ausdrücklicher Anforderung auf npm `latest`
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der bewegliche Head von `main`

## Versionsbenennung

- Version für Stable-Releases: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Version für Stable-Korrektur-Releases: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Version für Beta-Prereleases: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuell hochgestufte stabile npm-Release
- `beta` bedeutet das aktuelle Installationsziel für Beta
- Stable- und Stable-Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können explizit `latest` ansteuern oder später einen geprüften Beta-Build hochstufen
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, während
  Build/Signierung/Notarisierung der Mac-App für Stable reserviert bleibt, sofern nicht ausdrücklich angefordert

## Release-Taktung

- Releases gehen zuerst über Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer schneiden Releases normalerweise aus einem Branch `release/YYYY.M.D`, der
  aus dem aktuellen `main` erstellt wird, damit Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag bereits gepusht oder veröffentlicht wurde und einen Fix braucht, schneiden
  Maintainer das nächste Tag `-beta.N`, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detaillierter Release-Prozess, Freigaben, Zugangsdaten und Recovery-Hinweise sind
  nur für Maintainer bestimmt

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript
  auch außerhalb des schnelleren lokalen Gates `pnpm check` abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die umfassenderen Import-
  Cycle- und Architekturgrenzenprüfungen auch außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  Release-Artefakte `dist/*` und das Bundle der Control UI für den Schritt zur
  Pack-Validierung vorhanden sind
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Release-Checks laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt vor der Release-Freigabe außerdem das QA-Lab-Mock-Parity-Gate sowie die Live-
  QA-Lanes für Matrix und Telegram aus. Die Live-Lanes verwenden die
  Umgebung `qa-live-shared`; Telegram verwendet zusätzlich Convex-CI-Credential-Leases.
- Cross-OS-Installations- und Upgrade-Validierung zur Laufzeit wird aus dem
  privaten Caller-Workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  angestoßen, der den wiederverwendbaren öffentlichen Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  aufruft
- Diese Aufteilung ist beabsichtigt: Halten Sie den echten npm-Release-Pfad kurz,
  deterministisch und artefaktfokussiert, während langsamere Live-Checks in ihrer
  eigenen Lane bleiben, damit sie die Veröffentlichung weder verzögern noch blockieren
- Release-Checks müssen vom Workflow-Ref `main` oder von einem
  Workflow-Ref `release/YYYY.M.D` aus ausgelöst werden, damit Workflow-Logik und Secrets
  kontrolliert bleiben
- Dieser Workflow akzeptiert entweder ein bestehendes Release-Tag oder den aktuellen vollständigen
  40-stelligen Commit-SHA des Workflow-Branch
- Im Commit-SHA-Modus akzeptiert er nur den aktuellen HEAD des Workflow-Branch; verwenden Sie
  für ältere Release-Commits ein Release-Tag
- Der Validierungs-Preflight von `OpenClaw NPM Release` akzeptiert ebenfalls den aktuellen
  vollständigen 40-stelligen Commit-SHA des Workflow-Branch, ohne dass ein gepushtes Tag erforderlich ist
- Dieser SHA-Pfad ist nur zur Validierung und kann nicht in eine echte Veröffentlichung hochgestuft werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Prüfung der Paketmetadaten; echte Veröffentlichung erfordert weiterhin ein echtes Release-Tag
- Beide Workflows halten den echten Veröffentlichungs- und Hochstufungspfad auf GitHub-gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Der npm-Release-Preflight wartet nicht mehr auf die separate Lane der Release-Checks
- Führen Sie vor der Freigabe
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  aus (oder das passende Beta-/Korrektur-Tag)
- Führen Sie nach der npm-Veröffentlichung
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  aus (oder die passende Beta-/Korrektur-Version), um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Präfix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N pnpm test:docker:npm-telegram-live`
  aus, um Onboarding mit installiertem Paket, Telegram-Setup und echtes Telegram-E2E
  gegen das veröffentlichte npm-Paket zu verifizieren.
- Die Release-Automatisierung für Maintainer verwendet jetzt Preflight-then-Promote:
  - echte npm-Veröffentlichung muss einen erfolgreichen npm-`preflight_run_id` bestanden haben
  - die echte npm-Veröffentlichung muss vom selben Branch `main` oder
    `release/YYYY.M.D` gestartet werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - ein stabiles npm-Release kann über Workflow-Input explizit `latest` ansteuern
  - tokenbasierte Mutation von npm-Dist-Tags liegt nun in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo OIDC-only-Publishing beibehält
  - öffentliches `macOS Release` dient nur der Validierung
  - echter privater Mac-Publish muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestanden haben
  - die echten Publish-Pfade stufen vorbereitete Artefakte hoch, statt sie erneut
    zu bauen
- Für Stable-Korrektur-Releases wie `YYYY.M.D-N` prüft der Post-Publish-Verifier
  zusätzlich denselben Temp-Prefix-Upgrade-Pfad von `YYYY.M.D` nach `YYYY.M.D-N`,
  damit Release-Korrekturen nicht stillschweigend ältere globale Installationen auf
  der Payload der Basis-Stable-Version belassen
- npm-Release-Preflight schlägt fail-closed fehl, sofern das Tarball nicht sowohl
  `dist/control-ui/index.html` als auch einen nicht leeren Payload unter `dist/control-ui/assets/` enthält,
  damit wir nicht noch einmal ein leeres Browser-Dashboard ausliefern
- Die Verifikation nach der Veröffentlichung prüft außerdem, dass die veröffentlichte Registry-Installation
  nicht leere Runtime-Abhängigkeiten gebündelter Plugins unter dem Root-Layout `dist/*`
  enthält. Ein Release mit fehlenden oder leeren Abhängigkeits-Payloads für gebündelte Plugins
  besteht den Postpublish-Verifier nicht und kann nicht
  zu `latest` hochgestuft werden.
- `pnpm test:install:smoke` erzwingt außerdem das Budget für `unpackedSize` des npm-Packages auf
  dem Kandidaten-Tarball des Updates, sodass das Installer-E2E versehentliche Vergrößerung des Packs
  vor dem Release-Pfad abfängt
- Wenn die Release-Arbeit CI-Planung, Zeitmanifeste für Extensions oder Testmatrizen für
  Extensions berührt hat, regenerieren und prüfen Sie die dem Planner gehörenden
  Outputs der Workflow-Matrix `checks-node-extensions` aus `.github/workflows/ci.yml`
  vor der Freigabe, damit die Release Notes kein veraltetes CI-Layout beschreiben
- Die Bereitschaft für stabile macOS-Releases umfasst auch die Oberflächen des Updaters:
  - das GitHub-Release muss am Ende die verpackten Dateien `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile ZIP verweisen
  - die verpackte App muss eine nicht-debug Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` beibehalten, die mindestens dem kanonischen Sparkle-Build-Floor
    für diese Release-Version entspricht

## Inputs für den NPM-Workflow

`OpenClaw NPM Release` akzeptiert diese operatorgesteuerten Inputs:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, kann es auch der aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branch für validierungs-
  only-Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Publish-Pfad
- `preflight_run_id`: auf dem echten Publish-Pfad erforderlich, damit der Workflow das
  vorbereitete Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Publish-Pfad; Standard ist `beta`

`OpenClaw Release Checks` akzeptiert diese operatorgesteuerten Inputs:

- `ref`: bestehendes Release-Tag oder der aktuelle vollständige 40-stellige Commit-
  SHA von `main`, der validiert werden soll, wenn der Workflow von `main` aus ausgelöst wird; von einem
  Release-Branch aus verwenden Sie ein bestehendes Release-Tag oder den aktuellen vollständigen 40-stelligen Commit-SHA des Release-Branch

Regeln:

- Stable- und Korrektur-Tags dürfen auf `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur auf `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist vollständige Commit-SHA-Eingabe nur erlaubt, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` dient immer nur der Validierung und akzeptiert ebenfalls den
  aktuellen Commit-SHA des Workflow-Branch
- Der Commit-SHA-Modus für Release-Checks erfordert außerdem den aktuellen HEAD des Workflow-Branch
- Der echte Publish-Pfad muss dasselbe `npm_dist_tag` verwenden wie im Preflight;
  der Workflow prüft diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Sequenz für stabile npm-Releases

Beim Schneiden eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie den aktuellen vollständigen Commit-SHA des Workflow-Branch
     für einen Dry-Run zur Validierung des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-First-Ablauf oder `latest` nur,
   wenn Sie absichtlich direkt ein stabiles Release veröffentlichen möchten
3. Führen Sie `OpenClaw Release Checks` separat mit demselben Tag oder dem
   vollständigen aktuellen Commit-SHA des Workflow-Branch aus, wenn Sie Live-Abdeckung für Prompt-Cache,
   QA-Lab-Parität, Matrix und Telegram möchten
   - Dies ist absichtlich getrennt, damit Live-Abdeckung verfügbar bleibt, ohne
     langlaufende oder fragile Checks wieder mit dem Publish-Workflow zu koppeln
4. Speichern Sie die erfolgreiche `preflight_run_id`
5. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
6. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   Workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   um diese stabile Version von `beta` nach `latest` hochzustufen
7. Wenn das Release absichtlich direkt auf `latest` veröffentlicht wurde und `beta`
   derselben Stable-Version sofort folgen soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die Stable-Version zu setzen, oder lassen Sie
   die geplante Self-Healing-Synchronisierung `beta` später verschieben

Die Dist-Tag-Mutation liegt aus Sicherheitsgründen im privaten Repo, weil sie weiterhin
`NPM_TOKEN` benötigt, während das öffentliche Repo OIDC-only-Publishing beibehält.

Damit bleiben sowohl der direkte Publish-Pfad als auch der Beta-First-Hochstufungspfad
dokumentiert und für Operatoren sichtbar.

## Öffentliche Referenzen

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer verwenden die privaten Release-Dokumente in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
als tatsächliches Runbook.

## Verwandt

- [Release channels](/de/install/development-channels)
