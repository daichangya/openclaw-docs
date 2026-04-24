---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten Plugin-Ladefehler debuggen
summary: CLI-Referenz für `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable`/`disable`, `doctor`)
title: Plugins
x-i18n:
    generated_at: "2026-04-24T06:32:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Verwalten von Gateway-Plugins, Hook-Paketen und kompatiblen Bundles.

Verwandt:

- Plugin-System: [Plugins](/de/tools/plugin)
- Bundle-Kompatibilität: [Plugin-Bundles](/de/plugins/bundles)
- Plugin-Manifest + Schema: [Plugin-Manifest](/de/plugins/manifest)
- Sicherheitshärtung: [Sicherheit](/de/gateway/security)

## Befehle

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel
gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-
Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem Inline-JSON-
Schema (`configSchema`, auch wenn es leer ist) mitliefern. Kompatible Bundles verwenden stattdessen ihre
eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Die ausführliche Ausgabe von `list`/`info`
zeigt außerdem den Bundle-Subtyp (`codex`, `claude` oder `cursor`) plus erkannte Bundle-
Fähigkeiten.

### Installieren

```bash
openclaw plugins install <package>                      # zuerst ClawHub, dann npm
openclaw plugins install clawhub:<package>              # nur ClawHub
openclaw plugins install <package> --force              # vorhandene Installation überschreiben
openclaw plugins install <package> --pin                # Version anheften
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # lokaler Pfad
openclaw plugins install <plugin>@<marketplace>         # Marketplace
openclaw plugins install <plugin> --marketplace <name>  # Marketplace (explizit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Reine Paketnamen werden zuerst gegen ClawHub geprüft, dann gegen npm. Sicherheitshinweis:
Behandeln Sie Plugin-Installationen so, als würden Sie Code ausführen. Bevorzugen Sie angeheftete Versionen.

Wenn Ihr Abschnitt `plugins` durch ein einzelnes `$include` in einer Datei gestützt wird, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei und lassen `openclaw.json` unberührt. Root-Includes, Include-Arrays und Includes mit benachbarten Überschreibungen schlagen fail-closed fehl, anstatt abgeflacht zu werden. Siehe [Config includes](/de/gateway/configuration) für die unterstützten Formen.

Wenn die Konfiguration ungültig ist, schlägt `plugins install` normalerweise fail-closed fehl und fordert Sie auf,
zuerst `openclaw doctor --fix` auszuführen. Die einzige dokumentierte Ausnahme ist ein enger
Wiederherstellungspfad für gebündelte Plugins bei Plugins, die sich ausdrücklich für
`openclaw.install.allowInvalidConfigRecovery` entscheiden.

`--force` verwendet das vorhandene Installationsziel erneut und überschreibt ein bereits installiertes
Plugin oder Hook-Paket direkt. Verwenden Sie dies, wenn Sie absichtlich dieselbe ID von einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren.
Für routinemäßige Upgrades eines bereits verfolgten npm-Plugins bevorzugen Sie
`openclaw plugins update <id-or-npm-spec>`.

Wenn Sie `plugins install` für eine Plugin-ID ausführen, die bereits installiert ist, stoppt OpenClaw
und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>`,
oder auf `plugins install <package> --force`, wenn Sie die
aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

`--pin` gilt nur für npm-Installationen. Es wird mit `--marketplace` nicht unterstützt,
weil Marketplace-Installationen Metadaten zur Marketplace-Quelle statt einer
npm-Spezifikation speichern.

`--dangerously-force-unsafe-install` ist eine Break-Glass-Option für False Positives
im integrierten Scanner für gefährlichen Code. Sie erlaubt die Fortsetzung der Installation,
selbst wenn der integrierte Scanner Befunde vom Typ `critical` meldet, aber sie **umgeht**
keine Plugin-Richtlinienblockaden von `before_install` und **umgeht** keine durch Scans
verursachten Fehler.

Dieses CLI-Flag gilt für Plugin-Installations-/Update-Abläufe. Gateway-gestützte
Abhängigkeitsinstallationen für Skills verwenden die passende Request-Überschreibung
`dangerouslyForceUnsafeInstall`, während `openclaw skills install` ein separater
Download-/Installationsablauf für Skills über ClawHub bleibt.

