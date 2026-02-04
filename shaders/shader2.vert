#version 300 es

// Vertex attributes
in vec4 a_position;
in vec4 a_normal;

// Maximum number of lights
const int MAX_LIGHTS = 8;

// Transformation matrices
uniform mat4 u_projection;
uniform mat4 u_model_view;
uniform mat4 u_normals;

// Varyings to pass data to fragment shader
out vec3 v_normal;
out vec3 v_posC;
out vec3 v_viewer;

void main() {
    // Transform position and normal to eye coordinates
    v_posC = (u_model_view * a_position).xyz;
    v_normal = (u_normals * a_normal).xyz;
    v_viewer = normalize(-v_posC);
    gl_Position = u_projection * u_model_view * a_position;
}
