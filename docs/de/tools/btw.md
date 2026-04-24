---
read_when:
    - Sie möchten eine kurze Nebenfrage zur aktuellen Sitzung stellen
    - Sie implementieren oder debuggen BTW-Verhalten clientübergreifend
summary: Ephemere Nebenfragen mit /btw
title: BTW-Nebenfragen
x-i18n:
    generated_at: "2026-04-24T07:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8b74f82356a1ecc38b2a2104b3c4616ef4530d2ce804910b24666c4932169e
    source_path: tools/btw.md
    workflow: 15
---

`/btw` ermöglicht es Ihnen, eine schnelle Nebenfrage zur **aktuellen Sitzung** zu stellen, ohne
dass diese Frage Teil des normalen Konversationsverlaufs wird.

Es orientiert sich am `/btw`-Verhalten von Claude Code, ist aber an die Gateway- und Multi-Channel-Architektur von OpenClaw angepasst.

## Was es tut

Wenn Sie Folgendes senden:

```text
/btw what changed?
```

macht OpenClaw Folgendes:

1. erstellt einen Snapshot des aktuellen Sitzungskontexts,
2. führt einen separaten **toollosen** Modellaufruf aus,
3. beantwortet nur die Nebenfrage,
4. lässt den Hauptlauf unverändert,
5. schreibt weder die BTW-Frage noch die Antwort in den Sitzungsverlauf,
6. gibt die Antwort als **Live-Seitenergebnis** statt als normale Assistant-Nachricht aus.

Das wichtige mentale Modell ist:

- derselbe Sitzungskontext
- separate einmalige Nebenanfrage
- keine Tool-Aufrufe
- keine Verschmutzung zukünftigen Kontexts
- keine persistente Speicherung im Transkript

## Was es nicht tut

`/btw` tut **nicht** Folgendes:

- eine neue dauerhafte Sitzung erstellen,
- die unvollendete Hauptaufgabe fortsetzen,
- Tools oder Tool-Schleifen des Agenten ausführen,
- BTW-Frage/Antwort in den Transkriptverlauf schreiben,
- in `chat.history` erscheinen,
- einen Reload überleben.

Es ist absichtlich **ephemer**.

## Wie der Kontext funktioniert

BTW verwendet die aktuelle Sitzung nur als **Hintergrundkontext**.

Wenn der Hauptlauf gerade aktiv ist, erstellt OpenClaw einen Snapshot des aktuellen Nachrichten-
Status und nimmt den laufenden Haupt-Prompt als Hintergrundkontext auf, während es
dem Modell ausdrücklich sagt:

- nur die Nebenfrage beantworten,
- die unvollendete Hauptaufgabe nicht fortsetzen oder abschließen,
- keine Tool-Aufrufe oder Pseudo-Tool-Aufrufe ausgeben.

Dadurch bleibt BTW vom Hauptlauf getrennt und ist sich trotzdem bewusst, worum es in
der Sitzung geht.

## Zustellungsmodell

BTW wird **nicht** als normale Assistant-Transkript-Nachricht zugestellt.

Auf Ebene des Gateway-Protokolls gilt:

- normaler Assistant-Chat verwendet das Ereignis `chat`
- BTW verwendet das Ereignis `chat.side_result`

Diese Trennung ist absichtlich. Wenn BTW denselben normalen `chat`-Ereignispfad verwenden würde,
würden Clients es als regulären Konversationsverlauf behandeln.

Da BTW ein separates Live-Ereignis verwendet und nicht aus
`chat.history` erneut abgespielt wird, verschwindet es nach einem Reload.

## Verhalten an der Oberfläche

### TUI

In der TUI wird BTW inline in der aktuellen Sitzungsansicht gerendert, bleibt aber
ephemer:

- sichtbar von einer normalen Assistant-Antwort unterscheidbar
- mit `Enter` oder `Esc` ausblendbar
- wird bei Reload nicht erneut abgespielt

### Externe Kanäle

Auf Kanälen wie Telegram, WhatsApp und Discord wird BTW als
klar gekennzeichnete einmalige Antwort zugestellt, weil diese Oberflächen kein lokales
Overlay-Konzept für ephemere Inhalte haben.

Die Antwort wird weiterhin als Seitenergebnis behandelt, nicht als normaler Sitzungsverlauf.

### Control UI / Web

Das Gateway gibt BTW korrekt als `chat.side_result` aus, und BTW ist nicht in
`chat.history` enthalten, daher ist der Persistenzvertrag für das Web bereits korrekt.

Die aktuelle Control UI benötigt noch einen dedizierten Consumer für `chat.side_result`, um BTW live im Browser darzustellen. Bis diese clientseitige Unterstützung verfügbar ist, ist BTW auf Gateway-Ebene eine vollständige Funktion mit vollem Verhalten in TUI und externen Kanälen, aber noch keine vollständige Browser-UX.

## Wann BTW verwendet werden sollte

Verwenden Sie `/btw`, wenn Sie Folgendes möchten:

- eine schnelle Klarstellung zur aktuellen Arbeit,
- eine faktische Nebenantwort, während ein langer Lauf noch in Arbeit ist,
- eine temporäre Antwort, die nicht Teil des zukünftigen Sitzungskontexts werden soll.

Beispiele:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Wann BTW nicht verwendet werden sollte

Verwenden Sie `/btw` nicht, wenn die Antwort Teil des
zukünftigen Arbeitskontexts der Sitzung werden soll.

Stellen Sie die Frage in diesem Fall normal in der Hauptsitzung statt BTW zu verwenden.

## Verwandt

- [Slash commands](/de/tools/slash-commands)
- [Thinking Levels](/de/tools/thinking)
- [Session](/de/concepts/session)
