const chatbox = document.querySelector('.chatbot');
const chatHeader = chatbox.querySelector('.chat-header');
const chatBody = chatbox.querySelector('.chat-body');
const chatInput = chatbox.querySelector('#chat-input');

let isCollapsed = false;

// Predefined auto-replies
const autoReplies = [
    // General inquiries
    { 
        keywords: ['hello', 'hi', 'goodmorning'], 
        reply: { en: 'Hello! Im Moy AI chatbot, your virtual assistant. Ready to help with your questions.', 
                 tl: 'Kumusta! Ako si Moy AI chatbot, ang iyong virtual assistant. Handa akong tumulong sa iyong mga katanungan.' } 
    },
    { 
        keywords: ['hours', 'time', 'oras'], 
        reply: { en: 'Our clinic is open from 8am to 6pm, Monday to Saturday.', 
                 tl: 'Bukas ang aming klinika mula 8am hanggang 6pm, Lunes hanggang Sabado.' } 
    },
    { 
        keywords: ['services','service','SERVICES','Services','serbisyo'], 
        reply: { en: 'We offer Physical Exams, Lab Tests, X-ray, Ultrasound, ECG, Dental, and Optical services.', 
                 tl: 'Nag-aalok kami ng Physical Exam, Laboratory Tests, X-ray, Ultrasound, ECG, Dental, at Optical services.' } 
    },
    { 
        keywords: ['appointment', 'book', 'pa-appointment'], 
        reply: { en: 'You can book an appointment by calling us at +123-456-7890 or via our website.', 
                 tl: 'Maaari kayong magpa-appointment sa pamamagitan ng pagtawag sa +123-456-7890 o sa aming website.' } 
    },
    { 
        keywords: ['location', 'address', 'lokasyon'], 
        reply: { en: 'We are located at 22B Madison Street, Brgy.Mariana, Quezon City.', 
                 tl: 'Matatagpuan ang aming klinika sa 22B Madison Street, Brgy. Mariana, Quezon City.' } 
    },
    { 
        keywords: ['price', 'cost','presyo',], 
        reply: { en: 'Please specify the service so I can give you the price.', 
                 tl: 'Pakispecify ang serbisyo upang maibigay ko ang presyo.' } 
    },
    // =========================
    // Medical Services Prices
    // =========================
    { keywords: ['1st allbest', 'ankor', 'a4 mgmt'], reply: '₱2,200.00' },
    { keywords: ['3k golden food corps'], reply: '₱550.00' },
    { keywords: ['abo blood typing'], reply: '₱200.00' },
    { keywords: ['acid phosphates'], reply: '₱562.00' },
    { keywords: ['afb'], reply: '₱300.00' },
    { keywords: ['afp'], reply: '₱1,700.00' },
    { keywords: ['albumin'], reply: '₱400.00' },
    { keywords: ['alkaline phosphates'], reply: '₱250.00' },
    { keywords: ['ammonia'], reply: '₱750.00' },
    { keywords: ['amylase'], reply: '₱200.00' },
    { keywords: ['ana screening','ana'], reply: '₱1,200.00' },
    { keywords: ['ana w/ titer'], reply: '₱1,500.00' },
    { keywords: ['anti-hav'], reply: '₱750.00' },
    { keywords: ['anti-hcv'], reply: '₱800.00' },
    { keywords: ['aptt'], reply: '₱560.00' },
    { keywords: ['aso titer'], reply: '₱750.00' },
    { keywords: ['abdominal ultrasound'], reply: '₱1,800.00' },
    { keywords: ['ankor hong kong'], reply: '₱3,800.00' },
    { keywords: ['ankor poland'], reply: '₱2,500.00' },
    { keywords: ['anti-hav igg'], reply: '₱560.00' },
    { keywords: ['anti-hbc igm'], reply: '₱560.00' },
    { keywords: ['anti-hbc igg'], reply: '₱560.00' },
    { keywords: ['anti-hbs'], reply: '₱450.00' },
    { keywords: ['anti-hcv'], reply: '₱560.00' },
    { keywords: ['anti-hbe'], reply: '₱560.00' },
    { keywords: ['audiometry','audio'], reply: '₱200.00' },
    { keywords: ['b-hcg'], reply: '₱1,300.00' },
    { keywords: ['basic 4'], reply: '₱350.00' },
    { keywords: ['basic 5'], reply: '₱450.00' },
    { keywords: ['basic blood chemistry'], reply: '₱1,400.00' },
    { keywords: ['bile'], reply: '₱250.00' },
    { keywords: ['bilirubin'], reply: '₱750.00' },
    { keywords: ['body fluids'], reply: '₱900.00' },
    { keywords: ['breast ultrasound'], reply: '₱550.00' },
    { keywords: ['bua'], reply: '₱250.00' },
    { keywords: ['bun'], reply: '₱250.00' },
    { keywords: ['c3/c4'], reply: '₱1,000.00' },
    { keywords: ['ca-125'], reply: '₱2,500.00' },
    { keywords: ['ca-153'], reply: '₱2,500.00' },
    { keywords: ['ca-199'], reply: '₱2,800.00' },
    { keywords: ['calcium'], reply: '₱350.00' },
    { keywords: ['cea'], reply: '₱1,300.00' },
    { keywords: ['cell and differential count'], reply: '₱450.00' },
    { keywords: ['chloride'], reply: '₱250.00' },
    { keywords: ['cocaine','cocaine test'], reply: '₱500.00' },
    { keywords: ['cholesterol'], reply: '₱250.00' },
    { keywords: ['cmv igg'], reply: '₱1,500.00' },
    { keywords: ['cmv igm'], reply: '₱1,600.00' },
    { keywords: ['complete blood count','cbc','CBC'], reply: '₱200.00' },
    { keywords: ['concentration technique'], reply: '₱250.00' },
    { keywords: ['cortisol'], reply: '₱1,500.00' },
    { keywords: ['cpk-mb'], reply: '₱650.00' },
    { keywords: ['cpk-mm'], reply: '₱750.00' },
    { keywords: ['creatinine only'], reply: '₱250.00' },
    { keywords: ['creatinine clearance'], reply: '₱400.00' },
    { keywords: ['creatinine total'], reply: '₱480.00' },
    { keywords: ['crp'], reply: '₱580.00' },
    { keywords: ['culture and sensitivity'], reply: '₱900.00' },
    { keywords: ['culture only'], reply: '₱600.00' },
    { keywords: ['check-up'], reply: '₱500.00' },
    { keywords: ['chest x-ray','chest pa','Chest PA','chest PA'], reply: '₱300.00' },
    { keywords: ['chest x-ray vdr'], reply: '₱500.00' },
    { keywords: ['chest x-ray ap/lat','ap/lat'], reply: '₱750.00' },
    { keywords: ['cocaine','cocaine test'], reply: '₱500.00' },
    { keywords: ['creamship management'], reply: '₱850.00' },
    { keywords: ['dengue iga'], reply: '₱2,600.00' },
    { keywords: ['dengue igm and igg','dengue igg and igm'], reply: '₱1,500.00' },
    { keywords: ['dengue nsi'], reply: '₱2,000.00' },
    { keywords: ['drug and alcohol test','drugtest','alcoholtest','alcohol test'], reply: '₱250.00' },
    { keywords: ['ecg'], reply: '₱350.00' },
    { keywords: ['estradiol'], reply: '₱1,300.00' },  
    { keywords: ['estrogen'], reply: '₱1,300.00' },
    { keywords: ['fbs'], reply: '₱200.00' },
    { keywords: ['ferritin'], reply: '₱1,300.00' },
    { keywords: ['fsh'], reply: '₱1,000.00' },
    { keywords: ['ft3'], reply: '₱550.00' },
    { keywords: ['ft4'], reply: '₱550.00' },
    { keywords: ['ggtp'], reply: '₱650.00' },
    { keywords: ['gram stain'], reply: '₱350.00' },
    { keywords: ['hba1c'], reply: '₱750.00' },
    { keywords: ['hbeag'], reply: '₱560.00' },
    { keywords: ['hbsag screening','hbsag'], reply: '₱250.00' },
    { keywords: ['hbsag with titer'], reply: '₱450.00' },
    { keywords: ['hdl'], reply: '₱100.00' },
    { keywords: ['hdl/ldl/vdrl'], reply: '₱150.00' },
    { keywords: ['hiv screening','hiv'], reply: '₱850.00' },
    { keywords: ['hiv w/ titer'], reply: '₱900.00' },
    { keywords: ['hsv 1'], reply: '₱1,800.00' },
    { keywords: ['hsv 2'], reply: '₱1,500.00' },
    { keywords: ['hepatitis a profile'], reply: '₱1,200.00' },
    { keywords: ['hepatitis a and b profile'], reply: '₱2,500.00' },
    { keywords: ['hepatitis a,b and c profile'], reply: '₱3,000.00' },
    { keywords: ['hepatitis b profile'], reply: '₱2,000.00' },
    { keywords: ['hepato biliary ultrasound'], reply: '₱1,700.00' },
    { keywords: ['inorganic phosphate'], reply: '₱400.00' },
    { keywords: ['ionized calcium'], reply: '₱550.00' },
    { keywords: ['ishihara test'], reply: '₱50.00' },
    { keywords: ['jcw outsourcing management'], reply: '₱800.00' },
    { keywords: ['jensen'], reply: '₱4,000.00' },
    { keywords: ['josua generation'], reply: '₱1,000.00' },
    { keywords: ['ketone/acetone'], reply: '₱260.00' },
    { keywords: ['koh'], reply: '₱350.00' },
    { keywords: ['kub ultrasound'], reply: '₱1,500.00' },
    { keywords: ['ldh'], reply: '₱500.00' },
    { keywords: ['ldl'], reply: '₱100.00' },
    { keywords: ['le preparation'], reply: '₱500.00' },
    { keywords: ['lead test'], reply: '₱2,500.00' },
    { keywords: ['lh'], reply: '₱1,000.00' },
    { keywords: ['lipase'], reply: '₱300.00' },
    { keywords: ['lipid profile'], reply: '₱750.00' },
    { keywords: ['liver profile'], reply: '₱0.00' },
    { keywords: ['malaria smear'], reply: '₱500.00' },
    { keywords: ['marsun shipping'], reply: '₱2,600.00' },
    { keywords: ['mega vps'], reply: '₱600.00' },
    { keywords: ['micro albumin test'], reply: '₱750.00' },
    { keywords: ['mrdc phase 1'], reply: '₱4,600.00' },
    { keywords: ['mrdc phase 2 and 3'], reply: '₱1,800.00' },
    { keywords: ['mtb culture'], reply: '₱3,500.00' },
    { keywords: ['nir romania female'], reply: '₱5,900.00' },
    { keywords: ['nir romania male'], reply: '₱5,300.00' },
    { keywords: ['nir singapore hong kong'], reply: '₱2,500.00' },
    { keywords: ['occult blood'], reply: '₱350.00' },
    { keywords: ['ogct'], reply: '₱250.00' },
    { keywords: ['ogtt'], reply: '₱650.00' },
    { keywords: ['pap smear','papsmear'], reply: '₱500.00' },
    { keywords: ['peripheral blood sugar'], reply: '₱550.00' },
    { keywords: ['phates package 1'], reply: '₱4,600.00' },
    { keywords: ['phates package 2'], reply: '₱1,800.00' },
    { keywords: ['platelet count'], reply: '₱200.00' },
    { keywords: ['potassium'], reply: '₱350.00' },
    { keywords: ['pregnancy test serum'], reply: '₱200.00' },
    { keywords: ['pregnancy test urine'], reply: '₱300.00' },
    { keywords: ['progesterone'], reply: '₱1,200.00' },
    { keywords: ['prolactin'], reply: '₱1,200.00' },
    { keywords: ['prostate specific antigen'], reply: '₱900.00' },
    { keywords: ['prostate ultrasound'], reply: '₱500.00' },
    { keywords: ['protein'], reply: '₱400.00' },
    { keywords: ['protine'], reply: '₱550.00' },
    { keywords: ['psa'], reply: '₱1,700.00' },
    { keywords: ['psc drug test'], reply: '₱200.00' },
    { keywords: ['psc regular'], reply: '₱1,420.00' },
    { keywords: ['package'], reply: '₱12,000.00' },
    { keywords: ['physical exam'], reply: '₱100.00' },
    { keywords: ['ra/rf latex'], reply: '₱550.00' },
    { keywords: ['renal profile'], reply: '₱0.00' },
    { keywords: ['reticulocyte count'], reply: '₱300.00' },
    { keywords: ['rh factor'], reply: '₱200.00' },
    { keywords: ['rubella igg'], reply: '₱1,200.00' },
    { keywords: ['rubella igm'], reply: '₱1,200.00' },
    { keywords: ['seabuoy crewing daat package 1'], reply: '₱2,270.00' },
    { keywords: ['seabuoy crewing daat package 2'], reply: '₱6,450.00' },
    { keywords: ['seabuoy crewing italian med'], reply: '₱4,870.00' },
    { keywords: ['semen analysis'], reply: '₱550.00' },
    { keywords: ['sgot/ast'], reply: '₱350.00' },
    { keywords: ['sgpt/alt'], reply: '₱350.00' },
    { keywords: ['sodium'], reply: '₱250.00' },
    { keywords: ['spurway'], reply: '₱800.00' },
    { keywords: ['stone analysis'], reply: '₱750.00' },
    { keywords: ['sugar'], reply: '₱200.00' },
    { keywords: ['stress test'], reply: '₱2,000.00' },
    { keywords: ['t3'], reply: '₱500.00' },
    { keywords: ['t4'], reply: '₱500.00' },
    { keywords: ['testosterone'], reply: '₱1,500.00' },
    { keywords: ['tibc+total iron'], reply: '₱800.00' },
    { keywords: ['torch test elisa'], reply: '₱5,000.00' },
    { keywords: ['total cpk'], reply: '₱650.00' },
    { keywords: ['total iron'], reply: '₱600.00' },
    { keywords: ['total protein'], reply: '₱350.00' },
    { keywords: ['tpag'], reply: '₱750.00' },
    { keywords: ['tpha screening','tpha'], reply: '₱580.00' },
    { keywords: ['tpha w/ titer'], reply: '₱1,100.00' },
    { keywords: ['triglycerides'], reply: '₱300.00' },
    { keywords: ['tropinin t qualitative'], reply: '₱1,400.00' },
    { keywords: ['troponin t quantitative'], reply: '₱1,400.00' },
    { keywords: ['troponin i qualitative'], reply: '₱1,400.00' },
    { keywords: ['troponin i quantitative'], reply: '₱1,400.00' },
    { keywords: ['tsh'], reply: '₱550.00' },
    { keywords: ['typhidot'], reply: '₱1,200.00' },
    { keywords: ['tetrahyrocannabinol'], reply: '₱500.00' },
    { keywords: ['toxoplasma igg'], reply: '₱1,800.00' },
    { keywords: ['toxoplasma igm'], reply: '₱1,800.00' },
    { keywords: ['uric acid'], reply: '₱350.00' },
    { keywords: ['urinalysis'], reply: '₱150.00' },
    { keywords: ['urobilinogen'], reply: '₱260.00' },
    { keywords: ['vdrl'], reply: '₱250.00' },
    { keywords: ['varicella igg'], reply: '₱2,000.00' },
    { keywords: ['varicella igm'], reply: '₱2,000.00' },
    { keywords: ['widal test'], reply: '₱600.00' },
    { keywords: ['x-ray ap/lat right ankle'], reply: '₱950.00' },
    { keywords: ['x-ray apolordotic view','apico','APICO','Apico'], reply: '₱550.00' },
];

