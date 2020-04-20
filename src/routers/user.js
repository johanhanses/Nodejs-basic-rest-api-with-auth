const express = require("express");
const router = new express.Router();
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const auth = require("../middleware/auth");
const { sendWelcomeEmail, sendExitEmail } = require("../emails/account");

/*
 * Sign up a new user
 *
 * POST /users
 */
router.post("/users", async (req, res, next) => {
    const user = new User(req.body);

    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);

        const token = await user.generateAuthToken();

        res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
});

/*
 * POST /users/login
 */
router.post("/users/login", async (req, res, next) => {
    try {
        const user = await User.findByCredentials(
            req.body.email,
            req.body.password
        );

        const token = await user.generateAuthToken();

        res.send({ user, token });
    } catch (e) {
        res.status(400).send();
    }
});

/*
 * GET /users/logout
 */
router.post("/users/logout", auth, async (req, res, next) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });

        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

/*
 * GET /users/logoutall
 */
router.post("/users/logoutall", auth, async (req, res, next) => {
    try {
        req.user.tokens = [];

        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

/*
 * GET /users/me
 */
router.get("/users/me", auth, async (req, res, next) => {
    res.send(req.user);
});

/*
 * PATCH /users/:id
 */
router.patch("/users/me", auth, async (req, res, next) => {
    const id = req.params.id;
    const body = req.body;
    const updates = Object.keys(body);
    const allowedUpdates = ["name", "email", "password", "age"];
    const isvalidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });

    if (!isvalidOperation) {
        return res.status(400).send({ error: "Invalid update(s)!" });
    }

    try {
        const user = req.user;

        updates.forEach((update) => {
            user[update] = body[update];
        });

        await user.save();

        res.status(200).send(user);
    } catch (e) {
        res.status(400).send();
    }
});

/*
 * DELETE /users/:id
 */
router.delete("/users/me", auth, async (req, res, next) => {
    try {
        sendExitEmail(req.user.email, req.user.name);
        await req.user.remove();
        res.status(200).send(req.user);
    } catch (e) {
        res.status(500).send();
    }
});

/*
 * User profile image upload
 * POST /users/me/avatar
 */
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload a jpg, jpeg or a png file"));
        }
        // cb(new Error("File must be"));
        cb(undefined, true);
    }
});

router.post(
    "/users/me/avatar",
    auth,
    upload.single("avatar"),
    async (req, res, next) => {
        const buffer = await sharp(req.file.buffer)
            .resize({ width: 250, height: 250 })
            .png()
            .toBuffer();

        req.user.avatar = buffer;
        await req.user.save();
        res.send();
    },
    (error, req, res, next) => {
        res.status(400).send({ error: error.message });
    }
);

/*
 * Delete User profile image upload
 * DELETE /users/me/avatar
 */
router.delete(
    "/users/me/avatar",
    auth,
    async (req, res, next) => {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    },
    (error, req, res, next) => {
        res.status(400).send({ error: error.message });
    }
);

/*
 * Get user profile image by id
 * GET /users/:id/avatar
 */
router.get("/users/:id/avatar", async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set("Content-Type", "image/png");
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    }
});

module.exports = router;
