#version 300 es

// Maximum number of lights
const int MAX_LIGHTS = 8;

// Vertex attributes
in vec4 a_position;
in vec4 a_normal;

// Light structure
struct LightInfo {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    vec4 position; 
    int type;
    bool enabled;
    vec3 axis;
    float cutoff;
    float aperture;
};

// Material structure
struct MaterialInfo {
    vec3 Ka;
    vec3 Kd;
    vec3 Ks;
    float shininess;
};

// Uniforms for lights and material
uniform int u_n_lights;
uniform LightInfo u_lights[MAX_LIGHTS];
uniform MaterialInfo u_material; 

// Transformation matrices
uniform mat4 u_projection;
uniform mat4 u_model_view;
uniform mat4 u_normals;

// Varying to pass color to fragment shader
out vec4 v_color;

void main() {
    // Transform position and normal to eye coordinates
    vec3 posC = (u_model_view * a_position).xyz;
    vec3 N = normalize((u_normals * a_normal).xyz);
    vec3 V = normalize(-posC); 
    vec3 sum = vec3(0.0);

    // Normalized material colors
    vec3 matKa = u_material.Ka / 255.0;
    vec3 matKd = u_material.Kd / 255.0;
    vec3 matKs = u_material.Ks / 255.0;

    // Loop over each light source
    for (int i = 0; i < u_n_lights; i ++) {
        LightInfo light = u_lights[i];
        if (!light.enabled) {
            continue;
        }

        // Calculate ambient, diffuse, and specular components
        vec3 ambientColor = (light.ambient / 255.0) * matKa;
        vec3 diffuseColor = (light.diffuse / 255.0) * matKd;
        vec3 specularColor = (light.specular / 255.0) * matKs;

        // Determine light direction based on type
        vec3 L;
        if (light.type == 1) {
            L = normalize(light.position.xyz);
        } else {
            L = normalize(light.position.xyz - posC);
        }
        vec3 R = reflect(-L, N);
        // Compute lighting factors
        float diffuseFactor = max(dot(N, L), 0.0);
        float specularFactor = pow(max(dot(R, V), 0.0), u_material.shininess);
        vec3 diffuse = diffuseFactor * diffuseColor;
        vec3 specular = specularFactor * specularColor;
        float spotAtt = 1.0;
        // Spotlight attenuation
        if (light.type == 2) {
            vec3 axis = normalize(light.axis);
            float cosA = dot(-L, axis);
            float cosCutoff = cos(radians(light.aperture));
            if (cosA < cosCutoff) {
                spotAtt = 0.0;
            } else {
                spotAtt = pow(max(cosA, 0.0), light.cutoff);
            }
        }
        // Accumulate the light contribution
        sum += ambientColor + (diffuse + specular) * spotAtt;
    }
    gl_Position = u_projection * u_model_view * a_position;
    v_color = vec4(sum, 1.0);
}
