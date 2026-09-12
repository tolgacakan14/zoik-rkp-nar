'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type HookahProps = { accents: string[]; darkLine?: boolean; onDetailChange?: (open: boolean) => void };
type LiveState = {
  water: THREE.MeshPhysicalMaterial | null;
  aromaPieces: THREE.Mesh[];
  targetColors: THREE.Color[];
};

const neutral = new THREE.Color('#9eb3ad');

export function HookahEducation3D({ accents, darkLine = false, onDetailChange }: HookahProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const live = useRef<LiveState>({ water: null, aromaPieces: [], targetColors: [] });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 40);
    camera.position.set(0.12, 2.3, 11.2);
    camera.lookAt(0, 2.25, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = darkLine ? 1.18 : 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    // Broad studio softboxes give the metal and glass shaped reflections.
    const environmentCanvas = document.createElement('canvas');
    environmentCanvas.width = 1024;
    environmentCanvas.height = 512;
    const environmentContext = environmentCanvas.getContext('2d');
    if (environmentContext) {
      const gradient = environmentContext.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#ded9d2');
      gradient.addColorStop(0.48, '#a39c96');
      gradient.addColorStop(1, '#494947');
      environmentContext.fillStyle = gradient;
      environmentContext.fillRect(0, 0, 1024, 512);
      for (const [x, y, width, height, opacity] of [
        [80, 70, 115, 260, 0.96], [415, 34, 175, 310, 0.9],
        [744, 90, 88, 240, 0.78], [925, 54, 30, 280, 0.7],
      ]) {
        environmentContext.fillStyle = `rgba(255,250,240,${opacity})`;
        environmentContext.fillRect(x, y, width, height);
      }
    }
    const environmentTexture = new THREE.CanvasTexture(environmentCanvas);
    environmentTexture.mapping = THREE.EquirectangularReflectionMapping;
    environmentTexture.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromEquirectangular(environmentTexture);
    scene.environment = environment.texture;

    const model = new THREE.Group();
    model.position.y = -0.08;
    model.rotation.y = -0.3;
    scene.add(model);

    const steel = new THREE.MeshPhysicalMaterial({ color: darkLine ? 0x343437 : 0x575257, metalness: 0.88, roughness: 0.19, clearcoat: 0.35, envMapIntensity: 1.15 });
    const polished = new THREE.MeshPhysicalMaterial({ color: darkLine ? 0x9f9998 : 0xb7a69d, metalness: 0.9, roughness: 0.1, clearcoat: 0.55, envMapIntensity: 1.45 });
    const rubber = new THREE.MeshPhysicalMaterial({ color: 0x121414, roughness: 0.38, clearcoat: 0.25 });
    const ceramic = new THREE.MeshPhysicalMaterial({ color: 0x393031, roughness: 0.22, clearcoat: 0.7 });
    const glass = new THREE.MeshPhysicalMaterial({
      color: darkLine ? 0x443035 : 0x76565a,
      metalness: 0,
      roughness: 0.055,
      transmission: 0.74,
      transparent: true,
      opacity: 0.68,
      thickness: 0.38,
      ior: 1.47,
      clearcoat: 0.65,
      clearcoatRoughness: 0.025,
      envMapIntensity: 1.3,
      side: THREE.DoubleSide,
    });
    const water = new THREE.MeshPhysicalMaterial({ color: neutral, roughness: 0.08, transmission: 0.12, transparent: true, opacity: 0.52, clearcoat: 0.5 });
    live.current.water = water;

    const cylinder = (top:number, bottom:number, height:number, y:number, material:THREE.Material, segments=72) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, segments), material);
      mesh.position.y = y;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      model.add(mesh);
      return mesh;
    };
    const ring = (radius:number, tube:number, y:number, material:THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 72), material);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.y = y;
      mesh.castShadow = true;
      model.add(mesh);
      return mesh;
    };

    // A tall, flared smoked-glass vase with a heavy foot and narrow neck.
    const vaseControl = [
      new THREE.Vector3(.51,.025,0),new THREE.Vector3(.73,.04,0),new THREE.Vector3(.83,.11,0),
      new THREE.Vector3(.79,.2,0),new THREE.Vector3(.61,.48,0),new THREE.Vector3(.44,.85,0),
      new THREE.Vector3(.35,1.18,0),new THREE.Vector3(.29,1.49,0),new THREE.Vector3(.29,1.66,0),
    ];
    const vaseSpline = new THREE.CatmullRomCurve3(vaseControl, false, 'centripetal');
    const vaseProfile = vaseSpline.getPoints(80).map(point => new THREE.Vector2(point.x, point.y));
    const vase = new THREE.Mesh(new THREE.LatheGeometry(vaseProfile, 128), glass);
    vase.castShadow = true;
    vase.receiveShadow = true;
    model.add(vase);
    ring(.775,.018,.09,polished);
    ring(.72,.011,.17,steel);
    ring(.295,.018,1.64,polished);
    const waterBody = new THREE.Mesh(new THREE.CylinderGeometry(.5,.68,.42,72), water);
    waterBody.position.y = .3;
    model.add(waterBody);
    const waterLine = new THREE.Mesh(new THREE.CircleGeometry(.5,72), water);
    waterLine.rotation.x = -Math.PI/2;
    waterLine.position.y = .515;
    model.add(waterLine);

    // Narrow dark-chrome stem, machined collar and wide polished tray.
    cylinder(.31,.34,.2,1.68,polished);
    ring(.33,.022,1.59,steel);
    cylinder(.09,.12,1.72,2.62,steel,72);
    cylinder(.13,.17,.2,1.88,polished,72);
    ring(.16,.018,1.82,steel);
    ring(.135,.014,2.04,polished);
    cylinder(.76,.76,.055,3.53,polished,112);
    ring(.76,.026,3.56,steel);

    // A single relaxed hose loop sits behind the body, with the handle crossing in front.
    const port=new THREE.Group();
    // The hose socket penetrates the stem; its outlet and the hose share one axis.
    port.position.set(.18,1.92,-.12); port.rotation.z=-Math.PI/2;
    const portCore=new THREE.Mesh(new THREE.CylinderGeometry(.11,.15,.34,48),polished);
    portCore.castShadow=true; port.add(portCore);
    for(let i=0;i<4;i+=1){
      const rib=new THREE.Mesh(new THREE.TorusGeometry(.125,.014,10,48),steel);
      rib.rotation.x=Math.PI/2; rib.position.y=-.1+i*.065; port.add(rib);
    }
    model.add(port);
    const hoseCurve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(.325,1.92,-.12),new THREE.Vector3(.58,2.04,-.2),new THREE.Vector3(.92,2.33,-.32),
      new THREE.Vector3(1.62,2.51,-.38),new THREE.Vector3(2.22,2.18,-.34),
      new THREE.Vector3(2.38,1.54,-.28),new THREE.Vector3(2.13,.82,-.16),
      new THREE.Vector3(1.55,.43,-.06),new THREE.Vector3(.83,.58,.14),
      new THREE.Vector3(.31,1.16,.26),
    ]);
    const hose=new THREE.Mesh(new THREE.TubeGeometry(hoseCurve,128,.062,16,false),rubber);
    hose.castShadow=true; model.add(hose);
    const socketLip=new THREE.Mesh(new THREE.TorusGeometry(.09,.019,12,48),polished);
    socketLip.position.set(.35,1.92,-.12);
    socketLip.rotation.y=Math.PI/2;
    model.add(socketLip);
    for(let i=0;i<13;i+=1){
      const t=.035+i*.012;
      const point=hoseCurve.getPointAt(t);
      const sleeve=new THREE.Mesh(new THREE.TorusGeometry(.068,.008,8,20),polished);
      sleeve.position.copy(point);
      sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),hoseCurve.getTangentAt(t).normalize());
      model.add(sleeve);
    }
    const handleStart=new THREE.Vector3(.31,1.16,.26),handleEnd=new THREE.Vector3(2.13,-.12,.55);
    const handleMid=handleStart.clone().add(handleEnd).multiplyScalar(.5);
    const mouthpiece=new THREE.Mesh(new THREE.CylinderGeometry(.064,.043,2.27,40),polished);
    mouthpiece.position.copy(handleMid);
    mouthpiece.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),handleEnd.clone().sub(handleStart).normalize());
    mouthpiece.castShadow=true; model.add(mouthpiece);
    const grip=new THREE.Mesh(new THREE.CylinderGeometry(.09,.08,.66,40),rubber);
    grip.position.copy(handleStart.clone().lerp(handleEnd,.13));
    grip.quaternion.copy(mouthpiece.quaternion); grip.castShadow=true; model.add(grip);
    // A short metal ferrule overlaps both the flexible hose and the handle grip.
    const ferrule=new THREE.Mesh(new THREE.CylinderGeometry(.083,.075,.17,40),steel);
    ferrule.position.copy(handleStart.clone().lerp(handleEnd,.025));
    ferrule.quaternion.copy(mouthpiece.quaternion);
    ferrule.castShadow=true; model.add(ferrule);

    // A shallow metal tray, sculpted ceramic cup and transparent aroma chamber.
    const trayProfile=[
      new THREE.Vector2(.09,3.505),new THREE.Vector2(.32,3.5),new THREE.Vector2(.56,3.52),
      new THREE.Vector2(.72,3.56),new THREE.Vector2(.78,3.6),new THREE.Vector2(.785,3.625),
    ];
    const tray=new THREE.Mesh(new THREE.LatheGeometry(trayProfile,112),polished);
    tray.castShadow=true; model.add(tray);
    cylinder(.1,.11,.26,3.72,steel);
    cylinder(.24,.3,.3,3.96,ceramic,72);
    ring(.248,.026,4.11,ceramic);
    const chamberGlass=new THREE.Mesh(new THREE.CylinderGeometry(.255,.26,.41,72,1,true),new THREE.MeshPhysicalMaterial({
      color:0xd9cbc1,metalness:0,roughness:.08,transmission:.78,transparent:true,opacity:.42,thickness:.18,side:THREE.DoubleSide,
    }));
    chamberGlass.position.y=4.31; chamberGlass.renderOrder=2; model.add(chamberGlass);
    ring(.263,.014,4.52,polished);

    // Thin bases preserve three readable levels without looking like colored plastic discs.
    const aromaBands:THREE.Mesh[]=[];
    for(let layer=0;layer<3;layer+=1){
      const material=new THREE.MeshStandardMaterial({color:neutral,roughness:.96});
      const band=new THREE.Mesh(new THREE.CylinderGeometry(.208,.212,.028,48),material);
      band.position.y=4.165+layer*.115;
      band.scale.setScalar(.001);
      band.castShadow=true;
      band.userData.layer=layer;
      model.add(band);
      aromaBands.push(band);
    }

    // Chopped, uneven material builds up in the glass bowl as each aroma is selected.
    const granules:THREE.Mesh[]=[];
    for(let layer=0;layer<3;layer+=1){
      for(let index=0;index<25;index+=1){
        const angle=index*2.39996+layer*.63;
        const radius=.205*Math.sqrt((index+.5)/25);
        const x=Math.cos(angle)*radius;
        const z=Math.sin(angle)*radius;
        const size=.047+(index%5)*.005;
        const material=new THREE.MeshStandardMaterial({color:neutral,roughness:.95,flatShading:true});
        const piece=new THREE.Mesh(new THREE.IcosahedronGeometry(size,0),material);
        piece.position.set(x,4.205+layer*.115+(index%4)*.009,z);
        piece.rotation.set(index*.81,layer+index*.37,index*.53);
        piece.scale.setScalar(.001);
        piece.castShadow=true;
        piece.userData.layer=layer;
        piece.userData.tint=.82+(index%6)*.06;
        model.add(piece);
        granules.push(piece);
      }
    }
    live.current.aromaPieces=[...aromaBands,...granules];

    const floor=new THREE.Mesh(new THREE.CircleGeometry(2.25,96),new THREE.ShadowMaterial({color:0x173b38,transparent:true,opacity:darkLine ? .25 : .13}));
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.HemisphereLight(0xffffff,darkLine?0x1b2422:0x7d8b86,2.15));
    const key=new THREE.DirectionalLight(0xfff7ea,5.4);
    key.position.set(4.5,7,5.5); key.castShadow=true; key.shadow.mapSize.set(1024,1024); scene.add(key);
    const edge=new THREE.DirectionalLight(0xb8d9d1,3.4); edge.position.set(-5,4,-2); scene.add(edge);
    const warm=new THREE.PointLight(0xffc7a2,12,12,2); warm.position.set(2.8,1.7,3.5); scene.add(warm);

    let targetCameraZ=11.9,detailView=false;
    const fullCameraDistance=()=>camera.aspect>1.35?11.55:camera.aspect<.85?17.2:11.9;
    const resize=()=>{
      const bounds=host.getBoundingClientRect();
      const width=Math.max(bounds.width,1),height=Math.max(bounds.height,1);
      renderer.setSize(width,height,false); camera.aspect=width/height;
      if(!detailView) targetCameraZ=fullCameraDistance();
      camera.position.z=targetCameraZ; camera.updateProjectionMatrix();
    };
    const observer=new ResizeObserver(resize); observer.observe(host); resize();

    let dragging=false,pointerX=0,startX=0,startY=0,targetRotation=model.rotation.y,velocity=0;
    let targetCameraY=2.3,lookY=2.25;
    const onDown=(event:PointerEvent)=>{
      dragging=true;pointerX=event.clientX;startX=pointerX;startY=event.clientY;velocity=0;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onCancel=()=>{dragging=false};
    const onMove=(event:PointerEvent)=>{if(!dragging)return;const delta=(event.clientX-pointerX)*.007;targetRotation+=delta;velocity=delta;pointerX=event.clientX};
    const onUp=(event:PointerEvent)=>{
      dragging=false;
      if(Math.hypot(event.clientX-startX,event.clientY-startY)<8){
        detailView=!detailView;
        onDetailChange?.(detailView);
        targetCameraY=detailView?4.17:2.3;
        targetCameraZ=detailView?3.45:fullCameraDistance();
      }
    };
    renderer.domElement.style.touchAction='none';
    renderer.domElement.addEventListener('pointerdown',onDown); renderer.domElement.addEventListener('pointermove',onMove);
    renderer.domElement.addEventListener('pointerup',onUp); renderer.domElement.addEventListener('pointercancel',onCancel);

    const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame=0;
    const render=()=>{
      frame=requestAnimationFrame(render);
      if(!dragging){velocity*=.94;targetRotation+=velocity;if(!reduceMotion)targetRotation+=.00032}
      model.rotation.y+=(targetRotation-model.rotation.y)*.08;
      camera.position.y=THREE.MathUtils.lerp(camera.position.y,targetCameraY,.075);
      camera.position.z=THREE.MathUtils.lerp(camera.position.z,targetCameraZ,.075);
      lookY=THREE.MathUtils.lerp(lookY,detailView?4.2:2.25,.075);
      camera.lookAt(0,lookY,0);
      const state=live.current;
      const waterTarget=state.targetColors.length
        ? state.targetColors.reduce((mix,color,index)=>mix.lerp(color,1/(index+1)),new THREE.Color('#dbe8e3'))
        : neutral;
      state.water?.color.lerp(waterTarget,.045);
      const tintColor=new THREE.Color();
      state.aromaPieces.forEach(piece=>{
        const layer=piece.userData.layer as number;
        const visible=layer<state.targetColors.length;
        const scale=THREE.MathUtils.lerp(piece.scale.x,visible ? 1 : .001,visible ? .13 : .18);
        piece.scale.setScalar(scale);
        tintColor.copy(state.targetColors[layer]||neutral).multiplyScalar(piece.userData.tint||1);
        (piece.material as THREE.MeshStandardMaterial).color.lerp(tintColor,.1);
      });
      renderer.render(scene,camera);
    };
    render();

    return()=>{
      cancelAnimationFrame(frame); observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown',onDown); renderer.domElement.removeEventListener('pointermove',onMove);
      renderer.domElement.removeEventListener('pointerup',onUp); renderer.domElement.removeEventListener('pointercancel',onCancel);
      scene.traverse(object=>{if(!(object instanceof THREE.Mesh))return;object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose())});
      environmentTexture.dispose(); environment.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  },[darkLine,onDetailChange]);

  useEffect(()=>{live.current.targetColors=accents.map(value=>new THREE.Color(value))},[accents.join('|')]);

  return <div ref={hostRef} className="hookah-canvas" role="img" aria-label="Sürükleyerek çevrilebilen üç boyutlu modern nargile modeli"/>;
}
