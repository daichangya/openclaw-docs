---
read_when:
    - Sie möchten Exec-Freigaben über die CLI bearbeiten
    - Sie müssen Allowlists auf Gateway- oder Node-Hosts verwalten
summary: CLI-Referenz für `openclaw approvals` (Exec-Freigaben für Gateway- oder Node-Hosts)
title: approvals
x-i18n:
    generated_at: "2026-04-05T12:37:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2532bfd3e6e6ce43c96a2807df2dd00cb7b4320b77a7dfd09bee0531da610e
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Verwalten Sie Exec-Freigaben für den **lokalen Host**, den **Gateway-Host** oder einen **Node-Host**.
Standardmäßig zielen Befehle auf die lokale Freigabedatei auf der Festplatte. Verwenden Sie `--gateway`, um das Gateway anzusprechen, oder `--node`, um einen bestimmten Node anzusprechen.

Alias: `openclaw exec-approvals`

Verwandt:

- Exec-Freigaben: [Exec approvals](/tools/exec-approvals)
- Nodes: [Nodes](/nodes)

## Häufige Befehle

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` zeigt jetzt die effektive Exec-Richtlinie für lokale Ziele, Gateway-Ziele und Node-Ziele an:

- angeforderte Richtlinie `tools.exec`
- Host-Richtlinie aus der Freigabedatei
- effektives Ergebnis nach Anwendung der Vorrangregeln

Die Priorisierung ist beabsichtigt:

- die Host-Freigabedatei ist die durchsetzbare Quelle der Wahrheit
- die angeforderte Richtlinie `tools.exec` kann die beabsichtigte Wirkung einschränken oder erweitern, aber das effektive Ergebnis wird weiterhin aus den Host-Regeln abgeleitet
- `--node` kombiniert die Freigabedatei des Node-Hosts mit der Gateway-Richtlinie `tools.exec`, da beide zur Laufzeit weiterhin gelten
- wenn die Gateway-Konfiguration nicht verfügbar ist, greift die CLI auf den Freigabe-Snapshot des Node zurück und weist darauf hin, dass die endgültige Laufzeitrichtlinie nicht berechnet werden konnte

## Freigaben aus einer Datei ersetzen

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` akzeptiert JSON5, nicht nur striktes JSON. Verwenden Sie entweder `--file` oder `--stdin`, nicht beides.

## Beispiel „Nie nachfragen“ / YOLO

Setzen Sie für einen Host, der bei Exec-Freigaben niemals anhalten soll, die Standardwerte der Host-Freigaben auf `full` + `off`:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Variante für Node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Dies ändert nur die **Host-Freigabedatei**. Um die angeforderte OpenClaw-Richtlinie in Übereinstimmung zu halten, setzen Sie zusätzlich:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Warum in diesem Beispiel `tools.exec.host=gateway`:

- `host=auto` bedeutet weiterhin „Sandbox, wenn verfügbar, sonst Gateway“.
- Bei YOLO geht es um Freigaben, nicht um Routing.
- Wenn Sie Host-Exec auch dann möchten, wenn eine Sandbox konfiguriert ist, machen Sie die Host-Auswahl explizit mit `gateway` oder `/exec host=gateway`.

Dies entspricht dem aktuellen YOLO-Verhalten mit Host-Standardwerten. Verschärfen Sie es, wenn Sie Freigaben wünschen.

## Allowlist-Helfer

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Häufige Optionen

`get`, `set` und `allowlist add|remove` unterstützen alle:

- `--node <id|name|ip>`
- `--gateway`
- gemeinsame Node-RPC-Optionen: `--url`, `--token`, `--timeout`, `--json`

Hinweise zur Zielauswahl:

- ohne Ziel-Flags wird die lokale Freigabedatei auf der Festplatte verwendet
- `--gateway` zielt auf die Freigabedatei des Gateway-Hosts
- `--node` zielt nach Auflösung von ID, Name, IP oder ID-Präfix auf einen einzelnen Node-Host

`allowlist add|remove` unterstützt außerdem:

- `--agent <id>` (Standard ist `*`)

## Hinweise

- `--node` verwendet denselben Resolver wie `openclaw nodes` (ID, Name, IP oder ID-Präfix).
- `--agent` ist standardmäßig `"*"`, was für alle Agenten gilt.
- Der Node-Host muss `system.execApprovals.get/set` anbieten (macOS-App oder Headless-Node-Host).
- Freigabedateien werden pro Host unter `~/.openclaw/exec-approvals.json` gespeichert.
