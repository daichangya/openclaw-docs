---
read_when:
    - Suche nach öffentlichen Definitionen der Release-Kanäle
    - Suche nach Versionsbenennung und Taktung
summary: Öffentliche Release-Kanäle, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-04-23T14:06:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# Release-Richtlinie

OpenClaw hat drei öffentliche Release-Lanes:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder bei ausdrücklicher Anforderung auf npm `latest`
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der bewegliche Head von `main`

## Versionsbenennung

- Stabile Release-Version: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Stabile Korrektur-Release-Version: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Beta-Prerelease-Version: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuell hochgestufte stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stabile und stabile Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können explizit `latest` als Ziel wählen oder später einen geprüften Beta-Build hochstufen
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, wobei Build/Signierung/Notarisierung der Mac-App für stable reserviert bleibt, sofern nicht ausdrücklich angefordert

## Release-Taktung

- Releases bewegen sich beta-first
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer schneiden Releases normalerweise aus einem Branch `release/YYYY.M.D`, der
  aus dem aktuellen `main` erstellt wird, damit Release-Validierung und Fixes die neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt, schneiden Maintainer
  das nächste Tag `-beta.N`, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detailliertes Release-Verfahren, Freigaben, Credentials und Hinweise zur Wiederherstellung sind
  nur für Maintainer bestimmt

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript
  auch außerhalb des schnelleren lokalen Gates `pnpm check` abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die umfassenderen
  Prüfungen von Import-Zyklen und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  Release-Artefakte `dist/*` und das Control-UI-Bundle für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Release-Checks laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt vor der Release-Freigabe außerdem das QA-Lab-Mock-Parity-Gate sowie die Live-
  QA-Lanes für Matrix und Telegram aus. Die Live-Lanes verwenden die
  Umgebung `qa-live-shared`; Telegram verwendet zusätzlich Convex-CI-Credential-Leases.
- Laufzeitvalidierung für Cross-OS-Installation und -Upgrade wird aus dem
  privaten Caller-Workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  ausgelöst, der den wiederverwendbaren öffentlichen Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  aufruft
- Diese Aufteilung ist beabsichtigt: Der echte npm-Release-Pfad soll kurz,
  deterministisch und artefaktfokussiert bleiben, während langsamere Live-Checks in ihrer
  eigenen Lane bleiben, damit sie die Veröffentlichung nicht aufhalten oder blockieren
- Release-Checks müssen aus der Workflow-Referenz `main` oder aus einer
  Workflow-Referenz `release/YYYY.M.D` ausgelöst werden, damit Workflow-Logik und Secrets
  kontrolliert bleiben
- Dieser Workflow akzeptiert entweder ein vorhandenes Release-Tag oder den aktuellen vollständigen
  40-stelligen Commit-SHA des Workflow-Branches
- Im Commit-SHA-Modus akzeptiert er nur den aktuellen HEAD des Workflow-Branches; verwenden Sie
  für ältere Release-Commits ein Release-Tag
- Das nur-validierende Preflight von `OpenClaw NPM Release` akzeptiert ebenfalls den aktuellen
  vollständigen 40-stelligen Commit-SHA des Workflow-Branches, ohne ein gepushtes Tag zu verlangen
- Dieser SHA-Pfad dient nur der Validierung und kann nicht zu einer echten Veröffentlichung hochgestuft werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Prüfung der Paketmetadaten; echte Veröffentlichungen erfordern weiterhin ein echtes Release-Tag
- Beide Workflows behalten den echten Publish- und Promotionspfad auf GitHub-gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  unter Verwendung beider Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- npm-Release-Preflight wartet nicht mehr auf die separate Lane für Release-Checks
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder das passende Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach der npm-Veröffentlichung
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrektur-Version) aus, um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Präfix zu verifizieren
- Die Release-Automatisierung für Maintainer verwendet jetzt Preflight-then-Promote:
  - echte npm-Veröffentlichung muss einen erfolgreichen npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss vom selben `main`- oder
    `release/YYYY.M.D`-Branch ausgelöst werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann explizit `latest` per Workflow-Input als Ziel setzen
  - Token-basierte Mutation von npm-dist-tags liegt jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo bei OIDC-only-Publish bleibt
  - öffentliche `macOS Release` ist nur Validierung
  - echter privater Mac-Publish muss erfolgreiches privates Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Publish-Pfade stufen vorbereitete Artefakte hoch, statt sie
    erneut zu bauen
- Für stabile Korrektur-Releases wie `YYYY.M.D-N` prüft der Verifizierer nach der Veröffentlichung
  zusätzlich denselben Upgrade-Pfad im temporären Präfix von `YYYY.M.D` zu `YYYY.M.D-N`,
  sodass Release-Korrekturen ältere globale Installationen nicht stillschweigend auf der
  Basis-Stable-Payload belassen können
