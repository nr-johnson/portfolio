const pug = require('pug')
const fs = require('fs')
const axios = require('axios')

class Error404 extends Error {
    constructor(url) {
        super()
        this.status = 404
        this.message = `Page with route "${url}" not found.`
    }
}

// I didn't need to get data from the database very much, so I handled all data retrieval here witha switch.
// Data is retrieved using my API.
function getData(route) {
    return new Promise((resolve, reject) => {
        // Create axios client to communicate with API
        const client = axios.create({
            baseURL: process.env.API_URL
        })
        
        switch (route) {
            case '/home':
                // Gets data from API and returns it.
                client.get('/web?publish=true').then(resp => {
                    if(resp.data.length < 1) reject(new Error('API query returned no results.')) // If data is empty, return an error.
                    resolve(resp.data[0])
                }).catch(err => {
                    reject(err)
                })
                break
            default:
                // A lack of a case isn't neccessarily an error, so it returns an empty object.
                resolve({})
        }
    })
    
}

function siteOps() {
    return (req, res, next) => {
        // All data for GET requests are retrieved and compiled in this function.
        req.getHTML = route => {
            const pages = `${req.root}/views/pages` // All views
            return new Promise(async (resolve, reject) => {

                // 404 handeling.
                // If the file corrisponding with the route doesn't exist it creates a 404 error and returns error page html.
                if(!fs.existsSync(`${pages}${route}.pug`)) {
                    const error = new Error404(route)
                    if(req.env !== 'development') error.stack = null // Prevents stack traces from being leaked to user.

                    reject(pug.renderFile(`${pages}/error.pug`, {
                        error: error
                    }))
                }
                
                // If page exists, return rendered HTML
                try {
                    const data = await getData(route) // Gets any data needed from the database
                    const html = pug.renderFile(`${pages}${route}.pug`, { // Renders the html.
                        data: data
                    })
                    resolve(html)
                } catch(err) { // If error rendering html, return that error
                    const error = new Error(err)
                    error.status = 500
                    if(req.env !== 'development') error.stack = null // Prevents stack traces from being leaked to user.

                    reject(pug.renderFile(`${pages}/error.pug`, {
                        error: error
                    }))
                }
            })
        }
        next()
    }
}

module.exports = { siteOps }