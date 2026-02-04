import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from '../libs/utils.js';
import { length, flatten, inverse, mult, normalMatrix, perspective, lookAt, vec4, vec3, vec2, subtract, add, scale, rotate, normalize } from '../libs/MV.js';

import * as dat from '../libs/dat.gui.module.js';

import * as CUBE from '../libs/objects/cube.js';
import * as SPHERE from '../libs/objects/sphere.js';
import * as BUNNY from '../libs/objects/bunny.js';
import * as TORUS from '../libs/objects/torus.js';
import * as CYLINDER from '../libs/objects/cylinder.js';
import * as STACK from '../libs/stack.js';

function setup(shaders) {
    const canvas = document.getElementById('gl-canvas');
    const gl = setupWebGL(canvas);

    // Initialize objects
    CUBE.init(gl);
    SPHERE.init(gl);
    BUNNY.init(gl);
    TORUS.init(gl);
    CYLINDER.init(gl);

    // Build shader programs
    // Two programs: phong and gouraud
    // Both programs share the same uniforms and attributes
    // so we can switch between them easily
    const programs = {
        phong: buildProgramFromSources(gl, shaders['shader2.vert'], shaders['shader2.frag']),
        gouraud: buildProgramFromSources(gl, shaders['shader1.vert'], shaders['shader1.frag'])
    };
    let program = programs.gouraud;

    // Light types and parameters
    const LIGHT_TYPES = { point: 0, directional: 1, spot: 2 };
    const LIGHT_COORDINATE_SPACE = { world: 0, camera: 1 };
    const MAX_LIGHTS = 8;

    // Scene parameters 
    let camera = {
        eye: vec3(0, 0, 15),
        at: vec3(0, 0, 0),
        up: vec3(0, 1, 0),
        fovy: 45,
        aspect: 1,
        near: 0.1,
        far: 20
    }

    // Default camera for reset
    let defaultCamera = { 
        eye: vec3(0, 0, 15),
        at: vec3(0, 0, 0),
        up: vec3(0, 1, 0),
        fovy: 45,
        aspect: 1,
        near: 0.1,
        far: 20
    }

    // Rendering options
    let options = {
        backface_culling: true,
        depth_test: true
    }
    
    // Initial light sources
    function createLight(name = "Light") {
        return {
            name,
            enabled: true,
            type: LIGHT_TYPES.spot,
            position: vec4(0, 5, 5, 1),
            ambient:  vec3(51,  51,  51), 
            diffuse:  vec3(178, 178, 178),  
            specular: vec3(255, 255, 255), 
            axis: vec3(0, 0, -1),
            aperture: 20,
            cutoff: 10,
            coordinate_space: LIGHT_COORDINATE_SPACE.camera
        };
    }

    // Reset camera button
    const cameraActions = {
        reset: function () {
            camera.eye[0] = defaultCamera.eye[0];
            camera.eye[1] = defaultCamera.eye[1];
            camera.eye[2] = defaultCamera.eye[2];

            camera.at[0] = defaultCamera.at[0];
            camera.at[1] = defaultCamera.at[1];
            camera.at[2] = defaultCamera.at[2];

            camera.up[0] = defaultCamera.up[0];
            camera.up[1] = defaultCamera.up[1];
            camera.up[2] = defaultCamera.up[2];

            camera.fovy = defaultCamera.fovy;
            camera.near = defaultCamera.near;
            camera.far = defaultCamera.far;
        }
    };

    // Variables for view and projection matrices
    let mView, mProjection;

    // Mouse interaction variables
    let down = false;
    let lastX, lastY;

    // Initial light sources
    let lights = [
        createLight("Light1")
    ];

    // Material properties for base
    let base = {
        scale: vec3(10, 0.5, 10),
        ambient:  vec3(255, 204, 128),
        diffuse:  vec3(178, 255, 178),
        specular: vec3(31,  26,  28), 
        shininess: 10
    };

    // Material properties for cube
    let cube = {
        translation: vec3(-2.5, 1.2, -2.5),
        scale: vec3(2, 2, 2),
        ambient:  vec3(255, 204, 255), 
        diffuse:  vec3(255, 128, 255), 
        specular: vec3(51,  204, 255), 
        shininess: 10
    };

    // Material properties for bunny
    let bunny = {
        translation: vec3(2.5, 1.2, 2.5),
        scale: vec3(2, 2, 2),
        ambient:  vec3(255, 255, 255), // 1,1,1
        diffuse:  vec3(255, 255, 255),
        specular: vec3(255, 255, 255),
        shininess: 10
    };

    // Material properties for torus
    let torus = {
        translation: vec3(-2.5, 0.6, 2.5),
        scale: vec3(2, 2, 2),
        ambient:  vec3(76,  255, 255),  
        diffuse:  vec3(255, 255, 255),
        specular: vec3(255, 255, 255),
        shininess: 10
    };

    // Material properties for cylinder
    let cylinder = {
        translation: vec3(2.5, 1.5, -2.5),
        scale: vec3(2, 3, 2),
        ambient:  vec3(76,  255, 255),  
        diffuse:  vec3(128, 76,  51),  
        specular: vec3(255, 255, 255),
        shininess: 10
    };

    // Shading mode
    let shading = { mode: 'gouraud' }

    // GUI setup
    const gui = new dat.GUI();

    // Options GUI
    const optionsGui = gui.addFolder("options");

    // Backface culling and depth test options
    optionsGui.add(options, "backface_culling").onChange(function (v) {
        if (v) {
            gl.enable(gl.CULL_FACE);
        } else {
            gl.disable(gl.CULL_FACE);
        }
    });

    // Depth test option
    optionsGui.add(options, "depth_test").onChange(function (v) {
        if (v) {
            gl.enable(gl.DEPTH_TEST);
        } else {
            gl.disable(gl.DEPTH_TEST);
        }
    });

    // Shading mode option
    optionsGui.add(shading, "mode", ["gouraud", "phong"]).onChange(mode => {
        program = programs[mode];
    })
    
    // Camera GUI
    const cameraGui = gui.addFolder("camera");

    // fovy, near, far
    cameraGui.add(camera, "fovy").min(1).max(179).step(1).listen();
    cameraGui.add(camera, "near").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
        camera.near = Math.min(camera.far - 0.5, v);
    });
    cameraGui.add(camera, "far").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
        camera.far = Math.max(camera.near + 0.5, v);
    });

    // Eye, at, up
    const eye = cameraGui.addFolder("eye");
    eye.add(camera.eye, 0).min(-50).max(50).step(0.05).listen();
    eye.add(camera.eye, 1).min(-50).max(50).step(0.05).listen();
    eye.add(camera.eye, 2).min(-50).max(50).step(0.05).listen();

    const at = cameraGui.addFolder("at");
    at.add(camera.at, 0).min(-50).max(50).step(0.05).listen();
    at.add(camera.at, 1).min(-50).max(50).step(0.05).listen();
    at.add(camera.at, 2).min(-50).max(50).step(0.05).listen();

    const up = cameraGui.addFolder("up");
    up.add(camera.up, 0).min(-1).max(1).step(0.01).listen();
    up.add(camera.up, 1).min(-1).max(1).step(0.01).listen();
    up.add(camera.up, 2).min(-1).max(1).step(0.01).listen();

    // Reset camera button
    cameraGui.add(cameraActions, "reset").name("Reset camera");

    // Lights GUI
    const lightsGui = gui.addFolder("lights");
    function buildLightsGUI() {
        // Removing old folders
        if (lightsGui.__folders) {
            for (let f in lightsGui.__folders) {
                lightsGui.removeFolder(lightsGui.__folders[f]);
            }
        }

        // Building folders for each light
        lights.forEach((l, index) => {
        let lightGui = lightsGui.addFolder(l.name);

        // Toggles light on/off
        lightGui.add(l, "enabled")
            .name("enabled")
            .onChange(() => {
                uploadLightInfo();
            })

        // Changes the type of light
        lightGui.add(l, "type", {
            point: LIGHT_TYPES.point,
            directional: LIGHT_TYPES.directional,
            spot: LIGHT_TYPES.spot
        })
            .name("type")
            .onChange(val => {
                l.position[3] = (val == LIGHT_TYPES.directional) ? 0.0 : 1.0;
                // Show/hide spotlight parameters
                lightGui.__folders["axis"].domElement.style.display = (val == LIGHT_TYPES.spot) ? "block" : "none";;
                lightGui.__controllers.forEach(controller => {
                    if (controller.property == "aperture" || controller.property == "cutoff") {
                        // if not spotlight, block the controller
                        controller.domElement.style.display = (val == LIGHT_TYPES.spot) ? "block" : "none";
                    }
                });
                uploadLightInfo();
        });

        // Coordinate space of the light source
        lightGui.add(l, "coordinate_space", {
            world: LIGHT_COORDINATE_SPACE.world,
            camera: LIGHT_COORDINATE_SPACE.camera
        })
            .name("coordinate space")
            .onChange(() => {
                uploadLightInfo();
            });
        
        // Position folder
        let pos = lightGui.addFolder("x,y,z");
        // x, y, z sliders
        ["x", "y", "z"].forEach((label, idx) => {
            pos.add(l.position, idx)
                .name(label)
                .min(-10)
                .max(10)
                .step(0.1)
                .onChange(() => {
                    uploadLightInfo();
                });
        });

        // Light intensities
        let params = lightGui.addFolder("intensities");

        // Ambient, diffuse, specular colors
        params.addColor({ ambient: l.ambient }, "ambient").name("ambient").onChange(c => {
            l.ambient = c;
            uploadLightInfo();
        });
        params.addColor({ diffuse: l.diffuse }, "diffuse").name("diffuse").onChange(c => {
            l.diffuse = c;
            uploadLightInfo();
        });
        params.addColor({ specular: l.specular }, "specular").name("specular").onChange(c => {
            l.specular = c;
            uploadLightInfo();
        });

        // Spotlight parameters
        let axis = lightGui.addFolder("axis");
        axis.add(l.axis, 0).name("x");
        axis.add(l.axis, 1).name("y");
        axis.add(l.axis, 2).name("z");
        lightGui.add(l, "aperture")
            .min(0).max(90)
            .onChange(uploadLightInfo);

        lightGui.add(l, "cutoff")
            .min(0).max(128)
            .onChange(uploadLightInfo);
        });
    }

    // Add light button
    lightsGui.add(
    {
        addLight: function () {
            if (lights.length >= MAX_LIGHTS) {
                alert("Reached MAX_LIGHTS");
                return;
            }
            const id = lights.length + 1;
            lights.push(createLight("Light" + id));
            buildLightsGUI();
            uploadLightInfo();
        }
    }, "addLight").name("add Light");

    buildLightsGUI();

    // Material GUI for bunny
    const materialGui = gui.addFolder("material");

    // Ambient, diffuse, specular colors and shininess
    materialGui.addColor({ ambient: bunny.ambient }, "ambient").name("Ka").onChange(c => {
            bunny.ambient = c;
    });
    materialGui.addColor({ diffuse: bunny.diffuse }, "diffuse").name("Kd").onChange(c => {
            bunny.diffuse = c;
    });
    materialGui.addColor({ specular: bunny.specular }, "specular").name("Ks").onChange(c => {
            bunny.specular = c;
    });
    materialGui.add(bunny, "shininess").min(1).max(128).step(1).name("shininess");

    // WebGL setup
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    resizeCanvasToFullWindow();
    window.addEventListener('resize', resizeCanvasToFullWindow);

    // Mouse wheel input
    window.addEventListener('wheel', function (event) {
        if (!event.altKey && !event.metaKey && !event.ctrlKey) { // Change fovy
            const factor = 1 - event.deltaY / 1000;
            camera.fovy = Math.max(1, Math.min(100, camera.fovy * factor));
        }
        else if (event.altKey || event.ctrlKey) {
            
            // move camera forward and backwards (shift)
            const offset = event.deltaY / 1000;
            const dir = normalize(subtract(camera.at, camera.eye));
            const ce = add(camera.eye, scale(offset, dir));
            const ca = add(camera.at, scale(offset, dir));

            // Can't replace the objects that are being listened by dat.gui, only their properties.
            camera.eye[0] = ce[0];
            camera.eye[1] = ce[1];
            camera.eye[2] = ce[2];

            if (event.ctrlKey) {
                camera.at[0] = ca[0];
                camera.at[1] = ca[1];
                camera.at[2] = ca[2];
            }
        }
    });

    // Keyboard input
    let keys = {};

    // Track key states
    window.addEventListener('keydown', function (event) {
        keys[event.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', function (event) {
        keys[event.key.toLowerCase()] = false;
    });

    // Transforms a matrix from world space to camera space
    function inCameraSpace(m) {
        const mInvView = inverse(mView);
        return mult(mInvView, mult(m, mView));
    }

    // Mouse input
    canvas.addEventListener('mousemove', function (event) {
        if (down) {
            const dx = event.offsetX - lastX;
            const dy = event.offsetY - lastY;

            if (dx != 0 || dy != 0) {

                const d = vec2(dx, dy);
                const axis = vec3(-dy, -dx, 0);

                const rotation = rotate(0.5 * length(d), axis);

                let eyeAt = subtract(camera.eye, camera.at);
                eyeAt = vec4(eyeAt[0], eyeAt[1], eyeAt[2], 0);
                let newUp = vec4(camera.up[0], camera.up[1], camera.up[2], 0);

                eyeAt = mult(inCameraSpace(rotation), eyeAt);
                newUp = mult(inCameraSpace(rotation), newUp);

                camera.eye[0] = camera.at[0] + eyeAt[0];
                camera.eye[1] = camera.at[1] + eyeAt[1];
                camera.eye[2] = camera.at[2] + eyeAt[2];

                camera.up[0] = newUp[0];
                camera.up[1] = newUp[1];
                camera.up[2] = newUp[2];

                lastX = event.offsetX;
                lastY = event.offsetY;
            }
        }
    });

    // Mouse down and up events
    canvas.addEventListener('mousedown', function (event) {
        down = true;
        lastX = event.offsetX;
        lastY = event.offsetY;
        gl.clearColor(0.2, 0.0, 0.0, 1.0);
    });
    canvas.addEventListener('mouseup', function (event) {
        down = false;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
    });

    window.requestAnimationFrame(render);

    // Resize canvas to full window
    function resizeCanvasToFullWindow() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        camera.aspect = canvas.width / canvas.height;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    // Update model-view and normal matrices
    function updateModelViewMatrix() {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_model_view"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_normals"), false, flatten(normalMatrix(STACK.modelView())));
    }

    // Upload lights information to the GPU
    function uploadLightInfo() {
        let u_n_lights = gl.getUniformLocation(program, "u_n_lights");
        gl.uniform1i(u_n_lights, lights.length);
        for (let i = 0; i < lights.length; i++) {
            let light = lights[i];
            let posC = light.coordinate_space == LIGHT_COORDINATE_SPACE.world ?
                mult(mView, light.position) :
                light.position;
            gl.uniform4fv(gl.getUniformLocation(program, `u_lights[${i}].position`), flatten(posC));
            gl.uniform3fv(gl.getUniformLocation(program, `u_lights[${i}].ambient`), flatten(light.ambient));
            gl.uniform3fv(gl.getUniformLocation(program, `u_lights[${i}].diffuse`), flatten(light.diffuse));
            gl.uniform3fv(gl.getUniformLocation(program, `u_lights[${i}].specular`), flatten(light.specular));
            gl.uniform1i(gl.getUniformLocation(program, `u_lights[${i}].type`), light.type);
            gl.uniform1i(gl.getUniformLocation(program, `u_lights[${i}].enabled`), light.enabled ? 1 : 0);
            if (light.type == LIGHT_TYPES.spot) {
                let axisC;
                if (light.coordinate_space == LIGHT_COORDINATE_SPACE.world) {
                    axisC = mult(mView, vec4(light.axis[0], light.axis[1], light.axis[2], 0));
                    axisC = vec3(axisC[0], axisC[1], axisC[2]);
                } else {
                    axisC = light.axis;
                }
                gl.uniform3fv(gl.getUniformLocation(program, `u_lights[${i}].axis`), flatten(axisC));
                gl.uniform1f(gl.getUniformLocation(program, `u_lights[${i}].aperture`), light.aperture);
                gl.uniform1f(gl.getUniformLocation(program, `u_lights[${i}].cutoff`), light.cutoff);
            }
        }

    }

    // Upload material properties to the shaders
    function uploadLight(mat) {
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ka"), flatten(mat.ambient));
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Kd"), flatten(mat.diffuse));
        gl.uniform3fv(gl.getUniformLocation(program, "u_material.Ks"), flatten(mat.specular));
        gl.uniform1f(gl.getUniformLocation(program, "u_material.shininess"), mat.shininess);
    }

    // Draw functions for each object
    function drawBase() {
        STACK.pushMatrix();
        STACK.multScale(base.scale);
        updateModelViewMatrix();
        uploadLight(base);
        CUBE.draw(gl, program, gl.TRIANGLES);
        STACK.popMatrix();
    }

    // Draw cube
    function drawCube() {
        STACK.pushMatrix();
        STACK.multTranslation(cube.translation);
        STACK.multScale(cube.scale);
        updateModelViewMatrix();
        uploadLight(cube);
        CUBE.draw(gl, program, gl.TRIANGLES);
        STACK.popMatrix();
    }

    // Draw bunny
    function drawBunny() {
        STACK.pushMatrix();
        STACK.multTranslation(bunny.translation);
        STACK.multScale(bunny.scale);
        updateModelViewMatrix();
        uploadLight(bunny);
        BUNNY.draw(gl, program, gl.TRIANGLES);
        STACK.popMatrix();
    }

    // Draw torus
    function drawTorus() {
        STACK.pushMatrix();
        STACK.multTranslation(torus.translation);
        STACK.multScale(torus.scale);
        updateModelViewMatrix();
        uploadLight(torus);
        TORUS.draw(gl, program, gl.TRIANGLES);
        STACK.popMatrix();
    }

    // Draw cylinder
    function drawCylinder() {
        STACK.pushMatrix();
        STACK.multTranslation(cylinder.translation);
        STACK.multScale(cylinder.scale);
        updateModelViewMatrix();
        uploadLight(cylinder);
        CYLINDER.draw(gl, program, gl.TRIANGLES);
        STACK.popMatrix();
    }

    // Draw light sources
    function drawLightSources() {
        for (let i = 0; i < lights.length; i++) {
            let light = lights[i];
            if (!light.enabled) continue;
            if (light.type == LIGHT_TYPES.directional) continue;
            if (light.coordinate_space == LIGHT_COORDINATE_SPACE.camera) continue;
            STACK.pushMatrix();
            STACK.multTranslation(vec3(light.position[0], light.position[1], light.position[2]));
            STACK.multScale(vec3(0.2, 0.2, 0.2));
            updateModelViewMatrix();
            SPHERE.draw(gl, program, gl.TRIANGLES);
            STACK.popMatrix();
        }
    }
    
    // Update camera position based on keyboard input
    function updateCameraMovement(deltatime) {
        const speed = 10.0;
        // Camera forward and right vectors
        let forward = normalize(vec3(
            camera.at[0] - camera.eye[0], 0, camera.at[2] - camera.eye[2]
        ));        
        let right = normalize(vec3(
            forward[2], 0, -forward[0]
        ));

        let move = vec3(0, 0, 0);
        if (keys['w']) move = add(move, forward);
        if (keys['s']) move = subtract(move, forward);
        if (keys['a']) move = subtract(move, right);
        if (keys['d']) move = add(move, right);
        
        // Update camera position
        if (length(move) > 0) {
            move = scale(speed * deltatime, normalize (move));
            camera.eye[0] += move[0];
            camera.eye[1] += move[1];
            camera.eye[2] += move[2];
            camera.at[0]  += move[0];
            camera.at[1]  += move[1];
            camera.at[2]  += move[2];
        }
    }
    let lastTime = 0;

    // Single draw call
    function drawScene() {
        uploadLightInfo();
        drawBase();
        drawCube();
        drawBunny();
        drawTorus();
        drawCylinder();
        drawLightSources();
    }

    // Render loop
    function render(time) {
        const deltatime = (time - lastTime) / 1000;
        lastTime = time;
        updateCameraMovement(deltatime);
        window.requestAnimationFrame(render);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);
        mView = lookAt(camera.eye, camera.at, camera.up);
        STACK.loadMatrix(mView);
        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);
        updateModelViewMatrix();
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_projection"), false, flatten(mProjection));
        drawScene();
    }
}

const urls = [
    'shader2.vert',
    'shader2.frag',
    'shader1.vert',
    'shader1.frag'
];

loadShadersFromURLS(urls).then(shaders => setup(shaders));