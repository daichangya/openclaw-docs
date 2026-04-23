---
read_when:
    - Ajan döngüsünün veya yaşam döngüsü olaylarının tam bir adım adım açıklamasına ihtiyacınız var
    - Oturum kuyruklama, transkript yazımları veya oturum yazma kilidi davranışını değiştiriyorsunuz
summary: Ajan döngüsü yaşam döngüsü, akışlar ve bekleme semantiği
title: Ajan Döngüsü
x-i18n:
    generated_at: "2026-04-23T09:01:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 439b68446cc75db3ded7a7d20df8e074734e6759ecf989a41299d1b84f1ce79c
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Ajan Döngüsü (OpenClaw)

Ajanik döngü, bir ajanın tam “gerçek” çalıştırmasıdır: alım → bağlam oluşturma → model çıkarımı →
araç yürütme → akışlı yanıtlar → kalıcılık. Bu, bir mesajı
eylemlere ve nihai yanıta dönüştüren yetkili yoldur; bunu yaparken oturum durumunu tutarlı tutar.

OpenClaw'da döngü, model düşünürken, araç çağırırken ve çıktı akıtırken
yaşam döngüsü ve akış olayları yayan, oturum başına tek ve sıralı bir çalıştırmadır. Bu belge, bu özgün döngünün uçtan uca
nasıl bağlandığını açıklar.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `agent` komutu.

## Nasıl çalışır (üst düzey)

1. `agent` RPC parametreleri doğrular, oturumu çözümler (sessionKey/sessionId), oturum üst verisini kalıcılaştırır, hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` ajanı çalıştırır:
   - model + thinking/verbose/trace varsayılanlarını çözümler
   - Skills anlık görüntüsünü yükler
   - `runEmbeddedPiAgent` çağırır (pi-agent-core çalışma zamanı)
   - gömülü döngü bir tane yaymazsa **lifecycle end/error** yayar
3. `runEmbeddedPiAgent`:
   - çalıştırmaları oturum başına + genel kuyruklar üzerinden sıralar
   - model + kimlik doğrulama profilini çözümler ve Pi oturumunu oluşturur
   - Pi olaylarına abone olur ve assistant/tool delta'larını akıtır
   - zaman aşımını uygular -> aşılırsa çalıştırmayı abort eder
   - yükleri + kullanım üst verisini döndürür
4. `subscribeEmbeddedPiSession`, pi-agent-core olaylarını OpenClaw `agent` akışına köprüler:
   - araç olayları => `stream: "tool"`
   - assistant delta'ları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **lifecycle end/error** bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruklama + eşzamanlılık

- Çalıştırmalar oturum anahtarı başına sıralanır (oturum şeridi) ve isteğe bağlı olarak genel bir şerit üzerinden de geçer.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları, bu şerit sistemini besleyen kuyruk kiplerini (collect/steer/followup) seçebilir.
  Bkz. [Komut Kuyruğu](/tr/concepts/queue).
- Transkript yazımları da oturum dosyası üzerinde bir oturum yazma kilidi ile korunur. Kilit,
  süreç farkındalıklıdır ve dosya tabanlıdır; bu sayede süreç içi kuyruğu atlayan veya
  başka bir süreçten gelen yazıcıları da yakalar.
- Oturum yazma kilitleri varsayılan olarak yeniden girişsizdir. Bir yardımcı, tek bir mantıksal yazıcıyı koruyarak
  aynı kilidin alınmasını kasıtlı olarak iç içe kullanıyorsa, bunu açıkça
  `allowReentrant: true` ile etkinleştirmelidir.

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözümlenir ve oluşturulur; sandbox'lanmış çalıştırmalar bir sandbox çalışma alanı köküne yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve env ile prompt içine enjekte edilir.
- Bootstrap/bağlam dosyaları çözümlenir ve sistem istemi raporuna enjekte edilir.
- Bir oturum yazma kilidi alınır; `SessionManager`, akıştan önce açılır ve hazırlanır. Daha sonraki
  herhangi bir transkript yeniden yazma, Compaction veya kesme yolunun, transkript dosyasını açmadan veya
  değiştirmeden önce aynı kilidi alması gerekir.

## İstem oluşturma + sistem istemi

- Sistem istemi, OpenClaw'ın temel istemi, Skills istemi, bootstrap bağlamı ve çalıştırma başına geçersiz kılmalardan oluşturulur.
- Modele özel sınırlar ve Compaction için ayrılan token'lar uygulanır.
- Modelin ne gördüğü için bkz. [Sistem istemi](/tr/concepts/system-prompt).

## Hook noktaları (müdahale edebileceğiniz yerler)

OpenClaw'da iki Hook sistemi vardır:

- **Dahili Hook'lar** (Gateway Hook'ları): komutlar ve yaşam döngüsü olayları için olay güdümlü betikler.
- **Plugin Hook'ları**: ajan/araç yaşam döngüsü ve Gateway işlem hattı içindeki genişletme noktaları.

### Dahili Hook'lar (Gateway Hook'ları)

- **`agent:bootstrap`**: sistem istemi son hâline gelmeden önce bootstrap dosyaları oluşturulurken çalışır.
  Bunu bootstrap bağlam dosyaları eklemek/kaldırmak için kullanın.
- **Komut Hook'ları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (bkz. Hooks belgesi).

Kurulum ve örnekler için bkz. [Hooks](/tr/automation/hooks).

### Plugin Hook'ları (ajan + Gateway yaşam döngüsü)

Bunlar ajan döngüsü veya Gateway işlem hattı içinde çalışır:

- **`before_model_resolve`**: model çözümlemesinden önce sağlayıcıyı/modeli deterministik olarak geçersiz kılmak için oturum öncesi çalışır (`messages` yoktur).
- **`before_prompt_build`**: oturum yüklendikten sonra (`messages` ile) çalışır; istem gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` enjekte eder. Dönüş başına dinamik metin için `prependContext`, sistem istemi alanında bulunması gereken kararlı yönlendirme için sistem-bağlam alanlarını kullanın.
- **`before_agent_start`**: eski uyumluluk Hook'udur; her iki aşamada da çalışabilir; yukarıdaki açık Hook'ları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir Plugin'in dönüşü sahiplenmesine ve sentetik bir yanıt döndürmesine veya dönüşü tamamen susturmasına izin verir.
- **`agent_end`**: tamamlanmadan sonra nihai mesaj listesini ve çalıştırma üst verisini inceler.
- **`before_compaction` / `after_compaction`**: Compaction döngülerini gözlemler veya not ekler.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerini/sonuçlarını yakalar.
- **`before_install`**: yerleşik tarama bulgularını inceler ve gerekirse Skill veya Plugin kurulumlarını engeller.
- **`tool_result_persist`**: araç sonuçlarını oturum transkriptine yazılmadan önce eşzamanlı olarak dönüştürür.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden mesaj Hook'ları.
- **`session_start` / `session_end`**: oturum yaşam döngüsü sınırları.
- **`gateway_start` / `gateway_stop`**: Gateway yaşam döngüsü olayları.

