const express = require('express')
const http = require('http')
const pkg = require('./package.json')
const bodyParser = require('body-parser')
const path = require('path')
const ops = require('./functions/ops')

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json())
app.use(express.static(path.join(__dirname, '/public')))

app.use(ops.siteOps())

app.get(['/', '/:path'], async (req, res) => {
    const path = req.params.path || '/'
    const data = await req.getData(path)
    console.log(data)
})


// Server ---
const PORT = process.env.PORT || 8500
const server = http.createServer(app)

server.listen(PORT, () => { console.log(`${pkg.name} running on port ${PORT}`) })