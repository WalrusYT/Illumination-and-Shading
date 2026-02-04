#version 300 es

precision mediump float;

// Maximum number of lights
const int MAX_LIGHTS = 8;

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

// Varyings from vertex shader
in vec3 v_normal;
in vec3 v_posC;
in vec3 v_viewer;

// Output color
out vec4 color;

void main() {
    // Normalize vectors
    vec3 V = normalize(v_viewer);
    vec3 N = normalize(v_normal);
    vec3 sum = vec3(0.0);

    // Normalized material colors
    vec3 matKa = u_material.Ka / 255.0;
    vec3 matKd = u_material.Kd / 255.0;
    vec3 matKs = u_material.Ks / 255.0;
   
   // Loop over each light source
    for (int i = 0; i < u_n_lights; i++) {
        LightInfo light = u_lights[i];
        if (!light.enabled) continue;
        // Compute light direction
        vec3 L;
        if (light.type == 1) {
            L = normalize((light.position).xyz);
        } else {
            L = normalize((light.position).xyz - v_posC);
        }
        // Compute diffuse and specular factors
        float diffuseFactor = max(dot(N, L), 0.0);
        vec3 R = reflect(-L, N);
        float specularFactor = pow(max(dot(R, V), 0.0), u_material.shininess);
        // Calculate ambient, diffuse, and specular components
        vec3 ambientColor = (light.ambient / 255.0) * matKa;
        vec3 diffuseColor = (light.diffuse / 255.0) * matKd;
        vec3 specularColor = (light.specular / 255.0) * matKs;
        vec3 diffuse = diffuseFactor * diffuseColor;
        vec3 specular = specularFactor * specularColor;
        float spotAtt = 1.0;
        // Spotlight attenuation
        if (light.type == 2) {
            vec3 axis = normalize(light.axis);
            float cosA = max(dot(L, -axis) , 0.0);
            float cosCut = cos(radians(light.aperture));
            if (cosA < cosCut) {
                spotAtt = 0.0;
            } else {
                spotAtt = pow(max(cosA, 0.0), light.cutoff);
            }
        }
        // Accumulate the light contributions
        sum += ambientColor + (diffuse + specular) * spotAtt;
    }
    color = vec4(sum, 1.0);
}