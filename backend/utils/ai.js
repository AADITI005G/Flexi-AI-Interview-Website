const topics = {
  'Data Structures': [
    'Explain the difference between array and linked list.',
    'How does a hash map resolve collisions?',
    'What is a binary search tree and its invariants?',
  ],
  'Algorithms': [
    'Describe time complexity of quicksort and when it degrades.',
    'How would you detect a cycle in a directed graph?',
    'What is dynamic programming and a classic example?',
  ],
  'System Design': [
    'Design a URL shortener. Key components?',
    'How would you scale a chat application?',
    'What are the pros/cons of microservices?'
  ],
  'Machine Learning': [
    'Bias vs variance trade-off?',
    'Explain gradient descent and learning rate.',
    'How do you prevent overfitting?'
  ]
};

// Richer building blocks to generate varied fallback questions
const subtopics = {
  'Algorithms': [
    'quicksort', 'mergesort', 'binary search', 'Dijkstra\'s algorithm', 'A* search',
    'topological sort', 'KMP string search', 'dynamic programming for knapsack',
    'union-find (disjoint set)', 'two-pointer technique'
  ],
  'Data Structures': [
    'array vs linked list', 'stack vs queue', 'hash map vs tree map', 'heap', 'trie',
    'balanced BST (AVL/Red-Black)', 'LRU cache', 'bloom filter', 'segment tree', 'graph representations'
  ],
  'System Design': [
    'rate limiter', 'message queue', 'API gateway', 'distributed cache', 'CDN',
    'search service', 'notifications system', 'metrics pipeline', 'real-time chat', 'image processing service'
  ],
  'Machine Learning': [
    'bias-variance tradeoff', 'regularization (L1/L2)', 'cross-validation', 'feature scaling', 'overfitting vs underfitting',
    'gradient descent variants', 'evaluation metrics (precision/recall/F1)', 'confusion matrix', 'train/val/test split', 'hyperparameter tuning'
  ]
};

const constraints = [
  'time and space complexity', 'scalability under high load', 'latency and throughput',
  'fault tolerance and resiliency', 'consistency vs availability trade-offs', 'data modeling and indexing',
  'state management and caching', 'security considerations', 'operational simplicity and maintainability'
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFallbackQuestionFromTemplates(topic) {
  const area = subtopics[topic] ? topic : 'Algorithms';
  const a = pickRandom(subtopics[area]);
  // ensure we pick two distinct items when needed
  let b = pickRandom(subtopics[area]);
  for (let i = 0; i < 5 && b === a; i++) b = pickRandom(subtopics[area]);
  const c = pickRandom(constraints);

  const templates = [
    `Explain ${a} and discuss ${c}.`,
    `Compare ${a} with ${b}; when would you choose each?`,
    `Walk through implementing ${a} and analyze ${c}.`,
    `What are common pitfalls of ${a}, and how do you mitigate them?`,
  ];

  if (area === 'System Design') {
    const sdTemplates = [
      `Design a ${a} for millions of users; address ${c}.`,
      `How would you scale a ${a}? Consider ${c}.`,
      `What components and data flows would a ${a} include? Cover ${c}.`,
    ];
    templates.push(pickRandom(sdTemplates));
  }

  if (area === 'Machine Learning') {
    const mlTemplates = [
      `Explain ${a} with a concise example; include ${c}.`,
      `How would you evaluate a model using ${a}? Discuss ${c}.`,
      `What causes issues with ${a}, and how would you improve it?`,
    ];
    templates.push(pickRandom(mlTemplates));
  }

  // Slight random phrasing variation
  const q = pickRandom(templates);
  return q.endsWith('.') ? q : `${q}.`;
}

let openaiClient;
try {
  const OpenAI = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  // Optional Groq provider (OpenAI-compatible API)
  if (process.env.GROQ_API_KEY) {
    global.__GROQ_CLIENT__ = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
} catch (_) {
  // openai lib not installed or not available
}

async function generateQuestion(topic) {
  // If OpenAI client is available, ask it to generate a new question.
  const system = `You are an expert interviewer. Generate one concise technical interview question for the given topic. Only return the question text.`;
  const user = `Topic: ${topic}\nConstraints: Avoid duplicates, be specific, 1–2 sentences.`;
  const providers = [];
  const prefer = String(process.env.AI_PROVIDER || '').toLowerCase();
  const openaiProv = openaiClient && { client: openaiClient, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' };
  // Prefer a faster model for question generation to improve responsiveness
  const groqProv = global.__GROQ_CLIENT__ && {
    client: global.__GROQ_CLIENT__,
    model: process.env.GROQ_QUESTION_MODEL || process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
  };
  if (prefer === 'groq') {
    if (groqProv) providers.push(groqProv);
    if (openaiProv) providers.push(openaiProv);
  } else {
    if (openaiProv) providers.push(openaiProv);
    if (groqProv) providers.push(groqProv);
  }
  for (const { client, model } of providers) {
    try {
      let lastErr;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const resp = await client.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user }
            ],
            temperature: 0.8,
          });
          const text = resp.choices?.[0]?.message?.content?.trim();
          if (text) return text;
          break;
        } catch (err) {
          lastErr = err;
          const is429 = String(err?.status || err?.code || err?.message).includes('429');
          if (is429) {
            const delay = 250 + Math.floor(Math.random() * 300);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          throw err;
        }
      }
      if (lastErr) throw lastErr;
    } catch (err) {
      const label = client === openaiClient ? 'OpenAI' : 'Groq';
      console.warn(`${label} question generation failed, trying next provider or fallback:`, err.message);
    }
  }
  // Generate a varied fallback question algorithmically
  return generateFallbackQuestionFromTemplates(topic);
}

