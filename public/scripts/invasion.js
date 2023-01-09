// Global game variables
let gameStopped = true
let gameAnimationId = null
let enemies = null
let player = null
let starField = null

// Button to start invasion game is hidden by default. It is revealed below
// This is done because Javascript is required to run the game. If JS isn't enabled, the button won't be seen.
const invasionButton = document.getElementById('startGame')
if (invasionButton) {
    // Reveal button
    invasionButton.classList.remove('fade')
    // Add click event to button
    invasionButton.addEventListener('click', e => {
        e.preventDefault()
        if (gameStopped) {
            initiateInvation()
        } else {
            endGame()
        }
        
    })
}

// Function to load invasion game
function initiateInvation() {
    // Stops particle animation. Does this first to free up processing power.
    stopParticles()

    gameStopped = false

    // Adds custom cursor to the game
    addCursor()

    const particleButton = document.getElementById('desktopParticleButton')
    particleButton.classList.add('d-none')

    // Changes button text
    invasionButton.children[0].textContent = 'End Game'

    // Hides page content
    const main = document.getElementById('main')
    main.classList.add('d-none')

    // Shows loader while game is loading
    const loader = document.getElementById('loader')
    loader.classList.add('loading')

    // Canvas variables
    const canvas = document.getElementById('invasionGame')

    canvas.parentNode.classList.remove('d-none')

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight - 55

    const context = canvas.getContext('2d')

    starField = new StarField({ canvas, context })
    player = new Player({ canvas, context })
    enemies = new EnemyGrid({ canvas, context, cols: 3, rows: 2 })


    function animate() {
        if (gameStopped) {
            cancelAnimationFrame(gameAnimationId)
        } else {
            gameAnimationId = requestAnimationFrame(animate)
        }
        

        context.clearRect(0,0,canvas.width, canvas.height)

        starField.update()
        player.update()
        enemies.update()
    }
    animate()
    
    loader.classList.remove('loading')
}

// Main player object
class Player {
    constructor({ canvas, context }) {

        this.clas = 'player'

        this.canvas = canvas
        this.context = context

        this.height = 50
        this.width = 50

        this.cursorSize = 14

        this.ease = .2

        this.color = 'gold'

        this.vector = {
            x: (this.canvas.width / 2) + (this.width / 2),
            y: (this.canvas.height - this.height) - 30
        }

        this.mouse = {
            x: 0,
            y: 0
        }

        this.bullets = []

        canvas.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX
            this.mouse.y = e.clientY
        })

        canvas.addEventListener('mousedown', () => {
            this.shoot()
        })       

    }
    update() {
        const newPosition = (this.mouse.x - (this.width / 2)) + (this.cursorSize / 2)

        if (newPosition > 0 && newPosition + (this.width) < this.canvas.width) {
            this.vector.x = newPosition
        }

        

        this.bullets.forEach(bullet => {
            bullet.update()
        })

        this.draw()
    }
    draw() {
        this.context.fillStyle = this.color
        this.context.fillRect(this.vector.x, this.vector.y, this.width, this.height)
    }
    shoot() {
        this.bullets.push(new Bullet({ canvas: this.canvas, context: this.context, parent: this, dir: -1, x: this.vector.x + (this.width / 2), y: this.vector.y }))
    }
}

class EnemyGrid {
    constructor({ canvas, context, rows, cols, dir }) {
        this.canvas = canvas

        this.context = context

        this.cols = cols || 1
        this.rows = rows || 1

        this.enemyHeight = 20
        this.enemyWidth = 30

        this.gutter = 10

        this.width = (this.enemyWidth * this.cols) + (this.gutter * (this.cols - 1))
        this.height = (this.enemyHeight * this.rows) + (this.gutter * (this.rows - 1))

        this.reverse = false
        this.dir = dir || -1

        this.speed = {
            x: 1,
            y: .07
        }

        this.enemies = []
        this.enemyCount = this.cols * this.rows

        this.vector = {
            x: (this.canvas.width / 2) - (this.width / 2),
            y: -this.height
        }

        for (let row = 0; row < this.rows; row++) {
            this.enemies.push([])
            for (let col = 0; col < this.cols; col++) {
                this.enemies[row].push(new Enemy({ canvas, context, grid: this, row, col }))
            }
        }

    }
    update() {
        if (this.enemies.length < 1) {
            alert('You win!')
            endGame()
            return
        } 

        for (let row = 0; row < this.enemies.length; row++) {
            if (this.enemies[row].length < 1) {
                this.enemies.splice(row,1)
                continue
            }
            for (let col = 0; col < this.enemies[row].length; col++) {
                this.enemies[row][col].update()
            }
        }

        if (this.reverse) {
            this.dir *= -1
            this.reverse = false
        }

        this.vector.x += this.speed.x * this.dir
        this.vector.y += this.speed.y

    }
}

