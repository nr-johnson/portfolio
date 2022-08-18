const pug = require('pug')
const fs = require('fs')
const axios = require('axios')

function getData() {

}

function siteOps() {
    return (req, res, next) => {
        // All data for GET requests are retrieved and compiled in this function.
        req.getHTML = route => {
            const pages = `${req.root}/views/pages`
            return new Promise((resolve, reject) => {

                if(!fs.existsSync(`${pages}${route}.pug`)) reject({err: 404})
                try {
                    const html = pug.renderFile(`${pages}${route}.pug`)
                    resolve(html)
                } catch(err) {
                    reject(err)
                }
            })
        }
        next()
    }
}

module.exports = { siteOps }