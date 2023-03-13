import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import anime from "animejs";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BloomPass } from "three/examples/jsm/postprocessing/BloomPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
//add ShaderPass
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
//add BlurPass
// import { BlurPass } from "three/examples/jsm/postprocessing/BlurPass";

import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass";
//add RimBasic from threejs-shader-materials
import { RimBasicMaterial } from "threejs-shader-materials";
//import Color from three
import { Color } from "three";
//import CopyShader from threejs
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";
import { render } from "@testing-library/react";

function ThreeScene2CameraLayers() {
  const canvasRef = useRef();

  useEffect(() => {
    // Get the parent element and create a renderer
    const parent = canvasRef.current.parentElement;
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    //set background transparent
    renderer.setClearColor(0x000000, 0);

    // Set the renderer size to the parent element size
    renderer.setSize(parent.clientWidth, parent.clientHeight);

    // Add the renderer to the parent element
    parent.appendChild(renderer.domElement);

    // Create a scene and a camera
    const scene = new THREE.Scene();

    //create a perspective camera with orthographic camera
    // const camera = new THREE.PerspectiveCamera(
    //   75,
    //   window.innerWidth / window.innerHeight,
    //   0.1,
    //   1000
    // );

    //!Place Root
    // let defaultCameraPosition = new THREE.Vector3(20, -70, 30);
    let defaultCameraPosition = new THREE.Vector3(0, 0, 20);

    // let defaultLookAtPosition = new THREE.Vector3(1.5, -1.5, 0);
    let defaultLookAtPosition = new THREE.Vector3(0, 0, 0);

    // Create an isometric camera
    let aspect = window.innerWidth / window.innerHeight;
    let defaultDistance = 5;
    let d = defaultDistance;
    let camera = new THREE.OrthographicCamera(
      -d * aspect,
      d * aspect,
      d,
      -d,
      0.001,
      1000000
    );

    let d2 = defaultDistance;

    //add second camera
    let camera2 = new THREE.OrthographicCamera(
      -d2 * aspect,
      d2 * aspect,
      d2,
      -d2,
      0.00001,
      1000000
    );

    //create mainCamera
    let d3 = defaultDistance;

    let mainCamera = new THREE.OrthographicCamera(
      -d3 * aspect,
      d3 * aspect,
      d3,
      -d3,
      0.00001,
      1000000
    );

    // Position the camera to Default position
    camera.position.set(
      defaultCameraPosition.x,
      defaultCameraPosition.y,
      defaultCameraPosition.z
    );

    camera.lookAt(
      defaultLookAtPosition.x,
      defaultLookAtPosition.y,
      defaultLookAtPosition.z
    );

    //set camera layer
    // camera.layers.set(1);

    camera2.position.set(
      defaultCameraPosition.x,
      defaultCameraPosition.y,
      defaultCameraPosition.z
    );

    camera2.lookAt(
      defaultLookAtPosition.x,
      defaultLookAtPosition.y,
      defaultLookAtPosition.z
    );

    mainCamera.position.set(
      defaultCameraPosition.x,
      defaultCameraPosition.y,
      defaultCameraPosition.z
    );

    mainCamera.lookAt(
      defaultLookAtPosition.x,
      defaultLookAtPosition.y,
      defaultLookAtPosition.z
    );

    //create a root object
    const root = new THREE.Object3D();

    scene.add(root);

    //!Mesh Plane
    //create two separate render targets for two cameras
    const renderTarget1 = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );

    const renderTarget2 = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );

    // Create plane mesh to combine render targets
    const materialShader = new THREE.ShaderMaterial({
      uniforms: {
        texture1: { value: renderTarget1.texture },
        texture2: { value: renderTarget2.texture },
        resolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        //apply blurStrength
        blurStrength: {
          value: 0.0,
        },
      },
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D texture1;
        uniform sampler2D texture2;
        uniform vec2 resolution;
        uniform float blurStrength;

        // Function to apply Gaussian blur
        vec4 blur(sampler2D mytexture, vec2 uv) {
          vec4 color = vec4(0.0);
          float sigma = 0.001 + blurStrength;
          float blurSize = 2.0 * sigma;
          float weightSum = 0.0;

          for (float x = -blurSize; x <= blurSize; x += 1.0) {
            for (float y = -blurSize; y <= blurSize; y += 1.0) {
              vec2 offset = vec2(x, y);
              float weight = exp(-(x*x + y*y) / (2.0 * sigma * sigma));
              color += texture2D(mytexture, uv + offset / resolution.xy) * weight;
              weightSum += weight;
            }
          }

          return color / weightSum;
        }

        void main() {
          vec4 color1 = texture2D(texture1, gl_FragCoord.xy / resolution.xy);
          // vec4 color1 = blur(texture1, gl_FragCoord.xy / resolution.xy);
          vec4 color2 = texture2D(texture2, gl_FragCoord.xy / resolution.xy);
          
          // Calculate the alpha value based on the red channel of texture2
          float alpha = color2.a;

          // Blend the two colors based on the alpha value
          vec4 finalColor = mix(color1, color2, alpha);

          // finalColor = color1 + color2;

          gl_FragColor = finalColor;
        }
      `,
    });

    let mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), materialShader);
    scene.add(mesh);
    mesh.layers.set(3);

    //!Object Set Code starts Here

    // Create a SphereGeometry and a MeshBasicMaterial
    let geometry = new THREE.SphereGeometry(1, 32, 32);

    //load noise1.jpg texture
    const textureLoader = new TextureLoader();
    const texture = textureLoader.load("/models/noise3.jpg");

    //load texture
    // const texture = textureLoader.load("/models/jamun__map.jpg");

    //create Lambert material with emissive color
    const materialLambert = new THREE.MeshLambertMaterial({
      color: 0x932b11,
      map: texture,
    });

    // //set emissive color
    // materialLambert.emissive.setHex(0x00ff00);
    // //set emissive intensity
    // materialLambert.emissiveIntensity = 0.0;
    //set shininess
    // materialLambert.shininess = 20;
    // //set reflectivity
    materialLambert.reflectivity = 20;
    //set glow color
    materialLambert.glowColor = new THREE.Color(0x00ff00);
    //set glow intensity
    materialLambert.glowIntensity = 10.5;
    // //set bump texture
    // materialLambert.bumpMap = texture;
    // //set bump scale
    // materialLambert.bumpScale = 0.0;

    //!Adding Objects to the scene Starts here

    //SunMaterial that glows
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xfcc2b3,
      emissive: 0xffe8e0,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 1.0,
    });

    //create geometry
    const geometrySun = new THREE.SphereGeometry(0.3, 32, 32);

    //compute bounding box
    geometrySun.computeBoundingBox();

    let sun = new THREE.Mesh(geometrySun, sunMaterial);
    sun.scale.set(1, 1, 1);
    sun.position.set(0, 0, 0);

    addToLayer1(sun);

    root.add(sun);

    //!Glow to Sun
    const vertexShader = `
    varying vec3 vNormal;
    void main() 
    {
        vNormal = normalize( normalMatrix * normal );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`;

    const fragmentShader = `
    uniform float c;
    uniform float p;
    //add base color
    uniform vec3 baseColor;
    varying vec3 vNormal;
    void main() 
    {
      float intensity = pow( c - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ), p ); 
      gl_FragColor = vec4( baseColor.x, baseColor.y, baseColor.z, 1.0 ) * intensity;
    }

    `;

    const glowMaterialGlowInner = new THREE.ShaderMaterial({
      uniforms: {
        c: { type: "f", value: 0.9 },
        p: { type: "f", value: 1.2 },
        baseColor: { type: "c", value: new THREE.Color(0xffe8e0) },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.1,
      side: THREE.FrontSide,
    });

    let sunGlowInner = new THREE.Mesh(
      geometrySun.clone(),
      glowMaterialGlowInner
    );
    //set sunGlow position
    sunGlowInner.position.set(0, 0, 0);

    sunGlowInner.scale.multiplyScalar(1.0);

    addToLayer1(sunGlowInner);

    root.add(sunGlowInner);

    const glowMaterialGlowOuter = new THREE.ShaderMaterial({
      uniforms: {
        c: { type: "f", value: 0.1 },
        p: { type: "f", value: 1.8 },
        baseColor: { type: "c", value: new THREE.Color(0xffffff) },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.5,
    });

    let sunGlowOuter = new THREE.Mesh(
      geometrySun.clone(),
      glowMaterialGlowOuter
    );
    //set sunGlow position
    sunGlowOuter.position.set(0, 0, 0);

    sunGlowOuter.scale.multiplyScalar(1.4);

    addToLayer1(sunGlowOuter);

    root.add(sunGlowOuter);

    //!Object1
    const object1 = new THREE.Mesh(geometry, materialLambert);
    object1.scale.set(0.25, 0.25, 0.25);

    //add attributes to object1
    object1.userData = {
      name: "object1",
      selected: false,
    };

    let angle = -0.77;
    let angleX = (-20 * Math.PI) / 180;
    let angleY = (-70 * Math.PI) / 180;
    let radius = 3.5;

    //set position of sphere1 on ring1 at angle 0
    object1.position.set(
      radius * Math.cos(angleX) - 2,
      radius * Math.sin(angleY),
      0
    );

    root.add(object1);

    //!Object2
    const object2 = new THREE.Mesh(geometry, materialLambert);
    object2.scale.set(0.3, 0.3, 0.3);

    //add attributes to object2
    object2.userData = {
      name: "object2",
      selected: false,
    };

    angle = 0.8;
    radius = 3.5;

    //set position of sphere1 on ring1 at angle 0
    object2.position.set(radius * Math.cos(angle), radius * Math.sin(angle), 0);

    root.add(object2);

    //!Material for Objects Starts here
    const vertexShaderO = `
    uniform float amplitude;
    uniform float frequency;
    uniform float speed;
    uniform float time;

    varying vec3 vNormal;

    void main() {
        vNormal = normal;

        float noise = amplitude * sin(time + position.x * frequency) +
                      amplitude * sin(time + position.y * frequency) +
                      amplitude * sin(time + position.z * frequency);

        vec3 newPosition = position + noise * normal;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`;

    const fragmentShaderO = `
    uniform float time;
    uniform sampler2D noiseTexture;

    varying vec3 vNormal;

    void main() {
        // Apply black dotted noise pattern
        vec2 uv = vec2(vNormal.x + time * 0.1, vNormal.y + time * 0.2);
        float noise = texture2D(noiseTexture, uv * 10.0).r;
        float threshold = 0.8;
        vec3 color = mix(vec3(0.0), vec3(1.0), step(threshold, noise));

        // Add reflection
        vec3 reflection = reflect(-normalize(vNormal), vec3(0.0, 0.0, 1.0));
        vec3 viewDir = normalize(-vec3(modelViewMatrix * vec4(position, 1.0)));
        float fresnel = pow(1.0 - dot(reflection, viewDir), 3.0);
        color = mix(color, vec3(1.0), fresnel);

        gl_FragColor = vec4(color, 1.0);
    }
`;

    const materialO = new THREE.ShaderMaterial({
      uniforms: {
        amplitude: { value: 1.0 },
        frequency: { value: 1.0 },
        speed: { value: 1.0 },
        time: { value: 0.0 },
        noiseTexture: {
          value: new THREE.TextureLoader().load("/models/noise2.jpg"),
        },
      },
      vertexShader: vertexShaderO,
      fragmentShader: fragmentShaderO,
      side: THREE.DoubleSide,
    });

    //create material using RimBasic shader from threejs-shader-materials
    const mat = new RimBasicMaterial({
      fog: scene.fog !== undefined,
    });

    mat.uniformOpacity = 0.65;
    mat.color = new Color(0x003311);
    mat.rimColor = new Color(0x334400);
    mat.insideColor = new Color(0x000000);
    mat.rimPow = 2.0;
    mat.insidePow = 6.0;
    mat.insideStrength = 0.5;
    mat.transparent = true;

    //!Object3

    //create empty Object3Container
    const object3Container = new THREE.Object3D();
    root.add(object3Container);

    //create a plane geometry
    geometry = new THREE.PlaneGeometry(1, 1, 1);

    //!Material for Object3 using Shaders
    const vertexShader3 = `
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
        vUv = uv;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

    const fragmentShader3 = `
    #ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .01
const float PI = 3.14159265359;

float sdCylinder(vec3 p, vec3 a, vec3 b, float r) {
  vec3 ap = p-a;
  vec3 ab = b-a;

  float t = dot(ap,ab)/dot(ab,ab);

  vec3 c = a + t*ab;

  float d = length(p-c) - r;

  t = abs(t-0.5) - 0.5;

  float y = t*length(ab);

  float e = length(max(vec2(d,y),0.0));

  float i = min(max(d, y), 0.);

  return e+i;
}

float sBox(vec3 p, vec3 size)
{
    vec3 d = max(abs(p) - size, vec3(0.));
    return length(d);
}

float sdTorus(vec3 p, vec2 r)
{
    return length(vec2(length(p.xz) - r.x, p.y)) - r.y;
}

float sdCapcule(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 ap = p-a;
    vec3 ab = b-a;

    float t = dot(ap,ab)/dot(ab,ab);
    t = clamp(t,0.,1.);

    vec3 q = a + ab*t;
    vec3 d = p-q;

    return length(d)-r;
    
}

mat2 rot2d(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat2(c,-s,s,c);
}

mat3 rot3d(vec3 a)
{
    float c = cos(a.x);
    float s = sin(a.x);
    float t = 1.0 - c;
    return mat3(t*a.y*a.y + c,     t*a.x*a.y - s*a.z, t*a.x*a.z + s*a.y,
                t*a.x*a.y + s*a.z, t*a.y*a.y + c,     t*a.y*a.z - s*a.x,
                t*a.x*a.z - s*a.y, t*a.y*a.z + s*a.x, t*a.z*a.z + c);
}

float smin(float a, float b, float k)
{
    float h = clamp(0.5+0.5*(b-a)/k, 0.0, 1.0);
    return mix(b, a, h) - k*h*(1.0-h);
}

float GetDist(vec3 p)
{
    vec4 s = vec4(0., 1., 3., 1.);
    
    float sphereDist = length(p-s.xyz) - s.w;

    
    return sphereDist;
}



float RayMarch(vec3 ro, vec3 rd) {
	float dO=0.;
    
    for(int i=0; i<MAX_STEPS; i++) {
    	vec3 p = ro + rd*dO;
        float dS = GetDist(p);
        dO += dS;
        if(dO>MAX_DIST || dS<SURF_DIST) break;
    }

    
    return dO;
}



vec3 GetNormal(vec3 p) {
	float d = GetDist(p);
    vec2 e = vec2(.001, 0);
    
    vec3 n = d - vec3(
        GetDist(p-e.xyy),
        GetDist(p-e.yxy),
        GetDist(p-e.yyx));
    
    return normalize(n);
}

float GetLight(vec3 p) {
    vec3 lightPos = vec3(0, 1, 0);
    //lightPos.xz += vec2(sin(u_time), cos(u_time))*2.;
    vec3 l = normalize(lightPos-p);
    vec3 n = GetNormal(p);
    
    //start
    // calculate specular contribution
    vec3 r = reflect(-l, n);
    vec3 v = normalize(-p);
    float spec = pow(max(dot(r, v), 0.0), 32.0);
    //end

    float dif = clamp(dot(n, l), 0., 1.);
    float d = RayMarch(p+n*SURF_DIST*2., l);
    if(d<length(lightPos-p)) dif *= .1;
    
    // return spec*dif + dif;
    return dif;
}


//function to create a glow rim around the object
float GetRim(vec3 p, vec3 rd) {
    vec3 n = GetNormal(p);
    float rim = 1.1 - abs(dot(rd, n));
    rim = pow(rim, 4.);
    return rim;
}

float GetHalo(vec3 p, vec3 rd) {
    vec3 n = GetNormal(p);
    vec3 sphereCenter = vec3(0., 0., 9.);
    float distFromSphere = length(p - sphereCenter) - 1.3;
    float halo = smoothstep(1.0, 0.5, distFromSphere);
    return halo;
}

float rimGlow(vec2 uv)
{
    float rad = 0.343;
    float radW = 0.04; //bluriness at border
    float ringWidth = 0.00001;

    //create a circular rim at 0.1
    float rim = smoothstep(rad, rad + radW, length(uv));

    rad += ringWidth;

    //create a circle at 0.2
    float circle = smoothstep(rad, rad + radW, length(uv));

    rim *= 1.0 - circle; //subtract the rim from the circle

    rim = rim * 3.1;

    return rim;
}

//hex color to rgb
vec3 hex2rgb(vec3 c)
{
    return vec3(c.x/255., c.y/255., c.z/255.);
}

// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation
    vec2 u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

void main()
{
    vec2 uv = (gl_FragCoord.xy - .5*u_resolution)/u_resolution.y;  

    vec3 col = vec3(0);
    
    vec3 ro = vec3(0, 1, 0.);
    vec3 rd = normalize(vec3(uv.x, uv.y, 1.));

    float d = RayMarch(ro, rd);
    
    vec3 p = ro + rd * d;


    //unwrap uv for Sphere and create sphereUV
    vec3 sphereCenter = vec3(0., 0., 9.);
    vec3 sphereCoord = normalize(p - sphereCenter);
    float longitude = atan(sphereCoord.z, sphereCoord.x);
    float latitude = acos(sphereCoord.y);
    vec2 sphereUV = vec2(longitude / (1.0 * PI) + 0.5 + u_time*0.01, latitude / PI);
    // vec2 sphereUV = uv;


    float noiseAmount = 0.3;
    vec2 noiseST = sphereUV * 4000.0;

    vec3 noiseColor = vec3(0.0);
    noiseColor += noise(noiseST) * noiseAmount;

    //get the rim
    float rim = GetRim(p, rd);


    //get the light
    float dif = GetLight(p);

    float halo = GetHalo(p, rd);

    float glow = pow(rim, 4.)*4.;

    dif = dif*(1. - noiseColor.x);

    // add outer glow
    col += vec3(181.0/255.0, 112.0/255.0, 35.0/255.0) * rim * 1.2;

    col += vec3(187.0/255.0,
                46.0/255.0, 
                8.0/255.0) * dif * 1.1;

    //mix the colors
    // col = col * noiseColor.z;

    //add rim glow
    // float rimGlow = rimGlow(uv);

    // col += vec3(1.0, 1.0, 1.0) * rimGlow * .2;

    // gl_FragColor = vec4(col, dif + rimGlow + rim);
    gl_FragColor = vec4(col, (dif + rim)*2.);
    // gl_FragColor = vec4(col, 0.1);
    
    // gl_FragColor = vec4(col, 1.0);

    // col = vec3(noiseColor);

    // gl_FragColor = vec4(col, 1.0);
}   
`;

    //create a material for object3
    let materialLambert3 = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2() },
      },
      vertexShader: vertexShader3,
      fragmentShader: fragmentShader3,
      side: THREE.DoubleSide,
    });

    //set uniforms for object3
    materialLambert3.uniforms.u_resolution.value.x = window.innerWidth;
    materialLambert3.uniforms.u_resolution.value.y = window.innerHeight;

    const object3 = new THREE.Mesh(geometry, materialLambert3);

    //add attributes to object3
    object3.userData = {
      name: "object3",
      selected: false,
    };

    angle = 2.3;
    radius = 6;

    //set position of sphere1 on ring1 at angle 0
    object3Container.position.set(
      radius * Math.cos(angle),
      radius * Math.sin(angle),
      0
    );

    //rotate object3
    // object3Container.rotation.set(1.0, 0.5, 0.1);

    object3Container.add(object3);

    //!Object3 material Start
    const glowMaterialGlowInner3 = new THREE.ShaderMaterial({
      uniforms: {
        c: { type: "f", value: 0.9 },
        p: { type: "f", value: 2.2 },
        baseColor: { type: "c", value: new THREE.Color(0xaaaaaa) },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.1,
      side: THREE.FrontSide,
    });
    const glowMaterialGlowOuter3 = new THREE.ShaderMaterial({
      uniforms: {
        c: { type: "f", value: 0.1 },
        p: { type: "f", value: 10.8 },
        baseColor: { type: "c", value: new THREE.Color(0xffffff) },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.5,
    });

    let o3Inner = new THREE.Mesh(geometry.clone(), glowMaterialGlowInner3);
    o3Inner.scale.multiplyScalar(1.0);

    // addToLayer1(o3Inner);

    object3Container.add(o3Inner);

    let o3Outer = new THREE.Mesh(geometry.clone(), glowMaterialGlowOuter3);

    o3Outer.scale.multiplyScalar(1.4);

    // addToLayer1(o3Outer);

    object3Container.add(o3Outer);
    //!Object3 material Ends

    //!Object4
    const object4 = new THREE.Mesh(geometry, materialLambert);
    object4.scale.set(0.5, 0.5, 0.5);

    //add attributes to object4
    object4.userData = {
      name: "object4",
      selected: false,
    };

    angle = -0.9;
    radius = 11.6;

    //set position of sphere1 on ring1 at angle 0
    object4.position.set(radius * Math.cos(angle), radius * Math.sin(angle), 0);

    root.add(object4);

    //!Object5
    const object5 = new THREE.Mesh(geometry, materialLambert);
    object5.scale.set(0.5, 0.5, 0.5);

    //add attributes to object5
    object5.userData = {
      name: "object5",
      selected: false,
    };

    angle = -1.2;
    radius = 13.6;

    //set position of sphere1 on ring1 at angle 0
    object5.position.set(radius * Math.cos(angle), radius * Math.sin(angle), 0);

    root.add(object5);

    //!Object6
    const object6 = new THREE.Mesh(geometry, materialLambert);
    object6.scale.set(0.5, 0.5, 0.5);

    //add attributes to object6
    object6.userData = {
      name: "object6",
      selected: false,
    };

    angle = -1;
    radius = 16.7;

    //set position of sphere1 on ring1 at angle 0
    object6.position.set(radius * Math.cos(angle), radius * Math.sin(angle), 0);

    root.add(object6);

    //!Dummy Object Starts Here

    //create dummy object
    let dummyObject;

    //create a dummy object to animate camera2 lookat
    let camera2LookAt = {
      x: 0,
      y: 0,
      z: 0,
    };

    //create a dummy object to animate camera2 zoom
    let camera2Zoom = { value: 1 };

    //!Orth Animation Starts Here

    // trigger after 2 seconds
    setTimeout(function () {}, 2000);
    // zoomInOnObject(object3Container);

    // setTimeout(function () {
    //   zoomInOnObject(object2);
    // }, 8000);

    //!zoomInOnObject
    function zoomInOnObject(animatingObject) {
      //null dummyObject reference
      dummyObject = animatingObject.clone();

      //remove animatingObject from its parent
      root.remove(animatingObject);
      scene.add(dummyObject);

      //set layer of dummy object to layer 2
      dummyObject.layers.set(2);

      let animationTime = 2000;

      //create a dummy object to animate camera2 zoom
      camera2Zoom = { value: 1 };

      //animate cameraZoom to 2 using anime
      anime({
        targets: camera2Zoom,
        value: 5,
        duration: animationTime,
        easing: "linear",
        update: function () {
          aspect = window.innerWidth / window.innerHeight;

          d2 = defaultDistance / camera2Zoom.value;

          //update camera2 left, right, top, bottom
          camera2.left = -d2 * aspect;
          camera2.right = d2 * aspect;
          camera2.top = d2;
          camera2.bottom = -d2;

          // console.log(camera2Zoom.value, d2, defaultDistance);

          //update camera2 projection matrix
          camera2.updateProjectionMatrix();
        },
      });

      //get absolute position on screen of animatingObject
      let object1GlobalPosition = animatingObject.getWorldPosition(
        new THREE.Vector3(0, 0, 0)
      );

      //create vector and 1, 1, 0 to object1 position
      let vector = new THREE.Vector3(
        object1GlobalPosition.x + 1,
        object1GlobalPosition.y + 0.2,
        0
      );

      camera2LookAt.x = scene.position.x + defaultLookAtPosition.x;
      camera2LookAt.y = scene.position.y + defaultLookAtPosition.y;
      camera2LookAt.z = scene.position.z + defaultLookAtPosition.z;

      // camera2.lookAt(camera2LookAt.x, camera2LookAt.y, camera2LookAt.z);

      //animate camera2 lookat to object1 position using anime
      anime({
        targets: camera2LookAt,
        x: vector.x,
        y: vector.y,
        z: vector.z,
        duration: animationTime,
        easing: "linear",
        update: function () {
          //update camera2 lookat
          camera2.lookAt(camera2LookAt.x, camera2LookAt.y, camera2LookAt.z);
        },
      });

      //animate materialShader's uniform blurStrength using anime
      anime({
        targets: materialShader.uniforms.blurStrength,
        value: 6.5,
        duration: animationTime,
        easing: "linear",
      });

      // //trigger after 3 seconds\
      // setTimeout(function () {
      //   zoomOutFromObject(animatingObject);
      // }, 3000);
    }

    function zoomOutFromObject(animatingObject) {
      let animationTime = 2000;

      console.log(camera2Zoom.value, d2, defaultDistance, "PIVOT");

      //animate cameraZoom to 2 using anime
      anime({
        targets: camera2Zoom,
        value: 1,
        duration: animationTime,
        easing: "linear",
        update: function () {
          aspect = window.innerWidth / window.innerHeight;

          d2 = defaultDistance / camera2Zoom.value;

          // console.log(camera2Zoom.value, d2, defaultDistance);

          //update camera2 left, right, top, bottom
          camera2.left = -d2 * aspect;
          camera2.right = d2 * aspect;
          camera2.top = d2;
          camera2.bottom = -d2;

          // console.log(camera2Zoom.value);

          //update camera2 projection matrix
          camera2.updateProjectionMatrix();
        },
        complete: function () {
          root.add(animatingObject);
          scene.remove(dummyObject);

          //make dummyObject null
          dummyObject = null;
        },
      });

      //animate camera2 lookat to object1 position using anime
      anime({
        targets: camera2LookAt,
        x: defaultLookAtPosition.x,
        y: defaultLookAtPosition.y,
        z: defaultLookAtPosition.z,
        duration: animationTime,
        easing: "linear",
        update: function () {
          //update camera2 lookat
          camera2.lookAt(camera2LookAt.x, camera2LookAt.y, camera2LookAt.z);
        },
      });

      anime({
        targets: materialShader.uniforms.blurStrength,
        value: 0,
        duration: animationTime,
        easing: "linear",
      });
    }

    addToLayer1(object1);
    addToLayer1(object2);
    addToLayer1(object3);
    addToLayer1(object4);
    addToLayer1(object5);
    addToLayer1(object6);

    //!Orth Animation Ends Here

    //!Add a light
    const light = new THREE.PointLight(0xffffff, 1, 400);
    light.position.set(0, 0, 0);
    // scene.add(light);

    //Add point light
    const pointLight = new THREE.PointLight(0xffffff, 1.2, 500);
    pointLight.position.set(0, 0, 0);
    root.add(pointLight);

    //Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    root.add(ambientLight);

    // //! GLTF starts here

    // //load texture from models/DessertRoz-Gulab Jamun-20230306T191815Z-001/DessertRoz-Gulab Jamun/Ledikeni_Camera 1_1_a.jpg
    // const textureLoaderGLTF = new TextureLoader();
    // const textureGLTF = textureLoaderGLTF.load(
    //   "/models/DessertRoz-Gulab Jamun-20230306T191815Z-001/DessertRoz-Gulab Jamun/Ledikeni_Camera 1_1_a.jpg"
    // );

    // //load oclussion texture from models/DessertRoz-Gulab Jamun-20230306T191815Z-001/DessertRoz-Gulab Jamun/A_Ledikeni_Camera 1_1_a.jpg
    // const textureLoaderOclussionGLTF = new TextureLoader();
    // const textureOclussionGLTF = textureLoaderOclussionGLTF.load(
    //   "/models/DessertRoz-Gulab Jamun-20230306T191815Z-001/DessertRoz-Gulab Jamun/A_Ledikeni_Camera 1_1_a.jpg"
    // );

    // //create Lambert material with emissive color with texture and oclussion texture
    // const materialGLTF = new THREE.MeshLambertMaterial({
    //   map: textureGLTF,
    //   aoMap: textureOclussionGLTF,
    // });

    // // Load the GLTF model and its texture
    // const loader = new GLTFLoader();

    // loader.load(
    //   "/models/DessertRoz-Gulab Jamun-20230306T191815Z-001/DessertRoz-Gulab Jamun/Ledikeni.gltf",
    //   function (gltf) {
    //     gltf.scene.traverse(function (child) {
    //       if (child.isMesh) {
    //         child.material = materialGLTF;
    //         // Set material color
    //         //child.material.color.setHex(0xffff00);
    //       }
    //     });
    //     root.add(gltf.scene);
    //     //set scale of GLTF model
    //     gltf.scene.scale.set(0.005, 0.005, 0.005);

    //     //set layer of GLTF model
    //     gltf.scene.layers.set(0);

    //     //set position of GLTF model
    //     gltf.scene.position.set(1, 0, 0);
    //   }
    // );

    // //! GLTF ENds here

    //!Orbit Starts here

    //ring material that emits light
    const ringMaterialEmits = new THREE.MeshLambertMaterial({
      //yellow color
      color: 0xffff00,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0,
    });

    //create 6 rings as orbit with radius 10, 20, 30, 40, 50, 60
    const rings = [];

    let ringRadius = 2.5;
    let initialRadius = 1;

    for (let i = 0; i < 6; i++) {
      //ring Material
      let ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });

      //if i is even then set emissive color
      if (i == 1) {
        ringMaterial = ringMaterialEmits;
      }

      //if i is 2 then make it transparent
      if (i == 2) {
        ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.0,
        });
      }

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(
          initialRadius + ringRadius * (i + 1),
          initialRadius + ringRadius * (i + 1) + 0.01,
          64
        ),
        ringMaterial
      );

      //if i is more than 2 then scale it
      if (i > 2) {
        ring.scale.set(1.2, 1, 1);
      }

      addToLayer1(ring);

      rings.push(ring);
      // root.add(rings[i]);
    }

    //!Third Ring Astroid Starts here

    //create 100 astroids in third ring
    const astroids = [];

    //astroid material
    const astroidMaterial = new THREE.MeshLambertMaterial({
      color: 0x000000,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0,
    });

    //create astroid geometry
    const astroidGeometry = new THREE.SphereGeometry(0.5, 32, 32);

    //function to get random number between min and max
    function getRandomArbitrary(min, max) {
      return Math.random() * (max - min) + min;
    }

    //create astroids
    for (let i = 0; i < 500; i++) {
      const astroid = new THREE.Mesh(astroidGeometry, astroidMaterial);

      //set in circle position in third ring
      astroid.position.set(
        Math.cos((i / 100) * Math.PI * 2) * 8 + getRandomArbitrary(-0.12, 0.12),
        Math.sin((i / 100) * Math.PI * 2) * 8 + getRandomArbitrary(-0.12, 0.12),
        getRandomArbitrary(-0.12, 0.12)
      );

      //set random scale
      astroid.scale.setScalar((Math.random() * 0.5 + 0.5) * 0.05);

      addToLayer1(astroid);

      //add astroid to astroids array
      astroids.push(astroid);

      //add astroid to third ring
      rings[2].add(astroids[i]);
    }

    //rotate ring2 continuously using anime
    anime({
      targets: rings[2].rotation,
      z: 2 * Math.PI,
      easing: "linear",
      duration: 50000,
      loop: true,
    });

    //!Third Ring Astroid Ends here

    //!function Add TO layer1
    function addToLayer1(object) {
      object.layers.set(1);
    }

    //create GlowShader
    const GlowShader = {
      uniforms: {
        tDiffuse: { value: null },
        fGlowStrength: { value: 1.0 },
        vGlowColor: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
      },
      vertexShader: `

        varying vec2 vUv;

        void main() {

          vUv = uv;

          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

        }

      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float fGlowStrength;
        uniform vec3 vGlowColor;

        varying vec2 vUv;

        void main() {

          vec4 texel = texture2D( tDiffuse, vUv );
          vec3 glow = texel.rgb * vGlowColor * fGlowStrength;

          gl_FragColor = vec4( glow, texel.a );

        }
      `,
    };

    //variable to check if selected
    let zoomedIn = false;

    var mouseX = 0;
    var mouseY = 0;

    //when the mouse is moved, get the mouse position
    window.addEventListener("mousemove", function (event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    // let composer = new EffectComposer(renderer);

    // // create a final composite pass to render both camera views using CopyShader
    // const compositePass = new ShaderPass(CopyShader);

    // //create a composer to handle multiple passes
    // let composerMultiPass = new EffectComposer(renderer);

    // //add the render pass to the composer with the scene and camera
    // composerMultiPass.addPass(new RenderPass(scene, camera, renderTarget));

    // //add the final pass to the composer with the scene and camera2
    // composerMultiPass.addPass(new RenderPass(scene, camera2, renderTarget2));

    // //add the final pass to the composer
    // composerMultiPass.addPass(compositePass);

    // composer.render();

    //create two render targets
    // const renderTarget = new THREE.WebGLRenderTarget(
    //   window.innerWidth,
    //   window.innerHeight
    // );

    // const renderTarget2 = new THREE.WebGLRenderTarget(
    //   window.innerWidth,
    //   window.innerHeight
    // );

    //create two render passes with the render targets
    // const renderPass = new RenderPass(scene, camera, object1);
    // const renderPass2 = new RenderPass(scene, camera2, object2);

    // //create a EffectComposer to handle multiple passes
    // const composer = new EffectComposer(renderer);

    // //add the render passes to the composer
    // composer.addPass(renderPass);
    // composer.addPass(renderPass2);

    // //Render the two cameras to the same render target
    // renderer.autoClear = false;

    // //enable layer1 and disable layer2
    // camera.layers.enable(layer1);
    // camera.layers.disable(layer2);
    // //enable layer2 and disable layer1
    // camera2.layers.disable(layer2);
    // camera2.layers.enable(layer1);

    //!Blur the camera
    const composer = new EffectComposer(renderer, renderTarget2);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    //add BlurPass
    const blurPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    blurPass.renderToScreen = true;
    composer.addPass(blurPass);

    composer.render();

    // Animate the scene
    function animate() {
      requestAnimationFrame(animate);

      //rotate scene

      // renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
      renderer.setRenderTarget(renderTarget1);
      camera.layers.enable(0);
      camera.layers.enable(1);
      camera.layers.enable(2);
      camera.layers.enable(3);
      renderer.render(scene, camera);

      renderer.setRenderTarget(renderTarget2);
      // renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
      camera2.layers.enable(0);
      camera2.layers.disable(1);
      camera2.layers.enable(2);
      camera2.layers.disable(3);
      renderer.render(scene, camera2);

      renderer.setRenderTarget(null);
      mainCamera.layers.disable(0);
      mainCamera.layers.disable(1);
      mainCamera.layers.disable(2);
      mainCamera.layers.enable(3);

      renderer.render(scene, mainCamera);

      //Blur renderTarget1
      // composer.render();
    }

    animate();

    // Resize the renderer when the parent element size changes
    function onResize() {
      renderer.setSize(parent.clientWidth, parent.clientHeight);
      camera.aspect = parent.clientWidth / parent.clientHeight;
      camera.updateProjectionMatrix();
      camera2.updateProjectionMatrix();
      // mainCamera.updateProjectionMatrix();

      //update d and orthographic camera left, right, top, bottom
      aspect = window.innerWidth / window.innerHeight;

      camera.left = -d * aspect;
      camera.right = d * aspect;
      camera.top = d;
      camera.bottom = -d;

      // camera2.left = -d2 * aspect;
      // camera2.right = d2 * aspect;
      // camera2.top = d2;
      // camera2.bottom = -d2;

      // console.log(d, d2, d3, aspect);

      // mainCamera.left = -d3 * aspect;
      // mainCamera.right = d3 * aspect;
      // mainCamera.top = d3;
      // mainCamera.bottom = -d3;

      //update uniforms of materialShader
      // materialShader.uniform.resolution.value.x = parent.clientWidth;
      // materialShader.uniform.resolution.value.y = parent.clientHeight;
    }

    window.addEventListener("resize", onResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", onResize);
      parent.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}

export default ThreeScene2CameraLayers;
