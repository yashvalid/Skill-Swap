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

module.exports.getSkills = async (user) =>{
    try{
        const skills = await Skills.find({user : user, skillname : { $exists: true, $nin: ["", null] }}).select('user skillname description');
        return skills;
    } catch(err){
        throw new Error(err);
    }
}

module.exports.getSkillsToLearn = async (user) =>{
  try{
      const skills = await Skills.find({user : user, skillToLearn : { $exists: true, $nin: ["", null] }}).select('user skillToLearn description');
      return skills;
  } catch(err){
      throw new Error(err);
  }
}

module.exports.deleteSkill = async (skillId) =>{
  try{
    const delSkill = await Skills.deleteOne({_id : skillId});
    return delSkill;
  } catch(err){
    throw new Error("Internal server error");
  }
}

module.exports.addSkillsToLearn = async (skill, userId, des) => {
  try {
    const skills = await Skills.create({
      user: userId,
      skillToLearn: skill,
      description: des,
    });
    const user = await User.findOneAndUpdate({_id : userId}, {
      $addToSet : {skillsNeeded : skill}
    }, {new : true});
    return skills;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to add skill: " + err.message);
  }
};