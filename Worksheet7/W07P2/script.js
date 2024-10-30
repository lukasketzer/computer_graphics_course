
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
    return sphere
}

let g_tex_ready = 0;
function initTexture(gl) {
    let cubemap = ['textures/cm_left.png', // POSITIVE_X
        'textures/cm_right.png', // NEGATIVE_X
        'textures/cm_top.png', // POSITIVE_Y
        'textures/cm_bottom.png', // NEGATIVE_Y
        'textures/cm_back.png', // POSITIVE_Z
        'textures/cm_front.png']; // NEGATIVE_Z
    gl.activeTexture(gl.TEXTURE0);
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    for (let i = 0; i < 6; ++i) {
        let image = document.createElement('img');
        image.crossorigin = 'anonymous';
        image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
        image.onload = function (event) {
            let image = event.target;
            gl.activeTexture(gl.TEXTURE0);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            ++g_tex_ready;
        };
        image.src = cubemap[i];
    }
    gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);
}


window.onload = () => {

    let canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.program = program

    let orbitingButton = document.getElementById("orbiting")
    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)

    let ext = gl.getExtension('OES_element_index_uint'); // don't remove

    gl.useProgram(program);
    initTexture(gl)

    let numSubdivs = 7
    let sphere = initSphere(gl, numSubdivs)
    let backgroud = [vec4(-1, -1, 0.999999, 1), vec4(1, -1, 0.999999, 1), vec4(-1, 1, 0.9999999, 1), vec4(1, -1, 0.9999999, 1), vec4(1, 1, 0.999999999, 1), vec4(-1, 1, 0.999999, 1)]

    // init Buffers
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sizeof["vec4"] * (sphere.length + backgroud.length), gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(sphere));
    gl.bufferSubData(gl.ARRAY_BUFFER, sphere.length * sizeof["vec4"], flatten(backgroud));


    let vPositionLoc = gl.getAttribLocation(program, "vPosition_a");
    gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionLoc);

    // lighting
    let lightPos = vec4(0.0, 0.0, -1.0, 1.0)
    gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos))

    // camera / point-of-view (view-matrix)
    let eye = vec3(0.5, 0.5, 0.5)
    let at = vec3(0, 0, 1.0)
    let up = vec3(0, 1, 0)
    let v = lookAt(eye, at, up)

    // fov settings (Projection Matrix)
    let near = 0.1
    let far = 100.0
    let p = perspective(90, canvas.width / canvas.height, near, far)

    // Transformation matrix
    let T = mat4()



    let orbiting = true // boolean that sets orbiting
    let alpha = 0.0
    let radius = 2.8

    function animate() {
        if (!orbiting) {
            alpha += 0.01;
        }
        gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        if (g_tex_ready >= 6) {
            eye = vec3(radius * Math.sin(alpha), 0.5, radius * Math.cos(alpha))
            gl.uniform4fv(gl.getUniformLocation(program, "vEye"), flatten(vec4(eye, 1.0)));
            v = lookAt(eye, vec3(0.0, 0.0, 0.0), vec3(0, 1, 0))
            PVT = mult(p, mult(v, T))
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "pvt_matrix"), false, flatten(PVT))
            

            gl.drawArrays(gl.TRIANGLES, 0, sphere.length);


            PVT = mult(mat4(), mult(mat4(), mat4()))
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "pvt_matrix"), false, flatten(PVT))

            gl.drawArrays(gl.TRIANGLES, sphere.length, backgroud.length);

        }
        requestAnimationFrame(animate);
    }

    animate()
    orbitingButton.addEventListener("click", () => {
        orbiting = !orbiting
        numSphere = initSphere(gl, numSubdivs)
    })



}