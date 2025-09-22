/**
 * Rule-based classification engine for rapid email categorization
 * Uses keyword matching and regex patterns with heuristic scoring
 */

export interface RuleMatch {
  category: string;
  score: number; // 0..1
  matchedPatterns: string[];
}

export type RuleCategory = 
  | "Termin"
  | "Terminabsage"
  | "AU"
  | "Rezept"
  | "Allgemeine Frage"
  | "Sonstiges";

interface Rule {
  category: RuleCategory;
  keywords: string[];
  patterns: RegExp[];
  weight: number; // importance multiplier
}

// German keywords and patterns for each category
const RULES: Rule[] = [
  {
    category: "Termin",
    keywords: [
      "termin", "appointment", "sprechstunde", "vereinbaren", "buchen",
      "wann", "uhrzeiten", "verfügbar", "möglich", "zeit", "datum",
      "nächste woche", "morgen", "übermorgen", "montag", "dienstag",
      "mittwoch", "donnerstag", "freitag", "januar", "februar", "märz",
      "april", "mai", "juni", "juli", "august", "september", "oktober",
      "november", "dezember"
    ],
    patterns: [
      /\btermin\s*(vereinbaren|buchen|machen|haben|bekommen)\b/i,
      /\b(nächst|kommend|folgen)en?\s*(montag|dienstag|mittwoch|donnerstag|freitag|woche)\b/i,
      /\b\d{1,2}\.\s*(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)\b/i,
      /\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/, // date patterns
      /\b\d{1,2}:\d{2}\s*(uhr)?\b/i, // time patterns
      /\b(vormittag|nachmittag|morgen|abend)s?\b/i,
      /\bsprechstunde\b/i,
      /\bwann\s*(kann|könnte|würde|darf|soll)\b/i
    ],
    weight: 1.2
  },
  {
    category: "Terminabsage",
    keywords: [
      "absagen", "stornieren", "verschieben", "ändern", "umbuchen",
      "nicht kommen", "verhindern", "cancel", "leider", "krankheit",
      "notfall", "anderer termin", "umplanen", "neu vereinbaren"
    ],
    patterns: [
      /\btermin\s*(absagen|stornieren|verschieben|ändern|umbuchen)\b/i,
      /\b(kann|muss|möchte)\s*(den|meinen|unseren)?\s*termin\s*(nicht|leider)\b/i,
      /\bleider\s*(nicht|keine zeit|verhindert)\b/i,
      /\b(bin|werde)\s*(krank|verhindert|nicht kommen)\b/i,
      /\btermin\s*am\s*\d{1,2}\.\d{1,2}\.\s*(absagen|verschieben)\b/i,
      /\bnicht\s*(erscheinen|kommen|wahrnehmen)\s*können\b/i
    ],
    weight: 1.3
  },
  {
    category: "AU",
    keywords: [
      "arbeitsunfähigkeit", "krankschreibung", "krankgeschrieben", "au",
      "arbeitsunfähig", "krank", "bescheinigung", "attest", "verlängern",
      "verlängerung", "folgebescheinigung", "erstbescheinigung", "gelber schein",
      "krankmeldung", "krankheit", "tage krank"
    ],
    patterns: [
      /\b(arbeitsunfähigkeits?|au)(-|\s)?(bescheinigung|attest)\b/i,
      /\bkrank(geschrieben|schreibung|meldung)\b/i,
      /\b(bin|seit|werde)\s*(krank|arbeitsunfähig)\b/i,
      /\bau\s*(verlängern|verlängerung|benötige|brauche)\b/i,
      /\b(gelber|gelben)\s*schein\b/i,
      /\bfolgebescheinigung\b/i,
      /\b\d+\s*tage?\s*(krank|arbeitsunfähig)\b/i,
      /\bseit\s*\d{1,2}\.\d{1,2}\.\s*krank\b/i
    ],
    weight: 1.2
  },
  {
    category: "Rezept",
    keywords: [
      "rezept", "medikament", "verschreibung", "verordnung", "tabletten",
      "tropfen", "salbe", "insulin", "antibiotika", "schmerzmittel",
      "blutdruck", "ausstellen", "benötige", "brauche", "mg", "dosierung",
      "packung", "medizin", "arznei", "präparat"
    ],
    patterns: [
      /\brezept\s*(für|benötige|brauche|ausstellen)\b/i,
      /\b(medikament|tabletten|tropfen|salbe|insulin)\s*(benötige|brauche|verschreiben)\b/i,
      /\b\d+\s*mg\b/i, // dosage patterns
      /\b(ibuprofen|paracetamol|aspirin|amoxicillin|metformin)\b/i, // common medications
      /\bneues?\s*rezept\b/i,
      /\bverordnung\s*(für|von)\b/i,
      /\b(folge|dauer|wieder)rezept\b/i,
      /\bmedikament\s*\w+\s*(geht|alle|leer|aufgebraucht)\b/i
    ],
    weight: 1.2
  },
  {
    category: "Allgemeine Frage",
    keywords: [
      "frage", "information", "wissen", "erklären", "bedeutet", "was ist",
      "wie funktioniert", "können sie", "hilfe", "beratung", "rat",
      "empfehlung", "meinung", "symptom", "beschwerden", "schmerzen"
    ],
    patterns: [
      /\b(was|wie|wann|wo|warum|welche)\s*(ist|sind|kann|soll|muss)\b/i,
      /\b(könnte|können\s*sie)\s*(mir|uns)?\s*(erklären|sagen|helfen)\b/i,
      /\bhabe\s*(eine\s*)?frage\b/i,
      /\b(information|auskunft)\s*(über|zu|bezüglich)\b/i,
      /\bwas\s*bedeutet\b/i,
      /\bsymptome?\s*(von|bei|für)\b/i,
      /\b(kopf|bauch|rücken|hals)?schmerzen\b/i,
      /\bseit\s*\d+\s*(tagen|wochen)\s*(beschwerden|probleme)\b/i
    ],
    weight: 0.8
  }
];

