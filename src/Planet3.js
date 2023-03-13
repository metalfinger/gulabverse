import React, { useState, useEffect } from "react";
import ShaderCanvas from "@signal-noise/react-shader-canvas";
import gsap from "gsap";

const shader = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec3 lightPos;
uniform float outerGlowIntensity;

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .01
const float PI = 3.14159265359;

float GetDist(vec3 p)
{
    vec4 s = vec4(0., 1., 3.0, 1.);
    
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

// vec3 lightPos = vec3(3, 2, 1);
vec3 ambientColor = vec3(0.1, 0.1, 0.1);

float GetLight(vec3 p) {
    // vec3 lightPos = vec3(2, 4, -3);
    vec3 l = normalize(lightPos-p);
    vec3 n = GetNormal(p);
    
    //start
    // calculate specular contribution
    vec3 r = reflect(-l, n);
    vec3 v = normalize(-p);
    float spec = pow(max(dot(r, v), 0.0), 3.0);
    //end

    float dif = clamp(dot(n, l), 0., 1.);
    float d = RayMarch(p+n*SURF_DIST*2., l);
    if(d<length(lightPos-p)) dif *= .1;
    
    // return spec*dif*0.5 + dif;

    // return spec*dif*0.5 + dif + ambient;
    
    return dif;
}

float GetSpec(vec3 p) {
    // vec3 lightPos = vec3(2, 4, -3);
    vec3 l = normalize(lightPos-p);
    vec3 n = GetNormal(p);
    
    //start
    // calculate specular contribution
    vec3 r = reflect(-l, n);
    vec3 v = normalize(-p);
    float spec = pow(max(dot(r, v), 0.0), 5.0);
    //end

    float dif = clamp(dot(n, l), 0., 1.);
    float d = RayMarch(p+n*SURF_DIST*2., l);
    if(d<length(lightPos-p)) dif *= .1;
    
    return spec*dif*.68;
}

float GetHalo(vec3 p, vec3 rd) {
    vec3 n = GetNormal(p);
    vec3 sphereCenter = vec3(0., 0., 9.);
    float distFromSphere = length(p - sphereCenter) - 1.2;
    float halo = smoothstep(1.0, 0.5, distFromSphere);
    return halo;
}

float cirRadiusInner = 0.355;

float outerGlow(vec2 uv)
{
    float rad = 0.343;
    float radW = 0.001 + 0.03*outerGlowIntensity; 
    float ringWidth = 0.00001;

    //create a circular rim at 0.1
    float rim = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, length(uv));

    rad += ringWidth;

    //create a circle at 0.2
    float circle = smoothstep(rad, rad + radW, length(uv));

    rim *= 1.0 - circle; //subtract the rim from the circle

    // rim = rim * 3.1;

    return rim*0.5;
}

float innerGlow(vec2 uv)
{
    float rad = 0.32;
    float radW = 0.09; //bluriness at border

    //create a circular rim at 0.1
    float rim = smoothstep(rad, rad + radW, length(uv));

    //create a circle at 0.2
    float circle = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, length(uv));

    rim *= 1.0 - circle; //subtract the rim from the circle

    // rim = rim * 3.1;

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
    vec2 sphereUV = vec2(longitude / (1.0 * PI) + 0.5 , latitude / PI);
    // vec2 sphereUV = uv;


    float noiseAmount = 0.4;
    vec2 noiseST = sphereUV * 4000.0;

    vec3 noiseColor = vec3(0.0);
    noiseColor += noise(noiseST) * noiseAmount;


    float outerGlow = outerGlow(uv);
    col = vec3(outerGlow);

    //get the light
    float dif = GetLight(p);

    float ambient = dot(vec3(1.0), ambientColor);

    //create a circle of 0.3
    float circle = smoothstep(cirRadiusInner + 0.002, cirRadiusInner, length(uv));

    dif += circle*0.1;

    float spec = GetSpec(p);

    float halo = GetHalo(p, rd);

    
    dif = dif*(1. - noiseColor.x);


    col += vec3(187.0/255.0,
                46.0/255.0, 
                8.0/255.0) * dif * 1.4;

    float innerGlow = innerGlow(uv);
    
    vec3 innerGlowVar = vec3(120./255.0, 120./255.0, 120./255.0) * innerGlow * .9; 

    col = innerGlowVar + col;

    vec3 specVar = vec3(1.0, 1.0, 1.0) * spec * 1.;

    col = specVar*0.5+ col;

    
    gl_FragColor = vec4(col, col + innerGlow + outerGlow);
    // gl_FragColor = vec4(col, col + innerGlow);
    // gl_FragColor = vec4(col, 1.0);
}   

