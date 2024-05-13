const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zkk0rbw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const assignmentsCollection = client
      .db("assignmentsDB")
      .collection("assignments");

    const submitAssignmentsCollection = client
      .db("assignmentsDB")
      .collection("submitAssignments");

    app.post("/assignments", async (req, res) => {
      const newAssignment = req.body;
      const result = await assignmentsCollection.insertOne(newAssignment);
      res.send(result);
    });

    app.get("/assignments", async (req, res) => {
      const cursor = assignmentsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentsCollection.findOne(query);
      res.send(result);
    });

    app.put("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const updateAssignment = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateAssign = {
        $set: {
          title: updateAssignment.title,
          thumbnail: updateAssignment.thumbnail,
          marks: updateAssignment.marks,
          description: updateAssignment.description,
          difficulty: updateAssignment.difficulty,
          date: updateAssignment.date,
        },
      };
      const result = await assignmentsCollection.updateOne(
        filter,
        updateAssign
      );
      res.send(result);
    });

    app.delete("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await assignmentsCollection.deleteOne(query);
      res.send(result);
    });

    // Submitted Assignment
    app.post("/submitassignments", async (req, res) => {
      const submitAssignment = req.body;
      const result = await submitAssignmentsCollection.insertOne(
        submitAssignment
      );
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Study sync is running");
});

app.listen(port, () => {
  console.log(`Study Sync running on port ${port}`);
});
