const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        required : true
    },
    skillname : {
        type : String,
    },
    skillToLearn : {
        type : String,
    },
    description : {
        type : String,
        required : true,
    }
})

const Skills = mongoose.model('skill', SkillSchema);

module.exports = Skills;