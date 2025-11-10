const { generateQuestion, evaluateAnswer, listTopics } = require('../utils/ai');
const Session = require('../models/Session');

const useMemory = () => process.env.USE_IN_MEMORY_DB === 'true';

async function getRecentQuestionSet(userId, topic, limit = 25) {
  if (useMemory()) {
    const sessions = global.__SESSIONS__ || [];
    const recent = sessions.filter(s => s.userId === userId && s.topic === topic);
    const slice = recent.slice(Math.max(0, recent.length - limit));
    return new Set(slice.map(s => s.question));
  }
  const docs = await Session.find({ userId, topic }).sort({ createdAt: -1 }).limit(limit).lean();
  return new Set(docs.map(d => d.question));
}

async function saveSessionEntry({ userId, topic, question, answer, feedback, score }) {
  if (useMemory()) {
    global.__SESSIONS__ = global.__SESSIONS__ || [];
    global.__SESSIONS__.push({ userId, topic, question, answer, feedback, score, createdAt: new Date() });
    return;
  }
  await Session.create({ userId, topic, question, answer, feedback, score });
}

exports.getTopics = (req, res) => {
  res.json({ topics: listTopics() });
};

exports.ask = async (req, res) => {
  const { topic, question, answer } = req.body || {};
  if (!topic) return res.status(400).json({ message: 'Topic is required' });

  // Validate topic against supported list to avoid unexpected model prompts
  const topics = new Set(listTopics());
  if (!topics.has(topic)) {
    return res.status(400).json({ message: 'Invalid topic' });
  }

  // Sanitize answer: trim and cap length to keep latency predictable
  const cleanAnswer = typeof answer === 'string' ? answer.trim().slice(0, 4000) : answer;

  try {
    // If no answer provided, serve a question
    if (!cleanAnswer) {
      const seen = await getRecentQuestionSet(req.userId, topic);
      let q = await generateQuestion(topic);
      for (let i = 0; i < 6 && seen.has(q); i++) {
        q = await generateQuestion(topic);
      }
      return res.json({ question: q });
    }

    // Evaluate answer and provide next question
    const usedQuestion = question || await generateQuestion(topic);
    const result = await evaluateAnswer(topic, usedQuestion, cleanAnswer);

    // Persist session entry
    await saveSessionEntry({
      userId: req.userId,
      topic,
      question: usedQuestion,
      answer: cleanAnswer,
      feedback: result.feedback,
      score: result.score,
    });

    // Generate next question avoiding recent duplicates
    const seen = await getRecentQuestionSet(req.userId, topic);
    seen.add(usedQuestion);
    let next = await generateQuestion(topic);
    for (let i = 0; i < 6 && (next === usedQuestion || seen.has(next)); i++) {
      next = await generateQuestion(topic);
    }
    return res.json({ feedback: result.feedback, score: result.score, nextQuestion: next });
  } catch (err) {
    console.error('Interview ask error:', err);
    res.status(500).json({ message: 'Failed to process interview request' });
  }
};

exports.getHistory = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
  const topic = req.query.topic;
  try {
    if (useMemory()) {
      const sessions = (global.__SESSIONS__ || [])
        .filter(s => s.userId === req.userId && (!topic || s.topic === topic))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
      return res.json({ history: sessions });
    }
    const query = { userId: req.userId };
    if (topic) query.topic = topic;
    const docs = await Session.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ history: docs });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};