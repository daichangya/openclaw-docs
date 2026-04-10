---
read_when:
    - Ajan döngüsünün veya yaşam döngüsü olaylarının tam bir adım adım açıklamasına ihtiyacınız var
summary: Ajan döngüsü yaşam döngüsü, akışlar ve bekleme semantiği
title: Ajan Döngüsü
x-i18n:
    generated_at: "2026-04-10T08:50:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6831a5b11e9100e49f650feca51ab44a2bef242ce1b5db2766d0b3b5c5ba729
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Ajan Döngüsü (OpenClaw)

Ajanik döngü, bir ajanın tam “gerçek” çalıştırmasıdır: alım → bağlam oluşturma → model çıkarımı →
araç yürütme → akış halinde yanıtlar → kalıcılık. Bu, bir mesajı eylemlere ve nihai yanıta dönüştüren,
oturum durumunu tutarlı tutarken bunu yapan yetkili yoldur.

OpenClaw’da bir döngü, model düşünürken, araç çağırırken ve çıktı akışı sağlarken yaşam döngüsü ve akış olayları
yayan, oturum başına tek ve serileştirilmiş bir çalıştırmadır. Bu belge, bu gerçek döngünün uçtan uca nasıl
bağlandığını açıklar.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `agent` komutu.

## Nasıl çalışır (üst düzey)

1. `agent` RPC parametreleri doğrular, oturumu çözer (`sessionKey/sessionId`), oturum meta verilerini kalıcılaştırır, hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` ajanı çalıştırır:
   - model + thinking/verbose varsayılanlarını çözer
   - Skills anlık görüntüsünü yükler
   - `runEmbeddedPiAgent` çağırır (pi-agent-core çalışma zamanı)
   - gömülü döngü bir tane yayımlamazsa **yaşam döngüsü end/error** yayar
3. `runEmbeddedPiAgent`:
   - çalıştırmaları oturum başına + genel kuyruklar aracılığıyla serileştirir
   - model + auth profilini çözer ve pi oturumunu oluşturur
   - pi olaylarına abone olur ve assistant/tool deltalarını akış halinde iletir
   - zaman aşımını uygular -> aşılırsa çalıştırmayı iptal eder
   - payload’ları + kullanım meta verilerini döndürür
4. `subscribeEmbeddedPiSession`, pi-agent-core olaylarını OpenClaw `agent` akışına köprüler:
   - araç olayları => `stream: "tool"`
   - assistant deltaları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **yaşam döngüsü end/error** olayını bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruklama + eşzamanlılık

- Çalıştırmalar oturum anahtarı başına (oturum hattı) ve isteğe bağlı olarak genel bir hat üzerinden serileştirilir.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları, bu hat sistemine beslenen kuyruk modlarını (collect/steer/followup) seçebilir.
  Bkz. [Komut Kuyruğu](/tr/concepts/queue).

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözülür ve oluşturulur; sandbox’lı çalıştırmalar bir sandbox çalışma alanı köküne yeniden yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve env ile prompt içine enjekte edilir.
- Bootstrap/context dosyaları çözülür ve sistem prompt raporuna enjekte edilir.
- Bir oturum yazma kilidi alınır; `SessionManager`, akış başlamadan önce açılır ve hazırlanır.

## Prompt oluşturma + sistem prompt

- Sistem prompt, OpenClaw’ın temel prompt’u, Skills prompt’u, bootstrap bağlamı ve çalıştırma başına geçersiz kılmalarla oluşturulur.
- Modele özgü sınırlar ve compaction için ayrılan token’lar uygulanır.
- Modelin ne gördüğü için bkz. [Sistem prompt](/tr/concepts/system-prompt).

## Hook noktaları (nerede araya girebilirsiniz)

OpenClaw’ın iki hook sistemi vardır:

- **İç hook’lar** (Gateway hook’ları): komutlar ve yaşam döngüsü olayları için olay güdümlü script’ler.
- **Plugin hook’ları**: ajan/araç yaşam döngüsü ve gateway işlem hattı içindeki uzatma noktaları.

### İç hook’lar (Gateway hook’ları)

- **`agent:bootstrap`**: bootstrap dosyaları oluşturulurken, sistem prompt tamamlanmadan önce çalışır.
  Bunu bootstrap bağlam dosyaları eklemek/çıkarmak için kullanın.
- **Komut hook’ları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (bkz. Hooks belgesi).

Kurulum ve örnekler için bkz. [Hooks](/tr/automation/hooks).

### Plugin hook’ları (ajan + gateway yaşam döngüsü)

Bunlar ajan döngüsü veya gateway işlem hattı içinde çalışır:

- **`before_model_resolve`**: model çözümlemesinden önce sağlayıcıyı/modeli deterministik olarak geçersiz kılmak için oturum öncesinde (`messages` olmadan) çalışır.
- **`before_prompt_build`**: oturum yüklendikten sonra (`messages` ile) prompt gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` enjekte etmek için çalışır. Tur başına dinamik metin için `prependContext`, sistem prompt alanında kalması gereken kararlı yönlendirme için sistem bağlamı alanlarını kullanın.
- **`before_agent_start`**: eski uyumluluk hook’u; her iki aşamada da çalışabilir; bunun yerine yukarıdaki açık hook’ları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir plugin’in turu sahiplenmesine ve sentetik bir yanıt döndürmesine veya turu tamamen sessize almasına izin verir.
- **`agent_end`**: tamamlandıktan sonra nihai mesaj listesini ve çalıştırma meta verilerini inceler.
- **`before_compaction` / `after_compaction`**: compaction döngülerini gözlemler veya not ekler.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerine/sonuçlarına müdahale eder.
- **`before_install`**: yerleşik tarama bulgularını inceler ve isteğe bağlı olarak skill veya plugin kurulumlarını engeller.
- **`tool_result_persist`**: araç sonuçlarını oturum transkriptine yazılmadan önce eşzamanlı olarak dönüştürür.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden mesaj hook’ları.
- **`session_start` / `session_end`**: oturum yaşam döngüsü sınırları.
- **`gateway_start` / `gateway_stop`**: gateway yaşam döngüsü olayları.

