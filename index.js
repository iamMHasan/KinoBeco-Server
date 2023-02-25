const express = require('express')
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
    res.send('kinobeco server')
})

// jwt
const jwtVerify = (req, res, next) => {
    const authHeaders = req.headers.authorization
    if (!authHeaders) {
        return res.status(401).send('unauthorizeddddddd')
    }
    const token = authHeaders.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send('not permitted')
        }
        req.decoded = decoded
        next()
    })
}
const verifyAdmin = async (req, res, next) => {
    const decodedEmail = req.decoded.email
    const query = { email: decodedEmail }
    const user = await userCollections.findOne(query)

    if (user?.userType !== 'admin') {
        return res.status(403).send({ message: 'forbidden access' })
    }
    console.log('Admin true')
    next()
}

const uri = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@cluster0.fshg8yr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const allProducts = client.db('kinoBeco').collection('allProducts')
const addToCart = client.db('kinoBeco').collection('addToCart')
const userCollections = client.db('kinoBeco').collection('users')

async function run() {
    try {
        app.get('/allProducts', async (req, res) => {
            const data = await allProducts.find({}).toArray()
            res.send(data)
        })
        app.get('/allProducts/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const data = await allProducts.findOne(filter)
            res.send(data)
        })
        app.post('/addToCart', async (req, res) => {
            const data = req.body
            const result = await addToCart.insertOne(data)
            res.send(result)
        })
        app.get('/addToCart', async (req, res) => {
            const email = req.query.email
            const query = { userEmail: email }
            const result = await addToCart.find(query).toArray()
            res.send(result)
        })
        app.delete('/addToCart/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await addToCart.deleteOne(query)
            res.send(result)
        })
        app.post('/addAproduct', async (req, res) => {
            const data = req.body
            const result = await allProducts.insertOne(data)
            res.send(result)
        })
        app.get('/addAproduct', async (req, res) => {
            const email = req.query.email
            const filter = { email: email }
            const result = await allProducts.find(filter).toArray()
            res.send(result)
        })
        app.delete('/addAproduct/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await allProducts.deleteOne(query)
            res.send(result)
        })
        // Save user email & generate JWT
        app.post('/users', async (req, res) => {
            const userInfo = req.body
            const email = userInfo
            console.log(userInfo);
            const result = await userCollections.insertOne(userInfo)

            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ result, token })
        })
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await userCollections.findOne(query)
            res.send(result)
        })
        app.put('/users/:email', async (req, res) => {
            const emaill = req.params.email
            const email = req.body
            const filter = { email: emaill }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    email: email.email
                },
            };
            const result = await userCollections.updateOne(filter, updateDoc, options)

            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ result, token })
        })
        app.put('/adminMake/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    userType: 'admin'
                }
            }
            const result = await userCollections.updateOne(query, updatedDoc, options)
            res.send(result)
        })
        app.get('/users', jwtVerify, verifyAdmin, async (req, res) => {
            let query = {}
            const userType = req.query.userType
            if (req.query.userType) {
                query = { userType: userType }
            }
            const result = await userCollections.find(query).toArray()
            res.send(result)
        })
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollections.deleteOne(query)
            res.send(result)
        })
    }
    finally {

    }
}
run().catch(err => console.log(err))
app.listen(port, () => console.log('kino beco'))