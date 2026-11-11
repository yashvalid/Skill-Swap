const Skills = require('../model/Skills.model');
const User = require('../model/user.model');


module.exports.addSkill = async (skill, userId, des) => {
  try {
    const skills = await Skills.create({
      user: userId,
      skillname: skill,
      description: des,
    });
    const user = await User.findOneAndUpdate({_id : userId}, {
      $addToSet : {skillsOffered : skill}
    }, {new : true});
    return skills;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to add skill: " + err.message);
  }
};

module.exports.getSkills = async (userId) => {
    try {
        const skills = await Skills.find({ user: userId, skillname: { $exists: true, $nin: ["", null] } }).select('user skillname description');
        return skills;
    } catch (err) {
        throw new Error(err.message);
    }
};

module.exports.getSkillsToLearn = async (userId) => {
    try {
        const skills = await Skills.find({ user: userId, skillToLearn: { $exists: true, $nin: ["", null] } }).select('user skillToLearn description');
        return skills;
    } catch (err) {
        throw new Error(err.message);
    }
};

module.exports.deleteSkill = async (skillId, userId) => {
    try {
        const deleted = await Skills.findOneAndDelete({ _id: skillId, user: userId });
        if (!deleted) {
            return null;
        }

        if (deleted.skillname) {
            const remaining = await Skills.exists({ user: userId, skillname: deleted.skillname });
            if (!remaining) {
                await User.findByIdAndUpdate(userId, { $pull: { skillsOffered: deleted.skillname } });
            }
        }
        if (deleted.skillToLearn) {
            const remaining = await Skills.exists({ user: userId, skillToLearn: deleted.skillToLearn });
            if (!remaining) {
                await User.findByIdAndUpdate(userId, { $pull: { skillsNeeded: deleted.skillToLearn } });
            }
        }
        return deleted;
    } catch (err) {
        throw new Error("Internal server error");
    }
};

module.exports.addSkillsToLearn = async (skill, userId, des) => {
    try {
        const skills = await Skills.create({
            user: userId,
            skillToLearn: skill,
            description: des,
        });
        await User.findOneAndUpdate({ _id: userId }, {
            $addToSet: { skillsNeeded: skill }
        }, { new: true });
        return skills;
    } catch (err) {
        console.error(err);
        throw new Error("Failed to add skill: " + err.message);
    }
};