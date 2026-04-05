---
read_when:
    - Você quer alternar entre stable/beta/dev
    - Você quer fixar uma versão, tag ou SHA específica
    - Você está fazendo tagging ou publicando prereleases
sidebarTitle: Release Channels
summary: 'Canais stable, beta e dev: semântica, alternância, fixação e tagging'
title: Canais de lançamento
x-i18n:
    generated_at: "2026-04-05T12:44:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f33a77bf356f989cd4de5f8bb57f330c276e7571b955bea6994a4527e40258d
    source_path: install/development-channels.md
    workflow: 15
---

# Canais de desenvolvimento

O OpenClaw distribui três canais de atualização:

- **stable**: npm dist-tag `latest`. Recomendado para a maioria dos usuários.
- **beta**: npm dist-tag `beta` quando estiver atual; se `beta` estiver ausente ou mais antigo
  do que a versão stable mais recente, o fluxo de atualização recorre a `latest`.
- **dev**: ponta móvel de `main` (git). npm dist-tag: `dev` (quando publicado).
  O branch `main` é voltado para experimentação e desenvolvimento ativo. Ele pode conter
  recursos incompletos ou mudanças incompatíveis. Não o use para gateways de produção.

Normalmente distribuímos compilações stable primeiro para **beta**, testamos lá e depois executamos uma
etapa explícita de promoção que move a compilação validada para `latest` sem
alterar o número da versão. Mantenedores também podem publicar uma versão stable
diretamente em `latest` quando necessário. Dist-tags são a fonte da verdade para instalações npm.

## Alternando canais

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` persiste sua escolha na configuração (`update.channel`) e alinha o
método de instalação:

- **`stable`** (instalações por pacote): atualiza via npm dist-tag `latest`.
- **`beta`** (instalações por pacote): prefere npm dist-tag `beta`, mas recorre a
  `latest` quando `beta` está ausente ou é mais antigo do que a tag stable atual.
- **`stable`** (instalações git): faz checkout da tag git stable mais recente.
- **`beta`** (instalações git): prefere a tag git beta mais recente, mas recorre à
  tag git stable mais recente quando beta está ausente ou é mais antigo.
- **`dev`**: garante um checkout git (padrão `~/openclaw`, substituível com
  `OPENCLAW_GIT_DIR`), muda para `main`, faz rebase no upstream, compila e
  instala a CLI global a partir desse checkout.

Dica: se você quiser stable + dev em paralelo, mantenha dois clones e aponte seu
gateway para o stable.

## Direcionamento pontual por versão ou tag

Use `--tag` para direcionar uma dist-tag, versão ou package spec específica para uma única
atualização **sem** alterar seu canal persistido:

```bash
# Instala uma versão específica
openclaw update --tag 2026.4.1-beta.1

# Instala a partir da dist-tag beta (pontual, não persiste)
openclaw update --tag beta

# Instala a partir do branch main do GitHub (npm tarball)
openclaw update --tag main

# Instala uma package spec npm específica
openclaw update --tag openclaw@2026.4.1-beta.1
```

Observações:

- `--tag` se aplica apenas a **instalações por pacote (npm)**. Instalações git o ignoram.
- A tag não é persistida. Seu próximo `openclaw update` usará normalmente o canal configurado.
- Proteção contra downgrade: se a versão de destino for mais antiga do que sua versão atual,
  o OpenClaw pedirá confirmação (ignore com `--yes`).
- `--channel beta` é diferente de `--tag beta`: o fluxo por canal pode recorrer
  a stable/latest quando beta está ausente ou é mais antigo, enquanto `--tag beta` aponta para a
  dist-tag `beta` bruta apenas nessa execução.

## Simulação

Visualize o que `openclaw update` faria sem realizar alterações:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

A simulação mostra o canal efetivo, a versão de destino, as ações planejadas e
se seria necessária confirmação de downgrade.

## Plugins e canais

Quando você alterna de canal com `openclaw update`, o OpenClaw também sincroniza as
fontes de plugins:

- `dev` prefere plugins integrados a partir do checkout git.
- `stable` e `beta` restauram pacotes de plugin instalados por npm.
- Plugins instalados por npm são atualizados após a conclusão da atualização do core.

## Verificando o status atual

```bash
openclaw update status
```

Mostra o canal ativo, o tipo de instalação (git ou pacote), a versão atual e a
origem (configuração, tag git, branch git ou padrão).

## Boas práticas de tagging

- Faça tag de lançamentos em que checkouts git devem chegar (`vYYYY.M.D` para stable,
  `vYYYY.M.D-beta.N` para beta).
- `vYYYY.M.D.beta.N` também é reconhecida por compatibilidade, mas prefira `-beta.N`.
- Tags legadas `vYYYY.M.D-<patch>` ainda são reconhecidas como stable (não-beta).
- Mantenha tags imutáveis: nunca mova nem reutilize uma tag.
- npm dist-tags continuam sendo a fonte da verdade para instalações npm:
  - `latest` -> stable
  - `beta` -> compilação candidata ou compilação stable-first beta
  - `dev` -> snapshot de main (opcional)

## Disponibilidade do app do macOS

Compilações beta e dev podem **não** incluir uma versão do app do macOS. Isso é aceitável:

- A tag git e a npm dist-tag ainda podem ser publicadas.
- Destaque "sem compilação do macOS para este beta" nas notas de lançamento ou changelog.
