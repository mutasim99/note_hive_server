const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const multer = require('multer')
const { MongoClient, ServerApiVersion, GridFSBucket } = require('mongodb');
const port = process.env.port || 5000


app.use(express.json());
app.use(cors());



const storage = multer.memoryStorage();
const upload = multer({
    storage
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1xmeg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let subjectCollection, pdfCollection, bucket;

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        subjectCollection = client.db('note-hive').collection('semester');
        pdfCollection = client.db('note-hive');
        bucket = new GridFSBucket(pdfCollection, { bucketName: 'pdf' })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

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
app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    const { semester, department, subject } = req.body;

    if (!req.file) return res.status(400).send('No file uploaded');

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: {semester, department, subject}
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', () => {
        res.json({ success: true, fileId: uploadStream.id })
    })

    uploadStream.on('error', (error) => {
        console.log(error);
        res.status(500).send({ message: "Error uploading file" })
    })
})

app.listen(port, () => {
    console.log(`app is running on port:${port}`);
})