const express = require('express');
const { verifyToken } = require('../JwtVerify/VerifyToken');
const { ObjectId } = require('mongodb');

function dailyTaskRoutes(dailyTaskCollections) {
    const router = express.Router();

    router.post('/addDailyTask', verifyToken, async (req, res) => {
        const { email, text } = req.body;
        const newTask = { email, text, completed: false, cratedAt: new Date() };
        const result = await dailyTaskCollections.insertOne(newTask);
        res.send(result);
    });

    router.get('/dailyTask/:email', verifyToken, async (req, res) => {
        const { email } = req.params;
        const task = await dailyTaskCollections.find({ email }).toArray();
        res.send(task);
    });

    router.patch('/dailyTask/:id', verifyToken, async (req, res) => {
        const { id } = req.params;
        const { completed } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: {
                completed
            }
        };
        const result = await dailyTaskCollections.updateOne(filter, updateDoc);
        res.send(result)
    });

    router.delete('/dailyTask/delete/:id', verifyToken, async (req, res) => {
        const id = req.params;
        const query = { _id: new ObjectId(id) };
        const result = await dailyTaskCollections.deleteOne(query);
        res.send(result);
    })
    return router;
}

module.exports = dailyTaskRoutes;