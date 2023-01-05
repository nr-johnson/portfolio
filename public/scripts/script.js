let canNavigate = true

// Sets css VH property so that elements are sized appropriatly.
// This is needed because on mobile the address bar is included in the viewport, which messed things up.
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', vh + 'px');
window.addEventListener('resize', () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + `px`);
});

addToHistory(new URL(window.location).pathname)

async function navigate(event, route) {
    if (!canNavigate) return

    const loader = document.getElementById('loader')
    let loadTimeout = setTimeout(() => {
        loader.classList.add('loading')
    }, 1000)
    
    canNavigate = false
    const url = new URL(window.location)

    if(event) {
        event.preventDefault()
    } else if(url.pathname == route) {
        canNavigate = true
        return
    }
    
    const canvas = document.getElementById('canvas')
    const main = document.getElementById('main')

    const newCanvas = document.createElement('canvas')
    newCanvas.id = 'canvas'

    const newMain = document.createElement('main')
    newMain.id = 'main'
    newMain.style.opacity = 0
    
    const pageSlideDirection = getPageSlideDirection(route)
    
    main.style.transform = `translateX(${100 * (pageSlideDirection * -1)}vw)`
    main.style.opacity = 0
    canvas ? canvas.style.transform = `translateX(${100 * (pageSlideDirection * -1)}vw)` : null

    newCanvas.style.transform = `translateX(${100 * pageSlideDirection}vw)`
    newMain.style.transform = `translateX(${100 * pageSlideDirection}vw)`

    setSelectedLinks(route)

    window.setTimeout(async () => {
        await getHTML('https://' + url.hostname + route).then(html => {
            const body = main.parentNode
        
            stopped = true

            body.removeChild(main)
            canvas && body.removeChild(canvas)

            effect = null

            body.insertBefore(newMain, body.children[0])
            body.insertBefore(newCanvas, body.children[body.children.length - 1])

            console.log('navigating to: https://' + url.hostname + route)


            const title = route.split('/').map(word => { return word.substring(0,1).toUpperCase() + word.substring(1) }).join(' ')
            document.title = title == ' ' ? 'Home' : title
            newMain.innerHTML = html.html
            document.getElementById('body').setAttribute('data-location', route.replace(/\//g,""))
            body.classList.remove('mobile-toggled')

            setScrollHint()
            addToHistory(route)
            setLinkEvents()
            setScrollBarSize()
            enableEmailLink()

            clearTimeout(loadTimeout)
            loader.classList.remove('loader')

            const selectors = document.querySelectorAll('.pageSelector')
            selectors.forEach(selector => {
                selector.style.transform = 'translateX(0)'
            })
            
            canNavigate = true
            newMain.style.opacity = 1
            newMain.style.transform = 'translateX(0)'
            setPageRevealAnimations()
            loadParticles()
        }).catch(err => {
            clearTimeout(loadTimeout)
            console.log(err)
            main.style.transform = `translateX(0)`
            main.style.opacity = 1
            main.innerHTML = `<div id="pageError">
                <h2>Error ${err.status}</h2>
                <p>${err.message}</p>
            </div>`
        })
    }, 250)

    
}

function enableEmailLink() {
    const contactInfo = document.getElementById('contactInfo')

    if (!contactInfo) return

    const link = contactInfo.children[1]
        span = contactInfo.children[2]
        user = 'contact'
        domain = 'nrjohnson.net'
        ref = `${user}@${domain}`
    
    link.href = `mailto: ${ref}`
    link.innerHTML = ref 
    span.classList.add('d-none')
    link.classList.remove('d-none')
}
enableEmailLink()

function getPageSlideDirection(route) {
    const currentPage = document.querySelector('.pageSelected')

    if (!currentPage) return 1

    const navDom = currentPage.parentNode
    const parentAsArray = Array.from(navDom.children)
    const navIndex = parentAsArray.indexOf(currentPage)

    const nextPage = navDom.querySelector(`a[href="${route}"]`)
    const nextPageIndex = parentAsArray.indexOf(nextPage)

    return navIndex > nextPageIndex ? -1 : 1
}

function getHTML(route) {
    return new Promise(async (resolve, reject) => {
        await serverRequest(route + '?data=true', 'GET').then(data => {
            const res = JSON.parse(data)
            resolve(res)  
        }).catch(err => {
            reject(err)
        })
            
    })    
}

function getElement(route) {
    return new Promise(async (resolve, reject) => {
        await serverRequest(route, 'GET').then(data => {
            resolve(JSON.parse(data))
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
                console.log(this)
                // If response is bad, return error status html to loaded into page.
                
                let message = `<p>Could not get data from server!</p><p>Status: ${this.status} - ${this.statusText}</p>`
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
        
        
        const linkPath = new URL(link.href).pathname

        link.addEventListener('click', (event) => {
            navigate(null, linkPath) // Changes the page, second variable is the url path
            event.preventDefault() // Prevent link from navigating the page.
        })
    })

    document.querySelectorAll('.panel-link').forEach(link => {
        link.addEventListener('click', async e => {
            e.preventDefault()

            const panel = document.getElementById(link.getAttribute('data-id'))
            panel.classList.add('show')
            canNavigate = false

            const deskNav = document.getElementById('desktopNav')
            const mobileNav = document.getElementById('mobileNav')

            deskNav.classList.add('fade')
            mobileNav.classList.add('fade')

            panel.querySelector('.background').addEventListener('click', e => {
                e.preventDefault()
                panel.classList.remove('show')
                deskNav.classList.remove('fade')
                mobileNav.classList.remove('fade')
                canNavigate = true
            })
        })
    })
}

setSelectedLinks()
function setSelectedLinks(route) {
    document.querySelectorAll('.page-redir').forEach(link => {
        const linkPath = new URL(link.href).pathname
        const path = route ? route : window.location.pathname
        path == linkPath ? link.classList.add('pageSelected') : link.classList.remove('pageSelected')
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
}


function getNextPage(previousPage) {
    const currentPage = document.querySelector('.pageSelected')
    const navDom = currentPage.parentNode
    const navIndex = Array.from(navDom.children).indexOf(currentPage)


    if (previousPage) {
        if (navIndex < navDom.children.length - 2) return null

        return new URL (navDom.children[navIndex + 1].href).pathname
    }

    if (navIndex == 0) return null

    return  new URL (navDom.children[navIndex - 1].href).pathname
}

let scrollAmount = 0
let timeOut
window.addEventListener('wheel', ({ wheelDeltaY }) => {
    setScrollBarSize()
    clearTimeout(timeOut)
    if (!canNavigate) return

    const currentPage = document.querySelector('.pageSelected')

    if (!currentPage) return

    const navDom = currentPage.parentNode
    const navIndex = Array.from(navDom.children).indexOf(currentPage)

    const selectors = document.querySelectorAll('.pageSelector')

    const main = document.getElementById('main')

    const navigatePoint = 12

    if (wheelDeltaY > 0) {
        if (scrollAmount < 0) {
            scrollAmount = 0
        }
        if (navIndex > 0) {
            if (window.scrollY > 0) {
                scrollAmount = 0
                setDomPositions()
            } else {
                if (scrollAmount >= navigatePoint) {
                    const nextPageRoute = new URL (navDom.children[navIndex - 1].href).pathname
                    navigate(null, nextPageRoute)
                    scrollAmount = 0
                    return
                }
                scrollAmount < navigatePoint && scrollAmount++
            }
        }
    } else {
        if (scrollAmount > 0) {
            scrollAmount = 0
            setDomPositions()
        }
        if ((window.innerHeight + window.scrollY) < document.body.offsetHeight) {
            scrollAmount = 0
        } else {
            if (navIndex < navDom.children.length - 2) {
                if (scrollAmount <= navigatePoint * -1) {
                    const nextPageRoute = new URL (navDom.children[navIndex + 1].href).pathname
                    navigate(null, nextPageRoute)
                    scrollAmount = 0
                    return
                }
                scrollAmount > navigatePoint * -1 && scrollAmount--
            }
        }    
    }
    
    slideStartPoint = 3
    if (scrollAmount > slideStartPoint || scrollAmount < slideStartPoint * -1) {
        setDomPositions()
    }

    timeOut = window.setTimeout(() => {
        scrollAmount = 0
        setDomPositions()
    }, 750)


    function setDomPositions() {
        main.style.transform = `translateX(${scrollAmount * 1.5}%)`
        
        selectors.forEach(selector => {
            selector.style.transform = `translateX(${(scrollAmount * 1.5) * -1}px)`
        })
        if (!effect) return
        if (effect.basic) {
            const canvas = document.getElementById('canvas')
            canvas.style.transform = `translateX(${scrollAmount * 1.5}%)`
        } else {
            effect.move(scrollAmount) 
        }
        
    }
    
})

// Detects mobile menu button press
const  mobileToggle = document.getElementById('mobileToggle')
mobileToggle && mobileToggle.addEventListener('click', event => {
    event.preventDefault()
    toggleMobileMenu(null)
})

// Detects when the user touches outside of the mobile menu while it's open.
const mobileBack = document.getElementById('mobileNavBack')
mobileBack && mobileBack.addEventListener('click', event => {
    event.preventDefault()
    toggleMobileMenu(true)
})

// Opens and closes the mobile menu
function toggleMobileMenu(close) {
    // "close" variable to to allow the menu to be closed rather than toggled.
        // This prevents unwanted opening of the menu.
    const main = document.getElementById('body')
    close ? main.classList.remove('mobile-toggled') : main.classList.toggle('mobile-toggled')
}

// Hides items on initial page load that are not visible to slide in when scrolled to.
function setPageRevealAnimations() {
    const animationElements = document.querySelectorAll('.animation-child')
    animationElements.forEach(el => {
        el.classList.add('hide')
    })
    revealItems()
}
setPageRevealAnimations()

// reveals page items when scrolled to with animation
function revealItems() {
    const animationParents = document.querySelectorAll('.animation')
    animationParents.forEach(parent => {
        const animationChildren = parent.querySelectorAll('.animation-child')
        
        let leftIndex = 0
        let rightIndex = 0
        let prevBottom = null

        animationChildren.forEach(el => {
            const elementRect = el.getBoundingClientRect()
        
            if (prevBottom) {
                if (elementRect.top > prevBottom) {
                    leftIndex = 0
                    rightIndex = 0
                    prevBottom = elementRect.bottom
                }
            } else {
                prevBottom = elementRect.bottom
            }

            if (elementRect.left < window.innerWidth / 2) {
                el.classList.add('left')
                el.style.transitionDelay = `${.2 * leftIndex}s`
                el.style.zIndex = -leftIndex
                rightIndex = 0
                leftIndex++
            } else {
                el.classList.remove('left')
                el.style.transitionDelay = `${.2 * rightIndex}s`
                el.style.zIndex = -rightIndex
                leftIndex = 0
                rightIndex++
            }

            setTimeout(() => {
                if (elementRect.bottom - (elementRect.height / 4) < window.innerHeight) {
                    el.classList.remove('hide')
                } else if (elementRect.top > window.innerHeight) {
                    el.style.transitionDelay = 0
                    el.classList.add('hide')
                }
            }, 50)
        })
        
    })
}

function setScrollBarSize() {
    const body = document.body
    const html = document.documentElement
    const windowHeight = window.innerHeight
    const documentHeight = Math.max( body.scrollHeight, body.offsetHeight, 
        html.clientHeight, html.scrollHeight, html.offsetHeight );

    const windowHeightPercentage = (windowHeight / documentHeight) * 100

    const scrollBar = document.getElementById('myScrollBar')

    if (windowHeightPercentage >= 100) {
        scrollBar.style.opacity = 0
        return
    }
    scrollBar.style.height = `calc((var(--vh, 1vh) * ${windowHeightPercentage}) - 10px)`
    scrollBar.style.opacity = .5
}
window.setTimeout(() => {
    enableEmailLink()
}, 50)

setScrollBarPosition()
function setScrollBarPosition() {
    const body = document.body
    const html = document.documentElement
    const scrollBar = document.getElementById('myScrollBar')
    
    const documentHeight = Math.max( body.scrollHeight, body.offsetHeight, 
        html.clientHeight, html.scrollHeight, html.offsetHeight );

    const windoOffsetPercantage = (window.pageYOffset / documentHeight) * 100

    html.classList.add('hiddenScroll')

    scrollBar.style.top =  `calc((var(--vh, 1vh) * ${windoOffsetPercantage}) + 4px)`
}

function setScrollHint() {
    const scrollHintText = document.getElementById('scrollHintText')
    scrollHintText ? scrollHintText.textContent = 'Scroll Down to View Portfolio' : null
}
setScrollHint()


window.addEventListener('resize', () => {
    setScrollBarSize()
    setScrollBarPosition()
    effect && effect.reset()
})

window.addEventListener('scroll', () => {
    setScrollBarSize()
    setScrollBarPosition()
    revealItems()
})

window.addEventListener('touchstart', () => {
    setScrollBarSize()
})