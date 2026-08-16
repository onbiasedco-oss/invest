// Stock ratings data based on Company Health, Company Performance, and Overall ratings
// Company Health rating is based on EPS, P/E, D/E, FCF, and Margin scores

export interface HealthMetrics {
  epsScore: number;
  peScore: number;
  deScore: number;
  fcfScore: number;
  marginScore: number;
}

export interface StockRating {
  symbol: string;
  name: string;
  companyHealth: number;
  companyPerformance: number;
  overall: number;
  tier: 'top' | 'high' | 'mid-high' | 'mid' | 'lower' | 'lowest';
  industry: string;
  currentPrice: number;
  healthMetrics: HealthMetrics;
  companyInfo: {
    description: string;
    founded: string;
    headquarters: string;
    ceo: string;
    employees: string;
    website: string;
  };
}

export const healthMetricExplanations = {
  eps: {
    name: 'EPS Score (Earnings Per Share)',
    description: 'Measures the company\'s profitability on a per-share basis. A higher EPS indicates greater profitability and value for shareholders. Score of 5 means excellent earnings growth, while 1 indicates poor or negative earnings.',
    formula: 'Net Income / Outstanding Shares'
  },
  pe: {
    name: 'P/E Score (Price-to-Earnings Ratio)',
    description: 'Compares the stock price to its earnings per share. A lower P/E may indicate an undervalued stock, while a higher P/E suggests growth expectations. Score of 5 means attractively valued, while 1 indicates potentially overvalued.',
    formula: 'Stock Price / Earnings Per Share'
  },
  de: {
    name: 'D/E Score (Debt-to-Equity Ratio)',
    description: 'Measures financial leverage by comparing total debt to shareholders\' equity. A lower ratio indicates less risk and stronger financial health. Score of 5 means low debt burden, while 1 indicates high leverage.',
    formula: 'Total Debt / Shareholders\' Equity'
  },
  fcf: {
    name: 'FCF Score (Free Cash Flow)',
    description: 'Represents cash generated after capital expenditures. Strong FCF indicates the company can fund growth, pay dividends, and reduce debt. Score of 5 means excellent cash generation, while 1 indicates poor cash flow.',
    formula: 'Operating Cash Flow - Capital Expenditures'
  },
  margin: {
    name: 'Profit Margin Score',
    description: 'Shows what percentage of revenue becomes profit. Higher margins indicate efficient operations and pricing power. Score of 5 means industry-leading margins, while 1 indicates thin or negative margins.',
    formula: 'Net Income / Revenue × 100'
  }
};

export const industries = [
  'All Industries',
  'Technology',
  'Semiconductors',
  'Financial Services',
  'Healthcare',
  'Consumer Cyclical',
  'Communication Services',
  'Industrials',
  'Consumer Defensive',
  'Energy',
  'E-Commerce',
  'Software',
  'Automotive',
  'Cryptocurrency',
  'Aerospace & Defense',
  'Biotechnology',
  'Data Analytics',
  'Cloud Computing',
  'Entertainment',
  'Retail',
  'Telecommunications'
];

// Function to get simulated current price with hourly variation
// Uses a deterministic algorithm based on the current hour to ensure consistency
export const getSimulatedPrice = (basePrice: number, symbol: string): { price: number; change: number; changePercent: number } => {
  const now = new Date();
  const hourSeed = now.getUTCFullYear() * 1000000 + 
                   (now.getUTCMonth() + 1) * 10000 + 
                   now.getUTCDate() * 100 + 
                   now.getUTCHours();
  
  // Create a pseudo-random variation based on symbol and hour
  let hash = 0;
  const seedStr = symbol + hourSeed.toString();
  for (let i = 0; i < seedStr.length; i++) {
    const char = seedStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Generate a variation between -2% and +2%
  const variation = ((Math.abs(hash) % 400) - 200) / 10000;
  const price = basePrice * (1 + variation);
  const change = price - basePrice;
  const changePercent = variation * 100;
  
  return {
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2))
  };
};

// Get the last update time (current hour)
export const getLastPriceUpdate = (): string => {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString();
};

