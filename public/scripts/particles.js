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
            x: vector.x,
            y: vector.y
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

        this.distanceVector = {
            x: this.effect.mouse.x - this.vector.x,
            y: this.effect.mouse.y - this.vector.y
        }
        this.distance = this.distanceVector.x * this.distanceVector.x + this.distanceVector.y * this.distanceVector.y

        const proximityCheck = this.distance < (Math.random() * .8 + .5) * this.effect.mouse.radius

        if (this.vector.x == this.origin.x && this.vector.y == this.origin.y && !proximityCheck && this.velocity.x == 0 && this.velocity.y == 0) {
            this.color = this.baseColor
            return
        }
        

        const colorValues = this.color.substring(4, this.color.indexOf(')')).split(',').map(color => { return parseInt(color) })
        const baseColorValues = this.baseColor.substring(4, this.baseColor.indexOf(')')).split(',').map(color => { return parseInt(color) })

        if (proximityCheck) {
            this.force = -this.effect.mouse.radius / this.distance 
            this.effect.doPulse = false
            this.angle = Math.atan2(this.distanceVector.y, this.distanceVector.x)
            this.velocity.x += this.force * Math.cos(this.angle)
            this.velocity.y += this.force * Math.sin(this.angle)

            colorValues[0] = colorValues[1] < 255 ? colorValues[0] += 75 * this.ease : 0
            colorValues[1] = colorValues[1] > 0 ? colorValues[1] -= 75 * this.ease : 0
            colorValues[2] = colorValues[2] > 0 ? colorValues[2] -= 75 * this.ease : 255

        }

        colorValues[0] += (baseColorValues[0] - colorValues[0]) * (this.ease / 1.5)
        colorValues[1] += (baseColorValues[1] - colorValues[1]) * (this.ease / 1.5)
        colorValues[2] += (baseColorValues[2] - colorValues[2]) * (this.ease / 1.5)

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
            this.doPulse = true
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
            this.basic = false
            this.maxed = false
            this.gap = 2
            this.size = 2
            
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
                this.mouse.y = e.y + window.pageYOffset
            })
            window.addEventListener('touchmove', e => {
                this.mouse.x = e.touches[0].clientX
                this.mouse.y = e.touches[0].clientY + window.pageYOffset
            })
            window.addEventListener('touchend', e => {
                this.mouse.x = 0
                this.mouse.y = 0
            })
            window.addEventListener('wheel', e => {
                this.mouse.x = e.clientX
                this.mouse.y = e.clientY
            })

            this.direction = direction
            this.textArray = []
            
        }
        setAnimationComplexity(changeBy) {
            if (changeBy > 0 && !this.maxed) {
                this.gap > 1 ? this.gap-- : this.maxed = true
                if (this.gap == 2) {
                    this.size = 1
                } else if (this.size > 1) {
                    this.size--
                }
                this.basic = false
            } else if (!this.basic) {
                this.gap < 3 ? this.gap++ : this.basic = true
                this.size < 3 && this.size++
                this.maxed = false
            }
            if (!this.basic && !this.maxed) {
                this.stopped = true
                this.reset()
            }
        }
        pulse() {
            const y = this.vector.y
            const x = this.vector.x
            this.particles.forEach(particle => {

                particle.color = `rgb(220,50,50)`

                particle.velocity.x += -(x - particle.vector.x) / 30 + (Math.random() * .1 + .05)
                particle.velocity.y += -(y - particle.vector.y) / 30 + (Math.random() * .1 + .05)
            })
        }

        wrapText() {
            console.log('running')
            // this.stopped = false
            this.pageTitle.classList.add('d-none')
            // Canvas Settings
            
            this.context.fillStyle = '#ce7f10'
            this.context.font = `${this.fontSize}px Helvetica`
            this.context.textAlign = 'center'
            this.context.textBaseline = 'middle'

            // Multiline break
            this.textArray = []
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
                this.textArray[lineCounter] = line
            }
            let textHeight = this.lineHeight * lineCounter
            this.vector.y = this.placementY - textHeight/2
            
            this.drawText()

            this.convertToParticles()
        }
        drawText() {
            this.textArray.forEach((el, index) => {
                this.context.fillText(el, this.vector.x, this.vector.y + (index * this.lineHeight))
            })
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
            if (this.basic) {
                this.drawText()
            } else {
                this.particles.forEach(particle => {
                    particle.update()
                    particle.draw(particle.color)
                })
            }
            
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
   
    let lastFrame = +new Date()
    let speedCheckCount = 0

    let slowFrameCount = 0
    let fastFrameCount = 0
    function animate() {
        if (!effect) return

        lastFrame = +new Date()
        ctx.clearRect(0,0,canvas.width, canvas.height)
        effect.render()

        const animationTime = +new Date() - lastFrame
        if (animationTime > 50 && !effect.basic) {
            if (slowFrameCount > 8) {
                effect.setAnimationComplexity(-1)
            }
            fastFrameCount = 0
            slowFrameCount++
        } else {
            if (animationTime < 8 && !effect.maxed && speedCheckCount < 100) {
                if (fastFrameCount > 10) {
                    effect.setAnimationComplexity(+1)
                }
                fastFrameCount++
            }
            slowFrameCount = 0
        }
        speedCheckCount < 100 && speedCheckCount++
        
        
        

        if(!stopped || !this.basic) {
            requestAnimationFrame(animate)
        }
        window.setTimeout(() => {
            
            
        }, 1000 / frameRate)
    }
    animate()

    window.setTimeout(() => {
        effect.doPulse && effect.pulse()
    }, 3000)

    function resetCanvas() {
        canvas.height = window.innerHeight
        canvas.width = window.innerWidth

        ctx = canvas.getContext('2d')
    }
}

loadParticles()