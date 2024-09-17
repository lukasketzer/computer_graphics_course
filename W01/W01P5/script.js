
/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}


// calculate circle coordinates (on cpu)
function calc_circle (x, y, radius, n) {
    let circle_vertecies = [vec2(x, y)] 
    let x_c, y_c

    for (let i = 0 ; i <= n ; i++) {
        theta = (2 * Math.PI * i) / n
        x_c = radius * Math.sin(theta) + x
        y_c = radius * Math.cos(theta) + y
        circle_vertecies.push(vec2(x_c, y_c))
    }
    return circle_vertecies
}

// calculate circle coordinates (on cpu)
function calc_circle_triangle (x, y, radius, n) {
    let circle_vertecies = [vec2(x, y)]  // inital circle
    let x_c, y_c

    for (let i = 0 ; i <= n ; i++) {
        theta = (2 * Math.PI * i) / n
        x_c = radius * Math.sin(theta) + x
        y_c = radius * Math.cos(theta) + y
        circle_vertecies.push(vec2(x_c, y_c))
        circle_vertecies.push(vec2(x, y))
        circle_vertecies.push(vec2(x_c, y_c))
    }
    return circle_vertecies
}

// global variables (shit)
let x = 0
let y = 0
let radius = 0.2
let w = 0.05 // velocity

function render(gl, numPoints) {
    w = Math.sign(1 - radius - Math.abs(y)) * w
    y = y + w

    // circle_vertecies = calc_circle(x, y, radius, 200)
    circle_vertecies = calc_circle_triangle(x, y, radius, 200)

    gl.bufferData(gl.ARRAY_BUFFER, flatten(circle_vertecies), gl.STATIC_DRAW);

    gl.clear(gl.COLOR_BUFFER_BIT)
    // gl.drawArrays(gl.TRIANGLE_FAN, 0, numPoints)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, numPoints)
}


window.onload = () => {

//TODO
let canvas = document.getElementById("c");
gl = setupWebGL(canvas);
let program = initShaders(gl, "vertex-shader", "fragment-shader");


circle_vertecies = calc_circle(0, 0, radius, 200)


// draw background
gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.useProgram(program);

// create buffer for circle
let v1Buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, v1Buffer);
gl.bufferData(gl.ARRAY_BUFFER, flatten(circle_vertecies), gl.STATIC_DRAW);

let vPosition = gl.getAttribLocation(program, "a_Position");
gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vPosition)

function animate() {render(gl, circle_vertecies.length); requestAnimationFrame(animate)}
animate();
}