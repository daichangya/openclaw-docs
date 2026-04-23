---
read_when:
    - Sie möchten Gateway Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten Fehler beim Laden von Plugins debuggen
summary: CLI-Referenz für `openclaw plugins` (list, install, Marketplace, uninstall, aktivieren/deaktivieren, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-23T14:00:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469364823c0766f6534c5d7eee963877f98fe23ecfa45251696a34ef65d57599
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gateway Plugins, Hook-Pakete und kompatible Bundles verwalten.

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

Native OpenClaw Plugins müssen `openclaw.plugin.json` mit einem eingebetteten JSON-
Schema (`configSchema`, auch wenn es leer ist) enthalten. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-
Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Die ausführliche Ausgabe von list/info
zeigt außerdem den Bundle-Untertyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-
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

Unqualifizierte Paketnamen werden zuerst gegen ClawHub und danach gegen npm geprüft. Sicherheitshinweis:
Behandeln Sie Plugin-Installationen so, als würden Sie Code ausführen. Bevorzugen Sie angeheftete Versionen.

Wenn Ihr Abschnitt `plugins` durch ein einzelnes `$include` in einer Datei unterstützt wird, schreiben
`plugins install/update/enable/disable/uninstall` in diese eingebundene Datei und lassen
`openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit überschreibenden
Geschwistereinträgen schlagen geschlossen fehl, statt abgeflacht zu werden. Siehe [Config includes](/de/gateway/configuration) für die unterstützten Formen.

Wenn die Konfiguration ungültig ist, schlägt `plugins install` normalerweise geschlossen fehl und weist Sie an,
zuerst `openclaw doctor --fix` auszuführen. Die einzige dokumentierte Ausnahme ist ein enger
Wiederherstellungspfad für gebündelte Plugins für Plugins, die sich ausdrücklich für
`openclaw.install.allowInvalidConfigRecovery` entscheiden.

`--force` verwendet das vorhandene Installationsziel erneut und überschreibt ein bereits installiertes
Plugin oder Hook-Paket direkt vor Ort. Verwenden Sie dies, wenn Sie absichtlich dieselbe ID
aus einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt erneut installieren.
Für routinemäßige Upgrades eines bereits verfolgten npm-Plugins verwenden Sie bevorzugt
`openclaw plugins update <id-or-npm-spec>`.

Wenn Sie `plugins install` für eine Plugin-ID ausführen, die bereits installiert ist, stoppt OpenClaw
und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>`
oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich
aus einer anderen Quelle überschreiben möchten.

`--pin` gilt nur für npm-Installationen. Es wird mit `--marketplace` nicht unterstützt,
da Marketplace-Installationen Marketplace-Quellmetadaten statt einer
npm-Spezifikation speichern.

`--dangerously-force-unsafe-install` ist eine Notfalloption für Fehlalarme
im integrierten Scanner für gefährlichen Code. Sie erlaubt der Installation fortzufahren, auch
wenn der integrierte Scanner `critical`-Befunde meldet, aber sie umgeht **nicht**
Richtlinienblockierungen durch Plugin-`before_install`-Hooks und umgeht **nicht** Scan-
Fehlschläge.

Dieses CLI-Flag gilt für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Skill-
Abhängigkeitsinstallationen verwenden die entsprechende Anfrageüberschreibung
`dangerouslyForceUnsafeInstall`, während `openclaw skills install` ein separater ClawHub-Skill-
Download-/Installationsablauf bleibt.

`plugins install` ist auch die Installationsoberfläche für Hook-Pakete, die
`openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-
Sichtbarkeit und Aktivierung pro Hook, nicht für die Paketinstallation.

Npm-Spezifikationen sind **nur Registry-Spezifikationen** (Paketname + optionale **exakte Version** oder
**Dist-Tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeits-
Installationen laufen aus Sicherheitsgründen mit `--ignore-scripts`.

Unqualifizierte Spezifikationen und `@latest` bleiben auf dem stabilen Track. Wenn npm eine von beiden
auf ein Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich ausdrücklich mit einem
Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version wie
`@1.2.3-beta.4` dafür zu entscheiden.

Wenn eine unqualifizierte Installationsspezifikation zu einer gebündelten Plugin-ID passt (zum Beispiel `diffs`), installiert OpenClaw
das gebündelte Plugin direkt. Um ein npm-Paket mit demselben Namen zu installieren,
verwenden Sie eine explizite Scoped-Spezifikation (zum Beispiel `@scope/diffs`).

Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Installationen aus dem Claude Marketplace werden ebenfalls unterstützt.

ClawHub-Installationen verwenden einen expliziten Locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw bevorzugt jetzt auch ClawHub für unqualifizierte npm-sichere Plugin-Spezifikationen. Es greift nur dann
auf npm zurück, wenn ClawHub dieses Paket oder diese Version nicht hat:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw lädt das Paketarchiv von ClawHub herunter, prüft die beworbene
Plugin-API- / Mindest-Gateway-Kompatibilität und installiert es dann über den normalen
Archivpfad. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten für spätere
Updates.

Verwenden Sie die Kurzform `plugin@marketplace`, wenn der Marketplace-Name im lokalen Registry-Cache von Claude unter `~/.claude/plugins/known_marketplaces.json` existiert:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Verwenden Sie `--marketplace`, wenn Sie die Marketplace-Quelle explizit angeben möchten:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Marketplace-Quellen können sein:

- ein Claude-Known-Marketplace-Name aus `~/.claude/plugins/known_marketplaces.json`
- ein lokaler Marketplace-Root oder ein Pfad zu `marketplace.json`
- eine GitHub-Repo-Kurzform wie `owner/repo`
- eine GitHub-Repo-URL wie `https://github.com/owner/repo`
- eine Git-URL

Für entfernte Marketplaces, die von GitHub oder Git geladen werden, müssen Plugin-Einträge
innerhalb des geklonten Marketplace-Repos bleiben. OpenClaw akzeptiert relative Pfadquellen aus
diesem Repo und lehnt HTTP(S)-, absolute Pfad-, Git-, GitHub- und andere Nicht-Pfad-
Plugin-Quellen aus entfernten Manifesten ab.

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das Standard-Layout der Claude-
  Komponenten)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

