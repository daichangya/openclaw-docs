---
read_when:
    - Você está movendo o OpenClaw para um novo laptop/servidor
    - Você quer preservar sessões, autenticação e logins de canais (WhatsApp etc.)
summary: Mover (migrar) uma instalação do OpenClaw de uma máquina para outra
title: Guia de migração
x-i18n:
    generated_at: "2026-04-05T12:45:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 403f0b9677ce723c84abdbabfad20e0f70fd48392ebf23eabb7f8a111fd6a26d
    source_path: install/migrating.md
    workflow: 15
---

# Migrando o OpenClaw para uma nova máquina

Este guia move um gateway OpenClaw para uma nova máquina sem refazer o onboarding.

## O que é migrado

Quando você copia o **diretório de estado** (`~/.openclaw/` por padrão) e o seu **workspace**, você preserva:

- **Configuração** -- `openclaw.json` e todas as configurações do gateway
- **Autenticação** -- `auth-profiles.json` por agente (chaves de API + OAuth), além de qualquer estado de canal/provedor em `credentials/`
- **Sessões** -- histórico de conversa e estado do agente
- **Estado de canal** -- login do WhatsApp, sessão do Telegram etc.
- **Arquivos do workspace** -- `MEMORY.md`, `USER.md`, Skills e prompts

<Tip>
Execute `openclaw status` na máquina antiga para confirmar o caminho do diretório de estado.
Perfis personalizados usam `~/.openclaw-<profile>/` ou um caminho definido via `OPENCLAW_STATE_DIR`.
</Tip>

## Etapas da migração

<Steps>
  <Step title="Pare o gateway e faça backup">
    Na máquina **antiga**, pare o gateway para que os arquivos não mudem durante a cópia e depois crie um arquivo compactado:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Se você usa vários perfis (por exemplo `~/.openclaw-work`), compacte cada um separadamente.

  </Step>

  <Step title="Instale o OpenClaw na nova máquina">
    [Instale](/install) a CLI (e o Node, se necessário) na nova máquina.
    Não há problema se o onboarding criar um `~/.openclaw/` novo -- você o sobrescreverá em seguida.
  </Step>

  <Step title="Copie o diretório de estado e o workspace">
    Transfira o arquivo compactado via `scp`, `rsync -a` ou uma unidade externa e depois extraia:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Certifique-se de que diretórios ocultos foram incluídos e que a propriedade dos arquivos corresponde ao usuário que executará o gateway.

  </Step>

  <Step title="Execute doctor e verifique">
    Na nova máquina, execute [Doctor](/gateway/doctor) para aplicar migrações de configuração e reparar serviços:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Armadilhas comuns

<AccordionGroup>
  <Accordion title="Incompatibilidade de perfil ou state-dir">
    Se o gateway antigo usava `--profile` ou `OPENCLAW_STATE_DIR` e o novo não,
    os canais parecerão desconectados e as sessões estarão vazias.
    Inicie o gateway com o **mesmo** perfil ou state-dir que você migrou e depois execute `openclaw doctor` novamente.
  </Accordion>

  <Accordion title="Copiar apenas openclaw.json">
    O arquivo de configuração sozinho não é suficiente. Perfis de autenticação de modelo ficam em
    `agents/<agentId>/agent/auth-profiles.json`, e o estado de canal/provedor ainda
    fica em `credentials/`. Sempre migre o **diretório de estado inteiro**.
  </Accordion>

  <Accordion title="Permissões e propriedade">
    Se você copiou como root ou trocou de usuário, o gateway pode falhar ao ler credenciais.
    Certifique-se de que o diretório de estado e o workspace pertençam ao usuário que executa o gateway.
  </Accordion>

  <Accordion title="Modo remoto">
    Se sua UI aponta para um gateway **remoto**, o host remoto é quem controla sessões e workspace.
    Migre o próprio host do gateway, não o seu laptop local. Consulte [FAQ](/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Segredos em backups">
    O diretório de estado contém perfis de autenticação, credenciais de canais e outros
    estados de provedores.
    Armazene backups criptografados, evite canais inseguros de transferência e troque as chaves se suspeitar de exposição.
  </Accordion>
</AccordionGroup>

## Checklist de verificação

Na nova máquina, confirme:

- [ ] `openclaw status` mostra o gateway em execução
- [ ] Os canais ainda estão conectados (sem necessidade de novo emparelhamento)
- [ ] O dashboard abre e mostra as sessões existentes
- [ ] Os arquivos do workspace (memória, configurações) estão presentes
