
/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}



function render(gl, numPoints) {
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, numPoints)
}

function add_point(array, point, size) {
    const offset = size / 2;
    let point_coords = [vec2(point[0] - offset, point[1] - offset), vec2(point[0] + offset, point[1] - offset),
    vec2(point[0] - offset, point[1] + offset), vec2(point[0] - offset, point[1] + offset),
    vec2(point[0] + offset, point[1] - offset), vec2(point[0] + offset, point[1] + offset)];
    array.push.apply(array, point_coords);
}

window.onload = () => {
    const colors = [
        vec4(0.0, 0.0, 0.0, 1.0),  // Black      -> index 0
        vec4(1.0, 0.0, 0.0, 1.0),  // Red        -> index 1
        vec4(1.0, 1.0, 0.0, 1.0),  // Yellow     -> index 2
        vec4(0.0, 1.0, 0.0, 1.0),  // Green      -> index 3
        vec4(0.0, 0.0, 1.0, 1.0),  // Blue       -> index 4
        vec4(1.0, 0.0, 1.0, 1.0),  // Magenta    -> index 5
        vec4(0.0, 1.0, 1.0, 1.0),  // Cyan       -> index 6
        vec4(0.39, 0.58, 0.93, 1.0) // Cornflower -> index 7
    ];


    let canvas = document.getElementById("c");
    let clearCanvasButton = document.getElementById("clearCanvas");
    let colorMenu = document.getElementById("colorMenu");
    let clearMenu = document.getElementById("clearMenu");
    let switchMode = document.getElementById("modeSelect");

    gl = setupWebGL(canvas);
    let program = initShaders(gl, "vertex-shader", "fragment-shader");


    // create buffer for points
    let max_verts = 1000
    let index = 0
    let num_points = 0

    let vBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, max_verts * sizeof["vec2"], gl.STATIC_DRAW)

    let vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition)



    let cBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, max_verts * sizeof["vec4"], gl.STATIC_DRAW)

    let vColor = gl.getAttribLocation(program, "a_color");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.useProgram(program);


    // add event listener
    canvas.addEventListener("click", (e) => {
        let color = colors[colorMenu.value]
        console.log(color)

        let rec = e.target.getBoundingClientRect()

        mousepos = vec2(2 * (e.clientX - rec.x) / canvas.width - 1, 2 * (canvas.height - (e.clientY - rec.y) - 1) / canvas.height - 1); // get mouse pos in [0, 1.0]
        console.log()
        let point = []
        add_point(point, mousepos, 0.1)

        console.log(point)

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof["vec2"], flatten(point))

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof["vec4"], flatten(Array(6).fill(color)))

        index += 6
        num_points = Math.max(num_points, index)
        index %= max_verts
    })

    // clea canvas butteon event listener
    clearCanvasButton.addEventListener("click", (e) => {
        let color = colors[clearMenu.value]

        num_points = 0
        index = 0
        gl.clearColor(color[0], color[1], color[2], color[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);

    })


    // draw background
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    function animate() { render(gl, num_points); requestAnimationFrame(animate) }
    animate();
}