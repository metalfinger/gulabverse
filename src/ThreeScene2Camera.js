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
//add RimBasic from threejs-shader-materials
import { RimBasicMaterial } from "threejs-shader-materials";
//import Color from three
import { Color } from "three";
//import CopyShader from threejs
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";

function ThreeScene2Camera() {
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
      1000
    );
    camera.lookAt(scene.position); // or the origin

    let d2 = defaultDistance / 1;

    //add second camera
    let camera2 = new THREE.OrthographicCamera(
      -d2 * aspect,
      d2 * aspect,
      d2,
      -d2,
      0.001,
      1000
    );
    camera2.lookAt(0, 0, 0); // or the origin

    //define variables for the default camera position
    let defaultCameraPosition = new THREE.Vector3(0, 0, 20);
    // Position the camera to Default position
    camera.position.set(
      defaultCameraPosition.x,
      defaultCameraPosition.y,
      defaultCameraPosition.z
    );

    // camera2.position.set(
    //   defaultCameraPosition.x,
    //   defaultCameraPosition.y,
    //   defaultCameraPosition.z
    // );
    // set the camera's rotation and position to create an isometric view
    // camera2.rotation.set((20 * Math.PI) / 180, (70 * Math.PI) / 180, 0);
    camera2.position.set(20, -70, 30);

    camera2.lookAt(1.5, -1.5, 0);

    //create a root object
    const root = new THREE.Object3D();

    scene.add(root);

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

    moveTheScene(sun);

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
    moveTheScene(sunGlowInner);
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
    moveTheScene(sunGlowOuter);
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
    let radius = 1; //3.5;

    //set position of sphere1 on ring1 at angle 0
    object1.position.set(
      radius * Math.cos(angleX) - 2,
      radius * Math.sin(angleY),
      0
    );

    //animate object1 position on ring1 using anime
    // anime({
    //   targets: object1.position,
    //   x: Math.cos(angleX) * radius,
    //   y: Math.sin(angleY) * radius,
    //   z: 0,
    //   easing: "linear",
    //   duration: 1000,
    //   loop: true,
    //   direction: "alternate",
    // });

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

    //function to add rotation on z axis to all objects Added to the scene
    function rotateAllObjects(object) {
      anime({
        targets: object.rotation,
        z: 2 * Math.PI,
        duration: 50000 * Math.random() + 10000,
        easing: "linear",
        loop: true,
      });
    }

    //rotate all objects
    rotateAllObjects(object1);
    rotateAllObjects(object2);
    rotateAllObjects(object3);
    rotateAllObjects(object4);
    rotateAllObjects(object5);
    rotateAllObjects(object6);

    //!Dummy Object Starts Here

    // //create dummy object
    const dummyObject = object1.clone();

    //add dummy object to scene
    scene.add(dummyObject);

    //set layer of dummy object to layer 2
    dummyObject.layers.set(1);

    //set later for all objects to layer 1
    root.layers.set(1);

    //add animation to dummy object to rotate around center
    anime({
      targets: dummyObject.position,
      x: 0,
      y: 0,
      z: 10,
      duration: 5000,
      easing: "linear",
    });

    //!Dummy Object Ends Here

    //!Orth Animation Starts Here
    // zoomOrtho(object6);

    //!Test Zoom
    function zoomOrtho(animatingObject) {
      let animationTime = 1000;

      //create a dummy object to animate camera2 zoom
      let camera2Zoom = { value: 1 };

      //animate cameraZoom to 2 using anime
      anime({
        targets: camera2Zoom,
        value: 5,
        duration: animationTime * 1.5,
        easing: "easeInOutQuad",
        update: function () {
          aspect = window.innerWidth / window.innerHeight;

          d2 = defaultDistance / camera2Zoom.value;

          //update camera2 left, right, top, bottom
          camera2.left = -d2 * aspect;
          camera2.right = d2 * aspect;
          camera2.top = d2;
          camera2.bottom = -d2;

          console.log(camera2Zoom.value);

          //update camera2 projection matrix
          camera2.updateProjectionMatrix();
        },
      });

      //get absolute position on screen of animatingObject
      let object1GlobalPosition = animatingObject.getWorldPosition(
        new THREE.Vector3(1, 0, 0)
      );

      //create vector and 1, 1, 0 to object1 position
      let vector = new THREE.Vector3(
        object1GlobalPosition.x + 1,
        object1GlobalPosition.y + 0.2,
        0
      );

      //create a dummy object to animate camera2 lookat
      let camera2LookAt = {
        x: scene.position.x,
        y: scene.position.y,
        z: scene.position.z,
      };

      //animate camera2 lookat to object1 position using anime
      anime({
        targets: camera2LookAt,
        x: vector.x,
        y: vector.y,
        z: vector.z,
        duration: animationTime,
        easing: "easeInOutQuad",
        update: function () {
          //update camera2 lookat
          camera2.lookAt(camera2LookAt.x, camera2LookAt.y, camera2LookAt.z);
        },
      });
    }

    // //get global position of object3
    // let object3GlobalPosition = new THREE.Vector3();
    // object3GlobalPosition.setFromMatrixPosition(object3.matrixWorld);

    //look at object3
    // camera2.lookAt(object3GlobalPosition);

    //!Orth Animation Ends Here

    //Add a light
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
      // ring.rotation.y = Math.PI * 0.2;
      // ring.rotation.x = Math.PI * 0.2;

      //if i is more than 2 then scale it
      if (i > 2) {
        ring.scale.set(1.2, 1, 1);
      }

      moveTheScene(ring);

      rings.push(ring);
      root.add(rings[i]);
    }

    function moveTheScene(object) {
      // //convert to radians
      // let radiansY = (-20 * Math.PI) / 180; // - mouseX/10000;
      // let radiansX = (-70 * Math.PI) / 180; // - mouseY/10000;
      // //set rotation
      // object.rotation.set(radiansX, radiansY, 0);
      // let defaultRootPosition = new THREE.Vector3(-2, 0, 0);
      // //set position
      // object.position.set(defaultRootPosition.x, defaultRootPosition.y, 0);
    }

    //!Orbit Ends here

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

    //!Place Root
    //convert to radians
    let radiansY = (-20 * Math.PI) / 180; // - mouseX/10000;
    let radiansX = (-70 * Math.PI) / 180; // - mouseY/10000;

    //set rotation
    // root.rotation.set(radiansX, radiansY, 0);

    let defaultRootPosition = new THREE.Vector3(-2, 0, 0);

    //set position
    // root.position.set(defaultRootPosition.x, defaultRootPosition.y, 0);

    const target = new THREE.Object3D();
    target.position.set(0, 0, d);

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
    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );

    const renderTarget2 = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );

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

    // Animate the scene
    function animate() {
      requestAnimationFrame(animate);

      //rotate scene

      // //update orthographic camera
      camera.updateProjectionMatrix();

      // // Render the scene
      // renderer.render(scene, camera);

      // renderer.clear();
      renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
      // renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      // renderer.clearDepth();
      // renderer.setRenderTarget(null);
      renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
      renderer.render(scene, camera2);
    }

    animate();

    // Resize the renderer when the parent element size changes
    function onResize() {
      renderer.setSize(parent.clientWidth, parent.clientHeight);
      camera.aspect = parent.clientWidth / parent.clientHeight;
      camera.updateProjectionMatrix();

      //update d and orthographic camera left, right, top, bottom
      d = target.position.z;
      aspect = window.innerWidth / window.innerHeight;

      camera.left = -d * aspect;
      camera.right = d * aspect;
      camera.top = d;
      camera.bottom = -d;
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

export default ThreeScene2Camera;
