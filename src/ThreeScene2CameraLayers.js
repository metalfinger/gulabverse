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
    let defaultCameraPosition = new THREE.Vector3(20, -70, 30);

    let defaultLookAtPosition = new THREE.Vector3(1.5, -1.5, 0);

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
          //vec4 color1 = texture2D(texture1, gl_FragCoord.xy / resolution.xy);
          vec4 color1 = blur(texture1, gl_FragCoord.xy / resolution.xy);
          vec4 color2 = texture2D(texture2, gl_FragCoord.xy / resolution.xy);
          
          // Calculate the alpha value based on the red channel of texture2
          float alpha = color2.a;

          // Blend the two colors based on the alpha value
          vec4 finalColor = mix(color1, color2, alpha);

          gl_FragColor = finalColor;
        }
      `,
    });

    let mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), materialShader);
    scene.add(mesh);
    mesh.layers.set(3);

    //!Object Set Code starts Here

    // Create a SphereGeometry and a MeshBasicMaterial
    const geometry = new THREE.SphereGeometry(1, 32, 32);

    //load noise1.jpg texture
    const textureLoader = new TextureLoader();
    // const texture = textureLoader.load("/models/noise1.jpg");

    //load texture
    const texture = textureLoader.load("/models/2k_venus_surface.jpg");

    //create Lambert material with emissive color
    const materialLambert = new THREE.MeshLambertMaterial({
      color: 0xbd3d18,
      map: texture,
    });

    //set emissive color
    materialLambert.emissive.setHex(0xd1441d);

    //set emissive intensity
    materialLambert.emissiveIntensity = 0.1;

    //set shininess
    materialLambert.shininess = 100;

    //set reflectivity
    materialLambert.reflectivity = 10.5;

    //set glow color
    materialLambert.glowColor = new THREE.Color(0x00ff00);

    //set glow intensity
    materialLambert.glowIntensity = 1.5;

    //set bump texture
    materialLambert.bumpMap = texture;

    //set bump scale
    materialLambert.bumpScale = 0.0001;

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
    const object3 = new THREE.Mesh(geometry, materialLambert);
    object3.scale.set(0.5, 0.5, 0.5);

    //add attributes to object3
    object3.userData = {
      name: "object3",
      selected: false,
    };

    angle = 2.3;
    radius = 6;

    //set position of sphere1 on ring1 at angle 0
    object3.position.set(radius * Math.cos(angle), radius * Math.sin(angle), 0);

    root.add(object3);

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

    //trigger after 2 seconds
    setTimeout(function () {
      zoomInOnObject(object1);
    }, 2000);

    setTimeout(function () {
      zoomInOnObject(object2);
    }, 8000);

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

      //trigger after 3 seconds\
      setTimeout(function () {
        zoomOutFromObject(animatingObject);
      }, 3000);
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
    light.position.set(10, 0, 10);
    scene.add(light);

    //Add point light
    const pointLight = new THREE.PointLight(0xffffff, 3, 2000);
    pointLight.position.set(0, 0, 0);
    root.add(pointLight);

    //Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    root.add(ambientLight);

    //! GLTF starts here

    // //load texture from models/DessertRoz-Gulab Jamun-20230306T191815Z-001/DessertRoz-Gulab Jamun/Ledikeni_Camera 1_1_a.jpg
    // const textureLoaderGLTF = new TextureLoader();
    // const textureGLTF = textureLoaderGLTF.load(
    //   '/models/DessertRoz-Gulab Jamun-20230306T191815Z-001/DessertRoz-Gulab Jamun/Ledikeni_Camera 1_1_a.jpg'
    // );

    // //load oclussion texture from models/DessertRoz-Gulab Jamun-20230306T191815Z-001/DessertRoz-Gulab Jamun/A_Ledikeni_Camera 1_1_a.jpg
    // const textureLoaderOclussionGLTF = new TextureLoader();
    // const textureOclussionGLTF = textureLoaderOclussionGLTF.load(
    //   '/models/DessertRoz-Gulab Jamun-20230306T191815Z-001/DessertRoz-Gulab Jamun/A_Ledikeni_Camera 1_1_a.jpg'
    // );

    // //create Lambert material with emissive color with texture and oclussion texture
    // const materialGLTF = new THREE.MeshLambertMaterial({ map: textureGLTF, aoMap: textureOclussionGLTF});

    // // Load the GLTF model and its texture
    // const loader = new GLTFLoader();

    // loader.load('/models/DessertRoz-Gulab Jamun-20230306T191815Z-001/DessertRoz-Gulab Jamun/Ledikeni.gltf', function (gltf) {
    //   gltf.scene.traverse(function (child) {
    //     if (child.isMesh) {
    //       child.material = materialGLTF;
    //       // Set material color
    //       //child.material.color.setHex(0xffff00);

    //     }
    //   });
    //   root.add(gltf.scene);
    //   //set scale of GLTF model
    //   gltf.scene.scale.set(0.002, 0.002, 0.002);

    //   //set position of GLTF model
    //   gltf.scene.position.set(1, 0, 0);
    // });

    //! GLTF ENds here

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
      root.add(rings[i]);
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
      camera.layers.disable(2);
      camera.layers.disable(3);
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
