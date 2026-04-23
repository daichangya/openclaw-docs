---
read_when:
    - Tekrarlanan node exec tamamlama olaylarında hata ayıklama yapıyorsunuz
    - Heartbeat/sistem olayı tekrar kaldırma üzerinde çalışıyorsunuz
summary: Yinelenen eşzamansız exec tamamlama eklemesi için inceleme notları
title: Eşzamansız Exec Yinelenen Tamamlama İncelemesi
x-i18n:
    generated_at: "2026-04-23T09:10:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b0a3287b78bbc4c41e4354e9062daba7ae790fa207eee9a5f77515b958b510b
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Eşzamansız Exec Yinelenen Tamamlama İncelemesi

## Kapsam

- Oturum: `agent:main:telegram:group:-1003774691294:topic:1`
- Belirti: aynı eşzamansız exec tamamlaması, `keen-nexus` oturum/çalıştırma kimliği için LCM içinde kullanıcı dönüşleri olarak iki kez kaydedildi.
- Hedef: bunun büyük olasılıkla yinelenen oturum eklemesi mi yoksa düz giden teslimat yeniden denemesi mi olduğunu belirlemek.

## Sonuç

Bunun büyük olasılıkla saf bir giden teslimat yeniden denemesi değil, **yinelenen oturum eklemesi** olduğu görülüyor.

Gateway tarafındaki en güçlü boşluk **node exec tamamlama yolunda**:

1. Node tarafındaki bir exec bitişi, tam `runId` ile `exec.finished` üretir.
2. Gateway `server-node-events`, bunu bir sistem olayına dönüştürür ve bir Heartbeat ister.
3. Heartbeat çalıştırması, boşaltılmış sistem olayı bloğunu agent prompt'una ekler.
4. Gömülü runner, bu prompt'u oturum transkriptinde yeni bir kullanıcı dönüşü olarak kalıcılaştırır.

Aynı `exec.finished`, aynı `runId` için Gateway'e herhangi bir nedenle iki kez ulaşırsa (replay, yeniden bağlanma yinelenmesi, upstream yeniden gönderim, yinelenmiş üretici), OpenClaw şu anda bu yol üzerinde `runId`/`contextKey` ile anahtarlanmış bir **idempotency denetimine sahip değil**. İkinci kopya aynı içeriğe sahip ikinci bir kullanıcı mesajına dönüşür.

## Tam Kod Yolu

### 1. Üretici: node exec tamamlama olayı

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)`, `exec.finished` olayıyla `node.event` üretir.
  - Payload `sessionKey` ve tam `runId` içerir.

### 2. Gateway olay alımı

- `src/gateway/server-node-events.ts:574-640`
  - `exec.finished` olayını işler.
  - Şu metni oluşturur:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Bunu şu şekilde kuyruğa alır:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Hemen bir uyandırma ister:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Sistem olayı tekrar kaldırma zayıflığı

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)`, yalnızca **ardışık yinelenen metni** bastırır:
    - `if (entry.lastText === cleaned) return false`
  - `contextKey` saklar, ancak idempotency için `contextKey` kullanmaz.
  - Drain sonrası yinelenen bastırma sıfırlanır.

Bu, aynı `runId` ile yeniden oynatılan bir `exec.finished` olayının, kod zaten kararlı bir idempotency adayı olan (`exec:<runId>`) değere sahip olsa bile daha sonra tekrar kabul edilebileceği anlamına gelir.

### 4. Uyandırma işleme birincil çoğaltıcı değil

- `src/infra/heartbeat-wake.ts:79-117`
  - Uyandırmalar `(agentId, sessionKey)` ile birleştirilir.
  - Aynı hedefe yönelik yinelenen uyandırma istekleri tek bir bekleyen uyandırma girdisinde birleşir.

Bu, **tek başına yinelenen uyandırma işlemenin** yinelenen olay alımına göre daha zayıf bir açıklama olduğu anlamına gelir.

