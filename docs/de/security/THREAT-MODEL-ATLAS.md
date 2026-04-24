---
read_when:
    - Sicherheitslage oder Bedrohungsszenarien prüfen
    - An Sicherheitsfunktionen oder Audit-Antworten arbeiten
summary: OpenClaw-Bedrohungsmodell, abgebildet auf das MITRE-ATLAS-Framework
title: Bedrohungsmodell (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-24T06:59:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: e628bf60015a76d3015a7aab7b51649bdcfd2e99db148368e580839db16d2342
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# OpenClaw-Bedrohungsmodell v1.0

## MITRE-ATLAS-Framework

**Version:** 1.0-draft
**Zuletzt aktualisiert:** 2026-02-04
**Methodik:** MITRE ATLAS + Datenflussdiagramme
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Zuordnung zum Framework

Dieses Bedrohungsmodell basiert auf [MITRE ATLAS](https://atlas.mitre.org/), dem branchenüblichen Framework zur Dokumentation adversarialer Bedrohungen für AI/ML-Systeme. ATLAS wird von [MITRE](https://www.mitre.org/) in Zusammenarbeit mit der AI-Sicherheits-Community gepflegt.

**Wichtige ATLAS-Ressourcen:**

- [ATLAS-Techniken](https://atlas.mitre.org/techniques/)
- [ATLAS-Taktiken](https://atlas.mitre.org/tactics/)
- [ATLAS-Fallstudien](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Zu ATLAS beitragen](https://atlas.mitre.org/resources/contribute)

### Zu diesem Bedrohungsmodell beitragen

Dies ist ein lebendes Dokument, das von der OpenClaw-Community gepflegt wird. Siehe [CONTRIBUTING-THREAT-MODEL.md](/de/security/CONTRIBUTING-THREAT-MODEL) für Richtlinien zum Beitragen:

- Neue Bedrohungen melden
- Bestehende Bedrohungen aktualisieren
- Angriffsketten vorschlagen
- Gegenmaßnahmen vorschlagen

---

## 1. Einführung

### 1.1 Zweck

Dieses Bedrohungsmodell dokumentiert adversariale Bedrohungen für die AI-Agentenplattform OpenClaw und den Skill-Marktplatz ClawHub unter Verwendung des MITRE-ATLAS-Frameworks, das speziell für AI/ML-Systeme entwickelt wurde.

### 1.2 Umfang

| Komponente              | Enthalten | Hinweise                                          |
| ----------------------- | --------- | ------------------------------------------------- |
| OpenClaw-Agent-Runtime  | Ja        | Ausführung des Core-Agenten, Tool-Calls, Sitzungen |
| Gateway                 | Ja        | Authentifizierung, Routing, Channel-Integration   |
| Channel-Integrationen   | Ja        | WhatsApp, Telegram, Discord, Signal, Slack usw.   |
| ClawHub-Marktplatz      | Ja        | Skill-Veröffentlichung, Moderation, Verteilung    |
| MCP-Server              | Ja        | Externe Tool-Anbieter                             |
| Benutzergeräte          | Teilweise | Mobile Apps, Desktop-Clients                      |

### 1.3 Nicht im Umfang

Nichts ist für dieses Bedrohungsmodell ausdrücklich vom Umfang ausgeschlossen.

---

## 2. Systemarchitektur

### 2.1 Vertrauensgrenzen

```
┌─────────────────────────────────────────────────────────────────┐
│                NICHT VERTRAUENSWÜRDIGE ZONE                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│          VERTRAUENSGRENZE 1: Channel-Zugriff                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                       GATEWAY                             │   │
│  │  • Device-Pairing (1h DM / 5m Gnadenfrist für Nodes)      │   │
│  │  • AllowFrom- / AllowList-Validierung                    │   │
│  │  • Token/Passwort/Tailscale-Auth                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         VERTRAUENSGRENZE 2: Sitzungsisolierung                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  AGENTEN-SITZUNGEN                        │   │
│  │  • Sitzungsschlüssel = agent:channel:peer                 │   │
│  │  • Tool-Richtlinien pro Agent                             │   │
│  │  • Transcript-Protokollierung                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         VERTRAUENSGRENZE 3: Tool-Ausführung                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 AUSFÜHRUNGS-SANDBOX                       │   │
│  │  • Docker-Sandbox ODER Host (Exec-Genehmigungen)          │   │
│  │  • Remote-Ausführung auf Nodes                            │   │
│  │  • SSRF-Schutz (DNS-Pinning + IP-Blockierung)             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│       VERTRAUENSGRENZE 4: Externe Inhalte                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         ABGERUFENE URLs / E-MAILS / WEBHOOKS             │   │
│  │  • Wrapping externer Inhalte (XML-Tags)                  │   │
│  │  • Injektion von Sicherheitshinweisen                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│       VERTRAUENSGRENZE 5: Supply Chain                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                             │   │
│  │  • Skill-Veröffentlichung (semver, SKILL.md erforderlich) │   │
│  │  • Musterbasierte Moderations-Flags                      │   │
│  │  • VirusTotal-Scanning (kommt bald)                      │   │
│  │  • Verifizierung des Alters von GitHub-Konten            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Datenflüsse

| Flow | Quelle  | Ziel        | Daten              | Schutz                |
| ---- | ------- | ----------- | ------------------ | --------------------- |
| F1   | Channel | Gateway     | Benutzernachrichten | TLS, AllowFrom        |
| F2   | Gateway | Agent       | Geroutete Nachrichten | Sitzungsisolierung  |
| F3   | Agent   | Tools       | Tool-Aufrufe       | Durchsetzung von Richtlinien |
| F4   | Agent   | Extern      | web_fetch-Anfragen | SSRF-Blockierung      |
| F5   | ClawHub | Agent       | Skill-Code         | Moderation, Scanning  |
| F6   | Agent   | Channel     | Antworten          | Output-Filterung      |

---

## 3. Bedrohungsanalyse nach ATLAS-Taktik

### 3.1 Reconnaissance (AML.TA0002)

#### T-RECON-001: Erkennung von Agenten-Endpunkten

| Attribut                | Wert                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0006 - Active Scanning                                          |
| **Beschreibung**        | Angreifer scannt nach öffentlich erreichbaren OpenClaw-Gateway-Endpunkten |
| **Angriffsvektor**      | Netzwerkscans, Shodan-Abfragen, DNS-Enumeration                      |
| **Betroffene Komponenten** | Gateway, exponierte API-Endpunkte                                 |
| **Aktuelle Gegenmaßnahmen** | Option für Tailscale-Auth, standardmäßige Bindung an Loopback     |
| **Restrisiko**          | Mittel - Öffentliche Gateways sind auffindbar                        |
| **Empfehlungen**        | Sichere Bereitstellung dokumentieren, Ratenbegrenzung für Discovery-Endpunkte hinzufügen |

#### T-RECON-002: Sondierung von Channel-Integrationen

| Attribut                | Wert                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0006 - Active Scanning                                        |
| **Beschreibung**        | Angreifer sondiert Messaging-Channel, um AI-verwaltete Konten zu identifizieren |
| **Angriffsvektor**      | Testnachrichten senden, Antwortmuster beobachten                   |
| **Betroffene Komponenten** | Alle Channel-Integrationen                                      |
| **Aktuelle Gegenmaßnahmen** | Keine spezifischen                                              |
| **Restrisiko**          | Niedrig - Discovery allein bringt begrenzten Nutzen                |
| **Empfehlungen**        | Zufällige Variation des Antworttimings in Betracht ziehen          |

---

### 3.2 Initial Access (AML.TA0004)

#### T-ACCESS-001: Abfangen von Pairing-Codes

| Attribut                | Wert                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - AI Model Inference API Access                                                                     |
| **Beschreibung**        | Angreifer fängt Pairing-Code während der Pairing-Gnadenfrist ab (1h für DM-Channel-Pairing, 5m für Node-Pairing) |
| **Angriffsvektor**      | Schulterblick, Netzwerk-Sniffing, Social Engineering                                                          |
| **Betroffene Komponenten** | Device-Pairing-System                                                                                      |
| **Aktuelle Gegenmaßnahmen** | Ablauf nach 1h (DM-Pairing) / 5m (Node-Pairing), Codes werden über bestehenden Channel gesendet         |
| **Restrisiko**          | Mittel - Gnadenfrist ist ausnutzbar                                                                            |
| **Empfehlungen**        | Gnadenfrist verkürzen, Bestätigungsschritt hinzufügen                                                        |

#### T-ACCESS-002: AllowFrom-Spoofing

| Attribut                | Wert                                                                           |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0040 - AI Model Inference API Access                                      |
| **Beschreibung**        | Angreifer fälscht die Identität eines erlaubten Absenders im Channel           |
| **Angriffsvektor**      | Abhängig vom Channel - Spoofing von Telefonnummern, Imitation von Benutzernamen |
| **Betroffene Komponenten** | AllowFrom-Validierung pro Channel                                            |
| **Aktuelle Gegenmaßnahmen** | Channel-spezifische Identitätsverifizierung                                |
| **Restrisiko**          | Mittel - Einige Channel sind anfällig für Spoofing                             |
| **Empfehlungen**        | Channel-spezifische Risiken dokumentieren, kryptographische Verifikation dort hinzufügen, wo möglich |

#### T-ACCESS-003: Token-Diebstahl

| Attribut                | Wert                                                        |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - AI Model Inference API Access                   |
| **Beschreibung**        | Angreifer stiehlt Authentifizierungstokens aus Konfigurationsdateien |
| **Angriffsvektor**      | Malware, unautorisierter Gerätezugriff, Offenlegung durch Konfigurations-Backups |
| **Betroffene Komponenten** | ~/.openclaw/credentials/, Konfigurationsspeicher         |
| **Aktuelle Gegenmaßnahmen** | Dateiberechtigungen                                      |
| **Restrisiko**          | Hoch - Tokens werden im Klartext gespeichert                |
| **Empfehlungen**        | Verschlüsselung von Tokens im Ruhezustand implementieren, Token-Rotation hinzufügen |

---

### 3.3 Ausführung (AML.TA0005)

#### T-EXEC-001: Direkte Prompt Injection

| Attribut                | Wert                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM Prompt Injection: Direct                                              |
| **Beschreibung**        | Angreifer sendet präparierte Prompts, um das Verhalten des Agenten zu manipulieren        |
| **Angriffsvektor**      | Channel-Nachrichten mit adversarialen Anweisungen                                         |
| **Betroffene Komponenten** | Agent-LLM, alle Eingabeoberflächen                                                     |
| **Aktuelle Gegenmaßnahmen** | Mustererkennung, Wrapping externer Inhalte                                            |
| **Restrisiko**          | Kritisch - Nur Erkennung, kein Blocking; ausgefeilte Angriffe umgehen dies                |
| **Empfehlungen**        | Mehrschichtige Verteidigung, Output-Validierung, Benutzerbestätigung für sensible Aktionen implementieren |

#### T-EXEC-002: Indirekte Prompt Injection

| Attribut                | Wert                                                        |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.001 - LLM Prompt Injection: Indirect              |
| **Beschreibung**        | Angreifer bettet bösartige Anweisungen in abgerufene Inhalte ein |
| **Angriffsvektor**      | Bösartige URLs, vergiftete E-Mails, kompromittierte Webhooks |
| **Betroffene Komponenten** | web_fetch, E-Mail-Ingestion, externe Datenquellen        |
| **Aktuelle Gegenmaßnahmen** | Wrapping des Inhalts mit XML-Tags und Sicherheitshinweis |
| **Restrisiko**          | Hoch - LLM kann Wrapper-Anweisungen ignorieren              |
| **Empfehlungen**        | Inhaltsbereinigung implementieren, getrennte Ausführungskontexte |

#### T-EXEC-003: Tool-Argument-Injection

| Attribut                | Wert                                                         |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0051.000 - LLM Prompt Injection: Direct                 |
| **Beschreibung**        | Angreifer manipuliert Tool-Argumente durch Prompt Injection  |
| **Angriffsvektor**      | Präparierte Prompts, die Werte von Tool-Parametern beeinflussen |
| **Betroffene Komponenten** | Alle Tool-Aufrufe                                         |
| **Aktuelle Gegenmaßnahmen** | Exec-Genehmigungen für gefährliche Befehle               |
| **Restrisiko**          | Hoch - Vertraut auf das Urteilsvermögen des Benutzers        |
| **Empfehlungen**        | Argumentvalidierung, parametrisierte Tool-Aufrufe implementieren |

#### T-EXEC-004: Umgehung von Exec-Genehmigungen

| Attribut                | Wert                                                       |
| ----------------------- | ---------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0043 - Craft Adversarial Data                         |
| **Beschreibung**        | Angreifer erstellt Befehle, die die Allowlist für Genehmigungen umgehen |
| **Angriffsvektor**      | Befehlsverschleierung, Ausnutzung von Aliasen, Pfadmanipulation |
| **Betroffene Komponenten** | exec-approvals.ts, Befehls-Allowlist                     |
| **Aktuelle Gegenmaßnahmen** | Allowlist + Ask-Modus                                   |
| **Restrisiko**          | Hoch - Keine Befehlsbereinigung                            |
| **Empfehlungen**        | Befehlsnormalisierung implementieren, Blocklist erweitern  |

---

### 3.4 Persistenz (AML.TA0006)

#### T-PERSIST-001: Installation eines bösartigen Skills

| Attribut                | Wert                                                                     |
| ----------------------- | ------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0010.001 - Supply Chain Compromise: AI Software                     |
| **Beschreibung**        | Angreifer veröffentlicht bösartigen Skill auf ClawHub                    |
| **Angriffsvektor**      | Konto erstellen, Skill mit verstecktem bösartigem Code veröffentlichen   |
| **Betroffene Komponenten** | ClawHub, Skill-Laden, Agentenausführung                               |
| **Aktuelle Gegenmaßnahmen** | Verifizierung des Alters von GitHub-Konten, musterbasierte Moderations-Flags |
| **Restrisiko**          | Kritisch - Kein Sandboxing, begrenzte Prüfung                            |
| **Empfehlungen**        | VirusTotal-Integration (in Arbeit), Skill-Sandboxing, Community-Review  |

#### T-PERSIST-002: Vergiftung durch Skill-Update

| Attribut                | Wert                                                           |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Supply Chain Compromise: AI Software           |
| **Beschreibung**        | Angreifer kompromittiert einen populären Skill und veröffentlicht ein bösartiges Update |
| **Angriffsvektor**      | Kontokompromittierung, Social Engineering gegen den Skill-Eigentümer |
| **Betroffene Komponenten** | ClawHub-Versionierung, Auto-Update-Abläufe                  |
| **Aktuelle Gegenmaßnahmen** | Versions-Fingerprinting                                    |
| **Restrisiko**          | Hoch - Auto-Updates können bösartige Versionen laden           |
| **Empfehlungen**        | Signierung von Updates, Rollback-Fähigkeit, Version-Pinning implementieren |

#### T-PERSIST-003: Manipulation der Agentenkonfiguration

| Attribut                | Wert                                                            |
| ----------------------- | --------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.002 - Supply Chain Compromise: Data                   |
| **Beschreibung**        | Angreifer verändert die Agentenkonfiguration, um Zugriff zu persistieren |
| **Angriffsvektor**      | Änderung von Konfigurationsdateien, Injektion von Einstellungen |
| **Betroffene Komponenten** | Agentenkonfiguration, Tool-Richtlinien                       |
| **Aktuelle Gegenmaßnahmen** | Dateiberechtigungen                                         |
| **Restrisiko**          | Mittel - Erfordert lokalen Zugriff                              |
| **Empfehlungen**        | Integritätsprüfung der Konfiguration, Audit-Logging für Konfigurationsänderungen |

---

### 3.5 Umgehung von Abwehrmaßnahmen (AML.TA0007)

#### T-EVADE-001: Umgehung moderationsbasierter Muster

| Attribut                | Wert                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0043 - Craft Adversarial Data                                     |
| **Beschreibung**        | Angreifer gestaltet Skill-Inhalte so, dass Moderationsmuster umgangen werden |
| **Angriffsvektor**      | Unicode-Homoglyphen, Encoding-Tricks, dynamisches Laden                |
| **Betroffene Komponenten** | ClawHub moderation.ts                                               |
| **Aktuelle Gegenmaßnahmen** | Musterbasierte `FLAG_RULES`                                        |
| **Restrisiko**          | Hoch - Einfache Regex leicht zu umgehen                               |
| **Empfehlungen**        | Verhaltensanalyse hinzufügen (VirusTotal Code Insight), AST-basierte Erkennung |

#### T-EVADE-002: Escape aus dem Content-Wrapper

| Attribut                | Wert                                                      |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0043 - Craft Adversarial Data                        |
| **Beschreibung**        | Angreifer erstellt Inhalte, die aus dem XML-Wrapper-Kontext ausbrechen |
| **Angriffsvektor**      | Tag-Manipulation, Kontextverwirrung, Überschreiben von Anweisungen |
| **Betroffene Komponenten** | Wrapping externer Inhalte                              |
| **Aktuelle Gegenmaßnahmen** | XML-Tags + Sicherheitshinweis                          |
| **Restrisiko**          | Mittel - Neue Escape-Varianten werden regelmäßig entdeckt |
| **Empfehlungen**        | Mehrere Wrapper-Schichten, outputseitige Validierung      |

---

### 3.6 Discovery (AML.TA0008)

#### T-DISC-001: Enumeration von Tools

| Attribut                | Wert                                                  |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - AI Model Inference API Access             |
| **Beschreibung**        | Angreifer enumeriert verfügbare Tools durch Prompting |
| **Angriffsvektor**      | Abfragen im Stil von „Welche Tools hast du?“          |
| **Betroffene Komponenten** | Tool-Registry des Agenten                           |
| **Aktuelle Gegenmaßnahmen** | Keine spezifischen                                 |
| **Restrisiko**          | Niedrig - Tools sind im Allgemeinen dokumentiert      |
| **Empfehlungen**        | Sichtbarkeitssteuerungen für Tools in Betracht ziehen |

#### T-DISC-002: Extraktion von Sitzungsdaten

| Attribut                | Wert                                                  |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - AI Model Inference API Access             |
| **Beschreibung**        | Angreifer extrahiert sensible Daten aus dem Sitzungs-Kontext |
| **Angriffsvektor**      | Abfragen wie „Was haben wir besprochen?“, Sondieren des Kontexts |
| **Betroffene Komponenten** | Sitzungs-Transkripte, Kontextfenster                |
| **Aktuelle Gegenmaßnahmen** | Sitzungsisolierung pro Absender                    |
| **Restrisiko**          | Mittel - Daten innerhalb der Sitzung sind zugänglich  |
| **Empfehlungen**        | Redaction sensibler Daten im Kontext implementieren   |

---

### 3.7 Sammlung & Exfiltration (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Datendiebstahl über web_fetch

| Attribut                | Wert                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Collection                                                 |
| **Beschreibung**        | Angreifer exfiltriert Daten, indem er den Agenten anweist, sie an eine externe URL zu senden |
| **Angriffsvektor**      | Prompt Injection, die den Agenten dazu bringt, Daten per POST an einen Angreifer-Server zu senden |
| **Betroffene Komponenten** | Tool `web_fetch`                                                    |
| **Aktuelle Gegenmaßnahmen** | SSRF-Blockierung für interne Netzwerke                            |
| **Restrisiko**          | Hoch - Externe URLs sind erlaubt                                       |
| **Empfehlungen**        | URL-Allowlisting, Bewusstsein für Datenklassifizierung implementieren   |

#### T-EXFIL-002: Unautorisierter Nachrichtenversand

| Attribut                | Wert                                                             |
| ----------------------- | ---------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Collection                                           |
| **Beschreibung**        | Angreifer veranlasst den Agenten, Nachrichten mit sensiblen Daten zu senden |
| **Angriffsvektor**      | Prompt Injection, die den Agenten dazu bringt, dem Angreifer zu schreiben |
| **Betroffene Komponenten** | Nachrichtentool, Channel-Integrationen                        |
| **Aktuelle Gegenmaßnahmen** | Gating für ausgehende Nachrichten                            |
| **Restrisiko**          | Mittel - Gating kann umgangen werden                             |
| **Empfehlungen**        | Explizite Bestätigung für neue Empfänger verlangen                |

#### T-EXFIL-003: Harvesting von Anmeldedaten

| Attribut                | Wert                                                    |
| ----------------------- | ------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Collection                                  |
| **Beschreibung**        | Bösartiger Skill sammelt Anmeldedaten aus dem Agentenkontext |
| **Angriffsvektor**      | Skill-Code liest Umgebungsvariablen, Konfigurationsdateien |
| **Betroffene Komponenten** | Ausführungsumgebung des Skills                        |
| **Aktuelle Gegenmaßnahmen** | Keine spezifisch für Skills                          |
| **Restrisiko**          | Kritisch - Skills laufen mit den Privilegien des Agenten |
| **Empfehlungen**        | Skill-Sandboxing, Isolierung von Anmeldedaten           |

---

### 3.8 Auswirkungen (AML.TA0011)

#### T-IMPACT-001: Unautorisierte Befehlsausführung

| Attribut                | Wert                                                |
| ----------------------- | --------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Erode AI Model Integrity                |
| **Beschreibung**        | Angreifer führt beliebige Befehle auf dem System des Benutzers aus |
| **Angriffsvektor**      | Prompt Injection kombiniert mit Umgehung der Exec-Genehmigung |
| **Betroffene Komponenten** | Bash-Tool, Befehlsausführung                      |
| **Aktuelle Gegenmaßnahmen** | Exec-Genehmigungen, Option für Docker-Sandbox   |
| **Restrisiko**          | Kritisch - Host-Ausführung ohne Sandbox             |
| **Empfehlungen**        | Standardmäßig Sandbox verwenden, UX für Genehmigungen verbessern |

#### T-IMPACT-002: Erschöpfung von Ressourcen (DoS)

| Attribut                | Wert                                               |
| ----------------------- | -------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Erode AI Model Integrity               |
| **Beschreibung**        | Angreifer erschöpft API-Credits oder Rechenressourcen |
| **Angriffsvektor**      | Automatisiertes Flooding mit Nachrichten, teure Tool-Calls |
| **Betroffene Komponenten** | Gateway, Agentensitzungen, API-Anbieter         |
| **Aktuelle Gegenmaßnahmen** | Keine                                            |
| **Restrisiko**          | Hoch - Keine Ratenbegrenzung                       |
| **Empfehlungen**        | Ratenlimits pro Absender, Kostenbudgets implementieren |

#### T-IMPACT-003: Rufschädigung

| Attribut                | Wert                                                    |
| ----------------------- | ------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Erode AI Model Integrity                    |
| **Beschreibung**        | Angreifer bringt den Agenten dazu, schädliche/anstößige Inhalte zu senden |
| **Angriffsvektor**      | Prompt Injection, die unangemessene Antworten auslöst   |
| **Betroffene Komponenten** | Ausgabeerzeugung, Channel-Messaging                   |
| **Aktuelle Gegenmaßnahmen** | Inhaltsrichtlinien des LLM-Anbieters                |
| **Restrisiko**          | Mittel - Anbieterfilter sind unvollkommen               |
| **Empfehlungen**        | Output-Filter-Schicht, Benutzersteuerungen              |

---

## 4. Analyse der ClawHub-Supply-Chain

### 4.1 Aktuelle Sicherheitsmaßnahmen

| Maßnahme              | Implementierung              | Wirksamkeit                                               |
| --------------------- | --------------------------- | --------------------------------------------------------- |
| Alter des GitHub-Kontos | `requireGitHubAccountAge()` | Mittel - erhöht die Hürde für neue Angreifer             |
| Pfadsäuberung         | `sanitizePath()`            | Hoch - verhindert Path Traversal                         |
| Validierung des Dateityps | `isTextFile()`           | Mittel - nur Textdateien, aber sie können dennoch bösartig sein |
| Größenlimits          | 50MB Gesamt-Bundle          | Hoch - verhindert Erschöpfung von Ressourcen             |
| Erforderliche SKILL.md | Verpflichtende Readme      | Geringer Sicherheitswert - nur informativ                |
| Moderation über Muster | `FLAG_RULES` in moderation.ts | Gering - leicht zu umgehen                             |
| Moderationsstatus     | Feld `moderationStatus`     | Mittel - manuelle Prüfung möglich                        |

### 4.2 Muster für Moderations-Flags

Aktuelle Muster in `moderation.ts`:

```javascript
// Bekannte schädliche Kennungen
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Verdächtige Schlüsselwörter
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Einschränkungen:**

- Prüft nur slug, displayName, summary, frontmatter, metadata, Dateipfade
- Analysiert nicht den tatsächlichen Skill-Code-Inhalt
- Einfache Regex lässt sich leicht durch Obfuskation umgehen
- Keine Verhaltensanalyse

### 4.3 Geplante Verbesserungen

| Verbesserung           | Status                                | Auswirkung                                                          |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| VirusTotal-Integration | In Arbeit                             | Hoch - verhaltensbasierte Analyse mit Code Insight                  |
| Community-Reporting    | Teilweise (`skillReports`-Tabelle existiert) | Mittel                                                        |
| Audit-Logging          | Teilweise (`auditLogs`-Tabelle existiert) | Mittel                                                          |
| Badge-System           | Implementiert                         | Mittel - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Risikomatrix

### 5.1 Wahrscheinlichkeit vs. Auswirkung

| Bedrohungs-ID | Wahrscheinlichkeit | Auswirkung | Risikostufe  | Priorität |
| ------------- | ------------------ | ---------- | ------------ | --------- |
| T-EXEC-001    | Hoch               | Kritisch   | **Kritisch** | P0        |
| T-PERSIST-001 | Hoch               | Kritisch   | **Kritisch** | P0        |
| T-EXFIL-003   | Mittel             | Kritisch   | **Kritisch** | P0        |
| T-IMPACT-001  | Mittel             | Kritisch   | **Hoch**     | P1        |
| T-EXEC-002    | Hoch               | Hoch       | **Hoch**     | P1        |
| T-EXEC-004    | Mittel             | Hoch       | **Hoch**     | P1        |
| T-ACCESS-003  | Mittel             | Hoch       | **Hoch**     | P1        |
| T-EXFIL-001   | Mittel             | Hoch       | **Hoch**     | P1        |
| T-IMPACT-002  | Hoch               | Mittel     | **Hoch**     | P1        |
| T-EVADE-001   | Hoch               | Mittel     | **Mittel**   | P2        |
| T-ACCESS-001  | Niedrig            | Hoch       | **Mittel**   | P2        |
| T-ACCESS-002  | Niedrig            | Hoch       | **Mittel**   | P2        |
| T-PERSIST-002 | Niedrig            | Hoch       | **Mittel**   | P2        |

### 5.2 Kritische Angriffspfade

**Angriffskette 1: Skill-basierter Datendiebstahl**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Bösartigen Skill veröffentlichen) → (Moderation umgehen) → (Anmeldedaten sammeln)
```

**Angriffskette 2: Prompt Injection zu RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Prompt injizieren) → (Exec-Genehmigung umgehen) → (Befehle ausführen)
```

**Angriffskette 3: Indirekte Injection über abgerufene Inhalte**

```
T-EXEC-002 → T-EXFIL-001 → Externe Exfiltration
(URL-Inhalt vergiften) → (Agent ruft ihn ab und folgt Anweisungen) → (Daten werden an Angreifer gesendet)
```

---

## 6. Zusammenfassung der Empfehlungen

### 6.1 Sofort (P0)

| ID    | Empfehlung                                  | Adressiert                 |
| ----- | ------------------------------------------- | -------------------------- |
| R-001 | VirusTotal-Integration abschließen          | T-PERSIST-001, T-EVADE-001 |
| R-002 | Skill-Sandboxing implementieren             | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Output-Validierung für sensible Aktionen hinzufügen | T-EXEC-001, T-EXEC-002     |

### 6.2 Kurzfristig (P1)

| ID    | Empfehlung                                  | Adressiert   |
| ----- | ------------------------------------------- | ------------ |
| R-004 | Ratenbegrenzung implementieren              | T-IMPACT-002 |
| R-005 | Verschlüsselung von Tokens im Ruhezustand hinzufügen | T-ACCESS-003 |
| R-006 | UX und Validierung für Exec-Genehmigungen verbessern | T-EXEC-004   |
| R-007 | URL-Allowlisting für `web_fetch` implementieren | T-EXFIL-001  |

### 6.3 Mittelfristig (P2)

| ID    | Empfehlung                                           | Adressiert    |
| ----- | ---------------------------------------------------- | ------------- |
| R-008 | Kryptographische Verifikation für Channel dort hinzufügen, wo möglich | T-ACCESS-002  |
| R-009 | Integritätsprüfung der Konfiguration implementieren  | T-PERSIST-003 |
| R-010 | Signierung von Updates und Version-Pinning hinzufügen | T-PERSIST-002 |

---

## 7. Anhänge

### 7.1 Zuordnung der ATLAS-Techniken

| ATLAS-ID      | Technikname                     | OpenClaw-Bedrohungen                                              |
| ------------- | ------------------------------- | ----------------------------------------------------------------- |
| AML.T0006     | Active Scanning                 | T-RECON-001, T-RECON-002                                          |
| AML.T0009     | Collection                      | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                             |
| AML.T0010.001 | Supply Chain: AI Software       | T-PERSIST-001, T-PERSIST-002                                      |
| AML.T0010.002 | Supply Chain: Data              | T-PERSIST-003                                                     |
| AML.T0031     | Erode AI Model Integrity        | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                          |
| AML.T0040     | AI Model Inference API Access   | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002  |
| AML.T0043     | Craft Adversarial Data          | T-EXEC-004, T-EVADE-001, T-EVADE-002                              |
| AML.T0051.000 | LLM Prompt Injection: Direct    | T-EXEC-001, T-EXEC-003                                            |
| AML.T0051.001 | LLM Prompt Injection: Indirect  | T-EXEC-002                                                        |

### 7.2 Zentrale Sicherheitsdateien

| Pfad                                | Zweck                         | Risikostufe  |
| ----------------------------------- | ----------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | Logik für Befehlsgenehmigungen | **Kritisch** |
| `src/gateway/auth.ts`               | Gateway-Authentifizierung     | **Kritisch** |
| `src/infra/net/ssrf.ts`             | SSRF-Schutz                   | **Kritisch** |
| `src/security/external-content.ts`  | Gegenmaßnahme gegen Prompt Injection | **Kritisch** |
| `src/agents/sandbox/tool-policy.ts` | Durchsetzung von Tool-Richtlinien | **Kritisch** |
| `src/routing/resolve-route.ts`      | Sitzungsisolierung            | **Mittel**   |

### 7.3 Glossar

| Begriff               | Definition                                                 |
| --------------------- | ---------------------------------------------------------- |
| **ATLAS**             | MITREs Adversarial Threat Landscape for AI Systems         |
| **ClawHub**           | OpenClaws Skill-Marktplatz                                 |
| **Gateway**           | OpenClaws Schicht für Nachrichtenrouting und Authentifizierung |
| **MCP**               | Model Context Protocol - Schnittstelle für Tool-Anbieter   |
| **Prompt Injection**  | Angriff, bei dem bösartige Anweisungen in Eingaben eingebettet werden |
| **Skill**             | Herunterladbare Erweiterung für OpenClaw-Agenten           |
| **SSRF**              | Server-Side Request Forgery                                |

---

_Dieses Bedrohungsmodell ist ein lebendes Dokument. Melden Sie Sicherheitsprobleme an security@openclaw.ai_

## Verwandt

- [Formale Verifikation](/de/security/formal-verification)
- [Zum Bedrohungsmodell beitragen](/de/security/CONTRIBUTING-THREAT-MODEL)
