import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English
import enCommon from './locales/en/common.json';
import enIdentity from './locales/en/identity.json';
import enConsent from './locales/en/consent.json';
import enIntake from './locales/en/intake.json';
import enScanner from './locales/en/scanner.json';
import enReview from './locales/en/review.json';

// Hindi
import hiCommon from './locales/hi/common.json';
import hiIdentity from './locales/hi/identity.json';
import hiConsent from './locales/hi/consent.json';
import hiIntake from './locales/hi/intake.json';
import hiScanner from './locales/hi/scanner.json';
import hiReview from './locales/hi/review.json';

// Tamil
import taCommon from './locales/ta/common.json';
import taIdentity from './locales/ta/identity.json';
import taConsent from './locales/ta/consent.json';
import taIntake from './locales/ta/intake.json';
import taScanner from './locales/ta/scanner.json';
import taReview from './locales/ta/review.json';

// Telugu
import teCommon from './locales/te/common.json';
import teIdentity from './locales/te/identity.json';
import teConsent from './locales/te/consent.json';
import teIntake from './locales/te/intake.json';
import teScanner from './locales/te/scanner.json';
import teReview from './locales/te/review.json';

// Bengali
import bnCommon from './locales/bn/common.json';
import bnIdentity from './locales/bn/identity.json';
import bnConsent from './locales/bn/consent.json';
import bnIntake from './locales/bn/intake.json';
import bnScanner from './locales/bn/scanner.json';
import bnReview from './locales/bn/review.json';

// Marathi
import mrCommon from './locales/mr/common.json';
import mrIdentity from './locales/mr/identity.json';
import mrConsent from './locales/mr/consent.json';
import mrIntake from './locales/mr/intake.json';
import mrScanner from './locales/mr/scanner.json';
import mrReview from './locales/mr/review.json';

// Gujarati
import guCommon from './locales/gu/common.json';
import guIdentity from './locales/gu/identity.json';
import guConsent from './locales/gu/consent.json';
import guIntake from './locales/gu/intake.json';
import guScanner from './locales/gu/scanner.json';
import guReview from './locales/gu/review.json';

// Kannada
import knCommon from './locales/kn/common.json';
import knIdentity from './locales/kn/identity.json';
import knConsent from './locales/kn/consent.json';
import knIntake from './locales/kn/intake.json';
import knScanner from './locales/kn/scanner.json';
import knReview from './locales/kn/review.json';

// Malayalam
import mlCommon from './locales/ml/common.json';
import mlIdentity from './locales/ml/identity.json';
import mlConsent from './locales/ml/consent.json';
import mlIntake from './locales/ml/intake.json';
import mlScanner from './locales/ml/scanner.json';
import mlReview from './locales/ml/review.json';

// Punjabi
import paCommon from './locales/pa/common.json';
import paIdentity from './locales/pa/identity.json';
import paConsent from './locales/pa/consent.json';
import paIntake from './locales/pa/intake.json';
import paScanner from './locales/pa/scanner.json';
import paReview from './locales/pa/review.json';

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
  pa: { common: paCommon, identity: paIdentity, consent: paConsent, intake: paIntake, scanner: paScanner, review: paReview }
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
