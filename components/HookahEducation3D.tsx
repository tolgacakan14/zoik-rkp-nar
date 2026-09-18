'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type HookahProps = { accents: string[]; darkLine?: boolean; onDetailChange?: (open: boolean) => void };
type LiveState = {
  water: THREE.MeshPhysicalMaterial | null;
  aromaPieces: THREE.Mesh[];
  targetColors: THREE.Color[];
  coals: THREE.Mesh[];
  coalGlow: THREE.PointLight | null;
  smoke: THREE.Sprite[];
  smokeBase: THREE.Color;
};

const neutral = new THREE.Color('#9eb3ad');

export function HookahEducation3D({ accents, darkLine = false, onDetailChange }: HookahProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const live = useRef<LiveState>({
    water: null, aromaPieces: [], targetColors: [],
    coals: [], coalGlow: null, smoke: [], smokeBase: new THREE.Color('#9aa8a0'),
  });

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
    // Rubber grommet sealing the stem into the vase neck.
    const neckGrommet = new THREE.Mesh(new THREE.CylinderGeometry(.155,.175,.16,48), rubber);
    neckGrommet.position.y = 1.74; neckGrommet.castShadow = true; model.add(neckGrommet);
    // The downstem carries smoke from the stem down into the water — this was
    // the missing link that made the body read as unconnected.
    const downstem = new THREE.Mesh(new THREE.CylinderGeometry(.072,.066,1.42,48), steel);
    downstem.position.y = 1.06; downstem.castShadow = true; model.add(downstem);
    const diffuser = new THREE.Mesh(new THREE.CylinderGeometry(.066,.082,.18,48), polished);
    diffuser.position.y = .3; model.add(diffuser);
    for (let i = 0; i < 4; i += 1) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(.017,.085,.17), steel);
      const angle = (i / 4) * Math.PI * 2;
      slot.position.set(Math.cos(angle) * .062, .29, Math.sin(angle) * .062);
      slot.rotation.y = -angle; model.add(slot);
    }
    cylinder(.09,.12,1.72,2.62,steel,72);
    cylinder(.13,.17,.2,1.88,polished,72);
    ring(.16,.018,1.82,steel);
    ring(.135,.014,2.04,polished);
    cylinder(.76,.76,.055,3.53,polished,112);
    ring(.76,.026,3.56,steel);

    // One continuous hose runs from the stem socket to a handle that rests
    // lifted above the vase, mouthpiece angled up rather than trailing to the floor.
    const port=new THREE.Group();
    port.position.set(.18,1.92,.08); port.rotation.z=-Math.PI/2;
    const portCore=new THREE.Mesh(new THREE.CylinderGeometry(.11,.15,.34,48),polished);
    portCore.castShadow=true; port.add(portCore);
    for(let i=0;i<4;i+=1){
      const rib=new THREE.Mesh(new THREE.TorusGeometry(.125,.014,10,48),steel);
      rib.rotation.x=Math.PI/2; rib.position.y=-.1+i*.065; port.add(rib);
    }
    model.add(port);
    // Rubber grommet seats the hose into the port so the joint reads as sealed.
    const portGrommet = new THREE.Mesh(new THREE.CylinderGeometry(.098,.112,.13,48), rubber);
    portGrommet.position.set(.3,1.92,.08); portGrommet.rotation.z=-Math.PI/2;
    portGrommet.castShadow=true; model.add(portGrommet);
    const socketTube=new THREE.Mesh(new THREE.CylinderGeometry(.076,.076,.26,48),steel);
    socketTube.position.set(.42,1.92,.08);
    socketTube.rotation.z=-Math.PI/2;
    socketTube.castShadow=true;
    model.add(socketTube);
    const hoseCurve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(.47,1.92,.08),new THREE.Vector3(.70,2.02,.06),
      new THREE.Vector3(1.06,2.18,.02),new THREE.Vector3(1.48,2.00,.06),
      new THREE.Vector3(1.70,1.62,.14),new THREE.Vector3(1.82,1.28,.22),
      new THREE.Vector3(1.94,1.10,.30),new THREE.Vector3(2.12,1.14,.40),
    ], false, 'catmullrom', .4);
    const hoseRadius = .072;
    const hose=new THREE.Mesh(new THREE.TubeGeometry(hoseCurve,220,hoseRadius,20,false),rubber);
    hose.castShadow=true; hose.receiveShadow=true; model.add(hose);
    const socketLip=new THREE.Mesh(new THREE.TorusGeometry(.09,.019,12,48),polished);
    socketLip.position.set(.34,1.92,.08);
    socketLip.rotation.y=Math.PI/2;
    model.add(socketLip);
    // Wound sleeves hug the first stretch of hose where it leaves the socket.
    for(let i=0;i<13;i+=1){
      const t=.02+i*.011;
      const point=hoseCurve.getPointAt(t);
      const sleeve=new THREE.Mesh(new THREE.TorusGeometry(hoseRadius+.008,.0075,8,22),polished);
      sleeve.position.copy(point);
      sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),hoseCurve.getTangentAt(t).normalize());
      model.add(sleeve);
    }
    // The handle continues along the hose's own end direction so every
    // fitting sits with zero gap, reading as one connected piece.
    const hoseEnd = hoseCurve.getPointAt(1);
    const hoseEndDir = hoseCurve.getTangentAt(1).normalize();
    const alignToDir = (mesh: THREE.Object3D, dir: THREE.Vector3) => {
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
    };
    const placeOnAxis = (mesh: THREE.Object3D, distanceFromEnd: number) => {
      mesh.position.copy(hoseEnd.clone().add(hoseEndDir.clone().multiplyScalar(distanceFromEnd)));
    };
    const ferrule=new THREE.Mesh(new THREE.CylinderGeometry(.079,.072,.17,40),steel);
    alignToDir(ferrule, hoseEndDir); placeOnAxis(ferrule, .015);
    ferrule.castShadow=true; model.add(ferrule);
    const grip=new THREE.Mesh(new THREE.CylinderGeometry(.079,.068,.4,40),rubber);
    alignToDir(grip, hoseEndDir); placeOnAxis(grip, .3);
    grip.castShadow=true; model.add(grip);
    const gripCollar=new THREE.Mesh(new THREE.TorusGeometry(.07,.011,10,36),polished);
    gripCollar.quaternion.copy(grip.quaternion); gripCollar.rotateX(Math.PI/2);
    placeOnAxis(gripCollar, .5);
    model.add(gripCollar);
    const mouthpiece=new THREE.Mesh(new THREE.CylinderGeometry(.043,.065,.45,40),polished);
    alignToDir(mouthpiece, hoseEndDir); placeOnAxis(mouthpiece, .725);
    mouthpiece.castShadow=true; model.add(mouthpiece);
    const tipRing=new THREE.Mesh(new THREE.TorusGeometry(.044,.008,10,36),steel);
    tipRing.quaternion.copy(mouthpiece.quaternion); tipRing.rotateX(Math.PI/2);
    placeOnAxis(tipRing, .93);
    model.add(tipRing);

    // A shallow metal tray, sculpted ceramic cup and transparent aroma chamber.
    const trayProfile=[
      new THREE.Vector2(.09,3.505),new THREE.Vector2(.32,3.5),new THREE.Vector2(.56,3.52),
      new THREE.Vector2(.72,3.56),new THREE.Vector2(.78,3.6),new THREE.Vector2(.785,3.625),
    ];
    const tray=new THREE.Mesh(new THREE.LatheGeometry(trayProfile,112),polished);
    tray.castShadow=true; model.add(tray);
    cylinder(.1,.11,.26,3.72,steel);
    // Rubber grommet where the bowl seats on the stem.
    const bowlGrommet = new THREE.Mesh(new THREE.CylinderGeometry(.128,.136,.14,48), rubber);
    bowlGrommet.position.y = 3.86; bowlGrommet.castShadow = true; model.add(bowlGrommet);
    cylinder(.24,.3,.3,3.96,ceramic,72);
    ring(.248,.026,4.11,ceramic);
    const chamberGlass=new THREE.Mesh(new THREE.CylinderGeometry(.255,.26,.41,72,1,true),new THREE.MeshPhysicalMaterial({
      color:0xd9cbc1,metalness:0,roughness:.08,transmission:.78,transparent:true,opacity:.42,thickness:.18,side:THREE.DoubleSide,
    }));
    chamberGlass.position.y=4.31; chamberGlass.renderOrder=2; model.add(chamberGlass);
    ring(.263,.014,4.52,polished);

    // Each selected aroma becomes one visible tobacco layer in the bowl,
    // carrying that aroma's own colour rather than a muddied blend, with a
    // faint self-glow so the hue stays vivid under the bowl's own shading.
    const aromaBands:THREE.Mesh[]=[];
    for(let layer=0;layer<3;layer+=1){
      const material=new THREE.MeshStandardMaterial({
        color:neutral,roughness:.82,transparent:true,opacity:1,
        emissive:new THREE.Color(0x000000),emissiveIntensity:.38,
      });
      const band=new THREE.Mesh(new THREE.CylinderGeometry(.211,.215,.1,56),material);
      band.position.y=4.16+layer*.105;
      band.scale.set(1,.001,1);
      band.castShadow=true;
      band.userData.layer=layer;
      band.userData.kind='band';
      model.add(band);
      aromaBands.push(band);
    }

    // Chopped, uneven material builds up in the glass bowl as each aroma is selected.
    const granules:THREE.Mesh[]=[];
    for(let layer=0;layer<3;layer+=1){
      for(let index=0;index<22;index+=1){
        const angle=index*2.39996+layer*.63;
        const radius=.2*Math.sqrt((index+.5)/22);
        const x=Math.cos(angle)*radius;
        const z=Math.sin(angle)*radius;
        const size=.039+(index%5)*.004;
        const material=new THREE.MeshStandardMaterial({
          color:neutral,roughness:.86,flatShading:true,
          emissive:new THREE.Color(0x000000),emissiveIntensity:.3,
        });
        const piece=new THREE.Mesh(new THREE.IcosahedronGeometry(size,0),material);
        piece.position.set(x,4.2+layer*.105+(index%4)*.008,z);
        piece.rotation.set(index*.81,layer+index*.37,index*.53);
        piece.scale.setScalar(.001);
        piece.castShadow=true;
        piece.userData.layer=layer;
        piece.userData.kind='granule';
        piece.userData.shade=.88+(index%6)*.045;
        model.add(piece);
        granules.push(piece);
      }
    }
    live.current.aromaPieces=[...aromaBands,...granules];

    // Foil and coals sit on top of the bowl; the smoke rises from between them.
    const foil = new THREE.Mesh(new THREE.CylinderGeometry(.252,.252,.012,64), new THREE.MeshStandardMaterial({
      color:0xbfc3c6, metalness:.95, roughness:.34,
    }));
    foil.position.y = 4.53; foil.castShadow = true; model.add(foil);
    const coals: THREE.Mesh[] = [];
    const coalMaterial = () => new THREE.MeshStandardMaterial({
      color:0x2f2b28, roughness:.95, flatShading:true,
      emissive:new THREE.Color(0xff5a1e), emissiveIntensity:.55,
    });
    for (let index = 0; index < 3; index += 1) {
      const angle = (index / 3) * Math.PI * 2 + .4;
      const coal = new THREE.Mesh(new THREE.BoxGeometry(.115,.088,.115), coalMaterial());
      coal.position.set(Math.cos(angle) * .125, 4.585, Math.sin(angle) * .125);
      coal.rotation.set(.12, angle, .08); coal.castShadow = true;
      coal.userData.phase = index * 2.1;
      model.add(coal); coals.push(coal);
    }
    const coalGlow = new THREE.PointLight(0xff6a24, 0, 2.6, 2);
    coalGlow.position.set(0, 4.62, 0); model.add(coalGlow);
    live.current.coals = coals;
    live.current.coalGlow = coalGlow;

    // Soft sprite smoke drifting up out of the bowl.
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.width = 128; smokeCanvas.height = 128;
    const smokeContext = smokeCanvas.getContext('2d');
    if (smokeContext) {
      const puff = smokeContext.createRadialGradient(64,64,2,64,64,62);
      puff.addColorStop(0, 'rgba(255,255,255,0.92)');
      puff.addColorStop(0.45, 'rgba(255,255,255,0.34)');
      puff.addColorStop(1, 'rgba(255,255,255,0)');
      smokeContext.fillStyle = puff; smokeContext.fillRect(0,0,128,128);
    }
    const smokeTexture = new THREE.CanvasTexture(smokeCanvas);
    const smokeBase = darkLine ? new THREE.Color('#e4e9e2') : new THREE.Color('#9aa8a0');
    const smoke: THREE.Sprite[] = [];
    const SMOKE_COUNT = 22;
    for (let index = 0; index < SMOKE_COUNT; index += 1) {
      const material = new THREE.SpriteMaterial({ map: smokeTexture, color: smokeBase.clone(), transparent: true, opacity: 0, depthWrite: false });
      const sprite = new THREE.Sprite(material);
      sprite.userData.seed = Math.random() * Math.PI * 2;
      sprite.userData.speed = .0042 + Math.random() * .0038;
      sprite.userData.drift = (Math.random() - .5) * .0022;
      sprite.userData.life = index / SMOKE_COUNT;
      sprite.userData.spin = (Math.random() - .5) * .01;
      sprite.position.set(0, 4.66, 0);
      sprite.scale.setScalar(.2);
      model.add(sprite); smoke.push(sprite);
    }
    live.current.smoke = smoke;
    live.current.smokeBase = smokeBase;

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
    let frame=0,clock=0;
    const scratch=new THREE.Color();
    const render=()=>{
      frame=requestAnimationFrame(render);
      clock+=1;
      if(!dragging){velocity*=.94;targetRotation+=velocity;if(!reduceMotion)targetRotation+=.00032}
      model.rotation.y+=(targetRotation-model.rotation.y)*.08;
      camera.position.y=THREE.MathUtils.lerp(camera.position.y,targetCameraY,.075);
      camera.position.z=THREE.MathUtils.lerp(camera.position.z,targetCameraZ,.075);
      lookY=THREE.MathUtils.lerp(lookY,detailView?4.2:2.25,.075);
      camera.lookAt(0,lookY,0);

      const state=live.current;
      const colors=state.targetColors;
      const lit=colors.length>0;

      // Water picks up a light wash of the blend rather than an averaged mud.
      if (state.water) {
        if (lit) {
          scratch.set(0,0,0);
          colors.forEach(color=>scratch.add(color));
          scratch.multiplyScalar(1/colors.length);
          scratch.lerp(new THREE.Color('#e8f1ec'),.52);
        } else {
          scratch.copy(neutral);
        }
        state.water.color.lerp(scratch,.05);
      }

      // Each layer takes its own aroma colour at full saturation.
      state.aromaPieces.forEach(piece=>{
        const layer=piece.userData.layer as number;
        const visible=layer<colors.length;
        if (piece.userData.kind==='band') {
          const target=visible?1:.001;
          piece.scale.y=THREE.MathUtils.lerp(piece.scale.y,target,visible?.14:.2);
          const material=piece.material as THREE.MeshStandardMaterial;
          material.opacity=THREE.MathUtils.lerp(material.opacity,visible?1:0,.16);
        } else {
          const scale=THREE.MathUtils.lerp(piece.scale.x,visible?1:.001,visible?.13:.18);
          piece.scale.setScalar(scale);
        }
        scratch.copy(colors[layer]||neutral);
        if (visible) scratch.multiplyScalar(piece.userData.shade||1);
        const material=piece.material as THREE.MeshStandardMaterial;
        material.color.lerp(scratch,.12);
        if (material.emissive) {
          scratch.copy(colors[layer]||neutral).multiplyScalar(visible?.5:0);
          material.emissive.lerp(scratch,.12);
        }
      });

      // Coals breathe while the bowl is packed.
      state.coals.forEach(coal=>{
        const material=coal.material as THREE.MeshStandardMaterial;
        const pulse=lit?.5+Math.sin(clock*.026+coal.userData.phase)*.22:0;
        material.emissiveIntensity=THREE.MathUtils.lerp(material.emissiveIntensity,pulse,.07);
      });
      if (state.coalGlow) {
        const glow=lit?2.3+Math.sin(clock*.03)*.5:0;
        state.coalGlow.intensity=THREE.MathUtils.lerp(state.coalGlow.intensity,glow,.06);
      }

      // Smoke rises, widens and fades, then recycles back into the bowl.
      state.smoke.forEach(sprite=>{
        const data=sprite.userData;
        data.life+=lit?data.speed:data.speed*1.9;
        if (data.life>=1) {
          data.life=0;
          data.seed=Math.random()*Math.PI*2;
          data.speed=.0042+Math.random()*.0038;
          data.drift=(Math.random()-.5)*.0022;
        }
        const lifeValue=data.life;
        const wobble=Math.sin(lifeValue*6.1+data.seed);
        sprite.position.set(
          wobble*(.05+lifeValue*.3)+data.drift*clock*.08,
          4.66+lifeValue*2.35,
          Math.cos(lifeValue*5.3+data.seed)*(.04+lifeValue*.24),
        );
        sprite.scale.setScalar(.22+lifeValue*1.05);
        (sprite.material as THREE.SpriteMaterial).rotation+=data.spin;
        const curve=Math.min(lifeValue/.16,1)*Math.max(0,1-(lifeValue-.2)/.8);
        const target=lit?curve*.34:0;
        const material=sprite.material as THREE.SpriteMaterial;
        material.opacity=THREE.MathUtils.lerp(material.opacity,target,.1);
        if (lit && colors.length) {
          scratch.copy(state.smokeBase).lerp(colors[colors.length-1],.14);
          material.color.lerp(scratch,.05);
        }
      });

      renderer.render(scene,camera);
    };
    render();

    return()=>{
      cancelAnimationFrame(frame); observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown',onDown); renderer.domElement.removeEventListener('pointermove',onMove);
      renderer.domElement.removeEventListener('pointerup',onUp); renderer.domElement.removeEventListener('pointercancel',onCancel);
      scene.traverse(object=>{
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials=Array.isArray(object.material)?object.material:[object.material];
          materials.forEach(material=>material.dispose());
        } else if (object instanceof THREE.Sprite) {
          object.material.dispose();
        }
      });
      smokeTexture.dispose();
      environmentTexture.dispose(); environment.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  },[darkLine,onDetailChange]);

  useEffect(()=>{
    // Push each aroma toward a more saturated, better-lit version of itself so
    // the layers stay vivid once the bowl's own shading knocks them back.
    const hsl = { h: 0, s: 0, l: 0 };
    live.current.targetColors = accents.map(value => {
      const color = new THREE.Color(value);
      color.getHSL(hsl);
      color.setHSL(hsl.h, Math.min(1, hsl.s * 1.55 + .12), Math.min(.66, Math.max(hsl.l, .47)));
      return color;
    });
  },[accents.join('|')]);

  return <div ref={hostRef} className="hookah-canvas" role="img" aria-label="Sürükleyerek çevrilebilen üç boyutlu modern nargile modeli"/>;
}

