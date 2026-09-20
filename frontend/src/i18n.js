import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 1. English
import enCommon from './locales/en/common.json';
import enIdentity from './locales/en/identity.json';
import enConsent from './locales/en/consent.json';
import enIntake from './locales/en/intake.json';
import enScanner from './locales/en/scanner.json';
import enReview from './locales/en/review.json';

// 2. Hindi
import hiCommon from './locales/hi/common.json';
import hiIdentity from './locales/hi/identity.json';
import hiConsent from './locales/hi/consent.json';
import hiIntake from './locales/hi/intake.json';
import hiScanner from './locales/hi/scanner.json';
import hiReview from './locales/hi/review.json';

// 3. Tamil
import taCommon from './locales/ta/common.json';
import taIdentity from './locales/ta/identity.json';
import taConsent from './locales/ta/consent.json';
import taIntake from './locales/ta/intake.json';
import taScanner from './locales/ta/scanner.json';
import taReview from './locales/ta/review.json';

// 4. Telugu
import teCommon from './locales/te/common.json';
import teIdentity from './locales/te/identity.json';
import teConsent from './locales/te/consent.json';
import teIntake from './locales/te/intake.json';
import teScanner from './locales/te/scanner.json';
import teReview from './locales/te/review.json';

// 5. Bengali
import bnCommon from './locales/bn/common.json';
import bnIdentity from './locales/bn/identity.json';
import bnConsent from './locales/bn/consent.json';
import bnIntake from './locales/bn/intake.json';
import bnScanner from './locales/bn/scanner.json';
import bnReview from './locales/bn/review.json';

// 6. Marathi
import mrCommon from './locales/mr/common.json';
import mrIdentity from './locales/mr/identity.json';
import mrConsent from './locales/mr/consent.json';
import mrIntake from './locales/mr/intake.json';
import mrScanner from './locales/mr/scanner.json';
import mrReview from './locales/mr/review.json';

// 7. Gujarati
import guCommon from './locales/gu/common.json';
import guIdentity from './locales/gu/identity.json';
import guConsent from './locales/gu/consent.json';
import guIntake from './locales/gu/intake.json';
import guScanner from './locales/gu/scanner.json';
import guReview from './locales/gu/review.json';

// 8. Kannada
import knCommon from './locales/kn/common.json';
import knIdentity from './locales/kn/identity.json';
import knConsent from './locales/kn/consent.json';
import knIntake from './locales/kn/intake.json';
import knScanner from './locales/kn/scanner.json';
import knReview from './locales/kn/review.json';

// 9. Malayalam
import mlCommon from './locales/ml/common.json';
import mlIdentity from './locales/ml/identity.json';
import mlConsent from './locales/ml/consent.json';
import mlIntake from './locales/ml/intake.json';
import mlScanner from './locales/ml/scanner.json';
import mlReview from './locales/ml/review.json';

// 10. Punjabi
import paCommon from './locales/pa/common.json';
import paIdentity from './locales/pa/identity.json';
import paConsent from './locales/pa/consent.json';
import paIntake from './locales/pa/intake.json';
import paScanner from './locales/pa/scanner.json';
import paReview from './locales/pa/review.json';

// 11. Assamese
import asCommon from './locales/as/common.json';
import asIdentity from './locales/as/identity.json';
import asConsent from './locales/as/consent.json';
import asIntake from './locales/as/intake.json';
import asScanner from './locales/as/scanner.json';
import asReview from './locales/as/review.json';

// 12. Bodo
import brxCommon from './locales/brx/common.json';
import brxIdentity from './locales/brx/identity.json';
import brxConsent from './locales/brx/consent.json';
import brxIntake from './locales/brx/intake.json';
import brxScanner from './locales/brx/scanner.json';
import brxReview from './locales/brx/review.json';

// 13. Dogri
import doiCommon from './locales/doi/common.json';
import doiIdentity from './locales/doi/identity.json';
import doiConsent from './locales/doi/consent.json';
import doiIntake from './locales/doi/intake.json';
import doiScanner from './locales/doi/scanner.json';
import doiReview from './locales/doi/review.json';

// 14. Konkani
import gomCommon from './locales/gom/common.json';
import gomIdentity from './locales/gom/identity.json';
import gomConsent from './locales/gom/consent.json';
import gomIntake from './locales/gom/intake.json';
import gomScanner from './locales/gom/scanner.json';
import gomReview from './locales/gom/review.json';

// 15. Kashmiri
import ksCommon from './locales/ks/common.json';
import ksIdentity from './locales/ks/identity.json';
import ksConsent from './locales/ks/consent.json';
import ksIntake from './locales/ks/intake.json';
import ksScanner from './locales/ks/scanner.json';
import ksReview from './locales/ks/review.json';

// 16. Maithili
import maiCommon from './locales/mai/common.json';
import maiIdentity from './locales/mai/identity.json';
import maiConsent from './locales/mai/consent.json';
import maiIntake from './locales/mai/intake.json';
import maiScanner from './locales/mai/scanner.json';
import maiReview from './locales/mai/review.json';

// 17. Manipuri
import mniCommon from './locales/mni/common.json';
import mniIdentity from './locales/mni/identity.json';
import mniConsent from './locales/mni/consent.json';
import mniIntake from './locales/mni/intake.json';
import mniScanner from './locales/mni/scanner.json';
import mniReview from './locales/mni/review.json';

