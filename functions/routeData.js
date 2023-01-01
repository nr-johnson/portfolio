const axios = require('axios')

const routes = {}

routes.portfolio = () => {
    return new Promise((resolve, reject) => {
        const client = axios.create({
            baseURL: process.env.API_URL
        })
        client.get('/projects?publish=true').then(resp => {
            if(resp.data.length < 1) reject(new Error('API query returned no results.')) // If data is empty, return an error.
            resolve(resp.data)
        }).catch(err => {
            reject(err)
        })
    })
}

routes.elementspanel = (query) => {
    return new Promise((resolve, reject) => {
        const client = axios.create({
            baseURL: process.env.API_URL
        })

        let querystring = ''

        for (let key in query) {
            if (key == 'data') continue
            querystring.length == 0 ? querystring = `${key}=${query[key]}` : querystring = `${querystring}&${key}=${query[key]}`
        }
        
        client.get(`/projects?${querystring}`).then(resp => {
            if(resp.data.length < 1) reject(new Error('API query returned no results.')) // If data is empty, return an error.
            resolve(resp.data[0])
        }).catch(err => {
            reject(err)
        })
    })
}

module.exports = { ...routes }