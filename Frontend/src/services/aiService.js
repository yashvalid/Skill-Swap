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
   * Consults the SkillBot AI learning companion tutor.
   */
  askTutor: (data) => api.post('/ai/chat-tutor', data),
};
