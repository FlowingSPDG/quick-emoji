import { Hono } from 'hono';
import {
  getEmojis,
  saveSession,
  getSession,
  deleteSession,
  generateSessionId,
  generateUserId
} from '../lib/kv';
import {
  validateGameSettings,
  validateShortcode,
  validateSessionId,
  checkGlobalRateLimit,
  checkAnswerRateLimit
} from '../lib/validation';
import { sessionRateLimit, answerRateLimit } from '../lib/rate-limit';
import {
  calculateAnswerScore,
  calculateSessionScore,
  calculateSessionStats,
  checkAnswer,
  createLeaderboardEntry
} from '../lib/scoring';
import type {
  StartSessionRequest,
  StartSessionResponse,
  AnswerRequest,
  AnswerResponse,
  EndSessionRequest,
  EndSessionResponse,
  GameSession,
  Answer
} from '@quick-emoji/shared';
import type { HonoType } from '../types';

const app = new Hono<HonoType>();

// Apply session-specific rate limiting
app.use('/start', sessionRateLimit);
app.use('/end', sessionRateLimit);
app.use('/answer', answerRateLimit);

// POST /api/session/start - Start a new game session
app.post('/start', async (c) => {
  try {
    // Rate limiting
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    if (!checkGlobalRateLimit(clientIP)) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    const body: StartSessionRequest = await c.req.json();

    // Validate settings
    const validation = validateGameSettings(body.settings);
    if (!validation.isValid) {
      return c.json({ error: validation.errors.join(', ') }, 400);
    }

    const { settings } = body;

    // Get emojis for the session
    const emojis = await getEmojis(c.env, {
      platforms: settings.platforms,
      difficulty: settings.difficulty,
      count: settings.questionCount
    });

    if (emojis.length === 0) {
      return c.json({ error: 'No emojis found for the selected criteria' }, 400);
    }

    // Create session
    const sessionId = generateSessionId();
    const userId = generateUserId();

    const session: GameSession = {
      sessionId,
      userId,
      settings,
      score: 0,
      answers: [],
      startTime: new Date().toISOString(),
      endTime: null
    };

    // Save session
    await saveSession(c.env, session);

    const response: StartSessionResponse = {
      sessionId,
      emojis
    };

    return c.json(response);
  } catch (error) {
    console.error('Failed to start session:', error);
    return c.json({ error: 'Failed to start game session' }, 500);
  }
});

// POST /api/session/answer - Submit an answer
app.post('/answer', async (c) => {
  try {
    // Rate limiting
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    if (!checkGlobalRateLimit(clientIP)) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    const body: AnswerRequest = await c.req.json();

    // Validate input
    const sessionValidation = validateSessionId(body.sessionId);
    if (!sessionValidation.isValid) {
      return c.json({ error: sessionValidation.errors.join(', ') }, 400);
    }

    const answerValidation = validateShortcode(body.answer);
    if (!answerValidation.isValid) {
      return c.json({ error: answerValidation.errors.join(', ') }, 400);
    }

    // Rate limiting per session
    if (!checkAnswerRateLimit(body.sessionId)) {
      return c.json({ error: 'Too many answers submitted' }, 429);
    }

    // Get session
    const session = await getSession(c.env, body.sessionId);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.endTime) {
      return c.json({ error: 'Session already ended' }, 400);
    }

    // Get emoji data
    const emojis = await getEmojis(c.env, {
      platforms: session.settings.platforms,
      difficulty: session.settings.difficulty
    });

    const emoji = emojis.find(e => e.emoji === body.emoji);
    if (!emoji) {
      return c.json({ error: 'Emoji not found in session' }, 400);
    }

    // Check answer
    const answerResult = checkAnswer(body.answer, emoji, session.settings.platforms);

    // Calculate score
    const answerScore = answerResult.correct ?
      calculateAnswerScore(body.timeSpent, session.settings.timeLimit, emoji.difficulty) : 0;

    // Create answer record
    const answer: Answer = {
      emoji: emoji.emoji,
      userAnswer: body.answer,
      correctAnswers: answerResult.correctAnswers || [],
      platform: answerResult.acceptedPlatform as any || null,
      timeSpent: body.timeSpent,
      correct: answerResult.correct
    };

    // Update session
    session.answers.push(answer);
    session.score += answerScore;

    await saveSession(c.env, session);

    const response: AnswerResponse = {
      correct: answerResult.correct,
      acceptedPlatform: answerResult.acceptedPlatform as any || null,
      correctAnswers: answerResult.correctAnswers || [],
      currentScore: session.score
    };

    return c.json(response);
  } catch (error) {
    console.error('Failed to process answer:', error);
    return c.json({ error: 'Failed to process answer' }, 500);
  }
});

// POST /api/session/end - End the session and calculate final results
app.post('/end', async (c) => {
  try {
    // Rate limiting
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    if (!checkGlobalRateLimit(clientIP)) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    const body: EndSessionRequest = await c.req.json();

    // Validate session ID
    const validation = validateSessionId(body.sessionId);
    if (!validation.isValid) {
      return c.json({ error: validation.errors.join(', ') }, 400);
    }

    // Get session
    const session = await getSession(c.env, body.sessionId);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.endTime) {
      return c.json({ error: 'Session already ended' }, 400);
    }

    // End session
    session.endTime = new Date().toISOString();
    session.score = calculateSessionScore(session.answers);

    // Save final session
    await saveSession(c.env, session);

    // Calculate statistics
    const stats = calculateSessionStats(session.answers);

    // Save to leaderboard
    const leaderboardEntry = createLeaderboardEntry(session, session.userId);
    await c.env.LEADERBOARD.put(`leaderboard`, JSON.stringify([leaderboardEntry]), { expirationTtl: 86400 }); // 24 hours cache

    // Get leaderboard rank (simplified - in real implementation, you'd get full leaderboard)
    const rank = 1; // Placeholder - would calculate actual rank

    const response: EndSessionResponse = {
      finalScore: session.score,
      totalQuestions: stats.totalQuestions,
      correctAnswers: stats.correctAnswers,
      avgTime: stats.avgTime,
      leaderboardRank: rank
    };

    return c.json(response);
  } catch (error) {
    console.error('Failed to end session:', error);
    return c.json({ error: 'Failed to end session' }, 500);
  }
});

export default app;