---
read_when:
    - Você quer usar o GitHub Copilot como provedor de modelo
    - Você precisa do fluxo `openclaw models auth login-github-copilot`
summary: Faça login no GitHub Copilot pelo OpenClaw usando o fluxo de dispositivo
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-05T12:50:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92857c119c314e698f922dbdbbc15d21b64d33a25979a2ec0ac1e82e586db6d6
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

## O que é o GitHub Copilot?

GitHub Copilot é o assistente de programação com IA do GitHub. Ele fornece acesso aos
modelos do Copilot para sua conta e plano do GitHub. O OpenClaw pode usar o Copilot como
provedor de modelo de duas maneiras diferentes.

## Duas maneiras de usar o Copilot no OpenClaw

### 1) Provedor integrado do GitHub Copilot (`github-copilot`)

Use o fluxo nativo de login por dispositivo para obter um token do GitHub e depois trocá-lo por
tokens da API do Copilot quando o OpenClaw for executado. Este é o caminho **padrão** e mais simples
porque não exige o VS Code.

### 2) Plugin Copilot Proxy (`copilot-proxy`)

Use a extensão **Copilot Proxy** do VS Code como uma bridge local. O OpenClaw se comunica com
o endpoint `/v1` do proxy e usa a lista de modelos configurada ali. Escolha isso
quando você já executa o Copilot Proxy no VS Code ou precisa rotear por ele.
Você deve habilitar o plugin e manter a extensão do VS Code em execução.

Use o GitHub Copilot como provedor de modelo (`github-copilot`). O comando de login executa
o fluxo de dispositivo do GitHub, salva um perfil de autenticação e atualiza sua configuração para usar esse
perfil.

## Setup na CLI

```bash
openclaw models auth login-github-copilot
```

Você receberá a solicitação para visitar uma URL e inserir um código de uso único. Mantenha o terminal
aberto até a conclusão.

### Flags opcionais

```bash
openclaw models auth login-github-copilot --yes
```

Para também aplicar o modelo padrão recomendado do provedor em uma única etapa, use o
comando genérico de autenticação:

```bash
openclaw models auth login --provider github-copilot --method device --set-default
```

## Definir um modelo padrão

```bash
openclaw models set github-copilot/gpt-4o
```

### Trecho de configuração

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## Observações

- Exige um TTY interativo; execute-o diretamente em um terminal.
- A disponibilidade de modelos do Copilot depende do seu plano; se um modelo for rejeitado, tente
  outro ID (por exemplo `github-copilot/gpt-4.1`).
- IDs de modelo Claude usam automaticamente o transporte Anthropic Messages; modelos GPT, da série o
  e Gemini mantêm o transporte OpenAI Responses.
- O login armazena um token do GitHub no armazenamento de perfis de autenticação e o troca por um
  token da API do Copilot quando o OpenClaw é executado.
