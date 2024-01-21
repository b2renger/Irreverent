/* global AFRAME, THREE */

// shader-grid-glitch.js

AFRAME.registerShader('grid-glitch', {
    schema: {
      
      timeMsec: { type: 'time', is: 'uniform' },
      
      offset: { type: 'float', is: 'uniform' }
    },
  
    vertexShader: `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
  `,
    fragmentShader: `
  
  #define PI 3.1415926535897932384626433832795
  
  varying vec2 vUv;
  uniform float timeMsec;
   float resX = 2.;
   float resY = 2.;
  uniform float offset;
  
  
  ///////////////////////////////////////////////////////////////////
  //	Simplex 3D Noise 
  //	by Ian McEwan, Ashima Arts
  //
  vec4 permuteS(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  
  float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  
  // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;
  
  // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
  
    //  x0 = x0 - 0. + 0.0 * C 
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;
  
  // Permutations
    i = mod(i, 289.0 ); 
    vec4 p = permuteS( permuteS( permuteS( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  
  // Gradients
  // ( N*N points uniformly over a square, mapped onto an octahedron.)
    float n_ = 1.0/7.0; // N=7
    vec3  ns = n_ * D.wyz - D.xzx;
  
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)
  
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
  
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
  
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
  
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
  
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
  
  //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
  
  // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }
  ///////////////////////////////////////////////////////////////////
  //	Classic Perlin 2D Noise
  //	by Stefan Gustavson
  vec2 fade(vec2 t)
  {
      return t*t*t*(t*(t*6.-15.)+10.);
  }
  vec4 permute(vec4 x)
  {
      return mod(((x*34.)+1.)*x,289.);
  }
  float cnoise(vec2 P)
  {
      vec4 Pi=floor(P.xyxy)+vec4(0.,0.,1.,1.);
      vec4 Pf=fract(P.xyxy)-vec4(0.,0.,1.,1.);
      Pi=mod(Pi,289.);// To avoid truncation effects in permutation
      vec4 ix=Pi.xzxz;
      vec4 iy=Pi.yyww;
      vec4 fx=Pf.xzxz;
      vec4 fy=Pf.yyww;
      vec4 i=permute(permute(ix)+iy);
      vec4 gx=2.*fract(i*.0243902439)-1.;// 1/41 = 0.024...
      vec4 gy=abs(gx)-.5;
      vec4 tx=floor(gx+.5);
      gx=gx-tx;
      vec2 g00=vec2(gx.x,gy.x);
      vec2 g10=vec2(gx.y,gy.y);
      vec2 g01=vec2(gx.z,gy.z);
      vec2 g11=vec2(gx.w,gy.w);
      vec4 norm=1.79284291400159-.85373472095314*vec4(dot(g00,g00),dot(g01,g01),dot(g10,g10),dot(g11,g11));
      g00*=norm.x;
      g01*=norm.y;
      g10*=norm.z;
      g11*=norm.w;
      float n00=dot(g00,vec2(fx.x,fy.x));
      float n10=dot(g10,vec2(fx.y,fy.y));
      float n01=dot(g01,vec2(fx.z,fy.z));
      float n11=dot(g11,vec2(fx.w,fy.w));
      vec2 fade_xy=fade(Pf.xy);
      vec2 n_x=mix(vec2(n00,n01),vec2(n10,n11),fade_xy.x);
      float n_xy=mix(n_x.x,n_x.y,fade_xy.y);
      return 2.3*n_xy;
  }
  //////////////////////////////////////////////////////////////////////
  // Classic random from threejs journey
  float random(vec2 st)
  {
      return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
  }
  ////////////////////////////////////////////////////////////////////
  // rotate uv around a point from threejs journey
  vec2 rotate(vec2 uv,float rotation,vec2 mid)
  {
      return vec2(
          cos(rotation)*(uv.x-mid.x)+sin(rotation)*(uv.y-mid.y)+mid.x,
          cos(rotation)*(uv.y-mid.y)-sin(rotation)*(uv.x-mid.x)+mid.y
      );
  }
  
  
  
  ////////////////////////////////////////////////////////////////////
  // main
  
  
  void main()
  {
      float uTime = timeMsec / 9000.0; 
      vec3 uvColor=vec3(vUv,1.);
      float strength = step(0., snoise(vec3(vUv.x * resX , vUv.y*resY,  uTime + offset )));
      //strength +=  1.0 - abs(snoise(vec3(vUv.x * resX*1.,vUv.y*resY*1., uTime + offset ))); // cheap caustics
  
  
    float lineWidth = 0.01;
    float alpha = 0.2;
    
    if(vUv.x < lineWidth){
     strength = 1.;
     alpha =1.;
    }
    if(vUv.x > (1. - lineWidth)){
     strength = 1.;
     alpha =1.;
    }
    if(vUv.y < lineWidth){
     strength = 1.;
     alpha =1.;
    }
    if(vUv.y > (1.- lineWidth)){
     strength = 1.;
     alpha =1.;
    }
    if (strength == 0.0){
      alpha = 0.;
    }
    
   
      
      gl_FragColor=vec4(vec3(strength), alpha );
  }
    
  `
  });
  