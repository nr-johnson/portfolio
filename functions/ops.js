const pug = require('pug')
const fs = require('fs')
const dataRoutes = require('./routeData')

class Error404 extends Error {
    constructor(url) {
        super()
        this.status = 404
        this.message = `Page with route "${url}" not found.`
    }
}

function siteOps() {
    return (req, res, next) => {
        // All data for GET requests are retrieved and compiled in this function.
        req.getHTML = (route, query) => {
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
                    let data = dataRoutes[route.split('/').join('')]
                    typeof data == 'function' ? data = await data(query) : data = {}

                    // Renders the html.
                    pug.renderFile(`${pages}${route}.pug`, { 
                        data: data
                    }, (err, html) => {
                        err ? reject(pug.renderFile(`${pages}/error.pug`, {
                            error: err
                        })) : resolve(html)
                    })

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