const defaultReplies = [
    'Hello! How can we assist you today?',
    'Thank you for your message! Our staff will respond shortly.',
    'We are here to help you. Please type your question.'
];

// Collapsible chat
chatHeader.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
        chatBody.style.display = 'none';
        chatInput.style.display = 'none';
        chatbox.style.height = '50px';
    } else {
        chatBody.style.display = 'block';
        chatInput.style.display = 'block';
        chatbox.style.height = 'auto';
        chatBody.scrollTop = chatBody.scrollHeight;
    }
});

// Draggable chatbox
let offsetX, offsetY, isDragging = false;

chatHeader.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - chatbox.offsetLeft;
    offsetY = e.clientY - chatbox.offsetTop;
    chatbox.style.transition = 'none';
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    chatbox.style.transition = 'all 0.2s';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    chatbox.style.left = `${e.clientX - offsetX}px`;
    chatbox.style.top = `${e.clientY - offsetY}px`;
});

function autoReply(message) {
    let msg = message.toLowerCase().trim();

    // Remove common filler phrases before keyword matching
    msg = msg
        .replace(/magkano ang\s+/i, '')
        .replace(/how much is\s+/i, '')
        .replace(/do you have\s+/i, '')
        .replace(/do you offer\s+/i, '')
        .replace(/mayroon ba kayong\s+/i, '')
        .replace(/mayroon kayong\s+/i, '')
        .replace(/meron ba kayong\s+/i, '')
        .replace(/meron kayong\s+/i, '')
        .replace(/may\s+ba kayo\s*/i, '')
        .replace(/available ba ang\s+/i, '')
        .replace(/available ang\s+/i, '')
        .replace(/ano ang presyo ng\s+/i, '')
        .replace(/what is the price of\s+/i, '')
        .trim();

    // Alias map — groups of related services
    const aliasMap = {
        "xray": {
            services: ["Chest X-ray", "Chest X-ray VDR", "Chest X-ray AP/Lat", "X-ray AP/Lat Right Ankle", "X-ray Apico Lordotic View"],
            message: { en: "We offer the following X-ray services. Type the exact name for the price:", tl: "Mga X-ray services namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "x-ray": {
            services: ["Chest X-ray", "Chest X-ray VDR", "Chest X-ray AP/Lat", "X-ray AP/Lat Right Ankle", "X-ray Apico Lordotic View"],
            message: { en: "We offer the following X-ray services. Type the exact name for the price:", tl: "Mga X-ray services namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "ultrasound": {
            services: ["Abdominal Ultrasound", "Breast Ultrasound", "Hepato Biliary Ultrasound", "KUB Ultrasound", "Prostate Ultrasound"],
            message: { en: "We offer the following Ultrasound services. Type the exact name for the price:", tl: "Mga Ultrasound services namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "ecg": {
            services: ["ECG — ₱350.00"],
            message: { en: "We offer ECG. Type 'ECG' to get the price.", tl: "Mayroon kaming ECG. I-type ang 'ECG' para sa presyo." }
        },
        "blood": {
            services: ["CBC", "ABO Blood Typing", "RH Factor", "Platelet Count", "Reticulocyte Count", "Peripheral Blood Sugar", "Cell and Differential Count"],
            message: { en: "We offer the following blood tests. Type the exact name for the price:", tl: "Mga blood tests namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "hepatitis": {
            services: ["Hepatitis A Profile", "Hepatitis B Profile", "Hepatitis A and B Profile", "Hepatitis A,B and C Profile", "HBsAg Screening", "HBsAg with Titer", "Anti-HBs", "Anti-HCV", "Anti-HAV", "Anti-HAV IgG", "HBeAg"],
            message: { en: "We offer the following Hepatitis tests. Type the exact name for the price:", tl: "Mga Hepatitis tests namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "thyroid": {
            services: ["TSH", "T3", "T4", "FT3", "FT4"],
            message: { en: "We offer the following Thyroid tests. Type the exact name for the price:", tl: "Mga Thyroid tests namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "hormone": {
            services: ["FSH", "LH", "Estradiol", "Progesterone", "Prolactin", "Testosterone", "Cortisol"],
            message: { en: "We offer the following Hormone tests. Type the exact name for the price:", tl: "Mga Hormone tests namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "dengue": {
            services: ["Dengue IgA", "Dengue IgM and IgG", "Dengue NSI"],
            message: { en: "We offer the following Dengue tests. Type the exact name for the price:", tl: "Mga Dengue tests namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "drug": {
            services: ["Drug and Alcohol Test", "Cocaine Test", "Tetrahyrocannabinol", "PSC Drug Test"],
            message: { en: "We offer the following Drug tests. Type the exact name for the price:", tl: "Mga Drug tests namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "cancer": {
            services: ["CA-125", "CA-153", "CA-199", "CEA", "PSA", "AFP", "B-hCG"],
            message: { en: "We offer the following Tumor Marker tests. Type the exact name for the price:", tl: "Mga Tumor Marker tests namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "tumor": {
            services: ["CA-125", "CA-153", "CA-199", "CEA", "PSA", "AFP", "B-hCG"],
            message: { en: "We offer the following Tumor Marker tests. Type the exact name for the price:", tl: "Mga Tumor Marker tests namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "urine": {
            services: ["Urinalysis", "Pregnancy Test Urine", "Micro Albumin Test", "Urobilinogen", "Occult Blood", "Ketone/Acetone"],
            message: { en: "We offer the following Urine tests. Type the exact name for the price:", tl: "Mga Urine tests namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "pregnancy": {
            services: ["Pregnancy Test Serum", "Pregnancy Test Urine", "B-hCG"],
            message: { en: "We offer the following Pregnancy tests. Type the exact name for the price:", tl: "Mga Pregnancy tests namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "dental": {
            services: ["Check-up", "Please call us at +123-456-7890 for the full dental services list."],
            message: { en: "We offer Dental services. Here are some options:", tl: "Mayroon kaming Dental services. Narito ang ilan:" }
        },
        "physical": {
            services: ["Physical Exam — ₱100.00", "Check-up — ₱500.00"],
            message: { en: "We offer the following Physical Exam services:", tl: "Mga Physical Exam services namin:" }
        },
        "package": {
            services: ["PSC Regular", "PSC Drug Test", "Basic Blood Chemistry", "Basic 4", "Basic 5", "Package"],
            message: { en: "We offer the following packages. Type the exact name for the price:", tl: "Mga packages namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "shipping": {
            services: ["Ankor Hong Kong", "Ankor Poland", "Marsun Shipping", "Creamship Management", "NIR Romania Female", "NIR Romania Male", "NIR Singapore Hong Kong", "Jensen", "Seabuoy Crewing DAAT Package 1", "Seabuoy Crewing DAAT Package 2", "Seabuoy Crewing Italian Med"],
            message: { en: "We offer the following Seafarer/Shipping packages. Type the exact name for the price:", tl: "Mga Seafarer/Shipping packages namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "seafarer": {
            services: ["Ankor Hong Kong", "Ankor Poland", "Marsun Shipping", "Creamship Management", "NIR Romania Female", "NIR Romania Male", "NIR Singapore Hong Kong", "Jensen", "Seabuoy Crewing DAAT Package 1", "Seabuoy Crewing DAAT Package 2", "Seabuoy Crewing Italian Med"],
            message: { en: "We offer the following Seafarer packages. Type the exact name for the price:", tl: "Mga Seafarer packages namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "stress": {
            services: ["Stress Test — ₱2,000.00"],
            message: { en: "We offer Stress Test. Type 'Stress Test' to get the price.", tl: "Mayroon kaming Stress Test. I-type ang 'Stress Test' para sa presyo." }
        },
        "audiometry": {
            services: ["Audiometry — ₱200.00"],
            message: { en: "We offer Audiometry. Type 'Audiometry' to get the price.", tl: "Mayroon kaming Audiometry. I-type ang 'Audiometry' para sa presyo." }
        },
        "optical": {
            services: ["Ishihara Test (Color Blindness) — ₱50.00"],
            message: { en: "We offer the following Optical services:", tl: "Mga Optical services namin:" }
        },
        "culture": {
            services: ["Culture and Sensitivity", "Culture Only", "MTB Culture"],
            message: { en: "We offer the following Culture tests. Type the exact name for the price:", tl: "Mga Culture tests namin. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "pap": {
            services: ["Pap Smear — ₱500.00"],
            message: { en: "We offer Pap Smear. Type 'Pap Smear' to get the price.", tl: "Mayroon kaming Pap Smear. I-type ang 'Pap Smear' para sa presyo." }
        },
        "semen": {
            services: ["Semen Analysis — ₱550.00"],
            message: { en: "We offer Semen Analysis. Type 'Semen Analysis' to get the price.", tl: "Mayroon kaming Semen Analysis. I-type ang 'Semen Analysis' para sa presyo." }
        },
        "lab": {
            services: ["CBC", "Urinalysis", "FBS", "Lipid Profile", "HBA1C", "Creatinine Only", "SGPT/ALT", "SGOT/AST", "Uric Acid", "Cholesterol", "BUN", "...and many more"],
            message: { en: "We offer many lab tests. Here are some common ones. Type the exact test name for the price:", tl: "Marami kaming lab tests. Narito ang ilan. I-type ang eksaktong pangalan para sa presyo:" }
        },
        "laboratory": {
            services: ["CBC", "Urinalysis", "FBS", "Lipid Profile", "HBA1C", "Creatinine Only", "SGPT/ALT", "SGOT/AST", "Uric Acid", "Cholesterol", "BUN", "...and many more"],
            message: { en: "We offer many lab tests. Here are some common ones. Type the exact test name for the price:", tl: "Marami kaming lab tests. Narito ang ilan. I-type ang eksaktong pangalan para sa presyo:" }
        }
    };

    // --- 1. Check general inquiries first ---
    const generalReplies = autoReplies.filter(r => typeof r.reply === "object");
    const exactGeneral = generalReplies.find(r => r.keywords.some(k => k.toLowerCase() === msg));
    if (exactGeneral) {
        addBotMessage(currentLang === "tl" ? exactGeneral.reply.tl : exactGeneral.reply.en);
        return;
    }
    const partialGeneral = generalReplies.filter(r => r.keywords.some(k => msg.includes(k.toLowerCase())));
    if (partialGeneral.length === 1) {
        addBotMessage(currentLang === "tl" ? partialGeneral[0].reply.tl : partialGeneral[0].reply.en);
        return;
    }

    // --- 2. Alias map check (partial match — works even with extra words) ---
    const matchedAlias = Object.keys(aliasMap).find(alias => msg.includes(alias));
    if (matchedAlias) {
        const aliasData = aliasMap[matchedAlias];
        const serviceList = aliasData.services.join('\n• ');
        addBotMessage(currentLang === "tl"
            ? `${aliasData.message.tl}\n\n• ${serviceList}`
            : `${aliasData.message.en}\n\n• ${serviceList}`
        );
        return;
    }

    // --- 3. Service / price matching ---
    const serviceReplies = autoReplies.filter(r =>
        !r.keywords.includes('price') &&
        !r.keywords.includes('cost') &&
        !r.keywords.includes('presyo') &&
        typeof r.reply !== "object"
    );

    // Exact match
    const exactMatch = serviceReplies.find(r => r.keywords.some(k => k.toLowerCase() === msg));
    if (exactMatch) {
        const r = exactMatch;
        addBotMessage(typeof r.reply === "object"
            ? (currentLang === "tl" ? r.reply.tl : r.reply.en)
            : r.reply
        );
        return;
    }

    // Partial match
    const partialMatches = serviceReplies.filter(r => r.keywords.some(k => k.toLowerCase().includes(msg)));
    if (partialMatches.length === 1) {
        const r = partialMatches[0];
        addBotMessage(typeof r.reply === "object"
            ? (currentLang === "tl" ? r.reply.tl : r.reply.en)
            : r.reply
        );
        return;
    }
    if (partialMatches.length > 1) {
        const options = partialMatches.map(r => r.keywords[0]).filter((v,i,a)=>a.indexOf(v)===i).join(', ');
        addBotMessage(currentLang === "tl"
            ? `Pakispecify ang serbisyo. Mga options: ${options}`
            : `Please specify which service you mean. Options: ${options}`
        );
        return;
    }

    // Price inquiry fallback
    if (message.toLowerCase().includes('magkano') || message.toLowerCase().includes('price') || message.toLowerCase().includes('cost')) {
        addBotMessage(currentLang === "tl"
            ? "Pakispecify ang serbisyo upang maibigay ko ang presyo."
            : "Please specify the service so I can give you the price."
        );
        return;
    }

    // Default fallback
    addBotMessage(currentLang === "tl"
        ? "Paumanhin, ang serbisyong hinahanap ninyo ay hindi available sa klinikang ito. Pakitype ang serbisyong eksaktong nakalista sa pagpipilian upang mabigyan ka namin ng tamang sagot."
        : "Sorry, the service you are looking for is not available at this clinic. Please type the service exactly as shown in the options so we can provide the correct response."
    );
}

function addBotMessage(text) {
    const botDiv = document.createElement('div');
    botDiv.classList.add('bot-message');
    botDiv.textContent = text;
    chatBody.appendChild(botDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function simulateUserMessages(messages, interval = 3000) {
    let index = 0;
    function sendNext() {
        if (index >= messages.length) return;
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('user-message');
        msgDiv.textContent = messages[index];
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        setTimeout(() => {
            autoReply(messages[index]);
        }, 1000);

        index++;
        setTimeout(sendNext, interval);
    }
    sendNext();
}

chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && chatInput.value.trim() !== '') {
        const userMessage = chatInput.value;
        const userDiv = document.createElement('div');
        userDiv.classList.add('user-message');
        userDiv.textContent = userMessage;
        chatBody.appendChild(userDiv);
        chatInput.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;

        setTimeout(() => {
            autoReply(userMessage);
        }, 1000);
    }
});

function resetChat() {
    chatBody.innerHTML = '';
    chatInput.value = '';

    const welcomeText = currentLang === "tl" 
        ? "Kamusta! Paano namin kayo matutulungan?" 
        : "Hello! How can we assist you today?";
    
    addBotMessage(welcomeText);
}

// Language setting
let currentLang = "en";

function setChatLanguage(lang) {
    currentLang = lang;

    if (chatInput) {
        chatInput.placeholder = (lang === "tl") 
            ? "I-type ang iyong mensahe..." 
            : "Type your message...";
    }

    resetChat();
}
