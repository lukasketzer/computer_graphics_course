
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

    let canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    let program = initShaders(gl, "vertex-shader", "fragment-shader");

    let ext = gl.getExtension('OES_element_index_uint');

    var wire_indices = new Uint32Array([
        0, 1, 1, 2, 2, 3, 3, 0, // front
        2, 3, 3, 7, 7, 6, 6, 2, // right
        0, 3, 3, 7, 7, 4, 4, 0, // down
        1, 2, 2, 6, 6, 5, 5, 1, // up
        4, 5, 5, 6, 6, 7, 7, 4, // back
        0, 1, 1, 5, 5, 4, 4, 0 // left
    ]);
    var vertices = [
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 1.0, 1.0),
        vec3(1.0, 1.0, 1.0),
        vec3(1.0, 0.0, 1.0),
        vec3(0.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(1.0, 1.0, 0.0),
        vec3(1.0, 0.0, 0.0),
    ];

    var indices = new Uint32Array([
        1, 0, 3, 3, 2, 1, // front
        2, 3, 7, 7, 6, 2, // right
        3, 0, 4, 4, 7, 3, // down
        6, 5, 1, 1, 2, 6, // up
        4, 5, 6, 6, 7, 4, // back
        5, 4, 0, 0, 1, 5 // left
    ]);

    let iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(wire_indices), gl.STATIC_DRAW);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.useProgram(program);

   

    let eye = vec3(0.5, 0.5, 5.5)
    let at = vec3(0.5, 0.5, 1)
    let up = vec3(0, 1, 0)
    let v = lookAt(eye, at, up)

    let VLoc = gl.getUniformLocation(program, "v_matrix")
    gl.uniformMatrix4fv(VLoc, false, flatten(v))

    let near = 0.1
    let far = 50.0
    let p = perspective(45, canvas.width / canvas.height,near, far)
    let PLoc = gl.getUniformLocation(program, "p_matrix")
    gl.uniformMatrix4fv(PLoc, false, flatten(p))

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT)

    let TLoc = gl.getUniformLocation(program, "t_matrix")
    // cube 1
    M = translate(-1.5, 0, 0)
    R = mat4()
    T = mult(R, M) // R * M Transformation matrix

    gl.uniformMatrix4fv(TLoc, false, flatten(T))
    gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);

    // cube 2 // one point view
    M = translate(0, 0, 0)
    R = mat4()
    T = mult(R, M) // R * M
    gl.uniformMatrix4fv(TLoc, false, flatten(T))
    gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);

    // cube 3
    M = translate(1.6, 0, 0)
    R = rotateX(30)
    T = mult(R, M) // R * M
    gl.uniformMatrix4fv(TLoc, false, flatten(T))
    gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);
    

    // // end of first cube

    // eye = vec3(8.5, 0.5, 8.5)
    // at = vec3(1, 1, 1)
    // up = vec3(0, 1, 0)
    // v = lookAt(eye, at, up)

    // VLoc = gl.getUniformLocation(program, "v_matrix")
    // gl.uniformMatrix4fv(VLoc, false, flatten(v))

    // near = 0.1
    // far = 50.0
    // p = perspective(45, canvas.width / canvas.height,near, far)
    // PLoc = gl.getUniformLocation(program, "p_matrix")
    // gl.uniformMatrix4fv(PLoc, false, flatten(p))


    // gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);

    // // end of sencond point view cube

    // eye = vec3(3.8, 2.5, 5.5)
    // at = vec3(0.2, 0.5, 0.8)
    // up = vec3(0, 1, 0)
    // v = lookAt(eye, at, up)

    // VLoc = gl.getUniformLocation(program, "v_matrix")
    // gl.uniformMatrix4fv(VLoc, false, flatten(v))

    // near = 0.1
    // far = 50.0
    // p = perspective(45, canvas.width / canvas.height,near, far)
    // PLoc = gl.getUniformLocation(program, "p_matrix")
    // gl.uniformMatrix4fv(PLoc, false, flatten(p))


    // gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);

    // // end of sencond point view cube


}