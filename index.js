const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.port || 5000


app.use(express.json());
app.use(cors());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1xmeg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let subjectCollection, pdfCollection, usersCollection;

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        subjectCollection = client.db('note-hive').collection('semester');
        pdfCollection = client.db('note-hive').collection('pdf');
        usersCollection = client.db('note-hive').collection('users');
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


/* jwt related apis */
app.post('/jwt', async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: '1h'
    })

    res.send({ token })

})

/* get semester name and image */
app.get('/semesters', async (req, res) => {
    try {
        const semesters = await subjectCollection.aggregate([
            {
                $group: {
                    _id: '$semester',
                    image: { $first: '$image' }
                }
            },
            {
                $project: {
                    _id: 0,
                    semester: '$_id',
                    image: 1
                }
            },
            {
                $sort: {
                    semester: 1
                }
            }
        ]).toArray();
        res.json(semesters)
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'something went wrong' })
    }
})

/* Get department Name */
app.get('/departments/:semester', async (req, res) => {
    const { semester } = req.params;
    const departments = await subjectCollection.aggregate([
        {
            $match: { semester }
        },
        {
            $group: { _id: '$department' }
        },
        {
            $project: { _id: 0, department: "$_id" }
        },
        {
            $sort: {
                department: 1
            }
        }
    ]).toArray();
    res.json(departments)
})

/* get subject name */
app.get('/subjects/:semester/:department', async (req, res) => {
    const { semester, department } = req.params;
    try {
        const subjects = await subjectCollection.find(
            { semester, department },
            {
                projection: { _id: 0, subjects: 1 }
            }).toArray();
        const allSubjects = subjects.flatMap(s => s.subjects);
        res.json(allSubjects)
    } catch (error) {
        console.log(error);
    }
})


/* upload a pdf */
app.post('/upload-pdf', async (req, res) => {
    const { semester, department, subject, driveUrl } = req.body;
    if (!semester || !department || !subject || !driveUrl) {
        res.status(400).send({ message: 'all fields are required' })
    }

    try {
        const pdfDoc = {
            semester,
            department,
            subject,
            driveUrl,
            createdAt: new Date(),
        }
        const result = await pdfCollection.insertOne(pdfDoc);
        res.send(result);

    } catch (err) {
        console.log(err);
    }
})

/* Get pdf by semester and subject */
app.get('/pdfs/:semester/:department/:subject', async (req, res) => {
    console.log(req.params);
    const { semester, department, subject } = req.params;
    try {
        const files = await pdfCollection.find({ semester, subject, department }).toArray();
        res.json(files)
    } catch (error) {
        console.log(error);
    }
})

/* User related apis */
app.post('/users', async (req, res) => {
    const user = req.body;
    const query = { email: user.email };
    const existingUser = await usersCollection.findOne(query);
    if (existingUser) {
        return res.status(400).send({ message: 'user already exist' })
    }
    const newUser = { ...user, role: 'user' };
    const result = await usersCollection.insertOne(newUser);
    res.send(result);

})

app.listen(port, () => {
    console.log(`app is running on port:${port}`);
})