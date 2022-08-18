const pug = require('pug')

function siteOps() {
    return (req, res, next) => {
        req.getData = route => {
            return new Promise((resolve, reject) => {
                resolve(`Hello ${route}`)
            })
        }

        next()
    }
}

module.exports = { siteOps }