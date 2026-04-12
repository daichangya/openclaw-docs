---
read_when:
    - Suche nach öffentlichen Definitionen von Release-Kanälen
    - Suche nach Versionsbenennung und Release-Taktung
summary: Öffentliche Release-Kanäle, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-04-12T23:33:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: dffc1ee5fdbb20bd1bf4b3f817d497fc0d87f70ed6c669d324fea66dc01d0b0b
    source_path: reference/RELEASING.md
    workflow: 15
---

# Release-Richtlinie

OpenClaw hat drei öffentliche Release-Lanes:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder bei expliziter Anforderung auf npm `latest`
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der bewegliche Head von `main`

## Versionsbenennung

- Stable-Release-Version: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Stable-Korrektur-Release-Version: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Beta-Prerelease-Version: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat und Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuell freigegebene stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können explizit `latest` als Ziel wählen oder später einen geprüften Beta-Build freigeben
- Jedes OpenClaw Release liefert das npm-Paket und die macOS-App gemeinsam aus

## Release-Taktung

- Releases gehen zuerst über Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Detaillierte Release-Verfahren, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind nur für Maintainer bestimmt

## Release-Preflight

- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Release-Checks laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- Diese Aufteilung ist beabsichtigt: Der echte npm-Release-Pfad soll kurz,
  deterministisch und artefaktorientiert bleiben, während langsamere Live-Checks in ihrer
  eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Checks müssen vom Workflow-Ref `main` aus ausgelöst werden, damit
  Workflow-Logik und Secrets kanonisch bleiben
- Dieser Workflow akzeptiert entweder ein vorhandenes Release-Tag oder die aktuelle vollständige
  40-stellige `main`-Commit-SHA
- Im Commit-SHA-Modus akzeptiert er nur den aktuellen `origin/main`-HEAD; verwenden Sie ein
  Release-Tag für ältere Release-Commits
- Das validation-only-Preflight von `OpenClaw NPM Release` akzeptiert ebenfalls die aktuelle
  vollständige 40-stellige `main`-Commit-SHA, ohne ein gepushtes Tag zu erfordern
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in eine echte Veröffentlichung überführt werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Prüfung der Paketmetadaten; echte Veröffentlichung erfordert weiterhin ein echtes Release-Tag
- Beide Workflows halten den echten Veröffentlichungs- und Freigabepfad auf von GitHub gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Das npm-Release-Preflight wartet nicht mehr auf die separate Lane für Release-Checks
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder das passende Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach der npm-Veröffentlichung
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrektur-Version) aus, um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Präfix zu verifizieren
- Die Maintainer-Release-Automatisierung verwendet jetzt Preflight-dann-Promote:
  - eine echte npm-Veröffentlichung muss ein erfolgreiches npm-`preflight_run_id` bestehen
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichungen können explizit `latest` als Ziel wählen per Workflow-Eingabe
  - die Freigabe stabiler npm-Releases von `beta` nach `latest` ist weiterhin als expliziter manueller Modus im vertrauenswürdigen Workflow `OpenClaw NPM Release` verfügbar
  - dieser Freigabemodus benötigt weiterhin ein gültiges `NPM_TOKEN` in der Umgebung `npm-release`, da die Verwaltung von npm-`dist-tag` getrennt von Trusted Publishing ist
  - das öffentliche `macOS Release` dient nur der Validierung
  - eine echte private Mac-Veröffentlichung muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade geben vorbereitete Artefakte frei, statt
    sie erneut neu zu bauen
- Für Stable-Korrektur-Releases wie `YYYY.M.D-N` prüft der Verifier nach der Veröffentlichung
  auch denselben Upgrade-Pfad im temporären Präfix von `YYYY.M.D` auf `YYYY.M.D-N`,
  damit Release-Korrekturen ältere globale Installationen nicht stillschweigend auf dem
  Basis-Stable-Payload belassen können
