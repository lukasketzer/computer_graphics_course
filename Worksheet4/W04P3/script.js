
/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

function render(gl, numPoints) {
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, numPoints);
}

// From the book 
function triangle(a, b, c, pointsArray) {
    pointsArray.push(a);
    pointsArray.push(b); // maybe wrong
    pointsArray.push(c);
}

function divideTriangle(a, b, c, count, pointsArray) {
    if (count > 0) {
        let ab = normalize(mix(a, b, 0.5), true);
        let ac = normalize(mix(a, c, 0.5), true);
        let bc = normalize(mix(b, c, 0.5), true);
        divideTriangle(a, ab, ac, count - 1, pointsArray);
        divideTriangle(ab, b, bc, count - 1, pointsArray);
        divideTriangle(bc, c, ac, count - 1, pointsArray);
        divideTriangle(ab, bc, ac, count - 1, pointsArray);
    }
    else {
        triangle(a, b, c, pointsArray);
    }
}

// From the book 
function tetrahedron(pointsArray, a, b, c, d, n) {
    divideTriangle(a, b, c, n, pointsArray);
    divideTriangle(d, c, b, n, pointsArray);
    divideTriangle(a, d, b, n, pointsArray);
    divideTriangle(a, c, d, n, pointsArray);
}

function initSphere(gl, numSubdivs) {
    // init sphere
    let va = vec4(0.0, 0.0, 1.0, 1);
    let vb = vec4(0.0, 0.942809, -0.333333, 1);
    let vc = vec4(-0.816497, -0.471405, -0.333333, 1);
    let vd = vec4(0.816497, -0.471405, -0.333333, 1);

    let sphere = []
    tetrahedron(sphere, va, vb, vc, vd, numSubdivs)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sphere), gl.STATIC_DRAW);

    return sphere.length
}


window.onload = () => {

    let canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    let program = initShaders(gl, "vertex-shader", "fragment-shader");

    let incrementButton = document.getElementById("increment")
    let decrementButton = document.getElementById("decrement")

    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)

    let ext = gl.getExtension('OES_element_index_uint'); // don't remove

    // init Buffers
    let vBuffer = gl.createBuffer();
    gl.vBuffer = vBuffer
    let numSubdivs = 7
    let numSphere = initSphere(gl, numSubdivs)

    let vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.useProgram(program);


    // camera / point-of-view
    let eye = vec3(0.0, 0.0, 5.0)
    let at = vec3(0, 0, 0)
    let up = vec3(0, 1, 0)
    let v = lookAt(eye, at, up)
    // let VLoc = gl.getUniformLocation(program, "v_matrix")
    // gl.uniformMatrix4fv(VLoc, false, flatten(v))

    // fov settings (Projection Matrix)
    let near = 0.1
    let far = 50.0
    let p = perspective(45, canvas.width / canvas.height, near, far)
    // let PLoc = gl.getUniformLocation(program, "p_matrix")
    // gl.uniformMatrix4fv(PLoc, false, flatten(p))

    // Transformation matrix
    let T = mat4()
    // let TLoc = gl.getUniformLocation(program, "t_matrix")
    // gl.uniformMatrix4fv(TLoc, false, flatten(T))

    let PVT = mult(p, mult(v, T))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "pvt_matrix"), false, flatten(PVT))


    // light
    let lightPos = vec4(0.0, 0.0, -1.0, 1.0)
    let lightPosLoc = gl.getUniformLocation(program, "lightPos")
    gl.uniform4fv(lightPosLoc, flatten(lightPos))

    // object color
    let objectColor = vec4(0.0, 1.0, 0.0, 1.0)
    let objectColorLoc = gl.getUniformLocation(program, "k_d")
    gl.uniform4fv(objectColorLoc, flatten(objectColor))

    let lightColor = vec4(1.0, 1.0, 1.0, 1.0)
    let lightColorLoc = gl.getUniformLocation(program, "L_d")
    gl.uniform4fv(lightColorLoc, flatten(lightColor))

    let alpha = 0.0
    let radius = 6.8

    function animate() {
        alpha += 0.1;
        v = lookAt(vec3(radius * Math.sin(alpha), 0.0, radius * Math.cos(alpha)), vec3(0.0, 0.0, 0.0), vec3(0, 1, 0))
        PVT = mult(p, mult(v, T))
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "pvt_matrix"), false, flatten(PVT))


        render(gl, numSphere);
        requestAnimationFrame(animate);
    }

    animate()

    // event listener
    incrementButton.addEventListener("click", () => {
        if (numSubdivs < 7) {
            numSubdivs += 1
        }

        sphere = []
        numSphere = initSphere(gl, numSubdivs)
    })

    decrementButton.addEventListener("click", () => {
        if (numSubdivs > 1) {
            numSubdivs -= 1
        }


        sphere = []
        numSphere = initSphere(gl, numSubdivs)
    })





}