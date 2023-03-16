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

float smin(float a, float b, float k)
{
    float h = clamp(0.5+0.5*(b-a)/k, 0.0, 1.0);
    return mix(b, a, h) - k*h*(1.0-h);
}

float smax(float a, float b, float k)
{
    float h = clamp(0.5+0.5*(a-b)/k, 0.0, 1.0);
    return mix(b, a, h) - k*h*(1.0-h);
}



float GetDist(vec3 p)
{
    vec4 s = vec4(0., 1., 5.0, 1.05);
    
    float sphereDist = length(p-s.xyz) - s.w;


    s = vec4(0., 0., 5.0, 1.);    
    float sphereDist2 = length(p-s.xyz) - s.w;

    s = vec4(0., 2., 5.0, 1.);    
    float sphereDist3 = length(p-s.xyz) - s.w;

    
    return smin(smin(sphereDist, sphereDist2, 0.5), sphereDist3, 0.5);
    // return sphereDist;
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

// vec3 lightPos = vec3(-4, 3, 0);
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

float cirRadiusInner = 0.216;

float outerGlow(vec2 uv)
{
    float rad = 0.343;
    float radW = 0.0 + 0.03*outerGlowIntensity;
    float ringWidth = 0.00001;

    //create a circular rim at 0.1
    float rim = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, length(uv));
    //create a circle at 0.2
    float circle = smoothstep(cirRadiusInner, cirRadiusInner + radW, length(uv));
    // rim *= 1.0 - circle; //subtract the rim from the circle

    cirRadiusInner = 0.2056;
    float rim1 = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, length(uv + vec2(0.0, cirRadiusInner + 0.003)));
    float circle1 = smoothstep(cirRadiusInner, cirRadiusInner + radW, length(uv + vec2(0.0, cirRadiusInner + 0.003)));
    // rim1 *= 1.0 - circle1;
    
    cirRadiusInner = 0.2056;
    float rim2 = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, length(uv + vec2(0.0, - cirRadiusInner - 0.005)));
    float circle2 = smoothstep(cirRadiusInner, cirRadiusInner + radW, length(uv + vec2(0.0, - cirRadiusInner - 0.005)));
    // rim2 *= 1.0 - circle2;

    cirRadiusInner = 0.216;
    float cuv = max(abs(uv.x) + smoothstep(0.0, 3.65, abs(uv.y)), abs(uv.y));
    //draw a cylinder from 0.0, -1.0 to 0.0, 1.0 with radius cirRadiusInner
    float cylinder = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, cuv);

    float cylindercircle = smoothstep(cirRadiusInner, cirRadiusInner + radW, cuv);
    // cylinder *= 1.0 - cylindercircle;


    rim = smin(smin(rim2, rim1, 0.), cylinder, 0.);

    rim *= 1.0 - smin(smin(circle1, circle2, 0.), cylindercircle, 0.);
    
    return rim*.5;
}

float innerGlow(vec2 uv)
{
    float rad = 0.343;
    float radW = 0.039; //bluriness at border
    float ringWidth = 0.03;

    //create a circular rim at 0.1
    float rim = smoothstep(cirRadiusInner, cirRadiusInner + radW, length(uv));
    //create a circle at 0.2
    float circle = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, length(uv));
    // rim *= 1.0 - circle; //subtract the rim from the circle

    cirRadiusInner = 0.206;
    float rim1 = smoothstep(cirRadiusInner - ringWidth + radW, cirRadiusInner - ringWidth, length(uv + vec2(0.0, cirRadiusInner + 0.003)));
    float circle1 = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, length(uv + vec2(0.0, cirRadiusInner + 0.003)));
    // rim1 *= 1.0 - circle1;
    
    cirRadiusInner = 0.206;
    float rim2 = smoothstep(cirRadiusInner - ringWidth + radW, cirRadiusInner - ringWidth, length(uv + vec2(0.0, - cirRadiusInner - 0.007)));
    float circle2 = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, length(uv + vec2(0.0, - cirRadiusInner - 0.008)));
    // rim2 *= 1.0 - circle2;

    cirRadiusInner = 0.216;
    float cuv = max(abs(uv.x) + smoothstep(0.0, 3.65, abs(uv.y)), abs(uv.y)-0.016);

    //draw a cylinder from 0.0, -1.0 to 0.0, 1.0 with radius cirRadiusInner
    float cylinder = smoothstep(cirRadiusInner - ringWidth + radW, cirRadiusInner - ringWidth, cuv);

    float cylindercircle = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, cuv);
    // cylinder *= 1.0 - cylindercircle;


    rim = 1.0 - smax(smax(cylinder, rim1, 0.), rim2, 0.);

    circle = 1.0 - smin(smin(circle1, circle2, 0.), cylindercircle, 0.);

    circle = rim*circle;
    
    return circle*.8;
}

