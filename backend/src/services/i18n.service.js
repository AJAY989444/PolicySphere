// backend/src/services/i18n.service.js
// Multi-Language Localization (i18n) & Indian Regionalization (SRS Module 37)

const TRANSLATIONS = {
  en: {
    appName: 'PolicySphere',
    tagline: 'India’s Next-Gen AI InsurTech & Unified Policy OS',
    searchPlaceholder: 'Search health, motor, life, or travel policies...',
    getQuote: 'Get Instant Quote',
    comparePolicies: 'Compare Plans',
    cashlessNetwork: 'Cashless Network',
    claimAssistance: '24x7 Claim Support',
    statutoryDisclaimer:
      'Insurance is the subject matter of solicitation. PolicySphere is an IRDAI-licensed Web Aggregator (License No. IRDAI/WBA/2026/89).',
    privacyNotice: 'Your personal data is encrypted and protected under Digital Personal Data Protection (DPDP) Act 2023.',
  },
  hi: {
    appName: 'पॉलिसीस्फेयर',
    tagline: 'भारत का अगली पीढ़ी का एआई इंश्योरटेक प्लेटफॉर्म',
    searchPlaceholder: 'स्वास्थ्य, वाहन, जीवन या यात्रा बीमा खोजें...',
    getQuote: 'तुरंत कोटेशन प्राप्त करें',
    comparePolicies: 'पॉलिसी की तुलना करें',
    cashlessNetwork: 'कैशलेस अस्पताल नेटवर्क',
    claimAssistance: '२४x७ क्लेम सहायता',
    statutoryDisclaimer:
      'बीमा आग्रह की विषय वस्तु है। पॉलिसीस्फेयर आईआरडीएआई द्वारा लाइसेंस प्राप्त वेब एग्रीगेटर है (लाइसेंस संख्या IRDAI/WBA/2026/89)।',
    privacyNotice: 'आपका व्यक्तिगत डेटा डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम 2023 के तहत सुरक्षित है।',
  },
  ta: {
    appName: 'பாலிசிஸ்பியர்',
    tagline: 'இந்தியாவின் அடுத்த தலைமுறை AI காப்பீட்டு தளம்',
    searchPlaceholder: 'சுகாதாரம், வாகனம், ஆயுள் காப்பீடுகளைத் தேடுங்கள்...',
    getQuote: 'உடனடி மேற்கோள் பெறுக',
    comparePolicies: 'திட்டங்களை ஒப்பிடுக',
    cashlessNetwork: 'ரொக்கமில்லா மருத்துவமனை நெட்வொர்க்',
    claimAssistance: '24x7 இழப்பீட்டு உதவி',
    statutoryDisclaimer:
      'காப்பீடு என்பது கோருதலின் பாற்பட்டது. பாலிசிஸ்பியர் IRDAI உரிமம் பெற்ற வலைத் திரட்டி ஆகும் (உரிம எண் IRDAI/WBA/2026/89).',
    privacyNotice: 'உங்கள் தனிப்பட்ட தரவு DPDP சட்டம் 2023 இன் கீழ் குறியாக்கம் செய்யப்பட்டு பாதுகாக்கப்படுகிறது.',
  },
  te: {
    appName: 'పాలసీస్పియర్',
    tagline: 'భారతదేశ తదుపరి తరం AI ఇన్సూరెన్స్ ప్లాట్‌ఫామ్',
    searchPlaceholder: 'ఆరోగ్యం, మోటార్, జీవిత బీమాలను శోధించండి...',
    getQuote: 'తక్షణ కొటేషన్ పొందండి',
    comparePolicies: 'ప్లాన్‌లను సరిపోల్చండి',
    cashlessNetwork: 'నగదు రహిత ఆసుపత్రి నెట్‌వర్క్',
    claimAssistance: '24x7 క్లెయిమ్ సహాయం',
    statutoryDisclaimer:
      'భీమా అభ్యర్థన విషయానికి లోబడి ఉంటుంది. పాలసీస్పియర్ IRDAI లైసెన్స్ పొందిన వెబ్ అగ్రిగేటర్ (లైసెన్స్ సంఖ్య IRDAI/WBA/2026/89).',
    privacyNotice: 'మీ వ్యక్తిగత డేటా DPDP చట్టం 2023 ప్రకారం గుప్తీకరించబడింది మరియు సురక్షితం.',
  },
  mr: {
    appName: 'पॉलिसीस्फिअर',
    tagline: 'भारताचे पुढच्या पिढीचे एआय इन्शुरटेक प्लॅटफॉर्म',
    searchPlaceholder: 'आरोग्य, वाहन, जीवन विमा शोधा...',
    getQuote: 'त्वरित कोटेशन मिळवा',
    comparePolicies: 'योजनांची तुलना करा',
    cashlessNetwork: 'कॅशलेस रुग्णालय नेटवर्क',
    claimAssistance: '२४x७ क्लेम साहाय्य',
    statutoryDisclaimer:
      'विमा हा विनंतीचा विषय आहे. पॉलिसीस्फिअर हे IRDAI परवानाधारक वेब ॲग्रीगेटर आहे (परवाना क्र. IRDAI/WBA/2026/89).',
    privacyNotice: 'तुमचा वैयक्तिक डेटा डिजिटल वैयक्तिक डेटा संरक्षण (DPDP) कायदा २०२३ अंतर्गत सुरक्षित आहे.',
  },
  bn: {
    appName: 'পলিসিস্ফিয়ার',
    tagline: 'ভারতের পরবর্তী প্রজন্মের এআই ইনসিওরটেক প্ল্যাটফর্ম',
    searchPlaceholder: 'স্বাস্থ্য, মোটর, জীবন বা ভ্রমণ বীমা সন্ধান করুন...',
    getQuote: 'তাত্ক্ষণিক কোট পান',
    comparePolicies: 'পলিসির তুলনা করুন',
    cashlessNetwork: 'ক্যাশলেস হাসপাতাল নেটওয়ার্ক',
    claimAssistance: '২৪x৭ দাবি সহায়তা',
    statutoryDisclaimer:
      'বীমা আবেদনের বিষয়বস্তু। পলিসিস্ফিয়ার আইআরডিএআই লাইসেন্সপ্রাপ্ত ওয়েব অ্যাগ্রিগেটর (লাইসেন্স নং IRDAI/WBA/2026/89)।',
    privacyNotice: 'আপনার ব্যক্তিগত তথ্য ডিজিটাল ব্যক্তিগত তথ্য সুরক্ষা (DPDP) আইন ২০২৩-এর অধীনে সুরক্ষিত।',
  },
};

class I18nService {
  /**
   * Get UI translations for a given language code
   */
  static getTranslations(lang = 'en') {
    const code = String(lang).toLowerCase().slice(0, 2);
    return TRANSLATIONS[code] || TRANSLATIONS['en'];
  }

  /**
   * Format numbers into Indian Rupee Lakhs and Crores
   */
  static formatIndianCurrency(amount) {
    const num = Number(amount);
    if (isNaN(num)) return '₹0';

    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  }

  /**
   * Return supported locales
   */
  static getSupportedLocales() {
    return [
      { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
    ];
  }
}

module.exports = I18nService;
