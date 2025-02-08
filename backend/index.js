import express from 'express';

const app = express()
const port = 4000

app.get('/', (req, res) => {
    res.send('<html><head></head><body><h1>Hello!</h1></body></html>');
})

app.listen(port, async () => {
    console.log(`Listening port: ${port}`)
})