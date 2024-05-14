const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://cardoctor-bd.web.app",
      "https://cardoctor-bd.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zkk0rbw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send("unauthorized access");
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send("unauthorized access");
    }
    req.user = decoded;
    next();
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

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

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("tok user", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "356d",
      });
      res.cookie("token", token, cookieOptions).send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    app.post("/assignments",verifyToken, async (req, res) => {
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
    app.post("/submitassignments",verifyToken, async (req, res) => {
      const submitAssignment = req.body;
      const result = await submitAssignmentsCollection.insertOne(
        submitAssignment
      );
      res.send(result);
    });

    app.get("/submitassignments/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await submitAssignmentsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/submitassignments",verifyToken, async (req, res) => {
      const query = { status: "Pending" };
      const result = await submitAssignmentsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/pendingassignment/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await submitAssignmentsCollection.findOne(query);
      res.send(result);
    });

    app.put("/pendingassignment/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const giveMark = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateMark = {
        $set: {
          status: giveMark.status,
          obtained_marks: giveMark.obtained_marks,
          feedback: giveMark.feedback,
        },
      };
      const result = await submitAssignmentsCollection.updateOne(
        filter,
        updateMark,
        options
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
