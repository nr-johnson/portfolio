let effect
let frameRate = 45
let stopped = false
let fontRoute = '/fonts/Megrim-Regular.ttf'

function loadParticles(direction) {
    
    const canvas = document.getElementById('canvas')
    if (!document.getElementById('pageTitle')) {
        canvas.parentNode.removeChild(canvas)
        return
    }

    stopped = false
    

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
        constructor({ effect, vector }) {
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
            this.color = 'rgb(206,127,16)'
            this.baseColor = 'rgb(206,127,16)'
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
            this.animPointDistance = 0

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
            this.animPointDistanceVector = {
                x: this.effect.animPoint.x - this.vector.x,
                y: this.effect.animPoint.y - this.vector.y
            }

            this.distance = this.distanceVector.x * this.distanceVector.x + this.distanceVector.y * this.distanceVector.y
            
            this.animPointDistance = this.animPointDistanceVector.x * this.animPointDistanceVector.x + this.animPointDistanceVector.y * this.animPointDistanceVector.y

            const detectionRadius = (Math.random() * .8 + .5) * this.effect.mouse.radius

            const proximityCheck = this.distance < detectionRadius
            const animPointDistanceCheck = this.animPointDistance < detectionRadius

            if (this.vector.x == this.origin.x && this.vector.y == this.origin.y && this.velocity.x == 0 && this.velocity.y == 0 && !proximityCheck && !animPointDistanceCheck) {
                this.color = this.baseColor
                return
            }
            

            const colorValues = this.color.substring(4, this.color.indexOf(')')).split(',').map(color => { return parseInt(color) })
            const baseColorValues = this.baseColor.substring(4, this.baseColor.indexOf(')')).split(',').map(color => { return parseInt(color) })

            if (proximityCheck || animPointDistanceCheck) {
                this.force = -this.effect.mouse.radius / this.distance 

                colorValues[0] = colorValues[1] < 255 ? colorValues[0] += 75 * this.ease : 0
                colorValues[1] = colorValues[1] > 0 ? colorValues[1] -= 75 * this.ease : 0
                colorValues[2] = colorValues[2] > 0 ? colorValues[2] -= 75 * this.ease : 255
            }

            if (animPointDistanceCheck) {
                this.force -= this.effect.animPoint.power
                this.angle = Math.atan2(this.animPointDistanceVector.y, this.animPointDistanceVector.x)

                this.velocity.x += this.force * Math.cos(this.angle)
                this.velocity.y += this.force * Math.sin(this.angle)
            }

            if (proximityCheck) {
                this.angle = Math.atan2(this.distanceVector.y, this.distanceVector.x)

                this.velocity.x += this.force * Math.cos(this.angle)
                this.velocity.y += this.force * Math.sin(this.angle)

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
            this.providedFontSize = parseInt(this.pageTitle.getAttribute('data-fontSize'))   
            this.fontSize = (this.canvasWidth / 100) * this.providedFontSize

            this.text = this.pageTitle.textContent
            this.lineHeight = this.fontSize * 1
            this.maxTextWidth = this.canvasWidth * .8
            this.textHeight = 0
            this.textWidth = this.maxTextWidth
            
            this.placementY = (parseInt(this.pageTitle.getAttribute('data-y')) / 100) * this.canvasHeight

            if ( this.placementY - (this.textHeight / 2) < 65 ) { this.placementY = 65 + (this.textHeight / 2) }

            this.vector = {
                x: (parseInt(this.pageTitle.getAttribute('data-x')) / 100) * this.canvasWidth,
                y: this.placementY
            }
            this.box = {}

            

            this.providedGap = this.pageTitle.getAttribute('data-gap')
            this.providedSize = this.pageTitle.getAttribute('data-size')

            // Text Particles
            this.particles = []
            this.basic = false
            this.maxed = false
            this.gap = 2
            this.size = 2
            this.scalingComplexity = true
            
            this.mouse = {
                radius: 1500,
                x: 0,
                y: 0
            }

            this.animationFunctionCounter = 0
            this.aimationDirection = 1
            this.runAnimation = false
            this.animPoint = {
                power: 1,
                x: 0,
                y: 0
            }

            if (this.canvasWidth < 768) {
                this.fontSize = (this.canvasWidth / 100 ) * (this.providedFontSize * 1.75)
                this.mouse.radius = 1500
            } else {
                this.fontSize = (this.canvasWidth / 100 ) * this.providedFontSize 
                this.mouse.radius = this.canvasWidth * 5
            }

            if (this.vector.y + (this.lineHeight / 2) > (this.canvasHeight / 100) * 45) {
                this.fontSize *= .75
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
            this.scalingComplexity = true
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
                
                this.pulse()
            }
        }
        pulse() {
            const y = this.vector.y
            const x = this.vector.x
            this.particles.forEach(particle => {

                particle.color = `rgb(220,50,50)`

                particle.velocity.x += -(x - particle.vector.x) / 40 + (Math.random() * .1 + .05)
                particle.velocity.y += -(y - particle.vector.y) / 40 + (Math.random() * .1 + .05)
            })

            if (this.animationFunctionCounter < 5) {
                this.animationFunctionCounter++
                return false
            } else {
                this.animationFunctionCounter = 0
                return true
            }
        }
        async wrapText() {
            // this.stopped = false
            this.pageTitle.classList.add('d-none')
            
            var f = new FontFace('myFont', `url(${fontRoute})`);

            await f.load()

            document.fonts.add(f);

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
            this.textHeight = this.lineHeight * lineCounter
            this.vector.y = this.placementY - this.textHeight/2

            this.context.font = `${this.fontSize}px myFont`

            if ( this.placementY - (this.textHeight / 2) < 65 ) { 
                this.vector.y = 65 + (this.textHeight / 2) 
                this.placementY = this.vector.y
            }

            this.drawText()
            
            this.convertToParticles()

            this.scalingComplexity = false

            setTimeout(() => {
                this.runAnimation = true
                
            }, 2000)
            
            
        }
        drawText() {
            this.context.clearRect(0,0,this.canvasWidth, this.canvasHeight)
            this.context.fillStyle = '#ce7f10'
            this.context.textAlign = 'center'
            this.context.textBaseline = 'middle'
            this.textArray.forEach((el, index) => {
                this.context.fillText(el, this.vector.x, this.vector.y + (index * this.lineHeight))
            })
        }
        convertToParticles() {
            this.particles = []
            const newParticles = []

            const pixels = this.context.getImageData(0,0,this.canvasWidth,this.canvasHeight).data
            
            this.context.clearRect(0,0,this.canvasWidth, this.canvasHeight)
            
            for (let y = 0; y < this.canvasHeight; y += this.gap) {
                for (let x = 0; x < this.canvasWidth; x += this.gap) {
                    const index = (y * this.canvasWidth + x) * 4
                    const alpha = pixels[index + 3]

                    if (alpha > 0) {
                        newParticles.push(new Particle({ effect: this, vector: { x, y } }))    
                    }
                }   
            }

            this.particles = newParticles
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

            this.runAnimation && this.swipe()

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
        swipe() {
            // Delay between animation loops
            if (this.animationFunctionCounter > 0) {
                this.animationFunctionCounter--
                return
            }

            // Set y position and distortion strength
            this.animPoint.y = this.vector.y
            this.animPoint.power = .15

            // if moving right
            if (this.aimationDirection == 1) {
                // If within canvas
                if (this.animPoint.x < this.canvasWidth) {
                    // Move to the right by .25% of sceen width
                    this.animPoint.x += this.canvasWidth / 175
                } else {
                    // reverse direction
                    this.aimationDirection = 0
                    
                }
            } else if (this.animPoint.x > 0) {
                // Move to the left by .25% of sceen width
                this.animPoint.x -= this.canvasWidth / 175
            } else {
                // reverse direction, initiate delay
                this.aimationDirection = 1
                this.animPoint.x = -50
                this.animationFunctionCounter = 500
            }

            return false
        }
        reset() {
            
            resetCanvas()

            this.canvasHeight = window.innerHeight
            this.canvasWidth = window.innerWidth

            this.placementY = (parseInt(this.pageTitle.getAttribute('data-y')) / 100) * this.canvasHeight
            if (this.placementY < 40) this.placementY = 40

            if (this.canvasWidth < 768) {
                this.fontSize = (this.canvasWidth / 100 ) * (this.providedFontSize * 1.75)
                this.mouse.radius = 1500
            } else {
                this.fontSize = (this.canvasWidth / 100 ) * this.providedFontSize
                this.mouse.radius = this.canvasWidth * 5
            }
            if (this.vector.y + (this.lineHeight / 2) > (this.canvasHeight / 100) * 45) {
                this.fontSize *= .75
            }

            this.vector.x = (parseInt(this.pageTitle.getAttribute('data-x')) / 100) * this.canvasWidth,
            this.vector.y = this.placementY
            

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

        if(!stopped || !this.basic) {
            requestAnimationFrame(animate)
        }

        lastFrame = +new Date()
        
        ctx.clearRect(0,0,canvas.width, canvas.height)
        
        effect.render()

        if (effect.scalingComplexity) return

        const animationTime = +new Date() - lastFrame
        if (animationTime > 55 && !effect.basic) {
            if (slowFrameCount > 8) {
                effect.setAnimationComplexity(-1)
            }
            fastFrameCount = 0
            slowFrameCount++
        } else {
            if (animationTime < 6 && !effect.maxed && speedCheckCount < 100) {
                if (fastFrameCount > 10) {
                    effect.setAnimationComplexity(+1)
                }
                fastFrameCount++
            }
            slowFrameCount = 0
        }
        speedCheckCount < 100 && speedCheckCount++
    }

    animate()

    function resetCanvas() {
        canvas.height = window.innerHeight
        canvas.width = window.innerWidth

        ctx = canvas.getContext('2d')
    }
}

loadParticles()