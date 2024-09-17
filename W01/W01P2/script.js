
/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}


window.onload = () => {

//TODO
let canvas = document.getElementById("c");
gl = setupWebGL(canvas);
let program = initShaders(gl, "vertex-shader", "fragment-shader");



gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);


gl.useProgram(program);

let vertices = [vec2(0.0, 0.0), vec2(1, 1), vec2(1, 0)];
let vBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

let vPosition = gl.getAttribLocation(program, "a_Position");
gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vPosition)

gl.drawArrays(gl.POINTS, 0, vertices.length)
}