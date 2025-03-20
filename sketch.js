// Alt + CLICK === Delete (press and hold ALT and move with mouse)
// Shift + CLICK === Toggle Lock
// Control/Command + CLICK === New Stick and Points
// "Space" === Toggle running
// "r" === Reset
// "g" === New Cloth Grid

const r = 10
const GRAVITY = -1.5
let gPoints = []
let gSticks = []
let gPrevTime = 0
let gSelectedPoint = null
let gIsRunning = true
const STORAGE_KEY = 'CLOTH'
const gClothGridData = [19, 25, 15]

function setup() {
    gPrevTime = Date.now()
    createCanvas(window.innerWidth - 150, 600);
    background(50);
    translate(width / 2, height / 2)
    scale(1, -1)

    // createPoints()
    // createSticks()
    // shuffleSticks()
    generateClothGrid(...gClothGridData)
    // _loadClothFromStorage()
    render()


}



function draw() {
    translate(width / 2, height / 2)
    scale(1, -1)
    if (!gIsRunning) return
    const now = Date.now()
    const dt = (now - gPrevTime) / 35
    gPrevTime = now
    background(50);
    simulate(dt)
    renderSticks()
    renderPoints()

}

function render() {
    background(50);
    renderSticks()
    renderPoints()
}



function simulate(dt) {

    gPoints.forEach(point => {
        if (point.isLocked) return
        const prevPosition = point.position.copy()
        const diff = p5.Vector.sub(point.position, point.prevPosition)
        point.position.add(diff)
        point.position.add(createVector(0, GRAVITY * (dt ** 2)))
        point.prevPosition.set(prevPosition)

    })

    for (let i = 0; i < 6; i++) {
        gSticks.forEach(stick => {
            if (stick.isRemoved) return
            const { pointA, pointB, length } = stick
            const positionA = pointA.position.copy()
            const positionB = pointB.position.copy()

            const middle = p5.Vector.add(positionA, positionB).div(2)
            const direction = p5.Vector.sub(positionA, positionB).normalize()

            if (!pointA.isLocked) pointA.position.set(p5.Vector.add(middle, direction.setMag(length / 2)))
            if (!pointB.isLocked) pointB.position.set(p5.Vector.sub(middle, direction.setMag(length / 2)))
        })
    }

}

function removePointAndSticks(pointToRemove) {
    // const pointIndex = gPoints.indexOf(pointToRemove)
    // if (pointIndex > -1) {
    //     gPoints.splice(pointIndex, 1)
    //     for (let i = gSticks.length - 1; i >= 0; i--) {
    //         const stick = gSticks[i]
    //         if (stick.pointA === pointToRemove || stick.pointB === pointToRemove) {
    //             gSticks.splice(i, 1)
    //         }
    //     }
    // }
    const mouseXTran = mouseX - width / 2
    const mouseYTran = height / 2 - mouseY
    const closestStickIdx = gSticks.findIndex(stick => {
        const { pointA, pointB } = stick
        const dist = getDistanceFromStick(createVector(mouseXTran, mouseYTran), pointA.position, pointB.position)
        return dist < 5
    })
    if (closestStickIdx > -1) {
        gSticks.splice(closestStickIdx, 1)
    }
}

function mousePressed() {
    const mouseXTran = mouseX - width / 2
    const mouseYTran = height / 2 - mouseY
    const pointPressed = gPoints.find(point => {
        const distance = point.position.dist(createVector(mouseXTran, mouseYTran))
        return distance <= point.size
    })
    if (pointPressed) {
        if (keyIsDown(SHIFT)) {
            pointPressed.isLocked = !pointPressed.isLocked
        } else if (keyIsDown(ALT)) {
            removePointAndSticks(pointPressed)
        } else if (!gSelectedPoint) {
            gSelectedPoint = pointPressed
            pointPressed.isSelected = true
            pointPressed.render()
        } else {
            createStick(gSelectedPoint, pointPressed)
            shuffleSticks()
            cleanSelectedPoint()
        }
        render()

    } else {
        if (keyIsDown(91) || keyIsDown(93) || keyIsDown(17))  { // Check for Command key
            const { closestPoint, distance } = getClosestPoint(createVector(mouseXTran, mouseYTran))
            const point = createPoint(mouseXTran, mouseYTran)
            if (distance <= 200) {
                createStick(closestPoint, point)
                shuffleSticks()
            }
        } else if (keyIsDown(ALT)) {
            const closestStickIdx = gSticks.findIndex(stick => {
                const { pointA, pointB } = stick
                const dist = getDistanceFromStick(createVector(mouseXTran, mouseYTran), pointA.position, pointB.position)
                return dist < 5
            })
            if (closestStickIdx > -1) {
                gSticks.splice(closestStickIdx, 1)
                render()
            }
        } else {
            createPoint(mouseXTran, mouseYTran)
        }
    }

    _saveClothToStorage()

}