/**
 * Normalize text for better matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\w\s\d.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate match score for a single rule
 */
function calculateRuleScore(text: string, normalizedText: string, rule: Rule): {
  score: number;
  matchedPatterns: string[];
} {
  const matchedPatterns: string[] = [];
  let keywordMatches = 0;
  let patternMatches = 0;

  // Check keywords
  for (const keyword of rule.keywords) {
    if (normalizedText.includes(keyword)) {
      keywordMatches++;
      matchedPatterns.push(`keyword: ${keyword}`);
    }
  }

  // Check regex patterns
  for (const pattern of rule.patterns) {
    if (pattern.test(text) || pattern.test(normalizedText)) {
      patternMatches++;
      matchedPatterns.push(`pattern: ${pattern.source}`);
    }
  }

  // Calculate base score
  const keywordScore = keywordMatches > 0 ? Math.min(keywordMatches / 3, 1) * 0.4 : 0;
  const patternScore = patternMatches > 0 ? Math.min(patternMatches / 2, 1) * 0.6 : 0;
  
  let score = (keywordScore + patternScore) * rule.weight;

  // Bonus for multiple matches
  if (keywordMatches > 2 && patternMatches > 0) {
    score = Math.min(score * 1.2, 1);
  }

  return {
    score: Math.min(score, 1),
    matchedPatterns
  };
}

/**
 * Classify email using rule-based approach
 */
export function classifyWithRules(emailContent: string): RuleMatch {
  const normalizedText = normalizeText(emailContent);
  const matches: RuleMatch[] = [];

  for (const rule of RULES) {
    const { score, matchedPatterns } = calculateRuleScore(emailContent, normalizedText, rule);
    
    if (score > 0) {
      matches.push({
        category: rule.category,
        score,
        matchedPatterns
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // If no matches or very low confidence, return "Sonstiges"
  if (matches.length === 0 || matches[0].score < 0.1) {
    return {
      category: "Sonstiges",
      score: 0,
      matchedPatterns: []
    };
  }

  return matches[0];
}

/**
 * Check if multiple intents are detected (mixed intent)
 */
export function detectMixedIntent(emailContent: string): boolean {
  const normalizedText = normalizeText(emailContent);
  const significantMatches: string[] = [];

  for (const rule of RULES) {
    const { score } = calculateRuleScore(emailContent, normalizedText, rule);
    
    // Count categories with significant scores
    if (score > 0.3 && rule.category !== "Allgemeine Frage" && rule.category !== "Sonstiges") {
      significantMatches.push(rule.category);
    }
  }

  return significantMatches.length > 1;
}

/**
 * Detect if email is in foreign language (non-German)
 */
export function detectForeignLanguage(emailContent: string): boolean {
  const germanPatterns = [
    /\b(der|die|das|den|dem|des|ein|eine|einen|einem|eines)\b/i,
    /\b(ich|du|er|sie|es|wir|ihr|sie)\b/i,
    /\b(und|oder|aber|weil|wenn|dass|ob|als)\b/i,
    /\b(haben|sein|werden|können|müssen|sollen|wollen|dürfen)\b/i,
    /\b(nicht|kein|keine|keinen|keinem|keines)\b/i
  ];

  const foreignIndicators = [
    /\b(the|and|or|but|with|from|for|this|that|have|has|will|would|could|should)\b/i,
    /\b(le|la|les|de|et|ou|avec|pour|dans|sur)\b/i,
    /\b(el|la|los|las|y|o|con|para|por|en)\b/i,
    /\b(il|lo|la|i|gli|le|e|o|con|per|da)\b/i
  ];

  let germanMatches = 0;
  let foreignMatches = 0;

  for (const pattern of germanPatterns) {
    if (pattern.test(emailContent)) {
      germanMatches++;
    }
  }

  for (const pattern of foreignIndicators) {
    if (pattern.test(emailContent)) {
      foreignMatches++;
    }
  }

  // Simple heuristic: if foreign matches significantly outweigh German matches
  return foreignMatches > germanMatches * 2 && germanMatches < 2;
}