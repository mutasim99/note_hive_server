const express = require('express');
const { verifyToken } = require('../JwtVerify/VerifyToken');
const { ObjectId } = require('mongodb');

function eventRoutes(eventCollections) {
    const router = express.Router();

    router.post('/addEvent', verifyToken, async (req, res) => {
        try {
            const { email, text } = req.body;
            const newEvent = { email, text, completed: false, createdAt: new Date() };
            const result = await eventCollections.insertOne(newEvent);
            res.send(result)
        } catch (err) {
            console.log(err);
            res.status(400).send({ message: 'failed to insert event' })
        }
    });

    router.get('/event/:email', verifyToken, async (req, res) => {
        const { email } = req.params;
        const event = await eventCollections.find({ email }).toArray();
        res.send(event);
    });

    router.patch('/event/:id', verifyToken, async (req, res) => {
        const { id } = req.params;
        const { completed } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: {
                completed
            }
        };
        const result = await eventCollections.updateOne(filter, updateDoc);
        res.send(result);
    });

    router.delete('/event/delete/:id', verifyToken, async (req, res) => {
        const id = req.params;
        const query = { _id: new ObjectId(id) };
        const result = await eventCollections.deleteOne(query);
        res.send(result);
    })
    return router;
}

module.exports = eventRoutes;