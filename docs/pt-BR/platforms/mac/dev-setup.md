---
read_when:
    - Configurando o ambiente de desenvolvimento do macOS
summary: Guia de configuração para desenvolvedores que trabalham no app macOS do OpenClaw
title: Configuração de desenvolvimento do macOS
x-i18n:
    generated_at: "2026-04-05T12:47:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd13f17391bdd87ef59e4c575e5da3312c4066de00905731263bff655a5db357
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Configuração para desenvolvedores no macOS

Este guia cobre as etapas necessárias para compilar e executar o aplicativo macOS do OpenClaw a partir do código-fonte.

## Pré-requisitos

Antes de compilar o app, verifique se você tem o seguinte instalado:

1. **Xcode 26.2+**: Necessário para desenvolvimento em Swift.
2. **Node.js 24 & pnpm**: Recomendado para o gateway, a CLI e os scripts de empacotamento. O Node 22 LTS, atualmente `22.14+`, continua compatível por questões de compatibilidade.

## 1. Instalar dependências

Instale as dependências de todo o projeto:

```bash
pnpm install
```

## 2. Compilar e empacotar o app

Para compilar o app macOS e empacotá-lo em `dist/OpenClaw.app`, execute:

```bash
./scripts/package-mac-app.sh
```

Se você não tiver um certificado Apple Developer ID, o script usará automaticamente **assinatura ad hoc** (`-`).

Para modos de execução de desenvolvimento, flags de assinatura e solução de problemas de Team ID, consulte o README do app macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Observação**: Apps assinados ad hoc podem acionar prompts de segurança. Se o app falhar imediatamente com "Abort trap 6", consulte a seção de [Solução de problemas](#troubleshooting).

## 3. Instalar a CLI

O app macOS espera uma instalação global da CLI `openclaw` para gerenciar tarefas em segundo plano.

**Para instalá-la (recomendado):**

1. Abra o app OpenClaw.
2. Vá para a aba de configurações **General**.
3. Clique em **"Install CLI"**.

Como alternativa, instale manualmente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>` também funcionam.
Para o runtime do Gateway, Node continua sendo o caminho recomendado.

## Solução de problemas

### A compilação falha: incompatibilidade de toolchain ou SDK

A compilação do app macOS espera o SDK mais recente do macOS e a toolchain Swift 6.2.

**Dependências do sistema (necessárias):**

- **Versão mais recente do macOS disponível no Atualização de Software** (necessária para os SDKs do Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Verificações:**

```bash
xcodebuild -version
xcrun swift --version
```

Se as versões não corresponderem, atualize o macOS/Xcode e execute a compilação novamente.

### O app falha ao conceder permissão

Se o app falhar quando você tentar permitir acesso a **Speech Recognition** ou **Microphone**, isso pode ser devido a um cache TCC corrompido ou a uma incompatibilidade de assinatura.

**Correção:**

1. Redefina as permissões TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se isso não funcionar, altere temporariamente o `BUNDLE_ID` em [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) para forçar uma "folha em branco" no macOS.

### Gateway em "Starting..." indefinidamente

Se o status do gateway permanecer em "Starting...", verifique se um processo zumbi está mantendo a porta ocupada:

```bash
openclaw gateway status
openclaw gateway stop

# Se você não estiver usando um LaunchAgent (modo de desenvolvimento / execuções manuais), encontre o listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se uma execução manual estiver mantendo a porta ocupada, interrompa esse processo (Ctrl+C). Como último recurso, finalize o PID encontrado acima.
