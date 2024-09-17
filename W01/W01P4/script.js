
/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}


function render(gl, numPoints) {

    // let vertices = [vec2(0.5, 0.0), vec2(0.0, 0.5),  vec2(0.0, -0.5), vec2(-0.5, 0.0)];
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    gl.clear(gl.COLOR_BUFFER_BIT)
    // gl.drawArrays(gl.TRIANGLE_FAN, 0, numPoints)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, numPoints)
}


window.onload = () => {

    //TODO
    let canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    let program = initShaders(gl, "vertex-shader", "fragment-shader");


    let vertices = [vec2(0.5, 0.0), vec2(0.0, 0.5), vec2(0.0, -0.5), vec2(-0.5, 0.0)];


    // draw background
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // create buffer for circle
    let v1Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, v1Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition)

    let betaLoc = gl.getUniformLocation( program, "beta");


    let beta = 0.0
    function animate() {
        beta += 0.15
        gl.uniform1f(betaLoc, beta);
        render(gl, vertices.length);
        requestAnimationFrame(animate)
    }
    animate();
}