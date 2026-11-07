/* Stylized cat model, facing local +X. All dimensions are in world units. */
window.createCatModel = function(T, {fur, collar, patchMaterials}) {
  const root=new T.Group(), body=new T.Group(), head=new T.Group(), legs=[], patches=[], stripes=[];
  root.name='Miso';root.add(body,head);head.position.set(.23,.39,0);
  const material=(color,roughness=.8)=>new T.MeshStandardMaterial({color,roughness});
  const cream=material(0xffeed6), pink=material(0xe9979b), dark=material(0x352934), iris=material(0x8cbd69,.25), stripe=material(0x8e4929);
  function ellipsoid(parent,m,p,s){const mesh=new T.Mesh(new T.SphereGeometry(1,32,24),m);mesh.position.set(...p);mesh.scale.set(...s);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  ellipsoid(body,fur,[-.035,.27,0],[.29,.18,.145]);
  ellipsoid(body,cream,[.095,.205,0],[.15,.105,.122]);
  ellipsoid(head,fur,[0,0,0],[.158,.145,.143]);
  // Cheeks, muzzle, chin and triangular nose form a readable silhouette.
  for(const side of [-1,1]){
    ellipsoid(head,fur,[-.015,-.035,side*.09],[.12,.085,.07]);
    ellipsoid(head,cream,[.127,-.055,side*.042],[.047,.037,.048]);
    const eye=ellipsoid(head,dark,[.111,.027,side*.094],[.035,.048,.034]);
    ellipsoid(head,iris,[.133,.031,side*.101],[.018,.034,.026]);
    ellipsoid(head,dark,[.146,.031,side*.104],[.009,.028,.014]);
    ellipsoid(head,material(0xffffff,.1),[.151,.047,side*.11],[.006,.009,.007]);
    const ear=new T.Group();head.add(ear);ear.position.set(-.025,.1,side*.095);ear.rotation.x=side*.18;
    const shape=new T.Shape();shape.moveTo(-.065,0);shape.quadraticCurveTo(-.045,.1,0,.145);shape.quadraticCurveTo(.06,.09,.068,0);shape.closePath();
    const geometry=new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSegments:3,bevelSize:.012,bevelThickness:.012,steps:1,curveSegments:8});
    geometry.rotateY(Math.PI/2);geometry.translate(-.017,0,0);
    const shell=new T.Mesh(geometry,fur);shell.castShadow=true;ear.add(shell);
    ellipsoid(ear,pink,[.03,.057,0],[.009,.055,.035]);
    // Three fine curved whiskers on each cheek.
    for(let i=-1;i<=1;i++){
      const curve=new T.QuadraticBezierCurve3(new T.Vector3(.135,-.055,side*.065),new T.Vector3(.18,-.045+i*.02,side*.15),new T.Vector3(.19,-.04+i*.033,side*.24));
      const whisker=new T.Mesh(new T.TubeGeometry(curve,10,.0018,4,false),cream);head.add(whisker);
    }
  }
  ellipsoid(head,cream,[.117,-.09,0],[.045,.024,.054]);
  const nose=new T.Mesh(new T.ConeGeometry(.019,.022,3),pink);nose.rotation.z=Math.PI/2;nose.position.set(.176,-.041,0);head.add(nose);
  for(const z of [-.095,.095])for(const x of [-.19,.17]){
    const leg=new T.Group();leg.position.set(x,.23,z);root.add(leg);legs.push(leg);
    ellipsoid(leg,fur,[0,-.065,0],[.047,.105,.045]);
    ellipsoid(leg,cream,[.019,-.177,0],[.062,.033,.049]);
    for(let toe=-1;toe<=1;toe++)ellipsoid(leg,cream,[.063,-.177,toe*.025],[.016,.023,.014]);
  }
  const tail=new T.Group();tail.position.set(-.26,.29,0);root.add(tail);
  const tailCurve=new T.CatmullRomCurve3([new T.Vector3(),new T.Vector3(-.13,.12,0),new T.Vector3(-.19,.3,.015),new T.Vector3(-.17,.46,.025),new T.Vector3(-.09,.5,.025)]);
  const tailMesh=new T.Mesh(new T.TubeGeometry(tailCurve,36,.039,12,false),fur);tailMesh.castShadow=true;tail.add(tailMesh);
  ellipsoid(tail,fur,[-.09,.5,.025],[.039,.039,.039]);
  // Tabby stripes follow the flanks rather than crossing the entire body as blocks.
  for(const side of [-1,1])for(let i=0;i<5;i++){
    const mark=ellipsoid(body,stripe,[-.22+i*.075,.303,side*(.119+Math.sin(i/4*Math.PI)*.018)],[.018,.097,.012]);mark.rotation.z=-.3;stripes.push(mark);
  }
  for(const [x,y,z,m] of [[-.15,.31,.133,patchMaterials[0]],[.01,.34,-.13,patchMaterials[1]],[.1,.31,.12,patchMaterials[0]]]){
    const patch=ellipsoid(body,m,[x,y,z],[.095,.09,.017]);patch.visible=false;patches.push(patch);
  }
  const band=new T.Mesh(new T.TorusGeometry(.108,.016,12,48),collar);band.rotation.y=Math.PI/2;band.position.set(.135,.32,0);root.add(band);
  const gold=new T.MeshStandardMaterial({color:0xe9b84c,metalness:.65,roughness:.28});ellipsoid(root,gold,[.147,.204,0],[.023,.027,.023]);
  return {root,body,head,legs,tail,patches,stripes,stripeMaterial:stripe};
};