### 5. Heartbeat olayı tüketir ve prompt girdisine dönüştürür

- `src/infra/heartbeat-runner.ts:535-574`
  - Preflight, bekleyen sistem olaylarına bakar ve exec-event çalıştırmalarını sınıflandırır.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)`, oturum kuyruğunu boşaltır.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Boşaltılmış sistem olayı bloğu agent prompt gövdesinin başına eklenir.

### 6. Transkript ekleme noktası

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)`, tam prompt'u gömülü PI oturumuna gönderir.
  - Tamamlama türetilmiş prompt'un kalıcı kullanıcı dönüşüne dönüştüğü nokta burasıdır.

Dolayısıyla aynı sistem olayı prompt içine iki kez yeniden kurulursa, yinelenen LCM kullanıcı mesajları beklenen bir sonuçtur.

## Neden düz giden teslimat yeniden denemesi daha az olası

Heartbeat runner içinde gerçek bir giden hata yolu vardır:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Önce yanıt üretilir.
  - Giden teslimat daha sonra `deliverOutboundPayloads(...)` aracılığıyla gerçekleşir.
  - Buradaki başarısızlık `{ status: "failed" }` döndürür.

Ancak aynı sistem olayı kuyruğu girdisi için bu tek başına **yinelenen kullanıcı dönüşlerini** açıklamak için yeterli değildir:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - Sistem olayı kuyruğu, giden teslimattan önce zaten boşaltılmıştır.

Dolayısıyla bir kanal gönderim yeniden denemesi tek başına aynı kuyruğa alınmış olayı yeniden oluşturmaz. Bu, eksik/başarısız harici teslimatı açıklayabilir, ancak tek başına ikinci özdeş oturum kullanıcı mesajını açıklamaz.

## İkincil, daha düşük güvenli olasılık

Agent runner içinde tam çalıştırma yeniden deneme döngüsü vardır:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Belirli geçici hatalar tüm çalıştırmayı yeniden deneyebilir ve aynı `commandBody` değerini yeniden gönderebilir.

Bu, yeniden deneme koşulu tetiklenmeden önce prompt zaten eklenmişse **aynı yanıt yürütmesi içinde** kalıcı kullanıcı prompt'unu çoğaltabilir.

Bunu yinelenen `exec.finished` alımından daha düşük olasılıklı görüyorum çünkü:

- gözlenen boşluk yaklaşık 51 saniyeydi; bu, süreç içi yeniden denemeden çok ikinci bir uyandırma/dönüşe benziyor;
- rapor zaten tekrarlanan mesaj gönderim hatalarından söz ediyor; bu da anlık model/çalışma zamanı yeniden denemesinden çok ayrı bir daha sonraki dönüşe işaret ediyor.

## Kök Neden Hipotezi

En yüksek güvenli hipotez:

- `keen-nexus` tamamlaması **node exec olay yolu** üzerinden geldi.
- Aynı `exec.finished`, `server-node-events` adresine iki kez teslim edildi.
- Gateway ikisini de kabul etti çünkü `enqueueSystemEvent(...)`, `contextKey` / `runId` ile tekrar kaldırma yapmıyor.
- Kabul edilen her olay bir Heartbeat tetikledi ve PI transkriptine kullanıcı dönüşü olarak eklendi.

## Önerilen küçük cerrahi düzeltme

Bir düzeltme isteniyorsa, en küçük yüksek değerli değişiklik şudur:

- exec/sistem-olayı idempotency'sinin, en azından tam `(sessionKey, contextKey, text)` tekrarları için kısa bir ufuk boyunca `contextKey` değerini dikkate almasını sağlamak;
- veya `server-node-events` içinde `(sessionKey, runId, event kind)` ile anahtarlanmış `exec.finished` için özel bir tekrar kaldırma eklemek.

Bu, yeniden oynatılan `exec.finished` yinelenmelerini oturum dönüşlerine dönüşmeden önce doğrudan engeller.
