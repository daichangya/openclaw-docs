---
read_when:
    - Suche nach Definitionen der öffentlichen Release-Kanäle
    - Suche nach Versionsbenennung und Taktung
summary: Öffentliche Release-Kanäle, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-04-21T06:31:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 356844708f6ecdae4acfcce853ce16ae962914a9fdd1cfc38a22ac4c439ba172
    source_path: reference/RELEASING.md
    workflow: 15
---

# Release-Richtlinie

OpenClaw hat drei öffentliche Release-Strecken:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder bei ausdrücklicher Anforderung auf npm `latest`
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der bewegliche Stand von `main`

## Versionsbenennung

- Version eines Stable-Releases: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Version eines Stable-Korrektur-Releases: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Version eines Beta-Prereleases: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuell hochgestufte stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können explizit `latest` ansteuern oder später einen freigegebenen Beta-Build hochstufen
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, wobei
  Build/Signierung/Notarisierung der mac-App Stable vorbehalten bleiben, sofern nicht ausdrücklich angefordert

## Release-Taktung

- Releases gehen zuerst über beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer schneiden Releases normalerweise von einem Branch `release/YYYY.M.D`, der
  vom aktuellen `main` erstellt wird, damit Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt, schneiden Maintainer
  das nächste Tag `-beta.N`, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detaillierter Release-Ablauf, Freigaben, Anmeldedaten und Hinweise zur Wiederherstellung sind
  nur für Maintainer bestimmt

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript
  außerhalb des schnelleren lokalen Gates `pnpm check` weiter abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die umfassenderen Prüfungen für Import-
  Zyklen und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  Release-Artefakte `dist/*` und das Bundle der Control UI für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- Laufzeitvalidierung für Installation und Upgrade über mehrere Betriebssysteme hinweg wird aus dem
  privaten aufrufenden Workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  angestoßen, der den wiederverwendbaren öffentlichen Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  aufruft
- Diese Aufteilung ist beabsichtigt: Der echte npm-Release-Pfad soll kurz,
  deterministisch und artefaktfokussiert bleiben, während langsamere Live-Prüfungen in ihrer
  eigenen Strecke bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen müssen vom Workflow-Ref `main` oder von einem
  Workflow-Ref `release/YYYY.M.D` aus angestoßen werden, damit Workflow-Logik und Secrets
  kontrolliert bleiben
- Dieser Workflow akzeptiert entweder ein vorhandenes Release-Tag oder den aktuellen vollständigen
  40-stelligen Commit-SHA des Workflow-Branches
- Im Commit-SHA-Modus akzeptiert er nur den aktuellen HEAD des Workflow-Branches; verwenden Sie
  für ältere Release-Commits ein Release-Tag
- Das Validierungs-Only-Preflight von `OpenClaw NPM Release` akzeptiert ebenfalls den aktuellen
  vollständigen 40-stelligen Commit-SHA des Workflow-Branches, ohne dass ein gepushtes Tag erforderlich ist
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in eine echte Veröffentlichung hochgestuft werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die Prüfung der Paketmetadaten; echte Veröffentlichung erfordert weiterhin ein echtes Release-Tag
- Beide Workflows behalten den echten Veröffentlichungs- und Hochstufungspfad auf GitHub-gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  unter Verwendung der Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- npm-Release-Preflight wartet nicht mehr auf die separate Strecke der Release-Prüfungen
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder das passende Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach der npm-Veröffentlichung
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrekturversion) aus, um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Präfix zu verifizieren
- Die Release-Automatisierung für Maintainer verwendet jetzt Preflight-dann-Hochstufung:
  - eine echte npm-Veröffentlichung muss einen erfolgreichen npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss vom selben Branch `main` oder
    `release/YYYY.M.D` wie der erfolgreiche Preflight-Lauf angestoßen werden
  - stabile npm-Releases verwenden standardmäßig `beta`
  - eine stabile npm-Veröffentlichung kann explizit `latest` als Workflow-Eingabe ansteuern
  - tokenbasierte Mutation von npm-Dist-Tags befindet sich jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repository OIDC-only-Publishing beibehält
  - öffentliches `macOS Release` dient nur der Validierung
  - echte private Mac-Veröffentlichung muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade stufen vorbereitete Artefakte hoch, statt sie
    erneut zu bauen
