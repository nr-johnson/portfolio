require('dotenv').config()

const express = require('express')
const http = require('http')
const pkg = require('./package.json')
const bodyParser = require('body-parser')
const path = require('path')
const ops = require('./functions/ops')
const url = require('url')

const app = express()

app.use((req, res, next) => {
    req.root = __dirname
    req.env = process.env.ENV || 'development'
    next()
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json())
app.use(express.static(path.join(__dirname, '/public')))

app.use(ops.siteOps())

app.get('*', async (req, res) => {
    const parsedUrl = url.parse(req.url)
    let route = parsedUrl.pathname
    if(route == '/') route = '/home'
    
    req.getHTML(route).then(html => {
        if(req.query.data) { 
            res.json({
                html: html
            })
        } else {
            const loc = route.split('/')
            
            res.render('main', {
                title: 'NRJohnson | ' + (loc[loc.length - 1].substring(0,1).toLocaleUpperCase() + loc[loc.length - 1].substring(1)),
                html: html
            })
        }
    }).catch(err => {
        res.status(err.status || 500).render('main', {
            title: `Error ${err.status || 500}`,
            html: err
        })
    })
})


// Server ---
const PORT = process.env.PORT || 8500
const server = http.createServer(app)

server.listen(PORT, () => { console.log(`${pkg.name} running on port ${PORT}`) })