
/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}


function render(gl, numPoints) {
    gl.frontFace(gl.CCW)
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, numPoints, gl.UNSIGNED_INT, 0);
}


function setShininess(program, shininess) {
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess)
}

function setDiffuseColor(program) {
    let diffuseColorLOC = gl.getAttribLocation(program, "diffuseColor_a")
    gl.vertexAttribPointer(diffuseColorLOC, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(diffuseColorLOC);
}
function setDiffuseLight(program, diffuseLight) {
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseLight"), flatten(diffuseLight))
}
function setAmbientLight(program, ambientLight) {
    gl.uniform4fv(gl.getUniformLocation(program, "ambientColor"), flatten(ambientLight))
}
function setSpecularColor(program, specularColor) {
    gl.uniform4fv(gl.getUniformLocation(program, "specularColor"), flatten(specularColor))
}
function setSpecularLight(program, specularLight) {
    gl.uniform4fv(gl.getUniformLocation(program, "specularLight"), flatten(specularLight))
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


window.onload = async () => {

    let canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    let program = initShaders(gl, "vertex-shader", "fragment-shader");

    let incrementButton = document.getElementById("increment")
    let decrementButton = document.getElementById("decrement")
    let orbitingButton = document.getElementById("orbiting")

    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)

    let ext = gl.getExtension('OES_element_index_uint'); // don't remove

    const obj_filename = "./object/suzanne.obj"
    // const obj_filename = "./object/bunny.obj"
    const drawingInfo = await readOBJFile(obj_filename, 1.0, true)


    // init Buffers
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW)
    let vPositionLoc = gl.getAttribLocation(program, "vPosition_a");
    gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionLoc);

    // normal vertecies
    let normalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW)
    let VNormalLOC = gl.getAttribLocation(program, "vNormal_a")
    gl.vertexAttribPointer(VNormalLOC, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VNormalLOC);

    // color buffer / k_d / diffuse color
    let colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW)
    let diffuseColorLOC = gl.getAttribLocation(program, "diffuseColor_a")
    gl.vertexAttribPointer(diffuseColorLOC, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(diffuseColorLOC);



    let indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW)


    gl.useProgram(program);


    // camera / point-of-view
    let eye = vec3(0.5, 0.5, 5.5)
    // let eye = vec3(0.0, 0.0, 5.0)
    let at = vec3(0, 0, 0)
    let up = vec3(0, 1, 0)
    let v = lookAt(eye, at, up)

    let vEyeLoc = gl.getUniformLocation(program, "vEye")
    gl.uniform4fv(vEyeLoc, flatten(vec4(eye, 1.0)));


    // fov settings (Projection Matrix)
    let near = 0.1
    let far = 50.0
    let p = perspective(45, canvas.width / canvas.height, near, far)

    // Transformation matrix
    let T = mat4()

    let PVT = mult(p, mult(v, T))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "pvt_matrix"), false, flatten(PVT))

    // phong filter
    let emittedRadianceSlider = document.getElementById("emittedRadianceSlider");
    let ambientRadianceSlider = document.getElementById("ambientSlider");
    let specularCoefficientSlider = document.getElementById("specularSlider");
    let shininessSlider = document.getElementById("shineSlider");

    // light / color stuff
    let lightPos = vec4(0.0, 0.0, -1.0, 1.0)
    gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos))


    let shininess = parseFloat(shininessSlider.value)
    setShininess(program, shininess)

    // object color

    let diffuseLight = vec4(1.0, 1.0, 1.0, 1.0); // L_d
    setDiffuseLight(program, diffuseLight)

    let ambientLight = vec4(1.0, 1.0, 1.0, 1.0);
    setAmbientLight(program, ambientLight)


    // let specularProduct = vec4(1.0, 1.0, 1.0, 1.0); // k_s (white light)
    let specularColor = vec4(0.4, 0.4, 0.4, 1.0); // k_s (white light)
    setSpecularColor(program, specularColor)

    let specularLight = vec4(1.0, 1.0, 1.0, 1.0); // L_i (white light intesity)
    setSpecularLight(program, specularLight)




    let orbiting = true // boolean that sets orbiting
    let alpha = 0.0
    let radius = 6.8

    function animate() {
        if (!orbiting) {
            alpha += 0.01;
        }

        eye = vec3(radius * Math.sin(alpha), 0.0, radius * Math.cos(alpha))
        v = lookAt(eye, vec3(0.0, 0.0, 0.0), vec3(0, 1, 0))

        gl.uniform4fv(vEyeLoc, vec4(eye, 1.0))
        PVT = mult(p, mult(v, T))
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "pvt_matrix"), false, flatten(PVT))



        render(gl, drawingInfo.indices.length);
        requestAnimationFrame(animate);
    }

    animate()

    orbitingButton.addEventListener("click", () => {
        alpha = 0.0
        orbiting = !orbiting
    })


    shininessSlider.addEventListener("input", () => {
        shininess = shininessSlider.value
        setShininess(program, shininess)
    })


    emittedRadianceSlider.addEventListener("input", () => {
        specularLight = floatToVec4(emittedRadianceSlider.value)
        setSpecularLight(program, specularLight)
    })

    ambientRadianceSlider.addEventListener("input", () => {
        ambientLight = floatToVec4(ambientRadianceSlider.value)
        // probaly wrong

        setDiffuseLight(program, ambientLight)
        setAmbientLight(program, ambientLight)
    })

    specularCoefficientSlider.addEventListener("input", () => {
        specularColor = floatToColor(specularCoefficientSlider.value)
        setSpecularColor(program, specularColor)
    })






}