export const stockRatings: StockRating[] = [
  // Top tier (Overall 9+)
  { 
    symbol: 'GOOGL', 
    name: 'Alphabet (Google)', 
    companyHealth: 4.4, 
    companyPerformance: 5, 
    overall: 9.4, 
    tier: 'top', 
    industry: 'Technology',
    currentPrice: 191.41,
    healthMetrics: { epsScore: 4, peScore: 3, deScore: 5, fcfScore: 5, marginScore: 5 },
    companyInfo: {
      description: 'Alphabet Inc. is a multinational technology conglomerate holding company. It is the parent company of Google and several former Google subsidiaries, including YouTube, Waymo, and DeepMind.',
      founded: '2015 (Google: 1998)',
      headquarters: 'Mountain View, California, USA',
      ceo: 'Sundar Pichai',
      employees: '182,000+',
      website: 'https://abc.xyz'
    }
  },

  { 
    symbol: 'AMAT', 
    name: 'Applied Materials', 
    companyHealth: 4.2, 
    companyPerformance: 5, 
    overall: 9.2, 
    tier: 'top', 
    industry: 'Semiconductors',
    currentPrice: 178.45,
    healthMetrics: { epsScore: 5, peScore: 3, deScore: 5, fcfScore: 5, marginScore: 3 },

    companyInfo: {
      description: 'Applied Materials, Inc. is a leading supplier of equipment, services, and software for the semiconductor, display, and related industries. It provides manufacturing equipment, services, and software to the global semiconductor industry.',
      founded: '1967',
      headquarters: 'Santa Clara, California, USA',
      ceo: 'Gary Dickerson',
      employees: '34,000+',
      website: 'https://appliedmaterials.com'
    }
  },
  { 
    symbol: 'MSFT', 
    name: 'Microsoft', 
    companyHealth: 4.2, 
    companyPerformance: 5, 
    overall: 9.2, 
    tier: 'top', 
    industry: 'Technology',
    currentPrice: 436.60,
    healthMetrics: { epsScore: 5, peScore: 2, deScore: 4, fcfScore: 5, marginScore: 5 },
    companyInfo: {
      description: 'Microsoft Corporation is a technology company that develops, licenses, and supports software, services, devices, and solutions. Products include Windows, Office 365, Azure cloud services, and Xbox gaming.',
      founded: '1975',
      headquarters: 'Redmond, Washington, USA',
      ceo: 'Satya Nadella',
      employees: '221,000+',
      website: 'https://microsoft.com'
    }
  },
  { 
    symbol: 'TSM', 
    name: 'TSMC', 
    companyHealth: 4.2, 
    companyPerformance: 5, 
    overall: 9.2, 
    tier: 'top', 
    industry: 'Semiconductors',
    currentPrice: 203.77,
    healthMetrics: { epsScore: 5, peScore: 2, deScore: 5, fcfScore: 4, marginScore: 5 },
    companyInfo: {
      description: 'Taiwan Semiconductor Manufacturing Company is the world\'s largest dedicated independent semiconductor foundry. It manufactures chips for companies like Apple, NVIDIA, AMD, and Qualcomm.',
      founded: '1987',
      headquarters: 'Hsinchu, Taiwan',
      ceo: 'C.C. Wei',
      employees: '73,000+',
      website: 'https://tsmc.com'
    }
  },
  { 
    symbol: 'AMGN', 
    name: 'Amgen',
    companyHealth: 4.6, 
    companyPerformance: 4.5, 
    overall: 9.1, 
    tier: 'top', 
    industry: 'Biotechnology',
    currentPrice: 278.92,
    healthMetrics: { epsScore: 3, peScore: 5, deScore: 5, fcfScore: 5, marginScore: 5 },

    companyInfo: {
      description: 'Amgen Inc. is a multinational biopharmaceutical company. It is one of the world\'s largest independent biotechnology companies, developing and manufacturing innovative human therapeutics.',
      founded: '1980',
      headquarters: 'Thousand Oaks, California, USA',
      ceo: 'Robert Bradway',
      employees: '27,000+',
      website: 'https://amgen.com'
    }
  },


  // High tier (Overall 8-8.9)
  { 
    symbol: 'NVDA', 
    name: 'NVIDIA', 
    companyHealth: 3.8, 
    companyPerformance: 5, 
    overall: 8.8, 
    tier: 'high', 
    industry: 'Semiconductors',
    currentPrice: 134.70,
    healthMetrics: { epsScore: 3, peScore: 1, deScore: 5, fcfScore: 5, marginScore: 5 },
    companyInfo: {
      description: 'NVIDIA Corporation designs and manufactures graphics processing units (GPUs) and system-on-chip units. The company is a leader in AI computing, data center solutions, and gaming graphics.',
      founded: '1993',
      headquarters: 'Santa Clara, California, USA',
      ceo: 'Jensen Huang',
      employees: '29,600+',
      website: 'https://nvidia.com'
    }
  },
  { 
    symbol: 'ASML', 
    name: 'ASML Holding', 
    companyHealth: 3.8, 
    companyPerformance: 5, 
    overall: 8.8, 
    tier: 'high', 
    industry: 'Semiconductors',
    currentPrice: 698.54,
    healthMetrics: { epsScore: 5, peScore: 2, deScore: 4, fcfScore: 4, marginScore: 5 },
    companyInfo: {
      description: 'ASML Holding N.V. is a Dutch multinational corporation that develops and manufactures photolithography systems used in the production of integrated circuits. It is the sole supplier of EUV lithography machines.',
      founded: '1984',
      headquarters: 'Veldhoven, Netherlands',
      ceo: 'Peter Wennink',
      employees: '42,000+',
      website: 'https://asml.com'
    }
  },
  { 
    symbol: 'KLAC', 
    name: 'KLA Corporation', 
    companyHealth: 3.8, 
    companyPerformance: 5, 
    overall: 8.8, 
    tier: 'high', 
    industry: 'Semiconductors',
    currentPrice: 712.34,
    healthMetrics: { epsScore: 5, peScore: 2, deScore: 3, fcfScore: 4, marginScore: 5 },
    companyInfo: {
      description: 'KLA Corporation is a leading supplier of process control and yield management solutions for the semiconductor and related nanoelectronics industries. It provides advanced inspection and metrology equipment.',
      founded: '1975',
      headquarters: 'Milpitas, California, USA',
      ceo: 'Rick Wallace',
      employees: '15,000+',
      website: 'https://kla.com'
    }
  },
  { 
    symbol: 'ADI', 
    name: 'Analog Devices', 
    companyHealth: 3.8, 
    companyPerformance: 5, 
    overall: 8.8, 
    tier: 'high', 
    industry: 'Semiconductors',
    currentPrice: 218.67,
    healthMetrics: { epsScore: 5, peScore: 2, deScore: 4, fcfScore: 4, marginScore: 4 },


    companyInfo: {
      description: 'Analog Devices, Inc. is a semiconductor company specializing in data conversion, signal processing, and power management technology. It serves industrial, automotive, consumer, and communications markets.',
      founded: '1965',
      headquarters: 'Wilmington, Massachusetts, USA',
      ceo: 'Vincent Roche',
      employees: '26,000+',
      website: 'https://analog.com'
    }
  },
  { 
    symbol: 'JPM', 
    name: 'JPMorgan Chase', 
    companyHealth: 4.2, 
    companyPerformance: 4.5, 
    overall: 8.7, 
    tier: 'high', 
    industry: 'Financial Services',
    currentPrice: 242.65,
    healthMetrics: { epsScore: 5, peScore: 3, deScore: 3, fcfScore: 3, marginScore: 4 },
    companyInfo: {
      description: 'JPMorgan Chase & Co. is a multinational investment bank and financial services holding company. It is the largest bank in the United States by assets and one of the most valuable banks in the world.',
      founded: '2000 (predecessors: 1799)',
      headquarters: 'New York City, New York, USA',
      ceo: 'Jamie Dimon',
      employees: '309,000+',
      website: 'https://jpmorganchase.com'
    }
  },
  { 
    symbol: 'UBER', 
    name: 'Uber', 
    companyHealth: 4.0, 
    companyPerformance: 4.5, 
    overall: 8.5, 
    tier: 'high', 
    industry: 'Technology',
    currentPrice: 60.89,
    healthMetrics: { epsScore: 3, peScore: 4, deScore: 3, fcfScore: 4, marginScore: 2 },
    companyInfo: {
      description: 'Uber Technologies, Inc. is a technology company that provides ride-hailing, food delivery (Uber Eats), package delivery, and freight transportation services through its mobile app platform.',
      founded: '2009',
      headquarters: 'San Francisco, California, USA',
      ceo: 'Dara Khosrowshahi',
      employees: '32,800+',
      website: 'https://uber.com'
    }
  },
  { 
    symbol: 'NVS', 
    name: 'Novartis AG', 
    companyHealth: 4.4, 
    companyPerformance: 4, 
    overall: 8.4, 
    tier: 'high', 
    industry: 'Healthcare',
    currentPrice: 101.23,
    healthMetrics: { epsScore: 5, peScore: 3, deScore: 5, fcfScore: 3, marginScore: 5 },
    companyInfo: {
      description: 'Novartis AG is a Swiss multinational pharmaceutical corporation. It is one of the largest pharmaceutical companies in the world, focusing on innovative medicines, generics, and eye care.',
      founded: '1996',
      headquarters: 'Basel, Switzerland',
      ceo: 'Vas Narasimhan',
      employees: '108,000+',
      website: 'https://novartis.com'
    }
  },
  { 
    symbol: 'AAPL', 
    name: 'Apple', 
    companyHealth: 3.4, 
    companyPerformance: 5, 
    overall: 8.4, 
    tier: 'high', 
    industry: 'Technology',
    currentPrice: 254.49,
    healthMetrics: { epsScore: 4, peScore: 2, deScore: 5, fcfScore: 5, marginScore: 4 },
    companyInfo: {
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories. Products include iPhone, Mac, iPad, Apple Watch, and services like Apple Music and iCloud.',
      founded: '1976',
      headquarters: 'Cupertino, California, USA',
      ceo: 'Tim Cook',
      employees: '164,000+',
      website: 'https://apple.com'
    }
  },
  { 
    symbol: 'AVGO', 
    name: 'Broadcom', 
    companyHealth: 3.4, 
    companyPerformance: 5, 
    overall: 8.4, 
    tier: 'high', 
    industry: 'Semiconductors',
    currentPrice: 224.15,
    healthMetrics: { epsScore: 5, peScore: 1, deScore: 2, fcfScore: 4, marginScore: 5 },
    companyInfo: {
      description: 'Broadcom Inc. is a global technology company that designs, develops, and supplies semiconductor and infrastructure software solutions. It serves data center, networking, software, broadband, and wireless markets.',
      founded: '1961',
      headquarters: 'San Jose, California, USA',
      ceo: 'Hock Tan',
      employees: '20,000+',
      website: 'https://broadcom.com'
    }
  },
  { 
    symbol: 'AXP', 
    name: 'American Express', 
    companyHealth: 3.4, 
    companyPerformance: 5, 
    overall: 8.4, 
    tier: 'high', 
    industry: 'Financial Services',
    currentPrice: 298.30,
    healthMetrics: { epsScore: 5, peScore: 3, deScore: 2, fcfScore: 4, marginScore: 3 },
    companyInfo: {
      description: 'American Express Company is a multinational financial services corporation known for its charge cards, credit cards, and traveler\'s cheques. It operates a closed-loop payment network.',
      founded: '1850',
      headquarters: 'New York City, New York, USA',
      ceo: 'Stephen Squeri',
      employees: '77,300+',
      website: 'https://americanexpress.com'
    }
  },
  { 
    symbol: 'META', 
    name: 'Meta', 
    companyHealth: 4.2, 
    companyPerformance: 4, 
    overall: 8.2, 
    tier: 'high', 
    industry: 'Communication Services',
    currentPrice: 609.21,
    healthMetrics: { epsScore: 4, peScore: 3, deScore: 4, fcfScore: 5, marginScore: 5 },
    companyInfo: {
      description: 'Meta Platforms, Inc. (formerly Facebook) is a technology conglomerate that owns and operates Facebook, Instagram, WhatsApp, and Messenger. It is also investing heavily in virtual and augmented reality through Reality Labs.',
      founded: '2004',
      headquarters: 'Menlo Park, California, USA',
      ceo: 'Mark Zuckerberg',
      employees: '67,300+',
      website: 'https://meta.com'
    }
  },
  { 
    symbol: 'AMZN', 
    name: 'Amazon', 
    companyHealth: 3.2, 
    companyPerformance: 5, 
    overall: 8.2, 
    tier: 'high', 
    industry: 'E-Commerce',
    currentPrice: 224.92,
    healthMetrics: { epsScore: 3, peScore: 3, deScore: 4, fcfScore: 5, marginScore: 4 },
    companyInfo: {
      description: 'Amazon.com, Inc. is a multinational technology company focusing on e-commerce, cloud computing (AWS), digital streaming, and artificial intelligence. It is one of the most valuable companies in the world.',
      founded: '1994',
      headquarters: 'Seattle, Washington, USA',
      ceo: 'Andy Jassy',
      employees: '1,540,000+',
      website: 'https://amazon.com'
    }
  },
  { 
    symbol: 'GE', 
    name: 'GE Aerospace', 
    companyHealth: 3.2, 
    companyPerformance: 5, 
    overall: 8.2, 
    tier: 'high', 
    industry: 'Aerospace & Defense',
    currentPrice: 170.28,
    healthMetrics: { epsScore: 4, peScore: 1, deScore: 4, fcfScore: 4, marginScore: 3 },
    companyInfo: {
      description: 'GE Aerospace is a leading provider of jet engines, components, and integrated systems for commercial and military aircraft. It was spun off from General Electric in 2024.',
      founded: '2024 (GE Aviation: 1917)',
      headquarters: 'Evendale, Ohio, USA',
      ceo: 'Larry Culp',
      employees: '52,000+',
      website: 'https://geaerospace.com'
    }
  },
  { 
    symbol: 'FN', 
    name: 'Fabrinet', 
    companyHealth: 3.2, 
    companyPerformance: 5, 
    overall: 8.2, 
    tier: 'high', 
    industry: 'Technology',
    currentPrice: 217.45,
    healthMetrics: { epsScore: 4, peScore: 2, deScore: 5, fcfScore: 2, marginScore: 3 },
    companyInfo: {
      description: 'Fabrinet is a provider of advanced optical packaging and precision optical, electro-mechanical, and electronic manufacturing services to OEMs of complex products.',
      founded: '2000',
      headquarters: 'George Town, Cayman Islands',
      ceo: 'Seamus Grady',
      employees: '15,000+',
      website: 'https://fabrinet.com'
    }
  },
  { 
    symbol: 'WDC', 
    name: 'Western Digital', 
    companyHealth: 3.2, 
    companyPerformance: 5, 
    overall: 8.2, 
    tier: 'high', 
    industry: 'Technology',
    currentPrice: 52.34,
    healthMetrics: { epsScore: 4, peScore: 4, deScore: 3, fcfScore: 3, marginScore: 2 },
    companyInfo: {
      description: 'Western Digital Corporation is a computer hard disk drive manufacturer and data storage company. It designs, manufactures, and sells data technology products including storage devices, data center systems, and cloud storage services.',
      founded: '1970',
      headquarters: 'San Jose, California, USA',
      ceo: 'David Goeckeler',
      employees: '51,000+',
      website: 'https://westerndigital.com'
    }
  },
  { 
    symbol: 'DE', 
    name: 'Deere', 
    companyHealth: 3.6, 
    companyPerformance: 4.5, 
    overall: 8.1, 
    tier: 'high', 
    industry: 'Industrials',
    currentPrice: 435.82,
    healthMetrics: { epsScore: 5, peScore: 4, deScore: 2, fcfScore: 4, marginScore: 3 },
    companyInfo: {
      description: 'Deere & Company manufactures agricultural, construction, and forestry machinery, diesel engines, and drivetrains. John Deere is one of the most recognized brands in agricultural equipment.',
      founded: '1837',
      headquarters: 'Moline, Illinois, USA',
      ceo: 'John May',
      employees: '83,000+',
      website: 'https://deere.com'
    }


  },
  { 
    symbol: 'V', 
    name: 'Visa', 
    companyHealth: 3.6, 
    companyPerformance: 4.5, 
    overall: 8.1, 
    tier: 'high', 
    industry: 'Financial Services',
    currentPrice: 317.92,
    healthMetrics: { epsScore: 4, peScore: 2, deScore: 3, fcfScore: 3, marginScore: 5 },
    companyInfo: {
      description: 'Visa Inc. is a multinational financial services corporation that facilitates electronic funds transfers throughout the world, most commonly through Visa-branded credit cards, debit cards, and prepaid cards.',
      founded: '1958',
      headquarters: 'San Francisco, California, USA',
      ceo: 'Ryan McInerney',
      employees: '26,500+',
      website: 'https://visa.com'
    }
  },

  // High tier continued (Overall 8.0)

  { 
    symbol: 'MU', 
    name: 'Micron', 
    companyHealth: 3.0, 
    companyPerformance: 5, 
    overall: 8, 
    tier: 'high', 
    industry: 'Semiconductors',
    currentPrice: 102.49,
    healthMetrics: { epsScore: 4, peScore: 3, deScore: 4, fcfScore: 3, marginScore: 3 },
    companyInfo: {
      description: 'Micron Technology, Inc. is a producer of computer memory and computer data storage including DRAM, NAND flash memory, and USB flash drives. It is a key supplier for AI and data center applications.',
      founded: '1978',
      headquarters: 'Boise, Idaho, USA',
      ceo: 'Sanjay Mehrotra',
      employees: '48,000+',
      website: 'https://micron.com'
    }
  },
  { 
    symbol: 'IBM', 
    name: 'IBM', 
    companyHealth: 3.0, 
    companyPerformance: 5, 
    overall: 8, 
    tier: 'high', 
    industry: 'Technology',
    currentPrice: 222.97,
    healthMetrics: { epsScore: 3, peScore: 3, deScore: 2, fcfScore: 3, marginScore: 3 },
    companyInfo: {
      description: 'International Business Machines Corporation is a multinational technology company that provides cloud computing, AI, and consulting services. It is known for its mainframe computers and enterprise solutions.',
      founded: '1911',
      headquarters: 'Armonk, New York, USA',
      ceo: 'Arvind Krishna',
      employees: '288,000+',
      website: 'https://ibm.com'
    }
  },
  { 
    symbol: 'HOOD', 
    name: 'Robinhood', 
    companyHealth: 3.0, 
    companyPerformance: 5, 
    overall: 8, 
    tier: 'high', 
    industry: 'Financial Services',
    currentPrice: 40.67,
    healthMetrics: { epsScore: 4, peScore: 3, deScore: 5, fcfScore: 3, marginScore: 4 },
    companyInfo: {
      description: 'Robinhood Markets, Inc. is a financial services company that offers commission-free trading of stocks, ETFs, options, and cryptocurrencies through its mobile app and web platform.',
      founded: '2013',
      headquarters: 'Menlo Park, California, USA',
      ceo: 'Vlad Tenev',
      employees: '3,800+',
      website: 'https://robinhood.com'
    }
  },
  { 
    symbol: 'APP', 
    name: 'Applovin', 
    companyHealth: 3.0, 
    companyPerformance: 5, 
    overall: 8.0, 
    tier: 'high', 
    industry: 'Software',
    currentPrice: 335.18,
    healthMetrics: { epsScore: 4, peScore: 1, deScore: 2, fcfScore: 3, marginScore: 5 },


    companyInfo: {
      description: 'AppLovin Corporation is a mobile technology company that provides developers with a set of tools to grow their mobile app businesses. It specializes in mobile advertising and app monetization.',
      founded: '2012',
      headquarters: 'Palo Alto, California, USA',
      ceo: 'Adam Foroughi',
      employees: '1,800+',
      website: 'https://applovin.com'
    }
  },

  // Mid-high tier (Overall 7-7.9)
  { 
    symbol: 'BRK.B', 
    name: 'Berkshire Hathaway', 
    companyHealth: 4.4, 
    companyPerformance: 3.5, 
    overall: 7.9, 
    tier: 'mid-high', 
    industry: 'Financial Services',
    currentPrice: 457.12,
    healthMetrics: { epsScore: 5, peScore: 3, deScore: 5, fcfScore: 3, marginScore: 4 },
    companyInfo: {
      description: 'Berkshire Hathaway Inc. is a multinational conglomerate holding company led by Warren Buffett. It owns businesses in insurance, utilities, railroads, manufacturing, and retail.',
      founded: '1839',
      headquarters: 'Omaha, Nebraska, USA',
      ceo: 'Warren Buffett',
      employees: '396,500+',
      website: 'https://berkshirehathaway.com'
    }
  },
  { 
    symbol: 'NOW', 
    name: 'ServiceNow', 
    companyHealth: 3.4, 
    companyPerformance: 4.5, 
    overall: 7.9, 
    tier: 'mid-high', 
    industry: 'Software',
    currentPrice: 1089.45,
    healthMetrics: { epsScore: 4, peScore: 1, deScore: 5, fcfScore: 4, marginScore: 3 },

    companyInfo: {
      description: 'ServiceNow, Inc. is a cloud computing company that provides digital workflow automation solutions. Its platform helps organizations manage digital workflows for enterprise operations.',
      founded: '2004',
      headquarters: 'Santa Clara, California, USA',
      ceo: 'Bill McDermott',
      employees: '22,000+',
      website: 'https://servicenow.com'
    }
  },
  { 
    symbol: 'INTU', 
    name: 'Intuit', 
    companyHealth: 3.8, 
    companyPerformance: 4, 
    overall: 7.8, 
    tier: 'mid-high', 
    industry: 'Software',
    currentPrice: 627.34,
    healthMetrics: { epsScore: 5, peScore: 1, deScore: 5, fcfScore: 4, marginScore: 4 },
    companyInfo: {
      description: 'Intuit Inc. is a business and financial software company that develops and sells financial, accounting, and tax preparation software. Products include TurboTax, QuickBooks, and Credit Karma.',
      founded: '1983',
      headquarters: 'Mountain View, California, USA',
      ceo: 'Sasan Goodarzi',
      employees: '18,200+',
      website: 'https://intuit.com'
    }
  },
  { 
    symbol: 'MCO', 
    name: "Moody's", 
    companyHealth: 3.2, 
    companyPerformance: 4.5, 
    overall: 7.7, 
    tier: 'mid-high', 
    industry: 'Financial Services',
    currentPrice: 476.89,
    healthMetrics: { epsScore: 5, peScore: 1, deScore: 2, fcfScore: 3, marginScore: 5 },


    companyInfo: {
      description: 'Moody\'s Corporation is a business and financial services company providing credit ratings, research, tools, and analysis for financial markets. It is one of the Big Three credit rating agencies.',
      founded: '1909',
      headquarters: 'New York City, New York, USA',
      ceo: 'Rob Fauber',
      employees: '15,000+',
      website: 'https://moodys.com'
    }
  },
  // COP - ConocoPhillips (mid-high tier)
  { 
    symbol: 'COP', 
    name: 'ConocoPhillips', 
    companyHealth: 3.2, 
    companyPerformance: 4.5, 
    overall: 7.7, 
    tier: 'mid-high', 
    industry: 'Energy',
    currentPrice: 98.45,
    healthMetrics: { epsScore: 3, peScore: 2, deScore: 3, fcfScore: 5, marginScore: 3 },

    companyInfo: {
      description: 'ConocoPhillips is an American multinational corporation engaged in hydrocarbon exploration and production. It is one of the world\'s largest independent exploration and production companies.',
      founded: '2002',
      headquarters: 'Houston, Texas, USA',
      ceo: 'Ryan Lance',
      employees: '10,500+',
      website: 'https://conocophillips.com'
    }
  },
  { 
    symbol: 'CAT', 
    name: 'Caterpillar', 
    companyHealth: 3.6, 
    companyPerformance: 4, 
    overall: 7.6, 
    tier: 'mid-high', 
    industry: 'Industrials',
    currentPrice: 368.45,
    healthMetrics: { epsScore: 5, peScore: 3, deScore: 2, fcfScore: 3, marginScore: 5 },

    companyInfo: {
      description: 'Caterpillar Inc. is the world\'s largest manufacturer of construction and mining equipment, diesel and natural gas engines, industrial gas turbines, and diesel-electric locomotives.',
      founded: '1925',
      headquarters: 'Irving, Texas, USA',
      ceo: 'Jim Umpleby',
      employees: '113,200+',
      website: 'https://caterpillar.com'
    }
  },
  { 
    symbol: 'ANET', 
    name: 'Arista Networks', 
    companyHealth: 3.6, 
    companyPerformance: 4, 
    overall: 7.6, 
    tier: 'mid-high', 
    industry: 'Technology',
    currentPrice: 398.76,
    healthMetrics: { epsScore: 3, peScore: 1, deScore: 5, fcfScore: 4, marginScore: 5 },

    companyInfo: {
      description: 'Arista Networks, Inc. is a cloud networking company that designs and sells multilayer network switches to deliver software-defined networking for large data center and cloud computing environments.',
      founded: '2004',
      headquarters: 'Santa Clara, California, USA',
      ceo: 'Jayshree Ullal',
      employees: '4,000+',
      website: 'https://arista.com'
    }
  },
  { 
    symbol: 'PLTR', 
    name: 'Palantir', 
    companyHealth: 2.8, 
    companyPerformance: 5, 
    overall: 7.8, 
    tier: 'mid-high', 
    industry: 'Software',
    currentPrice: 75.62,
    healthMetrics: { epsScore: 3, peScore: 1, deScore: 5, fcfScore: 2, marginScore: 3 },
    companyInfo: {
      description: 'Palantir Technologies Inc. is a software company that specializes in big data analytics. It provides software platforms for government intelligence agencies and large commercial enterprises.',
      founded: '2003',
      headquarters: 'Denver, Colorado, USA',
      ceo: 'Alex Karp',
      employees: '3,800+',
      website: 'https://palantir.com'
    }
  },
  { 
    symbol: 'RTX', 
    name: 'RTX Corp', 
    companyHealth: 3.2, 
    companyPerformance: 5, 
    overall: 8.2, 
    tier: 'high', 
    industry: 'Aerospace & Defense',
    currentPrice: 117.83,
    healthMetrics: { epsScore: 3, peScore: 4, deScore: 3, fcfScore: 3, marginScore: 3 },
    companyInfo: {
      description: 'RTX Corporation (formerly Raytheon Technologies) is an aerospace and defense company that provides advanced systems and services for commercial, military, and government customers worldwide.',
      founded: '2020',
      headquarters: 'Arlington, Virginia, USA',
      ceo: 'Chris Calio',
      employees: '185,000+',
      website: 'https://rtx.com'
    }
  },
  { 
    symbol: 'PANW', 
    name: 'Palo Alto Networks', 
    companyHealth: 3.4, 
    companyPerformance: 5, 
    overall: 8.4, 
    tier: 'high', 
    industry: 'Software',
    currentPrice: 391.24,
    healthMetrics: { epsScore: 3, peScore: 2, deScore: 5, fcfScore: 5, marginScore: 2 },
    companyInfo: {
      description: 'Palo Alto Networks, Inc. is a cybersecurity company that provides advanced firewalls and cloud-based offerings that extend those firewalls to cover other aspects of security.',
      founded: '2005',
      headquarters: 'Santa Clara, California, USA',
      ceo: 'Nikesh Arora',
      employees: '14,000+',
      website: 'https://paloaltonetworks.com'
    }
  },
  { 
    symbol: 'SHOP', 
    name: 'Shopify', 
    companyHealth: 3.0, 
    companyPerformance: 4.5, 
    overall: 7.5, 
    tier: 'mid-high', 
    industry: 'E-Commerce',
    currentPrice: 109.87,
    healthMetrics: { epsScore: 2, peScore: 1, deScore: 5, fcfScore: 3, marginScore: 4 },
    companyInfo: {
      description: 'Shopify Inc. is a multinational e-commerce company that provides a platform for online stores and retail point-of-sale systems. It powers millions of businesses worldwide.',
      founded: '2006',
      headquarters: 'Ottawa, Ontario, Canada',
      ceo: 'Tobi Lütke',
      employees: '11,600+',
      website: 'https://shopify.com'
    }
  },
  { 
    symbol: 'CDNS', 
    name: 'Cadence Design Systems', 
    companyHealth: 3.4, 
    companyPerformance: 4, 
    overall: 7.4, 
    tier: 'mid-high', 
    industry: 'Software',
    currentPrice: 312.67,
    healthMetrics: { epsScore: 4, peScore: 1, deScore: 4, fcfScore: 4, marginScore: 4 },

    companyInfo: {
      description: 'Cadence Design Systems, Inc. is an electronic design automation software and engineering services company. It develops software, hardware, and IP for designing integrated circuits and electronic systems.',
      founded: '1988',
      headquarters: 'San Jose, California, USA',
      ceo: 'Anirudh Devgan',
      employees: '11,000+',
      website: 'https://cadence.com'
    }
  },
  { 
    symbol: 'TMO', 
    name: 'Thermo Fisher Scientific', 
    companyHealth: 3.4, 
    companyPerformance: 4, 
    overall: 7.4, 
    tier: 'mid-high', 
    industry: 'Healthcare',
    currentPrice: 524.67,
    healthMetrics: { epsScore: 5, peScore: 2, deScore: 3, fcfScore: 4, marginScore: 3 },

    companyInfo: {
      description: 'Thermo Fisher Scientific Inc. is a provider of scientific instrumentation, reagents and consumables, and software and services for research, analysis, discovery, and diagnostics.',
      founded: '2006',
      headquarters: 'Waltham, Massachusetts, USA',
      ceo: 'Marc Casper',
      employees: '125,000+',
      website: 'https://thermofisher.com'
    }
  },
  { 
    symbol: 'LLY', 
    name: 'Eli Lilly', 
    companyHealth: 2.4, 
    companyPerformance: 5, 
    overall: 7.4, 
    tier: 'mid-high', 
    industry: 'Healthcare',
    currentPrice: 789.45,
    healthMetrics: { epsScore: 2, peScore: 1, deScore: 3, fcfScore: 2, marginScore: 4 },
    companyInfo: {
      description: 'Eli Lilly and Company is a pharmaceutical company that discovers, develops, and markets human pharmaceuticals. It is known for drugs treating diabetes, cancer, and neurological conditions.',
      founded: '1876',
      headquarters: 'Indianapolis, Indiana, USA',
      ceo: 'David Ricks',
      employees: '43,000+',
      website: 'https://lilly.com'
    }
  },
  { 
    symbol: 'NEE', 
    name: 'NextEra Energy', 
    companyHealth: 2.8, 
    companyPerformance: 5, 
    overall: 7.8, 
    tier: 'mid-high', 
    industry: 'Energy',
    currentPrice: 71.34,
    healthMetrics: { epsScore: 3, peScore: 4, deScore: 1, fcfScore: 3, marginScore: 3 },
    companyInfo: {
      description: 'NextEra Energy, Inc. is an energy company and the world\'s largest producer of wind and solar energy. It operates Florida Power & Light and NextEra Energy Resources.',
      founded: '1925',
      headquarters: 'Juno Beach, Florida, USA',
      ceo: 'John Ketchum',
      employees: '16,800+',
      website: 'https://nexteraenergy.com'
    }
  },
  { 
    symbol: 'ABT', 
    name: 'Abbott Laboratories', 
    companyHealth: 4.0, 
    companyPerformance: 3.5, 
    overall: 7.5, 
    tier: 'mid-high', 
    industry: 'Healthcare',
    currentPrice: 118.92,
    healthMetrics: { epsScore: 4, peScore: 4, deScore: 4, fcfScore: 3, marginScore: 5 },
    companyInfo: {
      description: 'Abbott Laboratories is a medical devices and health care company. It manufactures medical devices, diagnostics, branded generic medicines, and nutritional products.',
      founded: '1888',
      headquarters: 'Abbott Park, Illinois, USA',
      ceo: 'Robert Ford',
      employees: '114,000+',
      website: 'https://abbott.com'
    }
  },
  { 
    symbol: 'GILD', 
    name: 'Gilead Sciences', 
    companyHealth: 4.4, 
    companyPerformance: 3.5, 
    overall: 7.9, 
    tier: 'mid-high', 
    industry: 'Biotechnology',
    currentPrice: 107.42,
    healthMetrics: { epsScore: 4, peScore: 5, deScore: 3, fcfScore: 5, marginScore: 5 },

    companyInfo: {
      description: 'Gilead Sciences, Inc. is a biopharmaceutical company that discovers, develops, and commercializes medicines in areas of unmet medical need. It is a leader in HIV/AIDS treatments with products like Biktarvy and Descovy, and also develops therapies for hepatitis, oncology, and inflammatory diseases.',
      founded: '1987',
      headquarters: 'Foster City, California, USA',
      ceo: 'Daniel O\'Day',
      employees: '18,000+',
      website: 'https://gilead.com'
    }
  },
  { 
    symbol: 'MS', 
    name: 'Morgan Stanley', 
    companyHealth: 4.2, 
    companyPerformance: 4, 
    overall: 8.2, 
    tier: 'high', 
    industry: 'Financial Services',
    currentPrice: 118.56,
    healthMetrics: { epsScore: 5, peScore: 5, deScore: 3, fcfScore: 4, marginScore: 4 },

    companyInfo: {
      description: 'Morgan Stanley is a leading global financial services firm providing investment banking, securities, wealth management, and investment management services. It serves corporations, governments, institutions, and individuals worldwide.',
      founded: '1935',
      headquarters: 'New York City, New York, USA',
      ceo: 'Ted Pick',
      employees: '82,000+',
      website: 'https://morganstanley.com'
    }
  },
  { 
    symbol: 'MEDP', 
    name: 'Medpace Holdings', 
    companyHealth: 4.4, 
    companyPerformance: 4, 
    overall: 8.4, 
    tier: 'high', 
    industry: 'Healthcare',
    currentPrice: 327.89,
    healthMetrics: { epsScore: 5, peScore: 5, deScore: 4, fcfScore: 4, marginScore: 4 },


    companyInfo: {
      description: 'Medpace Holdings, Inc. is a scientifically-driven, global, full-service clinical contract research organization (CRO) providing Phase I-IV clinical development services to the biotechnology, pharmaceutical, and medical device industries.',
      founded: '1992',
      headquarters: 'Cincinnati, Ohio, USA',
      ceo: 'August Troendle',
      employees: '5,800+',
      website: 'https://medpace.com'
    }
  },
  { 
    symbol: 'AMD', 
    name: 'Advanced Micro Devices', 
    companyHealth: 2.8, 
    companyPerformance: 4.5, 
    overall: 7.3, 
    tier: 'mid-high', 
    industry: 'Semiconductors',

    currentPrice: 119.67,
    healthMetrics: { epsScore: 4, peScore: 1, deScore: 5, fcfScore: 4, marginScore: 3 },
    companyInfo: {
      description: 'Advanced Micro Devices, Inc. is a semiconductor company that develops computer processors and related technologies for business and consumer markets. It competes with Intel and NVIDIA.',
      founded: '1969',
      headquarters: 'Santa Clara, California, USA',
      ceo: 'Lisa Su',
      employees: '26,000+',
      website: 'https://amd.com'
    }
  },
  { 
    symbol: 'QCOM', 
    name: 'Qualcomm', 
    companyHealth: 4.2, 
    companyPerformance: 3, 
    overall: 7.2, 
    tier: 'mid-high', 
    industry: 'Semiconductors',
    currentPrice: 156.78,
    healthMetrics: { epsScore: 5, peScore: 4, deScore: 4, fcfScore: 4, marginScore: 5 },
    companyInfo: {
      description: 'Qualcomm Incorporated is a multinational corporation that creates semiconductors, software, and services related to wireless technology. It is the world\'s largest wireless chipset maker.',
      founded: '1985',
      headquarters: 'San Diego, California, USA',
      ceo: 'Cristiano Amon',
      employees: '51,000+',
      website: 'https://qualcomm.com'
    }
  },
  { 
    symbol: 'RCL', 
    name: 'Royal Caribbean', 
    companyHealth: 3.2, 
    companyPerformance: 4, 
    overall: 7.2, 
    tier: 'mid-high', 
    industry: 'Consumer Cyclical',
    currentPrice: 234.56,
    healthMetrics: { epsScore: 5, peScore: 3, deScore: 2, fcfScore: 3, marginScore: 3 },
    companyInfo: {
      description: 'Royal Caribbean Group is a cruise company that owns and operates three global cruise vacation brands: Royal Caribbean International, Celebrity Cruises, and Silversea Cruises.',
      founded: '1968',
      headquarters: 'Miami, Florida, USA',
      ceo: 'Jason Liberty',
      employees: '100,000+',
      website: 'https://royalcaribbean.com'
    }
  },
  { 
    symbol: 'IBKR', 
    name: 'Interactive Brokers', 
    companyHealth: 3.2, 
    companyPerformance: 4, 
    overall: 7.2, 
    tier: 'mid-high', 
    industry: 'Financial Services',
    currentPrice: 178.34,
    healthMetrics: { epsScore: 3, peScore: 2, deScore: 3, fcfScore: 5, marginScore: 3 },
    companyInfo: {
      description: 'Interactive Brokers Group, Inc. is an automated global electronic broker. It provides a trading platform for securities, commodities, and foreign exchange around the clock on over 150 markets.',
      founded: '1978',
      headquarters: 'Greenwich, Connecticut, USA',
      ceo: 'Milan Galik',
      employees: '2,900+',
      website: 'https://interactivebrokers.com'
    }
  },
  { 
    symbol: 'SAP', 
    name: 'SAP SE', 
    companyHealth: 4.6, 
    companyPerformance: 2.5, 
    overall: 7.1, 
    tier: 'mid-high', 
    industry: 'Software',
    currentPrice: 245.78,
    healthMetrics: { epsScore: 5, peScore: 5, deScore: 4, fcfScore: 4, marginScore: 5 },
    companyInfo: {
      description: 'SAP SE is a German multinational software company that develops enterprise software to manage business operations and customer relations. It is the largest non-American software company by revenue.',
      founded: '1972',
      headquarters: 'Walldorf, Germany',
      ceo: 'Christian Klein',
      employees: '107,000+',
      website: 'https://sap.com'
    }
  },
  { 
    symbol: 'CMI', 
    name: 'Cummins', 
    companyHealth: 4.6, 
    companyPerformance: 3.5, 
    overall: 8.1, 
    tier: 'high', 
    industry: 'Industrials',
    currentPrice: 342.18,
    healthMetrics: { epsScore: 5, peScore: 5, deScore: 3, fcfScore: 5, marginScore: 5 },


    companyInfo: {
      description: 'Cummins Inc. is a global power technology leader that designs, manufactures, distributes, and services diesel and alternative fuel engines, electric and hybrid powertrains, and related components including filtration, aftertreatment, turbochargers, fuel systems, and power generation systems.',
      founded: '1919',
      headquarters: 'Columbus, Indiana, USA',
      ceo: 'Jennifer Rumsey',
      employees: '73,600+',
      website: 'https://cummins.com'
    }
  },
  { 
    symbol: 'SOFI', 
    name: 'SoFi Technologies', 
    companyHealth: 2.0, 
    companyPerformance: 5, 
    overall: 7, 
    tier: 'mid-high', 
    industry: 'Financial Services',
    currentPrice: 16.34,
    healthMetrics: { epsScore: 2, peScore: 3, deScore: 1, fcfScore: 1, marginScore: 2 },
    companyInfo: {
      description: 'SoFi Technologies, Inc. is a personal finance company that provides student loan refinancing, mortgages, personal loans, credit cards, investing, and banking products.',
      founded: '2011',
      headquarters: 'San Francisco, California, USA',
      ceo: 'Anthony Noto',
      employees: '5,000+',
      website: 'https://sofi.com'
    }
  },
  { 
    symbol: 'CRDO', 
    name: 'Credo Technology', 
    companyHealth: 1.0, 
    companyPerformance: 5, 
    overall: 7, 
    tier: 'mid-high', 
    industry: 'Semiconductors',
    currentPrice: 78.45,
    healthMetrics: { epsScore: 1, peScore: 1, deScore: 5, fcfScore: 1, marginScore: 3 },
    companyInfo: {
      description: 'Credo Technology Group Holding Ltd designs and sells high-speed connectivity solutions for data infrastructure. It specializes in SerDes technology for data centers.',
      founded: '2008',
      headquarters: 'San Jose, California, USA',
      ceo: 'Bill Brennan',
      employees: '600+',
      website: 'https://credosemi.com'
    }
  },
  { 
    symbol: 'CLS', 
    name: 'Celestica', 
    companyHealth: 2.0, 
    companyPerformance: 5, 
    overall: 7, 
    tier: 'mid-high', 
    industry: 'Technology',
    currentPrice: 112.34,
    healthMetrics: { epsScore: 3, peScore: 3, deScore: 4, fcfScore: 3, marginScore: 2 },
    companyInfo: {
      description: 'Celestica Inc. is an electronics manufacturing services company that provides design, manufacturing, hardware platform, and supply chain solutions to OEMs.',
      founded: '1994',
      headquarters: 'Toronto, Ontario, Canada',
      ceo: 'Rob Mionis',
      employees: '27,000+',
      website: 'https://celestica.com'
    }
  },

  // Mid tier (Overall 6-6.9)

  { 
    symbol: 'KO', 
    name: 'Coca-Cola', 
    companyHealth: 2.4, 
    companyPerformance: 4.5, 
    overall: 6.9, 
    tier: 'mid', 
    industry: 'Consumer Defensive',
    currentPrice: 62.87,
    healthMetrics: { epsScore: 4, peScore: 3, deScore: 2, fcfScore: 4, marginScore: 4 },
    companyInfo: {
      description: 'The Coca-Cola Company is a multinational beverage corporation known for Coca-Cola and over 500 brands including Sprite, Fanta, Dasani, and Minute Maid.',
      founded: '1892',
      headquarters: 'Atlanta, Georgia, USA',
      ceo: 'James Quincey',
      employees: '82,500+',
      website: 'https://coca-colacompany.com'
    }
  },
  { 
    symbol: 'FICO', 
    name: 'Fair Isaac Corporation', 
    companyHealth: 3.8, 
    companyPerformance: 3, 
    overall: 6.8, 
    tier: 'mid', 
    industry: 'Software',
    currentPrice: 2156.78,
    healthMetrics: { epsScore: 5, peScore: 1, deScore: 5, fcfScore: 3, marginScore: 5 },

    companyInfo: {
      description: 'Fair Isaac Corporation (FICO) is a data analytics company focused on credit scoring services. The FICO score is used by 90% of top lenders in the United States.',
      founded: '1956',
      headquarters: 'Bozeman, Montana, USA',
      ceo: 'Will Lansing',
      employees: '3,600+',
      website: 'https://fico.com'
    }
  },
  { 
    symbol: 'XOM', 
    name: 'ExxonMobil', 
    companyHealth: 3.8, 
    companyPerformance: 3, 
    overall: 6.8, 
    tier: 'mid', 
    industry: 'Energy',
    currentPrice: 105.67,
    healthMetrics: { epsScore: 3, peScore: 4, deScore: 4, fcfScore: 4, marginScore: 4 },
    companyInfo: {
      description: 'Exxon Mobil Corporation is a multinational oil and gas corporation. It is one of the world\'s largest publicly traded companies by revenue and a major producer of oil and natural gas.',
      founded: '1999 (predecessors: 1870)',
      headquarters: 'Spring, Texas, USA',
      ceo: 'Darren Woods',
      employees: '62,000+',
      website: 'https://exxonmobil.com'
    }
  },
  { 
    symbol: 'CVX', 
    name: 'Chevron', 
    companyHealth: 3.8, 
    companyPerformance: 3, 
    overall: 6.8, 
    tier: 'mid', 
    industry: 'Energy',
    currentPrice: 144.23,
    healthMetrics: { epsScore: 4, peScore: 4, deScore: 5, fcfScore: 4, marginScore: 4 },
    companyInfo: {
      description: 'Chevron Corporation is a multinational energy corporation engaged in every aspect of the oil, natural gas, and geothermal energy industries, including exploration, production, and refining.',
      founded: '1879',
      headquarters: 'San Ramon, California, USA',
      ceo: 'Mike Wirth',
      employees: '43,800+',
      website: 'https://chevron.com'
    }
  },
  { 
    symbol: 'COIN', 
    name: 'Coinbase', 
    companyHealth: 3.8, 
    companyPerformance: 3, 
    overall: 6.8, 
    tier: 'mid', 
    industry: 'Cryptocurrency',
    currentPrice: 278.92,
    healthMetrics: { epsScore: 4, peScore: 2, deScore: 5, fcfScore: 4, marginScore: 4 },

    companyInfo: {
      description: 'Coinbase Global, Inc. is a cryptocurrency exchange platform that allows users to buy, sell, transfer, and store digital currency. It is the largest cryptocurrency exchange in the United States.',
      founded: '2012',
      headquarters: 'Wilmington, Delaware, USA',
      ceo: 'Brian Armstrong',
      employees: '3,400+',
      website: 'https://coinbase.com'
    }
  },
  { 
    symbol: 'SYK', 
    name: 'Stryker Corporation', 
    companyHealth: 2.8, 
    companyPerformance: 4, 
    overall: 6.8, 
    tier: 'mid', 
    industry: 'Healthcare',
    currentPrice: 389.45,
    healthMetrics: { epsScore: 3, peScore: 1, deScore: 3, fcfScore: 3, marginScore: 4 },
    companyInfo: {
      description: 'Stryker Corporation is a medical technology company that develops and sells orthopedic, medical, and surgical equipment and services. It is a leader in joint replacement and surgical equipment.',
      founded: '1941',
      headquarters: 'Kalamazoo, Michigan, USA',
      ceo: 'Kevin Lobo',
      employees: '52,000+',
      website: 'https://stryker.com'
    }
  },
  { 
    symbol: 'CRWD', 
    name: 'CrowdStrike', 
    companyHealth: 1.8, 
    companyPerformance: 5, 
    overall: 6.8, 
    tier: 'mid', 
    industry: 'Software',
    currentPrice: 356.78,
    healthMetrics: { epsScore: 2, peScore: 1, deScore: 5, fcfScore: 3, marginScore: 2 },
    companyInfo: {
      description: 'CrowdStrike Holdings, Inc. is a cybersecurity technology company that provides cloud workload protection, endpoint security, threat intelligence, and cyberattack response services.',
      founded: '2011',
      headquarters: 'Austin, Texas, USA',
      ceo: 'George Kurtz',
      employees: '7,900+',
      website: 'https://crowdstrike.com'
    }
  },
  { 
    symbol: 'ABBV', 
    name: 'AbbVie', 
    companyHealth: 3.2, 
    companyPerformance: 3.5, 
    overall: 6.7, 
    tier: 'mid', 
    industry: 'Healthcare',
    currentPrice: 178.34,
    healthMetrics: { epsScore: 2, peScore: 5, deScore: 3, fcfScore: 5, marginScore: 4 },
    companyInfo: {
      description: 'AbbVie Inc. is a biopharmaceutical company that discovers, develops, manufactures, and sells medicines. It is known for Humira, Skyrizi, and Rinvoq.',
      founded: '2013',
      headquarters: 'North Chicago, Illinois, USA',
      ceo: 'Richard Gonzalez',
      employees: '50,000+',
      website: 'https://abbvie.com'
    }
  },
  { 
    symbol: 'JNJ', 
    name: 'Johnson & Johnson', 
    companyHealth: 4.4, 
    companyPerformance: 3, 
    overall: 7.4, 
    tier: 'mid-high', 
    industry: 'Healthcare',
    currentPrice: 156.23,
    healthMetrics: { epsScore: 4, peScore: 5, deScore: 5, fcfScore: 4, marginScore: 4 },


    companyInfo: {
      description: 'Johnson & Johnson is a multinational corporation that develops medical devices, pharmaceuticals, and consumer packaged goods. It is one of the world\'s most valuable companies and is known for brands like Tylenol, Band-Aid, and Neutrogena, as well as pharmaceutical products in immunology, oncology, and neuroscience.',
      founded: '1886',
      headquarters: 'New Brunswick, New Jersey, USA',
      ceo: 'Joaquin Duato',
      employees: '131,900+',
      website: 'https://jnj.com'
    }
  },
  { 
    symbol: 'MELI', 
    name: 'MercadoLibre', 
    companyHealth: 3.2, 
    companyPerformance: 3.5, 
    overall: 6.7, 
    tier: 'mid', 
    industry: 'E-Commerce',
    currentPrice: 1876.45,
    healthMetrics: { epsScore: 5, peScore: 1, deScore: 4, fcfScore: 4, marginScore: 2 },
    companyInfo: {
      description: 'MercadoLibre, Inc. is an e-commerce company that operates online marketplaces and fintech services in Latin America. It is the largest e-commerce platform in the region.',
      founded: '1999',
      headquarters: 'Montevideo, Uruguay',
      ceo: 'Marcos Galperin',
      employees: '59,000+',
      website: 'https://mercadolibre.com'
    }
  },
  { 
    symbol: 'IREN', 
    name: 'Iris Energy', 
    companyHealth: 3.2, 
    companyPerformance: 3.5, 
    overall: 6.7, 
    tier: 'mid', 
    industry: 'Technology',
    currentPrice: 12.45,
    healthMetrics: { epsScore: 4, peScore: 2, deScore: 4, fcfScore: 1, marginScore: 5 },
    companyInfo: {
      description: 'Iris Energy Limited is a sustainable Bitcoin mining company that uses renewable energy sources. It operates data centers powered by 100% renewable energy for Bitcoin mining and AI/HPC services.',
      founded: '2018',
      headquarters: 'Sydney, Australia',
      ceo: 'Daniel Roberts',
      employees: '200+',
      website: 'https://irisenergy.co'
    }
  },

  { 
    symbol: 'ISRG', 
    name: 'Intuitive Surgical', 
    companyHealth: 3.4, 
    companyPerformance: 3, 
    overall: 6.4, 
    tier: 'mid', 
    industry: 'Healthcare',
    currentPrice: 534.67,
    healthMetrics: { epsScore: 4, peScore: 1, deScore: 5, fcfScore: 3, marginScore: 4 },
    companyInfo: {
      description: 'Intuitive Surgical, Inc. is a medical device company that develops, manufactures, and markets robotic products designed to improve clinical outcomes through minimally invasive surgery.',
      founded: '1995',
      headquarters: 'Sunnyvale, California, USA',
      ceo: 'Gary Guthart',
      employees: '12,000+',
      website: 'https://intuitive.com'
    }
  },
  { 
    symbol: 'DIS', 
    name: 'Walt Disney', 
    companyHealth: 3.4, 
    companyPerformance: 3, 
    overall: 6.4, 
    tier: 'mid', 
    industry: 'Communication Services',
    currentPrice: 112.45,
    healthMetrics: { epsScore: 4, peScore: 4, deScore: 3, fcfScore: 4, marginScore: 3 },
    companyInfo: {
      description: 'The Walt Disney Company is a multinational entertainment and media conglomerate. It owns theme parks, film studios (Disney, Pixar, Marvel, Lucasfilm), and streaming services (Disney+, Hulu, ESPN+).',
      founded: '1923',
      headquarters: 'Burbank, California, USA',
      ceo: 'Bob Iger',
      employees: '225,000+',
      website: 'https://thewaltdisneycompany.com'
    }
  },
  { 
    symbol: 'SPGI', 
    name: 'S&P Global', 
    companyHealth: 3.8, 
    companyPerformance: 2.5, 
    overall: 6.3, 
    tier: 'mid', 
    industry: 'Financial Services',
    currentPrice: 498.23,
    healthMetrics: { epsScore: 5, peScore: 1, deScore: 4, fcfScore: 4, marginScore: 5 },
    companyInfo: {
      description: 'S&P Global Inc. is a provider of financial data, credit ratings, and analytics. It owns S&P Global Ratings, S&P Global Market Intelligence, and S&P Dow Jones Indices.',
      founded: '1860',
      headquarters: 'New York City, New York, USA',
      ceo: 'Douglas Peterson',
      employees: '40,000+',
      website: 'https://spglobal.com'
    }
  },
  { 
    symbol: 'TXN', 
    name: 'Texas Instruments', 
    companyHealth: 3.2, 
    companyPerformance: 3, 
    overall: 6.2, 
    tier: 'mid', 
    industry: 'Semiconductors',
    currentPrice: 189.34,
    healthMetrics: { epsScore: 4, peScore: 2, deScore: 3, fcfScore: 3, marginScore: 4 },
    companyInfo: {
      description: 'Texas Instruments Incorporated is a semiconductor company that designs and manufactures analog and embedded processing chips. It is a leader in industrial and automotive semiconductors.',
      founded: '1951',
      headquarters: 'Dallas, Texas, USA',
      ceo: 'Haviv Ilan',
      employees: '34,000+',
      website: 'https://ti.com'
    }
  },
  { 
    symbol: 'COST', 
    name: 'Costco', 
    companyHealth: 3.2, 
    companyPerformance: 3, 
    overall: 6.2, 
    tier: 'mid', 
    industry: 'Consumer Defensive',
    currentPrice: 934.56,
    healthMetrics: { epsScore: 5, peScore: 1, deScore: 5, fcfScore: 4, marginScore: 1 },

    companyInfo: {
      description: 'Costco Wholesale Corporation is a multinational corporation that operates a chain of membership-only big-box retail stores. It is the fifth-largest retailer in the world.',
      founded: '1983',
      headquarters: 'Issaquah, Washington, USA',
      ceo: 'Ron Vachris',
      employees: '316,000+',
      website: 'https://costco.com'
    }
  },
  { 
    symbol: 'WMT', 
    name: 'Walmart', 
    companyHealth: 2.2, 
    companyPerformance: 4, 
    overall: 6.2, 
    tier: 'mid', 
    industry: 'Consumer Defensive',
    currentPrice: 91.23,
    healthMetrics: { epsScore: 4, peScore: 2, deScore: 3, fcfScore: 3, marginScore: 1 },
    companyInfo: {
      description: 'Walmart Inc. is a multinational retail corporation that operates a chain of hypermarkets, discount department stores, and grocery stores. It is the world\'s largest company by revenue.',
      founded: '1962',
      headquarters: 'Bentonville, Arkansas, USA',
      ceo: 'Doug McMillon',
      employees: '2,100,000+',
      website: 'https://walmart.com'
    }
  },
  { 
    symbol: 'NFLX', 
    name: 'Netflix', 
    companyHealth: 3.2, 
    companyPerformance: 3, 
    overall: 6.2, 
    tier: 'mid', 
    industry: 'Communication Services',
    currentPrice: 891.23,
    healthMetrics: { epsScore: 5, peScore: 2, deScore: 3, fcfScore: 4, marginScore: 4 },
    companyInfo: {
      description: 'Netflix, Inc. is a streaming service and production company that offers a library of films and television series through distribution deals and its own productions.',
      founded: '1997',
      headquarters: 'Los Gatos, California, USA',
      ceo: 'Ted Sarandos & Greg Peters',
      employees: '13,000+',
      website: 'https://netflix.com'
    }
  },
  { 
    symbol: 'DUOL', 
    name: 'Duolingo', 
    companyHealth: 2.6, 
    companyPerformance: 3.5, 
    overall: 6.1, 
    tier: 'mid', 
    industry: 'Software',
    currentPrice: 334.56,
    healthMetrics: { epsScore: 2, peScore: 1, deScore: 5, fcfScore: 2, marginScore: 3 },
    companyInfo: {
      description: 'Duolingo, Inc. is an educational technology company that produces learning apps and provides language certification. It is the most downloaded education app in the world.',
      founded: '2011',
      headquarters: 'Pittsburgh, Pennsylvania, USA',
      ceo: 'Luis von Ahn',
      employees: '700+',
      website: 'https://duolingo.com'
    }
  },
  { 
    symbol: 'BLK', 
    name: 'BlackRock', 
    companyHealth: 3.8, 
    companyPerformance: 2.5, 
    overall: 6.3, 
    tier: 'mid', 
    industry: 'Financial Services',
    currentPrice: 1023.45,
    healthMetrics: { epsScore: 5, peScore: 2, deScore: 3, fcfScore: 4, marginScore: 5 },


    companyInfo: {
      description: 'BlackRock, Inc. is the world\'s largest asset manager with over $10 trillion in assets under management. It provides investment management, risk management, and advisory services.',
      founded: '1988',
      headquarters: 'New York City, New York, USA',
      ceo: 'Larry Fink',
      employees: '19,800+',
      website: 'https://blackrock.com'
    }
  },
  { 
    symbol: 'MA', 
    name: 'Mastercard', 
    companyHealth: 3.2, 
    companyPerformance: 3, 
    overall: 6.2, 
    tier: 'mid', 
    industry: 'Financial Services',
    currentPrice: 523.67,
    healthMetrics: { epsScore: 4, peScore: 2, deScore: 4, fcfScore: 3, marginScore: 5 },
    companyInfo: {
      description: 'Mastercard Incorporated is a multinational financial services corporation that processes payments between the banks of merchants and the card-issuing banks or credit unions of purchasers.',
      founded: '1966',
      headquarters: 'Purchase, New York, USA',
      ceo: 'Michael Miebach',
      employees: '33,400+',
      website: 'https://mastercard.com'
    }
  },
  { 
    symbol: 'MRK', 
    name: 'Merck', 
    companyHealth: 4.0, 
    companyPerformance: 2.5, 
    overall: 6.5, 
    tier: 'mid', 
    industry: 'Healthcare',
    currentPrice: 99.87,
    healthMetrics: { epsScore: 4, peScore: 3, deScore: 3, fcfScore: 3, marginScore: 4 },
    companyInfo: {
      description: 'Merck & Co., Inc. is a multinational pharmaceutical company. It is one of the largest pharmaceutical companies in the world, known for Keytruda and vaccines.',
      founded: '1891',
      headquarters: 'Rahway, New Jersey, USA',
      ceo: 'Robert Davis',
      employees: '69,000+',
      website: 'https://merck.com'
    }
  },

  // Lower tier (Overall 5-5.9)
  { 
    symbol: 'SPOT', 
    name: 'Spotify', 
    companyHealth: 2.8, 
    companyPerformance: 3, 
    overall: 5.8, 
    tier: 'lower', 
    industry: 'Communication Services',
    currentPrice: 456.78,
    healthMetrics: { epsScore: 3, peScore: 1, deScore: 4, fcfScore: 4, marginScore: 2 },

    companyInfo: {
      description: 'Spotify Technology S.A. is a digital music, podcast, and video service that gives access to millions of songs and other content from creators worldwide.',
      founded: '2006',
      headquarters: 'Stockholm, Sweden',
      ceo: 'Daniel Ek',
      employees: '9,100+',
      website: 'https://spotify.com'
    }
  },
  { 
    symbol: 'TMUS', 
    name: 'T-Mobile US', 
    companyHealth: 2.8, 
    companyPerformance: 3, 
    overall: 5.8, 
    tier: 'lower', 
    industry: 'Telecommunications',
    currentPrice: 234.56,
    healthMetrics: { epsScore: 5, peScore: 3, deScore: 1, fcfScore: 3, marginScore: 4 },
    companyInfo: {
      description: 'T-Mobile US, Inc. is a wireless network operator that provides wireless voice, messaging, and data services. It is the second-largest wireless carrier in the United States.',
      founded: '1994',
      headquarters: 'Bellevue, Washington, USA',
      ceo: 'Mike Sievert',
      employees: '71,000+',
      website: 'https://t-mobile.com'
    }
  },
  { 
    symbol: 'GEV', 
    name: 'GE Vernova', 
    companyHealth: 2.6, 
    companyPerformance: 3, 
    overall: 5.6, 
    tier: 'lower', 
    industry: 'Energy',
    currentPrice: 345.67,
    healthMetrics: { epsScore: 4, peScore: 3, deScore: 4, fcfScore: 3, marginScore: 2 },
    companyInfo: {
      description: 'GE Vernova is an energy company that was spun off from General Electric in 2024. It focuses on power generation, wind turbines, and grid solutions.',
      founded: '2024',
      headquarters: 'Cambridge, Massachusetts, USA',
      ceo: 'Scott Strazik',
      employees: '75,000+',
      website: 'https://gevernova.com'
    }
  },
  { 
    symbol: 'TSLA', 
    name: 'Tesla', 
    companyHealth: 2.4, 
    companyPerformance: 3, 
    overall: 5.4, 
    tier: 'lower', 
    industry: 'Automotive',
    currentPrice: 421.06,
    healthMetrics: { epsScore: 2, peScore: 1, deScore: 5, fcfScore: 1, marginScore: 2 },
    companyInfo: {
      description: 'Tesla, Inc. is an electric vehicle and clean energy company. It designs, manufactures, and sells electric vehicles, battery energy storage, and solar panels.',
      founded: '2003',
      headquarters: 'Austin, Texas, USA',
      ceo: 'Elon Musk',
      employees: '140,000+',
      website: 'https://tesla.com'
    }
  },
  { 
    symbol: 'ORCL', 
    name: 'Oracle', 
    companyHealth: 2.0, 
    companyPerformance: 3, 
    overall: 5, 
    tier: 'lower', 
    industry: 'Software',
    currentPrice: 178.45,
    healthMetrics: { epsScore: 4, peScore: 4, deScore: 1, fcfScore: 3, marginScore: 2 },
    companyInfo: {
      description: 'Oracle Corporation is a multinational computer technology company that sells database software and technology, cloud engineered systems, and enterprise software products.',
      founded: '1977',
      headquarters: 'Austin, Texas, USA',
      ceo: 'Safra Catz',
      employees: '164,000+',
      website: 'https://oracle.com'
    }
  },
  { 
    symbol: 'VST', 
    name: 'Vistra', 
    companyHealth: 3.0, 
    companyPerformance: 2, 
    overall: 5, 
    tier: 'lower', 
    industry: 'Energy',
    currentPrice: 167.89,
    healthMetrics: { epsScore: 4, peScore: 2, deScore: 2, fcfScore: 4, marginScore: 3 },

    companyInfo: {
      description: 'Vistra Corp. is an integrated retail electricity and power generation company. It is one of the largest competitive power producers in the United States.',
      founded: '2016',
      headquarters: 'Irving, Texas, USA',
      ceo: 'Jim Burke',
      employees: '6,100+',
      website: 'https://vistracorp.com'
    }
  },

  // Lowest tier (Overall <5) - highlighted in red in the original
  { 
    symbol: 'NVO', 
    name: 'Novo Nordisk', 
    companyHealth: 3.8, 
    companyPerformance: 1, 
    overall: 4.8, 
    tier: 'lowest', 
    industry: 'Healthcare',
    currentPrice: 86.45,
    healthMetrics: { epsScore: 3, peScore: 3, deScore: 4, fcfScore: 4, marginScore: 5 },

    companyInfo: {
      description: 'Novo Nordisk A/S is a Danish multinational pharmaceutical company. It is the world leader in diabetes care and a major producer of GLP-1 drugs like Ozempic and Wegovy.',
      founded: '1923',
      headquarters: 'Bagsværd, Denmark',
      ceo: 'Lars Fruergaard Jørgensen',
      employees: '64,000+',
      website: 'https://novonordisk.com'
    }
  },
  { 
    symbol: 'HD', 
    name: 'Home Depot', 
    companyHealth: 2.8, 
    companyPerformance: 2, 
    overall: 4.8, 
    tier: 'lowest', 
    industry: 'Consumer Cyclical',
    currentPrice: 412.34,
    healthMetrics: { epsScore: 4, peScore: 2, deScore: 2, fcfScore: 4, marginScore: 4 },
    companyInfo: {
      description: 'The Home Depot, Inc. is the largest home improvement retailer in the United States, supplying tools, construction products, appliances, and services.',
      founded: '1978',
      headquarters: 'Atlanta, Georgia, USA',
      ceo: 'Ted Decker',
      employees: '475,000+',
      website: 'https://homedepot.com'
    }
  },
  { 
    symbol: 'HUBS', 
    name: 'HubSpot', 
    companyHealth: 2.0, 
    companyPerformance: 1.5, 
    overall: 3.5, 
    tier: 'lowest', 
    industry: 'Software',
    currentPrice: 734.56,
    healthMetrics: { epsScore: 3, peScore: 1, deScore: 5, fcfScore: 3, marginScore: 2 },
    companyInfo: {
      description: 'HubSpot, Inc. is a developer and marketer of software products for inbound marketing, sales, and customer service. It provides a CRM platform for businesses.',
      founded: '2006',
      headquarters: 'Cambridge, Massachusetts, USA',
      ceo: 'Yamini Rangan',
      employees: '7,600+',
      website: 'https://hubspot.com'
    }
  },
  { 
    symbol: 'SBUX', 
    name: 'Starbucks', 
    companyHealth: 2.0, 
    companyPerformance: 1, 
    overall: 3, 
    tier: 'lowest', 
    industry: 'Consumer Cyclical',
    currentPrice: 87.65,
    healthMetrics: { epsScore: 3, peScore: 3, deScore: 1, fcfScore: 3, marginScore: 3 },
    companyInfo: {
      description: 'Starbucks Corporation is a multinational chain of coffeehouses and roastery reserves. It is the world\'s largest coffeehouse chain with over 35,000 stores worldwide.',
      founded: '1971',
      headquarters: 'Seattle, Washington, USA',
      ceo: 'Brian Niccol',
      employees: '402,000+',
      website: 'https://starbucks.com'
    }
  },
  { 
    symbol: 'CRWV', 
    name: 'CoreWeave', 
    companyHealth: 3.0, 
    companyPerformance: 1, 
    overall: 4, 
    tier: 'lowest', 
    industry: 'Cloud Computing',
    currentPrice: 45.67,
    healthMetrics: { epsScore: 1, peScore: 1, deScore: 1, fcfScore: 1, marginScore: 2 },
    companyInfo: {
      description: 'CoreWeave is a specialized cloud provider built for GPU-accelerated workloads. It provides infrastructure for AI, machine learning, and visual effects rendering.',
      founded: '2017',
      headquarters: 'Roseland, New Jersey, USA',
      ceo: 'Michael Intrator',
      employees: '1,000+',
      website: 'https://coreweave.com'
    }
  },
];

