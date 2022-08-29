const redirs = document.querySelectorAll('.page-redir')
redirs.length > 0 && redirs.forEach(link => {
    link.addEventListener('click', event => {
        navigate(event, new URL(link.href).pathname)
    })
})

async function navigate(event, route) {
    const url = new URL(window.location)
    if(event) {
         event.preventDefault()
    } else if(url.pathname == route) return

    console.log('hello ' + route)

    const main = document.getElementById('main')
    console.log('navigating to: https://' + url.hostname + route)
    await getHTML('https://' + url.hostname + route).then(html => {
        main.innerHTML = html.html
        addToHistory(route)
        setLinkEvents()
    }).catch(err => {
        main.innerHTML = err
    })
}

function getHTML(route) {
    return new Promise(async (resolve, reject) => {
        await serverRequest(route + '?data=true', 'GET').then(html => {
            resolve(JSON.parse(html))
        }).catch(err => {
            reject(err)
        })
            
    })    
}

// Handles all front-end server requests
function serverRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && (this.status == 200 || this.status == 201)) {
                // If response from server is good, return the response
                resolve(this.response)
            } else if(this.readyState == 4) {
                console.log(this.status)
                // If response is bad, return error status html to loaded into page.
                
                let message = '<p>Could not get data from server</p>'
                if(this.status == 404) message = '<p>' + this.statusText + '</p>'
                const error = new Error(message)

                reject(error)
            }
        };
        
        xhttp.open(method, url);
        if(data) {
            xhttp.setRequestHeader( 'Content-Type', 'application/json' )
            xhttp.send(JSON.stringify(data))
        } else {
            xhttp.send()
        }
    })
}

// Highjacks the functionality of all links so the data can be loaded without loading a new page (discount react).
setLinkEvents()
function setLinkEvents() {
    document.querySelectorAll('.page-redir').forEach(link => {
        link.addEventListener('click', (event) => {
            navigate(null, new URL(link.href).pathname) // Changes the page, second variable is the url path
            event.preventDefault() // Prevent link from navigating the page.
        })
    })
}

// Takes over browser back button
window.addEventListener('popstate', (e) => {
    const location = history.state;
    // Changes page data if item was added to history, else it's allowed to navigate back in it's defualt way.
    console.log('Routing to ' + location)
    location ? navigate(e, location) : window.history.back()
});

// Adds page state to browser history
function addToHistory(route) {
    // If the current state is different than the previous, the new state is added to history
    // It also changes the current url (pushState third param), which allows the user to refresh the page without returning to the home page.
    history.state != route && history.pushState(route, null, route)
    console.log(history.state + ' added to history.')
    
}