- Bei Stable-Korrektur-Releases wie `YYYY.M.D-N` prüft der Verifier nach der Veröffentlichung
  zusätzlich denselben Upgrade-Pfad mit temporärem Präfix von `YYYY.M.D` nach `YYYY.M.D-N`,
  damit Release-Korrekturen nicht stillschweigend ältere globale Installationen auf der
  Basislast des Stable-Release belassen
- Das npm-Release-Preflight schlägt geschlossen fehl, wenn das Tarball nicht sowohl
  `dist/control-ui/index.html` als auch eine nicht leere Nutzlast in `dist/control-ui/assets/` enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- `pnpm test:install:smoke` erzwingt auch das Budget für `unpackedSize` des npm-Packs auf
  dem Kandidaten-Tarball des Updates, sodass das E2E des Installers versehentliche Pack-Aufblähung
  vor dem Veröffentlichungspfad des Release erkennt
- Wenn die Release-Arbeit CI-Planung, Timing-Manifeste von Erweiterungen oder
  Testmatrizen von Erweiterungen berührt hat, generieren und prüfen Sie die planer-eigenen
  Matrix-Ausgaben des Workflows `checks-node-extensions` aus `.github/workflows/ci.yml`
  vor der Freigabe erneut, damit Release-Notes kein veraltetes CI-Layout beschreiben
- Zur Bereitschaft eines stabilen macOS-Releases gehören auch die Update-Oberflächen:
  - das GitHub-Release muss am Ende die gepackten Dateien `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile Zip-Datei zeigen
  - die gepackte App muss eine nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und ein `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor
    für diese Release-Version behalten

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, darf dies auch der aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branches für ein reines Validierungs-Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der Workflow
  das vorbereitete Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Checks` akzeptiert diese operatorgesteuerten Eingaben:

- `ref`: vorhandenes Release-Tag oder der aktuelle vollständige 40-stellige `main`-Commit-
  SHA, der bei Ausführung von `main` validiert werden soll; von einem Release-Branch aus verwenden Sie ein
  vorhandenes Release-Tag oder den aktuellen vollständigen 40-stelligen Commit-SHA des Release-Branches

Regeln:

- Stable- und Korrektur-Tags dürfen entweder auf `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur auf `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist die Eingabe eines vollständigen Commit-SHA nur erlaubt, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` dient immer nur der Validierung und akzeptiert ebenfalls den
  aktuellen Commit-SHA des Workflow-Branches
- Der Commit-SHA-Modus der Release-Prüfungen erfordert außerdem den aktuellen HEAD des Workflow-Branches
- Der echte Veröffentlichungspfad muss dasselbe `npm_dist_tag` verwenden, das während des Preflight genutzt wurde;
  der Workflow verifiziert diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Sequenz für ein stabiles npm-Release

Beim Schneiden eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie den aktuellen vollständigen Commit
     des Workflow-Branches für einen rein validierenden Dry-Run des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-first-Flow oder `latest` nur dann,
   wenn Sie absichtlich eine direkte stabile Veröffentlichung möchten
3. Führen Sie `OpenClaw Release Checks` separat mit demselben Tag oder dem
   vollständigen aktuellen Commit-SHA des Workflow-Branches aus, wenn Sie Live-Abdeckung für den Prompt-Cache
   möchten
   - Dies ist absichtlich getrennt, damit Live-Abdeckung verfügbar bleibt, ohne
     lang laufende oder fehleranfällige Prüfungen wieder an den Veröffentlichungs-Workflow zu koppeln
4. Speichern Sie die erfolgreiche `preflight_run_id`
5. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
6. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   Workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   um diese stabile Version von `beta` nach `latest` hochzustufen
7. Wenn das Release absichtlich direkt auf `latest` veröffentlicht wurde und `beta`
   unmittelbar demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die stabile Version zu setzen, oder lassen Sie die geplante
   Self-Healing-Synchronisierung `beta` später verschieben

Die Mutation des Dist-Tags liegt aus Sicherheitsgründen im privaten Repository, weil sie weiterhin
`NPM_TOKEN` erfordert, während das öffentliche Repository OIDC-only-Publishing beibehält.

Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-first-Hochstufungspfad dokumentiert
und für Operatoren sichtbar.

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
