import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import anime from "animejs";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BloomPass } from "three/examples/jsm/postprocessing/BloomPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
//add RimBasic from threejs-shader-materials
import { RimBasicMaterial } from "threejs-shader-materials";
//import Color from three
import { Color } from "three";

function FlatSceneWithMaterials() {
  const canvasRef = useRef();

  useEffect(() => {
    // Get the parent element and create a renderer
    const parent = canvasRef.current.parentElement;
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    //set background transparent
    renderer.setClearColor(0x000000, 1);

    // Set the renderer size to the parent element size
    renderer.setSize(parent.clientWidth, parent.clientHeight);

    // Add the renderer to the parent element
    parent.appendChild(renderer.domElement);

    // Create a scene and a camera
    const scene = new THREE.Scene();

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
    //create a root object
    const root = new THREE.Object3D();

    scene.add(root);

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
      // emissive: 0xffe8e0,
      // emissiveIntensity: 1.5,
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

    root.add(sunGlowOuter);

    //!Object1 Starts
    //create a shader material for the object1
    const material1 = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x932b11) },
        u_resolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
      },
      vertexShader: vertexShader,
      fragmentShader: `      
uniform float u_time;
uniform vec2 u_resolution;

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .01
const float PI = 3.14159265359;


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

/
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

    // gl_FragColor = vec4(col, (dif + rim)*2.);
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);    
    
}   
      `,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.1,
      side: THREE.FrontSide,
    });

    //create a mesh
    const mesh = new THREE.Mesh(geometrySun, material1);

    //set mesh position
    mesh.position.set(1, 0, 0);

    //add mesh to the scene
    root.add(mesh);

    //!Object1 Ends

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

    //variable to check if selected
    let zoomedIn = false;

    var mouseX = 0;
    var mouseY = 0;

    //when the mouse is moved, get the mouse position
    window.addEventListener("mousemove", function (event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    // Animate the scene
    function animate() {
      requestAnimationFrame(animate);

      //rotate scene

      // renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      //Blur renderTarget1
      // composer.render();
    }

    animate();

    // Resize the renderer when the parent element size changes
    function onResize() {
      renderer.setSize(parent.clientWidth, parent.clientHeight);
      camera.aspect = parent.clientWidth / parent.clientHeight;

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

export default FlatSceneWithMaterials;
