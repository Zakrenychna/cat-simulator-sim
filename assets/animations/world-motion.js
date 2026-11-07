window.WorldMotion = class WorldMotion {
  constructor(T, scene) { this.T=T; this.scene=scene; this.entries=[]; this.effects=[]; this.time=0; this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches; }
  add(object,kind,options={}) {
    const entry={object,kind,options,position:object.position.clone(),rotation:object.rotation.clone(),scale:object.scale.clone(),previous:object.position.clone(),phase:this.entries.length*2.399,hit:0};
    this.entries.push(entry); return object;
  }
  hit(object) { const e=this.entries.find(e=>e.object===object); if(e)e.hit=1; }
  burst(object,color=0xffd68b) {
    const T=this.T,origin=object.getWorldPosition(new T.Vector3());
    const geometry=new T.IcosahedronGeometry(.045,0),material=new T.MeshStandardMaterial({color,roughness:.65,transparent:true});
    const pieces=[];
    for(let i=0;i<12;i++){const mesh=new T.Mesh(geometry,material);mesh.position.copy(origin);this.scene.add(mesh);pieces.push({mesh,velocity:new T.Vector3(Math.sin(i*2.4)*1.7,1.4+(i%4)*.4,Math.cos(i*2.4)*1.7)});}
    this.effects.push({pieces,geometry,material,life:1});
  }
  update(dt) {
    this.time+=dt;const t=this.time;
    this.entries=this.entries.filter(e=>{const o=e.object;let root=o;while(root.parent)root=root.parent;if(root!==this.scene)return false;
      const moving=o.position.distanceTo(e.previous)>dt*.08;e.previous.copy(o.position);
      const wave=Math.sin(t*2+e.phase),amount=this.reduced?.15:1;
      if(e.kind==='cat'){
        const stride=moving?Math.sin(t*(e.options.sprint?.()?19:12))*.65:0;
        e.options.legs.forEach((leg,i)=>leg.rotation.z=stride*(i%3===0?1:-1));
        e.options.tail.rotation.x=Math.sin(t*2.6)*.28*amount;
        e.options.body.scale.y=1+Math.sin(t*3)*.025*amount;
        e.options.head.rotation.z=Math.sin(t*1.7)*.035*amount;
      }else if(e.kind==='person'){
        const legs=e.options.legs||o.children.filter(c=>c.geometry?.type==='CylinderGeometry'&&c.position.y<.6);
        legs.forEach((leg,i)=>leg.rotation.x=moving?Math.sin(t*7+e.phase+i*Math.PI)*.38:0);
      }else if(e.kind==='plant'){
        o.children.slice(1).forEach((leaf,i)=>leaf.rotation.z=Math.sin(t*1.7+e.phase+i*.5)*.075*amount);
      }else if(e.kind==='foliage'){o.rotation.z=e.rotation.z+wave*.025*amount;
      }else if(e.kind==='vehicle'){
        o.children.filter(c=>c.geometry?.type==='CylinderGeometry').forEach(c=>c.rotation.y+=dt*e.options.speed/.28);
      }else if(e.kind==='aircraft'){o.rotation.z=e.rotation.z+wave*.025*amount;
      }else if(e.kind==='squirrel'){o.scale.y=e.scale.y*(1+Math.sin(t*5)*.025*amount);
      }else if(e.kind==='screen'){o.material.emissiveIntensity=(e.options.intensity||.35)*(1+Math.sin(t*1.4)*.12);
      }else if(e.kind==='glow'){o.emissiveIntensity=e.options.intensity*(1+wave*.12*amount);}
      if(e.hit>0){e.hit=Math.max(0,e.hit-dt*3);o.rotation.z=e.rotation.z+Math.sin(e.hit*24)*e.hit*.16;}
      return true;
    });
    this.effects=this.effects.filter(e=>{e.life-=dt;e.material.opacity=Math.max(0,e.life);for(const p of e.pieces){p.velocity.y-=dt*4;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.rotation.x+=dt*5;p.mesh.rotation.z+=dt*3;}if(e.life>0)return true;for(const p of e.pieces)this.scene.remove(p.mesh);e.geometry.dispose();e.material.dispose();return false;});
  }
};
