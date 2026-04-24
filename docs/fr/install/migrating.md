---
read_when:
    - Vous déplacez OpenClaw vers un nouveau portable/serveur
    - Vous voulez préserver les sessions, l’authentification et les connexions aux canaux (WhatsApp, etc.)
summary: Déplacer (migrer) une installation OpenClaw d’une machine à une autre
title: guide de migration
x-i18n:
    generated_at: "2026-04-24T07:17:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c14be563d1eb052726324678cf2784efffc2341aa17f662587fdabe1d8ec1e2
    source_path: install/migrating.md
    workflow: 15
---

# Migration d’OpenClaw vers une nouvelle machine

Ce guide permet de déplacer une Gateway OpenClaw vers une nouvelle machine sans refaire l’intégration.

## Ce qui est migré

Lorsque vous copiez le **répertoire d’état** (`~/.openclaw/` par défaut) et votre **espace de travail**, vous conservez :

- **Configuration** -- `openclaw.json` et tous les paramètres de Gateway
- **Authentification** -- `auth-profiles.json` par agent (clés API + OAuth), plus tout état de canal/fournisseur sous `credentials/`
- **Sessions** -- historique des conversations et état de l’agent
- **État des canaux** -- connexion WhatsApp, session Telegram, etc.
- **Fichiers de l’espace de travail** -- `MEMORY.md`, `USER.md`, Skills et prompts

<Tip>
Exécutez `openclaw status` sur l’ancienne machine pour confirmer le chemin de votre répertoire d’état.
Les profils personnalisés utilisent `~/.openclaw-<profile>/` ou un chemin défini via `OPENCLAW_STATE_DIR`.
</Tip>

## Étapes de migration

<Steps>
  <Step title="Arrêter la gateway et sauvegarder">
    Sur l’ancienne machine, arrêtez la gateway pour que les fichiers ne changent pas pendant la copie, puis archivez :

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Si vous utilisez plusieurs profils (par ex. `~/.openclaw-work`), archivez chacun séparément.

  </Step>

  <Step title="Installer OpenClaw sur la nouvelle machine">
    [Installez](/fr/install) la CLI (et Node si nécessaire) sur la nouvelle machine.
    Ce n’est pas grave si l’intégration crée un nouveau `~/.openclaw/` — vous l’écraserez ensuite.
  </Step>

  <Step title="Copier le répertoire d’état et l’espace de travail">
    Transférez l’archive via `scp`, `rsync -a` ou un disque externe, puis extrayez-la :

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Assurez-vous que les répertoires cachés ont bien été inclus et que le propriétaire des fichiers correspond à l’utilisateur qui exécutera la gateway.

  </Step>

  <Step title="Exécuter doctor et vérifier">
    Sur la nouvelle machine, exécutez [Doctor](/fr/gateway/doctor) pour appliquer les migrations de configuration et réparer les services :

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Pièges courants

<AccordionGroup>
  <Accordion title="Incohérence de profil ou de répertoire d’état">
    Si l’ancienne gateway utilisait `--profile` ou `OPENCLAW_STATE_DIR` et que la nouvelle non,
    les canaux sembleront déconnectés et les sessions seront vides.
    Lancez la gateway avec le **même** profil ou répertoire d’état que celui migré, puis relancez `openclaw doctor`.
  </Accordion>

  <Accordion title="Copier seulement openclaw.json">
    Le fichier de configuration seul ne suffit pas. Les profils d’authentification des modèles se trouvent sous
    `agents/<agentId>/agent/auth-profiles.json`, et l’état des canaux/fournisseurs
    se trouve toujours sous `credentials/`. Migrez toujours **l’intégralité** du répertoire d’état.
  </Accordion>

  <Accordion title="Autorisations et propriété">
    Si vous avez copié en tant que root ou changé d’utilisateur, la gateway peut ne plus pouvoir lire les identifiants.
    Assurez-vous que le répertoire d’état et l’espace de travail appartiennent à l’utilisateur qui exécute la gateway.
  </Accordion>

  <Accordion title="Mode distant">
    Si votre interface pointe vers une Gateway **distante**, l’hôte distant possède les sessions et l’espace de travail.
    Migrez l’hôte de la gateway lui-même, pas votre portable local. Voir [FAQ](/fr/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secrets dans les sauvegardes">
    Le répertoire d’état contient les profils d’authentification, les identifiants des canaux et d’autres
    états de fournisseur.
    Stockez les sauvegardes chiffrées, évitez les canaux de transfert non sécurisés et faites tourner les clés si vous soupçonnez une exposition.
  </Accordion>
</AccordionGroup>

## Liste de contrôle de vérification

Sur la nouvelle machine, confirmez que :

- [ ] `openclaw status` montre que la gateway est en cours d’exécution
- [ ] Les canaux sont toujours connectés (aucune nouvelle association nécessaire)
- [ ] Le tableau de bord s’ouvre et affiche les sessions existantes
- [ ] Les fichiers de l’espace de travail (mémoire, configurations) sont présents

## Liens associés

- [Vue d’ensemble de l’installation](/fr/install)
- [Migration Matrix](/fr/install/migrating-matrix)
- [Désinstallation](/fr/install/uninstall)
