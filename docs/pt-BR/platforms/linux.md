---
read_when:
    - Buscando o status do app complementar para Linux
    - Planejando cobertura de plataforma ou contribuições
    - Depurando kills por OOM no Linux ou saída 137 em uma VPS ou contêiner
summary: Suporte a Linux + status do app complementar
title: App Linux
x-i18n:
    generated_at: "2026-04-23T05:40:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56151406517a1259e66626b8f4b48c16917b10580e7626463afd8a68dc286f7
    source_path: platforms/linux.md
    workflow: 15
---

# App Linux

O Gateway é totalmente compatível com Linux. **Node é o runtime recomendado**.
Bun não é recomendado para o Gateway (bugs no WhatsApp/Telegram).

Apps complementares nativos para Linux estão planejados. Contribuições são bem-vindas se você quiser ajudar a criar um.

## Caminho rápido para iniciantes (VPS)

1. Instale o Node 24 (recomendado; Node 22 LTS, atualmente `22.14+`, ainda funciona por compatibilidade)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Do seu laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Abra `http://127.0.0.1:18789/` e autentique-se com o segredo compartilhado configurado (token por padrão; senha se você definir `gateway.auth.mode: "password"`)

Guia completo do servidor Linux: [Servidor Linux](/pt-BR/vps). Exemplo de VPS passo a passo: [exe.dev](/pt-BR/install/exe-dev)

## Instalação

- [Primeiros passos](/pt-BR/start/getting-started)
- [Instalação e atualizações](/pt-BR/install/updating)
- Fluxos opcionais: [Bun (experimental)](/pt-BR/install/bun), [Nix](/pt-BR/install/nix), [Docker](/pt-BR/install/docker)

## Gateway

- [Runbook do Gateway](/pt-BR/gateway)
- [Configuração](/pt-BR/gateway/configuration)

## Instalação do serviço do Gateway (CLI)

Use um destes:

```
openclaw onboard --install-daemon
```

Ou:

```
openclaw gateway install
```

Ou:

```
openclaw configure
```

Selecione **Serviço do Gateway** quando solicitado.

Reparar/migrar:

```
openclaw doctor
```

## Controle do sistema (unidade de usuário do systemd)

O OpenClaw instala por padrão um serviço de **usuário** do systemd. Use um serviço de **sistema**
para servidores compartilhados ou sempre ativos. `openclaw gateway install` e
`openclaw onboard --install-daemon` já geram para você a unidade canônica atual;
escreva uma manualmente apenas quando precisar de uma configuração personalizada de sistema/gerenciador de serviços.
As orientações completas sobre serviços estão no [Runbook do Gateway](/pt-BR/gateway).

Configuração mínima:

Crie `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

Habilite-o:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Pressão de memória e kills por OOM

No Linux, o kernel escolhe uma vítima de OOM quando um cgroup de host, VM ou contêiner
fica sem memória. O Gateway pode ser uma vítima ruim porque mantém sessões de longa duração
e conexões de canal. Portanto, o OpenClaw tende a fazer com que processos-filho transitórios
sejam mortos antes do Gateway quando possível.

Para spawns elegíveis de processos-filho no Linux, o OpenClaw inicia o filho por meio de um pequeno
wrapper `/bin/sh` que eleva o `oom_score_adj` do próprio filho para `1000` e então
faz `exec` do comando real. Esta é uma operação sem privilégios porque o filho está
apenas aumentando sua própria probabilidade de ser morto por OOM.

As superfícies cobertas de processo-filho incluem:

- filhos de comando gerenciados pelo supervisor,
- filhos de shell PTY,
- filhos de servidor MCP stdio,
- processos de browser/Chrome iniciados pelo OpenClaw.

O wrapper é apenas para Linux e é ignorado quando `/bin/sh` não está disponível. Ele
também é ignorado se o env do filho definir `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` ou `off`.

Para verificar um processo-filho:

```bash
cat /proc/<child-pid>/oom_score_adj
```

O valor esperado para filhos cobertos é `1000`. O processo do Gateway deve manter
sua pontuação normal, geralmente `0`.

Isso não substitui o ajuste normal de memória. Se uma VPS ou contêiner matar filhos repetidamente,
aumente o limite de memória, reduza a concorrência ou adicione controles de recurso mais rígidos, como
`MemoryMax=` do systemd ou limites de memória no nível do contêiner.
