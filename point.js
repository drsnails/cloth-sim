class Point {
    position = createVector(0, 0)
    prevPosition = createVector(0, 0)
    isLocked = false
    size = 5
    // lastDiff = createVector()
    isSelected = false
    constructor(x = 0, y = 0, isLocked = false) {
        this.position.x = x
        this.position.y = y
        this.isLocked = isLocked
        this.prevPosition = this.position
    }

    render() {
        stroke(255)
        if (this.isLocked) stroke(255, 50, 5)
        const size = this.isSelected ? this.size * 1.5 : this.size
        strokeWeight(size)
        point(this.position)
    }



}

function onClick(ev) {

    console.log('ev:', ev)

}