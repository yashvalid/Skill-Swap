const User = require('../model/user.model');

module.exports.registerUser = async ({ firstname, lastname, email, password, role, location, bio }) => {
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
            bio
        })
        return user;
    } catch (err) {
        throw new Error("Error registering user");
    }
}