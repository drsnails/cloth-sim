class Stick {
    length 
    pointA;
    pointB;
    isRemoved = false
    constructor(pointA, pointB) {
        this.pointA = pointA
        this.pointB = pointB
        this.length = this.pointA.position.dist(this.pointB.position)
    }

    render() {
        if (this.isRemoved) return
        stroke(255)
        if (this.isLocked) stroke(255, 50, 5)

        strokeWeight(2)
        const { x: x1, y: y1 } = this.pointA.position
        const { x: x2, y: y2 } = this.pointB.position
        line(x1, y1, x2, y2)
    }



}