`plugins install` ist auch die Installationsoberfläche für Hook-Pakete, die
`openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für
gefilterte Hook-Sichtbarkeit und Aktivierung pro Hook, nicht für die Paketinstallation.

Npm-Spezifikationen sind **nur Registry-basiert** (Paketname plus optional **exakte Version** oder
**dist-tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeits-
Installationen laufen aus Sicherheitsgründen mit `--ignore-scripts`.

Reine Spezifikationen und `@latest` bleiben auf dem stabilen Track. Wenn npm eines
davon auf eine Vorabversion auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem
Vorabversions-Tag wie `@beta`/`@rc` oder einer exakten Vorabversionsnummer wie
`@1.2.3-beta.4` dafür zu entscheiden.

Wenn eine reine Installationsspezifikation einer ID eines gebündelten Plugins entspricht (zum Beispiel `diffs`), installiert OpenClaw
das gebündelte Plugin direkt. Um ein npm-Paket mit demselben
Namen zu installieren, verwenden Sie eine explizite Scoped-Spezifikation (zum Beispiel `@scope/diffs`).

Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Claude-Marketplace-Installationen werden ebenfalls unterstützt.

ClawHub-Installationen verwenden einen expliziten Locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw bevorzugt jetzt auch ClawHub für reine npm-sichere Plugin-Spezifikationen. Es fällt nur dann
auf npm zurück, wenn ClawHub dieses Paket oder diese Version nicht hat:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw lädt das Paketarchiv von ClawHub herunter, prüft die beworbene
Kompatibilität der Plugin-API / des minimalen Gateway und installiert es dann über den normalen
Archivpfad. Erfasste Installationen behalten ihre Metadaten zur ClawHub-Quelle für spätere
Updates.

Verwenden Sie die Kurzform `plugin@marketplace`, wenn der Marketplace-Name im lokalen Registry-Cache von Claude unter `~/.claude/plugins/known_marketplaces.json` vorhanden ist:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Verwenden Sie `--marketplace`, wenn Sie die Marketplace-Quelle explizit übergeben möchten:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Marketplace-Quellen können sein:

- ein Claude-known-marketplace-Name aus `~/.claude/plugins/known_marketplaces.json`
- ein lokaler Marketplace-Root oder ein Pfad zu `marketplace.json`
- eine GitHub-Repo-Kurzform wie `owner/repo`
- eine GitHub-Repo-URL wie `https://github.com/owner/repo`
- eine Git-URL

Für Remote-Marketplaces, die aus GitHub oder Git geladen werden, müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repositorys bleiben. OpenClaw akzeptiert relative Pfadquellen aus
diesem Repo und lehnt HTTP(S)-, absolute Pfad-, Git-, GitHub- und andere Nicht-Pfad-
Plugin-Quellen aus Remote-Manifesten ab.

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das Standard-Layout für Claude-
  Komponenten)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

Kompatible Bundles werden in den normalen Plugin-Root installiert und nehmen
am selben Ablauf für `list`/`info`/`enable`/`disable` teil. Derzeit werden Bundle-Skills, Claude-
Befehls-Skills, Claude-Standardeinstellungen aus `settings.json`, Claude `.lsp.json` /
Manifest-definierte Standards für `lspServers`, Cursor-Befehls-Skills und kompatible
Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden
in Diagnosen/`info` angezeigt, sind aber noch nicht in die Runtime-Ausführung eingebunden.

### Auflisten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Verwenden Sie `--enabled`, um nur geladene Plugins anzuzeigen. Verwenden Sie `--verbose`, um von der
Tabellenansicht zu detaillierten Zeilen pro Plugin mit Metadaten zu Quelle/Ursprung/Version/Aktivierung
zu wechseln. Verwenden Sie `--json` für ein maschinenlesbares Inventar plus Registry-
Diagnosen.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` wird mit `--link` nicht unterstützt, weil verlinkte Installationen den
Quellpfad wiederverwenden, anstatt über ein verwaltetes Installationsziel zu kopieren.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) in
`plugins.installs` zu speichern, während das Standardverhalten nicht angeheftet bleibt.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Einträge aus `plugins.entries`, `plugins.installs`,
der Plugin-Allowlist und verlinkte Einträge in `plugins.load.paths`, falls zutreffend.
Bei aktiven Memory-Plugins wird der Memory-Slot auf `memory-core` zurückgesetzt.

Standardmäßig entfernt `uninstall` auch das Plugin-Installationsverzeichnis unter dem aktiven
Plugin-Root des State-Dir. Verwenden Sie
`--keep-files`, um Dateien auf dem Datenträger zu behalten.

`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.

