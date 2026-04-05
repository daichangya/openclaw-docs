---
read_when:
    - Sie möchten eine kurze Nebenfrage zur aktuellen Sitzung stellen
    - Sie implementieren oder debuggen das BTW-Verhalten über verschiedene Clients hinweg
summary: Vergängliche Nebenfragen mit /btw
title: BTW-Nebenfragen
x-i18n:
    generated_at: "2026-04-05T12:56:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: aeef33ba19eb0561693fecea9dd39d6922df93be0b9a89446ed17277bcee58aa
    source_path: tools/btw.md
    workflow: 15
---

# BTW-Nebenfragen

Mit `/btw` können Sie eine kurze Nebenfrage zur **aktuellen Sitzung** stellen, ohne
dass diese Frage zum normalen Gesprächsverlauf wird.

Es ist am Verhalten von `/btw` in Claude Code angelehnt, aber an die
Gateway- und Mehrkanalarchitektur von OpenClaw angepasst.

## Was es tut

Wenn Sie Folgendes senden:

```text
/btw what changed?
```

führt OpenClaw Folgendes aus:

1. Es erstellt einen Snapshot des aktuellen Sitzungskontexts.
2. Es führt einen separaten **toollosen** Modellaufruf aus.
3. Es beantwortet nur die Nebenfrage.
4. Es lässt die Hauptausführung unverändert.
5. Es schreibt weder die BTW-Frage noch die Antwort in den Sitzungsverlauf.
6. Es gibt die Antwort als **Live-Nebenergebnis** statt als normale Assistentennachricht aus.

Das wichtige mentale Modell ist:

- derselbe Sitzungskontext
- separate einmalige Nebenanfrage
- keine Tool-Aufrufe
- keine Verunreinigung des zukünftigen Kontexts
- keine Persistenz im Transkript

## Was es nicht tut

`/btw` macht **nicht** Folgendes:

- eine neue dauerhafte Sitzung erstellen,
- die unvollendete Hauptaufgabe fortsetzen,
- Tools oder Tool-Schleifen des Agenten ausführen,
- BTW-Frage-/Antwortdaten in den Transkriptverlauf schreiben,
- in `chat.history` erscheinen,
- ein Neuladen überdauern.

Es ist bewusst **vergänglich**.

## Wie der Kontext funktioniert

BTW verwendet die aktuelle Sitzung nur als **Hintergrundkontext**.

Wenn die Hauptausführung derzeit aktiv ist, erstellt OpenClaw einen Snapshot des aktuellen Nachrichtenstatus
und nimmt den laufenden Haupt-Prompt als Hintergrundkontext auf, während es dem Modell
ausdrücklich mitteilt:

- nur die Nebenfrage zu beantworten,
- die unvollendete Hauptaufgabe nicht wieder aufzunehmen oder abzuschließen,
- keine Tool-Aufrufe oder Pseudo-Tool-Aufrufe auszugeben.

Dadurch bleibt BTW von der Hauptausführung isoliert und weiß trotzdem, worum es in
der Sitzung geht.

## Zustellungsmodell

BTW wird **nicht** als normale Assistenten-Transkriptnachricht zugestellt.

Auf der Ebene des Gateway-Protokolls gilt:

- normaler Assistenten-Chat verwendet das Ereignis `chat`
- BTW verwendet das Ereignis `chat.side_result`

Diese Trennung ist beabsichtigt. Wenn BTW denselben normalen `chat`-Ereignispfad wiederverwenden würde,
würden Clients es wie den regulären Gesprächsverlauf behandeln.

Da BTW ein separates Live-Ereignis verwendet und nicht aus
`chat.history` wiedergegeben wird, verschwindet es nach dem Neuladen.

## Verhalten an der Oberfläche

### TUI

In TUI wird BTW inline in der aktuellen Sitzungsansicht gerendert, bleibt aber
vergänglich:

- sichtbar von einer normalen Assistentenantwort unterschieden
- mit `Enter` oder `Esc` verwerfbar
- wird nach einem Neuladen nicht erneut wiedergegeben

### Externe Kanäle

Auf Kanälen wie Telegram, WhatsApp und Discord wird BTW als
klar gekennzeichnete einmalige Antwort zugestellt, weil diese Oberflächen kein lokales Konzept
für ein vergängliches Overlay haben.

Die Antwort wird weiterhin als Nebenergebnis behandelt, nicht als normaler Sitzungsverlauf.

### Control UI / Web

Das Gateway gibt BTW korrekt als `chat.side_result` aus, und BTW ist nicht in
`chat.history` enthalten, daher ist der Persistenzvertrag für das Web bereits korrekt.

Die aktuelle Control UI benötigt noch einen dedizierten `chat.side_result`-Consumer, um
BTW live im Browser zu rendern. Bis diese clientseitige Unterstützung verfügbar ist, ist BTW eine
Funktion auf Gateway-Ebene mit vollständigem Verhalten in TUI und externen Kanälen, aber noch
kein vollständiges Browser-UX.

## Wann BTW verwendet werden sollte

Verwenden Sie `/btw`, wenn Sie Folgendes möchten:

- eine kurze Klarstellung zur aktuellen Arbeit,
- eine sachliche Nebenantwort, während noch eine lange Ausführung läuft,
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

Stellen Sie die Frage in diesem Fall normal in der Hauptsitzung, statt BTW zu verwenden.

## Verwandt

- [Slash-Befehle](/tools/slash-commands)
- [Thinking Levels](/tools/thinking)
- [Sitzung](/de/concepts/session)
