---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten Plugin-Ladefehler debuggen
summary: CLI-Referenz für `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-05T12:39:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c35ccf68cd7be1af5fee175bd1ce7de88b81c625a05a23887e5780e790df925
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gateway-Plugins/Erweiterungen, Hook-Pakete und kompatible Bundles verwalten.

Verwandt:

- Plugin-System: [Plugins](/tools/plugin)
- Bundle-Kompatibilität: [Plugin bundles](/plugins/bundles)
- Plugin-Manifest + Schema: [Plugin manifest](/plugins/manifest)
- Security-Härtung: [Security](/gateway/security)

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
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel
gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-
Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem eingebetteten JSON-
Schema (`configSchema`, auch wenn es leer ist) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-
Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Die ausführliche List-/Info-
Ausgabe zeigt außerdem den Bundle-Untertyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-
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

Reine Paketnamen werden zuerst in ClawHub und dann in npm geprüft. Security-Hinweis:
Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie angeheftete Versionen.

Wenn die Konfiguration ungültig ist, schlägt `plugins install` normalerweise sicher fehl und fordert Sie auf,
zuerst `openclaw doctor --fix` auszuführen. Die einzige dokumentierte Ausnahme ist ein enger
Wiederherstellungspfad für gebündelte Plugins für Plugins, die sich ausdrücklich für
`openclaw.install.allowInvalidConfigRecovery` anmelden.

`--force` verwendet das vorhandene Installationsziel wieder und überschreibt ein bereits installiertes
Plugin oder Hook-Paket direkt. Verwenden Sie dies, wenn Sie dieselbe ID bewusst aus einem neuen lokalen Pfad,
Archiv, ClawHub-Paket oder npm-Artefakt neu installieren.

`--pin` gilt nur für npm-Installationen. Es wird mit `--marketplace` nicht unterstützt,
weil Marketplace-Installationen Marketplace-Quellmetadaten statt einer
npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist eine Break-Glass-Option für False Positives
im integrierten Scanner für gefährlichen Code. Damit kann die Installation fortgesetzt werden, selbst
wenn der integrierte Scanner `critical`-Befunde meldet, aber sie **umgeht nicht**
Policy-Blocks von Plugin-`before_install`-Hooks und **umgeht auch keine**
Scan-Fehler.

Dieses CLI-Flag gilt für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Skill-
Abhängigkeitsinstallationen verwenden die passende Request-Überschreibung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` ein separater ClawHub-Skill-
Download-/Installationsablauf bleibt.

`plugins install` ist auch die Installationsoberfläche für Hook-Pakete, die
`openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-
Sichtbarkeit und Hook-spezifische Aktivierung, nicht für Paketinstallation.

Npm-Spezifikationen sind **nur Registry-basiert** (Paketname + optionale **exakte Version** oder
**dist-tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen
zur Sicherheit mit `--ignore-scripts`.

Reine Spezifikationen und `@latest` bleiben auf dem stabilen Track. Wenn npm eines
davon in eine Vorabversion auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem
Vorabversions-Tag wie `@beta`/`@rc` oder einer exakten Vorabversion wie
`@1.2.3-beta.4` anzumelden.

Wenn eine reine Installationsspezifikation einer ID eines gebündelten Plugins entspricht (zum Beispiel `diffs`), installiert OpenClaw
das gebündelte Plugin direkt. Um ein npm-Paket mit demselben
Namen zu installieren, verwenden Sie eine explizite Scoping-Spezifikation (zum Beispiel `@scope/diffs`).

Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Claude-Marketplace-Installationen werden ebenfalls unterstützt.

ClawHub-Installationen verwenden einen expliziten Locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw bevorzugt jetzt auch ClawHub für reine npm-sichere Plugin-Spezifikationen. Es greift nur
auf npm zurück, wenn ClawHub dieses Paket oder diese Version nicht hat:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw lädt das Paketarchiv von ClawHub herunter, prüft die beworbene
Plugin-API-/Mindest-Gateway-Kompatibilität und installiert es dann über den normalen
Archivpfad. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten für spätere
Updates.

Verwenden Sie die Kurzform `plugin@marketplace`, wenn der Marketplace-Name im lokalen
Registry-Cache von Claude unter `~/.claude/plugins/known_marketplaces.json` existiert:

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
- ein lokaler Marketplace-Root oder ein `marketplace.json`-Pfad
- eine GitHub-Repo-Kurzform wie `owner/repo`
- eine GitHub-Repo-URL wie `https://github.com/owner/repo`
- eine Git-URL

