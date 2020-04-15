const express = require("express");
const router = new express.Router();
const Task = require("../models/task");
const auth = require("../middleware/auth");

/*
 * POST /tasks
 */
router.post("/tasks", auth, async (req, res, next) => {
    const task = new Task({ ...req.body, owner: req.user._id });

    try {
        await task.save();
        res.status(200).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

/*
 * GET /tasks?completed=true
 * GET /tasks?limit=10&skip=20
 * GET /tasks?sortBy=createdAt:desc
 */
router.get("/tasks", auth, async (req, res, next) => {
    const match = {};
    const sort = {};

    if (req.query.completed) {
        match.completed = req.query.completed === "true";
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(":");
        sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    }

    try {
        await req.user
            .populate({
                path: "tasks",
                match,
                options: {
                    limit: parseInt(req.query.limit),
                    skip: parseInt(req.query.skip),
                    sort
                }
            })
            .execPopulate();

        res.status(200).send(req.user.tasks);
    } catch (e) {
        res.status(500).send();
    }
});

/*
 * GET /tasks/:id
 */
router.get("/tasks/:id", auth, async (req, res, next) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.status(200).send(task);
    } catch (e) {
        res.status(500).send();
    }
});

/*
 * PATCH /tasks/:id
 */
router.patch("/tasks/:id", auth, async (req, res, next) => {
    const _id = req.params.id;
    const body = req.body;
    const updates = Object.keys(body);
    const allowedUpdates = ["description", "completed"];
    const isvalidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });

    if (!isvalidOperation) {
        return res.status(400).send({ error: "Invalid update(s)!" });
    }

    try {
        const task = await Task.findOne({ _id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        updates.forEach((update) => {
            task[update] = body[update];
        });

        await task.save();

        res.status(200).send(task);
    } catch (e) {
        res.status(400).send();
    }
});

/*
 * DELETE /tasks/:id
 */
router.delete("/tasks/:id", auth, async (req, res, next) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOneAndDelete({
            _id,
            owner: req.user._id
        });
        if (!task) {
            res.status(404).send();
        }

        res.status(200).send(task);
    } catch (e) {
        res.status(500).send();
    }
});

module.exports = router;
