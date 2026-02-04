# Illumination and Shading — Gouraud vs. Phong (WebGL)

A WebGL 2.0 project focused on **illumination models and shading techniques**, comparing **Gouraud (per-vertex)** and **Phong (per-fragment)** shading under identical lighting and material conditions.

The project demonstrates multiple light sources, different light types (point, directional, spot), and an interactive camera, providing a clear visual comparison between shading models.

Developed during the **1st semester of the 2025/2026 academic year** as part of the  
**Computer Graphics and Interfaces** course (NOVA School of Science and Technology — FCT, Lisbon).

**Final grade:** 18.5 / 20  
**Report date:** December 1, 2025

---

## 👥 Team

- **Ilia Taitsel** (67258)  
- Oleksandra Kozlova (68739)

---

## 🎯 Project Objectives

- Implement **Gouraud** and **Phong** shading using GLSL.
- Support **multiple simultaneous light sources**.
- Compare lighting computed in the **vertex shader** vs. the **fragment shader**.
- Handle different light types and spotlight attenuation.
- Provide an interactive camera and lighting setup for experimentation.

---

## 💡 Shading Models

Two complete GLSL programs are implemented:

### Gouraud Shading
- **Shaders:** `shader1.vert` + `shader1.frag`
- Lighting is computed **per vertex** in the vertex shader.
- The resulting color is interpolated across the primitive by the rasterizer.

### Phong Shading
- **Shaders:** `shader2.vert` + `shader2.frag`
- Lighting is computed **per fragment** in the fragment shader.
- Normals and positions are interpolated, producing more accurate highlights.

Both pipelines share the same semantic uniforms and structures; only the lighting computation stage differs.

---

## 🔦 Lighting System

### Supported Light Types
Each light is described by a `LightInfo` structure and can be enabled or disabled individually:

- **Point lights**
- **Directional lights**
- **Spotlights** (with cutoff and aperture)

Up to **8 lights** (`MAX_LIGHTS = 8`) can be active simultaneously.

### Light Parameters
Each light defines:
- Ambient, diffuse, and specular intensities
- Position or direction
- Light type (point / directional / spot)
- Spotlight axis, cutoff, and aperture

Spotlights use cosine-based attenuation to smoothly reduce intensity outside the cone.

---

## 🧱 Materials

Objects use a `MaterialInfo` structure:
- Ambient (`Ka`)
- Diffuse (`Kd`)
- Specular (`Ks`)
- Shininess exponent

Material and light colors are normalized in the shaders, allowing consistent calculations.

---

## 🎥 Scene Construction

The scene is built **procedurally** using a **matrix stack** rather than an explicit JSON scene graph.

Workflow:
1. Load the camera view matrix into the stack.
2. For each object:
   - `pushMatrix()`
   - Apply translations and scales (objects placed in different quadrants)
   - Upload `u_model_view` and `u_normals`
   - Issue draw call
   - `popMatrix()`

This approach is compact and well-suited for a fixed, demonstration-oriented scene.

Light positions (for world-space point and spot lights) are visualized as small spheres.

---

## 🎮 Interaction & Controls

### Camera
- **Mouse drag** — Rotate camera around the target
- **W / A / S / D** — Fly-style camera movement parallel to the ground
- **Mouse wheel** — Zoom / dolly
- **Reset button** — Restore default camera parameters

### Lighting
- Multiple lights can be added and configured via a GUI.
- Lights can be defined in **world** or **camera** coordinates.
- World-space lights are transformed to camera space before being sent to the shaders.

---

## ✨ Extra Features (Beyond Base Specification)

- **Array-based light management**  
  Lights are stored in an array; adding a new light only requires pushing a new object.

- **World vs. Camera Light Coordinates**  
  Light positions and axes are automatically converted to camera space in JavaScript.

- **Mouse-look + WASD Flying Camera**  
  Smooth navigation for exploring shading effects from different viewpoints.

- **Camera Reset & Flexible Zoom**  
  Quick restoration of defaults and intuitive zoom/dolly behavior.

- **Light Markers**  
  Small spheres rendered at the positions of point and spot lights.

---

## ⚠️ Deviations / Design Choices

- No explicit JSON-based scene graph is used.
- Hierarchy is implicit via matrix stack operations.
- For a small and static scene, this approach is simpler and easier to maintain.

---

## 🛠 Technologies Used

- **WebGL 2.0**
- **GLSL (Vertex & Fragment Shaders)**
- **JavaScript**
- Matrix stack utilities for hierarchical transforms

---

## 📌 Learning Outcomes

- Practical implementation of **Gouraud vs. Phong shading**
- Multi-light illumination with different light types
- Spotlight attenuation and specular highlights
- Camera-space vs. world-space lighting
- Clean shader structure and data flow
- Interactive visualization of shading differences