async function evaluateAnswer(topic, question, answer) {
  // Build a dynamic rubric based on topic and question
  const rubricByTopic = {
    'Algorithms': [
      { name: 'Time complexity', kw: ['time', 'complexity', 'O('], weight: 2 },
      { name: 'Correctness & edge cases', kw: ['correct', 'proof', 'edge', 'corner', 'worst'], weight: 2 },
      { name: 'Space complexity', kw: ['space', 'memory'], weight: 1 },
      { name: 'Examples & use cases', kw: ['example', 'e.g.', 'for instance', 'use case', 'scenario'], weight: 1 },
      { name: 'Algorithm steps & reasoning', kw: ['step', 'first', 'then', 'finally', 'approach'], weight: 2 },
      { name: 'Trade-offs & alternatives', kw: ['trade', 'vs', 'alternative', 'compare'], weight: 1 },
    ],
    'Data Structures': [
      { name: 'Operations complexity', kw: ['insert', 'delete', 'search', 'O('], weight: 2 },
      { name: 'Use cases', kw: ['use case', 'when', 'scenario'], weight: 1 },
      { name: 'Trade-offs', kw: ['trade', 'vs', 'alternative'], weight: 2 },
      { name: 'Memory & layout', kw: ['memory', 'contiguous', 'pointer'], weight: 1 },
      { name: 'Pitfalls & limitations', kw: ['pitfall', 'limitation', 'drawback'], weight: 1 },
    ],
    'System Design': [
      { name: 'Scalability', kw: ['scale', 'shard', 'horizontal', 'vertical'], weight: 2 },
      { name: 'Reliability & fault tolerance', kw: ['fault', 'availability', 'replica', 'retry'], weight: 2 },
      { name: 'Data modeling & indexing', kw: ['index', 'schema', 'partition', 'key'], weight: 1 },
      { name: 'Trade-offs (CAP, consistency vs availability)', kw: ['cap', 'consistency', 'availability', 'trade'], weight: 2 },
      { name: 'Performance & bottlenecks', kw: ['latency', 'throughput', 'bottleneck', 'cache'], weight: 1 },
      { name: 'Operational concerns', kw: ['monitor', 'deploy', 'observability', 'maintenance'], weight: 1 },
    ],
    'Machine Learning': [
      { name: 'Metrics & evaluation', kw: ['precision', 'recall', 'f1', 'auc', 'confusion'], weight: 2 },
      { name: 'Bias-variance & regularization', kw: ['bias', 'variance', 'regularization', 'l1', 'l2', 'dropout'], weight: 2 },
      { name: 'Overfitting & generalization', kw: ['overfit', 'underfit', 'cross-validation', 'validation'], weight: 1 },
      { name: 'Feature engineering & scaling', kw: ['feature', 'scaling', 'normalize', 'standardize'], weight: 1 },
      { name: 'Model choice & trade-offs', kw: ['model', 'baseline', 'complex', 'trade'], weight: 1 },
      { name: 'Practical applications', kw: ['use case', 'application', 'deployment'], weight: 1 },
    ],
  };

  function buildDynamicRubric(t, q) {
    const base = rubricByTopic[t] || rubricByTopic['Algorithms'];
    const general = [
      { name: 'Examples', kw: ['example', 'e.g.', 'for instance'], weight: 1 },
      { name: 'Clarity & structure', kw: ['first', 'second', 'finally'], weight: 1 },
      { name: 'Accuracy', kw: ['correct', 'accurate', 'incorrect', 'mistake'], weight: 2 },
      { name: 'Real-world application', kw: ['use case', 'scenario', 'production', 'real world'], weight: 1 },
    ];
    const res = [...base, ...general];
    const qText = String(q || '').toLowerCase();
    // Question-specific hints
    if (qText.includes('compare') || qText.includes('difference')) {
      res.push({ name: 'Comparison & criteria', kw: ['compare', 'difference', 'pros', 'cons'], weight: 2 });
    }
    if (qText.includes('design') || qText.includes('scale')) {
      res.push({ name: 'Architecture & bottlenecks', kw: ['bottleneck', 'component', 'latency', 'throughput'], weight: 2 });
    }
    return res;
  }

  function tokenize(s) {
    return String(s || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(w => w && w.length > 2);
  }

  function isVague(text) {
    const t = String(text || '').toLowerCase().trim();
    const short = t.length < 30;
    const vaguePhrases = ['i don\'t know', 'not sure', 'maybe', 'it depends', 'stuff', 'things'];
    const hasVague = vaguePhrases.some(p => t.includes(p));
    return short || hasVague;
  }

  function isUnrelated(ans, q, rubric) {
    const aToks = new Set(tokenize(ans));
    const qToks = new Set(tokenize(q));
    const rubKw = new Set(rubric.flatMap(c => c.kw.map(k => k.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 10)).filter(Boolean)));
    // Jaccard similarity between answer and question tokens
    const inter = new Set([...aToks].filter(x => qToks.has(x)));
    const unionSize = new Set([...aToks, ...qToks]).size || 1;
    const jaccard = inter.size / unionSize;
    // Keyword hits against rubric
    const kwHit = [...rubKw].some(k => aToks.has(k));
    // Unrelated if low overlap and no rubric signals
    return jaccard < 0.08 && !kwHit;
  }

  function scoreWithRubric(ans, rubric, q) {
    const text = String(ans || '').toLowerCase();
    // Penalize vague or unrelated answers with negative marks
    if (isUnrelated(text, q, rubric)) {
      return { score: -2, feedback: 'Answer appears unrelated to the question. Please address the asked topic and criteria.' };
    }
    if (isVague(text)) {
      return { score: -1, feedback: 'Answer is too brief or vague. Provide concrete details, examples, and address the criteria.' };
    }

    let earned = 0;
    let total = 0;
    const hit = [];
    for (const c of rubric) {
      total += c.weight;
      const matched = c.kw.some(k => text.includes(k));
      if (matched) {
        earned += c.weight;
        hit.push(c.name);
      }
    }
    const raw = total > 0 ? (earned / total) * 5 : 1;
    const score = Math.max(-2, Math.min(5, Math.round(raw)));
    const missing = rubric.filter(c => !hit.includes(c.name)).map(c => c.name);
    const feedback = `${hit.length ? `Good coverage: ${hit.join(', ')}.` : 'Consider covering core points.'} ${missing.length ? `Improve by addressing: ${missing.join(', ')}.` : ''}`.trim();
    return { score, feedback };
  }

  const dynamicRubric = buildDynamicRubric(topic, question);
  const system = `You are an expert interviewer. Evaluate the candidate's answer against the following topic-aware criteria with weights. Provide brief, constructive feedback referencing criteria, and an overall score from -2 to 5.
Scoring rules: If the answer is unrelated to the question/topic, score = -2. If the answer is vague/overly brief, score = -1. Otherwise, score from 1 to 5 based on coverage and quality.
Rubric: ${JSON.stringify(dynamicRubric.map(({name, weight}) => ({name, weight})))}
Return JSON: {"feedback":"...","score":N}`;
  const user = `Topic: ${topic}\nQuestion: ${question}\nAnswer: ${answer}`;
  const providers = [];
  const prefer = String(process.env.AI_PROVIDER || '').toLowerCase();
  const openaiProv = openaiClient && { client: openaiClient, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' };
  const groqProv = global.__GROQ_CLIENT__ && { client: global.__GROQ_CLIENT__, model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' };
  if (prefer === 'groq') {
    if (groqProv) providers.push(groqProv);
    if (openaiProv) providers.push(openaiProv);
  } else {
    if (openaiProv) providers.push(openaiProv);
    if (groqProv) providers.push(groqProv);
  }
  for (const { client, model } of providers) {
    try {
      let lastErr;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const resp = await client.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user }
            ],
            temperature: 0.3,
          });
          const text = resp.choices?.[0]?.message?.content?.trim();
          if (text) {
            try {
              const parsed = JSON.parse(text);
              if (parsed && typeof parsed.score === 'number' && parsed.feedback) {
                return { score: Math.max(-2, Math.min(5, parsed.score)), feedback: parsed.feedback };
              }
            } catch (_) {
              // If not valid JSON, fall through to heuristic
            }
          }
          break; // if no text, do not retry
        } catch (err) {
          lastErr = err;
          const is429 = String(err?.status || err?.code || err?.message).includes('429');
          if (is429) {
            const delay = 250 + Math.floor(Math.random() * 300);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          throw err;
        }
      }
      if (lastErr) throw lastErr;
    } catch (err) {
      const label = client === openaiClient ? 'OpenAI' : 'Groq';
      console.warn(`${label} evaluation failed, trying next provider or fallback:`, err.message);
    }
  }
  // Dynamic rubric fallback evaluation
  return scoreWithRubric(answer, dynamicRubric, question);
}

const listTopics = () => Object.keys(topics);

module.exports = { generateQuestion, evaluateAnswer, listTopics };