// Helper function to get rating by symbol
export const getStockRating = (symbol: string): StockRating | undefined => {
  return stockRatings.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
};

// Helper function to get stock with simulated price
export const getStockWithPrice = (symbol: string): (StockRating & { simulatedPrice: { price: number; change: number; changePercent: number } }) | undefined => {
  const stock = getStockRating(symbol);
  if (!stock) return undefined;
  return {
    ...stock,
    simulatedPrice: getSimulatedPrice(stock.currentPrice, stock.symbol)
  };
};

// Helper function to get tier color
export const getTierColor = (tier: StockRating['tier']): string => {
  switch (tier) {
    case 'top': return 'text-emerald-400 bg-emerald-500/20';
    case 'high': return 'text-cyan-400 bg-cyan-500/20';
    case 'mid-high': return 'text-blue-400 bg-blue-500/20';
    case 'mid': return 'text-amber-400 bg-amber-500/20';
    case 'lower': return 'text-orange-400 bg-orange-500/20';
    case 'lowest': return 'text-red-400 bg-red-500/20';
    default: return 'text-slate-400 bg-slate-500/20';
  }
};

// Helper function to get overall rating color
export const getOverallRatingColor = (overall: number): string => {
  if (overall >= 9) return 'text-emerald-400';
  if (overall >= 8) return 'text-cyan-400';
  if (overall >= 7) return 'text-blue-400';
  if (overall >= 6) return 'text-amber-400';
  if (overall >= 5) return 'text-orange-400';
  return 'text-red-400';
};

