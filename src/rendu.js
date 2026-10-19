// Post-traitement (halo lumineux, étalonnage, aberration chromatique, grain, glitch), reflets d'environnement, qualité.
import {THREE,renderer,scene,camera,pr,on,emit,T,quality} from './core.js';
import {SHADOW_LIGHTS} from './construire.js';

export let composer=null,bloom=null,finalPass=null;
try{
  const gl2=renderer.capabilities.isWebGL2&&!!renderer.extensions.get('EXT_color_buffer_float');
  const rtOpts={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,type:gl2?THREE.HalfFloatType:THREE.UnsignedByteType};
  const rt=gl2&&THREE.WebGLMultisampleRenderTarget?new THREE.WebGLMultisampleRenderTarget(innerWidth,innerHeight,rtOpts):new THREE.WebGLRenderTarget(innerWidth,innerHeight,rtOpts);
  if(rt.samples!==undefined)rt.samples=4;
  composer=new THREE.EffectComposer(renderer,rt);
  composer.setPixelRatio(pr());composer.setSize(innerWidth,innerHeight);
  composer.addPass(new THREE.RenderPass(scene,camera));
  bloom=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.95,.62,.8);composer.addPass(bloom);
  finalPass=new THREE.ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0},res:{value:new THREE.Vector2(innerWidth,innerHeight)},flash:{value:0},alert:{value:0},glitch:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D tDiffuse;uniform float time;uniform vec2 res;uniform float flash;uniform float alert;uniform float glitch;varying vec2 vUv;
      void main(){vec2 uv=vUv;float gt=floor(time*24.),gb=step(.88,fract(sin(floor(uv.y*42.)+gt*7.13)*437.585));uv.x+=glitch*gb*(fract(sin(gt*91.7)*311.3)-.5)*.07;
        vec2 c=uv-.5;float r2=dot(c,c);float ca=.006*r2*2.+glitch*.01;
        vec3 col=vec3(texture2D(tDiffuse,uv+c*ca).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-c*ca).b);
        float l=dot(col,vec3(.2126,.7152,.0722));
        col*=mix(vec3(.9,1.,1.1),vec3(1.08,.98,.84),smoothstep(.04,.7,l));
        col+=vec3(.004,.012,.02)*(1.-smoothstep(0.,.15,l));
        col+=vec3(.5,.55,.7)*flash*.25;
        col=pow(max(col,0.),vec3(1./2.2));
        col=(col-.5)*1.07+.5;
        col=mix(col,col*vec3(1.25,.55,.5),alert*.35);
        col=mix(col,col*vec3(1.3,.55,.5),glitch*.45);
        col*=1.-smoothstep(.2,.9,r2*1.7)*.6;
        float n=fract(sin(dot(uv*res+fract(time)*97.,vec2(12.9898,78.233)))*43758.5453);col+=(n-.5)*.04;
        gl_FragColor=vec4(clamp(col,0.,1.),1.);}`});
  composer.addPass(finalPass);
  renderer.toneMappingExposure=1.25;
}catch(e){composer=null}

function applyQuality(){
  renderer.setPixelRatio(pr());renderer.setSize(innerWidth,innerHeight);
  if(composer){composer.setPixelRatio(pr());composer.setSize(innerWidth,innerHeight)}
  if(finalPass)finalPass.uniforms.res.value.set(innerWidth,innerHeight);
}
on('quality',applyQuality);on('resize',applyQuality);
// Ombres dynamiques en qualité ultra seulement. Mises à jour une fois par image (pas une deuxième fois pour le reflet du sol).
renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
let ombres=null;
on('quality',()=>{const v=quality==='ultra';if(v===ombres)return;ombres=v;renderer.shadowMap.enabled=v;for(const l of SHADOW_LIGHTS)l.castShadow=v;
  scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{m.needsUpdate=true})})});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();emit('resize')});

/* ---------- Environnement (reflets sur métal) : capture de la zone autour d'un point ---------- */
export function buildEnv(pos,hide=[]){
  try{
    const rt=new THREE.WebGLCubeRenderTarget(256,{format:THREE.RGBFormat,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});
    const cc=new THREE.CubeCamera(.3,500,rt);cc.position.copy(pos);scene.add(cc);
    const was=hide.map(o=>o&&o.visible);hide.forEach(o=>{if(o)o.visible=false});
    renderer.shadowMap.needsUpdate=true;cc.update(renderer,scene);
    hide.forEach((o,i)=>{if(o)o.visible=was[i]});
    const pm=new THREE.PMREMGenerator(renderer);const env=pm.fromCubemap(rt.texture).texture;pm.dispose();scene.remove(cc);rt.dispose();
    return env;
  }catch(e){return null}
}
export function render(dt,fx){
  if(finalPass){const u=finalPass.uniforms;u.time.value=T;u.flash.value=fx.flash;u.alert.value=fx.alert;u.glitch.value=fx.glitch}
  renderer.shadowMap.needsUpdate=true;
  if(composer)composer.render(dt);else renderer.render(scene,camera);
}