- Das npm-Release-Preflight schlägt fail-closed fehl, es sei denn, das Tarball enthält sowohl
  `dist/control-ui/index.html` als auch ein nicht leeres Payload unter `dist/control-ui/assets/`,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Wenn die Release-Arbeit CI-Planung, Timing-Manifeste von Extensions oder
  Testmatrizen von Extensions berührt hat, generieren und prüfen Sie die vom Planner verwalteten
  Workflow-Matrix-Ausgaben `checks-node-extensions` aus `.github/workflows/ci.yml`
  vor der Freigabe erneut, damit Release Notes kein veraltetes CI-Layout beschreiben
- Zur Stable-macOS-Release-Bereitschaft gehören auch die Updater-Oberflächen:
  - Das GitHub Release muss am Ende das paketierte `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile ZIP zeigen
  - die paketierte App muss eine nicht Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor
    für diese Release-Version behalten

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, darf es auch die aktuelle
  vollständige 40-stellige `main`-Commit-SHA für ein validation-only-Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paketierung, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: erforderlich im echten Veröffentlichungspfad, damit der Workflow das
  vorbereitete Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standard ist `beta`
- `promote_beta_to_latest`: `true`, um die Veröffentlichung zu überspringen und einen bereits veröffentlichten
  stabilen `beta`-Build nach `latest` zu verschieben

`OpenClaw Release Checks` akzeptiert diese operatorgesteuerten Eingaben:

- `ref`: vorhandenes Release-Tag oder die aktuelle vollständige 40-stellige `main`-Commit-
  SHA zur Validierung

Regeln:

- Stable- und Korrektur-Tags dürfen entweder auf `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur auf `beta` veröffentlichen
- Die Eingabe einer vollständigen Commit-SHA ist nur erlaubt, wenn `preflight_only=true`
- Der Commit-SHA-Modus für Release-Checks erfordert ebenfalls den aktuellen `origin/main`-HEAD
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der beim Preflight verwendet wurde;
  der Workflow verifiziert diese Metadaten, bevor die Veröffentlichung fortgesetzt wird
- Der Freigabemodus muss ein Stable- oder Korrektur-Tag, `preflight_only=false`,
  eine leere `preflight_run_id` und `npm_dist_tag=beta` verwenden
- Der Freigabemodus erfordert außerdem ein gültiges `NPM_TOKEN` in der Umgebung
  `npm-release`, da `npm dist-tag add` weiterhin reguläre npm-Authentifizierung benötigt

## Sequenz für stabile npm-Releases

Beim Erstellen eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie die aktuelle vollständige `main`-Commit-SHA für einen
     validation-only-Dry-Run des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder `latest` nur dann,
   wenn Sie absichtlich eine direkte Stable-Veröffentlichung wünschen
3. Führen Sie `OpenClaw Release Checks` separat mit demselben Tag oder der
   vollständigen aktuellen `main`-Commit-SHA aus, wenn Sie Live-Abdeckung für den Prompt-Cache wünschen
   - Dies ist absichtlich getrennt, damit Live-Abdeckung verfügbar bleibt, ohne
     lang laufende oder instabile Checks wieder an den Veröffentlichungs-Workflow zu koppeln
4. Speichern Sie die erfolgreiche `preflight_run_id`
5. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
6. Wenn das Release auf `beta` gelandet ist, führen Sie `OpenClaw NPM Release` später mit demselben
   stabilen `tag`, `promote_beta_to_latest=true`, `preflight_only=false`,
   leerer `preflight_run_id` und `npm_dist_tag=beta` aus, wenn Sie diesen
   veröffentlichten Build nach `latest` verschieben möchten

Der Freigabemodus erfordert weiterhin die Freigabe der Umgebung `npm-release` und ein
gültiges `NPM_TOKEN` in dieser Umgebung.

Damit bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-zuerst-Freigabepfad
dokumentiert und für Operatoren sichtbar.

## Öffentliche Referenzen

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer verwenden die privaten Release-Dokumente in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
für das eigentliche Runbook.
