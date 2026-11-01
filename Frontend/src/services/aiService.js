import api from './api';

export const aiService = {
  /**
   * Generates a 4-week reciprocal learning roadmap between two users.
   */
  generateCurriculum: (data) => api.post('/ai/generate-curriculum', data),

  /**
   * Enhances a swap request pitch to maximize acceptance chance.
   */
  enhancePitch: (data) => api.post('/ai/enhance-pitch', data),

  /**
   * Automatically extracts skills and creates a polished bio from raw text.
   */
  extractSkills: (rawText) => api.post('/ai/extract-skills', { rawText }),

  /**
   * Computes AI compatibility score and reason between the current user and a candidate.
   */
  getCompatibility: (candidateUserId) => api.post('/ai/compatibility', { candidateUserId }),

  /**
   * Fetches community members ranked by multi-factor interest & domain affinity.
   */
  getRecommendedMatches: () => api.get('/ai/recommended-matches'),

  /**
   * Discovers peers based on freeform natural language interest or goal query.
   */
  matchByInterest: (query) => api.post('/ai/match-by-interest', { query }),

  /**
   * Consults the SkillBot AI learning companion tutor.
   */
  askTutor: (data) => api.post('/ai/chat-tutor', data),
};
