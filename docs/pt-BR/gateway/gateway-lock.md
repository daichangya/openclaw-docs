---
read_when:
    - Executando ou depurando o processo do gateway
    - Investigando a imposição de instância única
summary: Proteção singleton do Gateway usando o bind do listener WebSocket
title: Bloqueio do Gateway
x-i18n:
    generated_at: "2026-04-05T12:41:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 726c687ab53f2dd1e46afed8fc791b55310a5c1e62f79a0e38a7dc4ca7576093
    source_path: gateway/gateway-lock.md
    workflow: 15
---

# Bloqueio do Gateway

## Por quê

- Garantir que apenas uma instância do gateway seja executada por porta base no mesmo host; gateways adicionais devem usar perfis isolados e portas exclusivas.
- Sobreviver a falhas/SIGKILL sem deixar arquivos de bloqueio obsoletos.
- Falhar rapidamente com um erro claro quando a porta de controle já estiver ocupada.

## Mecanismo

- O gateway faz o bind do listener WebSocket (padrão `ws://127.0.0.1:18789`) imediatamente na inicialização usando um listener TCP exclusivo.
- Se o bind falhar com `EADDRINUSE`, a inicialização gera `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- O SO libera o listener automaticamente em qualquer encerramento do processo, incluindo falhas e SIGKILL — não é necessário nenhum arquivo de bloqueio separado nem etapa de limpeza.
- No desligamento, o gateway fecha o servidor WebSocket e o servidor HTTP subjacente para liberar a porta rapidamente.

## Superfície de erro

- Se outro processo mantiver a porta, a inicialização gera `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Outras falhas de bind aparecem como `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Observações operacionais

- Se a porta estiver ocupada por _outro_ processo, o erro será o mesmo; libere a porta ou escolha outra com `openclaw gateway --port <port>`.
- O app do macOS ainda mantém sua própria proteção leve por PID antes de iniciar o gateway; o bloqueio de runtime é imposto pelo bind do WebSocket.

## Relacionado

- [Multiple Gateways](/gateway/multiple-gateways) — executando várias instâncias com portas exclusivas
- [Troubleshooting](/gateway/troubleshooting) — diagnosticando `EADDRINUSE` e conflitos de porta