Giden/araç korumaları için Hook karar kuralları:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` no-op'tur ve önceki bir engeli temizlemez.
- `before_install`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` no-op'tur ve önceki bir engeli temizlemez.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` no-op'tur ve önceki bir iptali temizlemez.

Hook API'si ve kayıt ayrıntıları için bkz. [Plugin Hook'ları](/tr/plugins/architecture#provider-runtime-hooks).

## Akış + kısmi yanıtlar

- Assistant delta'ları pi-agent-core'dan akıtılır ve `assistant` olayları olarak yayılır.
- Blok akışı, `text_end` veya `message_end` üzerinde kısmi yanıtlar yayabilir.
- Akıl yürütme akışı ayrı bir akış olarak veya blok yanıtlar şeklinde yayılabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç başlatma/güncelleme/bitiş olayları `tool` akışında yayılır.
- Araç sonuçları, günlüğe kaydetmeden/yaymadan önce boyut ve görsel yükleri açısından temizlenir.
- Mesajlaşma aracı gönderimleri, yinelenen assistant onaylarını bastırmak için izlenir.

## Yanıt şekillendirme + bastırma

- Nihai yükler şunlardan oluşturulur:
  - assistant metni (ve isteğe bağlı akıl yürütme)
  - satır içi araç özetleri (verbose + izinliyse)
  - model hata verirse assistant hata metni
- Tam sessiz belirteç `NO_REPLY` / `no_reply`, giden
  yüklerden filtrelenir.
- Mesajlaşma aracı tekrarları nihai yük listesinden kaldırılır.
- İşlenebilir yük kalmazsa ve bir araç hata verdiyse, yedek bir araç hata yanıtı yayılır
  (bir mesajlaşma aracı zaten kullanıcıya görünür bir yanıt göndermediyse).

## Compaction + yeniden denemeler

- Otomatik Compaction, `compaction` akış olayları yayar ve yeniden deneme tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellekteki tamponlar ve araç özetleri sıfırlanır.
- Compaction işlem hattı için bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedPiSession` tarafından yayılır (ve yedek olarak `agentCommand` tarafından)
- `assistant`: pi-agent-core'dan akıtılan delta'lar
- `tool`: pi-agent-core'dan akıtılan araç olayları

## Sohbet kanalı işleme

- Assistant delta'ları sohbet `delta` mesajlarına arabelleğe alınır.
- Sohbet `final`, **lifecycle end/error** üzerinde yayılır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30 sn (yalnızca bekleme). `timeoutMs` parametresi geçersiz kılar.
- Ajan çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800 sn (48 saat); `runEmbeddedPiAgent` abort zamanlayıcısında uygulanır.
- LLM boşta zaman aşımı: `agents.defaults.llm.idleTimeoutSeconds`, boşta pencere dolmadan önce yanıt parçaları gelmezse model isteğini abort eder. Bunu yavaş yerel modeller veya akıl yürütme/araç çağrısı sağlayıcıları için açıkça ayarlayın; devre dışı bırakmak için 0 ayarlayın. Ayarlanmazsa OpenClaw, yapılandırılmışsa `agents.defaults.timeoutSeconds`, aksi halde 120 sn kullanır. Açık bir LLM veya ajan zaman aşımı olmayan Cron tetiklemeli çalıştırmalar, boşta gözcüsünü devre dışı bırakır ve Cron dış zaman aşımına güvenir.

## Erken bitebileceği yerler

- Ajan zaman aşımı (abort)
- AbortSignal (iptal)
- Gateway bağlantı kopması veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, ajanı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) — kullanılabilir ajan araçları
- [Hooks](/tr/automation/hooks) — ajan yaşam döngüsü olayları tarafından tetiklenen olay güdümlü betikler
- [Compaction](/tr/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Exec Onayları](/tr/tools/exec-approvals) — shell komutları için onay geçitleri
- [Thinking](/tr/tools/thinking) — thinking/akıl yürütme düzeyi yapılandırması
