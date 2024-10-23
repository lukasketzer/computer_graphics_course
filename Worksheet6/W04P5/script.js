
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
    // index += 3;
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

function setShininess(program, shininess) {
    gl.uniform1f(gl.getUniformLocation(program, "shininess_a"), shininess)
}
function setDiffuseColor(program, diffuseColor) {
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseColor_a"), flatten(diffuseColor))
}
function setDiffuseLight(program, diffuseLight) {
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseLight_a"), flatten(diffuseLight))
}
function setAmbientLight(program, ambientLight) {
    gl.uniform4fv(gl.getUniformLocation(program, "ambientColor_a"), flatten(ambientLight))
}
function setSpecularColor(program, specularColor) {
    gl.uniform4fv(gl.getUniformLocation(program, "specularColor_a"), flatten(specularColor))
}
function setSpecularLight(program, specularLight) {
    gl.uniform4fv(gl.getUniformLocation(program, "specularLight_a"), flatten(specularLight))
}


function floatToColor(value) {
    if (typeof (value) == "string") {
        value = parseFloat(value)
    }

    value = Math.trunc(value * 1000000)
    let r = Math.floor((value / 10000) % 100)
    let g = Math.floor((value / 100) % 100)
    let b = Math.floor(value % 100)

    return vec4(r / 99, g / 99, b / 99, 1.0)
}
function floatToVec4(value) {
    if (typeof (value) == "string") {
        value = parseFloat(value)
    }

    return vec4(value, value, value, 1.0)
}


window.onload = () => {

    let canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    let program = initShaders(gl, "vertex-shader", "fragment-shader");

    let incrementButton = document.getElementById("increment")
    let decrementButton = document.getElementById("decrement")
    let orbitingButton = document.getElementById("orbiting")
    gl.enable(gl.CULL_FACE)

    let ext = gl.getExtension('OES_element_index_uint'); // don't remove

    // init Buffers
    let vBuffer = gl.createBuffer();
    gl.vBuffer = vBuffer
    let numSubdivs = 7
    let numSphere = initSphere(gl, numSubdivs)

    let vPositionLoc = gl.getAttribLocation(program, "vPosition_a");
    gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionLoc);


    // Load earth.jpg texture
    let textureBuffer = gl.createTexture()

    let image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, textureBuffer);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image
        );

        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    };
    image.src = './earth.jpg';

    gl.useProgram(program);


    // camera / point-of-view (view-matrix)
    let eye = vec3(0.5, 0.5, 5.5)
    let at = vec3(0, 0, -1.0)
    let up = vec3(0, 1, 0)
    let v = lookAt(eye, at, up)

    let VLoc = gl.getUniformLocation(program, "v_matrix")
    gl.uniformMatrix4fv(VLoc, false, flatten(v))

    // fov settings (Projection Matrix)
    let near = 0.1
    let far = 100.0
    let p = perspective(90, canvas.width / canvas.height, near, far)
    let PLoc = gl.getUniformLocation(program, "p_matrix")
    gl.uniformMatrix4fv(PLoc, false, flatten(p))

    // Transformation matrix
    let T = mat4()
    let TLoc = gl.getUniformLocation(program, "t_matrix")
    gl.uniformMatrix4fv(TLoc, false, flatten(T))


    let orbiting = true // boolean that sets orbiting
    let alpha = 0.0
    let radius = 6.8

    function animate() {
        if (!orbiting) {
            alpha += 0.01;
        }

        eye = vec3(radius * Math.sin(alpha), 0.0, radius * Math.cos(alpha))
        v = lookAt(eye, vec3(0.0, 0.0, 0.0), vec3(0, 1, 0))
        gl.uniformMatrix4fv(VLoc, false, flatten(v))

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

    orbitingButton.addEventListener("click", () => {
        alpha = 0.0
        orbiting = !orbiting
        numSphere = initSphere(gl, numSubdivs)
    })



}