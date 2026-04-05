---
read_when:
    - Examen de la posture de sécurité ou des scénarios de menace
    - Travail sur des fonctionnalités de sécurité ou des réponses à des audits
summary: Modèle de menace d’OpenClaw mis en correspondance avec le cadre MITRE ATLAS
title: Modèle de menace (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-05T12:56:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05561381c73e8efe20c8b59cd717e66447ee43988018e9670161cc63e650f2bf
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# Modèle de menace OpenClaw v1.0

## Cadre MITRE ATLAS

**Version :** 1.0-brouillon
**Dernière mise à jour :** 2026-02-04
**Méthodologie :** MITRE ATLAS + diagrammes de flux de données
**Cadre :** [MITRE ATLAS](https://atlas.mitre.org/) (paysage des menaces adverses pour les systèmes d’IA)

### Attribution du cadre

Ce modèle de menace s’appuie sur [MITRE ATLAS](https://atlas.mitre.org/), le cadre de référence du secteur pour documenter les menaces adverses visant les systèmes d’IA/ML. ATLAS est maintenu par [MITRE](https://www.mitre.org/) en collaboration avec la communauté de la sécurité de l’IA.

**Ressources ATLAS clés :**

- [Techniques ATLAS](https://atlas.mitre.org/techniques/)
- [Tactiques ATLAS](https://atlas.mitre.org/tactics/)
- [Études de cas ATLAS](https://atlas.mitre.org/studies/)
- [GitHub ATLAS](https://github.com/mitre-atlas/atlas-data)
- [Contribuer à ATLAS](https://atlas.mitre.org/resources/contribute)

### Contribuer à ce modèle de menace

Il s’agit d’un document évolutif maintenu par la communauté OpenClaw. Consultez [CONTRIBUTING-THREAT-MODEL.md](/fr/security/CONTRIBUTING-THREAT-MODEL) pour les directives de contribution :

- Signaler de nouvelles menaces
- Mettre à jour les menaces existantes
- Proposer des chaînes d’attaque
- Suggérer des mesures d’atténuation

---

## 1. Introduction

### 1.1 Objectif

Ce modèle de menace documente les menaces adverses visant la plateforme d’agents IA OpenClaw et la place de marché de Skills ClawHub, en utilisant le cadre MITRE ATLAS conçu spécifiquement pour les systèmes d’IA/ML.

### 1.2 Portée

| Composant              | Inclus  | Notes                                              |
| ---------------------- | ------- | -------------------------------------------------- |
| Runtime d’agent OpenClaw | Oui     | Exécution principale de l’agent, appels d’outils, sessions |
| Gateway                | Oui     | Authentification, routage, intégration des canaux  |
| Intégrations de canaux | Oui     | WhatsApp, Telegram, Discord, Signal, Slack, etc.   |
| Place de marché ClawHub | Oui     | Publication de Skills, modération, distribution    |
| Serveurs MCP           | Oui     | Fournisseurs d’outils externes                     |
| Appareils utilisateur  | Partiel | Applications mobiles, clients de bureau            |

### 1.3 Hors périmètre

Rien n’est explicitement hors périmètre pour ce modèle de menace.

---

## 2. Architecture du système

### 2.1 Frontières de confiance

```
┌─────────────────────────────────────────────────────────────────┐
│                 ZONE NON FIABLE                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│            FRONTIÈRE DE CONFIANCE 1 : Accès au canal             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Appairage d’appareil (1 h DM / période de grâce de 5 min pour le nœud) │   │
│  │  • Validation AllowFrom / AllowList                      │   │
│  │  • Authentification par jeton/mot de passe/Tailscale    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         FRONTIÈRE DE CONFIANCE 2 : Isolation des sessions        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 SESSIONS D’AGENT                          │   │
│  │  • Clé de session = agent:channel:peer                    │   │
│  │  • Politiques d’outils par agent                          │   │
│  │  • Journalisation des transcriptions                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│        FRONTIÈRE DE CONFIANCE 3 : Exécution des outils           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                SANDBOX D’EXÉCUTION                        │   │
│  │  • Sandbox Docker OU hôte (exec-approvals)               │   │
│  │  • Exécution distante Node                                │   │
│  │  • Protection SSRF (épinglage DNS + blocage IP)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│      FRONTIÈRE DE CONFIANCE 4 : Contenu externe                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          URLS / E-MAILS / WEBHOOKS RÉCUPÉRÉS              │   │
│  │  • Encapsulation du contenu externe (balises XML)         │   │
│  │  • Injection d’avis de sécurité                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│      FRONTIÈRE DE CONFIANCE 5 : Chaîne d’approvisionnement       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Publication de Skills (semver, SKILL.md requis)       │   │
│  │  • Indicateurs de modération fondés sur des motifs       │   │
│  │  • Analyse VirusTotal (à venir)                          │   │
│  │  • Vérification de l’ancienneté du compte GitHub         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flux de données

| Flux | Source  | Destination | Données            | Protection           |
| ---- | ------- | ----------- | ------------------ | -------------------- |
| F1   | Canal   | Gateway     | Messages utilisateur | TLS, AllowFrom     |
| F2   | Gateway | Agent       | Messages routés    | Isolation des sessions |
| F3   | Agent   | Outils      | Invocations d’outils | Application des politiques |
| F4   | Agent   | Externe     | Requêtes `web_fetch` | Blocage SSRF      |
| F5   | ClawHub | Agent       | Code de Skill      | Modération, analyse |
| F6   | Agent   | Canal       | Réponses           | Filtrage de sortie  |

---

## 3. Analyse des menaces par tactique ATLAS

### 3.1 Reconnaissance (AML.TA0002)

#### T-RECON-001 : Découverte du point de terminaison de l’agent

| Attribut                | Valeur                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Analyse active                                           |
| **Description**         | L’attaquant recherche des points de terminaison Gateway OpenClaw exposés |
| **Vecteur d’attaque**   | Analyse réseau, requêtes Shodan, énumération DNS                     |
| **Composants affectés** | Gateway, points de terminaison API exposés                           |
| **Mesures d’atténuation actuelles** | Option d’authentification Tailscale, liaison à la loopback par défaut |
| **Risque résiduel**     | Moyen - Gateways publics détectables                                 |
| **Recommandations**     | Documenter le déploiement sécurisé, ajouter une limitation de débit sur les points de terminaison de découverte |

#### T-RECON-002 : Sondage des intégrations de canaux

| Attribut                | Valeur                                                             |
| ----------------------- | ------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0006 - Analyse active                                         |
| **Description**         | L’attaquant sonde les canaux de messagerie pour identifier les comptes gérés par une IA |
| **Vecteur d’attaque**   | Envoi de messages de test, observation des schémas de réponse      |
| **Composants affectés** | Toutes les intégrations de canaux                                  |
| **Mesures d’atténuation actuelles** | Aucune spécifique                                      |
| **Risque résiduel**     | Faible - Valeur limitée de la découverte seule                     |
| **Recommandations**     | Envisager une randomisation du temps de réponse                    |

---

### 3.2 Accès initial (AML.TA0004)

#### T-ACCESS-001 : Interception du code d’appairage

| Attribut                | Valeur                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accès à l’API d’inférence du modèle d’IA                                                            |
| **Description**         | L’attaquant intercepte le code d’appairage pendant la période de grâce de l’appairage (1 h pour l’appairage de canal DM, 5 min pour l’appairage de nœud) |
| **Vecteur d’attaque**   | Observation visuelle, écoute réseau, ingénierie sociale                                                         |
| **Composants affectés** | Système d’appairage des appareils                                                                                |
| **Mesures d’atténuation actuelles** | Expiration de 1 h (appairage DM) / expiration de 5 min (appairage de nœud), codes envoyés via le canal existant |
| **Risque résiduel**     | Moyen - Période de grâce exploitable                                                                             |
| **Recommandations**     | Réduire la période de grâce, ajouter une étape de confirmation                                                  |

#### T-ACCESS-002 : Usurpation d’AllowFrom

| Attribut                | Valeur                                                                         |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0040 - Accès à l’API d’inférence du modèle d’IA                           |
| **Description**         | L’attaquant usurpe l’identité d’un expéditeur autorisé dans le canal           |
| **Vecteur d’attaque**   | Dépend du canal - usurpation de numéro de téléphone, imitation de nom d’utilisateur |
| **Composants affectés** | Validation AllowFrom par canal                                                 |
| **Mesures d’atténuation actuelles** | Vérification d’identité spécifique au canal                      |
| **Risque résiduel**     | Moyen - Certains canaux sont vulnérables à l’usurpation                        |
| **Recommandations**     | Documenter les risques spécifiques à chaque canal, ajouter une vérification cryptographique lorsque possible |

#### T-ACCESS-003 : Vol de jeton

| Attribut                | Valeur                                                        |
| ----------------------- | ------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accès à l’API d’inférence du modèle d’IA          |
| **Description**         | L’attaquant vole des jetons d’authentification dans les fichiers de configuration |
| **Vecteur d’attaque**   | Malware, accès non autorisé à l’appareil, exposition des sauvegardes de configuration |
| **Composants affectés** | `~/.openclaw/credentials/`, stockage de configuration         |
| **Mesures d’atténuation actuelles** | Permissions de fichier                             |
| **Risque résiduel**     | Élevé - Jetons stockés en clair                               |
| **Recommandations**     | Mettre en œuvre le chiffrement des jetons au repos, ajouter une rotation des jetons |

---

### 3.3 Exécution (AML.TA0005)

#### T-EXEC-001 : Injection directe de prompt

| Attribut                | Valeur                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.000 - Injection de prompt LLM : directe                                           |
| **Description**         | L’attaquant envoie des prompts conçus pour manipuler le comportement de l’agent             |
| **Vecteur d’attaque**   | Messages de canal contenant des instructions adverses                                       |
| **Composants affectés** | LLM de l’agent, toutes les surfaces d’entrée                                                |
| **Mesures d’atténuation actuelles** | Détection de motifs, encapsulation du contenu externe                    |
| **Risque résiduel**     | Critique - Détection uniquement, aucun blocage ; les attaques sophistiquées passent outre   |
| **Recommandations**     | Mettre en œuvre une défense multicouche, une validation de sortie, et une confirmation utilisateur pour les actions sensibles |

#### T-EXEC-002 : Injection indirecte de prompt

| Attribut                | Valeur                                                      |
| ----------------------- | ----------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.001 - Injection de prompt LLM : indirecte         |
| **Description**         | L’attaquant intègre des instructions malveillantes dans du contenu récupéré |
| **Vecteur d’attaque**   | URL malveillantes, e-mails empoisonnés, webhooks compromis  |
| **Composants affectés** | `web_fetch`, ingestion d’e-mails, sources de données externes |
| **Mesures d’atténuation actuelles** | Encapsulation du contenu avec des balises XML et un avis de sécurité |
| **Risque résiduel**     | Élevé - Le LLM peut ignorer les instructions d’encapsulation |
| **Recommandations**     | Mettre en œuvre l’assainissement du contenu, séparer les contextes d’exécution |

#### T-EXEC-003 : Injection d’arguments d’outil

| Attribut                | Valeur                                                       |
| ----------------------- | ------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0051.000 - Injection de prompt LLM : directe            |
| **Description**         | L’attaquant manipule les arguments d’outil via une injection de prompt |
| **Vecteur d’attaque**   | Prompts conçus pour influencer les valeurs des paramètres d’outil |
| **Composants affectés** | Toutes les invocations d’outils                              |
| **Mesures d’atténuation actuelles** | Approbations d’exécution pour les commandes dangereuses |
| **Risque résiduel**     | Élevé - Repose sur le jugement de l’utilisateur              |
| **Recommandations**     | Mettre en œuvre une validation des arguments, des appels d’outils paramétrés |

#### T-EXEC-004 : Contournement de l’approbation d’exécution

| Attribut                | Valeur                                                     |
| ----------------------- | ---------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Élaborer des données adverses                  |
| **Description**         | L’attaquant conçoit des commandes qui contournent la liste d’autorisation d’approbation |
| **Vecteur d’attaque**   | Obfuscation de commandes, exploitation d’alias, manipulation de chemin |
| **Composants affectés** | `exec-approvals.ts`, liste d’autorisation de commandes     |
| **Mesures d’atténuation actuelles** | Liste d’autorisation + mode demande            |
| **Risque résiduel**     | Élevé - Aucune normalisation des commandes                 |
| **Recommandations**     | Mettre en œuvre une normalisation des commandes, étendre la liste de blocage |

---

### 3.4 Persistance (AML.TA0006)

#### T-PERSIST-001 : Installation d’une Skill malveillante

| Attribut                | Valeur                                                                   |
| ----------------------- | ------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0010.001 - Compromission de la chaîne d’approvisionnement : logiciel d’IA |
| **Description**         | L’attaquant publie une Skill malveillante sur ClawHub                    |
| **Vecteur d’attaque**   | Création de compte, publication d’une Skill avec du code malveillant caché |
| **Composants affectés** | ClawHub, chargement des Skills, exécution de l’agent                     |
| **Mesures d’atténuation actuelles** | Vérification de l’ancienneté du compte GitHub, indicateurs de modération fondés sur des motifs |
| **Risque résiduel**     | Critique - Aucun sandboxing, revue limitée                               |
| **Recommandations**     | Intégration VirusTotal (en cours), sandboxing des Skills, revue communautaire |

#### T-PERSIST-002 : Empoisonnement de mise à jour de Skill

| Attribut                | Valeur                                                         |
| ----------------------- | -------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.001 - Compromission de la chaîne d’approvisionnement : logiciel d’IA |
| **Description**         | L’attaquant compromet une Skill populaire et pousse une mise à jour malveillante |
| **Vecteur d’attaque**   | Compromission de compte, ingénierie sociale du propriétaire de la Skill |
| **Composants affectés** | Versionnement ClawHub, flux de mise à jour automatique         |
| **Mesures d’atténuation actuelles** | Empreinte de version                              |
| **Risque résiduel**     | Élevé - Les mises à jour automatiques peuvent récupérer des versions malveillantes |
| **Recommandations**     | Mettre en œuvre la signature des mises à jour, une capacité de restauration, et l’épinglage de version |

#### T-PERSIST-003 : Altération de la configuration de l’agent

| Attribut                | Valeur                                                          |
| ----------------------- | --------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Compromission de la chaîne d’approvisionnement : données |
| **Description**         | L’attaquant modifie la configuration de l’agent pour maintenir un accès |
| **Vecteur d’attaque**   | Modification de fichier de configuration, injection de paramètres |
| **Composants affectés** | Configuration de l’agent, politiques d’outils                  |
| **Mesures d’atténuation actuelles** | Permissions de fichier                               |
| **Risque résiduel**     | Moyen - Nécessite un accès local                                |
| **Recommandations**     | Vérification de l’intégrité de la configuration, journalisation d’audit des changements de configuration |

---

### 3.5 Évasion des défenses (AML.TA0007)

#### T-EVADE-001 : Contournement des motifs de modération

| Attribut                | Valeur                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Élaborer des données adverses                              |
| **Description**         | L’attaquant conçoit du contenu de Skill pour contourner les motifs de modération |
| **Vecteur d’attaque**   | Homoglyphes Unicode, astuces d’encodage, chargement dynamique          |
| **Composants affectés** | `ClawHub moderation.ts`                                                |
| **Mesures d’atténuation actuelles** | `FLAG_RULES` fondées sur des motifs                      |
| **Risque résiduel**     | Élevé - Les regex simples se contournent facilement                    |
| **Recommandations**     | Ajouter une analyse comportementale (VirusTotal Code Insight), une détection fondée sur AST |

#### T-EVADE-002 : Échappement à l’encapsulation de contenu

| Attribut                | Valeur                                                    |
| ----------------------- | --------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Élaborer des données adverses                 |
| **Description**         | L’attaquant conçoit du contenu qui s’échappe du contexte d’encapsulation XML |
| **Vecteur d’attaque**   | Manipulation de balises, confusion de contexte, substitution d’instructions |
| **Composants affectés** | Encapsulation du contenu externe                          |
| **Mesures d’atténuation actuelles** | Balises XML + avis de sécurité                    |
| **Risque résiduel**     | Moyen - De nouveaux contournements sont découverts régulièrement |
| **Recommandations**     | Plusieurs couches d’encapsulation, validation côté sortie |

---

### 3.6 Découverte (AML.TA0008)

#### T-DISC-001 : Énumération des outils

| Attribut                | Valeur                                                |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accès à l’API d’inférence du modèle d’IA  |
| **Description**         | L’attaquant énumère les outils disponibles par prompt |
| **Vecteur d’attaque**   | Requêtes du type « Quels outils as-tu ? »             |
| **Composants affectés** | Registre des outils de l’agent                        |
| **Mesures d’atténuation actuelles** | Aucune spécifique                                |
| **Risque résiduel**     | Faible - Les outils sont généralement documentés      |
| **Recommandations**     | Envisager des contrôles de visibilité des outils      |

#### T-DISC-002 : Extraction de données de session

| Attribut                | Valeur                                                |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accès à l’API d’inférence du modèle d’IA  |
| **Description**         | L’attaquant extrait des données sensibles du contexte de session |
| **Vecteur d’attaque**   | Requêtes « De quoi avons-nous parlé ? », sondage du contexte |
| **Composants affectés** | Transcriptions de session, fenêtre de contexte        |
| **Mesures d’atténuation actuelles** | Isolation des sessions par expéditeur       |
| **Risque résiduel**     | Moyen - Les données de la session sont accessibles au sein de la session |
| **Recommandations**     | Mettre en œuvre une rédaction des données sensibles dans le contexte |

---

### 3.7 Collecte et exfiltration (AML.TA0009, AML.TA0010)

#### T-EXFIL-001 : Vol de données via web_fetch

| Attribut                | Valeur                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Collecte                                                   |
| **Description**         | L’attaquant exfiltre des données en demandant à l’agent de les envoyer vers une URL externe |
| **Vecteur d’attaque**   | Injection de prompt amenant l’agent à envoyer des données par POST vers un serveur contrôlé par l’attaquant |
| **Composants affectés** | Outil `web_fetch`                                                     |
| **Mesures d’atténuation actuelles** | Blocage SSRF pour les réseaux internes                    |
| **Risque résiduel**     | Élevé - Les URL externes sont autorisées                              |
| **Recommandations**     | Mettre en œuvre une liste d’autorisation d’URL, une prise en compte de la classification des données |

#### T-EXFIL-002 : Envoi de messages non autorisé

| Attribut                | Valeur                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Collecte                                             |
| **Description**         | L’attaquant amène l’agent à envoyer des messages contenant des données sensibles |
| **Vecteur d’attaque**   | Injection de prompt amenant l’agent à envoyer un message à l’attaquant |
| **Composants affectés** | Outil de messagerie, intégrations de canaux                      |
| **Mesures d’atténuation actuelles** | Contrôle de l’envoi de messages sortants             |
| **Risque résiduel**     | Moyen - Le contrôle peut être contourné                          |
| **Recommandations**     | Exiger une confirmation explicite pour les nouveaux destinataires |

#### T-EXFIL-003 : Collecte d’identifiants

| Attribut                | Valeur                                                  |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Collecte                                    |
| **Description**         | Une Skill malveillante collecte des identifiants depuis le contexte de l’agent |
| **Vecteur d’attaque**   | Le code de la Skill lit les variables d’environnement, les fichiers de configuration |
| **Composants affectés** | Environnement d’exécution de la Skill                   |
| **Mesures d’atténuation actuelles** | Aucune spécifique aux Skills                     |
| **Risque résiduel**     | Critique - Les Skills s’exécutent avec les privilèges de l’agent |
| **Recommandations**     | Sandboxing des Skills, isolation des identifiants       |

---

### 3.8 Impact (AML.TA0011)

#### T-IMPACT-001 : Exécution de commandes non autorisée

| Attribut                | Valeur                                              |
| ----------------------- | --------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Éroder l’intégrité du modèle d’IA       |
| **Description**         | L’attaquant exécute des commandes arbitraires sur le système de l’utilisateur |
| **Vecteur d’attaque**   | Injection de prompt combinée à un contournement de l’approbation d’exécution |
| **Composants affectés** | Outil Bash, exécution de commandes                  |
| **Mesures d’atténuation actuelles** | Approbations d’exécution, option de sandbox Docker |
| **Risque résiduel**     | Critique - Exécution sur l’hôte sans sandbox        |
| **Recommandations**     | Utiliser le sandbox par défaut, améliorer l’UX d’approbation |

#### T-IMPACT-002 : Épuisement des ressources (DoS)

| Attribut                | Valeur                                             |
| ----------------------- | -------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Éroder l’intégrité du modèle d’IA      |
| **Description**         | L’attaquant épuise les crédits API ou les ressources de calcul |
| **Vecteur d’attaque**   | Inondation automatisée de messages, appels d’outils coûteux |
| **Composants affectés** | Gateway, sessions d’agent, fournisseur d’API       |
| **Mesures d’atténuation actuelles** | Aucune                                      |
| **Risque résiduel**     | Élevé - Aucune limitation de débit                 |
| **Recommandations**     | Mettre en œuvre des limites de débit par expéditeur, des budgets de coût |

#### T-IMPACT-003 : Atteinte à la réputation

| Attribut                | Valeur                                                  |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Éroder l’intégrité du modèle d’IA           |
| **Description**         | L’attaquant amène l’agent à envoyer du contenu nuisible ou offensant |
| **Vecteur d’attaque**   | Injection de prompt provoquant des réponses inappropriées |
| **Composants affectés** | Génération de sortie, messagerie de canal               |
| **Mesures d’atténuation actuelles** | Politiques de contenu du fournisseur de LLM |
| **Risque résiduel**     | Moyen - Les filtres du fournisseur sont imparfaits      |
| **Recommandations**     | Couche de filtrage de sortie, contrôles utilisateur     |

---

## 4. Analyse de la chaîne d’approvisionnement ClawHub

### 4.1 Contrôles de sécurité actuels

| Contrôle              | Implémentation              | Efficacité                                           |
| --------------------- | --------------------------- | ---------------------------------------------------- |
| Ancienneté du compte GitHub | `requireGitHubAccountAge()` | Moyenne - Relève le niveau pour les nouveaux attaquants |
| Assainissement des chemins | `sanitizePath()`            | Élevée - Empêche la traversée de chemin              |
| Validation du type de fichier | `isTextFile()`              | Moyenne - Uniquement des fichiers texte, mais ils peuvent quand même être malveillants |
| Limites de taille     | 50 Mo au total              | Élevée - Empêche l’épuisement des ressources         |
| `SKILL.md` requis     | readme obligatoire          | Faible valeur de sécurité - Informatif uniquement    |
| Modération par motifs | `FLAG_RULES in moderation.ts` | Faible - Facile à contourner                        |
| Statut de modération  | Champ `moderationStatus`    | Moyenne - Revue manuelle possible                    |

### 4.2 Motifs d’indicateurs de modération

Motifs actuels dans `moderation.ts` :

```javascript
// Identifiants connus comme malveillants
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Mots-clés suspects
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Limitations :**

- Vérifie uniquement `slug`, `displayName`, `summary`, le frontmatter, les métadonnées et les chemins de fichiers
- N’analyse pas le contenu réel du code des Skills
- Les regex simples se contournent facilement par obfuscation
- Aucune analyse comportementale

### 4.3 Améliorations prévues

| Amélioration           | Statut                                | Impact                                                                |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Intégration VirusTotal | En cours                              | Élevé - Analyse comportementale Code Insight                          |
| Signalement communautaire | Partiel (`skillReports` table exists) | Moyen                                                                 |
| Journalisation d’audit | Partiel (`auditLogs` table exists)    | Moyen                                                                 |
| Système de badges      | Implémenté                            | Moyen - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Matrice des risques

### 5.1 Probabilité vs impact

| ID de menace  | Probabilité | Impact   | Niveau de risque | Priorité |
| ------------- | ----------- | -------- | ---------------- | -------- |
| T-EXEC-001    | Élevée      | Critique | **Critique**     | P0       |
| T-PERSIST-001 | Élevée      | Critique | **Critique**     | P0       |
| T-EXFIL-003   | Moyenne     | Critique | **Critique**     | P0       |
| T-IMPACT-001  | Moyenne     | Critique | **Élevé**        | P1       |
| T-EXEC-002    | Élevée      | Élevé    | **Élevé**        | P1       |
| T-EXEC-004    | Moyenne     | Élevé    | **Élevé**        | P1       |
| T-ACCESS-003  | Moyenne     | Élevé    | **Élevé**        | P1       |
| T-EXFIL-001   | Moyenne     | Élevé    | **Élevé**        | P1       |
| T-IMPACT-002  | Élevée      | Moyen    | **Élevé**        | P1       |
| T-EVADE-001   | Élevée      | Moyen    | **Moyen**        | P2       |
| T-ACCESS-001  | Faible      | Élevé    | **Moyen**        | P2       |
| T-ACCESS-002  | Faible      | Élevé    | **Moyen**        | P2       |
| T-PERSIST-002 | Faible      | Élevé    | **Moyen**        | P2       |

### 5.2 Chaînes d’attaque critiques

**Chaîne d’attaque 1 : Vol de données fondé sur une Skill**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publier une Skill malveillante) → (Contourner la modération) → (Collecter des identifiants)
```

**Chaîne d’attaque 2 : Injection de prompt vers RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Injecter un prompt) → (Contourner l’approbation d’exécution) → (Exécuter des commandes)
```

**Chaîne d’attaque 3 : Injection indirecte via du contenu récupéré**

```
T-EXEC-002 → T-EXFIL-001 → Exfiltration externe
(Empoisonner le contenu d’une URL) → (L’agent récupère le contenu et suit les instructions) → (Données envoyées à l’attaquant)
```

---

## 6. Résumé des recommandations

### 6.1 Immédiat (P0)

| ID    | Recommandation                               | Traite                    |
| ----- | -------------------------------------------- | ------------------------- |
| R-001 | Finaliser l’intégration VirusTotal           | T-PERSIST-001, T-EVADE-001 |
| R-002 | Mettre en œuvre le sandboxing des Skills     | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Ajouter une validation de sortie pour les actions sensibles | T-EXEC-001, T-EXEC-002 |

### 6.2 Court terme (P1)

| ID    | Recommandation                              | Traite       |
| ----- | ------------------------------------------- | ------------ |
| R-004 | Mettre en œuvre une limitation de débit     | T-IMPACT-002 |
| R-005 | Ajouter le chiffrement des jetons au repos  | T-ACCESS-003 |
| R-006 | Améliorer l’UX et la validation d’approbation d’exécution | T-EXEC-004 |
| R-007 | Mettre en œuvre une liste d’autorisation d’URL pour `web_fetch` | T-EXFIL-001 |

### 6.3 Moyen terme (P2)

| ID    | Recommandation                                         | Traite        |
| ----- | ------------------------------------------------------ | ------------- |
| R-008 | Ajouter une vérification cryptographique des canaux lorsque possible | T-ACCESS-002 |
| R-009 | Mettre en œuvre une vérification de l’intégrité de la configuration | T-PERSIST-003 |
| R-010 | Ajouter la signature des mises à jour et l’épinglage de version | T-PERSIST-002 |

---

## 7. Annexes

### 7.1 Correspondance des techniques ATLAS

| ID ATLAS      | Nom de la technique            | Menaces OpenClaw                                                  |
| ------------- | ------------------------------ | ----------------------------------------------------------------- |
| AML.T0006     | Analyse active                 | T-RECON-001, T-RECON-002                                          |
| AML.T0009     | Collecte                       | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                             |
| AML.T0010.001 | Chaîne d’approvisionnement : logiciel d’IA | T-PERSIST-001, T-PERSIST-002                           |
| AML.T0010.002 | Chaîne d’approvisionnement : données | T-PERSIST-003                                                |
| AML.T0031     | Éroder l’intégrité du modèle d’IA | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                     |
| AML.T0040     | Accès à l’API d’inférence du modèle d’IA | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Élaborer des données adverses  | T-EXEC-004, T-EVADE-001, T-EVADE-002                              |
| AML.T0051.000 | Injection de prompt LLM : directe | T-EXEC-001, T-EXEC-003                                        |
| AML.T0051.001 | Injection de prompt LLM : indirecte | T-EXEC-002                                                    |

### 7.2 Fichiers de sécurité clés

| Chemin                              | Objectif                    | Niveau de risque |
| ----------------------------------- | --------------------------- | ---------------- |
| `src/infra/exec-approvals.ts`       | Logique d’approbation des commandes | **Critique** |
| `src/gateway/auth.ts`               | Authentification Gateway    | **Critique**     |
| `src/infra/net/ssrf.ts`             | Protection SSRF             | **Critique**     |
| `src/security/external-content.ts`  | Atténuation de l’injection de prompt | **Critique** |
| `src/agents/sandbox/tool-policy.ts` | Application de la politique d’outils | **Critique** |
| `src/routing/resolve-route.ts`      | Isolation des sessions      | **Moyen**        |

### 7.3 Glossaire

| Terme                | Définition                                                |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | Paysage des menaces adverses de MITRE pour les systèmes d’IA |
| **ClawHub**          | Place de marché de Skills d’OpenClaw                      |
| **Gateway**          | Couche de routage des messages et d’authentification d’OpenClaw |
| **MCP**              | Model Context Protocol - interface de fournisseur d’outils |
| **Prompt Injection** | Attaque où des instructions malveillantes sont intégrées dans une entrée |
| **Skill**            | Extension téléchargeable pour les agents OpenClaw         |
| **SSRF**             | Falsification de requête côté serveur                     |

---

_Ce modèle de menace est un document évolutif. Signalez les problèmes de sécurité à security@openclaw.ai_