// Enemy Object
class Enemy {
    constructor({ canvas, context, grid, row, col }) {
        this.clas = 'enemy'

        this.canvas = canvas
        this.context = context

        this.grid = grid

        this.width = this.grid.enemyWidth
        this.height = this.grid.enemyHeight

        this.color = 'red'

        this.gridPosition = {
            col,
            row
        }

        this.vector = {
            x: this.grid.vector.x + ((this.width + this.grid.gutter) * this.gridPosition.col),
            y: this.grid.vector.y + ((this.height + this.grid.gutter) * this.gridPosition.row)
        }
    }
    update() {
        this.vector.x = this.grid.vector.x + ((this.width + this.grid.gutter) * this.gridPosition.col)
        this.vector.y = this.grid.vector.y + ((this.height + this.grid.gutter) * this.gridPosition.row)

        if (this.vector.x < 0 || this.vector.x + this.width > this.canvas.width) {
            this.grid.reverse = true
        }

        this.draw()
    }
    draw() {
        this.context.fillStyle = this.color
        this.context.fillRect(this.vector.x, this.vector.y, this.width, this.height)
    }
}

// bullet object
class Bullet {
    constructor({ canvas, context, parent, dir, x, y }) {
        this.canvas = canvas
        this.context = context

        this.height = 4
        this.width = 4

        this.dir = dir

        this.parent = parent

        this.vector = {
            x: x - (this.width / 2),
            y
        }

        this.velocityY = 15 * this.dir
    }
    update() {
        this.vector.y += this.velocityY

        // if outside of screen remove bullet
        if (this.vector.y < 0 || this.vector.y + this.velocityY > this.canvas.height) {
            this.parent.bullets.splice(this.parent.bullets.indexOf(this), 1)
            return
        }

        enemies.enemies.forEach(row => {
            row.forEach(enemy => {
                if (this.vector.x >= enemy.vector.x 
                    && this.vector.x + this.width < enemy.vector.x + enemy.width
                    && this.vector.y < enemy.vector.y + enemy.height
                    && this.vector.y + this.height > enemy.vector.y
                ) {

                    enemy.grid.enemies[enemy.gridPosition.row].splice(enemy.grid.enemies[enemy.gridPosition.row].indexOf(enemy),1)

                    this.parent.bullets.splice(this.parent.bullets.indexOf(this),1)
                    return
                }
            })
        })

        this.draw()
    }
    draw() {
        this.context.fillStyle = 'red'
        this.context.fillRect(this.vector.x, this.vector.y, this.width, this.height)
    }
}

class StarField {
    constructor({ canvas, context, density }) {
        this.canvas = canvas
        this.context = context

        this.density = 1000 * (density || 5)

        this.starSize = .75
        this.starColor = 'white'

        this.speed = .5

        this.stars = []

        for (let i = 0; i < this.density; i++) {
            const x = Math.random()*this.canvas.width
            const y = Math.random()*this.canvas.height

            this.stars.push(new Star({ canvas, context, field: this, x, y }))
        }
    }
    update() {
        this.stars.forEach(star => {
            star.update()
        })
    }
}

class Star {
    constructor({ canvas, context, field, x, y }) {
        this.canvas = canvas
        this.context = context

        this.field = field

        this.size = this.field.starSize
        this.color = this.field.starColor

        this.vector = {
            x,
            y
        }

        this.origin = {
            x,
            y
        }
    }
    update() {
        this.vector.y += this.field.speed

        if (this.vector.y > this.canvas.height) {
            this.vector.y = 0
            this.vector.x = this.origin.x
        }

        this.draw()
    }
    draw() {
        this.context.fillStyle = this.color
        this.context.fillRect(this.vector.x, this.vector.y, this.size, this.size)
    }
}

// Stops the game and shows the current page html
function endGame() {
    gameStopped = true
    if (!manualStopped) {
        restartParticles()
    }

    // Removes custom cursor
    removeCursor()

    // Shows page content
    const main = document.getElementById('main')
    main.classList.remove('d-none')

    // Resets button text
    invasionButton.children[0].textContent = 'Invasion!'

    // Hides loader
    const loader = document.getElementById('loader')
    loader.classList.remove('loading')

    // Hides vanvas
    const canvas = document.getElementById('invasionGame')
    canvas.parentNode.classList.add('d-none')

    const particleButton = document.getElementById('desktopParticleButton')
    particleButton.classList.remove('d-none')

    canvas.height = 0
    canvas.width = 0

    
}

// Adds custom cursor
function addCursor() {
    const body = document.getElementById('body')
    // cursor element
    const primary = document.createElement('div')
    const point = document.createElement('div')

    primary.id = 'invasionCursor'
    point.id = 'point'

    primary.appendChild(point)
    body.appendChild(primary)

    // Sets cursor position based on mouse position
    body.addEventListener('mousemove', e => {
        primary.style.top = `${e.clientY}px`
        primary.style.left = `${e.clientX}px`
        if (e.clientY < 50) {
            primary.classList.add('fade')
        } else {
            primary.classList.remove('fade')
        }
    })

    body.addEventListener('mousedown', () => {
        primary.classList.add('shoot')
    })
    body.addEventListener('mousedown', () => {
        primary.classList.remove('shoot')
    })
}

// removes custom cursor from page
function removeCursor() {
    const body = document.getElementById('body')
    const cursor = document.getElementById('invasionCursor')

    body.removeChild(cursor)
}