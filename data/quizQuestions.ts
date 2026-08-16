export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  explanation: string;
}

export interface LessonQuiz {
  lessonId: string;
  title: string;
  questions: QuizQuestion[];
}

export const lessonQuizzes: LessonQuiz[] = [
  {
    lessonId: 'lesson-1',
    title: 'What Are Stocks And Why Invest',
    questions: [
      {
        id: 'l1-q1',
        question: 'What does owning a stock represent?',
        options: [
          'A loan to a company',
          'Partial ownership in a company',
          'A guarantee of profit',
          'A fixed interest payment'
        ],
        correctAnswer: 1,
        explanation: 'When you buy a stock, you become a partial owner (shareholder) of that company, entitled to a share of its profits and assets.'
      },
      {
        id: 'l1-q2',
        question: 'What is one of the main reasons people invest in stocks?',
        options: [
          'To avoid all financial risk',
          'To get guaranteed returns',
          'To grow wealth over time and beat inflation',
          'To receive immediate cash payments'
        ],
        correctAnswer: 2,
        explanation: 'Investing in stocks helps grow wealth over time and historically has provided returns that outpace inflation.'
      },
      {
        id: 'l1-q3',
        question: 'What is a dividend?',
        options: [
          'A fee charged by brokers',
          'A portion of company profits paid to shareholders',
          'The price of a stock',
          'A type of stock market'
        ],
        correctAnswer: 1,
        explanation: 'Dividends are portions of a company\'s profits distributed to shareholders, providing passive income.'
      },
      {
        id: 'l1-q4',
        question: 'What is the primary difference between stocks and bonds?',
        options: [
          'Stocks are always safer than bonds',
          'Bonds represent ownership, stocks represent debt',
          'Stocks represent ownership, bonds represent debt/loans',
          'There is no difference'
        ],
        correctAnswer: 2,
        explanation: 'Stocks represent ownership in a company, while bonds are loans you make to companies or governments that pay interest.'
      },
      {
        id: 'l1-q5',
        question: 'Why is starting to invest early important?',
        options: [
          'Stock prices are always lower for young investors',
          'Compound interest allows money to grow exponentially over time',
          'Young people get special tax benefits',
          'Early investors always make more money'
        ],
        correctAnswer: 1,
        explanation: 'Starting early allows compound interest to work in your favor - your returns generate their own returns over time.'
      }
    ]
  },
  {
    lessonId: 'lesson-2',
    title: 'How The Stock Market Works',
    questions: [
      {
        id: 'l2-q1',
        question: 'What is a stock exchange?',
        options: [
          'A place where you exchange currency',
          'A marketplace where stocks are bought and sold',
          'A government agency that regulates stocks',
          'A type of investment fund'
        ],
        correctAnswer: 1,
        explanation: 'A stock exchange is a regulated marketplace where buyers and sellers trade stocks, like the NYSE or NASDAQ.'
      },
      {
        id: 'l2-q2',
        question: 'What determines the price of a stock?',
        options: [
          'The government sets all stock prices',
          'Only the company decides the price',
          'Supply and demand from buyers and sellers',
          'Stock prices never change'
        ],
        correctAnswer: 2,
        explanation: 'Stock prices are determined by supply and demand - when more people want to buy than sell, prices rise, and vice versa.'
      },
      {
        id: 'l2-q3',
        question: 'What is a market order?',
        options: [
          'An order to buy/sell at the best available current price',
          'An order that only executes at a specific price',
          'An order to buy the entire market',
          'A type of investment strategy'
        ],
        correctAnswer: 0,
        explanation: 'A market order executes immediately at the best available price, prioritizing speed over price.'
      },
      {
        id: 'l2-q4',
        question: 'What is a limit order?',
        options: [
          'An order with no price restrictions',
          'An order that sets a maximum buy price or minimum sell price',
          'An order that expires immediately',
          'An order only available to professional traders'
        ],
        correctAnswer: 1,
        explanation: 'A limit order specifies the maximum price you\'ll pay (buy) or minimum you\'ll accept (sell), giving you price control.'
      },
      {
        id: 'l2-q5',
        question: 'What does "market capitalization" mean?',
        options: [
          'The total amount of money in the stock market',
          'The total value of a company\'s outstanding shares',
          'The maximum price a stock can reach',
          'The amount of debt a company has'
        ],
        correctAnswer: 1,
        explanation: 'Market cap = stock price × total shares outstanding. It represents the total market value of a company.'
      },
      {
        id: 'l2-q6',
        question: 'What are "bulls" and "bears" in stock market terminology?',
        options: [
          'Types of stocks',
          'Bulls expect prices to rise; bears expect prices to fall',
          'Government regulators',
          'Types of trading platforms'
        ],
        correctAnswer: 1,
        explanation: 'Bulls are optimistic investors expecting prices to rise, while bears are pessimistic expecting prices to fall.'
      }
    ]
  },
  {
    lessonId: 'lesson-3',
    title: 'Understand Risk to Reward',
    questions: [
      {
        id: 'l3-q1',
        question: 'What is the risk-reward ratio?',
        options: [
          'The amount of money you can lose',
          'A comparison of potential profit to potential loss',
          'The interest rate on investments',
          'The number of stocks in your portfolio'
        ],
        correctAnswer: 1,
        explanation: 'Risk-reward ratio compares potential profit to potential loss, helping investors evaluate if a trade is worth taking.'
      },
      {
        id: 'l3-q2',
        question: 'What is diversification?',
        options: [
          'Putting all money in one stock',
          'Spreading investments across different assets to reduce risk',
          'Only investing in technology stocks',
          'Buying stocks at different times'
        ],
        correctAnswer: 1,
        explanation: 'Diversification means spreading investments across different assets, sectors, and markets to reduce overall risk.'
      },
      {
        id: 'l3-q3',
        question: 'What is volatility in investing?',
        options: [
          'The guarantee of returns',
          'How much a stock\'s price fluctuates over time',
          'The total value of your portfolio',
          'The number of trades you make'
        ],
        correctAnswer: 1,
        explanation: 'Volatility measures how much and how quickly a stock\'s price changes. Higher volatility means more risk but potentially more reward.'
      },
      {
        id: 'l3-q4',
        question: 'What is a stop-loss order?',
        options: [
          'An order to buy more stock when prices fall',
          'An automatic sell order triggered when price drops to a set level',
          'A guarantee against losses',
          'A type of investment account'
        ],
        correctAnswer: 1,
        explanation: 'A stop-loss automatically sells your stock when it drops to a predetermined price, limiting potential losses.'
      },
      {
        id: 'l3-q5',
        question: 'Generally, what is the relationship between risk and potential return?',
        options: [
          'Higher risk usually means lower potential returns',
          'Risk and return are not related',
          'Higher risk usually means higher potential returns',
          'Lower risk always guarantees higher returns'
        ],
        correctAnswer: 2,
        explanation: 'Generally, investments with higher risk offer higher potential returns to compensate investors for taking on more risk.'
      },
      {
        id: 'l3-q6',
        question: 'What is your "risk tolerance"?',
        options: [
          'The maximum amount you can invest',
          'Your ability and willingness to endure investment losses',
          'The number of risky stocks you own',
          'A government regulation'
        ],
        correctAnswer: 1,
        explanation: 'Risk tolerance is your personal comfort level with potential losses, influenced by factors like age, income, and financial goals.'
      }
    ]
  },
  {
    lessonId: 'lesson-4',
    title: 'How To Pick Stocks',
    questions: [
      {
        id: 'l4-q1',
        question: 'What is fundamental analysis?',
        options: [
          'Analyzing stock price charts and patterns',
          'Evaluating a company\'s financial health and business value',
          'Following market trends',
          'Copying other investors\' picks'
        ],
        correctAnswer: 1,
        explanation: 'Fundamental analysis examines a company\'s financial statements, management, competitive position, and industry to determine its intrinsic value.'
      },
      {
        id: 'l4-q2',
        question: 'What is the P/E (Price-to-Earnings) ratio?',
        options: [
          'The company\'s total profit',
          'Stock price divided by earnings per share',
          'The percentage of profit paid as dividends',
          'The number of shares outstanding'
        ],
        correctAnswer: 1,
        explanation: 'P/E ratio = Stock Price ÷ Earnings Per Share. It shows how much investors pay for each dollar of earnings.'
      },
      {
        id: 'l4-q3',
        question: 'What is technical analysis?',
        options: [
          'Analyzing company financial statements',
          'Studying price charts and trading patterns to predict future movements',
          'Researching company management',
          'Calculating dividend yields'
        ],
        correctAnswer: 1,
        explanation: 'Technical analysis uses historical price data, charts, and indicators to identify patterns and predict future price movements.'
      },
      {
        id: 'l4-q4',
        question: 'What does "earnings per share" (EPS) measure?',
        options: [
          'The total revenue of a company',
          'The profit allocated to each outstanding share of stock',
          'The dividend paid per share',
          'The stock price'
        ],
        correctAnswer: 1,
        explanation: 'EPS = Net Income ÷ Outstanding Shares. It shows how much profit is attributable to each share of stock.'
      },
      {
        id: 'l4-q5',
        question: 'Why is it important to research a company\'s competitive advantage?',
        options: [
          'It determines the stock price directly',
          'Companies with strong advantages can maintain profitability longer',
          'It\'s required by law',
          'Competitive advantage doesn\'t matter for investing'
        ],
        correctAnswer: 1,
        explanation: 'A strong competitive advantage (moat) helps companies maintain market position and profitability over time.'
      },
      {
        id: 'l4-q6',
        question: 'What is a "growth stock"?',
        options: [
          'A stock that pays high dividends',
          'A stock from a company expected to grow faster than average',
          'A stock that never loses value',
          'A stock in the agricultural sector'
        ],
        correctAnswer: 1,
        explanation: 'Growth stocks are shares in companies expected to grow revenues and earnings faster than the market average.'
      },
      {
        id: 'l4-q7',
        question: 'What is a "value stock"?',
        options: [
          'The most expensive stock in the market',
          'A stock trading below its perceived intrinsic value',
          'A stock that only increases in value',
          'A stock with no dividends'
        ],
        correctAnswer: 1,
        explanation: 'Value stocks trade at prices below what fundamental analysis suggests they\'re worth, potentially offering bargain opportunities.'
      }
    ]
  },
  {
    lessonId: 'lesson-5',
    title: 'Building And Managing A Portfolio',
    questions: [
      {
        id: 'l5-q1',
        question: 'What is asset allocation?',
        options: [
          'Buying only one type of asset',
          'Dividing investments among different asset categories',
          'Selling all your assets',
          'The price of your assets'
        ],
        correctAnswer: 1,
        explanation: 'Asset allocation is the strategy of dividing investments among different asset categories like stocks, bonds, and cash.'
      },
      {
        id: 'l5-q2',
        question: 'What is portfolio rebalancing?',
        options: [
          'Selling all investments and starting over',
          'Adjusting holdings to maintain your target asset allocation',
          'Only buying new stocks',
          'Checking your portfolio daily'
        ],
        correctAnswer: 1,
        explanation: 'Rebalancing involves periodically buying or selling assets to maintain your desired allocation percentages.'
      },
      {
        id: 'l5-q3',
        question: 'What is dollar-cost averaging?',
        options: [
          'Investing a fixed amount at regular intervals regardless of price',
          'Only buying when prices are low',
          'Investing all money at once',
          'Converting dollars to other currencies'
        ],
        correctAnswer: 0,
        explanation: 'Dollar-cost averaging means investing a fixed amount regularly, which reduces the impact of volatility over time.'
      },
      {
        id: 'l5-q4',
        question: 'Why might you include bonds in a stock portfolio?',
        options: [
          'Bonds always have higher returns than stocks',
          'To reduce overall portfolio volatility and risk',
          'Bonds are required by law',
          'Bonds and stocks are the same thing'
        ],
        correctAnswer: 1,
        explanation: 'Bonds typically have lower volatility than stocks and can provide stability and income to balance a portfolio.'
      },
      {
        id: 'l5-q5',
        question: 'What is an index fund?',
        options: [
          'A fund that tries to beat the market',
          'A fund that tracks a specific market index like the S&P 500',
          'A fund only for professional investors',
          'A type of savings account'
        ],
        correctAnswer: 1,
        explanation: 'Index funds passively track a market index, offering broad diversification with typically lower fees.'
      }
    ]
  },
  {
    lessonId: 'lesson-6',
    title: 'Practical Steps to Start Investing',
    questions: [
      {
        id: 'l6-q1',
        question: 'What should you do before starting to invest?',
        options: [
          'Invest all your savings immediately',
          'Build an emergency fund and pay off high-interest debt',
          'Wait until you\'re wealthy',
          'Only invest in cryptocurrency'
        ],
        correctAnswer: 1,
        explanation: 'Before investing, establish an emergency fund (3-6 months expenses) and pay off high-interest debt.'
      },
      {
        id: 'l6-q2',
        question: 'What is a brokerage account?',
        options: [
          'A type of savings account',
          'An account that allows you to buy and sell investments',
          'A loan for investing',
          'A government retirement account'
        ],
        correctAnswer: 1,
        explanation: 'A brokerage account is an investment account that allows you to buy and sell stocks, bonds, and other securities.'
      },
      {
        id: 'l6-q3',
        question: 'What is a 401(k)?',
        options: [
          'A type of stock',
          'An employer-sponsored retirement savings plan with tax advantages',
          'A government bond',
          'A trading strategy'
        ],
        correctAnswer: 1,
        explanation: 'A 401(k) is an employer-sponsored retirement plan that offers tax advantages and often includes employer matching.'
      },
      {
        id: 'l6-q4',
        question: 'What is an IRA (Individual Retirement Account)?',
        options: [
          'A type of stock exchange',
          'A personal retirement account with tax advantages',
          'A trading platform',
          'A type of mutual fund'
        ],
        correctAnswer: 1,
        explanation: 'An IRA is a personal retirement account offering tax advantages, available as Traditional (tax-deferred) or Roth (tax-free growth).'
      },
      {
        id: 'l6-q5',
        question: 'How much money do you need to start investing?',
        options: [
          'At least $10,000',
          'At least $1,000',
          'You can start with any amount, even small amounts',
          'You need to be wealthy to invest'
        ],
        correctAnswer: 2,
        explanation: 'Many brokers now offer fractional shares and no minimums, allowing you to start investing with any amount.'
      }
    ]
  }
];
