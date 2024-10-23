
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
    gl.drawArrays(gl.TRIANGLE_FAN, 0, numPoints);
}


window.onload = async () => {

    let canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    let program = initShaders(gl, "vertex-shader", "fragment-shader");


    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)

    let ext = gl.getExtension('OES_element_index_uint'); // don't remove


    vertecies = [
        vec4(-4.0, -1.0, -1.0, 1.0),
        vec4(4.0, -1.0, -1.0, 1.0),
        vec4(4.0, -1.0, -21.0, 1.0),
        vec4(-4.0, -1.0, -21.0, 1.0)
    ];


    // init Buffers
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertecies), gl.STATIC_DRAW)
    let vPositionLoc = gl.getAttribLocation(program, "vPosition_a");
    gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionLoc);

    let texSize = 64
    let numRows = numCols = 8
    let checkersTexture = new Uint8Array(4 * texSize * texSize); // 4 for RGBA image, texSize is the resolution

    for (let i = 0; i < texSize; ++i) {
        for (let j = 0; j < texSize; ++j) {
            let patchx = Math.floor(i / (texSize / numRows));
            let patchy = Math.floor(j / (texSize / numCols));
            let c = (patchx % 2 !== patchy % 2 ? 255 : 0);
            let idx = 4 * (i * texSize + j);
            checkersTexture[idx] = checkersTexture[idx + 1] = checkersTexture[idx + 2] = c;
            checkersTexture[idx + 3] = 255;
        }
    }

    let textureBuffer = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, textureBuffer)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, checkersTexture);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    textureCoordinates = [vec2(-1.5, 0), vec2(2.5, 0), vec2(2.5, 10), vec2(-1.5, 10)]
    let texCoordsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoordinates), gl.STATIC_DRAW)
    let texCoordsLoc = gl.getAttribLocation(program, "texCoords_a");
    gl.vertexAttribPointer(texCoordsLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordsLoc);

    gl.useProgram(program);

    // camera / point-of-view (view-matrix)
    let eye = vec3(0.5, 0.5, 5.5)
    eye = vec3(0.0, 0.0, 0.0)
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


    function animate() {
        render(gl, vertecies.length);
        requestAnimationFrame(animate);
    }

    animate()

    let textureFilteringMenu = document.getElementById("textureFilteringModes")
    let wrappingMenu = document.getElementById("wrappingModes")

    textureFilteringMenu.addEventListener("change", () => {
        switch (textureFilteringMenu.value) {
            case "gl.NEAREST":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                break;

            case "gl.LINEAR":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                break;

            case "gl.NEAREST_MIPMAP_NEAREST":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
                // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                break;

            case "gl.LINEAR_MIPMAP_NEAREST":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
                // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                break;

            case "gl.NEAREST_MIPMAP_LINEAR":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
                // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                break;

            case "gl.LINEAR_MIPMAP_LINEAR":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                break;
        }
        gl.generateMipmap(gl.TEXTURE_2D);
    })

    wrappingMenu.addEventListener("change", () => {
        switch (wrappingMenu.value) {
            case "repeat":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                break
            case "clampToEdge":
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                break
        }
    })

}