// Get stocks for the ticker (top 15 stocks by overall rating)
export const getTickerStocks = (): StockRating[] => {
  return stockRatings.slice(0, 15);
};

// Get all stocks sorted by overall rating
export const getAllStocksSorted = (): StockRating[] => {
  return [...stockRatings].sort((a, b) => b.overall - a.overall);
};

// Get stocks by industry
export const getStocksByIndustry = (industry: string): StockRating[] => {
  if (industry === 'All Industries') return stockRatings;
  return stockRatings.filter(s => s.industry === industry);
};

// Get unique industries with stock counts
export const getIndustriesWithCounts = (): { industry: string; count: number }[] => {
  const counts: Record<string, number> = {};
  stockRatings.forEach(s => {
    counts[s.industry] = (counts[s.industry] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count);
};

// Get score color based on value (1-5)
export const getScoreColor = (score: number): string => {
  if (score >= 5) return 'text-emerald-400 bg-emerald-500/20';
  if (score >= 4) return 'text-cyan-400 bg-cyan-500/20';
  if (score >= 3) return 'text-blue-400 bg-blue-500/20';
  if (score >= 2) return 'text-amber-400 bg-amber-500/20';
  return 'text-red-400 bg-red-500/20';
};

// Calculate average health score from metrics
export const calculateHealthScore = (metrics: HealthMetrics): number => {
  const { epsScore, peScore, deScore, fcfScore, marginScore } = metrics;
  return Number(((epsScore + peScore + deScore + fcfScore + marginScore) / 5).toFixed(1));
};
