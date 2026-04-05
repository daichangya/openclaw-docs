---
read_when:
    - Sie möchten GitHub Copilot als Model-Provider verwenden
    - Sie benötigen den Ablauf `openclaw models auth login-github-copilot`
summary: Melden Sie sich über den Device-Flow aus OpenClaw bei GitHub Copilot an
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-05T12:52:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92857c119c314e698f922dbdbbc15d21b64d33a25979a2ec0ac1e82e586db6d6
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

## Was ist GitHub Copilot?

GitHub Copilot ist der KI-Coding-Assistent von GitHub. Er bietet Zugriff auf Copilot-
Modelle für Ihr GitHub-Konto und Ihren Tarif. OpenClaw kann Copilot auf zwei verschiedene Arten
als Model-Provider verwenden.

## Zwei Möglichkeiten, Copilot in OpenClaw zu verwenden

### 1) Integrierter GitHub-Copilot-Provider (`github-copilot`)

Verwenden Sie den nativen Device-Login-Ablauf, um ein GitHub-Token zu erhalten, und tauschen Sie es dann gegen
Copilot-API-Tokens aus, wenn OpenClaw ausgeführt wird. Dies ist der **Standard** und der einfachste Weg,
weil dafür kein VS Code erforderlich ist.

### 2) Plugin „Copilot Proxy“ (`copilot-proxy`)

Verwenden Sie die VS-Code-Erweiterung **Copilot Proxy** als lokale Bridge. OpenClaw kommuniziert mit
dem `/v1`-Endpunkt des Proxys und verwendet die dort konfigurierte Model-Liste. Wählen
Sie dies, wenn Sie Copilot Proxy bereits in VS Code ausführen oder den Datenverkehr darüber leiten müssen.
Sie müssen das Plugin aktivieren und die VS-Code-Erweiterung weiterhin ausführen lassen.

Verwenden Sie GitHub Copilot als Model-Provider (`github-copilot`). Der Login-Befehl führt
den GitHub-Device-Flow aus, speichert ein Auth-Profil und aktualisiert Ihre Konfiguration so, dass dieses
Profil verwendet wird.

## CLI-Einrichtung

```bash
openclaw models auth login-github-copilot
```

Sie werden aufgefordert, eine URL zu öffnen und einen Einmalcode einzugeben. Lassen Sie das Terminal
geöffnet, bis der Vorgang abgeschlossen ist.

### Optionale Flags

```bash
openclaw models auth login-github-copilot --yes
```

Um außerdem in einem Schritt das empfohlene Standard-Model des Providers anzuwenden, verwenden Sie stattdessen
den generischen Auth-Befehl:

```bash
openclaw models auth login --provider github-copilot --method device --set-default
```

## Ein Standard-Model festlegen

```bash
openclaw models set github-copilot/gpt-4o
```

### Konfigurationsausschnitt

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## Hinweise

- Erfordert ein interaktives TTY; führen Sie es direkt in einem Terminal aus.
- Die Verfügbarkeit von Copilot-Modellen hängt von Ihrem Tarif ab; wenn ein Model abgelehnt wird, versuchen Sie
  eine andere ID (zum Beispiel `github-copilot/gpt-4.1`).
- Claude-Model-IDs verwenden automatisch den Anthropic-Messages-Transport; GPT-, o-series-
  und Gemini-Modelle verwenden weiterhin den OpenAI-Responses-Transport.
- Der Login speichert ein GitHub-Token im Auth-Profilspeicher und tauscht es gegen ein
  Copilot-API-Token aus, wenn OpenClaw ausgeführt wird.
