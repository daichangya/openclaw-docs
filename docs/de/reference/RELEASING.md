---
read_when:
    - Suche nach öffentlichen Definitionen von Release-Kanälen
    - Suche nach Versionsbenennung und Release-Taktung
summary: Öffentliche Release-Kanäle, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-04-05T12:54:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb52a13264c802395aa55404c6baeec5c7b2a6820562e7a684057e70cc85668f
    source_path: reference/RELEASING.md
    workflow: 15
---

# Release-Richtlinie

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder auf ausdrücklichen Wunsch auf npm `latest`
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der fortlaufende Head von `main`

## Versionsbenennung

- Version eines Stable-Releases: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Version eines Stable-Korrektur-Releases: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Version eines Beta-Prereleases: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuell promotete stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können explizit `latest` als Ziel wählen oder später einen geprüften Beta-Build promoten
- Jedes OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus

## Release-Taktung

- Releases gehen zuerst über beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Das detaillierte Release-Verfahren, Freigaben, Zugangsdaten und Hinweise zur Wiederherstellung sind
  nur für Maintainer bestimmt

## Release-Preflight

- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  `dist/*`-Release-Artefakte und das Bundle der Control UI für den
  Schritt der Pack-Validierung vorhanden sind
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Der npm-Preflight für den Main-Branch führt außerdem
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  vor dem Paketieren des Tarballs aus und verwendet dabei sowohl die Workflow-Secrets
  `OPENAI_API_KEY` als auch `ANTHROPIC_API_KEY`
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder das passende Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach dem npm-Publish
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrekturversion) aus, um den veröffentlichten Registry-
  Installationspfad in einem neuen temporären Präfix zu verifizieren
- Die Release-Automatisierung für Maintainer verwendet jetzt Preflight-dann-Promote:
  - echtes npm-Publish muss einen erfolgreichen npm-`preflight_run_id` bestehen
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabiles npm-Publish kann über Workflow-Eingabe explizit `latest` als Ziel verwenden
  - die Promotion eines stabilen npm-Releases von `beta` nach `latest` bleibt weiterhin als expliziter manueller Modus im vertrauenswürdigen Workflow `OpenClaw NPM Release` verfügbar
  - dieser Promotionsmodus benötigt weiterhin ein gültiges `NPM_TOKEN` in der Umgebung `npm-release`, da die Verwaltung von npm-`dist-tag` vom vertrauenswürdigen Publishing getrennt ist
  - öffentliches `macOS Release` dient nur der Validierung
  - echter privater mac-Publish muss erfolgreiche private mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Publish-Pfade promoten vorbereitete Artefakte, statt sie
    erneut zu bauen
- Bei Stable-Korrektur-Releases wie `YYYY.M.D-N` prüft der Verifier nach dem Publish
  außerdem denselben Upgrade-Pfad mit temporärem Präfix von `YYYY.M.D` auf `YYYY.M.D-N`,
  damit Release-Korrekturen nicht stillschweigend ältere globale Installationen
  auf der Basis-Payload des Stable-Releases belassen
- Der npm-Release-Preflight schlägt fail-closed fehl, sofern der Tarball nicht sowohl
  `dist/control-ui/index.html` als auch eine nicht leere Payload in `dist/control-ui/assets/` enthält,
  damit nicht erneut ein leeres Browser-Dashboard ausgeliefert wird
- Wenn die Release-Arbeit die CI-Planung, Timing-Manifeste von Erweiterungen oder schnelle
  Testmatrizen berührt hat, generieren und prüfen Sie die planer-eigenen Workflow-Matrix-Ausgaben
  `checks-fast-extensions` aus `.github/workflows/ci.yml`
  vor der Freigabe neu, damit Release-Notes keine veraltete CI-Struktur beschreiben
- Die Bereitschaft für stabile macOS-Releases umfasst auch die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die paketierten Dateien `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach dem Publish auf die neue stabile ZIP-Datei zeigen
  - die paketierte App muss eine nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` beibehalten, die mindestens dem kanonischen Sparkle-Build-Mindestwert
    für diese Release-Version entspricht

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`
- `preflight_only`: `true` nur für Validierung/Build/Paketierung, `false` für den
  echten Publish-Pfad
- `preflight_run_id`: erforderlich auf dem echten Publish-Pfad, damit der Workflow
  den vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Publish-Pfad; Standard ist `beta`
- `promote_beta_to_latest`: `true`, um den Publish zu überspringen und einen bereits veröffentlichten
  stabilen `beta`-Build auf `latest` zu verschieben

Regeln:

- Stable- und Korrektur-Tags dürfen entweder auf `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur auf `beta` veröffentlichen
- Der echte Publish-Pfad muss denselben `npm_dist_tag` verwenden, der während des Preflight verwendet wurde;
  der Workflow verifiziert diese Metadaten, bevor der Publish fortgesetzt wird
- Der Promotionsmodus muss ein Stable- oder Korrektur-Tag, `preflight_only=false`,
  einen leeren `preflight_run_id` und `npm_dist_tag=beta` verwenden
- Der Promotionsmodus erfordert außerdem ein gültiges `NPM_TOKEN` in der Umgebung
  `npm-release`, da `npm dist-tag add` weiterhin normale npm-Authentifizierung benötigt

## Ablauf für stabile npm-Releases

Beim Erstellen eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-zuerst-Ablauf oder `latest` nur dann,
   wenn Sie absichtlich direkt stabil veröffentlichen möchten
3. Speichern Sie die erfolgreiche `preflight_run_id`
4. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
5. Wenn das Release auf `beta` gelandet ist, führen Sie `OpenClaw NPM Release` später mit demselben
   stabilen `tag`, `promote_beta_to_latest=true`, `preflight_only=false`,
   leerem `preflight_run_id` und `npm_dist_tag=beta` aus, wenn Sie diesen
   veröffentlichten Build auf `latest` verschieben möchten

Der Promotionsmodus benötigt weiterhin die Freigabe der Umgebung `npm-release` und ein
gültiges `NPM_TOKEN` in dieser Umgebung.

Dadurch bleiben sowohl der direkte Publish-Pfad als auch der Beta-zuerst-Promotionspfad
dokumentiert und für Operatoren sichtbar.

## Öffentliche Referenzen

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer verwenden die privaten Release-Dokumente in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
als eigentliche Runbook-Dokumentation.
