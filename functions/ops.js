const pug = require('pug')
const fs = require('fs')
const axios = require('axios')

function getData(route) {
    return new Promise((resolve, reject) => {
        const client = axios.create({
            baseURL: process.env.API_URL
        })
        let data
        switch (route) {
            case '/home':
                client.get('/web?publish=true').then(resp => {
                    if(resp.data.length < 1) reject({err: 'Database query empty'})
                    console.log('Yahoo!')
                    resolve(resp.data[0])
                }).catch(err => {
                    reject(err)
                })
                break
            default:
                resolve({})
        }
    })
    
}

function siteOps() {
    return (req, res, next) => {
        // All data for GET requests are retrieved and compiled in this function.
        req.getHTML = route => {
            const pages = `${req.root}/views/pages`
            return new Promise(async (resolve, reject) => {

                if(!fs.existsSync(`${pages}${route}.pug`)) reject({err: 404})
                
                try {
                    const data = await getData(route)
                    const html = pug.renderFile(`${pages}${route}.pug`, {
                        data: data
                    })
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