
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

function initAttributeVariable(gl, attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
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
function initFramebufferObject(gl, width, height) {
    let framebuffer = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    let renderbuffer = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    let shadowMap = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shadowMap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    framebuffer.texture = shadowMap;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowMap, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) { console.log('Framebuffer object is incomplete: ' + status.toString()); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    framebuffer.width = width; framebuffer.height = height;
    return framebuffer;
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

total_textures = 0;
ready_textures = 0;

function initFloor(gl) {
    total_textures++;
    let path = "./xamp23.png";
    let image = document.createElement("img");

    let textureBuffer = gl.createTexture();

    image.crossorigin = "anonymous";
    // image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X;
    image.onload = function (event) {
        let image = event.target;

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textureBuffer);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image,
        );

        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        ++ready_textures;
    };

    image.src = path;
}



window.onload = async () => {

    let canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    let program_floor = initShaders(gl, "vertex-shader-floor", "fragment-shader-floor");
    let program_cast_shadow = initShaders(gl, "vertex-shader-shadow-map", "fragment-shader-shadow-map");

    let orbitingButton = document.getElementById("orbiting")
    let bouncingButton = document.getElementById("bouncing")

    // gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)

    let ext = gl.getExtension('OES_element_index_uint'); // don't remove

    /////////////////////////////////////
    //          Teapot rendering
    /////////////////////////////////////

    gl.useProgram(program);
    const obj_filename = "./object/teapot.obj"
    const drawingInfo = await readOBJFile(obj_filename, 0.25, true)


    // init Buffers
    let vBuffer = gl.createBuffer();
    vBuffer.num = 4
    vBuffer.type = gl.FLOAT
    let vPositionLoc = gl.getAttribLocation(program, "vPosition_a");
    initAttributeVariable(gl, vPositionLoc, vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW)

    // normal vertecies
    let normalBuffer = gl.createBuffer()
    normalBuffer.num = 4
    normalBuffer.type = gl.FLOAT
    let VNormalLOC = gl.getAttribLocation(program, "vNormal_a")
    initAttributeVariable(gl, VNormalLOC, normalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW)

    // color buffer / k_d / diffuse color
    let colorBuffer = gl.createBuffer()
    colorBuffer.num = 4
    colorBuffer.type = gl.FLOAT
    let diffuseColorLOC = gl.getAttribLocation(program, "diffuseColor_a")
    initAttributeVariable(gl, diffuseColorLOC, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW)

    let indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW)


    // camera / point-of-view
    let eye = vec3(0.5, 0.5, 3.5)
    eye = vec3(0.0, 0.5, 0.0)
    // eye, at, up
    let v = lookAt(eye, vec3(0, 0, -2.0), vec3(0, 1, 0))


    // fov settings (Projection Matrix)
    let near = 0.1
    let far = 100.0
    let p = perspective(60, canvas.width / canvas.height, near, far)

    // Transformation matrix
    let T = translate(0, -1, -3)


    let PVT = mult(p, mult(v, T))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "pvt_matrix"), false, flatten(PVT))

    let vEyeLoc = gl.getUniformLocation(program, "vEye")
    gl.uniform4fv(vEyeLoc, flatten(vec4(eye, 1.0)));



    // light / color stuff


    let center = vec3(0, 2, -2);
    let radius = 2;
    let lightPos = vec3(
        radius * -1 + center[0],
        center[1],
        radius * -1 + center[2],
    );

    gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos))

    // object color

    let diffuseLight = vec4(1.0, 1.0, 1.0, 1.0); // L_d
    setDiffuseLight(program, diffuseLight)
    let ambientColor = vec4(0.1, 0.1, 0.1, 1.0)
    setAmbientLight(program, ambientColor)

    /////////////////////////////////////
    //          Plane rendering
    /////////////////////////////////////
    gl.useProgram(program_floor)

    let verteciesPlane = [
        vec4(-2, -1, -1, 1),
        vec4(2, -1, -1, 1),
        vec4(-2, -1, -5, 1),
        vec4(2, -1, -1, 1),
        vec4(2, -1, -5, 1),
        vec4(-2, -1, -5, 1),
    ];

    // vertex buffer
    let vBuffer_floor = gl.createBuffer();
    vBuffer_floor.num = 4
    vBuffer_floor.type = gl.FLOAT
    let vBuffer_floor_loc = gl.getAttribLocation(program_floor, "vPosition_a");
    initAttributeVariable(gl, vBuffer_floor_loc, vBuffer_floor)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        flatten(verteciesPlane),
        gl.STATIC_DRAW,
    );

    initFloor(gl) // load in texture

    textureCoordinates = [
        vec2(-0.5, 0),
        vec2(0.5, 0),
        vec2(-0.5, 0.5),
        vec2(0.5, 0),
        vec2(0.5, 0.5),
        vec2(-0.5, 0.5),
    ];
    let texCoordsBuffer = gl.createBuffer();
    texCoordsBuffer.num = 2
    texCoordsBuffer.type = gl.FLOAT
    let texCoordsLoc = gl.getAttribLocation(program_floor, "texCoords_a");
    initAttributeVariable(gl, texCoordsLoc, texCoordsBuffer)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        flatten(
            textureCoordinates
        ),
        gl.STATIC_DRAW,
    );

    // camera / point-of-view (view-matrix)
    // eye, at, up
    PVT_floor = mult(p, mult(v, mat4()));
    gl.uniformMatrix4fv(
        gl.getUniformLocation(program_floor, "pvt_matrix"),
        false,
        flatten(PVT),
    );

    ////////////////////////////
    // Shadow mapping stuff
    ////////////////////////////

    let fbo = initFramebufferObject(gl, 2048 * 2, 2048 * 2)


    let orbiting = true // boolean that sets orbiting
    let bouncing = false // boolean that sets orbiting
    let alpha = 0.0
    let delta_y = 0.0
    function animate() {

        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.frontFace(gl.CCW)
        gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        if (orbiting) {
            alpha += 0.01;
        }
        if (bouncing) {
            delta_y += 0.1;
        }

        lightPos = vec3(
            radius * Math.sin(alpha) + center[0],
            center[1],
            radius * Math.cos(alpha) + center[2],
        )
        gl.useProgram(program)
        gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(vec4(lightPos, 1.0)))


        if (ready_textures >= total_textures) {

            //////////////////////////
            //      Shadow Mapping
            //////////////////////////
            gl.useProgram(program_cast_shadow)

            let vPositionShadowLoc = gl.getAttribLocation(program_cast_shadow, "vPosition_a");
            initAttributeVariable(gl, vPositionShadowLoc, vBuffer)

            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            gl.viewport(0, 0, fbo.width, fbo.height)

            let v_shadow = lookAt(lightPos, vec3(0, 0, -2.0), vec3(0, 1, 0))
            let p_shadow = perspective(70, 1, 0.1, 100)
            let T_shadow = translate(0, 0.75 * Math.cos(delta_y) - 0.25, -3)
            // T_shadow = mat4()
            let PVT_shadow = mult(p_shadow, mult(v_shadow, T_shadow))
            gl.uniformMatrix4fv(
                gl.getUniformLocation(program_cast_shadow, "pvt_matrix"),
                false,
                flatten(PVT_shadow),
            );
            gl.drawElements(gl.TRIANGLES, drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            gl.viewport(0, 0, 512, 512);



            //////////////////////////
            //      Plane
            //////////////////////////
            gl.depthFunc(gl.LESS);
            gl.useProgram(program_floor)

            initAttributeVariable(gl, vBuffer_floor_loc, vBuffer_floor)
            initAttributeVariable(gl, texCoordsLoc, texCoordsBuffer)

            gl.uniformMatrix4fv(
                gl.getUniformLocation(program_floor, "pvt_matrix"),
                false,
                flatten(PVT_floor),
            );
            gl.uniformMatrix4fv(
                gl.getUniformLocation(program_floor, "pvt_matrix_light"),
                false,
                flatten(mult(p_shadow, mult(v_shadow, mat4()))),
            );

            let texMapLoc = gl.getUniformLocation(program_floor, "texMap");
            gl.uniform1i(texMapLoc, 1);
            let shadowMapLoc = gl.getUniformLocation(program_floor, "shadowMap_u")
            gl.uniform1i(shadowMapLoc, 0);



            gl.drawArrays(gl.TRIANGLES, 0, verteciesPlane.length);

            //////////////////////////
            //      Render Teapot
            //////////////////////////

            gl.depthFunc(gl.LESS)
            gl.useProgram(program)

            initAttributeVariable(gl, vPositionLoc, vBuffer)
            initAttributeVariable(gl, VNormalLOC, normalBuffer)
            initAttributeVariable(gl, diffuseColorLOC, colorBuffer)


            T = translate(0, 0.75 * Math.cos(delta_y) - 0.25, -3)
            // gl.uniform4fv(vEyeLoc, vec4(eye, 1.0))
            PVT = mult(p, mult(v, T))
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "pvt_matrix"), false, flatten(PVT))

            gl.drawElements(gl.TRIANGLES, drawingInfo.indices.length, gl.UNSIGNED_INT, 0);




        }
        requestAnimationFrame(animate);
    }

    animate()

    orbitingButton.addEventListener("click", () => {
        // alpha = 0.0
        orbiting = !orbiting
    })
    bouncingButton.addEventListener("click", () => {
        // delta_y = 0.0
        bouncing = !bouncing
    })







}