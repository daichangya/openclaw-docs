---
read_when:
    - Você quer usar a assinatura Claude Max com ferramentas compatíveis com OpenAI
    - Você quer um servidor de API local que envolva a CLI do Claude Code
    - Você quer avaliar acesso Anthropic baseado em assinatura versus baseado em chave de API
summary: Proxy da comunidade para expor credenciais de assinatura do Claude como um endpoint compatível com OpenAI
title: Claude Max API Proxy
x-i18n:
    generated_at: "2026-04-05T12:50:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e125a6a46e48371544adf1331137a1db51e93e905b8c44da482cf2fba180a09
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API Proxy

**claude-max-api-proxy** é uma ferramenta da comunidade que expõe sua assinatura Claude Max/Pro como um endpoint de API compatível com OpenAI. Isso permite usar sua assinatura com qualquer ferramenta que ofereça suporte ao formato de API da OpenAI.

<Warning>
Este caminho é apenas para compatibilidade técnica. A Anthropic já bloqueou alguns usos de assinatura
fora do Claude Code no passado. Cabe a você decidir se quer usá-lo
e verificar os termos atuais da Anthropic antes de depender disso.
</Warning>

## Por que usar isso?

| Abordagem               | Custo                                               | Melhor para                                |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| API da Anthropic        | Pagamento por token (~$15/M de entrada, $75/M de saída para Opus) | Apps de produção, alto volume    |
| Assinatura Claude Max   | $200/mês fixos                                      | Uso pessoal, desenvolvimento, uso ilimitado |

Se você tem uma assinatura Claude Max e quer usá-la com ferramentas compatíveis com OpenAI, esse proxy pode reduzir o custo em alguns fluxos de trabalho. Chaves de API continuam sendo o caminho de política mais claro para uso em produção.

## Como funciona

```
Seu app → claude-max-api-proxy → Claude Code CLI → Anthropic (via assinatura)
(formato OpenAI)              (converte o formato)   (usa seu login)
```

O proxy:

1. Aceita solicitações no formato OpenAI em `http://localhost:3456/v1/chat/completions`
2. Converte essas solicitações em comandos da CLI do Claude Code
3. Retorna respostas no formato OpenAI (streaming com suporte)

## Instalação

```bash
# Requer Node.js 20+ e Claude Code CLI
npm install -g claude-max-api-proxy

# Verifique se a CLI do Claude está autenticada
claude --version
```

## Uso

### Iniciar o servidor

```bash
claude-max-api
# O servidor roda em http://localhost:3456
```

### Teste

```bash
# Verificação de integridade
curl http://localhost:3456/health

# Listar modelos
curl http://localhost:3456/v1/models

# Chat completion
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Com OpenClaw

Você pode apontar o OpenClaw para o proxy como um endpoint personalizado compatível com OpenAI:

```json5
{
  env: {
    OPENAI_API_KEY: "not-needed",
    OPENAI_BASE_URL: "http://localhost:3456/v1",
  },
  agents: {
    defaults: {
      model: { primary: "openai/claude-opus-4" },
    },
  },
}
```

Esse caminho usa a mesma rota compatível com OpenAI no estilo proxy de outros backends
personalizados `/v1`:

- a modelagem de solicitação nativa exclusiva do OpenAI não se aplica
- sem `service_tier`, sem `store` de Responses, sem dicas de cache de prompt e sem
  modelagem de payload compatível com raciocínio do OpenAI
- headers ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
  não são injetados na URL do proxy

## Modelos disponíveis

| ID do modelo       | Mapeia para      |
| ------------------ | ---------------- |
| `claude-opus-4`    | Claude Opus 4    |
| `claude-sonnet-4`  | Claude Sonnet 4  |
| `claude-haiku-4`   | Claude Haiku 4   |

## Início automático no macOS

Crie um LaunchAgent para executar o proxy automaticamente:

```bash
cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.claude-max-api</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
```

## Links

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Observações

- Esta é uma **ferramenta da comunidade**, sem suporte oficial da Anthropic nem do OpenClaw
- Requer uma assinatura ativa do Claude Max/Pro com a Claude Code CLI autenticada
- O proxy roda localmente e não envia dados para servidores de terceiros
- Respostas por streaming têm suporte completo

## Veja também

- [Anthropic provider](/providers/anthropic) - Integração nativa do OpenClaw com Claude CLI ou chaves de API
- [OpenAI provider](/providers/openai) - Para assinaturas do OpenAI/Codex
