'use strict';
window.GUIDE = {
  "id": "paper-05",
  "title": "Kintsugi",
  "fullTitle": "Kintsugi: Secure Hotpatching for Code-Shadowing Real-Time Embedded Systems",
  "subtitle": "RAM’den çalışan gerçek zamanlı firmware’i durdurmadan, yama mekanizmasını da saldırgana açmadan güncellemek.",
  "authors": "Philipp Mackensen · Christian Niesler · Roberto Blanco · Lucas Davi · Veelasha Moonsamy",
  "venue": "USENIX Security 2025",
  "minutes": 45,
  "pdf": "../papers/05-kintsugi-secure-hotpatching-for-code-shadowing-real-time-embedded-systems.pdf",
  "overview": {
    "name": "Kintsugi",
    "thesis": "Gerçek zamanlı bir cihazın RAM’deki koduna yapılan küçük yamayı hem atomik hem de kurcalamaya dayanıklı biçimde uygulamak.",
    "problem": "Bir denetleyiciyi yeniden başlatmak devam eden işi kesebilir. Hotpatching, çalışan kodun küçük bir bölümünü değiştirerek güvenlik açığını gidermeyi hedefler. Ancak RTOS görevleri birbirini kesebildiği için yarısı yazılmış bir yamayı başka bir görev çalıştırabilir.",
    "gap": "Flash’tan yürütmeye odaklanan çözümler RAM’den kod çalıştıran code-shadowing cihazlarını yeterince kapsamaz. Ayrıca güvenli iletilmiş bir yama, cihaz içinde paylaşılan bellekte beklerken veya uygulandıktan sonra değiştirilirse iletim güvenliği yeterli kalmaz.",
    "solution": "Kintsugi işi üç bileşene böler: düşük öncelikli Manager yamayı özel karantinaya alıp doğrular; Applicator kısa uygulama işlemini mevcut context-switch kritik bölgesinde yapar; Guard görev geçişlerinde MPU izinlerini değiştirerek yama kaynaklarını korur.",
    "example": "Bir ağ görevi ele geçirilmiş olsun. Yama giriş tamponunda beklerken bu görev içeriği değiştirebilir. Manager özel karantinaya kopyaladıktan sonra bütünlüğü tekrar doğrular. Geçerli yama korunmuş alana taşınır; yalnız Applicator firmware’deki hedef noktayı değiştirebilir.",
    "contribution": "Katkı yalnız bir branch eklemek değildir. Doğrulama, zamanlama, atomik uygulama ve kalıcı çalışma zamanı bütünlüğünü code-shadowing RTOS için ortak bir bellek ve geçiş tasarımında toplar.",
    "takeaway": "Yamanın güvenliği, indirme bittiğinde sona ermez; uygulamadan önce, uygularken ve sonra korunmalıdır.",
    "limit": "Kernel, MPU yönetimi ve doğrulama bileşenleri güvenilir kabul edilir. Yama kodunun işlevsel doğruluğu kanıtlanmaz. Ölçülen kısa context-switch maliyeti bütün yama hazırlığının süresi değildir.",
    "route": [
      "Açık: RAM’de yama ve preemption yarışı",
      "Fikir: karantina + kontrollü atomik yazma",
      "Sonuç: bütün yama yaşam döngüsünde koruma"
    ],
    "page": 2
  },
  "sections": [
    {
      "id": "problem",
      "title": "1. Yeniden başlatmak neden her zaman seçenek değil?",
      "kicker": "TEMEL FİKİR",
      "page": 2,
      "lead": "Gerçek zamanlı işlerde önemli olan yalnız sonuç değil, sonucun zamanında üretilmesidir.",
      "html": "<div class=\"two-col\"><div class=\"card\"><h3>Hotpatching ihtiyacı</h3><p>Sensör, iletişim veya denetim görevi sürerken küçük bir güvenlik açığını düzeltmek isteyebilirsin. Hotpatch çalışan kodun belirli noktasını değiştirir veya yeni bir fonksiyona yönlendirir; bütün firmware’i yeniden başlatmayı gerektirmeyebilir.</p></div><div class=\"card\"><h3>Code shadowing</h3><p>Firmware kalıcı depodan RAM’e yüklenip oradan yürütülür. RAM’deki kodu değiştirmek teknik olarak kolaylaşır; fakat saldırganın da aynı kodu veya yama metadata’sını bozmasını önleyecek koruma gerekir.</p></div></div><div class=\"callout\">Kintsugi’nin hedefi bütün güncelleme sistemlerini değiştirmek değil; RAM’den çalışan, MPU ve preemptive RTOS kullanan cihazlarda güvenli hotpatch uygulamasıdır.</div>"
    },
    {
      "id": "threat",
      "title": "2. Saldırgan hangi yetkiye sahip?",
      "kicker": "TEHDİT MODELİ",
      "page": 4,
      "lead": "Ele geçirilmiş ayrıcalıksız görev vardır; güvenilen kernel ve MPU yönetimi korunur.",
      "html": "<p>Uzaktaki saldırgan bir firmware açığından yararlanarak ayrıcalıksız görevi kontrol eder. Amacı bekleyen yamayı, uygulama hedefini veya uygulanmış yamayı bozarak açıkları geri getirmektir. Fiziksel erişim ve geçerli yeni yama üretme kimlik bilgileri bu modelde saldırganda değildir.</p><div class=\"lab\"><div class=\"lab-header\"><h3>İddianın sınırını seç</h3><p>Öğretici model; donanım emülasyonu veya ölçüm değildir.</p></div><div class=\"lab-body\"><label for=\"kin-threat\">Olay</label><select id=\"kin-threat\"><option value=\"task\">Ayrıcalıksız görev yama belleğini bozmak istiyor</option><option value=\"kernel\">Saldırgan MPU’yu yöneten kernel’i kontrol ediyor</option><option value=\"patch\">Yetkili geliştirici mantıksal olarak hatalı yama imzalıyor</option></select><div class=\"state-box\" id=\"kin-threat-out\" aria-live=\"polite\"></div></div></div><div class=\"callout\">İmzanın geçerli olması yamanın güvenli, doğru veya bütün gerçek zaman koşullarını karşılayan bir düzeltme olduğunu kanıtlamaz.</div>"
    },
    {
      "id": "race",
      "title": "3. Düşük öncelikli görevde yazmak neden yetmez?",
      "kicker": "ATOMİKLİK",
      "page": 4,
      "lead": "Yama hazırlanırken kesilebilmek yararlıdır; yarım uygulanmış kodu görünür kılmak tehlikelidir.",
      "html": "<p>Naif bir runtime kodu parça parça değiştirirken yüksek öncelikli görev araya girebilir. Bu görev hedef fonksiyona girerse eski ve yeni baytların karışımını çalıştırır. Bütün yama işlemi boyunca kesmeleri kapatmak ise uzun ve öngörülemeyen gecikme üretir.</p><div class=\"lab\"><div class=\"lab-header\"><h3>Aynı yamaya iki uygulama yaklaşımı</h3><p>Öğretici model; donanım emülasyonu veya ölçüm değildir.</p></div><div class=\"lab-body\"><label for=\"kin-race\">Uygulama yolu</label><select id=\"kin-race\"><option value=\"naive\">Yama yazmasının ortasında görev değişiyor</option><option value=\"atomic\">Hazırlık dışarıda, kısa uygulama context switch içinde</option></select><div class=\"state-box\" id=\"kin-race-out\" aria-live=\"polite\"></div></div></div><p>Tasarımın ana hamlesi büyük kopyalama ve doğrulama işini küçük, sabit uygulama adımından ayırmaktır. Atomiklik sıfır zaman harcamak değildir; başka görevin kısmi durumu gözlemleyememesidir.</p>"
    },
    {
      "id": "architecture",
      "title": "4. Üç bileşen, üç farklı sorumluluk",
      "kicker": "MİMARİ",
      "page": 6,
      "lead": "Manager hazırlar, Applicator uygular, Guard izinleri düzenler.",
      "html": "<div class=\"table-wrap\"><table><thead><tr><th>Bileşen</th><th>Çalışma yeri</th><th>Görev</th></tr></thead><tbody><tr><td>Manager</td><td>Düşük öncelikli RTOS görevi</td><td>Karantina, doğrulama, saklama ve planlama</td></tr><tr><td>Applicator</td><td>Context-switch kritik bölgesi</td><td>Hazır yamanın kısa ve atomik yazma adımı</td></tr><tr><td>Guard</td><td>Görev geçişi</td><td>MPU üzerinden gerekli yazma izinlerini açma / kapama</td></tr></tbody></table></div><p>Manager’ın önceliğinin düşük olması hazırlığın önemli görevleri bloke etmemesine yardımcı olur. Applicator’ın küçük tutulması atomik bölümün sınırlandırılmasını sağlar. Guard ise Manager kesildiğinde başka görevin geçici izinlerden yararlanmasını önlemek için geçişlerde korumayı yeniden kurar.</p>"
    },
    {
      "id": "quarantine",
      "title": "5. Doğrulamadan önce karantinaya al",
      "kicker": "TOCTOU",
      "page": 6,
      "lead": "Paylaşılan tamponda doğrulanan veri, kullanıldığı ana kadar aynı kalmayabilir.",
      "html": "<p>Time-of-check to time-of-use yarışında saldırgan, Manager kontrol ettikten sonra yama içeriğini değiştirebilir. Kintsugi önce yamayı Manager’ın kontrolündeki yürütülemez karantinaya taşır. Bütünlük ve metadata denetimleri bu özel kopyada yapılır; yalnız başarılı kopya güvenilir yama belleğine aktarılır.</p><div class=\"lab\"><div class=\"lab-header\"><h3>Yamanın yaşam döngüsünü izle</h3><p>Öğretici model; donanım emülasyonu veya ölçüm değildir.</p></div><div class=\"lab-body\"><div id=\"kin-route-nodes\" class=\"stage-nodes\"></div><div class=\"state-box\" id=\"kin-route-out\" aria-live=\"polite\"></div><div class=\"controls\"><button type=\"button\" class=\"small-button\" id=\"kin-route-prev\">← Önceki</button><button type=\"button\" class=\"small-button\" id=\"kin-route-next\">Sonraki →</button><button type=\"button\" class=\"small-button\" id=\"kin-route-reset\">Başa dön</button></div></div></div><div class=\"callout\">Güvenli kanal ilk adımdır. Karantinadaki doğrulama, cihaz içindeki paylaşımlı belleğe taşınmış veriye yeniden güvenmek için gereklidir.</div>"
    },
    {
      "id": "validation",
      "title": "6. Geçerli imza, geçerli hedef ve ayrı metadata",
      "kicker": "YAMA YÖNETİMİ",
      "page": 6,
      "lead": "Kodun geldiği kaynak kadar nereye ve ne kadar yazılacağı da denetlenmelidir.",
      "html": "<div class=\"two-col\"><div class=\"card\"><h3>Verification ve validation</h3><p>Bütünlük ve özgünlük kontrolü yama baytlarını doğrular. Ardından hedef adresin izinli firmware aralığında olması, boyutların uygunluğu ve metadata biçimi kontrol edilir. Makale tek bir zorunlu imza algoritması belirlemez.</p></div><div class=\"card\"><h3>Slots ve code ayrımı</h3><p>Slot’lar durum, kimlik, header ve kod pointer’ı gibi metadata taşır. Yama kodu ayrı bölgede saklanır. Veriyi yürütülemez tutmak ile kodun izinsiz değiştirilmesini önlemek farklı bellek izinleri gerektirir.</p></div></div><p>Güvenilmeyen girişten doğrudan firmware’e yazma yolu yoktur. Uygulama isteği ancak doğrulanmış içerik korunmuş alana taşındıktan ve Manager gerekli context’i hazırladıktan sonra oluşur.</p>"
    },
    {
      "id": "patch-types",
      "title": "7. Yönlendirmek ile yerinde değiştirmek",
      "kicker": "YAMA TÜRLERİ",
      "page": 7,
      "lead": "Büyük yeni kodu atomik anda kopyalamak gerekmez; küçük giriş değişikliği yeterli olabilir.",
      "html": "<div class=\"table-wrap\"><table><thead><tr><th>Tür</th><th>Hedef kodda ne olur?</th><th>Örnek</th></tr></thead><tbody><tr><td>Redirect</td><td>Akış, korunmuş yama koduna yönlendirilir</td><td>Yeni girdi denetimi eklemek</td></tr><tr><td>Replacement</td><td>Belirli komut baytları yerinde değiştirilir</td><td>Bir karşılaştırmanın işaretli / işaretsiz anlamını düzeltmek</td></tr></tbody></table></div><p>Trampoline benzeri yönlendirme eski kodun belirli noktasını yeni koda bağlar. Yeni kod önceden hazırlanıp saklanırken son giriş değişikliği Applicator’a bırakılır. Her fonksiyon ve her durum değişikliği bu şemaya otomatik sığmaz; uygun hedef ve yama üretimi ayrı bir mühendislik işidir.</p>"
    },
    {
      "id": "applicator",
      "title": "8. Mevcut kritik bölgeyi kullanmak",
      "kicker": "ATOMİK UYGULAMA",
      "page": 7,
      "lead": "Context switch zaten bağlamı bölünmez biçimde kaydetmek ve geri yüklemek zorundadır.",
      "html": "<p>Applicator bu mevcut kritik bölüm içinde çalışır. Manager’ın hazırladığı durum, hedef adres ve yazılacak baytlar üzerinden sınırlı işlemi yapar. Guard, firmware yazma yetkisini yalnız bu uygulama için açıp tekrar kapatır. Bu yetki sıradan bir RTOS görevine bırakılmaz.</p><p>Uygulama, sıradaki görev Manager olduğunda ve yama planlanmışsa yapılır. Böylece maliyet rastgele her görev geçişine eşit biçimde eklenmez. Ancak bu koşul, sistem yükünden bağımsız bir “yama şu anda kesin uygulanır” süresi sağlamaz; Manager’ın çalışabilmesi zamanlamaya bağlıdır.</p><div class=\"callout\">Bütün yamanın doğrulanması ve taşınması kritik bölgeye alınmaz. Deneydeki birkaç mikrosaniye, bütün uçtan uca işlemin süresi değildir.</div>"
    },
    {
      "id": "guard",
      "title": "9. Görev değişince izinleri de değiştir",
      "kicker": "BELLEK POLİTİKASI",
      "page": 8,
      "lead": "Yetki ihtiyaç anında açılmalı, başka görev koşarken geri alınmalıdır.",
      "html": "<div class=\"lab\"><div class=\"lab-header\"><h3>Hangi bileşen neyi yazabilir?</h3><p>Öğretici model; donanım emülasyonu veya ölçüm değildir.</p></div><div class=\"lab-body\"><label for=\"kin-actor\">Çalışan bileşen</label><select id=\"kin-actor\"><option value=\"default\">Sıradan görev / varsayılan durum</option><option value=\"manager\">Manager</option><option value=\"applicator\">Applicator</option></select><div class=\"state-box\" id=\"kin-policy-out\" aria-live=\"polite\"></div></div></div><div class=\"table-wrap\"><table><thead><tr><th>Bileşen</th><th>Firmware</th><th>Context / slots</th><th>Yama kodu</th></tr></thead><tbody><tr><td>Varsayılan</td><td>Salt okunur</td><td>Salt okunur</td><td>Salt okunur</td></tr><tr><td>Manager</td><td>Salt okunur</td><td>Okunur / yazılır</td><td>Okunur / yazılır</td></tr><tr><td>Applicator</td><td>Okunur / yazılır</td><td>Context yazılır; slots salt okunur</td><td>Salt okunur</td></tr></tbody></table></div><p>Bu tablo yazma yetkisinin özetidir. Makalenin Tablo 1’i ayrıca firmware ve kod bölgelerinin yürütme niteliğini, context / slots / karantinanın XN durumunu belirtir. Bu özeti bütün bölgeler için evrensel W⊕X kanıtı gibi okumamak gerekir.</p>"
    },
    {
      "id": "performance",
      "title": "10. 38 ve 216 cycle hangi işi ölçüyor?",
      "kicker": "DENEYLER",
      "page": 10,
      "lead": "Düşük sürekli maliyet ile seyrek uygulama maliyetini ayrı değerlendir.",
      "html": "<div class=\"table-wrap\"><table><thead><tr><th>Context-switch durumu</th><th>Cycle</th><th>64 MHz yaklaşık süre</th></tr></thead><tbody><tr><td>Önceki ve sonraki görev Manager değil</td><td>38</td><td>0,59 µs</td></tr><tr><td>Önceki görev Manager</td><td>127</td><td>1,98 µs</td></tr><tr><td>Sonraki görev Manager, yama yok</td><td>133</td><td>2,08 µs</td></tr><tr><td>Sonraki görev Manager, yama var</td><td>216</td><td>3,38 µs</td></tr></tbody></table></div><p>Ölçümler nRF52840-DK / Cortex-M4 üzerinde yapılır. Makale tek yamanın bütün iş akışı için yaklaşık 0,9 ms bildirir; 64 ardışık yamada yaklaşık 61,75 ms ölçer. Hazırlık ve context-switch adımının süreleri farklıdır. Yeni donanımda veya başka RTOS’ta kendi zaman bütçene göre yeniden ölçüm gerekir.</p>"
    },
    {
      "id": "evidence",
      "title": "11. Gerçek açıklar ve biçimsel analizin sınırı",
      "kicker": "KANIT",
      "page": 11,
      "lead": "Bir yamayı güvenli taşımak ile yamanın bütün etkilerini kanıtlamak aynı değerlendirme değildir.",
      "html": "<p>Çalışma, Zephyr, FreeRTOS, mbedTLS ve picoTCP ile ilişkili 10 CVE için yamalar geliştirip saldırıyı giderdiğini gösterir. Bu deneyler seçilen açıkların uygulanabilirliğini sınar; bütün firmware sürümleri veya bütün hatalar için destek listesi değildir.</p><p>Biçimsel güvenlik analizi doğrulama / validation, uygulama sırasında kurcalamaya dayanıklılık ve uygulama sonrası bütünlük hedeflerini ele alır. Kernel’in yeterli izolasyon sağladığı ve doğrulama fonksiyonlarının doğru olduğu varsayılır. Gerçek zaman bütünlüğü hedefi, kernel doğruluğuna dayandığından bu güvenlik ispatının kapsamına alınmaz.</p><div class=\"callout\">Ölçülmüş düşük maliyet, tüm görevlerin deadline’larını otomatik olarak kanıtlamaz. Tam schedulability değerlendirmesi görev setine ve sistem koşullarına bağlıdır.</div>"
    },
    {
      "id": "synthesis",
      "title": "12. Güven zincirini dört soruyla oku",
      "kicker": "BÜYÜK RESİM",
      "page": 12,
      "lead": "Yamanın her aşamasında kimin hangi baytlara yazabildiğini sor.",
      "html": "<div class=\"two-col\"><div class=\"card\"><h3>Yaşam döngüsü kontrolü</h3><p>Giriş tamponunu kim değiştirebilir? Doğrulanan kopya nerede korunur? Firmware’i yazan tek yol hangisidir? Uygulanmış kodu ve metadata’yı kim bozabilir? Bu dört soru tasarımın güven sınırlarını ortaya çıkarır.</p></div><div class=\"card\"><h3>Kendi sistemine aktarım</h3><p>RAM’den kod yürütme, görev öncelikleri, MPU bölge sayısı / hizalaması ve context-switch entegrasyonu önkoşullardır. Yama slot sayısı ve en büyük kod boyutu da RAM maliyetini belirler.</p></div></div><p>Kintsugi çalışma zamanı kod güncellemesinin güvenli uygulanmasını hedefler. Mon CHÉRI’nin veri başlatılma politikasından ve PEARTS’in uzaktan doğrulanabilir yürütme kanıtından farklı bir soruya cevap verir. Ortak ders, mekanizmayı değerlendirirken güvenilen bileşenleri ve her aşamadaki yetkileri açık tutmaktır.</p>"
    }
  ],
  "quiz": [
    {
      "q": "Code shadowing bu çalışmada ne demektir?",
      "options": [
        "Firmware’in RAM’e yüklenip oradan yürütülmesi",
        "Bütün kodun şifrelenmesi",
        "Her fonksiyonun iki kez çalıştırılması"
      ],
      "correct": 0,
      "why": "Kintsugi, yürütülen firmware kodunun RAM’de olduğu cihazları hedefler."
    },
    {
      "q": "Paylaşılan tamponda imza kontrolü neden tek başına yeterli değildir?",
      "options": [
        "İmzalar hiçbir zaman işe yaramaz.",
        "Doğrulama ile kullanım arasında veri değişebilir.",
        "RAM’de veri saklanamaz."
      ],
      "correct": 1,
      "why": "TOCTOU yarışını kapatmak için özel karantina kopyası üzerinde doğrulama yapılır."
    },
    {
      "q": "Applicator nerede çalışır?",
      "options": [
        "Ağ görevinin normal akışında",
        "Bütün Manager hazırlığı boyunca",
        "Context-switch kritik bölgesi içinde"
      ],
      "correct": 2,
      "why": "Uzun hazırlık dışarıda yapılır; kısa uygulama adımı mevcut atomik geçiş bölümüne alınır."
    },
    {
      "q": "Manager kesildiğinde geçici yazma izinlerini kim yönetir?",
      "options": [
        "Guard",
        "Saldırgan görev",
        "Yama sunucusu"
      ],
      "correct": 0,
      "why": "Guard görev geçişlerinde MPU izinlerini o anki bileşene göre düzenler."
    },
    {
      "q": "216 cycle ölçümü neyi anlatır?",
      "options": [
        "Bütün internet indirmesinin süresini",
        "Yama bulunan belirli context-switch yolunun maliyetini",
        "Her firmware için en kötü deadline’ı"
      ],
      "correct": 1,
      "why": "Ölçüm, sıradaki görev Manager ve yama planlı olduğunda Guard + Applicator yoluna aittir."
    },
    {
      "q": "Saldırgan kernel’i ve MPU yapılandırmasını kontrol ederse ne olur?",
      "options": [
        "Aynı güvenlik iddiası değişmeden sürer.",
        "Sistem otomatik yeniden imzalanır.",
        "Çalışmanın güvenilir kernel varsayımı aşılır."
      ],
      "correct": 2,
      "why": "Tehdit modeli ayrıcalıksız görev ele geçirilmesine odaklanır; kernel ve MPU denetimi güven tabanındadır."
    },
    {
      "q": "Geçerli imzalı bir yama için hangisi ayrıca gereklidir?",
      "options": [
        "Yamanın işlevsel doğruluğunun ayrı değerlendirilmesi",
        "Hiç metadata kontrolü yapılmaması",
        "Her göreve firmware yazma yetkisi verilmesi"
      ],
      "correct": 0,
      "why": "Özgünlük ve bütünlük yamanın doğru davranışı ürettiğini ispatlamaz; makale yama üretiminin doğruluğunu kapsam dışında tutar."
    },
    {
      "q": "Biçimsel güvenlik analizinin kapsamı nasıl okunmalıdır?",
      "options": [
        "Bütün deadline’ların ispatı",
        "Kernel ve denetim varsayımları altında belirli yama bütünlüğü özellikleri",
        "Bütün uygulama mantığının doğruluğu"
      ],
      "correct": 1,
      "why": "Gerçek zaman hedefi kernel doğruluğuna bağlıdır; sunulan güvenlik analizi Goal 2–4 için kurcalama ve doğrulama özelliklerini ele alır."
    }
  ],
  "glossary": [
    [
      "Hotpatch",
      "Çalışan yazılımın sınırlı bir bölümüne uygulanan yama."
    ],
    [
      "Code shadowing",
      "Firmware’in RAM’e kopyalanıp oradan yürütülmesi."
    ],
    [
      "RTOS",
      "Görev ve kesme zamanlamasını gerçek zaman gereksinimleriyle yöneten işletim sistemi."
    ],
    [
      "FPPS",
      "Sabit öncelikli, yüksek öncelikli görevin araya girebildiği zamanlama."
    ],
    [
      "Preemption",
      "Çalışan görevin başka bir görev için kesilmesi."
    ],
    [
      "Atomicity",
      "Başka görevin işlemin kısmi durumunu gözlemleyememesi."
    ],
    [
      "Critical section",
      "Kesilme / eşzamanlılık koşullarının denetlendiği kısa yürütme bölgesi."
    ],
    [
      "Context switch",
      "Bir görevin işlemci bağlamını kaydedip diğerininkini yükleme."
    ],
    [
      "Manager",
      "Yamayı karantinaya alıp denetleyen ve uygulamayı planlayan görev."
    ],
    [
      "Applicator",
      "Hazırlanmış yamayı kısa atomik adımda firmware’e uygulayan bileşen."
    ],
    [
      "Guard",
      "Görev geçişlerinde framework bellek izinlerini düzenleyen bileşen."
    ],
    [
      "Quarantine",
      "Güvenilmeyen yama kopyasının dış müdahaleden korunarak doğrulandığı alan."
    ],
    [
      "TOCTOU",
      "Kontrol edilen içeriğin kullanımından önce değişebildiği yarış."
    ],
    [
      "MPU",
      "Bellek bölgelerine donanım üzerinden izin uygulayan koruma birimi."
    ],
    [
      "XN",
      "Bir bellek alanından komut yürütülmesini engelleyen nitelik."
    ],
    [
      "Hotpatch slot",
      "Yamanın durum ve konum metadata’sının saklandığı kayıt."
    ],
    [
      "Trampoline",
      "Akışı başka kod bölgesine aktaran kısa yönlendirme dizisi."
    ],
    [
      "Redirect patch",
      "Eski akışı yeni yama koduna yönlendiren yama türü."
    ],
    [
      "Replacement patch",
      "Belirli komut baytlarını yerinde değiştiren yama türü."
    ],
    [
      "Verification",
      "Bu bağlamda yamanın özgünlük / bütünlük denetimi."
    ],
    [
      "Validation",
      "Yama boyutu, hedef adresi ve metadata biçiminin uygunluk denetimi."
    ],
    [
      "Schedulability",
      "Verilen görev setinin zaman kısıtlarına uyabilmesinin değerlendirilmesi."
    ]
  ]
};
window.GUIDE.init = function () {
const $=s=>document.querySelector(s);
const threats={task:'Model içinde: ayrıcalıksız görev, MPU ile korunan framework ve yama belleğini keyfî değiştirememelidir.',kernel:'Model dışında: kernel ve MPU yöneticisi güvenilirdir. Bunların ele geçirilmesi izolasyon varsayımını bozar.',patch:'Kapsam dışı doğruluk sorusu: imzalı ama hatalı yamanın işlevsel güvenliğini Kintsugi kanıtlamaz.'};function threat(){$('#kin-threat-out').textContent=threats[$('#kin-threat').value]}$('#kin-threat').onchange=threat;threat();
function race(){$('#kin-race-out').textContent=$('#kin-race').value==='naive'?'Eski kod → kısmi yazma → yüksek öncelikli görev: görev yarım yamayı çalıştırabilir. Düşük öncelik tek başına atomiklik sağlamaz.':'Hazırlık kesilebilir; son uygulama context-switch kritik bölgesinde tamamlanır. Sonraki görev tutarlı eski veya yeni durumu görür; kısa bir ek maliyet vardır.'}$('#kin-race').onchange=race;race();
const names=['Giriş','Karantina','Doğrulama','Saklama','Planlama','Uygulama'];const steps=['Paylaşılan giriş güvenilmez; imzalı iletim cihaz içindeki değişimi tek başına önlemez.','Manager özel, yürütülemez karantinaya kopyalar. Sonraki denetim bu kopyada yapılır.','Bütünlük, özgünlük, boyut ve hedef metadata’sı denetlenir. Başarısızsa süreç durur.','Onaylanan metadata ve kod ayrı korunmuş alanlara taşınır.','Manager Applicator context’ini hazırlar; henüz firmware hedefi değiştirilmemiştir.','Sıradaki görev Manager ve yama planlıysa Applicator kısa kritik bölümde yazar; Guard izinleri tekrar kapatır.'];let step=0;function route(){$('#kin-route-nodes').innerHTML=names.map((n,i)=>'<div class="stage-node '+(i===step?'active':'')+'">'+n+'</div>').join('');$('#kin-route-out').textContent=steps[step];$('#kin-route-prev').disabled=step===0;$('#kin-route-next').disabled=step===steps.length-1}$('#kin-route-next').onclick=()=>{step=Math.min(steps.length-1,step+1);route()};$('#kin-route-prev').onclick=()=>{step=Math.max(0,step-1);route()};$('#kin-route-reset').onclick=()=>{step=0;route()};route();
function policy(){const v=$('#kin-actor').value;$('#kin-policy-out').textContent=v==='default'?'Firmware, yama kodu ve metadata salt okunur: sıradan görev bunları yazamaz.':v==='manager'?'Manager context, slots, karantina ve yama kodunu yönetebilir; firmware salt okunur kalır.':'Applicator firmware ve kendi context’ini yazabilir; yama kodu ve slots salt okunur. Bu yetki kısa uygulama anına aittir.'}$('#kin-actor').onchange=policy;policy();
};