- npm-Release-Preflight schlägt fail-closed fehl, wenn das Tarball nicht sowohl
  `dist/control-ui/index.html` als auch eine nicht leere Payload `dist/control-ui/assets/` enthält,
  damit wir nicht noch einmal ein leeres Browser-Dashboard ausliefern
- Die Verifizierung nach der Veröffentlichung prüft außerdem, dass die veröffentlichte Registry-Installation
  nicht leere Laufzeitabhängigkeiten gebündelter Plugins unter dem Root-Layout `dist/*`
  enthält. Ein Release, das mit fehlenden oder leeren Payloads von
  Plugin-Abhängigkeiten ausgeliefert wird, fällt beim Postpublish-Verifizierer durch und kann nicht
  auf `latest` hochgestuft werden.
- `pnpm test:install:smoke` erzwingt außerdem das npm-pack-`unpackedSize`-Budget für
  das Kandidaten-Update-Tarball, sodass Installer-E2E unbeabsichtigtes Pack-Bloat
  vor dem Release-Publish-Pfad erkennt
- Wenn die Release-Arbeit die CI-Planung, Timing-Manifeste für Erweiterungen oder
  Testmatrizen für Erweiterungen berührt hat, regenerieren und prüfen Sie die planer-eigenen
  Workflow-Matrix-Ausgaben `checks-node-extensions` aus `.github/workflows/ci.yml`
  vor der Freigabe, damit Release Notes kein veraltetes CI-Layout beschreiben
- Die Bereitschaft für stabile macOS-Releases umfasst auch die Updater-Oberflächen:
  - das GitHub-Release muss die paketierten Dateien `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile zip zeigen
  - die paketierte App muss eine nicht Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor
    für diese Release-Version behalten

## NPM-Workflow-Inputs

`OpenClaw NPM Release` akzeptiert diese operatorgesteuerten Inputs:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, kann dies auch der aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branches für ein nur-validierendes Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paketierung, `false` für den
  echten Publish-Pfad
- `preflight_run_id`: auf dem echten Publish-Pfad erforderlich, damit der Workflow das
  vorbereitete Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Publish-Pfad; Standard ist `beta`

`OpenClaw Release Checks` akzeptiert diese operatorgesteuerten Inputs:

- `ref`: vorhandenes Release-Tag oder der aktuelle vollständige 40-stellige `main`-Commit-
  SHA zur Validierung, wenn von `main` ausgelöst; von einem Release-Branch aus verwenden Sie ein
  vorhandenes Release-Tag oder den aktuellen vollständigen 40-stelligen Commit-SHA des Release-Branches

Regeln:

- Stable- und Korrektur-Tags dürfen entweder auf `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur auf `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist die Eingabe eines vollständigen Commit-SHA nur erlaubt, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` dient immer nur der Validierung und akzeptiert ebenfalls den
  aktuellen Commit-SHA des Workflow-Branches
- Der Commit-SHA-Modus der Release-Checks erfordert außerdem den aktuellen HEAD des Workflow-Branches
- Der echte Publish-Pfad muss denselben `npm_dist_tag` verwenden, der während des Preflight verwendet wurde;
  der Workflow verifiziert diese Metadaten, bevor der Publish fortgesetzt wird

## Sequenz für stabile npm-Releases

Beim Schneiden eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie den aktuellen vollständigen Commit des Workflow-Branches
     SHA für einen nur-validierenden Dry Run des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-first-Ablauf oder `latest` nur dann,
   wenn Sie absichtlich eine direkte stabile Veröffentlichung möchten
3. Führen Sie `OpenClaw Release Checks` separat mit demselben Tag oder dem
   vollständigen aktuellen Commit-SHA des Workflow-Branches aus, wenn Sie Live-Abdeckung für Prompt-Cache,
   QA-Lab-Parity, Matrix und Telegram wünschen
   - Dies ist absichtlich getrennt, damit Live-Abdeckung verfügbar bleibt, ohne
     lang laufende oder flaky Checks erneut an den Publish-Workflow zu koppeln
4. Speichern Sie die erfolgreiche `preflight_run_id`
5. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
6. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   Workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   um diese stabile Version von `beta` auf `latest` hochzustufen
7. Wenn das Release absichtlich direkt auf `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide dist-tags auf die stabile Version zu setzen, oder lassen Sie deren geplante
   Self-Healing-Synchronisierung `beta` später verschieben

Die dist-tag-Mutation liegt aus Sicherheitsgründen im privaten Repo, weil sie weiterhin
`NPM_TOKEN` benötigt, während das öffentliche Repo bei OIDC-only-Publish bleibt.

Dadurch bleiben sowohl der direkte Publish-Pfad als auch der Beta-first-Promotionspfad dokumentiert und für Operatoren sichtbar.

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