function mouseMoved() {
    if (!gIsRunning) return
    const mouseXTran = mouseX - width / 2
    const mouseYTran = height / 2 - mouseY
    const pointPressed = gPoints.find(point => {
        const distance = point.position.dist(createVector(mouseXTran, mouseYTran))
        return distance <= point.size
    })
    if (keyIsDown(ALT)) {
        removePointAndSticks(pointPressed)
    }

}


function keyPressed() {
    
    if (key === ' ') {
        gPrevTime = Date.now()
        gIsRunning = !gIsRunning
    } else if (key === 'r') {
        clearCloth()
    } else if (key === 'g') {
        generateClothGrid(...gClothGridData)
    }
}


function connectPointsWithSticks() {

    for (let i = 0; i < gPoints.length - 1; i++) {
        const pointA = gPoints[i]
        const pointB = gPoints[i + 1]
        createStick(pointA, pointB)
    }
    shuffleSticks()

}

function generateClothGrid(rowsCount, colsCount, spacing) {
    const gap = 10
    colsCount = Math.round(width / (spacing + gap))  
    rowsCount = Math.round(height / (spacing + gap)) 
    gPoints.length = 0;
    gSticks.length = 0;
    const startI = Math.round(-rowsCount / 2) - 1
    const startJ = Math.round(-colsCount / 2)  
    for (let i = startI; i < rowsCount / 2 - 1; i++) {
        for (let j = startJ; j < colsCount / 2  ; j++) {
            const point = createPoint(j * spacing, -i * spacing);
            if (i === startI && (j % 4 === 0 || j===startJ || j===round(colsCount / 2) -1)) {
                point.isLocked = true
            }
        }
    }

    for (let i = 0; i < rowsCount; i++) {
        for (let j = 0; j < colsCount; j++) {
            const index = i * colsCount + j;
            if (j < colsCount - 1) createStick(gPoints[index], gPoints[index + 1])
            if (i < rowsCount - 1) createStick(gPoints[index], gPoints[index + colsCount])
        }
    }

    shuffleSticks();
    render();
}

function getClosestPoint({ x, y }) {
    let closestPoint = null;
    let minDist = Infinity;

    gPoints.forEach(point => {
        const distance = point.position.dist(createVector(x, y));
        if (distance < minDist) {
            minDist = distance;
            closestPoint = point;
        }
    });

    return { closestPoint, distance: minDist };
}


function createStick(pointA, pointB) {
    const stick = new Stick(pointA, pointB)
    gSticks.push(stick)
    stick.render()
}


function createPoint(x, y) {
    let point = new Point(x, y, false)
    point.prevPosition = createVector(point.position.x, point.position.y)
    gPoints.push(point)
    point.render()
    return point
}


function createPoints(limit = 5) {
    for (let i = 0; i < limit; i++) {
        createPoint(75 * i, 75 * (limit - i) - 100)
    }
    gPoints[0].isLocked = true

}

function createSticks(limit = 5) {
    for (let i = 0; i < limit - 1; i++) {
        const pointA = gPoints[i]
        const pointB = gPoints[i + 1]
        createStick(pointA, pointB)
    }
    gPoints[0].isLocked = true
}

function renderPoints() {
    gPoints.forEach(point => point.render())

}

function renderSticks() {
    gSticks.forEach(stick => stick.render())

}

function shuffleSticks() {
    shuffleArray(gSticks)
}

