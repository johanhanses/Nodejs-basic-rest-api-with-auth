const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
    try {
        //get token from header
        const token = req.header("Authorization").replace("Bearer ", "");
        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // find the user in the DB
        const user = await User.findOne({
            _id: decoded._id,
            "tokens.token": token
        });

        if (!user) {
            throw new Error();
        }
        req.token = token;
        req.user = user;
        next();
    } catch (e) {
        res.status(401).send({ error: "Please authenticate!" });
    }
};

module.exports = auth;