// 18. Nepali
import neCommon from './locales/ne/common.json';
import neIdentity from './locales/ne/identity.json';
import neConsent from './locales/ne/consent.json';
import neIntake from './locales/ne/intake.json';
import neScanner from './locales/ne/scanner.json';
import neReview from './locales/ne/review.json';

// 19. Odia
import orCommon from './locales/or/common.json';
import orIdentity from './locales/or/identity.json';
import orConsent from './locales/or/consent.json';
import orIntake from './locales/or/intake.json';
import orScanner from './locales/or/scanner.json';
import orReview from './locales/or/review.json';

// 20. Sanskrit
import saCommon from './locales/sa/common.json';
import saIdentity from './locales/sa/identity.json';
import saConsent from './locales/sa/consent.json';
import saIntake from './locales/sa/intake.json';
import saScanner from './locales/sa/scanner.json';
import saReview from './locales/sa/review.json';

// 21. Santali
import satCommon from './locales/sat/common.json';
import satIdentity from './locales/sat/identity.json';
import satConsent from './locales/sat/consent.json';
import satIntake from './locales/sat/intake.json';
import satScanner from './locales/sat/scanner.json';
import satReview from './locales/sat/review.json';

// 22. Sindhi
import sdCommon from './locales/sd/common.json';
import sdIdentity from './locales/sd/identity.json';
import sdConsent from './locales/sd/consent.json';
import sdIntake from './locales/sd/intake.json';
import sdScanner from './locales/sd/scanner.json';
import sdReview from './locales/sd/review.json';

// 23. Urdu
import urCommon from './locales/ur/common.json';
import urIdentity from './locales/ur/identity.json';
import urConsent from './locales/ur/consent.json';
import urIntake from './locales/ur/intake.json';
import urScanner from './locales/ur/scanner.json';
import urReview from './locales/ur/review.json';

const resources = {
  en: { common: enCommon, identity: enIdentity, consent: enConsent, intake: enIntake, scanner: enScanner, review: enReview },
  hi: { common: hiCommon, identity: hiIdentity, consent: hiConsent, intake: hiIntake, scanner: hiScanner, review: hiReview },
  ta: { common: taCommon, identity: taIdentity, consent: taConsent, intake: taIntake, scanner: taScanner, review: taReview },
  te: { common: teCommon, identity: teIdentity, consent: teConsent, intake: teIntake, scanner: teScanner, review: teReview },
  bn: { common: bnCommon, identity: bnIdentity, consent: bnConsent, intake: bnIntake, scanner: bnScanner, review: bnReview },
  mr: { common: mrCommon, identity: mrIdentity, consent: mrConsent, intake: mrIntake, scanner: mrScanner, review: mrReview },
  gu: { common: guCommon, identity: guIdentity, consent: guConsent, intake: guIntake, scanner: guScanner, review: guReview },
  kn: { common: knCommon, identity: knIdentity, consent: knConsent, intake: knIntake, scanner: knScanner, review: knReview },
  ml: { common: mlCommon, identity: mlIdentity, consent: mlConsent, intake: mlIntake, scanner: mlScanner, review: mlReview },
  pa: { common: paCommon, identity: paIdentity, consent: paConsent, intake: paIntake, scanner: paScanner, review: paReview },
  as: { common: asCommon, identity: asIdentity, consent: asConsent, intake: asIntake, scanner: asScanner, review: asReview },
  brx: { common: brxCommon, identity: brxIdentity, consent: brxConsent, intake: brxIntake, scanner: brxScanner, review: brxReview },
  doi: { common: doiCommon, identity: doiIdentity, consent: doiConsent, intake: doiIntake, scanner: doiScanner, review: doiReview },
  gom: { common: gomCommon, identity: gomIdentity, consent: gomConsent, intake: gomIntake, scanner: gomScanner, review: gomReview },
  kok: { common: gomCommon, identity: gomIdentity, consent: gomConsent, intake: gomIntake, scanner: gomScanner, review: gomReview },
  ks: { common: ksCommon, identity: ksIdentity, consent: ksConsent, intake: ksIntake, scanner: ksScanner, review: ksReview },
  mai: { common: maiCommon, identity: maiIdentity, consent: maiConsent, intake: maiIntake, scanner: maiScanner, review: maiReview },
  mni: { common: mniCommon, identity: mniIdentity, consent: mniConsent, intake: mniIntake, scanner: mniScanner, review: mniReview },
  ne: { common: neCommon, identity: neIdentity, consent: neConsent, intake: neIntake, scanner: neScanner, review: neReview },
  or: { common: orCommon, identity: orIdentity, consent: orConsent, intake: orIntake, scanner: orScanner, review: orReview },
  sa: { common: saCommon, identity: saIdentity, consent: saConsent, intake: saIntake, scanner: saScanner, review: saReview },
  sat: { common: satCommon, identity: satIdentity, consent: satConsent, intake: satIntake, scanner: satScanner, review: satReview },
  sd: { common: sdCommon, identity: sdIdentity, consent: sdConsent, intake: sdIntake, scanner: sdScanner, review: sdReview },
  ur: { common: urCommon, identity: urIdentity, consent: urConsent, intake: urIntake, scanner: urScanner, review: urReview }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'identity', 'consent', 'intake', 'scanner', 'review'],
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
