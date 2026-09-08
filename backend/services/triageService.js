// Low-Latency Parallel Red-Flag & Emergency Triage Analyzer (<15ms evaluation)

const RED_FLAG_RULES = [
  {
    id: 'ACS_CARDIO',
    severity: 'CRITICAL',
    title: 'Suspected Acute Coronary Syndrome / Myocardial Infarction',
    keywords: ['chest pain', 'chest pressure', 'crushing', 'left arm', 'radiating to jaw', 'sweating heavily', 'diaphoresis', 'angina', 'छाती में दर्द', 'நெஞ்சு வலி'],
    minMatchCount: 2,
    recommendedAction: 'Immediate ECG in Room 104, Stretcher dispatch to Kiosk, alert On-Duty Cardiologist.'
  },
  {
    id: 'STROKE_NEURO',
    severity: 'CRITICAL',
    title: 'Suspected Acute Stroke / FAST Protocol Alert',
    keywords: ['facial droop', 'arm weakness', 'slurred speech', 'sudden numbness', 'loss of vision', 'लकवा', 'பேச்சு குளறல்'],
    minMatchCount: 1,
    recommendedAction: 'Activate Code FAST, mobilize Stroke Team, prepare emergency Non-Contrast CT Brain.'
  },
  {
    id: 'ACUTE_RESPIRATORY_DISTRESS',
    severity: 'CRITICAL',
    title: 'Severe Respiratory Distress / Impending Respiratory Failure',
    keywords: ['cannot breathe', 'gasping for air', 'stridor', 'blue lips', 'severe breathlessness', 'सांस फूलना', 'மூச்சுத்திணறல்'],
    minMatchCount: 1,
    recommendedAction: 'Immediate O2 support via High-Flow Mask, SpO2 monitor, alert Pulmonology.'
  },
  {
    id: 'ANAPHYLAXIS',
    severity: 'CRITICAL',
    title: 'Severe Anaphylaxis / Airway Compromise',
    keywords: ['throat closing', 'swollen tongue', 'difficulty swallowing', 'hives all over', 'allergy injection'],
    minMatchCount: 2,
    recommendedAction: 'Prepare IM Adrenaline 0.5mg (1:1000), transfer to Resuscitation Bay immediately.'
  },
  {
    id: 'ACUTE_ABDOMEN_HEMORRHAGE',
    severity: 'HIGH',
    title: 'Acute Surgical Abdomen / Gastrointestinal Bleeding',
    keywords: ['vomiting blood', 'black tarry stools', 'rigid abdomen', 'severe sudden abdominal pain', 'खून की उल्टी'],
    minMatchCount: 1,
    recommendedAction: 'NPO immediately, secure 2 large bore IV cannulas, alert General Surgery Registrar.'
  }
];

export function analyzeRedFlags(text = '', answers = {}) {
  const normalizedText = (text + ' ' + Object.values(answers).join(' ')).toLowerCase();
  const matchedAlerts = [];

  for (const rule of RED_FLAG_RULES) {
    let matches = 0;
    const foundKeywords = [];

    for (const kw of rule.keywords) {
      if (normalizedText.includes(kw.toLowerCase())) {
        matches++;
        foundKeywords.push(kw);
      }
    }

    if (matches >= rule.minMatchCount) {
      matchedAlerts.push({
        ruleId: rule.id,
        severity: rule.severity,
        title: rule.title,
        matchedKeywords: foundKeywords,
        recommendedAction: rule.recommendedAction
      });
    }
  }

  const isRedFlag = matchedAlerts.length > 0;
  const highestSeverity = matchedAlerts.some(a => a.severity === 'CRITICAL') ? 'CRITICAL' : (isRedFlag ? 'HIGH' : 'NONE');

  return {
    isRedFlag,
    severity: highestSeverity,
    alerts: matchedAlerts,
    summaryReason: matchedAlerts.map(a => `${a.title} (${a.matchedKeywords.join(', ')})`).join(' | ') || null
  };
}
