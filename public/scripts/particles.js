let effect
let frameRate = 45
let stopped = false

function loadParticles(direction) {
    stopped = false
    const canvas = document.getElementById('canvas')
    let ctx = canvas.getContext('2d')

    !direction ? direction = 0 : null

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const pageTitle = document.getElementById('pageTitle')
    if (!pageTitle) {
        canvas.style.opacity = 0
        return        
    }

    canvas.style.opacity = 1
    canvas.style.transform = `translateX(0)`

    class Particle {
    constructor({ effect, vector, color }) {
        this.effect = effect
        this.vector = {
            x: this.effect.direction == 0 ? vector.x + Math.random() * 0.7 + 0.15 : vector.x + (100 * this.effect.direction),
            y: this.effect.placementY,
        }
        this.tempOrigin = {
            x: vector.x,
            y: vector.y
        }
        this.origin = {
            x: vector.x,
            y: vector.y
        }
        this.color = color
        this.baseColor = color
        this.size = this.effect.size

        // position relative to mouse
        this.distanceVector = {
            x: 0,
            y: 0
        }

        this.velocity = {
            x: 0,
            y: 0
        }

        this.force = 0
        this.angle = 0
        this.distance = 0

        this.friction = Math.random() * 0.6 + 0.15
        this.ease = Math.random() * .1 + 0.05
        
    }
    draw() {
        this.effect.context.fillStyle = this.color
        this.effect.context.fillRect(this.vector.x, this.vector.y, this.size, this.size)
    }
    update() {
        const colorValues = this.color.substring(4, this.color.indexOf(')')).split(',').map(color => { return parseInt(color) })
        const baseColorValues = this.baseColor.substring(4, this.baseColor.indexOf(')')).split(',').map(color => { return parseInt(color) })

        

        this.distanceVector = {
            x: this.effect.mouse.x - this.vector.x,
            y: this.effect.mouse.y - this.vector.y
        }
        this.distance = this.distanceVector.x * this.distanceVector.x + this.distanceVector.y * this.distanceVector.y
        this.force = -this.effect.mouse.radius / this.distance

        
        

        if (this.distance < this.effect.mouse.radius) {
            this.angle = Math.atan2(this.distanceVector.y, this.distanceVector.x)
            this.velocity.x += (Math.random() * .1 + 1.5) * this.force * Math.cos(this.angle)
            this.velocity.y += (Math.random() * .1 + 1.5) * this.force * Math.sin(this.angle)

            colorValues[0] = colorValues[1] < 255 ? colorValues[0] += 75 * this.ease : 0
            colorValues[1] = colorValues[1] > 0 ? colorValues[1] -= 75 * this.ease : 0
            colorValues[2] = colorValues[2] > 0 ? colorValues[2] -= 75 * this.ease : 255

        } else {
            colorValues[0] += (baseColorValues[0] - colorValues[0]) * (this.ease / 1.5)
            colorValues[1] += (baseColorValues[1] - colorValues[1]) * (this.ease / 1.5)
            colorValues[2] += (baseColorValues[2] - colorValues[2]) * (this.ease / 1.5)
        }

        this.color = `rgb(${colorValues[0]},${colorValues[1]},${colorValues[2]})`

        this.vector.x += (this.velocity.x *= this.friction) + (this.tempOrigin.x - this.vector.x) * this.ease
        this.vector.y += (this.velocity.y *= this.friction) + (this.tempOrigin.y - this.vector.y) * this.ease
    }
    }
   
    class Effect {
        constructor({ context, canvasWidth, canvasHeight, pageTitle, direction }) {
            this.context = context
            this.canvasWidth = canvasWidth
            this.canvasHeight = canvasHeight

            this.pageTitle = pageTitle

            this.fontSize = parseInt(this.pageTitle.getAttribute('data-fontSize')) * this.canvasWidth / 100
            

            this.lineHeight = this.fontSize * 1
            this.maxTextWidth = this.canvasWidth * .8
            
            this.placementY = (parseInt(this.pageTitle.getAttribute('data-y')) / 100) * this.canvasHeight

            if (this.placementY - (this.lineHeight / 2) < 40) this.placementY = 40 + (this.lineHeight / 2)

            this.vector = {
                x: (parseInt(this.pageTitle.getAttribute('data-x')) / 100) * this.canvasWidth,
                y: this.placementY
            }

            this.text = this.pageTitle.textContent

            this.providedGap = this.pageTitle.getAttribute('data-gap')
            this.providedSize = this.pageTitle.getAttribute('data-size')

            // Text Particles
            this.particles = []
            this.gap = this.providedGap ? parseInt(this.providedGap) : 3
            this.size = this.providedSize ? parseInt(this.providedSize) : 2
            
            this.mouse = {
                radius: 5000,
                x: 0,
                y: 0
            }

            if (this.canvasWidth < 768) {
                this.fontSize *= 2
                this.gap = 2
                this.size = 1
                this.mouse.radius = 1500
            }


            window.addEventListener('mousemove', e => {
                this.mouse.x = e.x
                this.mouse.y = e.y
            })
            window.addEventListener('wheel', e => {
                this.mouse.x = e.clientX
                this.mouse.y = e.clientY
            })

            this.direction = direction
            
        }
        wrapText() {
            this.pageTitle.classList.add('d-none')
            // Canvas Settings
            
            this.context.fillStyle = '#ce7f10'
            this.context.font = `${this.fontSize}px Helvetica`
            this.context.textAlign = 'center'
            this.context.textBaseline = 'middle'

            // Multiline break
            let linesArray = []
            let words = this.text.split(' ')
            let lineCounter = 0
            let line = ''

            for (let i = 0; i < words.length; i++) {
                let testLine = line + words[i] + ' '
                if (this.context.measureText(testLine).width > this.maxTextWidth) {
                    line = words[i] + ' '
                    lineCounter++
                } else {
                    line = testLine
                }
                linesArray[lineCounter] = line
            }
            let textHeight = this.lineHeight * lineCounter
            this.vector.y = this.placementY - textHeight/2
            
            linesArray.forEach((el, index) => {
                this.context.fillText(el, this.vector.x, this.vector.y + (index * this.lineHeight))
            })

            this.convertToParticles()
        }
        convertToParticles() {
            this.particles = []
            const pixels = this.context.getImageData(0,0,this.canvasWidth,this.canvasHeight).data
            this.context.clearRect(0,0,this.canvasWidth, this.canvasHeight)
            for (let y = 0; y < this.canvasHeight; y += this.gap) {
                for (let x = 0; x < this.canvasWidth; x += this.gap) {
                    const index = (y * this.canvasWidth + x) * 4
                    const alpha = pixels[index + 3]

                    

                    if (alpha > 0) {
                        const red = pixels[index]
                        const green = pixels[index + 1]
                        const blue = pixels[index + 2]

                        const color = `rgb(${red},${green},${blue})`

                        this.particles.push(new Particle({ effect: this, vector: { x, y }, color }))    
                    }
                }   
            }
        }
        render() {
            let previousColor = 'rgb(0,0,0)'
            this.particles.forEach(particle => {
                particle.update()
                particle.draw(previousColor)
                previousColor = particle.color
            })
        }
        move(amount) { 
            this.particles.forEach(particle => {
                if (amount == 0) {
                    particle.velocity.x += (particle.tempOrigin.x - particle.origin.x) * .2
                    particle.tempOrigin.x = particle.origin.x
                } else {
                    particle.velocity.x += (amount * -.5)
                    particle.tempOrigin.x += (amount * 4)
                }
                
            })
        }

        reset() {
            
            resetCanvas()

            this.canvasHeight = window.innerHeight
            this.canvasWidth = window.innerWidth

            this.placementY = (parseInt(this.pageTitle.getAttribute('data-y')) / 100) * this.canvasHeight
            if (this.placementY < 40) this.placementY = 40

            this.vector.x = (parseInt(this.pageTitle.getAttribute('data-x')) / 100) * this.canvasWidth,
            this.vector.y = this.placementY
            this.context.clearRect(0,0,this.canvasWidth, this.canvasHeight)

            this.wrapText()

        }
    }


   effect = new Effect({context: ctx, canvasWidth: canvas.width, canvasHeight: canvas.height, pageTitle, direction})
   effect.wrapText()
   

    function animate() {
        window.setTimeout(() => {
            ctx.clearRect(0,0,canvas.width, canvas.height)
            effect.render()
            if(!stopped) {
                requestAnimationFrame(animate)
            }
            
        }, 1000 / frameRate)
        
    }
    animate()

    function resetCanvas() {
        canvas.height = window.innerHeight
        canvas.width = window.innerWidth

        ctx = canvas.getContext('2d')
    }
}

loadParticles()