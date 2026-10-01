'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type Props = { accents: string[]; darkLine?: boolean; onDetailChange?: (open: boolean) => void };
type LiveState = { aromaLayers: THREE.Mesh[]; targetColors: THREE.Color[]; smoke: THREE.Sprite[]; smokeBase: THREE.Color };
const neutral = new THREE.Color('#9ca8a2');

function roundedRectangle(width: number, depth: number, radius: number) {
  const x = -width / 2, y = -depth / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y); shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + depth - radius);
  shape.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
  shape.lineTo(x + radius, y + depth);
  shape.quadraticCurveTo(x, y + depth, x, y + depth - radius);
  shape.lineTo(x, y + radius); shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function textTexture(text: string, color: string, wide = false) {
  const canvas = document.createElement('canvas');
  canvas.width = wide ? 1024 : 512; canvas.height = 256;
  const context = canvas.getContext('2d');
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.font = `${wide ? 52 : 78}px "Helvetica Neue", Arial, sans-serif`;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function HookahEducation3D({ accents, darkLine = false, onDetailChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef({ zoomIn: () => {}, zoomOut: () => {}, reset: () => {} });
  const [zoomLabel, setZoomLabel] = useState(100);
  const live = useRef<LiveState>({ aromaLayers: [], targetColors: [], smoke: [], smokeBase: new THREE.Color('#c9ceca') });
  live.current.targetColors = accents.map(value => new THREE.Color(value));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    live.current.targetColors = accents.map(value => new THREE.Color(value));
    const mobile = matchMedia('(max-width: 700px), (pointer: coarse)').matches;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(27, 1, .1, 40);
    camera.position.set(0, 1.25, 8.6);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = darkLine ? 1.18 : 1.08;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const environmentCanvas = document.createElement('canvas');
    environmentCanvas.width = 1024; environmentCanvas.height = 512;
    const context = environmentCanvas.getContext('2d');
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#f2eee7'); gradient.addColorStop(.48, '#a7a19a'); gradient.addColorStop(1, '#484a47');
      context.fillStyle = gradient; context.fillRect(0, 0, 1024, 512);
      [[72,42,135,330],[392,22,210,350],[748,62,96,300],[928,38,38,340]].forEach(([x,y,w,h], i) => {
        context.fillStyle = `rgba(255,252,245,${.94 - i * .08})`; context.fillRect(x,y,w,h);
      });
    }
    const environmentTexture = new THREE.CanvasTexture(environmentCanvas);
    environmentTexture.mapping = THREE.EquirectangularReflectionMapping; environmentTexture.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromEquirectangular(environmentTexture);
    scene.environment = environment.texture;

    const model = new THREE.Group();
    model.position.set(0, -1.28, 0); model.rotation.y = -.18; scene.add(model);
    const brushedCanvas=document.createElement('canvas');brushedCanvas.width=256;brushedCanvas.height=256;
    const brushedContext=brushedCanvas.getContext('2d');
    if(brushedContext){const image=brushedContext.createImageData(256,256);for(let y=0;y<256;y+=1){const band=128+Math.sin(y*.43)*13+Math.sin(y*2.1)*5;for(let x=0;x<256;x+=1){const noise=(Math.random()-.5)*16;const value=Math.max(72,Math.min(205,band+noise));const offset=(y*256+x)*4;image.data[offset]=value;image.data[offset+1]=value;image.data[offset+2]=value;image.data[offset+3]=255}}brushedContext.putImageData(image,0,0)}
    const brushedTexture=new THREE.CanvasTexture(brushedCanvas);brushedTexture.wrapS=brushedTexture.wrapT=THREE.RepeatWrapping;brushedTexture.repeat.set(2,5);
    const brushedSteel = new THREE.MeshPhysicalMaterial({ color: darkLine ? 0x817c75 : 0x9a9186, metalness: .94, roughness: .27, roughnessMap:brushedTexture, clearcoat: .16, clearcoatRoughness: .34, envMapIntensity: 1.3, anisotropy:.55 });
    const edgeSteel = new THREE.MeshPhysicalMaterial({ color: 0x696560, metalness: .97, roughness: .17, clearcoat: .28, envMapIntensity: 1.48, anisotropy:.28 });
    const blackMetal = new THREE.MeshPhysicalMaterial({ color: 0x151817, metalness: .32, roughness: .61, clearcoat: .1 });
    const rubber = new THREE.MeshPhysicalMaterial({ color: 0x101211, roughness: .8, clearcoat: .05 });
    const recess = new THREE.MeshStandardMaterial({ color: 0x252724, metalness: .5, roughness: .62 });
    const amberGlass = new THREE.MeshPhysicalMaterial({ color: 0xd5d8d5, roughness: .09, transmission: .62, transparent: true, opacity: .3, thickness: .14, clearcoat: .38, side: THREE.DoubleSide });
    const add = (mesh: THREE.Mesh, parent: THREE.Object3D = model) => { mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh };
    const cylinder = (top:number,bottom:number,height:number,material:THREE.Material,segments=48) => new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,segments),material);
    const torus = (radius:number,tube:number,material:THREE.Material,radial=12,tubular=64) => new THREE.Mesh(new THREE.TorusGeometry(radius,tube,radial,tubular),material);

    // MR. EDS station platform from the venue references.
    const baseGeometry = new THREE.ExtrudeGeometry(roundedRectangle(3.62,2.24,.24), { depth:.25, bevelEnabled:true, bevelSegments:3, bevelSize:.055, bevelThickness:.055, curveSegments:8 });
    baseGeometry.rotateX(-Math.PI/2);
    const base = add(new THREE.Mesh(baseGeometry,brushedSteel)); base.position.y=.02;
    const insetGeometry = new THREE.ExtrudeGeometry(roundedRectangle(3.38,2.02,.17), { depth:.035, bevelEnabled:true, bevelSegments:2, bevelSize:.025, bevelThickness:.016 });
    insetGeometry.rotateX(-Math.PI/2);
    const inset = add(new THREE.Mesh(insetGeometry,edgeSteel)); inset.position.y=.31;
    [[-1.53,-.86],[1.53,-.86],[-1.53,.86],[1.53,.86]].forEach(([x,z]) => {
      const screw=add(cylinder(.055,.055,.025,edgeSteel,24)); screw.position.set(x,.375,z);
      const slot=add(new THREE.Mesh(new THREE.BoxGeometry(.065,.009,.012),recess)); slot.position.set(x,.391,z);
      const foot=add(cylinder(.09,.105,.08,rubber,28)); foot.position.set(x,-.025,z);
    });

    const grilleWell=add(cylinder(.57,.57,.025,recess,72)); grilleWell.position.set(-.82,.38,.05);
    for(let i=-5;i<=5;i+=1){const half=Math.sqrt(Math.max(0,.49**2-(i*.078)**2));const rib=add(new THREE.Mesh(new THREE.BoxGeometry(half*2,.018,.033),edgeSteel));rib.position.set(-.82,.407,.05+i*.078)}
    const grilleRing=add(torus(.58,.035,brushedSteel)); grilleRing.rotation.x=Math.PI/2; grilleRing.position.set(-.82,.414,.05);

    const chamber=add(cylinder(.55,.55,1.62,brushedSteel,72)); chamber.position.set(.62,1.18,-.12);
    const chamberFoot=add(torus(.53,.026,edgeSteel)); chamberFoot.rotation.x=Math.PI/2; chamberFoot.position.set(.62,.385,-.12);
    const chamberCap=add(cylinder(.57,.55,.1,edgeSteel,72)); chamberCap.position.set(.62,2.01,-.12);
    const capSeam=add(torus(.555,.018,brushedSteel)); capSeam.rotation.x=Math.PI/2; capSeam.position.set(.62,1.94,-.12);
    const purgeSocket=add(cylinder(.07,.1,.22,edgeSteel,36)); purgeSocket.rotation.z=Math.PI/2; purgeSocket.position.set(1.2,1.65,-.12);
    const purgeButton=add(cylinder(.055,.07,.09,blackMetal,32)); purgeButton.rotation.z=Math.PI/2; purgeButton.position.set(1.34,1.65,-.12);

    // Use the actual brand artwork as a restrained laser etching, rather than
    // approximating the wordmark with a system font.
    const zoiTexture=new THREE.TextureLoader().load('/logo.webp');
    zoiTexture.colorSpace=THREE.SRGBColorSpace;
    const zoiMark=new THREE.Mesh(new THREE.PlaneGeometry(.31,.31),new THREE.MeshBasicMaterial({map:zoiTexture,transparent:true,opacity:.62,depthWrite:false,toneMapped:false}));
    zoiMark.position.set(.62,1.13,.441); model.add(zoiMark);
    const baseLabelTexture=textTexture('IRONMAN  PRO  X  MAX','rgba(35,35,32,.68)',true);
    const baseLabel=new THREE.Mesh(new THREE.PlaneGeometry(1.26,.23),new THREE.MeshBasicMaterial({map:baseLabelTexture,transparent:true,depthWrite:false,toneMapped:false}));
    baseLabel.rotation.x=-Math.PI/2; baseLabel.position.set(.67,.424,.74); model.add(baseLabel);

    const neck=add(cylinder(.25,.3,.28,blackMetal,56)); neck.position.set(.62,2.23,-.12);
    const neckCollar=add(cylinder(.32,.35,.11,edgeSteel,64)); neckCollar.position.set(.62,2.08,-.12);
    const aromaGlass=add(cylinder(.385,.385,.5,amberGlass,64)); aromaGlass.position.set(.62,2.47,-.12); aromaGlass.visible=false;
    const aromaLayers:THREE.Mesh[]=[];
    const aromaConnector=add(cylinder(.245,.245,.45,blackMetal,48)); aromaConnector.position.set(.62,2.575,-.12);
    for(let i=0;i<2;i+=1){const initialColor=new THREE.Color(accents[i]||neutral);const selected=Boolean(accents[i]);const material=new THREE.MeshPhysicalMaterial({color:initialColor,roughness:.22,metalness:.04,transmission:.08,transparent:true,opacity:selected?.92:0,emissive:initialColor.clone(),emissiveIntensity:.2,clearcoat:.45,clearcoatRoughness:.18});const layer=add(cylinder(.355,.355,.135,material,64));layer.position.set(.62,2.72-i*.165,-.12);layer.scale.y=selected?1:.001;layer.userData.layer=i;const rimMaterial=new THREE.MeshPhysicalMaterial({color:initialColor.clone().offsetHSL(0,.03,.12),metalness:.12,roughness:.18,transparent:true,opacity:.88,clearcoat:.5});[-.067,.067].forEach(y=>{const rim=add(torus(.355,.012,rimMaterial,10,64),layer);rim.rotation.x=Math.PI/2;rim.position.y=y});aromaLayers.push(layer)}
    live.current.aromaLayers=aromaLayers;

    const hmdBody=add(cylinder(.43,.36,.42,blackMetal,64)); hmdBody.position.set(.62,3.01,-.12);
    for(let i=0;i<4;i+=1){const rib=add(torus(.395+i*.006,.027,blackMetal));rib.rotation.x=Math.PI/2;rib.position.set(.62,2.87+i*.085,-.12)}
    const guard=add(torus(.47,.035,edgeSteel,12,72)); guard.rotation.x=Math.PI/2; guard.position.set(.62,3.18,-.12);
    const lid=add(new THREE.Mesh(new THREE.SphereGeometry(.39,64,24,0,Math.PI*2,0,Math.PI/2),blackMetal)); lid.scale.y=.28; lid.position.set(.62,3.2,-.12);
    for(let i=0;i<7;i+=1){const angle=i/7*Math.PI*2;const vent=add(new THREE.Mesh(new THREE.CapsuleGeometry(.035,.12,4,12),recess));vent.scale.set(1,1,.32);vent.rotation.set(Math.PI/2,0,-angle);vent.position.set(.62+Math.cos(angle)*.2,3.315,-.12+Math.sin(angle)*.2)}
    const hmdLabelTexture=textTexture('SMOKE GAME','rgba(226,222,211,.9)',true);
    const hmdLabel=new THREE.Mesh(new THREE.PlaneGeometry(.48,.12),new THREE.MeshBasicMaterial({map:hmdLabelTexture,transparent:true,depthWrite:false,toneMapped:false})); hmdLabel.position.set(.62,2.98,.307); model.add(hmdLabel);
    [-.12,.12].forEach(offset=>{const lidGrip=add(new THREE.Mesh(new THREE.BoxGeometry(.13,.035,.045),edgeSteel));lidGrip.position.set(.62+offset,3.325,-.12);lidGrip.rotation.y=.18});

    const socket=add(cylinder(.12,.15,.32,edgeSteel,40)); socket.rotation.z=Math.PI/2; socket.position.set(.01,1.3,-.12);
    const grommet=add(cylinder(.1,.11,.18,rubber,36)); grommet.rotation.z=Math.PI/2; grommet.position.set(-.19,1.3,-.12);
    const hoseCurve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(-.27,1.3,-.12),new THREE.Vector3(-.75,1.56,-.23),new THREE.Vector3(-1.62,1.88,-.35),
      new THREE.Vector3(-2.08,1.36,-.2),new THREE.Vector3(-2.12,.72,.04),new THREE.Vector3(-1.72,.48,.44),
      new THREE.Vector3(-1.29,.75,.67),new THREE.Vector3(-1.27,.97,.67),
    ],false,'centripetal');
    add(new THREE.Mesh(new THREE.TubeGeometry(hoseCurve,mobile?84:120,.078,12,false),rubber));
    const helixPoints:THREE.Vector3[]=[];
    for(let i=0;i<=92;i+=1){const t=i/92;const center=hoseCurve.getPointAt(t*.15);const tangent=hoseCurve.getTangentAt(t*.15).normalize();const normal=new THREE.Vector3(0,1,0).cross(tangent).normalize();const binormal=tangent.clone().cross(normal).normalize();const angle=t*Math.PI*18;center.add(normal.multiplyScalar(Math.cos(angle)*.092));center.add(binormal.multiplyScalar(Math.sin(angle)*.092));helixPoints.push(center)}
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPoints),100,.009,6,false),edgeSteel));

    const holder=add(cylinder(.14,.16,.17,edgeSteel,40)); holder.position.set(-1.27,.48,.67);
    const handleFerrule=add(cylinder(.105,.09,.2,edgeSteel,40)); handleFerrule.position.set(-1.27,.87,.67);
    const grip=add(cylinder(.1,.085,.72,rubber,40)); grip.position.set(-1.27,1.31,.67);
    const gripTop=add(cylinder(.105,.1,.13,edgeSteel,40)); gripTop.position.set(-1.27,1.73,.67);
    const mouthpiece=add(cylinder(.055,.09,.58,brushedSteel,40)); mouthpiece.position.set(-1.27,2.08,.67);
    const mouthTip=add(torus(.055,.012,edgeSteel,10,36)); mouthTip.rotation.x=Math.PI/2; mouthTip.position.set(-1.27,2.37,.67);
    const tongStem=add(new THREE.Mesh(new THREE.BoxGeometry(.055,1.18,.07),edgeSteel)); tongStem.position.set(-.12,.94,.64); tongStem.rotation.z=-.045;
    const tongJawA=add(new THREE.Mesh(new THREE.BoxGeometry(.05,.38,.055),edgeSteel)); tongJawA.position.set(-.19,1.64,.64); tongJawA.rotation.z=.35;
    const tongJawB=add(new THREE.Mesh(new THREE.BoxGeometry(.05,.38,.055),edgeSteel)); tongJawB.position.set(-.05,1.64,.64); tongJawB.rotation.z=-.35;

    const smokeCanvas=document.createElement('canvas'); smokeCanvas.width=96; smokeCanvas.height=192;
    const smokeContext=smokeCanvas.getContext('2d');
    if(smokeContext){const puff=smokeContext.createRadialGradient(48,105,4,48,96,68);puff.addColorStop(0,'rgba(255,255,255,.72)');puff.addColorStop(.38,'rgba(255,255,255,.26)');puff.addColorStop(1,'rgba(255,255,255,0)');smokeContext.fillStyle=puff;smokeContext.fillRect(0,0,96,192)}
    const smokeTexture=new THREE.CanvasTexture(smokeCanvas);
    const smokeBase=darkLine?new THREE.Color('#dbe2dd'):new THREE.Color('#87948d');
    const smoke:THREE.Sprite[]=[];
    const smokeCount=mobile?11:15;
    for(let i=0;i<smokeCount;i+=1){const material=new THREE.SpriteMaterial({map:smokeTexture,color:smokeBase.clone(),transparent:true,opacity:0,depthWrite:false});const sprite=new THREE.Sprite(material);sprite.userData.life=i/smokeCount;sprite.userData.seed=i*2.17+Math.random();sprite.userData.speed=.0027+(i%4)*.00035;scene.add(sprite);smoke.push(sprite)}
    live.current.smoke=smoke; live.current.smokeBase=smokeBase;

    const floor=new THREE.Mesh(new THREE.CircleGeometry(2.5,72),new THREE.ShadowMaterial({color:0x263b35,transparent:true,opacity:darkLine?.25:.14}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.28;floor.receiveShadow=true;scene.add(floor);
    const contactShadow=new THREE.Mesh(new THREE.CircleGeometry(1.75,72),new THREE.MeshBasicMaterial({color:0x18342d,transparent:true,opacity:darkLine?.13:.055,depthWrite:false}));contactShadow.rotation.x=-Math.PI/2;contactShadow.scale.set(1,.48,1);contactShadow.position.set(.05,-1.275,.04);scene.add(contactShadow);
    scene.add(new THREE.HemisphereLight(0xffffff,darkLine?0x242b28:0x8b938e,2.2));
    const key=new THREE.DirectionalLight(0xfff8ed,5.2);key.position.set(4.5,7,5.5);key.castShadow=true;key.shadow.mapSize.set(mobile?512:1024,mobile?512:1024);scene.add(key);
    const rim=new THREE.DirectionalLight(0xbdd7cf,3.1);rim.position.set(-5,3.5,-3);scene.add(rim);
    const warm=new THREE.PointLight(0xffc39d,9,11,2);warm.position.set(2.8,1.2,3.5);scene.add(warm);

    let defaultDistance=8.6,targetDistance=defaultDistance,userZoomed=false,targetYaw=model.rotation.y,targetPitch=0,yawVelocity=0,pitchVelocity=0;
    let targetLookY=.38,currentLookY=.38,detailView=false;
    const minZoom=()=>defaultDistance*.56,maxZoom=()=>defaultDistance*1.28;
    const reportZoom=()=>{setZoomLabel(Math.round(defaultDistance/targetDistance*100));onDetailChange?.(targetDistance<defaultDistance*.86)};
    const setDistance=(value:number)=>{targetDistance=THREE.MathUtils.clamp(value,minZoom(),maxZoom());userZoomed=Math.abs(targetDistance-defaultDistance)>.08;reportZoom()};
    const resetView=()=>{targetYaw=-.18;targetPitch=0;targetLookY=.38;detailView=false;yawVelocity=0;pitchVelocity=0;targetDistance=defaultDistance;userZoomed=false;reportZoom()};
    controlsRef.current={zoomIn:()=>setDistance(targetDistance*.86),zoomOut:()=>setDistance(targetDistance*1.16),reset:resetView};
    const resize=()=>{const bounds=host.getBoundingClientRect();const width=Math.max(bounds.width,1),height=Math.max(bounds.height,1);renderer.setSize(width,height,false);camera.aspect=width/height;const next=camera.aspect<.78?13.3:camera.aspect>1.35?8.25:8.65;if(!userZoomed)targetDistance=next;defaultDistance=next;camera.updateProjectionMatrix();reportZoom()};
    const observer=new ResizeObserver(resize);observer.observe(host);resize();

    const raycaster=new THREE.Raycaster();
    const tapPoint=new THREE.Vector2();
    const pointers=new Map<number,{x:number;y:number}>();let lastSingle={x:0,y:0},gestureStart={x:0,y:0},pinchDistance=0,pinchCamera=targetDistance,lastInteraction=performance.now();
    const pointerGap=()=>{const values=[...pointers.values()];return values.length>1?Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y):0};
    const onDown=(event:PointerEvent)=>{lastInteraction=performance.now();pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});renderer.domElement.setPointerCapture(event.pointerId);if(pointers.size===1){lastSingle={x:event.clientX,y:event.clientY};gestureStart={...lastSingle};yawVelocity=0;pitchVelocity=0}else if(pointers.size===2){pinchDistance=pointerGap();pinchCamera=targetDistance}};
    const onMove=(event:PointerEvent)=>{if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size===2){const gap=pointerGap();if(pinchDistance>0&&gap>0)setDistance(pinchCamera*pinchDistance/gap);return}const dx=event.clientX-lastSingle.x,dy=event.clientY-lastSingle.y;yawVelocity=dx*.007;pitchVelocity=dy*.0035;targetYaw+=yawVelocity;targetPitch=THREE.MathUtils.clamp(targetPitch+pitchVelocity,-.14,.12);lastSingle={x:event.clientX,y:event.clientY}};
    const onUp=(event:PointerEvent)=>{const point=pointers.get(event.pointerId);pointers.delete(event.pointerId);if(pointers.size===1)lastSingle={...[...pointers.values()][0]};if(point&&Math.hypot(point.x-gestureStart.x,point.y-gestureStart.y)<8){if(detailView){resetView();return}const rect=renderer.domElement.getBoundingClientRect();tapPoint.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(tapPoint,camera);const hit=raycaster.intersectObject(model,true).find(entry=>entry.object.visible);if(hit){detailView=true;targetLookY=THREE.MathUtils.clamp(hit.point.y,-.35,1.72);setDistance(defaultDistance*.61)}}};
    const onWheel=(event:WheelEvent)=>{event.preventDefault();setDistance(targetDistance*(event.deltaY>0?1.08:.92))};
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='ArrowLeft')targetYaw-=.3;if(event.key==='ArrowRight')targetYaw+=.3;if(event.key==='ArrowUp')targetPitch=THREE.MathUtils.clamp(targetPitch-.07,-.14,.12);if(event.key==='ArrowDown')targetPitch=THREE.MathUtils.clamp(targetPitch+.07,-.14,.12);if(event.key==='+'||event.key==='=')controlsRef.current.zoomIn();if(event.key==='-'||event.key==='_')controlsRef.current.zoomOut();if(event.key==='0'||event.key==='Escape')resetView()};
    renderer.domElement.style.touchAction='none';renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointermove',onMove);renderer.domElement.addEventListener('pointerup',onUp);renderer.domElement.addEventListener('pointercancel',onUp);renderer.domElement.addEventListener('wheel',onWheel,{passive:false});host.addEventListener('keydown',onKeyDown);

    let frame=0,running=true;const scratch=new THREE.Color(),emitter=new THREE.Vector3();
    const render=()=>{if(!running)return;frame=requestAnimationFrame(render);if(pointers.size===0&&!reduceMotion){yawVelocity*=.92;pitchVelocity*=.86;targetYaw+=yawVelocity;if(!detailView&&performance.now()-lastInteraction>2400)targetYaw+=.00055;targetPitch=THREE.MathUtils.clamp(targetPitch+pitchVelocity,-.14,.12)}model.rotation.y+=(targetYaw-model.rotation.y)*.09;model.rotation.x+=(targetPitch-model.rotation.x)*.09;camera.position.z=THREE.MathUtils.lerp(camera.position.z,targetDistance,.09);camera.position.y=THREE.MathUtils.lerp(camera.position.y,1.15+(defaultDistance-targetDistance)*.07,.08);currentLookY=THREE.MathUtils.lerp(currentLookY,targetLookY,.1);camera.lookAt(0,currentLookY,0);
      const state=live.current;state.aromaLayers.forEach((layer,i)=>{const visible=i<state.targetColors.length;const material=layer.material as THREE.MeshStandardMaterial;layer.scale.y=THREE.MathUtils.lerp(layer.scale.y,visible?1:.001,visible?.13:.18);material.opacity=THREE.MathUtils.lerp(material.opacity,visible?.92:0,.14);scratch.copy(state.targetColors[i]||neutral);material.color.lerp(scratch,.12);material.emissive.lerp(scratch.clone().multiplyScalar(visible?.24:0),.1);layer.children.forEach(child=>{if(child instanceof THREE.Mesh){const rim=child.material as THREE.MeshPhysicalMaterial;rim.opacity=THREE.MathUtils.lerp(rim.opacity,visible?.82:0,.14);rim.color.lerp(scratch,.12)}})});
      emitter.set(.62,3.22,-.12);model.localToWorld(emitter);const active=state.targetColors.length>0;state.smoke.forEach((sprite,i)=>{const data=sprite.userData;if(!reduceMotion)data.life+=active?data.speed:data.speed*1.8;if(data.life>=1)data.life=0;const life=data.life as number;const offset=(i%3-1)*.08;const curl=Math.sin(life*7.2+data.seed)*(.035+life*.22);sprite.position.set(emitter.x+offset+curl,emitter.y+.03+life*.42,emitter.z+Math.cos(life*6.1+data.seed)*(.025+life*.16));sprite.scale.set(.16+life*.5,.34+life*1.12,1);const fade=Math.min(life/.16,1)*Math.max(0,1-(life-.18)/.82);const material=sprite.material as THREE.SpriteMaterial;material.opacity=THREE.MathUtils.lerp(material.opacity,active?fade*.24:0,.09);if(active){scratch.copy(state.smokeBase).lerp(state.targetColors[state.targetColors.length-1],.045);material.color.lerp(scratch,.045)}});renderer.render(scene,camera)};
    const onVisibility=()=>{if(document.hidden){running=false;cancelAnimationFrame(frame)}else if(!running){running=true;render()}};document.addEventListener('visibilitychange',onVisibility);render();

    return()=>{running=false;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',onVisibility);renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointermove',onMove);renderer.domElement.removeEventListener('pointerup',onUp);renderer.domElement.removeEventListener('pointercancel',onUp);renderer.domElement.removeEventListener('wheel',onWheel);host.removeEventListener('keydown',onKeyDown);scene.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>material.dispose())}else if(object instanceof THREE.Sprite)object.material.dispose()});smokeTexture.dispose();brushedTexture.dispose();zoiTexture.dispose();baseLabelTexture.dispose();hmdLabelTexture.dispose();environmentTexture.dispose();environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove()};
  },[darkLine,onDetailChange]);

  useEffect(()=>{const hsl={h:0,s:0,l:0};live.current.targetColors=accents.map(value=>{const color=new THREE.Color(value);color.getHSL(hsl);color.setHSL(hsl.h,Math.min(1,hsl.s*1.38+.08),Math.min(.64,Math.max(hsl.l,.43)));return color})},[accents.join('|')]);

  return <><div ref={hostRef} className="hookah-canvas" role="group" tabIndex={0} aria-label="Mekanın üç boyutlu nargile modeli. Sürükleyerek çevirin, iki parmakla veya artı eksi tuşlarıyla yakınlaştırın."/><div className="hookah-view-controls" aria-label="3D model görünüm kontrolleri"><button type="button" onClick={()=>controlsRef.current.zoomOut()} aria-label="Uzaklaştır">−</button><button type="button" className="hookah-view-reset" onClick={()=>controlsRef.current.reset()} aria-label="Görünümü sıfırla">{zoomLabel}%</button><button type="button" onClick={()=>controlsRef.current.zoomIn()} aria-label="Yakınlaştır">+</button></div><span className="hookah-a11y-status" aria-live="polite">Model yakınlaştırma oranı yüzde {zoomLabel}</span></>;
}
