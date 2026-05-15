import api from './api';

export const skillService = {
  addOfferedSkill: (data) => api.post('/skill/add-skills', data),
  getOfferedSkills: () => api.get('/skill/get-skills'),
  getSkillsToLearn: () => api.get('/skill/get-skillsToLearn'),
  addSkillToLearn: (data) => api.post('/skill/skills-to-learn', data),
  deleteSkill: (skillId) => api.post('/skill/delete-skill', { skillId }),
};