`;

function Planet3() {
  //useState function
  const [lightposition, setLightposition] = useState({
    x: 2.5,
    y: 2,
    z: -1,
    outerglow: 0.0,
  });
  const [animating, setAnimating] = useState(false);

  const [selected, setSelected] = useState(false);

  let savePosition = {
    x: 2.5,
    y: 2,
    z: -1,
    outerglow: 0.0,
  };

  //useEffect whene position changes
  useEffect(() => {
    // console.log("lightposition", lightposition);
  }, [lightposition]);

  useEffect(() => {
    // console.log("animating", animating);
  }, [animating]);

  function focusOnThis() {
    //if animating, return
    if (animating) return;

    //set animating to true using prev
    setAnimating((prev) => true);

    //set selected to true
    setSelected((prev) => true);

    //define vec3
    let localPosition = lightposition;

    const tl = gsap.to(localPosition, {
      duration: 1.5,
      x: 6,
      y: 5,
      z: 1.5,
      outerglow: 1,
      //ease in out
      ease: "power2.inOut",
      onUpdate: () => {
        setLightposition((prev) => ({
          x: localPosition.x,
          y: localPosition.y,
          z: localPosition.z,
          outerglow: localPosition.outerglow,
        }));
      },
    });

    //when timeline is complete, set animating to false
    tl.eventCallback("onComplete", () => {
      setAnimating((prev) => false);
    });

    //run timeline
    tl.play();

    //add .selectedplanet to .planet3 using js
    document.querySelector(".planet3").classList.add("selectedplanet");
  }

  //focusOffThis function
  function focusOffThis() {
    //if animating, return
    if (animating) return;

    //set animating to true using prev
    setAnimating((prev) => true);

    //set selected to false
    setSelected((prev) => false);

    //define vec3
    let localPosition = lightposition;

    console.log("savePosition", savePosition);

    //create a timeline for position which goes to 10, 0, 0 then back to 0, 1, 0.5
    const tl = gsap.timeline();
    tl.to(localPosition, {
      duration: 2,
      x: savePosition.x,
      y: savePosition.y,
      z: savePosition.z,
      outerglow: savePosition.outerglow,
      //ease in out
      ease: "power2.inOut",
      onUpdate: () => {
        setLightposition((prev) => ({
          x: localPosition.x,
          y: localPosition.y,
          z: localPosition.z,
          outerglow: localPosition.outerglow,
        }));
      },
    });

    //when timeline is complete, set animating to false
    tl.eventCallback("onComplete", () => {
      setAnimating((prev) => false);
    });

    //run timeline
    tl.play();

    //remove .selectedplanet to .planet3 using js
    document.querySelector(".planet3").classList.remove("selectedplanet");
  }

  //when clicked
  function handleClick() {
    //if selected
    if (selected) {
      focusOffThis();
    } else {
      focusOnThis();
    }
  }

  //define handleClick when clicked

  return (
    <div className="planet planet3" onClick={handleClick}>
      <ShaderCanvas
        className="shaderCanvas"
        width={window.innerHeight}
        height={window.innerHeight}
        fragShader={shader}
        uniforms={{
          lightPos: [lightposition.x, lightposition.y, lightposition.z],
          outerGlowIntensity: lightposition.outerglow,
        }}
      />
    </div>
  );
}

export default Planet3;
