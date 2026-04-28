// Country stamp configurations — vintage themed per country
// Each has a color palette and a short iconic label
const COUNTRY_STAMPS = {
  // Europe
  'France': { color: '#1B3A6B', accent: '#C4A35A', icon: '⚜', label: 'FRANCE', subtext: 'RÉPUBLIQUE FRANÇAISE' },
  'Italy': { color: '#2D5A3D', accent: '#C4A35A', icon: '✦', label: 'ITALIA', subtext: 'REPUBBLICA ITALIANA' },
  'Spain': { color: '#8B2500', accent: '#E8C547', icon: '☀', label: 'ESPAÑA', subtext: 'REINO DE ESPAÑA' },
  'Portugal': { color: '#1B5E3B', accent: '#E74C3C', icon: '✦', label: 'PORTUGAL', subtext: 'REPÚBLICA PORTUGUESA' },
  'United Kingdom': { color: '#1C3150', accent: '#C8102E', icon: '♛', label: 'UNITED KINGDOM', subtext: 'GOD SAVE THE KING' },
  'Germany': { color: '#1A1A1A', accent: '#E8C547', icon: '✦', label: 'DEUTSCHLAND', subtext: 'BUNDESREPUBLIK' },
  'Netherlands': { color: '#1B3A6B', accent: '#FF6B35', icon: '✿', label: 'NEDERLAND', subtext: 'KONINKRIJK' },
  'Greece': { color: '#1B3A6B', accent: '#FFFFFF', icon: '☼', label: 'ΕΛΛΆΔΑ', subtext: 'HELLENIC REPUBLIC' },
  'Croatia': { color: '#1B3A6B', accent: '#E74C3C', icon: '✦', label: 'HRVATSKA', subtext: 'REPUBLIC OF CROATIA' },
  'Turkey': { color: '#C8102E', accent: '#FFFFFF', icon: '☪', label: 'TÜRKİYE', subtext: 'REPUBLIC OF TURKEY' },
  'Czech Republic': { color: '#1B3A6B', accent: '#E74C3C', icon: '✦', label: 'ČESKO', subtext: 'CZECH REPUBLIC' },
  'Austria': { color: '#C8102E', accent: '#FFFFFF', icon: '✦', label: 'ÖSTERREICH', subtext: 'REPUBLIC OF AUSTRIA' },
  'Switzerland': { color: '#C8102E', accent: '#FFFFFF', icon: '✚', label: 'SCHWEIZ', subtext: 'CONFOEDERATIO HELVETICA' },
  'Ireland': { color: '#1B5E3B', accent: '#FF8C00', icon: '☘', label: 'ÉIRE', subtext: 'REPUBLIC OF IRELAND' },
  'Denmark': { color: '#C8102E', accent: '#FFFFFF', icon: '✦', label: 'DANMARK', subtext: 'KINGDOM OF DENMARK' },
  'Sweden': { color: '#1B3A6B', accent: '#FECC02', icon: '✦', label: 'SVERIGE', subtext: 'KINGDOM OF SWEDEN' },
  'Norway': { color: '#1B3A6B', accent: '#C8102E', icon: '✦', label: 'NORGE', subtext: 'KINGDOM OF NORWAY' },
  'Finland': { color: '#1B3A6B', accent: '#FFFFFF', icon: '✦', label: 'SUOMI', subtext: 'REPUBLIC OF FINLAND' },
  'Iceland': { color: '#1B3A6B', accent: '#C8102E', icon: '✦', label: 'ÍSLAND', subtext: 'REPUBLIC OF ICELAND' },
  'Poland': { color: '#C8102E', accent: '#FFFFFF', icon: '✦', label: 'POLSKA', subtext: 'REPUBLIC OF POLAND' },
  'Hungary': { color: '#1B5E3B', accent: '#C8102E', icon: '✦', label: 'MAGYARORSZÁG', subtext: 'REPUBLIC OF HUNGARY' },
  'Belgium': { color: '#1A1A1A', accent: '#E8C547', icon: '✦', label: 'BELGIQUE', subtext: 'KINGDOM OF BELGIUM' },
  'Montenegro': { color: '#C8102E', accent: '#C4A35A', icon: '✦', label: 'CRNA GORA', subtext: 'MONTENEGRO' },
  'Malta': { color: '#C8102E', accent: '#FFFFFF', icon: '✚', label: 'MALTA', subtext: 'REPUBLIC OF MALTA' },
  'Monaco': { color: '#C8102E', accent: '#FFFFFF', icon: '✦', label: 'MONACO', subtext: 'PRINCIPAUTÉ' },
  'Estonia': { color: '#1B3A6B', accent: '#1A1A1A', icon: '✦', label: 'EESTI', subtext: 'REPUBLIC OF ESTONIA' },
  'Latvia': { color: '#8B2500', accent: '#FFFFFF', icon: '✦', label: 'LATVIJA', subtext: 'REPUBLIC OF LATVIA' },

  // Asia
  'Japan': { color: '#1A1A1A', accent: '#C8102E', icon: '⛩', label: '日本', subtext: 'JAPAN · NIPPON' },
  'Thailand': { color: '#1B3A6B', accent: '#C8102E', icon: '✦', label: 'ไทย', subtext: 'KINGDOM OF THAILAND' },
  'Indonesia': { color: '#C8102E', accent: '#FFFFFF', icon: '✦', label: 'INDONESIA', subtext: 'REPUBLIC OF INDONESIA' },
  'Singapore': { color: '#C8102E', accent: '#FFFFFF', icon: '☽', label: 'SINGAPORE', subtext: 'REPUBLIC OF SINGAPORE' },
  'China': { color: '#C8102E', accent: '#E8C547', icon: '✦', label: '中国', subtext: "PEOPLE'S REPUBLIC OF CHINA" },
  'South Korea': { color: '#1B3A6B', accent: '#C8102E', icon: '☯', label: '한국', subtext: 'REPUBLIC OF KOREA' },
  'Vietnam': { color: '#C8102E', accent: '#E8C547', icon: '★', label: 'VIỆT NAM', subtext: 'SOCIALIST REPUBLIC' },
  'India': { color: '#1B5E3B', accent: '#FF8C00', icon: '✦', label: 'भारत', subtext: 'REPUBLIC OF INDIA' },
  'Cambodia': { color: '#1B3A6B', accent: '#C8102E', icon: '✦', label: 'កម្ពុជា', subtext: 'KINGDOM OF CAMBODIA' },
  'Malaysia': { color: '#1B3A6B', accent: '#E8C547', icon: '☽', label: 'MALAYSIA', subtext: 'FEDERATION OF MALAYSIA' },
  'Philippines': { color: '#1B3A6B', accent: '#E8C547', icon: '★', label: 'PILIPINAS', subtext: 'REPUBLIC OF THE PHILIPPINES' },
  'Nepal': { color: '#1B3A6B', accent: '#C8102E', icon: '▲', label: 'नेपाल', subtext: 'FEDERAL DEMOCRATIC REPUBLIC' },
  'Taiwan': { color: '#1B3A6B', accent: '#C8102E', icon: '✦', label: '臺灣', subtext: 'REPUBLIC OF CHINA' },
  'Maldives': { color: '#1B5E3B', accent: '#C8102E', icon: '☽', label: 'MALDIVES', subtext: 'REPUBLIC OF MALDIVES' },
  'Sri Lanka': { color: '#8B2500', accent: '#E8C547', icon: '✦', label: 'CEYLON', subtext: 'SRI LANKA' },

  // Middle East
  'UAE': { color: '#1A1A1A', accent: '#C4A35A', icon: '✦', label: 'الإمارات', subtext: 'UNITED ARAB EMIRATES' },
  'Israel': { color: '#1B3A6B', accent: '#FFFFFF', icon: '✡', label: 'ISRAEL', subtext: 'מדינת ישראל' },
  'Jordan': { color: '#1A1A1A', accent: '#C8102E', icon: '★', label: 'الأردن', subtext: 'HASHEMITE KINGDOM' },
  'Qatar': { color: '#8B2500', accent: '#FFFFFF', icon: '✦', label: 'QATAR', subtext: 'STATE OF QATAR' },
  'Oman': { color: '#1B5E3B', accent: '#C8102E', icon: '✦', label: 'عمان', subtext: 'SULTANATE OF OMAN' },

  // Africa
  'South Africa': { color: '#1B5E3B', accent: '#E8C547', icon: '✦', label: 'SOUTH AFRICA', subtext: 'REPUBLIC OF SOUTH AFRICA' },
  'Morocco': { color: '#C8102E', accent: '#1B5E3B', icon: '★', label: 'المغرب', subtext: 'KINGDOM OF MOROCCO' },
  'Egypt': { color: '#C4A35A', accent: '#1A1A1A', icon: '△', label: 'مصر', subtext: 'ARAB REPUBLIC OF EGYPT' },
  'Kenya': { color: '#1A1A1A', accent: '#C8102E', icon: '✦', label: 'KENYA', subtext: 'REPUBLIC OF KENYA' },
  'Tanzania': { color: '#1B3A6B', accent: '#1B5E3B', icon: '✦', label: 'TANZANIA', subtext: 'UNITED REPUBLIC' },
  'Ghana': { color: '#1B5E3B', accent: '#E8C547', icon: '★', label: 'GHANA', subtext: 'REPUBLIC OF GHANA' },
  'Nigeria': { color: '#1B5E3B', accent: '#FFFFFF', icon: '✦', label: 'NIGERIA', subtext: 'FEDERAL REPUBLIC' },
  'Mauritius': { color: '#1B3A6B', accent: '#C8102E', icon: '✦', label: 'MAURITIUS', subtext: 'REPUBLIC OF MAURITIUS' },
  'Seychelles': { color: '#1B3A6B', accent: '#1B5E3B', icon: '✦', label: 'SEYCHELLES', subtext: 'REPUBLIC OF SEYCHELLES' },
  'Zimbabwe': { color: '#1B5E3B', accent: '#E8C547', icon: '✦', label: 'ZIMBABWE', subtext: 'REPUBLIC OF ZIMBABWE' },
  'Madagascar': { color: '#1B5E3B', accent: '#C8102E', icon: '✦', label: 'MADAGASIKARA', subtext: 'REPUBLIC OF MADAGASCAR' },

  // North America
  'USA': { color: '#1B3A6B', accent: '#C8102E', icon: '★', label: 'USA', subtext: 'UNITED STATES OF AMERICA' },
  'Canada': { color: '#C8102E', accent: '#FFFFFF', icon: '🍁', label: 'CANADA', subtext: 'DOMINION OF CANADA' },
  'Mexico': { color: '#1B5E3B', accent: '#C8102E', icon: '✦', label: 'MÉXICO', subtext: 'ESTADOS UNIDOS MEXICANOS' },
  'Cuba': { color: '#1B3A6B', accent: '#C8102E', icon: '★', label: 'CUBA', subtext: 'REPÚBLICA DE CUBA' },
  'Jamaica': { color: '#1B5E3B', accent: '#E8C547', icon: '✦', label: 'JAMAICA', subtext: 'OUT OF MANY ONE PEOPLE' },
  'Bahamas': { color: '#00778B', accent: '#E8C547', icon: '✦', label: 'BAHAMAS', subtext: 'COMMONWEALTH' },
  'Barbados': { color: '#1B3A6B', accent: '#E8C547', icon: '✦', label: 'BARBADOS', subtext: 'PRIDE AND INDUSTRY' },
  'Puerto Rico': { color: '#1B3A6B', accent: '#C8102E', icon: '★', label: 'PUERTO RICO', subtext: 'ISLA DEL ENCANTO' },
  'Aruba': { color: '#1B3A6B', accent: '#E8C547', icon: '★', label: 'ARUBA', subtext: 'ONE HAPPY ISLAND' },
  'St. Lucia': { color: '#00778B', accent: '#E8C547', icon: '✦', label: 'ST. LUCIA', subtext: 'THE HELEN OF THE WEST' },
  'Turks and Caicos': { color: '#1B3A6B', accent: '#E8C547', icon: '✦', label: 'TCI', subtext: 'TURKS AND CAICOS' },

  // Central & South America
  'Argentina': { color: '#74ACDF', accent: '#E8C547', icon: '☀', label: 'ARGENTINA', subtext: 'REPÚBLICA ARGENTINA' },
  'Brazil': { color: '#1B5E3B', accent: '#E8C547', icon: '✦', label: 'BRASIL', subtext: 'REPÚBLICA FEDERATIVA' },
  'Colombia': { color: '#E8C547', accent: '#1B3A6B', icon: '✦', label: 'COLOMBIA', subtext: 'REPÚBLICA DE COLOMBIA' },
  'Peru': { color: '#C8102E', accent: '#FFFFFF', icon: '✦', label: 'PERÚ', subtext: 'REPÚBLICA DEL PERÚ' },
  'Chile': { color: '#1B3A6B', accent: '#C8102E', icon: '★', label: 'CHILE', subtext: 'REPÚBLICA DE CHILE' },
  'Ecuador': { color: '#E8C547', accent: '#1B3A6B', icon: '✦', label: 'ECUADOR', subtext: 'REPÚBLICA DEL ECUADOR' },
  'Uruguay': { color: '#1B3A6B', accent: '#E8C547', icon: '☀', label: 'URUGUAY', subtext: 'REPÚBLICA ORIENTAL' },
  'Costa Rica': { color: '#1B3A6B', accent: '#C8102E', icon: '✦', label: 'COSTA RICA', subtext: 'PURA VIDA' },
  'Panama': { color: '#1B3A6B', accent: '#C8102E', icon: '★', label: 'PANAMÁ', subtext: 'REPÚBLICA DE PANAMÁ' },

  // Oceania
  'Australia': { color: '#1B3A6B', accent: '#FFFFFF', icon: '★', label: 'AUSTRALIA', subtext: 'COMMONWEALTH OF AUSTRALIA' },
  'New Zealand': { color: '#1A1A1A', accent: '#FFFFFF', icon: '★', label: 'AOTEAROA', subtext: 'NEW ZEALAND' },
  'Fiji': { color: '#00778B', accent: '#FFFFFF', icon: '✦', label: 'FIJI', subtext: 'REPUBLIC OF FIJI' },
  'French Polynesia': { color: '#C8102E', accent: '#1B3A6B', icon: '✦', label: 'POLYNÉSIE', subtext: 'FRENCH POLYNESIA' },
}

// Fallback for countries not in the list
const DEFAULT_STAMP = { color: '#1C3829', accent: '#C4A35A', icon: '✦', subtext: '' }

export function getStampConfig(country) {
  return COUNTRY_STAMPS[country] || { ...DEFAULT_STAMP, label: country?.toUpperCase() || '?', subtext: country || '' }
}

export default COUNTRY_STAMPS
