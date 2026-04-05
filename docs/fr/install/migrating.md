---
read_when:
    - Vous déplacez OpenClaw vers un nouvel ordinateur portable/serveur
    - Vous souhaitez préserver les sessions, l’authentification et les connexions aux canaux (WhatsApp, etc.)
summary: Déplacer (migrer) une installation OpenClaw d’une machine à une autre
title: Guide de migration
x-i18n:
    generated_at: "2026-04-05T12:46:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 403f0b9677ce723c84abdbabfad20e0f70fd48392ebf23eabb7f8a111fd6a26d
    source_path: install/migrating.md
    workflow: 15
---

# Migrer OpenClaw vers une nouvelle machine

Ce guide permet de déplacer une passerelle OpenClaw vers une nouvelle machine sans refaire l’onboarding.

## Ce qui est migré

Lorsque vous copiez le **répertoire d’état** (`~/.openclaw/` par défaut) et votre **espace de travail**, vous préservez :

- **Configuration** -- `openclaw.json` et tous les paramètres de la passerelle
- **Authentification** -- `auth-profiles.json` par agent (clés API + OAuth), ainsi que tout état de canal/fournisseur sous `credentials/`
- **Sessions** -- historique des conversations et état des agents
- **État des canaux** -- connexion WhatsApp, session Telegram, etc.
- **Fichiers d’espace de travail** -- `MEMORY.md`, `USER.md`, Skills et invites

<Tip>
Exécutez `openclaw status` sur l’ancienne machine pour confirmer le chemin de votre répertoire d’état.
Les profils personnalisés utilisent `~/.openclaw-<profile>/` ou un chemin défini via `OPENCLAW_STATE_DIR`.
</Tip>

## Étapes de migration

<Steps>
  <Step title="Arrêter la passerelle et sauvegarder">
    Sur l’**ancienne** machine, arrêtez la passerelle afin que les fichiers ne changent pas pendant la copie, puis archivez :

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Si vous utilisez plusieurs profils (par ex. `~/.openclaw-work`), archivez chacun séparément.

  </Step>

  <Step title="Installer OpenClaw sur la nouvelle machine">
    [Installez](/install) la CLI (et Node si nécessaire) sur la nouvelle machine.
    Ce n’est pas grave si l’onboarding crée un nouveau `~/.openclaw/` -- vous l’écraserez juste après.
  </Step>

  <Step title="Copier le répertoire d’état et l’espace de travail">
    Transférez l’archive via `scp`, `rsync -a` ou un disque externe, puis extrayez-la :

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Assurez-vous que les répertoires cachés ont bien été inclus et que le propriétaire des fichiers correspond à l’utilisateur qui exécutera la passerelle.

  </Step>

  <Step title="Exécuter doctor et vérifier">
    Sur la nouvelle machine, exécutez [Doctor](/gateway/doctor) pour appliquer les migrations de configuration et réparer les services :

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
    Si l’ancienne passerelle utilisait `--profile` ou `OPENCLAW_STATE_DIR` et que la nouvelle ne l’utilise pas,
    les canaux sembleront déconnectés et les sessions seront vides.
    Lancez la passerelle avec le **même** profil ou répertoire d’état que celui que vous avez migré, puis relancez `openclaw doctor`.
  </Accordion>

  <Accordion title="Copier uniquement openclaw.json">
    Le fichier de configuration seul ne suffit pas. Les profils d’authentification des modèles se trouvent sous
    `agents/<agentId>/agent/auth-profiles.json`, et l’état des canaux/fournisseurs
    se trouve toujours sous `credentials/`. Migrez toujours **l’intégralité** du répertoire d’état.
  </Accordion>

  <Accordion title="Autorisations et propriété">
    Si vous avez copié en tant que root ou changé d’utilisateur, la passerelle peut ne pas parvenir à lire les identifiants.
    Assurez-vous que le répertoire d’état et l’espace de travail appartiennent à l’utilisateur qui exécute la passerelle.
  </Accordion>

  <Accordion title="Mode distant">
    Si votre interface pointe vers une passerelle **distante**, l’hôte distant possède les sessions et l’espace de travail.
    Migrez l’hôte de la passerelle lui-même, pas votre ordinateur portable local. Consultez [FAQ](/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secrets dans les sauvegardes">
    Le répertoire d’état contient des profils d’authentification, des identifiants de canal et d’autres
    états de fournisseur.
    Stockez les sauvegardes chiffrées, évitez les canaux de transfert non sécurisés et faites tourner les clés si vous suspectez une exposition.
  </Accordion>
</AccordionGroup>

## Checklist de vérification

Sur la nouvelle machine, confirmez :

- [ ] `openclaw status` montre que la passerelle est en cours d’exécution
- [ ] Les canaux sont toujours connectés (aucun nouveau pairage nécessaire)
- [ ] Le tableau de bord s’ouvre et affiche les sessions existantes
- [ ] Les fichiers de l’espace de travail (mémoire, configurations) sont présents
