#version 300 es

precision mediump float;

in vec4 v_color;
out vec4 color;

void main() {
    // we are simply passing through the interpolated color
    color = v_color;
}