Bei Remote-Marketplaces, die von GitHub oder Git geladen werden, müssen Plugin-Einträge
innerhalb des geklonten Marketplace-Repos bleiben. OpenClaw akzeptiert relative Pfadquellen aus
diesem Repo und lehnt HTTP(S)-, Absolute-Pfad-, Git-, GitHub- und andere Nicht-Pfad-
Plugin-Quellen aus Remote-Manifesten ab.

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das Standard-Layout
  für Claude-Komponenten)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

Kompatible Bundles werden im normalen Erweiterungs-Root installiert und nehmen am
gleichen Ablauf für List/Info/Enable/Disable teil. Aktuell werden Bundle-Skills, Claude-
Command-Skills, Claude-`settings.json`-Standards, Claude-`.lsp.json`- /
manifestdeklarierte `lspServers`-Standards, Cursor-Command-Skills und kompatible
Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden
in Diagnose/Info angezeigt, sind aber noch nicht in die Laufzeitausführung eingebunden.

### Auflisten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Verwenden Sie `--enabled`, um nur geladene Plugins anzuzeigen. Verwenden Sie `--verbose`, um von der
Tabellenansicht auf Plugin-spezifische Detailzeilen mit Quell-/Ursprungs-/Versions-/Aktivierungs-
Metadaten umzuschalten. Verwenden Sie `--json` für maschinenlesbares Inventar plus Registry-
Diagnostik.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` wird mit `--link` nicht unterstützt, weil verknüpfte Installationen den
Quellpfad wiederverwenden, statt über ein verwaltetes Installationsziel zu kopieren.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) in
`plugins.installs` zu speichern, während das Standardverhalten ungepinnt bleibt.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Einträge aus `plugins.entries`, `plugins.installs`,
der Plugin-Allowlist und gegebenenfalls verknüpfte `plugins.load.paths`-Einträge.
Für aktive Memory-Plugins wird der Memory-Slot auf `memory-core` zurückgesetzt.

Standardmäßig entfernt `uninstall` auch das Plugin-Installationsverzeichnis unter dem aktiven
Plugin-Root des Statusverzeichnisses. Verwenden Sie
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

Updates gelten für nachverfolgte Installationen in `plugins.installs` und nachverfolgte Hook-Paket-
Installationen in `hooks.internal.installs`.

Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses
Plugin erneut. Das bedeutet, dass zuvor gespeicherte dist-tags wie `@beta` und exakte angeheftete
Versionen auch bei späteren `update <id>`-Läufen weiter verwendet werden.

Bei npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit einem dist-tag
oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen wieder auf den nachverfolgten Plugin-
Eintrag auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für zukünftige
ID-basierte Updates auf.

Wenn ein gespeicherter Integritäts-Hash existiert und sich der Hash des abgerufenen Artefakts ändert,
gibt OpenClaw eine Warnung aus und fordert vor dem Fortfahren eine Bestätigung an. Verwenden Sie
global `--yes`, um Eingabeaufforderungen in CI-/nicht interaktiven Läufen zu umgehen.

`--dangerously-force-unsafe-install` ist auch bei `plugins update` als
Break-Glass-Überschreibung für False Positives des integrierten gefährlichen Code-Scans während
Plugin-Updates verfügbar. Es umgeht weiterhin keine Policy-Blocks von Plugin-`before_install`
und keine Blockierung durch Scan-Fehler, und es gilt nur für Plugin-Updates, nicht für Hook-Paket-
Updates.

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tiefe Inspektion für ein einzelnes Plugin. Zeigt Identität, Ladestatus, Quelle,
registrierte Fähigkeiten, Hooks, Tools, Befehle, Services, Gateway-Methoden,
HTTP-Routen, Policy-Flags, Diagnose, Installationsmetadaten, Bundle-Fähigkeiten
sowie erkannte MCP- oder LSP-Server-Unterstützung.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein reines Provider-Plugin)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Services, aber keine Fähigkeiten

Siehe [Plugin shapes](/plugins/architecture#plugin-shapes) für mehr zum Fähigkeitsmodell.

Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripting und
Auditing eignet.

`inspect --all` rendert eine flächendeckende Tabelle mit Spalten für Shape, Fähigkeitsarten,
Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung.

`info` ist ein Alias für `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Erkennungsdiagnosen und
Kompatibilitätshinweise. Wenn alles sauber ist, wird `No plugin issues
detected.` ausgegeben.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

`Marketplace list` akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine
GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json`
gibt das aufgelöste Quellenlabel sowie das geparste Marketplace-Manifest und
die Plugin-Einträge aus.