Giden/araç korumaları için hook karar kuralları:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` etkisizdir ve önceki bir engellemeyi temizlemez.
- `before_install`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` etkisizdir ve önceki bir engellemeyi temizlemez.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` etkisizdir ve önceki bir iptali temizlemez.

Hook API’si ve kayıt ayrıntıları için bkz. [Plugin hook’ları](/tr/plugins/architecture#provider-runtime-hooks).

## Akış + kısmi yanıtlar

- Assistant deltaları pi-agent-core’dan akış halinde iletilir ve `assistant` olayları olarak yayımlanır.
- Blok akışı, kısmi yanıtları `text_end` veya `message_end` üzerinde yayımlayabilir.
- Akıl yürütme akışı ayrı bir akış olarak veya blok yanıtlar olarak yayımlanabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç start/update/end olayları `tool` akışında yayımlanır.
- Araç sonuçları, günlüğe kaydedilmeden/yayımlanmadan önce boyut ve görüntü payload’ları açısından temizlenir.
- Mesajlaşma aracı gönderimleri, yinelenen assistant onaylarını bastırmak için izlenir.

## Yanıt şekillendirme + bastırma

- Nihai payload’lar şunlardan oluşturulur:
  - assistant metni (ve isteğe bağlı akıl yürütme)
  - satır içi araç özetleri (verbose + izin verildiyse)
  - model hata verdiğinde assistant hata metni
- Tam sessiz belirteç `NO_REPLY` / `no_reply`, giden
  payload’lardan filtrelenir.
- Mesajlaşma aracı yinelemeleri nihai payload listesinden kaldırılır.
- Görüntülenebilir payload kalmazsa ve bir araç hata verdiyse, yedek bir araç hata yanıtı yayımlanır
  (bir mesajlaşma aracı zaten kullanıcıya görünür bir yanıt göndermediyse).

## Compaction + yeniden denemeler

- Otomatik compaction, `compaction` akış olayları yayımlar ve bir yeniden denemeyi tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellek içi tamponlar ve araç özetleri sıfırlanır.
- Compaction işlem hattı için bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedPiSession` tarafından yayımlanır (ve yedek olarak `agentCommand` tarafından)
- `assistant`: pi-agent-core’dan akış halinde gelen deltalar
- `tool`: pi-agent-core’dan akış halinde gelen araç olayları

## Sohbet kanalı işleme

- Assistant deltaları sohbet `delta` mesajları içine tamponlanır.
- Sohbet `final`, **yaşam döngüsü end/error** üzerinde yayımlanır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30 sn (yalnızca bekleme). `timeoutMs` parametresi bunu geçersiz kılar.
- Ajan çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800 sn (48 saat); `runEmbeddedPiAgent` içindeki iptal zamanlayıcısı tarafından uygulanır.
- LLM boşta kalma zaman aşımı: `agents.defaults.llm.idleTimeoutSeconds`, boşta kalma penceresi içinde yanıt parçaları gelmezse model isteğini iptal eder. Bunu yavaş yerel modeller veya akıl yürütme/araç çağrısı sağlayıcıları için açıkça ayarlayın; devre dışı bırakmak için `0` yapın. Ayarlanmazsa OpenClaw, yapılandırılmışsa `agents.defaults.timeoutSeconds`, aksi takdirde 120 sn kullanır. Açık bir LLM veya ajan zaman aşımı olmayan cron tetiklemeli çalıştırmalar, boşta kalma bekçisini devre dışı bırakır ve cron dış zaman aşımına güvenir.

## İşlerin erken bitebileceği yerler

- Ajan zaman aşımı (iptal)
- AbortSignal (iptal)
- Gateway bağlantısının kesilmesi veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, ajanı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) — kullanılabilir ajan araçları
- [Hooks](/tr/automation/hooks) — ajan yaşam döngüsü olayları tarafından tetiklenen olay güdümlü script’ler
- [Compaction](/tr/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Exec Approvals](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Thinking](/tr/tools/thinking) — thinking/akıl yürütme seviyesi yapılandırması
