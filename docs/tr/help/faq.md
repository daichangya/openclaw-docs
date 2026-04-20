---
read_when:
    - Yaygın kurulum, yükleme, ilk kullanım veya çalışma zamanı destek sorularını yanıtlama
    - Daha derin hata ayıklamadan önce kullanıcı tarafından bildirilen sorunları önceliklendirme
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-04-20T09:03:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae8efda399e34f59f22f6ea8ce218eaf7b872e4117d8596ec19c09891d70813b
    source_path: help/faq.md
    workflow: 15
---

# SSS

Yerel geliştirme, VPS, çoklu agent, OAuth/API anahtarları ve model yedeklemeyi kapsayan gerçek dünya kurulumları için hızlı yanıtlar ve daha derin sorun giderme. Çalışma zamanı tanılamaları için [Sorun Giderme](/tr/gateway/troubleshooting) bölümüne bakın. Tam yapılandırma başvurusu için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Bir şey bozuksa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: işletim sistemi + güncelleme, gateway/hizmet erişilebilirliği, agent'lar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (gateway erişilebilirse).

2. **Paylaşılabilir rapor (paylaşması güvenli)**

   ```bash
   openclaw status --all
   ```

   Günlük sonu ile birlikte salt okunur tanılama (token'lar gizlenir).

3. **Arka plan hizmeti + port durumu**

   ```bash
   openclaw gateway status
   ```

   Denetleyici çalışma zamanı ile RPC erişilebilirliğini, prob hedef URL'sini ve hizmetin büyük olasılıkla hangi yapılandırmayı kullandığını gösterir.

4. **Derin problar**

   ```bash
   openclaw status --deep
   ```

   Desteklenen yerlerde kanal probları da dahil olmak üzere canlı bir gateway sağlık probu çalıştırır
   (erişilebilir bir gateway gerektirir). Bkz. [Sağlık](/tr/gateway/health).

5. **En son günlüğü izle**

   ```bash
   openclaw logs --follow
   ```

   RPC kapalıysa şuna geri dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri hizmet günlüklerinden ayrıdır; bkz. [Günlükleme](/tr/logging) ve [Sorun Giderme](/tr/gateway/troubleshooting).

6. **Doctor'ı çalıştırın (onarım)**

   ```bash
   openclaw doctor
   ```

   Yapılandırmayı/durumu onarır veya geçirir + sağlık kontrollerini çalıştırır. Bkz. [Doctor](/tr/gateway/doctor).

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # hatalarda hedef URL'yi + yapılandırma yolunu gösterir
   ```

   Çalışan gateway'den tam bir anlık görüntü ister (yalnızca WS). Bkz. [Sağlık](/tr/gateway/health).

## Hızlı başlangıç ve ilk çalıştırma kurulumu

<AccordionGroup>
  <Accordion title="Takıldım, en hızlı nasıl çözerim?">
    Makinenizi **görebilen** yerel bir AI agent kullanın. Bu, Discord'da sormaktan çok daha etkilidir,
    çünkü "takıldım" durumlarının çoğu, uzaktaki yardımcıların inceleyemediği **yerel yapılandırma veya ortam sorunlarıdır**.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar depoyu okuyabilir, komutları çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu düzeltmeye yardımcı olabilir (PATH, hizmetler, izinler, kimlik doğrulama dosyaları). Onlara
    hacklenebilir (git) kurulum aracılığıyla **tam kaynak kodu checkout'unu** verin:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw'ı **bir git checkout'undan** kurar; böylece agent kodu + belgeleri okuyabilir ve
    çalıştırdığınız tam sürüm hakkında akıl yürütebilir. Daha sonra, yükleyiciyi `--install-method git`
    olmadan yeniden çalıştırarak her zaman kararlı sürüme geri dönebilirsiniz.

    İpucu: agent'tan düzeltmeyi **planlamasını ve denetlemesini** isteyin (adım adım), ardından yalnızca
    gerekli komutları çalıştırın. Bu, değişiklikleri küçük ve denetlemesi daha kolay tutar.

    Gerçek bir hata veya düzeltme bulursanız lütfen bir GitHub issue açın veya PR gönderin:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Yardım isterken şu komutlarla başlayın (çıktıları paylaşın):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Yaptıkları:

    - `openclaw status`: gateway/agent sağlığı + temel yapılandırmanın hızlı anlık görüntüsü.
    - `openclaw models status`: sağlayıcı kimlik doğrulamasını + model kullanılabilirliğini kontrol eder.
    - `openclaw doctor`: yaygın yapılandırma/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI kontrolleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozuksa ilk 60 saniye](#bir-şey-bozuksa-ilk-60-saniye).
    Kurulum belgeleri: [Yükleme](/tr/install), [Yükleyici bayrakları](/tr/install/installer), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat atlamaya devam ediyor. Atlama nedenleri ne anlama geliyor?">
    Yaygın Heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılan etkin saatler penceresinin dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` var ama yalnızca boş/başlık-only iskeleti içeriyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu etkin ama görev aralıklarının hiçbiri henüz zamanı gelmemiş
    - `alerts-disabled`: tüm heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` hepsi kapalı)

    Görev modunda, zamanı gelen zaman damgaları yalnızca gerçek bir Heartbeat çalıştırması
    tamamlandıktan sonra ilerletilir. Atlanan çalıştırmalar görevleri tamamlandı olarak işaretlemez.

    Belgeler: [Heartbeat](/tr/gateway/heartbeat), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw'ı yüklemek ve kurmak için önerilen yol">
    Depo, kaynaktan çalıştırmayı ve onboarding kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz UI varlıklarını da otomatik olarak derleyebilir. Onboarding sonrasında genellikle Gateway'i **18789** portunda çalıştırırsınız.

    Kaynaktan (katkıda bulunanlar/geliştiriciler):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Henüz genel bir kurulumunuz yoksa `pnpm openclaw onboard` ile çalıştırın.

  </Accordion>

  <Accordion title="Onboarding sonrasında paneli nasıl açarım?">
    Sihirbaz, onboarding'den hemen sonra tarayıcınızı temiz (token içermeyen) bir panel URL'si ile açar ve ayrıca bağlantıyı özette yazdırır. O sekmeyi açık tutun; açılmadıysa yazdırılan URL'yi aynı makinede kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Panelde localhost ile uzak makinede kimlik doğrulamayı nasıl yaparım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli kimlik doğrulaması isterse yapılandırılmış token'ı veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan gizli ayarlanmamışsa `openclaw doctor --generate-gateway-token` ile bir token oluşturun.

    **Localhost üzerinde değilse:**

    - **Tailscale Serve** (önerilir): bağlamayı loopback olarak tutun, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` adresini açın. `gateway.auth.allowTailscale` `true` ise kimlik üstbilgileri Control UI/WebSocket kimlik doğrulamasını karşılar (paylaşılan gizliyi yapıştırmaya gerek yoktur, güvenilen gateway ana bilgisayarı varsayılır); HTTP API'leri ise özellikle özel giriş `none` veya güvenilen proxy HTTP kimlik doğrulaması kullanmadığınız sürece yine de paylaşılan gizli kimlik doğrulaması gerektirir.
      Aynı istemciden gelen hatalı eşzamanlı Serve kimlik doğrulama girişimleri, başarısız kimlik doğrulama sınırlayıcısı bunları kaydetmeden önce serileştirilir; bu nedenle ikinci hatalı yeniden deneme zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` çalıştırın (veya parola kimlik doğrulamasını yapılandırın), `http://<tailscale-ip>:18789/` adresini açın, ardından panel ayarlarına eşleşen paylaşılan gizliyi yapıştırın.
    - **Kimlik farkındalıklı ters proxy**: Gateway'i loopback olmayan güvenilen bir proxy'nin arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, ardından proxy URL'sini açın.
    - **SSH tüneli**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` adresini açın. Tünel üzerinden de paylaşılan gizli kimlik doğrulaması geçerlidir; istenirse yapılandırılmış token'ı veya parolayı yapıştırın.

    Bağlama modları ve kimlik doğrulama ayrıntıları için [Panel](/web/dashboard) ve [Web yüzeyleri](/web) bölümlerine bakın.

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki farklı exec approval yapılandırması var?">
    Bunlar farklı katmanları kontrol eder:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: bu kanalın exec onayları için yerel bir onay istemcisi gibi davranmasını sağlar

    Ana makinenin exec politikası hâlâ gerçek onay kapısıdır. Sohbet yapılandırması yalnızca
    onay istemlerinin nerede görüneceğini ve insanların nasıl yanıt verebileceğini kontrol eder.

    Çoğu kurulumda **ikisinin de** gerekli olması gerekmez:

    - Sohbet zaten komutları ve yanıtları destekliyorsa aynı sohbette `/approve` ortak yol üzerinden çalışır.
    - Desteklenen bir yerel kanal onaylayanları güvenli şekilde çıkarabiliyorsa, OpenClaw artık `channels.<channel>.execApprovals.enabled` ayarsız veya `"auto"` olduğunda DM-first yerel onayları otomatik etkinleştirir.
    - Yerel onay kartları/düğmeleri mevcut olduğunda birincil yol bu yerel UI'dir; agent, yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay olduğunu söylüyorsa manuel `/approve` komutu eklemelidir.
    - İstemlerin başka sohbetlere veya belirli operasyon odalarına da iletilmesi gerekiyorsa yalnızca `approvals.exec` kullanın.
    - Onay istemlerinin özellikle kaynak oda/konuya geri gönderilmesini istiyorsanız yalnızca `channels.<channel>.execApprovals.target: "channel"` veya `"both"` kullanın.
    - Plugin onayları ayrıca ayrıdır: varsayılan olarak aynı sohbette `/approve`, isteğe bağlı `approvals.plugin` iletimi kullanırlar ve yalnızca bazı yerel kanallar bunun üzerinde plugin-onayı-yerel işlemeyi sürdürür.

    Kısaca: iletme yönlendirme içindir, yerel istemci yapılandırması ise daha zengin kanala özgü kullanıcı deneyimi içindir.
    Bkz. [Exec Approvals](/tr/tools/exec-approvals).

  </Accordion>

  <Accordion title="Hangi çalışma zamanına ihtiyacım var?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Gateway için Bun **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışıyor mu?">
    Evet. Gateway hafiftir - belgelerde kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    diskin yeterli olduğu belirtilir ve **Raspberry Pi 4'te çalışabildiği** not edilir.

    Ek boşluk istiyorsanız (günlükler, medya, diğer hizmetler) **2GB önerilir**, ancak
    bu katı bir alt sınır değildir.

    İpucu: küçük bir Pi/VPS Gateway'i barındırabilir ve dizüstü bilgisayarınız/telefonunuzda yerel ekran/kamera/canvas veya komut çalıştırma için
    **Node** eşleyebilirsiniz. Bkz. [Node'lar](/tr/nodes).

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için bir ipucu var mı?">
    Kısa sürüm: çalışır, ama pürüzler bekleyin.

    - **64-bit** bir işletim sistemi kullanın ve Node sürümünü >= 22 tutun.
    - Günlükleri görebilmek ve hızlı güncelleyebilmek için **hacklenebilir (git) kurulumu** tercih edin.
    - Kanallar/Skills olmadan başlayın, sonra bunları tek tek ekleyin.
    - Garip ikili dosya sorunlarıyla karşılaşırsanız bu genellikle bir **ARM uyumluluk** sorunudur.

    Belgeler: [Linux](/tr/platforms/linux), [Yükleme](/tr/install).

  </Accordion>

  <Accordion title="Wake up my friend ekranında takılıyor / onboarding açılmıyor. Şimdi ne olacak?">
    Bu ekran, Gateway'in erişilebilir ve kimliği doğrulanmış olmasına bağlıdır. TUI ayrıca
    ilk açılışta otomatik olarak "Wake up, my friend!" gönderir. Bu satırı **yanıt olmadan**
    görüyorsanız ve token'lar 0'da kalıyorsa agent hiç çalışmamıştır.

    1. Gateway'i yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    2. Durum + kimlik doğrulamayı kontrol edin:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hâlâ takılıyorsa şunu çalıştırın:

    ```bash
    openclaw doctor
    ```

    Gateway uzaktaysa tünel/Tailscale bağlantısının açık olduğundan ve UI'nin
    doğru Gateway'e işaret ettiğinden emin olun. Bkz. [Uzaktan erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Kurulumumu yeni bir makineye (Mac mini) onboarding'i yeniden yapmadan taşıyabilir miyim?">
    Evet. **Durum dizinini** ve **çalışma alanını** kopyalayın, ardından Doctor'ı bir kez çalıştırın. Bu,
    **her iki** konumu da kopyaladığınız sürece botunuzu "tam olarak aynı" (bellek, oturum geçmişi, kimlik doğrulama ve kanal
    durumu) tutar:

    1. OpenClaw'ı yeni makineye kurun.
    2. Eski makineden `$OPENCLAW_STATE_DIR`'i (varsayılan: `~/.openclaw`) kopyalayın.
    3. Çalışma alanınızı kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway hizmetini yeniden başlatın.

    Bu, yapılandırmayı, kimlik doğrulama profillerini, WhatsApp kimlik bilgilerini, oturumları ve belleği korur. Eğer
    uzak moddaysanız, oturum deposunun ve çalışma alanının gateway ana makinesine ait olduğunu unutmayın.

    **Önemli:** yalnızca çalışma alanınızı GitHub'a commit/push ederseniz, **belleği + önyükleme dosyalarını**
    yedeklemiş olursunuz, ancak **oturum geçmişini veya kimlik doğrulamayı** değil. Bunlar
    `~/.openclaw/` altında bulunur (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Taşıma](/tr/install/migrating), [Diskte öğelerin bulunduğu yer](#diskte-öğelerin-bulunduğu-yer),
    [Agent çalışma alanı](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Uzak mod](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde nelerin yeni olduğunu nerede görebilirim?">
    GitHub changelog'unu kontrol edin:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler üsttedir. En üst bölüm **Unreleased** olarak işaretliyse, bir sonraki tarihli
    bölüm yayımlanmış en son sürümdür. Girdiler **Highlights**, **Changes** ve
    **Fixes** olarak gruplanır (gerektiğinde docs/diğer bölümler de eklenir).

  </Accordion>

  <Accordion title="docs.openclaw.ai erişilemiyor (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları `docs.openclaw.ai` alanını Xfinity
    Advanced Security üzerinden yanlış şekilde engeller. Bunu devre dışı bırakın veya `docs.openclaw.ai` alanını izin listesine ekleyin, ardından yeniden deneyin.
    Lütfen engeli kaldırmamıza yardımcı olmak için burada bildirin: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ erişemiyorsanız, belgeler GitHub üzerinde yansılanmıştır:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Kararlı sürüm ile beta arasındaki fark">
    **Kararlı sürüm** ve **beta**, ayrı kod satırları değil, **npm dist-tags** etiketleridir:

    - `latest` = kararlı sürüm
    - `beta` = test için erken derleme

    Genellikle kararlı bir sürüm önce **beta** kanalına gelir, ardından açık bir
    yükseltme adımı aynı sürümü `latest` etiketine taşır. Gerektiğinde bakımcılar
    doğrudan `latest` etiketine de yayımlayabilir. Bu nedenle beta ve kararlı sürüm,
    yükseltmeden sonra **aynı sürümü** gösterebilir.

    Nelerin değiştiğini görün:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Kurulum tek satırlık komutları ve beta ile dev arasındaki fark için aşağıdaki accordion'a bakın.

  </Accordion>

  <Accordion title="Beta sürümünü nasıl yüklerim ve beta ile dev arasındaki fark nedir?">
    **Beta**, npm dist-tag `beta` etiketidir (`latest` ile yükseltmeden sonra eşleşebilir).
    **Dev**, `main` dalının hareketli başıdır (git); yayımlandığında npm dist-tag `dev` etiketini kullanır.

    Tek satırlık komutlar (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows yükleyicisi (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Daha fazla ayrıntı: [Geliştirme kanalları](/tr/install/development-channels) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="En son parçaları nasıl denerim?">
    İki seçenek:

    1. **Dev kanalı (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Bu, sizi `main` dalına geçirir ve kaynaktan günceller.

    2. **Hacklenebilir kurulum (yükleyici sitesinden):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu size düzenleyebileceğiniz yerel bir depo verir, ardından git ile güncelleyebilirsiniz.

    Temiz bir clone'u elle tercih ederseniz şunu kullanın:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Belgeler: [Güncelleme](/cli/update), [Geliştirme kanalları](/tr/install/development-channels),
    [Yükleme](/tr/install).

  </Accordion>

  <Accordion title="Kurulum ve onboarding genelde ne kadar sürer?">
    Kabaca rehber:

    - **Kurulum:** 2-5 dakika
    - **Onboarding:** yapılandırdığınız kanal/model sayısına bağlı olarak 5-15 dakika

    Takılırsa [Yükleyici takıldı](#hızlı-başlangıç-ve-ilk-çalıştırma-kurulumu)
    ve [Takıldım](#hızlı-başlangıç-ve-ilk-çalıştırma-kurulumu) içindeki hızlı hata ayıklama döngüsünü kullanın.

  </Accordion>

  <Accordion title="Yükleyici takıldı mı? Daha fazla geri bildirimi nasıl alırım?">
    Yükleyiciyi **ayrıntılı çıktı** ile yeniden çalıştırın:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Ayrıntılı çıktıyla beta kurulumu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Hacklenebilir (git) bir kurulum için:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows (PowerShell) eşdeğeri:

    ```powershell
    # install.ps1 için henüz özel bir -Verbose bayrağı yok.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Daha fazla seçenek: [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="Windows kurulumu git bulunamadı veya openclaw tanınmıyor diyor">
    İki yaygın Windows sorunu:

    **1) npm hatası spawn git / git bulunamadı**

    - **Git for Windows** yükleyin ve `git` komutunun PATH'inizde olduğundan emin olun.
    - PowerShell'i kapatıp yeniden açın, ardından yükleyiciyi yeniden çalıştırın.

    **2) Kurulumdan sonra openclaw tanınmıyor**

    - npm genel bin klasörünüz PATH üzerinde değil.
    - Yolu kontrol edin:

      ```powershell
      npm config get prefix
      ```

    - Bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` son eki gerekmez; çoğu sistemde `%AppData%\npm` olur).
    - PATH'i güncelledikten sonra PowerShell'i kapatıp yeniden açın.

    En sorunsuz Windows kurulumu için yerel Windows yerine **WSL2** kullanın.
    Belgeler: [Windows](/tr/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec çıktısı bozuk Çince metin gösteriyor - ne yapmalıyım?">
    Bu genellikle yerel Windows kabuklarında konsol kod sayfası uyumsuzluğudur.

    Belirtiler:

    - `system.run`/`exec` çıktısı Çinceyi bozuk karakterlerle gösterir
    - Aynı komut başka bir terminal profilinde düzgün görünür

    PowerShell'de hızlı geçici çözüm:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Ardından Gateway'i yeniden başlatın ve komutunuzu yeniden deneyin:

    ```powershell
    openclaw gateway restart
    ```

    Bunu en son OpenClaw sürümünde hâlâ yeniden üretebiliyorsanız şurada takip edin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Belgeler sorumu yanıtlamadı - daha iyi bir yanıtı nasıl alırım?">
    Tüm kaynak kodu ve belgelerin yerelde bulunması için **hacklenebilir (git) kurulumunu** kullanın, ardından
    botunuza (veya Claude/Codex'e) _o klasörden_ sorun; böylece depoyu okuyup tam yanıt verebilir.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Yükleme](/tr/install) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="OpenClaw'ı Linux'a nasıl yüklerim?">
    Kısa yanıt: Linux kılavuzunu izleyin, ardından onboarding'i çalıştırın.

    - Linux hızlı yol + hizmet kurulumu: [Linux](/tr/platforms/linux).
    - Tam adım adım kılavuz: [Başlarken](/tr/start/getting-started).
    - Yükleyici + güncellemeler: [Yükleme ve güncellemeler](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw'ı bir VPS'e nasıl yüklerim?">
    Herhangi bir Linux VPS çalışır. Sunucuya kurun, ardından Gateway'e erişmek için SSH/Tailscale kullanın.

    Kılavuzlar: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzak erişim: [Gateway remote](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum kılavuzları nerede?">
    Yaygın sağlayıcılar için bir **barındırma merkezi** tutuyoruz. Birini seçin ve kılavuzu izleyin:

    - [VPS barındırma](/tr/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta şu şekilde çalışır: **Gateway sunucuda çalışır** ve siz ona
    dizüstü bilgisayarınızdan/telefonunuzdan Control UI (veya Tailscale/SSH) ile erişirsiniz. Durumunuz + çalışma alanınız
    sunucuda yaşar, bu yüzden ana makineyi doğruluk kaynağı olarak görün ve yedekleyin.

    Yerel ekran/kamera/canvas erişmek veya dizüstü bilgisayarınızda komut çalıştırmak için
    buluttaki Gateway'e **Node** eşleyebilirsiniz (Mac/iOS/Android/headless),
    böylece Gateway bulutta kalır.

    Merkez: [Platformlar](/tr/platforms). Uzak erişim: [Gateway remote](/tr/gateway/remote).
    Node'lar: [Node'lar](/tr/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw'dan kendini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün, ama önerilmez**. Güncelleme akışı
    Gateway'i yeniden başlatabilir (bu da etkin oturumu düşürür), temiz bir git checkout'u gerektirebilir ve
    onay isteyebilir. Daha güvenlisi: güncellemeleri operatör olarak bir kabuktan çalıştırın.

    CLI'yi kullanın:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Bunu bir agent'tan otomatikleştirmeniz gerekiyorsa:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Belgeler: [Güncelleme](/cli/update), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Onboarding gerçekte ne yapıyor?">
    `openclaw onboard` önerilen kurulum yoludur. **Yerel modda** size şu konularda rehberlik eder:

    - **Model/kimlik doğrulama kurulumu** (sağlayıcı OAuth, API anahtarları, Anthropic setup-token ve LM Studio gibi yerel model seçenekleri)
    - **Çalışma alanı** konumu + önyükleme dosyaları
    - **Gateway ayarları** (bind/port/auth/tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage ve QQ Bot gibi paketlenmiş kanal Plugin'leri)
    - **Arka plan hizmeti kurulumu** (macOS'ta LaunchAgent; Linux/WSL2'de systemd kullanıcı birimi)
    - **Sağlık kontrolleri** ve **Skills** seçimi

    Ayrıca yapılandırdığınız model bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw'ı **API anahtarları** (Anthropic/OpenAI/diğerleri) ile veya
    verileriniz cihazınızda kalsın diye **yalnızca yerel modellerle** çalıştırabilirsiniz. Abonelikler (Claude
    Pro/Max veya OpenAI Codex) bu sağlayıcılarda kimlik doğrulamak için isteğe bağlı yollardır.

    Anthropic için OpenClaw'daki pratik ayrım şudur:

    - **Anthropic API anahtarı**: normal Anthropic API faturalandırması
    - **OpenClaw'da Claude CLI / Claude abonelik kimlik doğrulaması**: Anthropic çalışanları
      bize bu kullanımın yeniden izinli olduğunu söyledi ve Anthropic yeni bir
      politika yayımlamadıkça OpenClaw bu entegrasyon için `claude -p`
      kullanımını onaylanmış olarak değerlendiriyor

    Uzun ömürlü gateway ana makineleri için Anthropic API anahtarları yine de
    daha öngörülebilir kurulumdur. OpenAI Codex OAuth, OpenClaw gibi harici
    araçlar için açıkça desteklenir.

    OpenClaw ayrıca diğer barındırılan abonelik tarzı seçenekleri de destekler; bunlar arasında
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan** bulunur.

    Belgeler: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [GLM Models](/tr/providers/glm),
    [Yerel modeller](/tr/gateway/local-models), [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="API anahtarı olmadan Claude Max aboneliğini kullanabilir miyim?">
    Evet.

    Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımının yeniden izinli olduğunu söyledi, bu yüzden
    Anthropic yeni bir politika yayımlamadıkça OpenClaw bu entegrasyon için Claude abonelik kimlik doğrulamasını ve `claude -p` kullanımını
    onaylanmış olarak değerlendirir. En öngörülebilir sunucu tarafı kurulumunu istiyorsanız,
    bunun yerine Anthropic API anahtarı kullanın.

  </Accordion>

  <Accordion title="Claude abonelik kimlik doğrulamasını destekliyor musunuz (Claude Pro veya Max)?">
    Evet.

    Anthropic çalışanları bize bu kullanımın yeniden izinli olduğunu söyledi, bu yüzden OpenClaw
    Anthropic yeni bir politika yayımlamadıkça bu entegrasyon için
    Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylanmış olarak değerlendirir.

    Anthropic setup-token hâlâ desteklenen bir OpenClaw token yolu olarak kullanılabilir, ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih ediyor.
    Üretim veya çok kullanıcılı iş yükleri için Anthropic API anahtarı kimlik doğrulaması hâlâ
    daha güvenli ve daha öngörülebilir seçimdir. OpenClaw'da başka abonelik tarzı
    barındırılan seçenekler istiyorsanız [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [GLM
    Models](/tr/providers/glm) bölümlerine bakın.

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Anthropic'ten neden HTTP 429 rate_limit_error görüyorum?">
Bu, mevcut pencere için **Anthropic kotanızın/hız sınırınızın** tükendiği anlamına gelir. **Claude CLI**
kullanıyorsanız pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. Bir
**Anthropic API anahtarı** kullanıyorsanız kullanım/faturalandırma için Anthropic Console'u
kontrol edin ve gerektiğinde limitleri artırın.

    İleti özellikle şuysa:
    `Extra usage is required for long context requests`, istek
    Anthropic'in 1M bağlam beta özelliğini (`context1m: true`) kullanmaya çalışıyor demektir. Bu yalnızca
    kimlik bilginiz uzun bağlam faturalandırması için uygunsa çalışır (API anahtarı faturalandırması veya
    Extra Usage etkin OpenClaw Claude-login yolu).

    İpucu: bir **yedek model** ayarlayın, böylece bir sağlayıcı hız sınırına takıldığında OpenClaw yanıt vermeye devam edebilir.
    Bkz. [Modeller](/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw, paketlenmiş bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS ortam işaretleyicileri mevcut olduğunda OpenClaw, akış/metin Bedrock kataloğunu otomatik olarak keşfedebilir ve bunu örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi halde `plugins.entries.amazon-bedrock.config.discovery.enabled` seçeneğini açıkça etkinleştirebilir veya elle bir sağlayıcı girdisi ekleyebilirsiniz. Bkz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model sağlayıcıları](/tr/providers/models). Yönetilen anahtar akışı tercih ediyorsanız, Bedrock önünde OpenAI uyumlu bir proxy kullanmak da geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex kimlik doğrulaması nasıl çalışır?">
    OpenClaw, OAuth (ChatGPT oturum açma) üzerinden **OpenAI Code (Codex)** destekler. Onboarding, OAuth akışını çalıştırabilir ve uygun olduğunda varsayılan modeli `openai-codex/gpt-5.4` olarak ayarlar. Bkz. [Model sağlayıcıları](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard).
  </Accordion>

  <Accordion title="ChatGPT GPT-5.4 neden OpenClaw'da openai/gpt-5.4 kilidini açmıyor?">
    OpenClaw iki yolu ayrı ele alır:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = doğrudan OpenAI Platform API

    OpenClaw'da ChatGPT/Codex oturum açma, doğrudan `openai/*` yolu yerine
    `openai-codex/*` yoluna bağlanır.
    OpenClaw'da doğrudan API yolunu istiyorsanız
    `OPENAI_API_KEY` değerini ayarlayın (veya eşdeğer OpenAI sağlayıcı yapılandırmasını kullanın).
    OpenClaw'da ChatGPT/Codex oturum açmayı istiyorsanız `openai-codex/*` kullanın.

  </Accordion>

  <Accordion title="Codex OAuth limitleri neden ChatGPT web'den farklı olabilir?">
    `openai-codex/*`, Codex OAuth yolunu kullanır ve kullanılabilir kota pencereleri
    OpenAI tarafından yönetilir ve plana bağlıdır. Uygulamada bu limitler,
    ikisi de aynı hesaba bağlı olsa bile ChatGPT web sitesi/uygulaması deneyiminden farklı olabilir.

    OpenClaw mevcut görünen sağlayıcı kullanımını/kota pencerelerini
    `openclaw models status` içinde gösterebilir, ancak ChatGPT web
    yetkilerini doğrudan API erişimine dönüştürmez veya normalize etmez. Doğrudan OpenAI Platform
    faturalandırma/limit yolunu istiyorsanız API anahtarıyla `openai/*` kullanın.

  </Accordion>

  <Accordion title="OpenAI abonelik kimlik doğrulamasını destekliyor musunuz (Codex OAuth)?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** desteğini tam olarak sunar.
    OpenAI, OpenClaw gibi harici araçlar/iş akışlarında
    abonelik OAuth kullanımına açıkça izin verir. Onboarding, OAuth akışını sizin için çalıştırabilir.

    Bkz. [OAuth](/tr/concepts/oauth), [Model sağlayıcıları](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard).

  </Accordion>

  <Accordion title="Gemini CLI OAuth'u nasıl kurarım?">
    Gemini CLI, `openclaw.json` içinde istemci kimliği veya gizli anahtar yerine
    bir **Plugin kimlik doğrulama akışı** kullanır.

    Adımlar:

    1. `gemini` komutu `PATH` üzerinde olacak şekilde Gemini CLI'yi yerel olarak yükleyin
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin'i etkinleştirin: `openclaw plugins enable google`
    3. Giriş yapın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Girişten sonraki varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    5. İstekler başarısız olursa gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu işlem OAuth token'larını gateway ana makinesindeki kimlik doğrulama profillerinde saklar. Ayrıntılar: [Model sağlayıcıları](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Gündelik sohbetler için yerel model uygun mu?">
    Genellikle hayır. OpenClaw büyük bağlam + güçlü güvenlik gerektirir; küçük kartlar kesilir ve sızıntı yapar. Mecbursanız yerelde çalıştırabildiğiniz **en büyük** model derlemesini (LM Studio) kullanın ve [/gateway/local-models](/tr/gateway/local-models) bölümüne bakın. Daha küçük/kuantize modeller prompt injection riskini artırır - bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş uç noktaları seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD'de barındırılan seçenekler sunar; verileri bölgede tutmak için ABD'de barındırılan varyantı seçin. Seçtiğiniz bölgesel sağlayıcıya uyarak yedeklerin kullanılabilir kalması için `models.mode: "merge"` kullanarak Anthropic/OpenAI'yi bunların yanında yine listeleyebilirsiniz.
  </Accordion>

  <Accordion title="Bunu yüklemek için Mac Mini almak zorunda mıyım?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows için WSL2). Mac mini isteğe bağlıdır - bazı kişiler
    sürekli açık bir ana makine olarak satın alır, ancak küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı cihaz da iş görür.

    Yalnızca **macOS'a özel araçlar** için bir Mac gerekir. iMessage için [BlueBubbles](/tr/channels/bluebubbles) kullanın (önerilir) -
    BlueBubbles sunucusu herhangi bir Mac üzerinde çalışır ve Gateway Linux'ta veya başka bir yerde çalışabilir. Başka macOS'a özel araçlar istiyorsanız Gateway'i bir Mac üzerinde çalıştırın veya bir macOS Node eşleyin.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Node'lar](/tr/nodes), [Mac uzak mod](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini gerekir mi?">
    Messages oturumu açık **bir tür macOS cihazına** ihtiyacınız vardır. Bunun bir Mac mini olması **gerekmez** -
    herhangi bir Mac olur. iMessage için **[BlueBubbles](/tr/channels/bluebubbles)** kullanın (önerilir) - BlueBubbles sunucusu macOS üzerinde çalışırken Gateway Linux'ta veya başka bir yerde çalışabilir.

    Yaygın kurulumlar:

    - Gateway'i Linux/VPS üzerinde çalıştırın ve BlueBubbles sunucusunu Messages oturumu açık herhangi bir Mac üzerinde çalıştırın.
    - En basit tek makine kurulumu istiyorsanız her şeyi Mac üzerinde çalıştırın.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Node'lar](/tr/nodes),
    [Mac uzak mod](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw çalıştırmak için bir Mac mini alırsam, onu MacBook Pro'ma bağlayabilir miyim?">
    Evet. **Mac mini Gateway'i çalıştırabilir**, MacBook Pro'nuz ise
    bir **Node** (yardımcı cihaz) olarak bağlanabilir. Node'lar Gateway'i çalıştırmaz -
    o cihazda ekran/kamera/canvas ve `system.run` gibi ek
    yetenekler sağlarlar.

    Yaygın desen:

    - Mac mini üzerinde Gateway (sürekli açık).
    - MacBook Pro macOS uygulamasını veya bir Node ana makinesini çalıştırır ve Gateway ile eşleşir.
    - Bunu görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Belgeler: [Node'lar](/tr/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram ile çalışma zamanı hataları görüyoruz.
    Kararlı gateway'ler için **Node** kullanın.

    Yine de Bun ile deneme yapmak istiyorsanız bunu WhatsApp/Telegram olmayan
    üretim dışı bir gateway üzerinde yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne girer?">
    `channels.telegram.allowFrom`, **insan gönderenin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Kurulum yalnızca sayısal kullanıcı kimliklerini ister. Yapılandırmada zaten eski `@username` girdileriniz varsa, `openclaw doctor --fix` bunları çözümlemeyi deneyebilir.

    Daha güvenli (üçüncü taraf bot olmadan):

    - Botunuza DM gönderin, sonra `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmî Bot API:

    - Botunuza DM gönderin, sonra `https://api.telegram.org/bot<bot_token>/getUpdates` çağrısını yapın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az gizli):

    - `@userinfobot` veya `@getidsbot` hesabına DM gönderin.

    Bkz. [/channels/telegram](/tr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Birden fazla kişi farklı OpenClaw örnekleriyle tek bir WhatsApp numarasını kullanabilir mi?">
    Evet, **çoklu agent yönlendirmesi** ile. Her gönderenin WhatsApp **DM**'sini (eş `kind: "direct"`, gönderen E.164 biçiminde örneğin `+15551234567`) farklı bir `agentId`'ye bağlayın; böylece her kişi kendi çalışma alanına ve oturum deposuna sahip olur. Yanıtlar yine **aynı WhatsApp hesabından** gelir ve DM erişim kontrolü (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) WhatsApp hesabı başına küreseldir. Bkz. [Çoklu Agent Yönlendirmesi](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp).
  </Accordion>

  <Accordion title='Bir "hızlı sohbet" agent'ı ve "kodlama için Opus" agent'ı çalıştırabilir miyim?'>
    Evet. Çoklu agent yönlendirmesini kullanın: her agent'a kendi varsayılan modelini verin, ardından gelen rotaları (sağlayıcı hesabı veya belirli eşler) her agent'a bağlayın. Örnek yapılandırma [Çoklu Agent Yönlendirmesi](/tr/concepts/multi-agent) bölümünde bulunur. Ayrıca [Modeller](/tr/concepts/models) ve [Yapılandırma](/tr/gateway/configuration) bölümlerine de bakın.
  </Accordion>

  <Accordion title="Homebrew Linux'ta çalışır mı?">
    Evet. Homebrew Linux'u (Linuxbrew) destekler. Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw'ı systemd ile çalıştırırsanız, hizmet PATH'inin `/home/linuxbrew/.linuxbrew/bin` (veya brew önekiniz) yolunu içerdiğinden emin olun; böylece `brew` ile yüklenen araçlar giriş yapılmamış kabuklarda çözümlenebilir.
    Son derlemeler ayrıca Linux systemd hizmetlerinde yaygın kullanıcı bin dizinlerini başa ekler (örneğin `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) ve ayarlıysa `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değişkenlerine uyar.

  </Accordion>

  <Accordion title="Hacklenebilir git kurulumu ile npm install arasındaki fark">
    - **Hacklenebilir (git) kurulum:** tam kaynak checkout'u, düzenlenebilir, katkıda bulunanlar için en iyisi.
      Derlemeleri yerelde çalıştırırsınız ve kod/belgeleri yamalayabilirsiniz.
    - **npm install:** genel CLI kurulumu, depo yok, "sadece çalıştırmak" için en iyisi.
      Güncellemeler npm dist-tags üzerinden gelir.

    Belgeler: [Başlarken](/tr/start/getting-started), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="npm ve git kurulumları arasında daha sonra geçiş yapabilir miyim?">
    Evet. Diğer kurulum türünü yükleyin, ardından gateway hizmeti yeni giriş noktasına işaret etsin diye Doctor'ı çalıştırın.
    Bu işlem **verilerinizi silmez** - yalnızca OpenClaw kod kurulumunu değiştirir. Durumunuz
    (`~/.openclaw`) ve çalışma alanınız (`~/.openclaw/workspace`) olduğu gibi kalır.

    npm'den git'e:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    git'ten npm'e:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor, gateway hizmeti giriş noktası uyuşmazlığını algılar ve hizmet yapılandırmasını mevcut kurulumla eşleşecek şekilde yeniden yazmayı önerir (otomasyonda `--repair` kullanın).

    Yedekleme ipuçları: [Yedekleme stratejisi](#diskte-öğelerin-bulunduğu-yer) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway'i dizüstü bilgisayarımda mı yoksa bir VPS'te mi çalıştırmalıyım?">
    Kısa yanıt: **7/24 güvenilirlik istiyorsanız bir VPS kullanın**. En düşük sürtünmeyi istiyorsanız
    ve uyku/yeniden başlatmalar sorun değilse yerelde çalıştırın.

    **Dizüstü bilgisayar (yerel Gateway)**

    - **Artıları:** sunucu maliyeti yok, yerel dosyalara doğrudan erişim, canlı tarayıcı penceresi.
    - **Eksileri:** uyku/ağ kopmaları = bağlantı kopmaları, işletim sistemi güncellemeleri/yeniden başlatmaları kesintiye uğratır, uyanık kalması gerekir.

    **VPS / bulut**

    - **Artıları:** her zaman açık, kararlı ağ, dizüstü bilgisayar uyku sorunları yok, çalışır durumda tutmak daha kolay.
    - **Eksileri:** genellikle headless çalışır (ekran görüntüsü kullanın), yalnızca uzak dosya erişimi vardır, güncellemeler için SSH gerekir.

    **OpenClaw'a özgü not:** WhatsApp/Telegram/Slack/Mattermost/Discord bir VPS üzerinde sorunsuz çalışır. Tek gerçek takas **headless tarayıcı** ile görünür pencere arasındadır. Bkz. [Tarayıcı](/tr/tools/browser).

    **Önerilen varsayılan:** daha önce gateway bağlantı kopmaları yaşadıysanız VPS. Yerel kurulum, Mac'i etkin olarak kullandığınızda ve yerel dosya erişimi veya görünür tarayıcıyla UI otomasyonu istediğinizde harikadır.

  </Accordion>

  <Accordion title="OpenClaw'ı özel bir makinede çalıştırmak ne kadar önemli?">
    Zorunlu değil, ama **güvenilirlik ve yalıtım için önerilir**.

    - **Özel ana makine (VPS/Mac mini/Pi):** her zaman açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır durumda tutması daha kolay.
    - **Paylaşılan dizüstü/masaüstü:** test ve etkin kullanım için tamamen uygundur, ancak makine uyuduğunda veya güncellendiğinde duraklamalar bekleyin.

    Her iki dünyanın da en iyisini istiyorsanız Gateway'i özel bir ana makinede tutun ve yerel ekran/kamera/exec araçları için dizüstü bilgisayarınızı bir **Node** olarak eşleyin. Bkz. [Node'lar](/tr/nodes).
    Güvenlik rehberi için [Güvenlik](/tr/gateway/security) bölümünü okuyun.

  </Accordion>

  <Accordion title="En düşük VPS gereksinimleri ve önerilen işletim sistemi nedir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM, yaklaşık 500MB disk.
    - **Önerilen:** daha fazla boşluk için 1-2 vCPU, 2GB RAM veya üzeri (günlükler, medya, birden çok kanal). Node araçları ve tarayıcı otomasyonu kaynak tüketebilir.

    İşletim sistemi: **Ubuntu LTS** kullanın (veya herhangi bir modern Debian/Ubuntu). Linux kurulum yolu en iyi burada test edilmiştir.

    Belgeler: [Linux](/tr/platforms/linux), [VPS barındırma](/tr/vps).

  </Accordion>

  <Accordion title="OpenClaw'ı sanal makinede çalıştırabilir miyim ve gereksinimler nelerdir?">
    Evet. Sanal makineye bir VPS gibi davranın: her zaman açık olmalı, erişilebilir olmalı ve
    Gateway ile etkinleştirdiğiniz tüm kanallar için yeterli RAM'e sahip olmalıdır.

    Temel rehber:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM.
    - **Önerilen:** birden çok kanal, tarayıcı otomasyonu veya medya araçları çalıştırıyorsanız 2GB RAM veya üzeri.
    - **İşletim sistemi:** Ubuntu LTS veya başka bir modern Debian/Ubuntu.

    Windows kullanıyorsanız **WSL2 en kolay sanal makine tarzı kurulumdur** ve en iyi araç
    uyumluluğuna sahiptir. Bkz. [Windows](/tr/platforms/windows), [VPS barındırma](/tr/vps).
    macOS'u bir sanal makinede çalıştırıyorsanız [macOS VM](/tr/install/macos-vm) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw tek paragrafta nedir?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir AI asistanıdır. Hâlihazırda kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi paketlenmiş kanal Plugin'leri) yanıt verir ve ayrıca desteklenen platformlarda ses + canlı Canvas da sunabilir. **Gateway** her zaman açık kontrol düzlemidir; ürün asistanın kendisidir.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw "yalnızca bir Claude sarmalayıcısı" değildir. Kendi iş akışlarınızın kontrolünü
    barındırılan bir SaaS'a devretmeden, **kendi donanımınızda** çalışan,
    hâlihazırda kullandığınız sohbet uygulamalarından erişilebilen, durum bilgili
    oturumlar, bellek ve araçlar içeren yetenekli bir asistan çalıştırmanızı sağlayan
    **yerel öncelikli bir kontrol düzlemidir**.

    Öne çıkanlar:

    - **Cihazlarınız, verileriniz:** Gateway'i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve
      çalışma alanı + oturum geçmişini yerelde tutun.
    - **Web sandbox'ı değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın; agent başına yönlendirme
      ve yedekleme ile.
    - **Yalnızca yerel seçenek:** isterseniz **tüm veriler cihazınızda kalabilsin** diye yerel modeller çalıştırın.
    - **Çoklu agent yönlendirmesi:** kanal, hesap veya görev başına ayrı agent'lar; her birinin kendi
      çalışma alanı ve varsayılanları vardır.
    - **Açık kaynak ve hacklenebilir:** satıcıya bağlı kalmadan inceleyin, genişletin ve kendiniz barındırın.

    Belgeler: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çoklu agent](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - önce ne yapmalıyım?">
    İyi ilk projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Bir mobil uygulama prototipi hazırlayın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizlik, adlandırma, etiketleme).
    - Gmail'i bağlayın ve özetleri veya takipleri otomatikleştirin.

    Büyük görevleri de halledebilir, ancak bunları aşamalara böldüğünüzde ve
    paralel çalışma için alt agent'lar kullandığınızda en iyi şekilde çalışır.

  </Accordion>

  <Accordion title="OpenClaw için günlük hayattaki en iyi beş kullanım durumu nedir?">
    Günlük kazanımlar genellikle şöyle görünür:

    - **Kişisel brifingler:** gelen kutunuzun, takviminizin ve önemsediğiniz haberlerin özetleri.
    - **Araştırma ve taslak hazırlama:** e-postalar veya belgeler için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatmalar ve takipler:** Cron veya Heartbeat ile tetiklenen dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** form doldurma, veri toplama ve web görevlerini tekrarlama.
    - **Cihazlar arası koordinasyon:** telefonunuzdan bir görev gönderin, Gateway bunu bir sunucuda çalıştırsın ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw, bir SaaS için lead gen, outreach, reklamlar ve bloglarda yardımcı olabilir mi?">
    Evet, **araştırma, nitelendirme ve taslak hazırlama** için. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve outreach veya reklam metni taslakları yazabilir.

    **Outreach veya reklam çalışmaları** için insanı döngü içinde tutun. Spam'den kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli desen,
    OpenClaw'ın taslak hazırlaması ve sizin onaylamanızdır.

    Belgeler: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirmede Claude Code'a kıyasla avantajları nelerdir?">
    OpenClaw bir **kişisel asistan** ve koordinasyon katmanıdır, IDE yerine geçmez. Bir depo içinde
    en hızlı doğrudan kodlama döngüsü için Claude Code veya Codex kullanın. Kalıcı
    bellek, cihazlar arası erişim ve araç orkestrasyonu istediğinizde OpenClaw kullanın.

    Avantajlar:

    - Oturumlar arasında **kalıcı bellek + çalışma alanı**
    - **Çok platformlu erişim** (WhatsApp, Telegram, TUI, WebChat)
    - **Araç orkestrasyonu** (tarayıcı, dosyalar, zamanlama, hook'lar)
    - **Her zaman açık Gateway** (bir VPS üzerinde çalıştırın, her yerden etkileşim kurun)
    - Yerel tarayıcı/ekran/kamera/exec için **Node'lar**

    Tanıtım: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Depoyu kirli tutmadan Skills'i nasıl özelleştiririm?">
    Depo kopyasını düzenlemek yerine yönetilen geçersiz kılmaları kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` ile bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir; bu nedenle yönetilen geçersiz kılmalar git'e dokunmadan paketlenmiş Skills üzerinde yine de öncelik kazanır. Skill'in genel olarak kurulu olması ama yalnızca bazı agent'lar tarafından görünmesi gerekiyorsa ortak kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ile `agents.list[].skills` üzerinden kontrol edin. Yalnızca upstream'e uygun düzenlemeler depoda yaşamalı ve PR olarak gönderilmelidir.
  </Accordion>

  <Accordion title="Skills'i özel bir klasörden yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` üzerinden ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine kurar; OpenClaw bunu bir sonraki oturumda `<workspace>/skills` olarak ele alır. Skill yalnızca belirli agent'lar tarafından görünür olmalıysa bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen desenler şunlardır:

    - **Cron işleri**: yalıtılmış işler, iş başına `model` geçersiz kılması ayarlayabilir.
    - **Alt agent'lar**: görevleri farklı varsayılan modellere sahip ayrı agent'lara yönlendirin.
    - **İsteğe bağlı geçiş**: mevcut oturum modelini istediğiniz zaman değiştirmek için `/model` kullanın.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çoklu Agent Yönlendirmesi](/tr/concepts/multi-agent) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl dışarı aktarırım?">
    Uzun veya paralel görevler için **alt agent'lar** kullanın. Alt agent'lar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizin yanıt verebilirliğini korur.

    Botunuzdan "bu görev için bir alt agent başlatmasını" isteyin veya `/subagents` kullanın.
    Gateway'in şu anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: uzun görevler ve alt agent'lar da token tüketir. Maliyet önemliyse
    alt agent'lar için daha ucuz bir modeli `agents.defaults.subagents.model` üzerinden ayarlayın.

    Belgeler: [Alt agent'lar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da thread'e bağlı subagent oturumları nasıl çalışır?">
    Thread bağlamalarını kullanın. Bir Discord thread'ini bir subagent'a veya oturum hedefine bağlayabilirsiniz; böylece o thread içindeki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `sessions_spawn` ile `thread: true` kullanarak başlatın (ve kalıcı takip için isteğe bağlı olarak `mode: "session"` ekleyin).
    - Veya `/focus <target>` ile elle bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik odağı kaldırmayı kontrol etmek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - Thread'i ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Genel varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Başlatmada otomatik bağlama: `channels.discord.threadBindings.spawnSubagentSessions: true` ayarlayın.

    Belgeler: [Alt agent'lar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Başvurusu](/tr/gateway/configuration-reference), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt agent tamamlandı, ancak tamamlanma güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen istek sahibi rotasını kontrol edin:

    - Tamamlanma modu alt agent teslimi, varsa bağlı herhangi bir thread veya konuşma rotasını tercih eder.
    - Tamamlanma kaynağı yalnızca bir kanal taşıyorsa OpenClaw, doğrudan teslim yine başarılı olabilsin diye istek sahibi oturumunun saklanan rotasına (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Bağlı rota ya da kullanılabilir saklanan rota yoksa doğrudan teslim başarısız olabilir ve sonuç sohbete hemen gönderilmek yerine kuyruğa alınmış oturum teslimine geri döner.
    - Geçersiz veya bayat hedefler yine de kuyruk geri dönüşüne ya da son teslim başarısızlığına neden olabilir.
    - Alt öğenin son görünür asistan yanıtı tam olarak sessiz token `NO_REPLY` / `no_reply` ya da tam olarak `ANNOUNCE_SKIP` ise OpenClaw, eski ilerlemeyi göndermek yerine duyuruyu bilerek bastırır.
    - Alt öğe yalnızca araç çağrılarından sonra zaman aşımına uğradıysa duyuru, ham araç çıktısını yeniden oynatmak yerine bunu kısa bir kısmi ilerleme özeti hâline getirebilir.

    Hata ayıklama:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Alt agent'lar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya hatırlatmalar tetiklenmiyor. Neyi kontrol etmeliyim?">
    Cron, Gateway süreci içinde çalışır. Gateway sürekli çalışmıyorsa
    zamanlanmış işler de çalışmaz.

    Kontrol listesi:

    - Cron'un etkin olduğunu doğrulayın (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` ayarlı olmasın.
    - Gateway'in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
    - İş için saat dilimi ayarlarını doğrulayın (`--tz` ile ana makine saat dilimi).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="Cron tetiklendi, ama kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` dış mesaj beklenmediği anlamına gelir.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`) çalıştırıcının giden teslimi atladığı anlamına gelir.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), çalıştırıcının teslim etmeye çalıştığını ama kimlik bilgilerinin bunu engellediğini gösterir.
    - Sessiz yalıtılmış sonuç (`NO_REPLY` / `no_reply` yalnızca) bilerek teslim edilemez kabul edilir, bu nedenle çalıştırıcı sıraya alınmış geri dönüş teslimini de bastırır.

    Yalıtılmış Cron işleri için son teslimden çalıştırıcı sorumludur. Agent'tan,
    çalıştırıcının gönderebileceği düz metin bir özet döndürmesi beklenir. `--no-deliver`
    bu sonucu içerde tutar; bunun yerine agent'ın ileti
    aracıyla doğrudan göndermesine izin vermez.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Yalıtılmış bir Cron çalıştırması neden model değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle yinelenen zamanlama değil, canlı model değiştirme yoludur.

    Yalıtılmış Cron, etkin çalıştırma
    `LiveSessionModelSwitchError` fırlattığında çalışma zamanı model devrini kalıcılaştırabilir ve yeniden deneyebilir. Yeniden deneme değiştirilen
    sağlayıcıyı/modeli korur; değişiklik yeni bir kimlik doğrulama profili geçersiz kılması da taşıyorsa Cron
    bunu da yeniden denemeden önce kalıcılaştırır.

    İlgili seçim kuralları:

    - Uygulanabiliyorsa önce Gmail hook model geçersiz kılması kazanır.
    - Sonra iş başına `model`.
    - Sonra saklanan herhangi bir cron oturumu model geçersiz kılması.
    - Sonra normal agent/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme ve artı 2 model değiştirme yeniden denemesinden sonra
    Cron sonsuza kadar döngüye girmek yerine iptal eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Linux'ta Skills nasıl kurarım?">
    Yerel `openclaw skills` komutlarını kullanın veya Skills'i çalışma alanınıza bırakın. macOS Skills UI Linux'ta kullanılamaz.
    Skills'e [https://clawhub.ai](https://clawhub.ai) üzerinden göz atın.

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    Yerel `openclaw skills install`, etkin çalışma alanının `skills/`
    dizinine yazar. Ayrı `clawhub` CLI'yi yalnızca kendi Skills'inizi yayımlamak veya
    eşitlemek istiyorsanız kurun. Agent'lar arasında paylaşılan kurulumlar için Skill'i
    `~/.openclaw/skills` altına koyun ve yalnızca hangi agent'ların görebileceğini daraltmak istiyorsanız
    `agents.defaults.skills` veya
    `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw zamanlanmış veya arka planda sürekli görevler çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalardan sonra da kalır).
    - "Ana oturum" dönemsel kontrolleri için **Heartbeat**.
    - Özet gönderen veya sohbetlere teslim yapan otonom agent'lar için **Yalıtılmış işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Linux'tan Apple macOS-only Skills çalıştırabilir miyim?">
    Doğrudan hayır. macOS Skills, `metadata.openclaw.os` ve gerekli ikili dosyalar tarafından sınırlandırılır ve Skills yalnızca **Gateway ana makinesinde** uygun olduklarında sistem isteminde görünür. Linux'ta `darwin`-only Skills (`apple-notes`, `apple-reminders`, `things-mac` gibi), sınırlandırmayı geçersiz kılmadığınız sürece yüklenmez.

    Desteklenen üç desen vardır:

    **Seçenek A - Gateway'i bir Mac üzerinde çalıştırın (en basit).**
    Gateway'i macOS ikili dosyalarının bulunduğu yerde çalıştırın, ardından Linux'tan [uzak modda](#gateway-bağlantı-noktaları-zaten-çalışıyor-ve-uzak-mod) veya Tailscale üzerinden bağlanın. Skills normal şekilde yüklenir çünkü Gateway ana makinesi macOS'tur.

    **Seçenek B - bir macOS Node kullanın (SSH yok).**
    Gateway'i Linux'ta çalıştırın, bir macOS Node'u (menü çubuğu uygulaması) eşleyin ve Mac'te **Node Run Commands** ayarını "Always Ask" veya "Always Allow" olarak yapın. Gerekli ikili dosyalar Node üzerinde varsa OpenClaw macOS-only Skills'i uygun olarak değerlendirebilir. Agent bu Skills'i `nodes` aracı üzerinden çalıştırır. "Always Ask" seçerseniz istemde "Always Allow"u onaylamak o komutu izin listesine ekler.

    **Seçenek C - macOS ikili dosyalarını SSH üzerinden proxy'leyin (ileri seviye).**
    Gateway'i Linux'ta tutun, ancak gerekli CLI ikili dosyalarını bir Mac üzerinde çalışan SSH sarmalayıcılarına çözümlenecek şekilde ayarlayın. Ardından uygun kalması için Skill'i Linux'a izin verecek şekilde geçersiz kılın.

    1. İkili dosya için bir SSH sarmalayıcısı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux ana makinesinde `PATH` üzerine koyun (örneğin `~/bin/memo`).
    3. Skill meta verisini (çalışma alanı veya `~/.openclaw/skills`) Linux'a izin verecek şekilde geçersiz kılın:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills anlık görüntüsü yenilensin diye yeni bir oturum başlatın.

  </Accordion>

  <Accordion title="Notion veya HeyGen entegrasyonunuz var mı?">
    Şu anda yerleşik değil.

    Seçenekler:

    - **Özel Skill / Plugin:** güvenilir API erişimi için en iyisi (Notion/HeyGen ikisinin de API'si vardır).
    - **Tarayıcı otomasyonu:** kod olmadan çalışır ama daha yavaştır ve daha kırılgandır.

    İstemci başına bağlam tutmak istiyorsanız (ajans iş akışları), basit bir desen şudur:

    - İstemci başına bir Notion sayfası (bağlam + tercihler + etkin iş).
    - Agent'tan oturum başında bu sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız özellik isteği açın veya bu API'leri
    hedefleyen bir Skill oluşturun.

    Skills yükleme:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin çalışma alanının `skills/` dizinine gider. Agent'lar arasında paylaşılan Skills için bunları `~/.openclaw/skills/<name>/SKILL.md` içine yerleştirin. Paylaşılan kurulumu yalnızca bazı agent'lar görmeliyse `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı Skills Homebrew ile kurulu ikili dosyalar bekler; Linux'ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/tools/clawhub).

  </Accordion>

  <Accordion title="OpenClaw ile mevcut oturumu açık Chrome'umu nasıl kullanırım?">
    Chrome DevTools MCP üzerinden bağlanan yerleşik `user` tarayıcı profilini kullanın:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Özel bir ad istiyorsanız açık bir MCP profili oluşturun:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Bu yol yerel ana makine tarayıcısını veya bağlı bir tarayıcı Node'unu kullanabilir. Gateway başka yerde çalışıyorsa tarayıcı makinesinde bir Node ana makinesi çalıştırın veya bunun yerine uzak CDP kullanın.

    `existing-session` / `user` için mevcut sınırlamalar:

    - eylemler CSS seçici tabanlı değil, ref tabanlıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda bir seferde tek dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler için yine de yönetilen bir tarayıcı veya ham CDP profili gerekir

  </Accordion>
</AccordionGroup>

## Sandbox ve bellek

<AccordionGroup>
  <Accordion title="Özel bir sandboxing belgesi var mı?">
    Evet. Bkz. [Sandboxing](/tr/gateway/sandboxing). Docker'a özgü kurulum için (Docker içinde tam gateway veya sandbox image'ları) bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker sınırlı hissettiriyor - tam özellikleri nasıl etkinleştiririm?">
    Varsayılan image güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır, bu nedenle
    sistem paketleri, Homebrew veya paketlenmiş tarayıcılar içermez. Daha tam bir kurulum için:

    - Önbellekler korunsun diye `/home/node` için `OPENCLAW_HOME_VOLUME` kalıcılaştırın.
    - Sistem bağımlılıklarını `OPENCLAW_DOCKER_APT_PACKAGES` ile image içine ekleyin.
    - Paketlenmiş CLI üzerinden Playwright tarayıcılarını kurun:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı olduğundan emin olun.

    Belgeler: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="DM'leri kişisel tutup grupları herkese açık/sandbox içinde tek bir agent ile yapabilir miyim?">
    Evet - özel trafiğiniz **DM**, herkese açık trafiğiniz **gruplar** ise.

    Grup/kanal oturumlarının (ana olmayan anahtarlar) Docker içinde çalışması, ana DM oturumunun ise ana makinede kalması için `agents.defaults.sandbox.mode: "non-main"` kullanın. Ardından sandbox içindeki oturumlarda hangi araçların kullanılabilir olduğunu `tools.sandbox.tools` ile sınırlayın.

    Kurulum anlatımı + örnek yapılandırma: [Gruplar: kişisel DM'ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Temel yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Ana makine klasörünü sandbox içine nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (ör. `"/home/user/src:/src:ro"`). Genel + agent başına bağlamalar birleşir; `scope: "shared"` olduğunda agent başına bağlamalar yok sayılır. Hassas her şey için `:ro` kullanın ve bağlamaların sandbox dosya sistemi duvarlarını atlattığını unutmayın.

    OpenClaw, bağlama kaynaklarını hem normalize edilmiş yola hem de en derin mevcut üst öğe üzerinden çözümlenen canonical yola göre doğrular. Bu, son yol bölümü henüz mevcut olmasa bile symlink üst öğe kaçışlarının yine de güvenli biçimde kapalı kalacağı ve izin verilen kök denetimlerinin symlink çözümlemesinden sonra da uygulanacağı anlamına gelir.

    Örnekler ve güvenlik notları için [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts) ve [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) bölümlerine bakın.

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, agent çalışma alanındaki Markdown dosyalarından ibarettir:

    - `memory/YYYY-MM-DD.md` içindeki günlük notlar
    - `MEMORY.md` içindeki düzenlenmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca, modele otomatik Compaction öncesinde kalıcı notlar yazmasını
    hatırlatmak için **sessiz bir pre-Compaction bellek boşaltma** çalıştırır. Bu yalnızca çalışma alanı
    yazılabilir olduğunda çalışır (salt okunur sandbox'lar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek bir şeyleri unutmaya devam ediyor. Bunu nasıl kalıcı yaparım?">
    Bottan **gerçeği belleğe yazmasını** isteyin. Uzun vadeli notlar `MEMORY.md` içine,
    kısa vadeli bağlam ise `memory/YYYY-MM-DD.md` içine gitmelidir.

    Bu hâlâ geliştirmekte olduğumuz bir alandır. Modele anıları depolamasını hatırlatmak yardımcı olur;
    ne yapacağını bilir. Hâlâ unutuyorsa Gateway'in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Agent çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalır mı? Sınırlar nelerdir?">
    Bellek dosyaları diskte yaşar ve siz silene kadar kalır. Sınır model değil,
    depolamanızdır. **Oturum bağlamı** ise yine modelin
    bağlam penceresiyle sınırlıdır; bu yüzden uzun konuşmalar compact edilebilir veya kırpılabilir. Bu nedenle
    bellek araması vardır - yalnızca ilgili kısımları yeniden bağlama çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Anlamsal bellek araması için OpenAI API anahtarı gerekir mi?">
    Yalnızca **OpenAI embeddings** kullanıyorsanız. Codex OAuth sohbet/tamamlama işlemlerini kapsar ve
    embeddings erişimi vermez; bu nedenle **Codex ile oturum açmak (OAuth veya
    Codex CLI girişi)** anlamsal bellek aramasında yardımcı olmaz. OpenAI embeddings için
    yine gerçek bir API anahtarı gerekir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız, OpenClaw bir API anahtarını çözümleyebildiğinde
    otomatik olarak bir sağlayıcı seçer (kimlik doğrulama profilleri, `models.providers.*.apiKey` veya ortam değişkenleri).
    Bir OpenAI anahtarı çözümlenirse OpenAI'yi, aksi hâlde bir Gemini anahtarı
    çözümlenirse Gemini'yi, sonra Voyage'ı, sonra Mistral'i tercih eder. Uzak anahtar yoksa bellek
    araması siz yapılandırana kadar devre dışı kalır. Yerel model yolu
    yapılandırılmış ve mevcutsa OpenClaw
    `local` seçeneğini tercih eder. `memorySearch.provider = "ollama"` değerini açıkça ayarladığınızda Ollama desteklenir.

    Yerelde kalmayı tercih ederseniz `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` sağlayın (veya
    `memorySearch.remote.apiKey`). **OpenAI, Gemini, Voyage, Mistral, Ollama veya local** embedding
    modellerini destekliyoruz - kurulum ayrıntıları için [Bellek](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Öğelerin diskte bulunduğu yer

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerelde mi kaydedilir?">
    Hayır - **OpenClaw'ın durumu yereldir**, ancak **harici hizmetler onlara gönderdiğiniz şeyleri yine de görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, yapılandırma ve çalışma alanı Gateway ana makinesinde bulunur
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz mesajlar
      onların API'lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) ileti verilerini kendi
      sunucularında saklar.
    - **İzi siz kontrol edersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Agent çalışma alanı](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede saklar?">
    Her şey `$OPENCLAW_STATE_DIR` altında bulunur (varsayılan: `~/.openclaw`):

    | Yol                                                            | Amaç                                                               |
    | -------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                            | Ana yapılandırma (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                   | Eski OAuth içe aktarımı (ilk kullanımda auth profillerine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profilleri (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                             | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli gizli yük |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`         | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenmiştir) |
    | `$OPENCLAW_STATE_DIR/credentials/`                             | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                  | Agent başına durum (agentDir + oturumlar)                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`               | Konuşma geçmişi ve durumu (agent başına)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`  | Oturum meta verileri (agent başına)                                |

    Eski tek agent yolu: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır).

    **Çalışma alanınız** (`AGENTS.md`, bellek dosyaları, Skills vb.) ayrıdır ve `agents.defaults.workspace` ile yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede olmalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **agent çalışma alanında** bulunur.

    - **Çalışma alanı (agent başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (veya `MEMORY.md` yoksa eski geri dönüş olarak `memory.md`),
      `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
    - **Durum dizini (`~/.openclaw`)**: yapılandırma, kanal/sağlayıcı durumu, auth profilleri, oturumlar, günlükler,
      ve paylaşılan Skills (`~/.openclaw/skills`).

    Varsayılan çalışma alanı `~/.openclaw/workspace` dizinidir, şu yolla yapılandırılabilir:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Bot yeniden başlatmadan sonra "unutuyorsa", Gateway'in her başlatmada aynı
    çalışma alanını kullandığını doğrulayın (ve unutmayın: uzak mod, yerel dizüstü bilgisayarınızın değil
    **gateway ana makinesinin** çalışma alanını kullanır).

    İpucu: kalıcı bir davranış veya tercih istiyorsanız, yalnızca sohbet geçmişine güvenmek yerine
    bottan bunu **AGENTS.md veya MEMORY.md içine yazmasını**
    isteyin.

    Bkz. [Agent çalışma alanı](/tr/concepts/agent-workspace) ve [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Agent çalışma alanınızı** **özel** bir git reposuna koyun ve özel bir yere
    yedekleyin (örneğin GitHub private). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve daha sonra asistanın "zihnini" geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi commit etmeyin (kimlik bilgileri, oturumlar, token'lar veya şifrelenmiş gizli yükler).
    Tam geri yükleme gerekiyorsa çalışma alanını ve durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki taşıma sorusuna bakın).

    Belgeler: [Agent çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen nasıl kaldırırım?">
    Özel kılavuza bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Agent'lar çalışma alanı dışında çalışabilir mi?">
    Evet. Çalışma alanı katı bir sandbox değil, **varsayılan cwd** ve bellek dayanağıdır.
    Göreli yollar çalışma alanı içinde çözülür, ancak mutlak yollar başka
    ana makine konumlarına erişebilir; sandboxing etkinse durum farklıdır. Yalıtım gerekiyorsa
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya agent başına sandbox ayarlarını kullanın. Bir
    deponun varsayılan çalışma dizini olmasını istiyorsanız, o agent'ın
    `workspace` değerini deponun köküne yönlendirin. OpenClaw deposu yalnızca kaynak koddur; agent'ın
    özellikle içinde çalışmasını istemiyorsanız çalışma alanını ayrı tutun.

    Örnek (varsayılan cwd olarak repo):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Uzak mod: oturum deposu nerede?">
    Oturum durumu **gateway ana makinesine** aittir. Uzak moddaysanız önem verdiğiniz oturum deposu yerel dizüstü bilgisayarınızda değil, uzak makinededir. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>
</AccordionGroup>

## Temel yapılandırma bilgileri

<AccordionGroup>
  <Accordion title="Yapılandırma hangi biçimde? Nerede?">
    OpenClaw isteğe bağlı **JSON5** yapılandırmasını `$OPENCLAW_CONFIG_PATH` üzerinden okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya eksikse güvenli sayılabilecek varsayılanları kullanır (`~/.openclaw/workspace` varsayılan çalışma alanı dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve artık hiçbir şey dinlemiyor / UI "unauthorized" diyor'>
    Loopback dışı bind'ler **geçerli bir gateway auth yolu gerektirir**. Pratikte bu şu anlama gelir:

    - paylaşılan gizli auth: token veya parola
    - doğru yapılandırılmış loopback dışı kimlik farkındalıklı ters proxy arkasında `gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Notlar:

    - `gateway.remote.token` / `.password` tek başlarına yerel gateway auth'u etkinleştirmez.
    - Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarsız olduğunda geri dönüş olarak `gateway.remote.*` kullanabilir.
    - Parola auth için bunun yerine `gateway.auth.mode: "password"` ile birlikte `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password`, SecretRef üzerinden açıkça yapılandırılmış ama çözümlenmemişse çözümleme güvenli biçimde kapalı kalır (uzak geri dönüş bunu maskelemez).
    - Paylaşılan gizli Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` üzerinden kimlik doğrular (uygulama/UI ayarlarında saklanır). Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek üstbilgilerini kullanır. Paylaşılan gizlileri URL'lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile aynı ana makinedeki loopback ters proxy'ler yine de trusted-proxy auth'u karşılamaz. Trusted proxy yapılandırılmış bir loopback dışı kaynak olmalıdır.

  </Accordion>

  <Accordion title="Neden artık localhost üzerinde bir token'a ihtiyacım var?">
    OpenClaw, loopback dahil olmak üzere gateway auth'u varsayılan olarak zorunlu kılar. Normal varsayılan yolda bu token auth anlamına gelir: açık bir auth yolu yapılandırılmamışsa gateway başlangıcı token moduna çözülür ve otomatik olarak bir tane üretir, bunu `gateway.auth.token` içine kaydeder; bu nedenle **yerel WS istemcileri kimlik doğrulaması yapmalıdır**. Bu, diğer yerel süreçlerin Gateway'i çağırmasını engeller.

    Farklı bir auth yolu tercih ederseniz parola modunu açıkça seçebilirsiniz (veya loopback dışı kimlik farkındalıklı ters proxy'ler için `trusted-proxy`). **Gerçekten** açık loopback istiyorsanız yapılandırmanızda açıkça `gateway.auth.mode: "none"` ayarlayın. Doctor sizin için istediğiniz zaman token oluşturabilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Yapılandırmayı değiştirdikten sonra yeniden başlatmam gerekir mi?">
    Gateway yapılandırmayı izler ve hot-reload destekler:

    - `gateway.reload.mode: "hybrid"` (varsayılan): güvenli değişiklikleri hot-apply yapar, kritik olanlar için yeniden başlatır
    - `hot`, `restart`, `off` da desteklenir

  </Accordion>

  <Accordion title="Komik CLI sloganlarını nasıl kapatırım?">
    Yapılandırmada `cli.banner.taglineMode` ayarlayın:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: slogan metnini gizler ama banner başlığı/sürüm satırını korur.
    - `default`: her seferinde `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen komik/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

  </Accordion>

  <Accordion title="Web aramayı (ve web getirmeyi) nasıl etkinleştiririm?">
    `web_fetch` API anahtarı olmadan çalışır. `web_search` ise seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırdığınız Ollama ana makinesini kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ancak resmî olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsız/kendi kendine barındırılabilir; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

    **Önerilen:** `openclaw configure --section web` çalıştırın ve bir sağlayıcı seçin.
    Ortam değişkeni alternatifleri:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` veya `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` veya `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` veya `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    Sağlayıcıya özgü web-search yapılandırması artık `plugins.entries.<plugin>.config.webSearch.*` altında yaşar.
    Eski `tools.web.search.*` sağlayıcı yolları uyumluluk için geçici olarak hâlâ yüklenir, ancak yeni yapılandırmalarda kullanılmamalıdır.
    Firecrawl web-fetch geri dönüş yapılandırması `plugins.entries.firecrawl.config.webFetch.*` altında bulunur.

    Notlar:

    - İzin listeleri kullanıyorsanız `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadıkça).
    - `tools.web.fetch.provider` atlanırsa OpenClaw, mevcut kimlik bilgilerinden ilk hazır fetch geri dönüş sağlayıcısını otomatik algılar. Bugün paketlenmiş sağlayıcı Firecrawl'dur.
    - Arka plan hizmetleri ortam değişkenlerini `~/.openclaw/.env` dosyasından (veya hizmet ortamından) okur.

    Belgeler: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Nasıl kurtarırım ve bunu nasıl önlerim?">
    `config.apply` **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz diğer
    her şey kaldırılır.

    Kurtarma:

    - Yedekten geri yükleyin (git veya kopyalanmış bir `~/.openclaw/openclaw.json`).
    - Yedeğiniz yoksa `openclaw doctor` yeniden çalıştırın ve kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedikse hata bildirimi açın ve bilinen son yapılandırmanızı veya herhangi bir yedeği ekleyin.
    - Yerel bir kodlama agent'ı günlüklerden veya geçmişten çalışan bir yapılandırmayı çoğu zaman yeniden oluşturabilir.

    Önleme:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Tam yol veya alan şekli konusunda emin değilseniz önce `config.schema.lookup` kullanın; derinlemesine inceleme için sığ bir şema düğümü ve anlık alt öğe özetleri döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` yalnızca tam yapılandırma değişimi için kalsın.
    - Bir agent çalıştırmasından owner-only `gateway` aracını kullanıyorsanız, yine de `tools.exec.ask` / `tools.exec.security` yollarına yazmaları reddeder (aynı korumalı exec yollarına normalize olan eski `tools.bash.*` takma adları dahil).

    Belgeler: [Yapılandırma](/cli/config), [Yapılandırma sihirbazı](/cli/configure), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında uzmanlaşmış çalışanlarla merkezi bir Gateway'i nasıl çalıştırırım?">
    Yaygın desen **bir Gateway** (ör. Raspberry Pi) artı **Node**'lar ve **agent**'lardır:

    - **Gateway (merkezi):** kanallara (Signal/WhatsApp), yönlendirmeye ve oturumlara sahiptir.
    - **Node'lar (cihazlar):** Mac/iOS/Android çevre birimleri olarak bağlanır ve yerel araçları (`system.run`, `canvas`, `camera`) açığa çıkarır.
    - **Agent'lar (çalışanlar):** özel roller için ayrı beyinler/çalışma alanları (ör. "Hetzner ops", "Personal data").
    - **Alt agent'lar:** paralellik istediğinizde ana agent'tan arka plan işi başlatır.
    - **TUI:** Gateway'e bağlanır ve agent/oturum değiştirir.

    Belgeler: [Node'lar](/tr/nodes), [Uzak erişim](/tr/gateway/remote), [Çoklu Agent Yönlendirmesi](/tr/concepts/multi-agent), [Alt agent'lar](/tr/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="OpenClaw tarayıcısı headless çalışabilir mi?">
    Evet. Bu bir yapılandırma seçeneğidir:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Varsayılan `false` değeridir (headful). Headless mod bazı sitelerde anti-bot kontrollerini tetiklemeye daha yatkındır. Bkz. [Tarayıcı](/tr/tools/browser).

    Headless, **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, scraping, girişler). Temel farklar:

    - Görünür tarayıcı penceresi yoktur (görsel gerekirse ekran görüntüsü kullanın).
    - Bazı siteler headless modda otomasyona karşı daha katıdır (CAPTCHA'lar, anti-bot).
      Örneğin X/Twitter çoğu zaman headless oturumları engeller.

  </Accordion>

  <Accordion title="Tarayıcı kontrolü için Brave'i nasıl kullanırım?">
    `browser.executablePath` değerini Brave ikili dosyanıza (veya herhangi bir Chromium tabanlı tarayıcıya) ayarlayın ve Gateway'i yeniden başlatın.
    Tam yapılandırma örnekleri için [Tarayıcı](/tr/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak gateway'ler ve Node'lar

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve Node'lar arasında nasıl yayılır?">
    Telegram mesajları **gateway** tarafından işlenir. Gateway agent'ı çalıştırır ve
    yalnızca bir Node aracı gerektiğinde **Gateway WebSocket** üzerinden Node'ları çağırır:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node'lar gelen sağlayıcı trafiğini görmez; yalnızca Node RPC çağrılarını alırlar.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa agent'ım bilgisayarıma nasıl erişebilir?">
    Kısa yanıt: **bilgisayarınızı bir Node olarak eşleyin**. Gateway başka yerde çalışır, ancak
    Gateway WebSocket üzerinden yerel makinenizde `node.*` araçlarını (ekran, kamera, sistem) çağırabilir.

    Tipik kurulum:

    1. Gateway'i her zaman açık ana makinede çalıştırın (VPS/ev sunucusu).
    2. Gateway ana makinesi ile bilgisayarınızı aynı tailnet üzerine koyun.
    3. Gateway WS'nin erişilebilir olduğundan emin olun (tailnet bind veya SSH tüneli).
    4. macOS uygulamasını yerelde açın ve bir Node olarak kaydolabilmesi için **Remote over SSH** modunda (veya doğrudan tailnet üzerinden)
       bağlanın.
    5. Gateway üzerinde Node'u onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; Node'lar Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: bir macOS Node eşlemek, o makinede `system.run` izni verir. Yalnızca
    güvendiğiniz cihazları eşleyin ve [Güvenlik](/tr/gateway/security) bölümünü inceleyin.

    Belgeler: [Node'lar](/tr/nodes), [Gateway protokolü](/tr/gateway/protocol), [macOS uzak mod](/tr/platforms/mac/remote), [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne yapmalıyım?">
    Temelleri kontrol edin:

    - Gateway çalışıyor: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Sonra kimlik doğrulama ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız `gateway.auth.allowTailscale` değerinin doğru ayarlandığından emin olun.
    - SSH tüneli üzerinden bağlanıyorsanız yerel tünelin açık olduğunu ve doğru porta işaret ettiğini doğrulayın.
    - İzin listelerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Belgeler: [Tailscale](/tr/gateway/tailscale), [Uzak erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw örneği birbiriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir "bot-to-bot" köprüsü yoktur, ancak bunu birkaç
    güvenilir yolla kurabilirsiniz:

    **En basiti:** her iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A'nın Bot B'ye mesaj göndermesini sağlayın, ardından Bot B normal şekilde yanıtlasın.

    **CLI köprüsü (genel):** diğer Gateway'i
    `openclaw agent --message ... --deliver` ile çağıran bir betik çalıştırın; diğer botun
    dinlediği bir sohbeti hedefleyin. Botlardan biri uzak bir VPS üzerindeyse CLI'nizi o uzak Gateway'e
    SSH/Tailscale üzerinden yönlendirin (bkz. [Uzak erişim](/tr/gateway/remote)).

    Örnek desen (hedef Gateway'e ulaşabilen bir makinede çalıştırın):

    ```bash
    openclaw agent --message "Yerel bottan merhaba" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: iki botun sonsuz döngüye girmemesi için bir korkuluk ekleyin (yalnızca mention, kanal
    izin listeleri veya "bot mesajlarına yanıt verme" kuralı).

    Belgeler: [Uzak erişim](/tr/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden fazla agent için ayrı VPS'lere ihtiyacım var mı?">
    Hayır. Tek bir Gateway, her biri kendi çalışma alanına, varsayılan model ayarlarına
    ve yönlendirmeye sahip birden çok agent barındırabilir. Bu normal kurulumdur ve
    agent başına bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS'leri yalnızca sert yalıtım (güvenlik sınırları) veya
    paylaşmak istemediğiniz çok farklı yapılandırmalar gerektiğinde kullanın. Aksi takdirde tek bir Gateway tutun ve
    birden çok agent veya alt agent kullanın.

  </Accordion>

  <Accordion title="Uzak bir VPS'ten SSH kullanmak yerine kişisel dizüstü bilgisayarımda bir Node kullanmanın faydası var mı?">
    Evet - Node'lar uzak bir Gateway'den dizüstü bilgisayarınıza ulaşmanın birinci sınıf yoludur ve
    kabuk erişiminden fazlasını açar. Gateway macOS/Linux üzerinde çalışır (Windows için WSL2) ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı cihaz yeterlidir; 4 GB RAM fazlasıyla yeterlidir), bu yüzden yaygın
    kurulum her zaman açık bir ana makine artı bir Node olarak dizüstü bilgisayarınızdır.

    - **Gelen SSH gerekmez.** Node'lar dışarı doğru Gateway WebSocket'e bağlanır ve cihaz eşleme kullanır.
    - **Daha güvenli yürütme kontrolleri.** `system.run`, o dizüstü bilgisayardaki Node izin listeleri/onaylarıyla korunur.
    - **Daha fazla cihaz aracı.** Node'lar `system.run` yanında `canvas`, `camera` ve `screen` sunar.
    - **Yerel tarayıcı otomasyonu.** Gateway'i bir VPS üzerinde tutun, ama tarayıcı makinesinde bir Node ana makinesi üzerinden Chrome'u yerelde çalıştırın veya Chrome MCP ile ana makinedeki yerel Chrome'a bağlanın.

    Geçici kabuk erişimi için SSH uygundur, ancak süregelen agent iş akışları ve
    cihaz otomasyonu için Node'lar daha basittir.

    Belgeler: [Node'lar](/tr/nodes), [Nodes CLI](/cli/nodes), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Node'lar bir gateway hizmeti çalıştırır mı?">
    Hayır. Özellikle yalıtılmış profiller çalıştırmıyorsanız her ana makinede yalnızca **bir gateway** çalışmalıdır (bkz. [Birden fazla gateway](/tr/gateway/multiple-gateways)). Node'lar, gateway'e bağlanan çevre birimleridir
    (iOS/Android Node'ları veya menü çubuğu uygulamasındaki macOS "node mode"). Headless Node
    ana makineleri ve CLI denetimi için bkz. [Node host CLI](/cli/node).

    `gateway`, `discovery` ve `canvasHost` değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırmayı uygulamak için bir API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce bir yapılandırma alt ağacını sığ şema düğümü, eşleşen UI ipucu ve anlık alt öğe özetleriyle inceleyin
    - `config.get`: geçerli anlık görüntüyü + hash'i alın
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda hot-reload yapar ve gerektiğinde yeniden başlatır
    - `config.apply`: tam yapılandırmayı doğrular + değiştirir; mümkün olduğunda hot-reload yapar ve gerektiğinde yeniden başlatır
    - Owner-only `gateway` çalışma zamanı aracı yine de `tools.exec.ask` / `tools.exec.security` yollarını yeniden yazmayı reddeder; eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize olur

  </Accordion>

  <Accordion title="İlk kurulum için makul en küçük yapılandırma">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Bu, çalışma alanınızı ayarlar ve botu kimin tetikleyebileceğini sınırlar.

  </Accordion>

  <Accordion title="Bir VPS üzerinde Tailscale'i nasıl kurarım ve Mac'imden nasıl bağlanırım?">
    En az adımlar:

    1. **VPS üzerinde yükleyin + giriş yapın**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac'inizde yükleyin + giriş yapın**
       - Tailscale uygulamasını kullanın ve aynı tailnet'e giriş yapın.
    3. **MagicDNS'i etkinleştirin (önerilir)**
       - Tailscale yönetici konsolunda MagicDNS'i etkinleştirin; böylece VPS kararlı bir ada sahip olur.
    4. **Tailnet ana makine adını kullanın**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH olmadan Control UI istiyorsanız VPS üzerinde Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway'i loopback'e bağlı tutar ve HTTPS'yi Tailscale üzerinden açığa çıkarır. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac Node'u uzak bir Gateway'e nasıl bağlarım (Tailscale Serve)?">
    Serve, **Gateway Control UI + WS** sunar. Node'lar aynı Gateway WS uç noktası üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac'in aynı tailnet üzerinde olduğundan emin olun**.
    2. **macOS uygulamasını Remote modda kullanın** (SSH hedefi tailnet ana makine adı olabilir).
       Uygulama Gateway portunu tünelleyecek ve bir Node olarak bağlanacaktır.
    3. Gateway üzerinde **Node'u onaylayın**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Belgeler: [Gateway protokolü](/tr/gateway/protocol), [Discovery](/tr/gateway/discovery), [macOS uzak mod](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir dizüstü bilgisayara mı kurmalıyım yoksa yalnızca bir Node mu eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **yerel araçlara** (ekran/kamera/exec) ihtiyacınız varsa onu
    **Node** olarak ekleyin. Bu, tek bir Gateway tutar ve yinelenen yapılandırmadan kaçınır. Yerel Node araçları
    şu anda yalnızca macOS'tadır, ancak bunu diğer işletim sistemlerine genişletmeyi planlıyoruz.

    Yalnızca **sert yalıtım** veya tamamen ayrı iki bot gerektiğinde ikinci bir Gateway kurun.

    Belgeler: [Node'lar](/tr/nodes), [Nodes CLI](/cli/nodes), [Birden fazla gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw, üst süreçten (kabuk, launchd/systemd, CI vb.) gelen ortam değişkenlerini okur ve ek olarak şunları yükler:

    - geçerli çalışma dizinindeki `.env`
    - `~/.openclaw/.env` içindeki genel geri dönüş `.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut ortam değişkenlerini geçersiz kılmaz.

    Yapılandırma içinde satır içi ortam değişkenleri de tanımlayabilirsiniz (yalnızca süreç ortamında eksiklerse uygulanır):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Tam öncelik ve kaynaklar için [/environment](/tr/help/environment) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway'i hizmet üzerinden başlattım ve ortam değişkenlerim kayboldu. Şimdi ne olacak?">
    İki yaygın düzeltme:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece hizmet kabuk ortamınızı devralmasa bile alınırlar.
    2. Kabuk içe aktarmayı etkinleştirin (isteğe bağlı kolaylık):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Bu, giriş kabuğunuzu çalıştırır ve yalnızca eksik beklenen anahtarları içe aktarır (asla geçersiz kılmaz). Ortam değişkeni eşdeğerleri:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ama models status "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **kabuk ortamı içe aktarma** özelliğinin etkin olup olmadığını bildirir. "Shell env: off"
    ifadesi ortam değişkenlerinizin eksik olduğu anlamına **gelmez** - yalnızca OpenClaw'ın
    giriş kabuğunuzu otomatik yüklemeyeceği anlamına gelir.

    Gateway bir hizmet olarak çalışıyorsa (launchd/systemd), kabuk
    ortamınızı devralmaz. Bunu şu yollardan biriyle düzeltin:

    1. Token'ı `~/.openclaw/.env` içine koyun:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Veya kabuk içe aktarmayı etkinleştirin (`env.shellEnv.enabled: true`).
    3. Veya bunu yapılandırmanızdaki `env` bloğuna ekleyin (yalnızca eksikse uygulanır).

    Ardından gateway'i yeniden başlatın ve tekrar kontrol edin:

    ```bash
    openclaw models status
    ```

    Copilot token'ları `COPILOT_GITHUB_TOKEN` üzerinden okunur (ayrıca `GH_TOKEN` / `GITHUB_TOKEN`).
    Bkz. [/concepts/model-providers](/tr/concepts/model-providers) ve [/environment](/tr/help/environment).

  </Accordion>
</AccordionGroup>

## Oturumlar ve birden fazla sohbet

<AccordionGroup>
  <Accordion title="Yeni bir konuşmayı nasıl başlatırım?">
    Tek başına bir ileti olarak `/new` veya `/reset` gönderin. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>

  <Accordion title="/new hiç göndermezsem oturumlar otomatik sıfırlanır mı?">
    Oturumların süresi `session.idleMinutes` sonrasında dolabilir, ancak bu özellik varsayılan olarak **kapalıdır** (varsayılan **0**).
    Boşta kalma süresi sonlandırmasını etkinleştirmek için bunu pozitif bir değere ayarlayın. Etkin olduğunda,
    boşta kalma süresinden sonraki **sonraki**
    ileti o sohbet anahtarı için yeni bir oturum kimliği başlatır.
    Bu, transcript'leri silmez - yalnızca yeni bir oturum başlatır.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Bir OpenClaw örnekleri takımı kurmanın yolu var mı (bir CEO ve çok sayıda agent)?">
    Evet, **çoklu agent yönlendirmesi** ve **alt agent'lar** ile. Bir koordinatör
    agent ve kendi çalışma alanları ile modellerine sahip birkaç çalışan agent oluşturabilirsiniz.

    Bununla birlikte, bunu daha çok **eğlenceli bir deney** olarak görmek en iyisidir. Token açısından ağırdır ve çoğu zaman
    ayrı oturumlara sahip tek bir bot kullanmaktan daha az verimlidir. Genel olarak
    öngördüğümüz model, konuştuğunuz tek bir bot ve paralel çalışma için farklı oturumlardır. Bu
    bot gerektiğinde alt agent'lar da başlatabilir.

    Belgeler: [Çoklu agent yönlendirmesi](/tr/concepts/multi-agent), [Alt agent'lar](/tr/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Bağlam neden görevin ortasında kırpıldı? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya Compaction veya kırpmayı tetikleyebilir.

    Yardımcı olanlar:

    - Bottan mevcut durumu özetlemesini ve bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli bağlamı çalışma alanında tutun ve bottan bunu yeniden okumasını isteyin.
    - Ana sohbet daha küçük kalsın diye uzun veya paralel işler için alt agent'lar kullanın.
    - Bu sık oluyorsa daha büyük bağlam penceresine sahip bir model seçin.

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen sıfırlayıp kurulu bırakmak nasıl mümkün olur?">
    Sıfırlama komutunu kullanın:

    ```bash
    openclaw reset
    ```

    Etkileşimsiz tam sıfırlama:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Ardından kurulumu yeniden çalıştırın:

    ```bash
    openclaw onboard --install-daemon
    ```

    Notlar:

    - Onboarding, mevcut bir yapılandırma görürse **Reset** de sunar. Bkz. [Onboarding (CLI)](/tr/start/wizard).
    - Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her durum dizinini sıfırlayın (varsayılanlar `~/.openclaw-<profile>` şeklindedir).
    - Geliştirici sıfırlaması: `openclaw gateway --dev --reset` (yalnızca geliştirme; geliştirici yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını siler).

  </Accordion>

  <Accordion title='“context too large” hataları alıyorum - nasıl sıfırlar veya compact ederim?'>
    Bunlardan birini kullanın:

    - **Compact** (konuşmayı korur ama eski dönüşleri özetler):

      ```
      /compact
      ```

      veya özeti yönlendirmek için `/compact <instructions>`.

    - **Reset** (aynı sohbet anahtarı için yeni oturum kimliği):

      ```
      /new
      /reset
      ```

    Bu olmaya devam ediyorsa:

    - Eski araç çıktısını kırpmak için **oturum budamayı** etkinleştirin veya ayarlayın (`agents.defaults.contextPruning`).
    - Daha büyük bağlam penceresine sahip bir model kullanın.

    Belgeler: [Compaction](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning), [Oturum yönetimi](/tr/concepts/session).

  </Accordion>

  <Accordion title='Neden “LLM request rejected: messages.content.tool_use.input field required” görüyorum?'>
    Bu bir sağlayıcı doğrulama hatasıdır: model, gerekli
    `input` olmadan bir `tool_use` bloğu üretti. Bu genellikle oturum geçmişinin bayat veya bozuk olduğu anlamına gelir (çoğu zaman uzun thread'lerden
    veya araç/şema değişikliğinden sonra).

    Düzeltme: `/new` ile yeni bir oturum başlatın (tek başına ileti).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir heartbeat iletileri alıyorum?">
    Heartbeat'ler varsayılan olarak her **30m**'de bir çalışır (OAuth kimlik doğrulaması kullanıldığında **1h**). Ayarlayın veya devre dışı bırakın:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // veya devre dışı bırakmak için "0m"
          },
        },
      },
    }
    ```

    `HEARTBEAT.md` varsa ancak fiilen boşsa (yalnızca boş satırlar ve `# Heading` gibi markdown
    başlıkları), OpenClaw API çağrılarını azaltmak için heartbeat çalıştırmasını atlar.
    Dosya eksikse heartbeat yine çalışır ve model ne yapacağına karar verir.

    Agent başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Belgeler: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna bir “bot hesabı” eklemem gerekiyor mu?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır; bu nedenle gruptaysanız OpenClaw da bunu görebilir.
    Varsayılan olarak, gönderenlere izin verene kadar grup yanıtları engellenir (`groupPolicy: "allowlist"`).

    Grup yanıtlarını yalnızca **sizin** tetikleyebilmenizi istiyorsanız:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bir WhatsApp grubunun JID'sini nasıl alırım?">
    Seçenek 1 (en hızlı): günlükleri izleyin ve gruba bir test iletisi gönderin:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId` (veya `from`) değerini arayın; örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmışsa/izin listesindeyse): grupları yapılandırmadan listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Belgeler: [WhatsApp](/tr/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw neden bir grupta yanıt vermiyor?">
    İki yaygın neden:

    - Mention engellemesi açık (varsayılan). Botu @mention etmeniz gerekir (veya `mentionPatterns` ile eşleşmesi gerekir).
    - `channels.whatsapp.groups` yapılandırdınız ama `"*"` yok ve grup izin listesine alınmamış.

    Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/thread'ler DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturumda birleştirilir. Gruplar/kanallar kendi oturum anahtarlarına sahiptir ve Telegram konuları / Discord thread'leri ayrı oturumlardır. Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve agent oluşturabilirim?">
    Sert bir sınır yoktur. Onlarca (hatta yüzlerce) uygundur, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + transcript'ler `~/.openclaw/agents/<agentId>/sessions/` altında yaşar.
    - **Token maliyeti:** daha fazla agent, daha fazla eşzamanlı model kullanımı demektir.
    - **Operasyon yükü:** agent başına auth profilleri, çalışma alanları ve kanal yönlendirmesi.

    İpuçları:

    - Agent başına bir **etkin** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL veya store girdilerini silin).
    - Dağınık çalışma alanlarını ve profil uyuşmazlıklarını görmek için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden fazla bot veya sohbet (Slack) çalıştırabilir miyim ve bunu nasıl kurmalıyım?">
    Evet. Birden çok yalıtılmış agent çalıştırmak ve gelen iletileri
    kanal/hesap/eşe göre yönlendirmek için **Çoklu Agent Yönlendirmesi** kullanın. Slack bir kanal olarak desteklenir ve belirli agent'lara bağlanabilir.

    Tarayıcı erişimi güçlüdür ama "bir insanın yapabildiği her şeyi yapar" anlamına gelmez - anti-bot, CAPTCHA'lar ve MFA
    otomasyonu yine de engelleyebilir. En güvenilir tarayıcı kontrolü için ana makinede yerel Chrome MCP kullanın
    veya tarayıcıyı gerçekten çalıştıran makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway ana makinesi (VPS/Mac mini).
    - Rol başına bir agent (bağlamalar).
    - Bu agent'lara bağlı Slack kanalları.
    - Gerektiğinde Chrome MCP veya bir Node üzerinden yerel tarayıcı.

    Belgeler: [Çoklu Agent Yönlendirmesi](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Tarayıcı](/tr/tools/browser), [Node'lar](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller: varsayılanlar, seçim, takma adlar, geçiş

<AccordionGroup>
  <Accordion title='“Varsayılan model” nedir?'>
    OpenClaw'ın varsayılan modeli şu şekilde ayarladığınız modeldir:

    ```
    agents.defaults.model.primary
    ```

    Modeller `provider/model` biçiminde başvurulur (örnek: `openai/gpt-5.4`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, ardından tam model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesini dener ve ancak ondan sonra kullanım dışı uyumluluk yolu olarak yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw eski, kaldırılmış bir sağlayıcı varsayılanını göstermekte ısrar etmek yerine ilk yapılandırılmış sağlayıcıya/modele geri döner. Yine de `provider/model` değerini **açıkça** ayarlamalısınız.

  </Accordion>

  <Accordion title="Hangi modeli önerirsiniz?">
    **Önerilen varsayılan:** sağlayıcı yığınınızda bulunan en güçlü yeni nesil modeli kullanın.
    **Araç etkin veya güvenilmeyen girdili agent'lar için:** maliyetten önce model gücünü önceliklendirin.
    **Rutin/düşük riskli sohbetler için:** daha ucuz yedek modeller kullanın ve agent rolüne göre yönlendirin.

    MiniMax'in kendi belgeleri vardır: [MiniMax](/tr/providers/minimax) ve
    [Yerel modeller](/tr/gateway/local-models).

    Temel kural: yüksek riskli işler için karşılayabildiğiniz **en iyi modeli**, rutin
    sohbet veya özetler içinse daha ucuz bir modeli kullanın. Modelleri agent başına yönlendirebilir ve uzun görevleri
    paralelleştirmek için alt agent'lar kullanabilirsiniz (her alt agent token tüketir). Bkz. [Modeller](/tr/concepts/models) ve
    [Alt agent'lar](/tr/tools/subagents).

    Güçlü uyarı: daha zayıf/aşırı kuantize modeller prompt
    injection ve güvensiz davranışa daha açıktır. Bkz. [Güvenlik](/tr/gateway/security).

    Daha fazla bağlam: [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Yapılandırmamı silmeden modelleri nasıl değiştiririm?">
    **Model komutlarını** kullanın veya yalnızca **model** alanlarını düzenleyin. Tam yapılandırma değişimlerinden kaçının.

    Güvenli seçenekler:

    - Sohbette `/model` (hızlı, oturum başına)
    - `openclaw models set ...` (yalnızca model yapılandırmasını günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içinde `agents.defaults.model` düzenleyin

    Tüm yapılandırmayı değiştirmek istemiyorsanız kısmi nesneyle `config.apply` kullanmaktan kaçının.
    RPC düzenlemeleri için önce `config.schema.lookup` ile inceleyin ve `config.patch` tercih edin. Lookup yükü size normalleştirilmiş yol, sığ şema belgeleri/kısıtları ve anlık alt öğe özetlerini verir.
    kısmi güncellemeler için.
    Yapılandırmanın üzerine yazdıysanız yedekten geri yükleyin veya onarmak için `openclaw doctor` yeniden çalıştırın.

    Belgeler: [Modeller](/tr/concepts/models), [Yapılandırma sihirbazı](/cli/configure), [Yapılandırma](/cli/config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Kendi kendine barındırılan modelleri kullanabilir miyim (llama.cpp, vLLM, Ollama)?">
    Evet. Yerel modeller için en kolay yol Ollama'dır.

    En hızlı kurulum:

    1. Ollama'yı `https://ollama.com/download` adresinden yükleyin
    2. `ollama pull gemma4` gibi yerel bir model çekin
    3. Bulut modelleri de istiyorsanız `ollama signin` çalıştırın
    4. `openclaw onboard` çalıştırın ve `Ollama` seçin
    5. `Local` veya `Cloud + Local` seçin

    Notlar:

    - `Cloud + Local`, bulut modellerini artı yerel Ollama modellerinizi verir
    - `kimi-k2.5:cloud` gibi bulut modelleri için yerel çekme gerekmez
    - Elle geçiş için `openclaw models list` ve `openclaw models set ollama/<model>` kullanın

    Güvenlik notu: daha küçük veya yoğun biçimde kuantize modeller prompt
    injection'a daha açıktır. Araç kullanabilen herhangi bir bot için **büyük modelleri**
    kuvvetle öneriyoruz.
    Yine de küçük modeller istiyorsanız sandboxing ve sıkı araç izin listelerini etkinleştirin.

    Belgeler: [Ollama](/tr/providers/ollama), [Yerel modeller](/tr/gateway/local-models),
    [Model sağlayıcıları](/tr/concepts/model-providers), [Güvenlik](/tr/gateway/security),
    [Sandboxing](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd ve Krill modeller için ne kullanıyor?">
    - Bu dağıtımlar farklı olabilir ve zaman içinde değişebilir; sabit bir sağlayıcı önerisi yoktur.
    - Her gateway'deki mevcut çalışma zamanı ayarını `openclaw models status` ile kontrol edin.
    - Güvenliğe duyarlı/araç etkin agent'lar için mevcut en güçlü yeni nesil modeli kullanın.
  </Accordion>

  <Accordion title="Modelleri anında nasıl değiştiririm (yeniden başlatmadan)?">
    Tek başına bir ileti olarak `/model` komutunu kullanın:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Bunlar yerleşik takma adlardır. Özel takma adlar `agents.defaults.models` üzerinden eklenebilir.

    Kullanılabilir modelleri `/model`, `/model list` veya `/model status` ile listeleyebilirsiniz.

    `/model` (ve `/model list`) kompakt, numaralı bir seçici gösterir. Numarayla seçin:

    ```
    /model 3
    ```

    Sağlayıcı için belirli bir auth profilini de zorlayabilirsiniz (oturum başına):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    İpucu: `/model status`, hangi agent'ın etkin olduğunu, hangi `auth-profiles.json` dosyasının kullanıldığını ve sırada hangi auth profilinin deneneceğini gösterir.
    Ayrıca mevcutsa yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) de gösterir.

    **@profile ile ayarladığım sabitlemeyi nasıl kaldırırım?**

    `/model` komutunu `@profile` son eki **olmadan** yeniden çalıştırın:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Varsayılana dönmek istiyorsanız bunu `/model` içinden seçin (veya `/model <default provider/model>` gönderin).
    Hangi auth profilinin etkin olduğunu doğrulamak için `/model status` kullanın.

  </Accordion>

  <Accordion title="Günlük görevler için GPT 5.2 ve kodlama için Codex 5.3 kullanabilir miyim?">
    Evet. Birini varsayılan olarak ayarlayın ve gerektiğinde değiştirin:

    - **Hızlı geçiş (oturum başına):** günlük görevler için `/model gpt-5.4`, Codex OAuth ile kodlama için `/model openai-codex/gpt-5.4`.
    - **Varsayılan + geçiş:** `agents.defaults.model.primary` değerini `openai/gpt-5.4` yapın, sonra kodlama yaparken `openai-codex/gpt-5.4` modeline geçin (veya tam tersi).
    - **Alt agent'lar:** kodlama görevlerini farklı varsayılan modele sahip alt agent'lara yönlendirin.

    Bkz. [Modeller](/tr/concepts/models) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="GPT 5.4 için fast mode'u nasıl yapılandırırım?">
    Bir oturum geçişi veya yapılandırma varsayılanı kullanın:

    - **Oturum başına:** oturum `openai/gpt-5.4` veya `openai-codex/gpt-5.4` kullanırken `/fast on` gönderin.
    - **Model başına varsayılan:** `agents.defaults.models["openai/gpt-5.4"].params.fastMode` değerini `true` yapın.
    - **Codex OAuth için de:** `openai-codex/gpt-5.4` kullanıyorsanız aynı bayrağı orada da ayarlayın.

    Örnek:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI için fast mode, desteklenen yerel Responses isteklerinde `service_tier = "priority"` değerine karşılık gelir. Oturum `/fast` geçersiz kılmaları yapılandırma varsayılanlarını geçersiz kılar.

    Bkz. [Thinking ve fast mode](/tr/tools/thinking) ve [OpenAI fast mode](/tr/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Neden "Model ... is not allowed" görüyorum ve sonra yanıt gelmiyor?'>
    `agents.defaults.models` ayarlıysa bu, `/model` ve tüm
    oturum geçersiz kılmaları için **izin listesi** olur. Bu listede olmayan bir modeli seçmek şunu döndürür:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Bu hata normal yanıt **yerine** döndürülür. Düzeltme: modeli
    `agents.defaults.models` içine ekleyin, izin listesini kaldırın veya `/model list` içinden bir model seçin.

  </Accordion>

  <Accordion title='Neden "Unknown model: minimax/MiniMax-M2.7" görüyorum?'>
    Bu, **sağlayıcının yapılandırılmadığı** anlamına gelir (MiniMax sağlayıcı yapılandırması veya auth
    profili bulunamadı), dolayısıyla model çözümlenemiyor.

    Düzeltme kontrol listesi:

    1. Güncel bir OpenClaw sürümüne yükseltin (veya kaynak `main` üzerinden çalıştırın), ardından gateway'i yeniden başlatın.
    2. MiniMax'in yapılandırıldığından emin olun (sihirbaz veya JSON) ya da eşleşen sağlayıcının enjekte edilebilmesi için
       ortamda/auth profillerinde MiniMax auth'un
       bulunduğundan emin olun
       (`minimax` için `MINIMAX_API_KEY`, `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya saklanan MiniMax
       OAuth).
    3. Auth yolunuza göre tam model kimliğini (büyük/küçük harfe duyarlı) kullanın:
       API anahtarı kurulumu için `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`,
       OAuth kurulumu için
       `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. Şunu çalıştırın:

       ```bash
       openclaw models list
       ```

       ve listeden seçin (veya sohbette `/model list`).

    Bkz. [MiniMax](/tr/providers/minimax) ve [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="MiniMax'i varsayılan, OpenAI'yi ise karmaşık görevler için kullanabilir miyim?">
    Evet. **MiniMax'i varsayılan** olarak kullanın ve gerektiğinde modelleri **oturum başına**
    değiştirin. Geri dönüşler **hatalar** içindir, "zor görevler" için değil; bu yüzden `/model` veya ayrı bir agent kullanın.

    **Seçenek A: oturum başına geçiş**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Sonra:

    ```
    /model gpt
    ```

    **Seçenek B: ayrı agent'lar**

    - Agent A varsayılanı: MiniMax
    - Agent B varsayılanı: OpenAI
    - Agent'a göre yönlendirin veya geçiş yapmak için `/agent` kullanın

    Belgeler: [Modeller](/tr/concepts/models), [Çoklu Agent Yönlendirmesi](/tr/concepts/multi-agent), [MiniMax](/tr/providers/minimax), [OpenAI](/tr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt yerleşik kısayollar mı?">
    Evet. OpenClaw birkaç varsayılan kısaltma ile gelir (`agents.defaults.models` içinde model mevcut olduğunda uygulanır):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Aynı ada sahip kendi takma adınızı ayarlarsanız sizin değeriniz kazanır.

  </Accordion>

  <Accordion title="Model kısayollarını (takma adları) nasıl tanımlarım/geçersiz kılarım?">
    Takma adlar `agents.defaults.models.<modelId>.alias` içinden gelir. Örnek:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Sonra `/model sonnet` (veya destekleniyorsa `/<alias>`) bu model kimliğine çözülür.

  </Accordion>

  <Accordion title="OpenRouter veya Z.AI gibi diğer sağlayıcılardan modelleri nasıl eklerim?">
    OpenRouter (token başına ödeme; çok sayıda model):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (GLM modelleri):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Bir sağlayıcı/modele başvurur ama gerekli sağlayıcı anahtarı eksikse çalışma zamanında bir auth hatası alırsınız (ör. `No API key found for provider "zai"`).

    **Yeni bir agent ekledikten sonra sağlayıcı için API anahtarı bulunamadı**

    Bu genellikle **yeni agent** için auth deposunun boş olduğu anlamına gelir. Auth, agent başınadır ve
    şurada saklanır:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Düzeltme seçenekleri:

    - `openclaw agents add <id>` çalıştırın ve sihirbaz sırasında auth yapılandırın.
    - Veya `auth-profiles.json` dosyasını ana agent'ın `agentDir` klasöründen yeni agent'ın `agentDir` klasörüne kopyalayın.

    Agent'lar arasında `agentDir` değerini yeniden kullanmayın; auth/oturum çakışmalarına neden olur.

  </Accordion>
</AccordionGroup>

## Model yedeklemesi ve "All models failed"

<AccordionGroup>
  <Accordion title="Yedekleme nasıl çalışır?">
    Yedekleme iki aşamada olur:

    1. Aynı sağlayıcı içinde **Auth profili döndürme**.
    2. `agents.defaults.model.fallbacks` içindeki bir sonraki modele **Model geri dönüşü**.

    Başarısız profillere cooldown uygulanır (üstel geri çekilme), böylece OpenClaw bir sağlayıcı hız sınırına takıldığında veya geçici olarak başarısız olduğunda bile yanıt vermeye devam edebilir.

    Hız sınırı kovası yalnızca düz `429` yanıtlarını içermez. OpenClaw
    ayrıca `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` ve dönemsel
    kullanım penceresi sınırları (`weekly/monthly limit reached`) gibi iletileri de
    yedeklemeye değer hız sınırları olarak değerlendirir.

    Bazı faturalandırma gibi görünen yanıtlar `402` değildir ve bazı HTTP `402`
    yanıtları da bu geçici kovada kalır. Bir sağlayıcı
    `401` veya `403` üzerinde açık faturalandırma metni döndürürse OpenClaw bunu yine de
    faturalandırma yolunda tutabilir, ancak sağlayıcıya özgü metin eşleştiricileri
    bunlara sahip olan sağlayıcı kapsamı içinde kalır (örneğin OpenRouter `Key limit exceeded`). Eğer bir `402`
    iletisi bunun yerine yeniden denenebilir kullanım penceresi veya
    organizasyon/çalışma alanı harcama sınırı gibi görünüyorsa (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw bunu
    uzun süreli faturalandırma devre dışı bırakması olarak değil `rate_limit`
    olarak ele alır.

    Bağlam taşması hataları farklıdır: örneğin
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` veya `ollama error: context length
    exceeded` gibi imzalar model geri dönüşünü ilerletmek yerine
    Compaction/yeniden deneme yolunda kalır.

    Genel sunucu hatası metni kasıtlı olarak "içinde unknown/error geçen her şey"den
    daha dardır. OpenClaw yine de sağlayıcı kapsamlı geçici biçimleri
    örneğin Anthropic yalın `An unknown error occurred`, OpenRouter yalın
    `Provider returned error`, `Unhandled stop reason:
    error` gibi durdurma nedeni hataları, geçici sunucu metni içeren JSON `api_error` yükleri
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ve `ModelNotReadyException` gibi sağlayıcı meşgul hatalarını
    sağlayıcı bağlamı eşleştiğinde yedeklemeye değer timeout/aşırı yük sinyalleri olarak değerlendirir.
    `LLM request failed with an unknown
    error.` gibi genel iç geri dönüş metni temkinli kalır ve tek başına model geri dönüşünü tetiklemez.

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” ne anlama gelir?'>
    Bu, sistemin `anthropic:default` auth profili kimliğini kullanmaya çalıştığı, ancak beklenen auth deposunda bunun için kimlik bilgisi bulamadığı anlamına gelir.

    **Düzeltme kontrol listesi:**

    - **Auth profillerinin nerede bulunduğunu doğrulayın** (yeni ve eski yollar)
      - Güncel: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Eski: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır)
    - **Ortam değişkeninizin Gateway tarafından yüklendiğini doğrulayın**
      - `ANTHROPIC_API_KEY` değerini kabuğunuzda ayarladıysanız ama Gateway'i systemd/launchd ile çalıştırıyorsanız bunu devralmayabilir. Bunu `~/.openclaw/.env` içine koyun veya `env.shellEnv` etkinleştirin.
    - **Doğru agent'ı düzenlediğinizden emin olun**
      - Çoklu agent kurulumları birden fazla `auth-profiles.json` dosyası olduğu anlamına gelir.
    - **Model/auth durumunu mantık kontrolünden geçirin**
      - Yapılandırılmış modelleri ve sağlayıcıların kimliği doğrulanıp doğrulanmadığını görmek için `openclaw models status` kullanın.

    **“No credentials found for profile anthropic” için düzeltme kontrol listesi**

    Bu, çalıştırmanın bir Anthropic auth profiline sabitlendiği, ancak Gateway'in
    bunu auth deposunda bulamadığı anlamına gelir.

    - **Claude CLI kullanın**
      - Gateway ana makinesinde `openclaw models auth login --provider anthropic --method cli --set-default` çalıştırın.
    - **Bunun yerine API anahtarı kullanmak istiyorsanız**
      - **Gateway ana makinesindeki** `~/.openclaw/.env` dosyasına `ANTHROPIC_API_KEY` koyun.
      - Eksik bir profili zorlayan sabitlenmiş sıralamayı temizleyin:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Komutları gateway ana makinesinde çalıştırdığınızı doğrulayın**
      - Uzak modda auth profilleri dizüstü bilgisayarınızda değil, gateway makinesinde bulunur.

  </Accordion>

  <Accordion title="Neden Google Gemini'yi de denedi ve başarısız oldu?">
    Model yapılandırmanız Google Gemini'yi geri dönüş olarak içeriyorsa (veya bir Gemini takma adına geçtiyseniz), OpenClaw model geri dönüşü sırasında bunu dener. Google kimlik bilgilerini yapılandırmadıysanız `No API key found for provider "google"` görürsünüz.

    Düzeltme: ya Google auth sağlayın ya da geri dönüşün oraya yönlenmemesi için `agents.defaults.model.fallbacks` / takma adlar içinden Google modellerini kaldırın/kaçının.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Neden: oturum geçmişi **imzasız thinking blokları** içeriyor (çoğu zaman
    iptal edilmiş/kısmi akıştan). Google Antigravity, thinking blokları için imza ister.

    Düzeltme: OpenClaw artık Google Antigravity Claude için imzasız thinking bloklarını çıkarıyor. Hâlâ görünüyorsa **yeni bir oturum** başlatın veya o agent için `/thinking off` ayarlayın.

  </Accordion>
</AccordionGroup>

## Auth profilleri: nedirler ve nasıl yönetilirler

İlgili: [/concepts/oauth](/tr/concepts/oauth) (OAuth akışları, token depolama, çoklu hesap desenleri)

<AccordionGroup>
  <Accordion title="Auth profili nedir?">
    Auth profili, bir sağlayıcıya bağlı adlandırılmış bir kimlik bilgisi kaydıdır (OAuth veya API anahtarı). Profiller şurada bulunur:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Tipik profil kimlikleri nelerdir?">
    OpenClaw şu tür sağlayıcı önekli kimlikleri kullanır:

    - `anthropic:default` (e-posta kimliği yoksa yaygındır)
    - OAuth kimlikleri için `anthropic:<email>`
    - Sizin seçtiğiniz özel kimlikler (ör. `anthropic:work`)

  </Accordion>

  <Accordion title="Önce hangi auth profilinin deneneceğini kontrol edebilir miyim?">
    Evet. Yapılandırma, profiller için isteğe bağlı meta verileri ve sağlayıcı başına bir sıralamayı (`auth.order.<provider>`) destekler. Bu, gizli verileri saklamaz; kimlikleri sağlayıcı/mod ile eşler ve döndürme sırasını ayarlar.

    OpenClaw, kısa **cooldown** durumundaysa (hız sınırları/zaman aşımı/auth hataları) veya daha uzun bir **disabled** durumundaysa (faturalandırma/yetersiz kredi) bir profili geçici olarak atlayabilir. Bunu incelemek için `openclaw models status --json` çalıştırın ve `auth.unusableProfiles` alanını kontrol edin. Ayarlama: `auth.cooldowns.billingBackoffHours*`.

    Hız sınırı cooldown'ları model kapsamlı olabilir. Bir model için cooldown'da olan bir profil,
    aynı sağlayıcıdaki kardeş bir model için yine kullanılabilir olabilir;
    ancak faturalandırma/devre dışı pencereleri tüm profili yine de engeller.

    Ayrıca CLI üzerinden **agent başına** sıra geçersiz kılması da ayarlayabilirsiniz (o agent'ın `auth-state.json` dosyasında saklanır):

    ```bash
    # Yapılandırılmış varsayılan agent'a ayarlanır (--agent kullanmayın)
    openclaw models auth order get --provider anthropic

    # Döndürmeyi tek profile kilitle (yalnızca bunu dene)
    openclaw models auth order set --provider anthropic anthropic:default

    # Veya açık bir sıra ayarla (sağlayıcı içinde geri dönüş)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Geçersiz kılmayı temizle (config auth.order / round-robin'e geri dön)
    openclaw models auth order clear --provider anthropic
    ```

    Belirli bir agent'ı hedeflemek için:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Gerçekte neyin deneneceğini doğrulamak için şunu kullanın:

    ```bash
    openclaw models status --probe
    ```

    Saklanan bir profil açık sırada yer almıyorsa probe,
    o profili sessizce denemek yerine `excluded_by_auth_order` olarak bildirir.

  </Accordion>

  <Accordion title="OAuth ile API anahtarı arasındaki fark nedir?">
    OpenClaw ikisini de destekler:

    - **OAuth** çoğu zaman abonelik erişiminden yararlanır (uygulanabildiği yerde).
    - **API anahtarları** token başına ödeme faturalandırmasını kullanır.

    Sihirbaz açıkça Anthropic Claude CLI, OpenAI Codex OAuth ve API anahtarlarını destekler.

  </Accordion>
</AccordionGroup>

## Gateway: portlar, "already running" ve uzak mod

<AccordionGroup>
  <Accordion title="Gateway hangi portu kullanır?">
    `gateway.port`, WebSocket + HTTP (Control UI, hook'lar vb.) için tek çoklanmış portu kontrol eder.

    Öncelik:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Neden openclaw gateway status "Runtime: running" ama "Connectivity probe: failed" diyor?'>
    Çünkü "running", **supervisor** görünümüdür (launchd/systemd/schtasks). Bağlantı probu ise CLI'nin gerçekten gateway WebSocket'e bağlanmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (probun gerçekten kullandığı URL)
    - `Listening:` (port üzerinde gerçekte neye bind edildiği)
    - `Last gateway error:` (süreç canlı ama port dinlemiyorken yaygın kök neden)

  </Accordion>

  <Accordion title='Neden openclaw gateway status "Config (cli)" ve "Config (service)" değerlerini farklı gösteriyor?'>
    Siz bir yapılandırma dosyasını düzenlerken hizmet başka birini çalıştırıyor (çoğu zaman bir `--profile` / `OPENCLAW_STATE_DIR` uyuşmazlığı).

    Düzeltme:

    ```bash
    openclaw gateway install --force
    ```

    Bunu, hizmetin kullanmasını istediğiniz aynı `--profile` / ortam altında çalıştırın.

  </Accordion>

  <Accordion title='“another gateway instance is already listening” ne anlama gelir?'>
    OpenClaw, çalışma zamanı kilidini başlangıçta WebSocket dinleyicisine hemen bind ederek zorunlu kılar (varsayılan `ws://127.0.0.1:18789`). `EADDRINUSE` ile bind başarısız olursa başka bir örneğin zaten dinlediğini belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer örneği durdurun, portu boşaltın veya `openclaw gateway --port <port>` ile çalıştırın.

  </Accordion>

  <Accordion title="OpenClaw'ı uzak modda nasıl çalıştırırım (istemci başka yerdeki bir Gateway'e bağlanır)?">
    `gateway.mode: "remote"` ayarlayın ve isteğe bağlı paylaşılan gizli uzak kimlik bilgileriyle birlikte uzak bir WebSocket URL'sine işaret edin:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Notlar:

    - `openclaw gateway` yalnızca `gateway.mode` `local` olduğunda başlar (veya geçersiz kılma bayrağını verirseniz).
    - macOS uygulaması yapılandırma dosyasını izler ve bu değerler değiştiğinde canlı olarak mod değiştirir.
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; tek başlarına yerel gateway auth'u etkinleştirmezler.

  </Accordion>

  <Accordion title='Control UI “unauthorized” diyor (veya sürekli yeniden bağlanıyor). Şimdi ne olacak?'>
    Gateway auth yolunuz ile UI'nin auth yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, token'ı geçerli tarayıcı sekmesi oturumu ve seçilen gateway URL'si için `sessionStorage` içinde tutar; böylece uzun ömürlü localStorage token kalıcılığını geri yüklemeden aynı sekmede yenilemeler çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda güvenilir istemciler, gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış cihaz token'ı ile sınırlı bir yeniden deneme deneyebilir.
    - Bu önbelleğe alınmış token yeniden denemesi artık cihaz token'ı ile saklanan önbelleğe alınmış onaylı kapsamları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranlar ise önbelleğe alınmış kapsamları devralmak yerine istedikleri kapsam kümesini korur.
    - Bu yeniden deneme yolu dışında bağlanma auth önceliği sırasıyla açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token'ı, sonra bootstrap token'dır.
    - Bootstrap token kapsam kontrolleri rol önekli çalışır. Yerleşik bootstrap operatör izin listesi yalnızca operatör isteklerini karşılar; Node veya diğer operatör olmayan roller yine de kendi rol önekleri altındaki kapsamları gerektirir.

    Düzeltme:

    - En hızlısı: `openclaw dashboard` (panel URL'sini yazdırır + kopyalar, açmayı dener; headless ise SSH ipucu gösterir).
    - Henüz token'ınız yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzaksa önce tünel açın: `ssh -N -L 18789:127.0.0.1:18789 user@host`, sonra `http://127.0.0.1:18789/` açın.
    - Paylaşılan gizli mod: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, sonra eşleşen gizliyi Control UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve Tailscale kimlik üstbilgilerini atlayan ham loopback/tailnet URL'sini değil, Serve URL'sini açtığınızdan emin olun.
    - Trusted-proxy modu: aynı ana makinedeki loopback proxy'den veya ham gateway URL'sinden değil, yapılandırılmış loopback dışı kimlik farkındalıklı proxy üzerinden geldiğinizden emin olun.
    - Bir yeniden denemeden sonra uyuşmazlık sürerse eşlenmiş cihaz token'ını döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu döndürme çağrısı reddedildi derse iki şeyi kontrol edin:
      - eşlenmiş cihaz oturumları yalnızca **kendi** cihazlarını döndürebilir; `operator.admin` yoksa başka cihazları döndüremez
      - açık `--scope` değerleri çağıranın mevcut operatör kapsamlarını aşamaz
    - Hâlâ takılı kaldıysanız `openclaw status --all` çalıştırın ve [Sorun Giderme](/tr/gateway/troubleshooting) bölümünü izleyin. Auth ayrıntıları için bkz. [Panel](/web/dashboard).

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ama bind edemiyor ve hiçbir şey dinlemiyor">
    `tailnet` bind, ağ arayüzlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa) bind edilecek bir şey yoktur.

    Düzeltme:

    - O ana makinede Tailscale'i başlatın (böylece 100.x adresi olsun), veya
    - `gateway.bind: "loopback"` / `"lan"` olarak değiştirin.

    Not: `tailnet` açık bir seçimdir. `auto` loopback'i tercih eder; yalnızca tailnet bind istiyorsanız `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı ana makinede birden fazla Gateway çalıştırabilir miyim?">
    Genellikle hayır - tek bir Gateway birden çok mesajlaşma kanalını ve agent'ı çalıştırabilir. Birden çok Gateway'i yalnızca yedeklilik (ör: rescue bot) veya sert yalıtım gerektiğinde kullanın.

    Evet, ama şunları yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (örnek başına yapılandırma)
    - `OPENCLAW_STATE_DIR` (örnek başına durum)
    - `agents.defaults.workspace` (çalışma alanı yalıtımı)
    - `gateway.port` (benzersiz portlar)

    Hızlı kurulum (önerilen):

    - Örnek başına `openclaw --profile <name> ...` kullanın (`~/.openclaw-<name>` otomatik oluşturulur).
    - Her profil yapılandırmasında benzersiz bir `gateway.port` ayarlayın (veya elle çalıştırmalarda `--port` geçin).
    - Profil başına hizmet kurun: `openclaw --profile <name> gateway install`.

    Profiller ayrıca hizmet adlarına sonek ekler (`ai.openclaw.<profile>`; eski `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam kılavuz: [Birden fazla gateway](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='“invalid handshake” / code 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve aldığı ilk iletinin
    bir `connect` çerçevesi olmasını bekler. Başka bir şey alırsa bağlantıyı
    **code 1008** ile kapatır (ilke ihlali).

    Yaygın nedenler:

    - Tarayıcıda **HTTP** URL'sini açtınız (`http://...`), WS istemcisi değil.
    - Yanlış portu veya yolu kullandınız.
    - Bir proxy veya tünel auth üstbilgilerini çıkardı ya da Gateway dışı bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
    2. WS portunu normal tarayıcı sekmesinde açmayın.
    3. Auth açıksa token/parolayı `connect` çerçevesine ekleyin.

    CLI veya TUI kullanıyorsanız URL şöyle görünmelidir:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokol ayrıntıları: [Gateway protokolü](/tr/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Günlükleme ve hata ayıklama

<AccordionGroup>
  <Accordion title="Günlükler nerede?">
    Dosya günlükleri (yapılandırılmış):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file` ile sabit bir yol ayarlayabilirsiniz. Dosya günlük seviyesi `logging.level` ile kontrol edilir. Konsol ayrıntı düzeyi `--verbose` ve `logging.consoleLevel` ile kontrol edilir.

    En hızlı günlük takibi:

    ```bash
    openclaw logs --follow
    ```

    Hizmet/supervisor günlükleri (gateway launchd/systemd ile çalışıyorsa):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` ve `gateway.err.log` (varsayılan: `~/.openclaw/logs/...`; profiller `~/.openclaw-<profile>/logs/...` kullanır)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Daha fazlası için [Sorun Giderme](/tr/gateway/troubleshooting) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway hizmetini nasıl başlatırım/durdururum/yeniden başlatırım?">
    Gateway yardımcılarını kullanın:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway'i elle çalıştırıyorsanız `openclaw gateway --force` portu geri alabilir. Bkz. [Gateway](/tr/gateway).

  </Accordion>

  <Accordion title="Windows'ta terminalimi kapattım - OpenClaw'ı nasıl yeniden başlatırım?">
    **İki Windows kurulum modu** vardır:

    **1) WSL2 (önerilir):** Gateway Linux içinde çalışır.

    PowerShell'i açın, WSL'ye girin, sonra yeniden başlatın:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Hizmeti hiç kurmadıysanız onu foreground'da başlatın:

    ```bash
    openclaw gateway run
    ```

    **2) Yerel Windows (önerilmez):** Gateway doğrudan Windows'ta çalışır.

    PowerShell'i açın ve şunu çalıştırın:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Elle çalıştırıyorsanız (hizmet yok) şunu kullanın:

    ```powershell
    openclaw gateway run
    ```

    Belgeler: [Windows (WSL2)](/tr/platforms/windows), [Gateway hizmet runbook'u](/tr/gateway).

  </Accordion>

  <Accordion title="Gateway açık ama yanıtlar hiç gelmiyor. Neyi kontrol etmeliyim?">
    Hızlı bir sağlık taramasıyla başlayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Yaygın nedenler:

    - Model auth **gateway ana makinesinde** yüklenmemiş ( `models status` ile kontrol edin).
    - Kanal eşleme/izin listesi yanıtları engelliyor (kanal yapılandırması + günlükleri kontrol edin).
    - WebChat/Panel doğru token olmadan açık.

    Uzaktaysanız tünel/Tailscale bağlantısının açık olduğunu ve
    Gateway WebSocket'in erişilebilir olduğunu doğrulayın.

    Belgeler: [Kanallar](/tr/channels), [Sorun Giderme](/tr/gateway/troubleshooting), [Uzak erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Gateway bağlantısı kesildi: neden yok" - şimdi ne olacak?'>
    Bu genellikle UI'nin WebSocket bağlantısını kaybettiği anlamına gelir. Şunları kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI doğru token'a sahip mi? `openclaw dashboard`
    4. Uzaktaysa tünel/Tailscale bağlantısı açık mı?

    Sonra günlükleri izleyin:

    ```bash
    openclaw logs --follow
    ```

    Belgeler: [Panel](/web/dashboard), [Uzak erişim](/tr/gateway/remote), [Sorun Giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands başarısız oluyor. Neyi kontrol etmeliyim?">
    Günlükler ve kanal durumuyla başlayın:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Sonra hatayı eşleştirin:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla giriş var. OpenClaw zaten Telegram sınırına göre kırpar ve daha az komutla yeniden dener, ancak bazı menü girdilerinin yine de kaldırılması gerekir. Plugin/Skill/özel komutları azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` değerini devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: bir VPS üzerindeyseniz veya proxy arkasındaysanız giden HTTPS'nin izinli olduğunu ve `api.telegram.org` için DNS'nin çalıştığını doğrulayın.

    Gateway uzaktaysa günlükleri Gateway ana makinesinde incelediğinizden emin olun.

    Belgeler: [Telegram](/tr/channels/telegram), [Kanal sorun giderme](/tr/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI çıktı göstermiyor. Neyi kontrol etmeliyim?">
    Önce Gateway'in erişilebilir olduğunu ve agent'ın çalışabildiğini doğrulayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI içinde mevcut durumu görmek için `/status` kullanın. Yanıtları bir sohbet
    kanalında bekliyorsanız teslimin etkin olduğundan emin olun (`/deliver on`).

    Belgeler: [TUI](/web/tui), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen durdurup sonra nasıl başlatırım?">
    Hizmeti kurduysanız:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Bu, **denetlenen hizmeti** durdurur/başlatır (macOS'ta launchd, Linux'ta systemd).
    Bunu, Gateway arka planda bir arka plan hizmeti olarak çalışıyorsa kullanın.

    Eğer foreground'da çalıştırıyorsanız Ctrl-C ile durdurun, ardından:

    ```bash
    openclaw gateway run
    ```

    Belgeler: [Gateway hizmet runbook'u](/tr/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart ile openclaw gateway arasındaki fark">
    - `openclaw gateway restart`: **arka plan hizmetini** yeniden başlatır (launchd/systemd).
    - `openclaw gateway`: gateway'i bu terminal oturumu için **foreground'da** çalıştırır.

    Hizmeti kurduysanız gateway komutlarını kullanın. Tek seferlik, foreground bir çalıştırma
    istediğinizde `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha fazla konsol ayrıntısı almak için Gateway'i `--verbose` ile başlatın. Sonra kanal auth, model yönlendirme ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Skill'im bir image/PDF üretti ama hiçbir şey gönderilmedi">
    Agent'tan çıkan ekler bir `MEDIA:<path-or-url>` satırı içermelidir (ayrı bir satırda). Bkz. [OpenClaw assistant setup](/tr/start/openclaw) ve [Agent send](/tr/tools/agent-send).

    CLI ile gönderim:

    ```bash
    openclaw message send --target +15555550123 --message "Buyurun" --media /path/to/file.png
    ```

    Şunları da kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve izin listeleri tarafından engellenmiyor.
    - Dosya sağlayıcının boyut sınırları içinde (image'lar en fazla 2048px'e yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini çalışma alanı, temp/media-store ve sandbox tarafından doğrulanmış dosyalarla sınırlar.
    - `tools.fs.workspaceOnly=false`, agent'ın zaten okuyabildiği ana makine yerel dosyalarının `MEDIA:` ile gönderilmesine izin verir; ancak yalnızca medya ve güvenli belge türleri için (image, ses, video, PDF ve Office belgeleri). Düz metin ve gizli benzeri dosyalar yine de engellenir.

    Bkz. [Images](/tr/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="OpenClaw'ı gelen DM'lere açmak güvenli mi?">
    Gelen DM'leri güvenilmeyen girdi olarak değerlendirin. Varsayılanlar riski azaltacak şekilde tasarlanmıştır:

    - DM yapabilen kanallardaki varsayılan davranış **eşleme**dir:
      - Bilinmeyen gönderenler bir eşleme kodu alır; bot iletilerini işlemez.
      - Onaylamak için: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` ile kontrol edin.
    - DM'leri herkese açık açmak açık katılım gerektirir (`dmPolicy: "open"` ve izin listesi `"*"`).

    Riskli DM politikalarını ortaya çıkarmak için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Prompt injection yalnızca herkese açık botlar için mi bir endişe?">
    Hayır. Prompt injection, sadece bota kimin DM atabildiğiyle değil, **güvenilmeyen içerikle** ilgilidir.
    Asistanınız dış içerik okuyorsa (web search/fetch, tarayıcı sayfaları, e-postalar,
    belgeler, ekler, yapıştırılmış günlükler), bu içerik modele el koymaya çalışan
    talimatlar içerebilir. Bu, **tek gönderen siz olsanız bile** olabilir.

    En büyük risk araçlar etkin olduğunda ortaya çıkar: model,
    bağlamı dışarı sızdırmaya veya sizin adınıza araç çağırmaya kandırılabilir. Etki alanını şu yollarla azaltın:

    - güvenilmeyen içeriği özetlemek için salt okunur veya araçları devre dışı bir "reader" agent kullanmak
    - araç etkin agent'larda `web_search` / `web_fetch` / `browser` kapalı tutmak
    - çözümlenmiş dosya/belge metnini de güvenilmeyen kabul etmek: OpenResponses
      `input_file` ve medya eki çıkarımı, çıkarılan metni ham dosya metni olarak
      geçirmek yerine açık harici içerik sınır işaretleyicileri içine sarar
    - sandboxing ve sıkı araç izin listeleri

    Ayrıntılar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Botumun kendi e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Evet, çoğu kurulum için. Botu ayrı hesaplar ve telefon numaralarıyla yalıtmak,
    bir şeyler ters giderse etki alanını azaltır. Ayrıca bu, kişisel hesaplarınızı etkilemeden
    kimlik bilgilerini döndürmeyi veya erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyacınız olan araçlara ve hesaplara erişim verin, gerekirse
    daha sonra genişletin.

    Belgeler: [Güvenlik](/tr/gateway/security), [Eşleme](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Mesajlarım üzerinde otonomi verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam otonomi **önermiyoruz**. En güvenli desen şudur:

    - DM'leri **eşleme modu**nda veya sıkı bir izin listesinde tutun.
    - Sizin adınıza mesaj atmasını istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak hazırlamasına izin verin, sonra **göndermeden önce onaylayın**.

    Denemek istiyorsanız bunu özel bir hesapta yapın ve yalıtılmış tutun. Bkz.
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Kişisel asistan görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, **eğer** agent yalnızca sohbet içindir ve girdi güvenilirse. Daha küçük katmanlar
    talimat ele geçirmeye daha yatkındır, bu nedenle araç etkin agent'larda
    veya güvenilmeyen içerik okunurken bunlardan kaçının. Daha küçük bir model kullanmanız gerekiyorsa
    araçları kilitleyin ve sandbox içinde çalıştırın. Bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ama eşleme kodu almadım">
    Eşleme kodları yalnızca bilinmeyen bir gönderen bota mesaj attığında ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod üretmez.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Anında erişim istiyorsanız gönderen kimliğinizi izin listesine ekleyin veya bu hesap için `dmPolicy: "open"`
    ayarlayın.

  </Accordion>

  <Accordion title="WhatsApp: kişilerime mesaj atar mı? Eşleme nasıl çalışır?">
    Hayır. Varsayılan WhatsApp DM politikası **eşleme**dir. Bilinmeyen gönderenler yalnızca bir eşleme kodu alır ve iletileri **işlenmez**. OpenClaw yalnızca aldığı sohbetlere veya sizin tetiklediğiniz açık gönderimlere yanıt verir.

    Eşlemeyi şu şekilde onaylayın:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Bekleyen istekleri listeleyin:

    ```bash
    openclaw pairing list whatsapp
    ```

    Sihirbaz telefon numarası istemi: bu, kendi DM'lerinize izin verilsin diye **izin listenizi/sahibinizi** ayarlamak için kullanılır. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranız üzerinde çalıştırıyorsanız o numarayı kullanın ve `channels.whatsapp.selfChatMode` etkinleştirin.

  </Accordion>
</AccordionGroup>

## Sohbet komutları, görevleri iptal etme ve "durmuyor"

<AccordionGroup>
  <Accordion title="Dahili sistem iletilerinin sohbette görünmesini nasıl durdururum?">
    Dahili veya araç iletilerinin çoğu yalnızca o oturum için **verbose**, **trace** veya **reasoning**
    etkin olduğunda görünür.

    Bunu gördüğünüz sohbette düzeltin:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Hâlâ gürültülüyse Control UI içindeki oturum ayarlarını kontrol edin ve verbose'u
    **inherit** olarak ayarlayın. Ayrıca yapılandırmada `verboseDefault` değeri
    `on` olan bir bot profili kullanmadığınızı doğrulayın.

    Belgeler: [Thinking ve verbose](/tr/tools/thinking), [Güvenlik](/tr/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdururum/iptal ederim?">
    Bunlardan herhangi birini **tek başına bir ileti** olarak gönderin (slash yok):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Bunlar iptal tetikleyicileridir (slash komutları değil).

    Arka plan süreçleri için (exec aracından), agent'tan şunu çalıştırmasını isteyebilirsiniz:

    ```
    process action:kill sessionId:XXX
    ```

    Slash komutları genel görünümü: bkz. [Slash komutları](/tr/tools/slash-commands).

    Çoğu komut `/` ile başlayan **tek başına** bir ileti olarak gönderilmelidir, ancak birkaç kısayol (`/status` gibi) izin listesindeki gönderenler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='Discord'a Telegram'dan nasıl mesaj gönderirim? ("Cross-context messaging denied")'>
    OpenClaw varsayılan olarak **sağlayıcılar arası** mesajlaşmayı engeller. Bir araç çağrısı
    Telegram'a bağlıysa, siz açıkça izin vermedikçe Discord'a göndermez.

    Agent için sağlayıcılar arası mesajlaşmayı etkinleştirin:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Yapılandırmayı düzenledikten sonra gateway'i yeniden başlatın.

  </Accordion>

  <Accordion title='Bot hızlı arka arkaya gelen mesajları neden "yok sayıyor" gibi hissettiriyor?'>
    Kuyruk modu, yeni iletilerin sürmekte olan bir çalıştırmayla nasıl etkileşeceğini kontrol eder. Modları değiştirmek için `/queue` kullanın:

    - `steer` - yeni iletiler mevcut görevi yeniden yönlendirir
    - `followup` - iletiler birer birer çalışır
    - `collect` - iletileri toplar ve bir kez yanıt verir (varsayılan)
    - `steer-backlog` - şimdi yönlendirir, sonra birikmiş işleri işler
    - `interrupt` - mevcut çalıştırmayı iptal eder ve yeniden başlar

    Followup modları için `debounce:2s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz.

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='Anthropic için API anahtarıyla varsayılan model nedir?'>
    OpenClaw'da kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarlamak (veya auth profillerinde bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız modeldir (örneğin `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görüyorsanız, bu, Gateway'in çalışan agent için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ takıldınız mı? [Discord](https://discord.com/invite/clawd) üzerinden sorun veya bir [GitHub discussion](https://github.com/openclaw/openclaw/discussions) açın.
