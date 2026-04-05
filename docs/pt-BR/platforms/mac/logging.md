---
read_when:
    - Capturar logs do macOS ou investigar o registro de dados privados
    - Depurar problemas do ciclo de vida da ativação por voz/sessão
summary: 'Registro do OpenClaw: arquivo de diagnóstico rotativo + sinalizadores de privacidade do log unificado'
title: Registro em log no macOS
x-i18n:
    generated_at: "2026-04-05T12:47:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: c08d6bc012f8e8bb53353fe654713dede676b4e6127e49fd76e00c2510b9ab0b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Registro em log (macOS)

## Arquivo de diagnóstico rotativo (painel Debug)

O OpenClaw encaminha os logs do app no macOS por meio de `swift-log` (registro unificado por padrão) e pode gravar um arquivo de log local rotativo em disco quando você precisar de uma captura persistente.

- Verbosidade: **painel Debug → Logs → App logging → Verbosity**
- Ativar: **painel Debug → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Localização: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (rotaciona automaticamente; arquivos antigos recebem os sufixos `.1`, `.2`, …)
- Limpar: **painel Debug → Logs → App logging → “Clear”**

Observações:

- Isso fica **desativado por padrão**. Ative apenas enquanto estiver depurando ativamente.
- Trate o arquivo como sensível; não o compartilhe sem revisão.

## Dados privados no registro unificado em log no macOS

O registro unificado em log oculta a maior parte das cargas úteis, a menos que um subsistema opte por `privacy -off`. Segundo o texto de Peter sobre [artimanhas de privacidade do registro em log](https://steipete.me/posts/2025/logging-privacy-shenanigans) no macOS (2025), isso é controlado por um plist em `/Library/Preferences/Logging/Subsystems/`, indexado pelo nome do subsistema. Somente novas entradas de log passam a usar essa sinalização, então ative-a antes de reproduzir um problema.

## Ativar para o OpenClaw (`ai.openclaw`)

- Primeiro grave o plist em um arquivo temporário e depois instale-o atomicamente como root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- Não é necessário reiniciar; o `logd` detecta o arquivo rapidamente, mas apenas novas linhas de log incluirão cargas úteis privadas.
- Veja a saída mais detalhada com o helper existente, por exemplo: `./scripts/clawlog.sh --category WebChat --last 5m`.

## Desativar após a depuração

- Remova a substituição: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opcionalmente, execute `sudo log config --reload` para forçar o `logd` a descartar a substituição imediatamente.
- Lembre-se de que essa superfície pode incluir números de telefone e corpos de mensagens; mantenha o plist ativo apenas enquanto você realmente precisar do nível extra de detalhe.
