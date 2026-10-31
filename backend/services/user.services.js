const User = require('../model/user.model');

module.exports.registerUser = async ({ firstname, lastname, email, password, role, location, bio, privacyPolicyAccepted, privacyPolicyAcceptedAt, privacyPolicyVersion }) => {
    try {
        const user = await User.create({
            fullname: {
                firstname,
                lastname
            },
            email,
            password,
            role,
            location,
            bio,
            privacyPolicyAccepted: typeof privacyPolicyAccepted === 'boolean' ? privacyPolicyAccepted : true,
            privacyPolicyAcceptedAt: privacyPolicyAcceptedAt || new Date(),
            privacyPolicyVersion: privacyPolicyVersion || '1.0'
        })
        return user;
    } catch (err) {
        throw new Error("Error registering user");
    }
}