function cleanSelectedPoint() {
    // console.log('gSelectedPoint:', gSelectedPoint)
    gSelectedPoint.isSelected = false
    gSelectedPoint.render()
    gSelectedPoint = null


}
function getDistanceFromStick(P0, P1, P2) {
    const distP0P1 = P0.dist(P1);
    const distP0P2 = P0.dist(P2);
    const distP1P2 = P1.dist(P2);

    if (distP0P1 <= distP1P2 && distP0P2 <= distP1P2) {
        const numerator = Math.abs((P2.y - P1.y) * P0.x - (P2.x - P1.x) * P0.y + P2.x * P1.y - P2.y * P1.x);
        const denominator = Math.sqrt((P2.y - P1.y) ** 2 + (P2.x - P1.x) ** 2);
        return numerator / denominator;
    } else {
        return Math.min(distP0P1, distP0P2);
    }
}

function clearCloth() {
    gPoints.length = 0;
    gSticks.length = 0;
    render()


}


function _saveClothToStorage() {
    const _points = gPoints.map(point => ({
        ...point,
        position: { x: point.position.x, y: point.position.y },
        prevPosition: { x: point.prevPosition.x, y: point.prevPosition.y }
    }))
    saveToStorage(STORAGE_KEY, { points: _points })
}

function _loadClothFromStorage() {
    const clothData = loadFromStorage(STORAGE_KEY)
    if (clothData) {
        gPoints = clothData.points.map(point => {
            const newPoint = new Point(point.position.x, point.position.y, point.isLocked)
            newPoint.prevPosition = createVector(point.prevPosition.x, point.prevPosition.y)
            newPoint.isSelected = point.isSelected
            return newPoint
        })
        gSticks = []
        connectPointsWithSticks()
    }

}


function _map(value, minOrg, maxOrg, minRes, maxRes) {
    const range = maxOrg - minOrg
    value -= minOrg
    const percent = value / range
    const res = percent * (maxRes - minRes)
    return res + minRes

}

function getNormalVector(vec) {
    return createVector(vec.x, vec.y).normalize();
}



function createDemoPoints() {


    return [
        {
            "pos": [
                0,
                150
            ],
            "isLocked": true
        },
        {
            "pos": [
                50,
                100
            ],
            "isLocked": false
        },
        {
            "pos": [
                100,
                50
            ],
            "isLocked": false
        },
        {
            "pos": [
                150,
                0
            ],
            "isLocked": false
        },
        {
            "pos": [
                200,
                -50
            ],
            "isLocked": false
        },
        {
            "pos": [
                138,
                90
            ],
            "isLocked": false
        },
        {
            "pos": [
                191,
                127
            ],
            "isLocked": false
        },
        {
            "pos": [
                256,
                148
            ],
            "isLocked": false
        },
        {
            "pos": [
                321,
                147
            ],
            "isLocked": false
        },
        {
            "pos": [
                111,
                168
            ],
            "isLocked": false
        },
        {
            "pos": [
                99,
                234
            ],
            "isLocked": false
        },
        {
            "pos": [
                92,
                302
            ],
            "isLocked": true
        },
        {
            "pos": [
                167,
                286
            ],
            "isLocked": false
        },
        {
            "pos": [
                237,
                271
            ],
            "isLocked": true
        },
        {
            "pos": [
                178,
                226
            ],
            "isLocked": false
        },
        {
            "pos": [
                281,
                213
            ],
            "isLocked": false
        },
        {
            "pos": [
                -26,
                84
            ],
            "isLocked": false
        },
        {
            "pos": [
                -104,
                88
            ],
            "isLocked": false
        },
        {
            "pos": [
                -217,
                101
            ],
            "isLocked": false
        },
        {
            "pos": [
                -312,
                123
            ],
            "isLocked": false
        },
        {
            "pos": [
                -340,
                212
            ],
            "isLocked": false
        },
        {
            "pos": [
                -140,
                272
            ],
            "isLocked": true
        },
        {
            "pos": [
                -250,
                246
            ],
            "isLocked": false
        },
        {
            "pos": [
                -206,
                206
            ],
            "isLocked": false
        },
        {
            "pos": [
                -154,
                172
            ],
            "isLocked": false
        },
        {
            "pos": [
                -95,
                198
            ],
            "isLocked": false
        }
    ]

}