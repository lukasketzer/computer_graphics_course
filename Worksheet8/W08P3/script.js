/**
 * @param {Element} canvas. The canvas element to create a context from.
 * @return {WebGLRenderingContext} The created context.
 */
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

function render(gl, numPoints) {
    gl.frontFace(gl.CCW);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, numPoints);
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

        gl.activeTexture(gl.TEXTURE0);
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

function initRedTexture(gl) {
    total_textures++;

    let textureBuffer = gl.createTexture();

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textureBuffer);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGB,
        1,
        1,
        0,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        new Uint8Array([255, 0, 0]),
    );

    // gl.generateMipmap(gl.TEXTURE_2D);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    ++ready_textures;
}

window.onload = async () => {
    let canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    let program = initShaders(gl, "vertex-shader", "fragment-shader");

    // gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST);
    let orbitingButton = document.getElementById("orbiting");

    let ext = gl.getExtension("OES_element_index_uint"); // don't remove

    let verteciesPlane = [
        vec4(-2, -1, -1, 1),
        vec4(2, -1, -1, 1),
        vec4(-2, -1, -5, 1),
        vec4(2, -1, -1, 1),
        vec4(2, -1, -5, 1),
        vec4(-2, -1, -5, 1),
    ];

    let verteciesQuad1 = [
        vec4(0.25, -0.5, -1.25, 1.0), //first quad
        vec4(0.75, -0.5, -1.25, 1.0),
        vec4(0.25, -0.5, -1.75, 1.0),
        vec4(0.75, -0.5, -1.25, 1.0),
        vec4(0.75, -0.5, -1.75, 1.0),
        vec4(0.25, -0.5, -1.75, 1.0),
    ];
    let verteciesQuad2 = [
        vec4(-1, 0, -2.5, 1.0), // First Triangle
        vec4(-1, -1, -2.5, 1.0),
        vec4(-1, 0, -3.0, 1.0),
        vec4(-1, -1, -2.5, 1.0), // Second Triangle
        vec4(-1, -1, -3.0, 1.0),
        vec4(-1, 0, -3.0, 1.0),
    ];

    // init Buffers
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        flatten(verteciesPlane.concat(verteciesQuad1).concat(verteciesQuad2)),
        gl.STATIC_DRAW,
    );

    let vPositionLoc = gl.getAttribLocation(program, "vPosition_a");
    gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionLoc);

    gl.useProgram(program);
    gl.program = program;

    // load marbel floor
    initFloor(gl);
    initRedTexture(gl);

    // textureCoordinates = [vec2(-1.5, 0), vec2(2.5, 0), vec2(2.5, 10), vec2(-1.5, 10)]
    textureCoordinates = [
        vec2(-0.5, 0),
        vec2(0.5, 0),
        vec2(-0.5, 0.5),
        vec2(0.5, 0),
        vec2(0.5, 0.5),
        vec2(-0.5, 0.5),
    ];

    let texCoordsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        flatten(
            textureCoordinates.concat(textureCoordinates).concat(
                textureCoordinates,
            ),
        ),
        gl.STATIC_DRAW,
    );

    let texCoordsLoc = gl.getAttribLocation(program, "texCoords_a");
    gl.vertexAttribPointer(texCoordsLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordsLoc);

    // one color texture

    // camera / point-of-view (view-matrix)
    let eye = vec3(0.0, 0.0, 0.0);
    let at = vec3(0, 0, -1.0);
    let up = vec3(0, 1, 0);
    let v = lookAt(eye, at, up);
    v = mat4();

    // fov settings (Projection Matrix)
    let near = 0.1;
    let far = 100.0;
    let p = perspective(90, canvas.width / canvas.height, near, far);

    // Transformation matrix
    let T = mat4();

    let PVT = mult(p, mult(v, T));
    gl.uniformMatrix4fv(
        gl.getUniformLocation(program, "pvt_matrix"),
        false,
        flatten(PVT),
    );

    let center = vec3(0, 2, -2);
    let orbiting = true;
    let alpha = 0.0;
    let radius = 2.0;
    let lightPos, M;

    function animate() {
        if (orbiting) {
            alpha += 0.01;
        }

        lightPos = vec3(
            radius * Math.sin(alpha) + center[0],
            center[1],
            radius * Math.cos(alpha) + center[2],
        );
        let d = -(lightPos[1] - (-1 - 0.01));
        let M_p = mat4(
            vec4(1, 0, 0, 0),
            vec4(0, 1, 0, 0),
            vec4(0, 0, 1, 0),
            vec4(0, 1 / d, 0, 0),
        );

        let T_pl = translate(lightPos[0], lightPos[1], lightPos[2]);
        let T_mpl = translate(-lightPos[0], -lightPos[1], -lightPos[2]);
        let M_s = mult(mult(T_pl, M_p), T_mpl);

        gl.frontFace(gl.CCW);
        gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let texMapLoc = gl.getUniformLocation(gl.program, "texMap");
        // ====== plane

        gl.uniformMatrix4fv(
            gl.getUniformLocation(program, "pvt_matrix"),
            false,
            flatten(PVT),
        );
        gl.uniform1i(texMapLoc, 0);
        gl.drawArrays(gl.TRIANGLES, 0, verteciesPlane.length);

        // === shadowns
        gl.depthFunc(gl.GREATER);
        gl.uniform1i(texMapLoc, 1);
        gl.uniform1i(gl.getUniformLocation(program, "shadow"), true);
        let temp = mult(p, mult(v, M_s));
        gl.uniformMatrix4fv(
            gl.getUniformLocation(program, "pvt_matrix"),
            false,
            flatten(temp),
        );
        gl.drawArrays(
            gl.TRIANGLES,
            verteciesPlane.length,
            verteciesQuad1.length + verteciesQuad2.length,
        );

        // === quad 1 and quad 2

        gl.depthFunc(gl.LESS);
        gl.uniform1i(gl.getUniformLocation(program, "shadow"), false);
        gl.uniformMatrix4fv(
            gl.getUniformLocation(program, "pvt_matrix"),
            false,
            flatten(PVT),
        );
        gl.drawArrays(
            gl.TRIANGLES,
            verteciesPlane.length,
            verteciesQuad1.length + verteciesQuad2.length,
        );

        requestAnimationFrame(animate);
    }

    animate();
    orbitingButton.addEventListener("click", () => {
        orbiting = !orbiting;
    });
};

