// Main particle effect variable
let effect
// if true, animation will not render next frame
let stopped = false
// Animation loop ID
let animationRequestID = null
// path to font file
let fontRoute = '/fonts/Megrim-Regular.ttf'
// setting for the number of particles to be created. This will change based on performance.
// it allows consistency between page loads, so that there isn't a flash when the resolution changes each time
// 1 is max complexity (1px in size), 3 is the max.
let complexity = 1

let manualStopped = false

// Main function to generate particles
function loadParticles(direction) {
    // Canvas to draw particles
    let canvas = document.getElementById('canvas')
    // Text is collected from an H1 element in the page with the id of pageTitle
    // If that element does not exist the function is stopped.
    const pageTitle = document.getElementById('pageTitle')
    if (!document.getElementById('pageTitle')) {
        canvas.parentNode.removeChild(canvas)
        return
    }

    stopped = false
    
    // Canvas context
    let ctx = canvas.getContext('2d')

    // Canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Ensures canvas is visible
    canvas.style.opacity = 1
    canvas.style.transform = `translateX(0)`

    // Class object for particles
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
   
    // Class object for main effect
    class Effect {
        constructor({ context, canvasWidth, canvasHeight, pageTitle }) {
            // Context and canvas vars
            this.context = context
            this.canvasWidth = canvasWidth
            this.canvasHeight = canvasHeight

            // pageTitle dom element from which Text content is collected
            this.pageTitle = pageTitle

            // Text variables
            this.text = this.pageTitle.textContent
            this.providedFontSize = parseInt(this.pageTitle.getAttribute('data-fontSize'))
            this.baseFontSize = (this.canvasWidth / 100) * this.providedFontSize
            this.fontSize = this.baseFontSize
            this.providedYVector = parseInt(this.pageTitle.getAttribute('data-y'))
            this.lineHeight = this.fontSize
            this.maxTextWidth = 80
            this.textHeight = 0
            this.textWidth = this.maxTextWidth
            
            // Main effect vector variables
            // Verticle placement. Based on attribute stored in dom element
            this.placementY = (this.providedYVector / 100) * this.canvasHeight

            // Text Particles
            this.particles = []
            // If basic is true, Dom element will be show and this function will stop
            this.basic = false
            // if true, particle complexity will not increase. Will be set when particle size is 1 pixel
            this.maxed = false
            // number of pixels between particles origin
            this.gap = complexity
            // size of particles in pixels
            this.size = this.gap
            // if true, the complexity is currently being adjusted
            this.scalingComplexity = true
            
            // Mouse/touch effect radius and position
            this.mouse = {
                radius: 1500,
                x: 0,
                y: 0
            }

            // Variables for swipe effect
            this.animationFunctionCounter = 0
            this.aimationDirection = 1
            this.runAnimation = false
            // animation point effect radius and position
            // Works the same as mouse and touch
            this.animPoint = {
                power: 1,
                x: 0,
                y: 0
            }

            // Changes some variables based on screen width
            if (this.canvasWidth < 768) {
                this.fontSize = this.baseFontSize * 1.5
                this.maxTextWidth = 60
                this.lineHeight = this.fontSize
                this.mouse.radius = 1500
                this.placementY = ((this.providedYVector / 100) * .9) * this.canvasHeight
                
            } else {
                this.fontSize = this.baseFontSize
                this.lineHeight = this.fontSize
                this.maxTextWidth = 80
                this.mouse.radius = this.canvasWidth * 5
                this.placementY = (this.providedYVector / 100) * this.canvasHeight
            }

            // Main position variables
            this.vector = {
                x: (parseInt(this.pageTitle.getAttribute('data-x')) / 100) * this.canvasWidth,
                y: this.placementY
            }

            // Sets interactive effect position on mouse movement
            window.addEventListener('mousemove', e => {
                this.mouse.x = e.x
                this.mouse.y = e.y + window.pageYOffset
            })
            // Sets interactive effect position on touch moevement
            window.addEventListener('touchmove', e => {
                this.mouse.x = e.touches[0].clientX
                this.mouse.y = e.touches[0].clientY + window.pageYOffset
            })
            // Set interactive effect position to zero when finger leaves touchscreen
            window.addEventListener('touchend', e => {
                this.mouse.x = 0
                this.mouse.y = 0
            })

            // Array containing each row of text after is has been split
            this.textArray = []
            
        }
        // Alters particle complexity (count and size)
        setAnimationComplexity(changeBy) {
            this.scalingComplexity = true
            // If increasing complexity and complexity is not maxed
            if (changeBy > 0 && !this.maxed) {
                // Decreases space between particles so long as that space is greater than 1 pixel
                this.gap > 1 ? this.gap-- : this.maxed = true

                // Decreases particle size so long as they are larger than 1 pixel
                this.size > 1 && this.size--
                
                // Ensures next frame will render particles
                this.basic = false

            } else if (!this.basic) {
                // If decreasing complexity and particle render is not turned off
                // Increase gap between particles so long as gap is less than 3 pixels
                this.gap < 3 ? this.gap++ : this.basic = true
                // Increase particle size so long as particle is less than 3 pixels
                this.size < 3 && this.size++
                // Ensures that complexity is not maxed
                this.maxed = false
            }
            // If extremes were not reached, reset animation
            complexity = this.gap
            this.reset()
        }
        // splits text into individual rows
        async wrapText() {
            // Hides dom element
            this.pageTitle.classList.add('d-none')
            
            // Creates new font
            var f = new FontFace('myFont', `url(${fontRoute})`);

            // Waits for font to load
            await f.load()

            // Adds font to document
            document.fonts.add(f);

            // Multiline break
            this.textArray = []
            let words = this.text.split(' ')
            let lineCounter = 0
            let line = ''

            // Loops through each word
            // for (let i = 0; i < words.length; i++) {
            //     // if adding word to line does not exced max line width, add it to the line, else, create a new line
            //     let testLine = line + words[i] + ' '
            //     if (this.context.measureText(testLine).width > this.maxTextWidth) {
            //         line = words[i] + ' '
            //         lineCounter++
            //     } else {
            //         line = testLine
            //     }
            //     // Add line to text line array
            //     this.textArray[lineCounter] = line
            // }

            this.textArray = [this.text]

            // Changes text variables based on line splitting
            this.textHeight = this.lineHeight * lineCounter
            this.vector.y = this.placementY - this.textHeight / 2

            // Sets font to be rendered
            this.context.font = `${this.fontSize}px myFont`

            // If text will connect with header, lower text
            if (this.canvasWidth < 768) {
                if ( this.placementY - (this.textHeight / 2) < 55 ) { 
                    this.vector.y = 55 + (this.textHeight / 2) 
                    this.placementY = this.vector.y
                }
            } else {
                if ( this.placementY - (this.textHeight / 2) < 80 ) { 
                    this.vector.y = 80 + (this.textHeight / 2) 
                    this.placementY = this.vector.y
                }
            }
            

            // Draws text to canvas
            this.drawText()
            // Converts text into particles
            this.convertToParticles()
            // allows render speed check and complexity changes
            this.scalingComplexity = false

            // Delay for initial swipe animation
            setTimeout(() => {
                this.runAnimation = true
            }, 2000)
        }
        // Draws text on canvas
        drawText() {
            this.context.clearRect(0,0,this.canvasWidth, this.canvasHeight)
            this.context.fillStyle = '#ce7f10'
            this.context.textAlign = 'center'
            this.context.textBaseline = 'middle'
            this.textArray.forEach((el, index) => {
                this.context.fillText(el, this.vector.x, this.vector.y + (index * this.lineHeight))
            })
        }
        // Converts text into particles
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
        // Renders particles (called each frame)
        render() {
            if (this.basic) {
                this.stopped = true
                this.pageTitle.classList.remove('d-none')
            } else {
                this.particles.forEach(particle => {
                    particle.update()
                    particle.draw(particle.color)
                })
            }

            this.runAnimation && this.swipe()

        }
        // Moves particles to new base location
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
        // Swipe accross screen animation (called each frame)
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
        // resizes canvas and removes and recreates particles
        reset() {
            
            resetCanvas()

            this.canvasHeight = window.innerHeight
            this.canvasWidth = window.innerWidth

            if (this.canvasWidth < 768) {
                this.fontSize = ((this.canvasWidth / 100) * this.providedFontSize) * 1.5
                this.maxTextWidth = 60
                this.lineHeight = this.fontSize
                this.mouse.radius = 1500
                this.placementY = ((this.providedYVector / 100) * .9) * this.canvasHeight
                
            } else {
                this.fontSize = (this.canvasWidth / 100) * this.providedFontSize
                this.lineHeight = this.fontSize
                this.maxTextWidth = 80
                this.mouse.radius = this.canvasWidth * 5
                this.placementY = (this.providedYVector / 100) * this.canvasHeight
            }

            this.vector.x = (parseInt(this.pageTitle.getAttribute('data-x')) / 100) * this.canvasWidth,
            this.vector.y = this.placementY

            this.wrapText()

            stopped = false
        }
        
    }

    // creates main effect opbject
    effect = new Effect({ context: ctx, canvasWidth: canvas.width, canvasHeight: canvas.height, pageTitle })
    // Calls the function that begins the particle generation proccess.
    effect.wrapText()
    
    // time that the previous frame was started
    let lastFrame = +new Date()
    // How main times the speed of the animation has been checked
    let speedCheckCount = 0

    // Counts for number of slow or fast frames reacured back to back
    let slowFrameCount = 0
    let fastFrameCount = 0

    // Main animation loop
    function animate() {
        // If there is no effect object, the functon stops.
        if (!effect) {            
            return
        }

        // If the animation has not been stopped and it has not been converted to basic, call the next frame
        // Also sets animation loop id so the animation can be canceled when new page is loaded
        if(!stopped && !this.basic) {
            animationRequestID = requestAnimationFrame(animate)
        } else {
            cancelAnimationFrame(animationRequestID)
        }

        // reset last frame start time
        lastFrame = +new Date()
        
        // Clears the current frame
        ctx.clearRect(0,0,canvas.width, canvas.height)
        
        // Renders the next frame
        effect.render()

        

        // if currently changing particle count, stop function
        if (effect.scalingComplexity) return

        // time it took to render this frame
        const animationTime = +new Date() - lastFrame
        // Checks if the speed of the animation merits an increase or decrease in complexity
        // If animation is slow
        if (animationTime > 50 && !effect.basic) {
            // If it has been slow for 8 consecutive frames
            if (slowFrameCount > 8) {
                // Reduce complexity of animation
                effect.setAnimationComplexity(-1)
            }
            fastFrameCount = 0
            slowFrameCount++
        } else {
            // If animation is fast
            // Will only be checked for the initial 100 frames
            if (animationTime < 6 && !effect.maxed && speedCheckCount < 100) {
                // If animation has been fast for 10 frames
                if (fastFrameCount > 10) {
                    // Increase complexity of animation
                    effect.setAnimationComplexity(+1)
                }
                fastFrameCount++
            }
            slowFrameCount = 0
        }
        speedCheckCount < 100 && speedCheckCount++
    }
    // Initial animation function call
    animate()

    // Resets canvas size
    function resetCanvas() {
        canvas = document.getElementById('canvas')
        
        canvas.height = window.innerHeight
        canvas.width = window.innerWidth

        ctx = canvas.getContext('2d')
    }
}

// Initial call to create page particles
loadParticles()

function setStopButton() {
    const stopButtons = document.querySelectorAll('.stopParticles')

    stopButtons.forEach(button => {
        button.classList.remove('d-none')

        button.addEventListener('click', () => {
            if (stopped) {
                restartParticles()
            } else {
                stopParticles(true)
            }
        })
    })

   
}
setStopButton()

function restartParticles() {
    const stopButtons = document.querySelectorAll('.stopParticles')
    stopButtons.forEach(button => {
        manualStopped = false
        stopped = false
        effect ? effect.basic = false : null

        loadParticles()
        effect.basic = false

        if (button.classList.contains('desktop')) {
            button.children[0].innerHTML = 'Stop Particles'
        } else {
            button.innerHTML = 'Stop Particles'
        }
    })
}

function stopParticles(main) {
    const stopButtons = document.querySelectorAll('.stopParticles')
    stopButtons.forEach(button => {
        if (manualStopped) return
        
        if (main) manualStopped = true

        stopped = true
        effect.basic = true
        if (button.classList.contains('desktop')) {
            button.children[0].innerHTML = 'Start Particles'
        } else {
            button.innerHTML = 'Start Particles'
        }
    })
}