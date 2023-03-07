import React, { Component } from 'react'
 
import { createShaderCanvas } from 'react-shader-canvas';
 
const shader = (props) => `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform vec3 color4;

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

float circle(vec2 center, float radius, vec2 st) {
    float cirgrad = length(vec2(st.x, st.y) - center);
    return smoothstep(radius, radius + 0.03, cirgrad);
}


void main() {
    float aspect = u_resolution.y/u_resolution.x;

    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    

    //maintain aspect ratio
    st.y *= u_resolution.y/u_resolution.x;

    st *= 1.0;

    vec2 noiseST = st * 1.1;

    
    float timevar = u_time * .1;
    float grain = random((st * 100.0)) - 0.5;

    // Scale the coordinate system to see
    // some noise in action
    vec2 pos = vec2(noiseST.x*2.0, noiseST.y);// + 5.0 * sin(u_time);
    // Use the noise function
    float n = noise(pos + timevar*0.1);

    vec2 pos1 = vec2(noiseST.x * 2., noiseST.y*2.0);//*500.0 + 500.0 * sin(timevar + PI/4.0));
    // Use the noise function
    float n1 = noise(pos1 + timevar * 2.0);

    vec2 pos2 = vec2(noiseST.x * 1.02, noiseST.y);// + 50.0 * sin(timevar + PI/8.0));
    // Use the noise function
    float n2 = noise(pos2 + timevar * -2.);


    
    n += grain * .0;
    n1 += grain * .0;
    n2 += grain * .0;

    

    vec3 color1 = vec3(0, 0, 0)/255.0;
    vec3 color2 = vec3(0, 0, 0)/255.0;
    vec3 color3 = vec3(216, 69, 27)/255.0;
    vec3 color4 = vec3(216, 69, 27)/255.0;


    vec3 finalColor = mix(mix(mix(color4, color3, n2), color2, n1), color1, n);

    

    finalColor = finalColor;

    gl_FragColor = vec4(finalColor, 1.0);
}
`
 
const ShaderComponent = createShaderCanvas(shader)
 
class MyShaderCanvas extends Component {
  state = {
    timeSync: false
  }
 
  updateState = (e) => this.setState(state => ({ timeSync: !state.timeSync }))
 
  render () {
    return (
      <div onClick={this.updateState}>
        <ShaderComponent id="background" timeSync={this.state.timeSync} />
      </div>
    )
  }
}

export default MyShaderCanvas;