Kompatible Bundles werden im normalen Plugin-Root installiert und nehmen
am selben list/info/enable/disable-Ablauf teil. Heute werden Bundle-Skills, Claude
command-skills, Claude-Standardwerte aus `settings.json`, Claude `.lsp.json` /
manifestdeklarierte Standardwerte für `lspServers`, Cursor command-skills und kompatible
Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden
in Diagnosen/info angezeigt, sind aber noch nicht an die Laufzeitausführung angebunden.

### Auflisten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Verwenden Sie `--enabled`, um nur geladene Plugins anzuzeigen. Verwenden Sie `--verbose`, um von der
Tabellenansicht auf Detailzeilen pro Plugin mit Metadaten zu Quelle/Ursprung/Version/Aktivierung
umzuschalten. Verwenden Sie `--json` für maschinenlesbares Inventar plus Registry-
Diagnosen.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` wird mit `--link` nicht unterstützt, weil verlinkte Installationen den
Quellpfad wiederverwenden, statt über ein verwaltetes Installationsziel zu kopieren.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) in
`plugins.installs` zu speichern, während das Standardverhalten nicht angeheftet bleibt.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Einträge aus `plugins.entries`, `plugins.installs`,
der Plugin-Zulassungsliste und verlinkten Einträgen in `plugins.load.paths`, wenn zutreffend.
Bei Active Memory Plugins wird der Speicher-Slot auf `memory-core` zurückgesetzt.

Standardmäßig entfernt die Deinstallation auch das Plugin-Installationsverzeichnis unter dem aktiven
State-Dir-Plugin-Root. Verwenden Sie
`--keep-files`, um Dateien auf der Festplatte zu behalten.

`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.

### Aktualisieren

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates gelten für verfolgte Installationen in `plugins.installs` und verfolgte Hook-Paket-
Installationen in `hooks.internal.installs`.

Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die für dieses
Plugin aufgezeichnete Installationsspezifikation erneut. Das bedeutet, dass zuvor gespeicherte Dist-Tags wie `@beta`
und exakte angeheftete Versionen auch bei späteren Läufen von `update <id>` weiterverwendet werden.

Bei npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit Dist-Tag
oder exakter Version übergeben. OpenClaw löst diesen Paketnamen zurück auf den verfolgten Plugin-
Eintrag auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für zukünftige
ID-basierte Updates auf.

Die Übergabe des npm-Paketnamens ohne Version oder Tag wird ebenfalls zurück auf den
verfolgten Plugin-Eintrag aufgelöst. Verwenden Sie dies, wenn ein Plugin an eine exakte Version angeheftet war und
Sie es zurück auf die Standard-Release-Linie der Registry bringen möchten.

Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion gegen die npm-Registry-Metadaten.
Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits dem aufgelösten Ziel entsprechen,
wird das Update übersprungen, ohne herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

Wenn ein gespeicherter Integritäts-Hash existiert und sich der Hash des abgerufenen Artefakts ändert,
behandelt OpenClaw dies als npm-Artefakt-Drift. Der interaktive
Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt
vor dem Fortfahren nach Bestätigung. Nicht interaktive Update-Helfer schlagen geschlossen fehl,
sofern der Aufrufer keine explizite Fortsetzungsrichtlinie angibt.

`--dangerously-force-unsafe-install` ist auch bei `plugins update` als
Notfallüberschreibung für Fehlalarme bei integrierten Scans auf gefährlichen Code während
Plugin-Updates verfügbar. Es umgeht weiterhin keine Plugin-`before_install`-Richtlinienblockierungen
oder Blockierungen wegen fehlgeschlagener Scans, und es gilt nur für Plugin-Updates, nicht für Hook-Paket-
Updates.

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tiefe Inspektion für ein einzelnes Plugin. Zeigt Identität, Ladestatus, Quelle,
registrierte Fähigkeiten, Hooks, Tools, Befehle, Services, Gateway-Methoden,
HTTP-Routen, Richtlinien-Flags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten
sowie jede erkannte MCP- oder LSP-Server-Unterstützung.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein reines Provider-Plugin)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Services, aber keine Fähigkeiten

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

Bei Modul-Shape-Fehlern wie fehlenden Exporten `register`/`activate` führen Sie den Befehl erneut
mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um in der Diagnoseausgabe eine kompakte Zusammenfassung der Export-Shape einzuschließen.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list akzeptiert einen lokalen Marketplace-Pfad, einen Pfad zu `marketplace.json`, eine
GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json`
gibt das aufgelöste Quellenlabel plus das geparste Marketplace-Manifest und
Plugin-Einträge aus.