### Aktualisieren

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates gelten für verfolgte Installationen in `plugins.installs` und verfolgte Hook-Pack-
Installationen in `hooks.internal.installs`.

Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die für dieses
Plugin gespeicherte Installationsspezifikation erneut. Das bedeutet, dass zuvor gespeicherte dist-tags wie `@beta` und
exakte angeheftete Versionen auch bei späteren Ausführungen von `update <id>` weiterverwendet werden.

Für npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit einem dist-tag
oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen zurück auf den verfolgten Plugin-
Eintrag auf, aktualisiert dieses installierte Plugin und speichert die neue npm-Spezifikation für zukünftige
ID-basierte Updates.

Die Übergabe des npm-Paketnamens ohne Version oder Tag wird ebenfalls auf den verfolgten Plugin-
Eintrag zurückgeführt. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version angeheftet war und
Sie es zurück auf die Standard-Release-Linie der Registry verschieben möchten.

Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion gegen
die npm-Registry-Metadaten. Wenn die installierte Version und die gespeicherte Artefakt-
Identität bereits mit dem aufgelösten Ziel übereinstimmen, wird das Update übersprungen, ohne
etwas herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

Wenn ein gespeicherter Integrity-Hash existiert und sich der Hash des abgerufenen Artefakts ändert,
behandelt OpenClaw dies als npm-Artefaktdrift. Der interaktive
Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt
vor dem Fortfahren nach einer Bestätigung. Nicht interaktive Update-Helfer schlagen fail-closed fehl,
sofern der Aufrufer keine explizite Fortsetzungsrichtlinie angibt.

`--dangerously-force-unsafe-install` ist auch bei `plugins update` als
Break-Glass-Überschreibung für False Positives des integrierten Scans auf gefährlichen Code während
Plugin-Updates verfügbar. Es umgeht weiterhin keine Plugin-Richtlinienblockaden von `before_install`
oder blockierende Scan-Fehler und gilt nur für Plugin-Updates, nicht für Hook-Pack-
Updates.

### Prüfen

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tiefe Introspektion für ein einzelnes Plugin. Zeigt Identität, Ladestatus, Quelle,
registrierte Fähigkeiten, Hooks, Tools, Befehle, Dienste, Gateway-Methoden,
HTTP-Routen, Richtlinien-Flags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten
sowie erkannte Unterstützung für MCP- oder LSP-Server.

Jedes Plugin wird danach klassifiziert, was es tatsächlich zur Laufzeit registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein Plugin nur für einen Provider)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Dienste, aber keine Fähigkeiten

Siehe [Plugin shapes](/de/plugins/architecture#plugin-shapes) für weitere Informationen zum Fähigkeitsmodell.

Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripting und
Auditing eignet.

`inspect --all` rendert eine fleetweite Tabelle mit Spalten für Shape, Fähigkeitsarten,
Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung.

`info` ist ein Alias für `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Discovery-Diagnosen und
Kompatibilitätshinweise. Wenn alles sauber ist, wird `No plugin issues
detected.` ausgegeben.

Bei Fehlern der Modulform wie fehlenden Exporten `register`/`activate` führen Sie den Befehl
mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` erneut aus, um eine kompakte Zusammenfassung der Exportform in
der Diagnoseausgabe einzuschließen.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

`marketplace list` akzeptiert einen lokalen Marketplace-Pfad, einen Pfad zu `marketplace.json`, eine
GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json`
gibt das aufgelöste Quellenlabel sowie das geparste Marketplace-Manifest und
Plugin-Einträge aus.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Community-Plugins](/de/plugins/community)