float ambientManual(vec2 uv)
{
    float rad = 0.343;
    float radW = 0.031; //bluriness at border
    float ringWidth = 0.03;

    //create a circular rim at 0.1
    float rim = smoothstep(cirRadiusInner, cirRadiusInner + radW, length(uv));
    //create a circle at 0.2
    float circle = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, length(uv));
    // rim *= 1.0 - circle; //subtract the rim from the circle

    cirRadiusInner = 0.2055;
    float rim1 = smoothstep(cirRadiusInner - ringWidth + radW, cirRadiusInner - ringWidth, length(uv + vec2(0.0, cirRadiusInner + 0.003)));
    float circle1 = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, length(uv + vec2(0.0, cirRadiusInner + 0.003)));
    // rim1 *= 1.0 - circle1;
    
    cirRadiusInner = 0.2055;
    float rim2 = smoothstep(cirRadiusInner - ringWidth + radW, cirRadiusInner - ringWidth, length(uv + vec2(0.0, - cirRadiusInner - 0.008)));
    float circle2 = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, length(uv + vec2(0.0, - cirRadiusInner - 0.008)));
    // rim2 *= 1.0 - circle2;

    cirRadiusInner = 0.216;
    float cuv = max(abs(uv.x) + smoothstep(0.0, 3.65, abs(uv.y)), abs(uv.y)-0.016);

    //draw a cylinder from 0.0, -1.0 to 0.0, 1.0 with radius cirRadiusInner
    float cylinder = smoothstep(cirRadiusInner - ringWidth + radW, cirRadiusInner - ringWidth, cuv);

    float cylindercircle = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, cuv);
    // cylinder *= 1.0 - cylindercircle;


    rim = smax(smax(cylinder, rim1, 0.), rim2, 0.);

    circle = 1.0 - smin(smin(circle1, circle2, 0.), cylindercircle, 0.);

    circle = rim*circle;
    
    return circle;
}

float innerGlow1(vec2 uv)
{
    float rad = 0.32;
    float radW = 0.09; //bluriness at border

    //create a circular rim at 0.1
    float rim = smoothstep(rad, rad + radW, length(uv));

    float rim1 = smoothstep(rad, rad + radW, length(uv + vec2(0.101, 0.101)));

    //create a circle at 0.2
    float circle = smoothstep(cirRadiusInner, cirRadiusInner + 0.002, length(uv));

    rim *= 1.0 - circle; 

    return rim;
    // return smin(rim, rim1, 0.5);
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

    //rotate uv by 3 degrees
    float angle = 3.0 * PI / 180.0;
    uv = vec2(uv.x * cos(angle) - uv.y * sin(angle), uv.x * sin(angle) + uv.y * cos(angle));

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
    col = vec3(outerGlow); //hiren

    //get the light
    float dif = GetLight(p);

    
    dif += ambientManual(uv)*0.2; //hiren - ambient

    float spec = GetSpec(p);

    
    dif = dif*(1. - noiseColor.x); //hiren


    col += vec3(187.0/255.0,
                46.0/255.0, 
                8.0/255.0) * dif * 1.4;

    float innerGlow = innerGlow(uv);
    
    vec3 innerGlowVar = vec3(120./255.0, 120./255.0, 120./255.0) * innerGlow * .5; 

    col = innerGlowVar + col;//hiren

    //create noise for the circle
    float noiseAmountCircle = 0.4;
    vec2 noiseSTCircle = sphereUV * 100.0;

    vec3 noiseColorCircle = vec3(0.0);
    noiseColorCircle += noise(noiseSTCircle) * noiseAmountCircle;

    vec3 specVar = vec3(0.7608, 0.7608, 0.7608) * spec * noise(noiseSTCircle) * 1.;

    col = specVar*0.5+ col; //hiren

    // col = vec3(circle*0.3*noise(noiseSTCircle));
    // col = specVar;

    
    gl_FragColor = vec4(col, col + innerGlow + outerGlow);
    // gl_FragColor = vec4(col, col + innerGlow);

    // col = vec3(ambientManual(uv));
    
    // gl_FragColor = vec4(col, 1.0);
}   


`;

function Planet4() {
  //useState function
  const [lightposition, setLightposition] = useState({
    x: -4,
    y: 3,
    z: 1.5,
    outerglow: 0.0,
  });
  const [animating, setAnimating] = useState(false);

  const [selected, setSelected] = useState(false);

  let savePosition = {
    x: -4,
    y: 3,
    z: 1.5,
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
      x: 5,
      y: 9,
      z: -2.5,
      outerglow: 0.5,
      //ease in out
      // ease: "power2.inOut",
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
    document.querySelector(".planet4").classList.add("selectedplanet");
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

    //create a timeline for position which goes to 10, 0, 0 then back to 0, 1, 0.5
    const tl = gsap.timeline();
    tl.to(localPosition, {
      duration: 2,
      x: savePosition.x,
      y: savePosition.y,
      z: savePosition.z,
      //ease in out
      // ease: "power2.inOut",
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
    document.querySelector(".planet4").classList.remove("selectedplanet");
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
    <div className="planet planet4" onClick={handleClick}>
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

export default Planet4;
