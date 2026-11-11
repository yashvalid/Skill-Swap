const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const skillsService = require('../services/skills.services');
const { invalidateCache } = require('../middlewares/cache');

module.exports.addSkill = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Skill is required", errors: errors.array() });
  }

  const { skill, des } = req.body;
  const userId = req.user._id;

  try {
    const skills = await skillsService.addSkill(skill.trim(), userId, des.trim());
    await invalidateCache(`cache:skills:${userId}`);
    return res.status(201).json({ skills });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.getSkills = async (req, res) => {
  try {
    const skills = await skillsService.getSkills(req.user._id);
    return res.status(200).json({ skills: skills || [] });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.getSkillsToLearn = async (req, res) => {
  try {
    const skills = await skillsService.getSkillsToLearn(req.user._id);
    return res.status(200).json({ skills: skills || [] });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.deleteSkill = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  const { skillId } = req.body;
  if (!mongoose.isValidObjectId(skillId)) {
    return res.status(400).json({ message: "Invalid skill ID" });
  }

  try {
    const delSkill = await skillsService.deleteSkill(skillId, req.user._id);
    if (!delSkill) {
      return res.status(404).json({ message: "Skill not found" });
    }
    await invalidateCache([
      `cache:skills:${req.user._id}`,
      `cache:skillsToLearn:${req.user._id}`
    ]);
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.addSkillsToLearn = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Skill is required", errors: errors.array() });
  }

  const { skill, des } = req.body;
  const userId = req.user._id;

  try {
    const skills = await skillsService.addSkillsToLearn(skill.trim(), userId, des.trim());
    await invalidateCache(`cache:skillsToLearn:${userId}`);
    return res.status(201).json({ skills });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};