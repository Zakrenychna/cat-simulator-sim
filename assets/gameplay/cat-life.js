window.CatLife = class CatLife {
  constructor(api) {
    Object.assign(this,api);this.T=api.T;this.time=0;this.velocity=0;this.hidden=false;this.sleeping=false;this.climb=null;this.ownerCooldown=0;this.ownerState='calm';
    const saved=this.save.life||{};
    this.data=this.save.life={clock:Number.isFinite(saved.clock)?saved.clock:9*60,weather:saved.weather==='rain'?'rain':'clear',quests:saved.quests||{},secrets:saved.secrets||{},corner:Array.isArray(saved.corner)?saved.corner:['bed']};
    this.installUI();this.rebuild();
  }
  installUI(){
    const hud=document.querySelector('#hud');
    const nav=document.createElement('div');nav.className='life-nav';nav.innerHTML='<button data-life="journal">📖 Пригоди</button><button data-life="corner">🧶 Мій куточок</button><button data-life="home">🏠 Додому</button>';
    nav.addEventListener('click',e=>{const action=e.target.closest('[data-life]')?.dataset.life;if(action==='home')this.goHome();else if(action)this.panel(action);});hud.append(nav);
    this.status=document.createElement('div');this.status.className='life-status';hud.append(this.status);
    this.prompt=document.createElement('button');this.prompt.className='life-prompt';this.prompt.hidden=true;this.prompt.addEventListener('click',()=>this.interact());hud.append(this.prompt);
    const style=document.createElement('style');style.textContent=`.life-nav{position:absolute;top:18px;left:50%;transform:translateX(-50%);display:flex;gap:6px;pointer-events:auto}.life-nav button{font-size:12px;padding:9px}.life-status{position:absolute;top:65px;left:50%;transform:translateX(-50%);background:#fff8e9ec;border-radius:14px;padding:6px 12px;font-size:12px;text-align:center;max-width:45vw}.life-prompt{position:absolute;bottom:100px;left:50%;transform:translateX(-50%);pointer-events:auto;max-width:65vw;font-size:13px;background:#fff4d5}.life-prompt[hidden]{display:none}.life-list{display:grid;gap:10px;margin:15px 0}.life-item{padding:14px;background:white;border-radius:15px}.life-item p{font-size:13px;margin:5px 0}.life-links{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}@media(max-width:700px){.life-nav{top:auto;bottom:110px;left:10px;transform:none;flex-direction:column}.life-nav button{padding:7px;font-size:10px}.life-status{top:10px;max-width:38vw;font-size:10px}.life-prompt{bottom:225px;font-size:11px}}`;document.head.append(style);
    document.querySelector('#panel').addEventListener('click',e=>{const button=e.target.closest('[data-life-action]');if(!button)return;const action=button.dataset.lifeAction;if(action==='buy')this.buy(button.dataset.item);if(action==='weather'){this.data.weather=this.data.weather==='clear'?'rain':'clear';this.persist();this.panel('journal');}if(action==='time'){this.data.clock=(this.data.clock+720)%1440;this.persist();this.panel('journal');}if(action==='home'){this.goHome();this.closePanel();}if(action==='garden'){this.teleport(-5,.2,17);this.closePanel();}if(action==='ship'){this.teleport(4,22.52,43);this.closePanel();}});
  }
  material(color,roughness=.8){return new this.T.MeshStandardMaterial({color,roughness});}
  group(x,y,z,parent=this.root){const g=new this.T.Group();g.position.set(x,y,z);parent.add(g);return g;}
  shape(kind,p,size,material,parent=this.root){const T=this.T;let geometry;if(kind==='sphere')geometry=new T.SphereGeometry(1,20,14);else if(kind==='cylinder')geometry=new T.CylinderGeometry(1,1,1,24);else geometry=new T.BoxGeometry(1,1,1);const m=new T.Mesh(geometry,material);m.position.set(...p);m.scale.set(...size);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
  box(p,s,m,g){return this.shape('box',p,s,m,g);} sphere(p,s,m,g){return this.shape('sphere',p,s,m,g);}
  action(id,label,x,y,z,run,range=1.8,context='home'){const a={id,label,position:new this.T.Vector3(x,y,z),run,range,context};this.actions.push(a);return a;}
  platform(x,z,w,d,y,context='home'){this.platforms.push({x,z,w,d,y,context});}
  inContext(context){const s=this.getState();if(context==='ship')return s.onMothership;if(context==='home')return !s.onMothership&&!s.currentHome&&!s.insideMansion;return !s.onMothership&&!s.currentHome&&!s.insideMansion;}
  rebuild(){
    if(this.root){this.root.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});this.root.removeFromParent();}
    this.root=new this.T.Group();this.root.name='Cat life expansion';this.world.add(this.root);this.actions=[];this.platforms=[];this.toys=[];this.animals=[];this.cabinets=[];this.velocity=0;this.climb=null;this.hidden=false;this.sleeping=false;
    this.wood=this.material(0xa97c56);this.fabric=this.material(0x889cac);this.cream=this.material(0xffe8c6);this.pink=this.material(0xe98c9f);this.green=this.material(0x578451);this.dark=this.material(0x353642);this.gold=this.material(0xeac76c,.3);
    this.sharedMaterials=new Set([this.wood,this.fabric,this.cream,this.pink,this.green,this.dark,this.gold]);
    this.buildFurniture();this.buildToys();this.buildClimbing();this.buildAnimals();this.buildSecrets();this.buildWeather();this.buildCorner();
    this.ownerAnchor=new this.T.Vector3(-4.5,0,-10.4);this.ownerCooldown=0;
  }
  buildFurniture(){
    // Existing sofa and tables now have actual support surfaces.
    this.platform(-6,-2.2,2.7,.75,.8);this.platform(-1.1,1.5,2.3,1.12,.85);this.platform(6,-3.2,2.3,1.12,.85);this.platform(0,10.2,2.3,1.12,.85);
    this.action('sofa','Застрибнути на диван',-6,.3,-2.9,()=>this.hopTo(-6,.92,-2.2));
    const bed=this.group(-4.5,0,-9.5);
    for(const x of [-1.1,1.1])for(const z of [-1.5,1.5])this.box([x,.4,z],[.12,.8,.12],this.wood,bed);
    this.box([0,.85,0],[2.5,.17,3.3],this.wood,bed);this.box([0,1.02,0],[2.4,.22,3.2],this.cream,bed);this.box([0,1.17,.4],[2.4,.1,2.3],this.fabric,bed);this.box([0,1.22,-1.1],[1.4,.16,.65],this.cream,bed);this.box([0,1,-1.64],[2.6,1.5,.12],this.wood,bed);
    this.platform(-4.5,-9.5,2.5,3.3,1.25);
    this.action('hide-bed','Сховатися під ліжком / вийти',-4.5,.2,-8,()=>{this.hidden=!this.hidden;this.sleeping=false;if(this.hidden)this.teleport(-4.5,.12,-9.5,true);this.bubble(this.hidden?'Тихенько… господар тебе не бачить.':'Можна виходити!');},2.4);
    const cabinet=this.group(8,0,-6.35);this.box([0,.46,0],[1.4,.9,.65],this.wood,cabinet);this.box([0,.97,0],[1.55,.12,.8],this.cream,cabinet);
    const pivot=this.group(-.69,.45,-.39,cabinet);this.box([.69,0,0],[1.35,.85,.07],this.fabric,pivot);this.sphere([1.15,0,-.06],[.045,.045,.045],this.gold,pivot);this.cabinets.push({pivot,open:false});
    const toy=this.sphere([0,.3,-.15],[.12,.1,.12],this.pink,cabinet);toy.visible=!this.data.quests.toy;
    this.action('cabinet','Відкрити / закрити шафку',8,.3,-5.5,()=>{const c=this.cabinets[0];c.open=!c.open;this.toast(c.open?'Шафку відкрито. Усередині щось є!':'Шафку зачинено.');});
    this.action('hidden-toy','Забрати сховану іграшку',8,.35,-6.2,()=>{if(!this.cabinets[0].open){this.bubble('Спершу відкрий шафку.');return;}toy.visible=false;this.complete('toy');},1.05);
    const plate=this.shape('cylinder',[6,.91,-3.2],[.28,.035,.28],this.cream);
    const fish=this.group(6,.98,-3.2);this.sphere([0,0,0],[.22,.055,.09],this.material(0xe79a77),fish);const tail=this.box([-.22,0,0],[.12,.03,.16],this.pink,fish);tail.rotation.y=Math.PI/4;fish.visible=!this.data.quests.dinner;
    this.action('dinner','Украсти вечерю',6,1,-3.2,()=>{if(this.data.quests.dinner){this.bubble('Тарілка вже порожня.');return;}fish.visible=false;this.save.anger=Math.min(95,this.save.anger+18);this.complete('dinner');this.ownerState='scold';this.ownerCooldown=4;},1.6);
    const bowl=this.shape('cylinder',[-2,.12,5],[.28,.16,.28],this.pink);this.food=this.shape('cylinder',[-2,.21,5],[.22,.035,.22],this.wood);this.food.visible=false;
    this.action('bowl','Поїсти з миски',-2,.2,5,()=>{if(!this.food.visible){this.bubble('Миска порожня. Попроси їжу в господаря.');return;}this.food.visible=false;this.setEnergy(100);this.save.anger=Math.max(0,this.save.anger-5);this.persist();this.toast('Ням! Енергію відновлено.');});
    this.action('owner','Попросити ласку або їжу',0,0,0,()=>this.ownerInteract(),2,'dynamic');
  }
  toy(kind,x,z){
    const g=this.group(x,.16,z);const material=kind==='yarn'?this.pink:kind==='ball'?this.material(0x78b6d6):this.fabric;
    this.sphere([0,0,0],kind==='mouse'?[.18,.09,.09]:[.15,.15,.15],material,g);
    if(kind==='yarn'){for(let i=0;i<6;i++){const ring=new this.T.Mesh(new this.T.TorusGeometry(.151,.007,5,32),this.cream);ring.rotation.set(i*.7,i*.9,0);g.add(ring);}}
    if(kind==='mouse'){for(let side of [-1,1])this.sphere([.08,.08,side*.065],[.05,.05,.025],this.pink,g);this.sphere([.16,.02,0],[.02,.02,.02],this.dark,g);const curve=new this.T.CatmullRomCurve3([new this.T.Vector3(-.16,0,0),new this.T.Vector3(-.3,.01,.06),new this.T.Vector3(-.43,0,-.03)]);g.add(new this.T.Mesh(new this.T.TubeGeometry(curve,12,.012,6,false),this.pink));}
    if(kind==='ball')this.sphere([.08,.1,-.08],[.055,.055,.055],this.cream,g);
    const toy={g,kind,velocity:new this.T.Vector3()};this.toys.push(toy);
    const a=this.action('toy-'+kind,'Погратися: '+({yarn:'клубок',ball:'м’ячик',mouse:'мишка'}[kind]),x,.16,z,()=>{const direction=toy.g.position.clone().sub(this.cat.position);direction.y=0;if(direction.lengthSq()<.01)direction.set(1,0,0);toy.velocity.copy(direction.normalize().multiplyScalar(3.5));this.setEnergy(Math.min(100,this.getState().energy+5));this.toast('Тиць лапкою!');});a.toy=toy;
  }
  buildToys(){this.toy('yarn',-3,4);this.toy('ball',0,5);this.toy('mouse',1.5,3.5);
    const box=this.group(-6,0,5);const cardboard=this.material(0xb88a58);this.box([0,.04,0],[1.3,.08,1.2],cardboard,box);for(const x of [-.65,.65])this.box([x,.35,0],[.05,.7,1.2],cardboard,box);for(const z of [-.6,.6])this.box([0,.35,z],[1.3,.7,.05],cardboard,box);for(const side of [-1,1]){const flap=this.box([side*.9,.69,0],[.5,.04,1.2],cardboard,box);flap.rotation.z=side*.35;}
    this.action('box','Залізти в коробку / вийти',-6,.2,5,()=>{this.hidden=!this.hidden;this.sleeping=false;if(this.hidden)this.teleport(-6,.12,5,true);this.toast(this.hidden?'Коробка — найкращий будиночок.':'Час пригод!');});
  }
  hopTo(x,y,z){this.climb={start:this.cat.position.clone(),end:new this.T.Vector3(x,y,z),t:0};this.hidden=false;this.sleeping=false;this.velocity=0;}
  buildClimbing(){
    // Route: trunk -> branch -> fence -> first roof -> connecting rooftop bridge.
    const trunk=this.shape('cylinder',[-8,1.7,17],[.32,3.4,.32],this.wood);this.sphere([-8,4.2,17],[1.8,1.6,1.6],this.green);
    this.box([-7,2.3,17],[2.2,.15,.45],this.wood);this.platform(-7,17,2.2,.5,2.4);
    this.action('tree-up','Лізти на дерево',-8,.3,16.3,()=>this.hopTo(-7,2.52,17));
    this.action('tree-down','Спуститися з дерева',-7,2.5,17,()=>this.hopTo(-8,.2,16.3),1.1);
    for(let i=0;i<3;i++){const y=.7+i*.75,x=-11+i*.5;this.box([x,y,-6.6],[1.25,.12,.65],this.wood);this.platform(x,-6.6,1.25,.65,y+.06);}
    this.action('shelf-up','Лізти на полиці',-11,.2,-6,()=>this.hopTo(-10,2.38,-6.6));
    this.action('shelf-down','Зістрибнути з полиці',-10,2.4,-6.6,()=>this.hopTo(-10,.2,-5.5),1.1);
    this.box([-9,1.23,23],[6,.15,.3],this.wood);this.platform(-9,23,6,.35,1.31);
    this.action('fence-up','Залізти на паркан',-9,.2,22,()=>this.hopTo(-9,1.43,23));
    this.action('fence-down','Зістрибнути з паркана',-9,1.4,23,()=>this.hopTo(-9,.2,21.5),.9);
    this.action('tree-fence','Перестрибнути на паркан',-6.2,2.5,17,()=>this.hopTo(-9,1.43,23),1.1);
    // Rooftop access is placed beside the flat-roof neighbor at x=-10.
    for(let i=0;i<14;i++)this.box([-16.3,.3+i*.45,54],[.8,.06,.3],this.wood);
    this.action('roof-up','Лізти драбиною на дах',-16.3,.2,54,()=>this.hopTo(-10,7.05,56),2,'outdoor');
    this.platform(-10,56,12,11,6.93,'outdoor');
    this.action('roof-down','Спуститися з даху',-10,7.05,56,()=>this.hopTo(-16.3,.2,54),1.5,'outdoor');
    this.box([0,7.02,56],[8,.15,.9],this.wood);this.platform(0,56,8,.9,7.1,'outdoor');
    this.box([10,7.02,56],[12,.15,10],this.fabric);this.platform(10,56,12,10,7.1,'outdoor');
    this.action('roof-route','Стрибок на місток до сусіднього даху',-4.5,7,56,()=>this.hopTo(-3.5,7.22,56),1.5,'outdoor');
  }
  buildAnimals(){
    for(let i=0;i<2;i++){
      const fur=this.material(i?0x747b89:0xe2b785),model=window.createCatModel(this.T,{fur,collar:this.pink,patchMaterials:[this.cream,this.dark]});const g=model.root;g.position.set(-5+i*9,.12,18+i*2);this.root.add(g);this.animals.push({g,kind:'cat',origin:g.position.clone(),phase:i*3,model});
      this.action('neighbor-cat-'+i,'Познайомитися із сусідським котом',g.position.x,.3,g.position.z,()=>{this.bubble('Мур-мур! Новий котячий друг 🐾');this.setEnergy(Math.min(100,this.getState().energy+8));},1.5,'outdoor').animal=g;
    }
    const dog=this.group(7,0,20);const brown=this.material(0x9c704c);this.sphere([0,.46,0],[.48,.25,.2],brown,dog);this.sphere([.4,.7,0],[.23,.24,.2],brown,dog);this.sphere([.59,.63,0],[.19,.1,.11],this.cream,dog);for(const side of [-1,1]){this.sphere([.37,.65,side*.19],[.09,.23,.06],this.dark,dog);this.sphere([.55,.76,side*.11],[.025,.025,.025],this.dark,dog);for(const x of [-.3,.3])this.shape('cylinder',[x,.22,side*.14],[.06,.44,.06],brown,dog);}const tail=this.box([-.55,.62,0],[.35,.08,.08],brown,dog);tail.rotation.z=-.5;this.animals.push({g:dog,kind:'dog',origin:dog.position.clone(),phase:2,tail});
    this.action('dog','Потоваришувати з собакою',7,.4,20,()=>{this.bubble('Гав! Собака радісно махає хвостом.');this.dogFriendly=15;},2,'outdoor').animal=dog;
    for(let i=0;i<7;i++){
      const g=this.group(-8+i*2,2+i%3,17);const butterfly=i>=3,color=this.material(butterfly?[0xeeae66,0xc997dc,0x89bee3,0xf4db6b][i%4]:0x8d9cba);
      this.sphere([0,0,0],butterfly?[.025,.09,.025]:[.12,.1,.2],this.dark,g);
      const wings=[];for(const side of [-1,1]){const wing=this.group(0,0,0,g);this.sphere([side*(butterfly?.09:.2),0,0],butterfly?[.1,.12,.025]:[.22,.025,.11],color,wing);wings.push(wing);}
      if(!butterfly){const beak=new this.T.Mesh(new this.T.ConeGeometry(.035,.12,8),this.gold);beak.rotation.x=-Math.PI/2;beak.position.z=.23;g.add(beak);}
      this.animals.push({g,kind:butterfly?'butterfly':'bird',origin:g.position.clone(),phase:i*2,wings});
    }
  }
  buildSecrets(){
    const glow=new this.T.MeshStandardMaterial({color:0x77e9cf,emissive:0x35cdb7,emissiveIntensity:.6});
    this.box([-12.8,.45,3],[.15,.9,1.4],this.wood);
    this.action('passage','Пролізти в таємний хід',-12,.3,3,()=>{this.teleport(-10,.2,20);this.discover('passage','Знайдено таємний хід у сад!');},1.5);
    this.action('passage-back','Таємний хід додому',-10,.3,20,()=>this.teleport(-12,.2,3),1.3,'outdoor');
    const chest=this.group(10,7.25,56);this.box([0,.2,0],[.7,.4,.45],this.wood,chest);this.box([0,.23,-.24],[.12,.18,.03],this.gold,chest);chest.visible=!this.data.secrets.roof;
    this.action('roof-treasure','Відкрити скриню на даху',10,7.4,56,()=>{if(this.discover('roof','Скарб на даху! +$60',60))chest.visible=false;},1.5,'outdoor');
    const pod=this.group(11,22.5,48);this.shape('cylinder',[0,.12,0],[1,.24,1],glow,pod);this.sphere([0,.5,0],[1,.25,1],this.fabric,pod);
    this.action('ship-nook','Відпочити в котячій капсулі',11,22.7,48,()=>{this.discover('ship','Таємне котяче місце на кораблі! +$40',40);this.sleeping=!this.sleeping;this.toast(this.sleeping?'Космічне муркотіння… E — прокинутися':'Час рятувати галактику!');},1.8,'ship');
    this.action('ship-home','Спуститися просто додому',4,22.6,43,()=>this.goHome(),1.6,'ship');
    this.action('home-ship','Повернутися на корабель',1,.2,7,()=>this.teleport(4,22.52,43),1.5);
  }
  buildWeather(){
    const T=this.T;this.sunPatch=new T.Mesh(new T.PlaneGeometry(2.5,3.4),new T.MeshBasicMaterial({color:0xffdf87,transparent:true,opacity:.25,depthWrite:false,side:T.DoubleSide}));this.sunPatch.rotation.x=-Math.PI/2;this.sunPatch.position.set(-2,.055,-5);this.root.add(this.sunPatch);
    this.action('sun-sleep','Подрімати в сонячній плямі / прокинутися',-2,.2,-5,()=>{if(this.sunPatch.visible){this.sleeping=!this.sleeping;this.toast(this.sleeping?'Тепло… мур-р-р. E — прокинутися.':'Виспані лапки готові до пригод!');}else this.bubble('Сонячна пляма з’явиться вдень за ясної погоди.');});
    const points=[];for(let i=0;i<500;i++)points.push(-16+(i*7.31)%32,2+(i*.73)%10,9+(i*3.17)%18);
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));this.rain=new T.Points(geometry,new T.PointsMaterial({color:0xaed8ff,size:.055,transparent:true,opacity:.65}));this.root.add(this.rain);
    this.nightLamp=new T.PointLight(0x99b5ff,3,25);this.nightLamp.position.set(0,3,2);this.root.add(this.nightLamp);
  }
  buildCorner(){
    if(this.cornerGroup){this.cornerGroup.traverse(o=>{o.geometry?.dispose();});this.cornerGroup.removeFromParent();}
    this.cornerGroup=this.group(8,0,3);this.actions=this.actions.filter(a=>!a.id.startsWith('corner-'));
    const g=this.cornerGroup;
    this.box([0,.025,0],[4,.05,3],this.fabric,g);
    if(this.data.corner.includes('bed')){
      const bed=new this.T.Mesh(new this.T.TorusGeometry(.62,.14,12,40),this.pink);bed.rotation.x=Math.PI/2;bed.position.set(-.9,.2,0);g.add(bed);this.shape('cylinder',[-.9,.1,0],[.59,.12,.59],this.cream,g);
      this.action('corner-bed','Спати на лежанці / прокинутися',7.1,.2,3,()=>{this.sleeping=!this.sleeping;this.toast(this.sleeping?'М’яка лежанка. E — прокинутися.':'Добрий ранок!');});
    }
    if(this.data.corner.includes('scratch')){
      this.shape('cylinder',[.4,.06,0],[.4,.12,.4],this.wood,g);this.shape('cylinder',[.4,.65,0],[.13,1.2,.13],this.cream,g);
      for(let i=0;i<16;i++){const ring=new this.T.Mesh(new this.T.TorusGeometry(.132,.015,5,20),this.wood);ring.rotation.x=Math.PI/2;ring.position.set(.4,.16+i*.062,0);g.add(ring);}
      this.action('corner-scratch','Точити кігтики',8.4,.3,3,()=>{this.save.anger=Math.max(0,this.save.anger-8);this.setEnergy(Math.min(100,this.getState().energy+10));this.persist();this.toast('Кігтики гострі, меблі цілі!');});
    }
    if(this.data.corner.includes('house')){
      this.box([1.2,.4,0],[.8,.8,.9],this.wood,g);this.sphere([1.2,.34,-.46],[.25,.28,.012],this.dark,g);const roof=new this.T.Mesh(new this.T.ConeGeometry(.78,.55,4),this.pink);roof.rotation.y=Math.PI/4;roof.position.set(1.2,1.05,0);g.add(roof);
      this.action('corner-house','Сховатися в будиночку / вийти',9.2,.2,2.5,()=>{this.hidden=!this.hidden;if(this.hidden)this.teleport(9.2,.12,3,true);});
    }
  }
  complete(id){if(this.data.quests[id])return false;this.data.quests[id]=true;this.save.money+=35;this.persist();this.toast('Завдання виконано! +$35');return true;}
  discover(id,text,reward=0){if(this.data.secrets[id]){this.toast('Цей секрет уже знайдено.');return false;}this.data.secrets[id]=true;this.save.money+=reward;this.persist();this.toast(text);return true;}
  buy(id){const costs={bed:0,scratch:45,house:80};if(!(id in costs)||this.data.corner.includes(id))return;if(this.save.money<costs[id]){this.toast('Потрібно ще трохи монет. Виконуй завдання!');return;}this.save.money-=costs[id];this.data.corner.push(id);this.persist();this.buildCorner();this.panel('corner');}
  panel(which){
    const p=document.querySelector('#panel');
    if(which==='corner')p.innerHTML='<div class="panelhead"><h2>🧶 Котячий куточок</h2><button class="close" onclick="closePanel()">✕</button></div><p>Куточок розташований біля входу праворуч. Покупки зберігаються в усіх домівках.</p><div class="life-list">'+[['bed','М’яка лежанка',0,'Відпочивай і відновлюй енергію.'],['scratch','Кігтеточка',45,'Точи кігті й заспокоюй господаря.'],['house','Котячий будиночок',80,'Власне затишне сховище.']].map(([id,name,cost,description])=>`<div class="life-item"><b>${name}</b><p>${description}</p><button data-life-action="buy" data-item="${id}" ${this.data.corner.includes(id)||this.save.money<cost?'disabled':''}>${this.data.corner.includes(id)?'Уже облаштовано':`Придбати · $${cost}`}</button></div>`).join('')+'</div>';
    else p.innerHTML='<div class="panelhead"><h2>📖 Котячі пригоди</h2><button class="close" onclick="closePanel()">✕</button></div><p>E або кнопка підказки — взаємодія · Space — стрибок · F — нявкнути. Рух дозволяє вийти зі схованки або прокинутися.</p><div class="life-links"><button data-life-action="home">🏠 Додому</button><button data-life-action="garden">🌳 У сад</button><button data-life-action="ship">🛸 На корабель</button></div><div class="life-list">'+[['dinner','Украсти вечерю','Риба лежить на обідньому столі праворуч від дивана.'],['wake','Розбудити господаря','Уночі знайди господаря біля ліжка й нявкни або натисни E.'],['toy','Знайти сховану іграшку','Відкрий шафку на кухні, потім підійди ближче.']].map(([id,title,hint])=>`<div class="life-item"><b>${this.data.quests[id]?'✅':'🐾'} ${title}</b><p>${hint}</p><small>${this.data.quests[id]?'Виконано · нагороду отримано':'Нагорода: $35'}</small></div>`).join('')+`</div><p>Секрети: ${Object.keys(this.data.secrets).length}/3. Шукай прохід ліворуч від входу, скарб на сусідньому даху й капсулу на кораблі.</p><p>До дахів веде драбина біля будинку ліворуч від міського ліфта. Дерево й паркан — у саду; полиці — ліворуч у кімнаті.</p><div class="life-links"><button data-life-action="time">🌓 Перемкнути день / ніч</button><button data-life-action="weather">${this.data.weather==='rain'?'☀️ Увімкнути ясну погоду':'🌧️ Увімкнути дощ'}</button></div>`;
    document.querySelector('#modal').classList.add('open');
  }
  teleport(x,y,z,keepHidden=false){this.cat.position.set(x,y,z);this.velocity=0;this.climb=null;this.sleeping=false;if(!keepHidden)this.hidden=false;this.setLocation(y>15?'ship':'home');}
  goHome(){this.teleport(0,.12,5.5);this.moveOwnerHome();this.toast('Твоя домівка: іграшки біля входу, сад попереду.');}
  moveOwnerHome(){this.owner.position.set(-3.8,0,-8.7);this.ownerState='calm';this.ownerCooldown=0;}
  nearest(){
    let best=null,distance=Infinity;
    for(const a of this.actions){if(a.id==='owner'){a.position.copy(this.owner.position);if(this.owner.position.y>15)continue;}else if(!this.inContext(a.context))continue;if(a.toy)a.position.copy(a.toy.g.position);if(a.animal)a.position.copy(a.animal.position);
      if(a.id==='hidden-toy'&&(!this.cabinets[0].open||this.data.quests.toy))continue;
      if(a.id==='dinner'&&this.data.quests.dinner)continue;
      const d=this.cat.position.distanceTo(a.position);if(d<a.range&&d<distance){best=a;distance=d;}
    }return best;
  }
  interact(){const a=this.nearest();if(!a)return false;a.run();return true;}
  night(){return this.data.clock<360||this.data.clock>=1200;}
  meow(){if(this.owner.position.distanceTo(this.cat.position)<4){if(this.ownerState==='sleep'){this.complete('wake');this.ownerState='scold';this.ownerCooldown=5;this.bubble('Господар прокинувся: «Ну котику!»');}else this.ownerInteract();return true;}return false;}
  ownerInteract(){
    if(this.ownerState==='sleep'){this.complete('wake');this.ownerState='scold';this.ownerCooldown=5;this.bubble('Господар прокинувся!');return;}
    if(this.save.anger>=45){this.ownerState='scold';this.ownerCooldown=4;this.bubble('Не чіпай меблі!');this.save.anger=Math.max(0,this.save.anger-4);}
    else if(this.getState().energy<85||!this.food.visible){this.food.visible=true;this.ownerState='feed';this.ownerCooldown=4;this.bubble('Господар насипав корм у миску біля входу.');}
    else{this.ownerState='pet';this.ownerCooldown=4;this.save.anger=Math.max(0,this.save.anger-8);this.setEnergy(100);this.bubble('Господар гладить тебе. Мур-р-р…');}this.persist();
  }
  jump(){if(this.climb)return;this.hidden=false;this.sleeping=false;if(this.grounded){this.velocity=4.8;this.grounded=false;}}
  stepVertical(dt,base){
    if(this.climb){const c=this.climb;c.t=Math.min(1,c.t+dt*1.3);const t=c.t*c.t*(3-2*c.t);this.cat.position.lerpVectors(c.start,c.end,t);this.cat.position.y+=Math.sin(c.t*Math.PI)*.65;if(c.t===1){this.climb=null;this.velocity=0;}return this.cat.position.y;}
    const old=this.cat.position.y-.12;this.velocity-=dt*12;let next=old+this.velocity*dt;let ground=base;
    for(const p of this.platforms){if(!this.inContext(p.context))continue;if(Math.abs(this.cat.position.x-p.x)<=p.w/2&&Math.abs(this.cat.position.z-p.z)<=p.d/2&&p.y<=old+.08&&p.y>=ground)ground=p.y;}
    if(next<=ground){next=ground;this.velocity=0;this.grounded=true;}else this.grounded=false;
    return next+.12;
  }
  beforeMove(moving){if(moving){this.hidden=false;this.sleeping=false;}return !this.climb;}
  updateOwner(dt){
    const owner=this.owner,s=this.getState();this.ownerCooldown=Math.max(0,this.ownerCooldown-dt);
    if(s.onMothership){owner.rotation.set(0,0,0);return;}
    if(owner.position.y>15)this.moveOwnerHome();
    const distance=owner.position.distanceTo(this.cat.position);
    if(this.ownerCooldown===0){if(this.night()&&this.save.anger<45)this.ownerState='sleep';else if(this.save.anger>55&&!this.hidden)this.ownerState='chase';else this.ownerState='calm';}
    const target=this.ownerState==='chase'?this.cat.position:this.ownerState==='sleep'?this.ownerAnchor:new this.T.Vector3(-1+Math.sin(this.time*.15)*2,0,1+Math.cos(this.time*.12)*2);
    if(!['pet','feed','scold'].includes(this.ownerState)){const d=target.clone().sub(owner.position);d.y=0;if(d.length()>.55){owner.position.addScaledVector(d.normalize(),dt*(this.ownerState==='chase'?2.3:.65));owner.lookAt(target.x,owner.position.y,target.z);}}
    owner.position.y=this.ownerState==='sleep'?1.35:0;owner.rotation.x=this.ownerState==='sleep'?Math.PI/2:0;
    if(this.ownerState==='sleep')owner.rotation.y=0;
    else if(['pet','feed','scold'].includes(this.ownerState))owner.lookAt(this.cat.position.x,owner.position.y,this.cat.position.z);
    owner.rotation.z=this.ownerState==='pet'?-.12+Math.sin(this.time*5)*.035:this.ownerState==='scold'?Math.sin(this.time*12)*.04:0;
    for(const [i,arm] of (owner.userData.arms||[]).entries())arm.rotation.x=this.ownerState==='pet'?-.8+Math.sin(this.time*5)*.2:this.ownerState==='feed'?-.6:this.ownerState==='scold'&&i===0?-1.5+Math.sin(this.time*10)*.15:0;
    if(this.ownerState==='chase'&&distance<1&&!this.hidden&&this.cat.position.y<1.8){this.ownerState='scold';this.ownerCooldown=6;this.save.anger=Math.max(0,this.save.anger-20);this.teleport(0,.12,4);this.persist();this.bubble('Спіймав! Спробуй сховатися під ліжком або в коробці.');}
  }
  update(dt){
    this.time+=dt;this.data.clock=(this.data.clock+dt)%1440;
    if(this.time-(this.lastSave||0)>15){this.lastSave=this.time;this.persist();}
    const daylight=Math.max(0,Math.sin((this.data.clock-360)/1440*Math.PI*2)),rain=this.data.weather==='rain';
    this.sun.intensity=(.15+daylight*4)*(rain?.45:1);this.hemi.intensity=.4+daylight;this.scene.background.setHex(this.night()?0x18263f:rain?0x8c9ba9:0xd8d5ca);this.scene.fog.color.copy(this.scene.background);this.nightLamp.intensity=this.night()?4:0;
    this.sunPatch.visible=!rain&&daylight>.3;this.sunPatch.material.opacity=daylight*.3;
    this.rain.visible=rain;const attr=this.rain.geometry.attributes.position;if(rain){for(let i=0;i<attr.count;i++){let y=attr.getY(i)-dt*9;if(y<0)y+=12;attr.setY(i,y);}attr.needsUpdate=true;}
    for(const c of this.cabinets)c.pivot.rotation.y=this.T.MathUtils.damp(c.pivot.rotation.y,c.open?-Math.PI*.65:0,7,dt);
    for(const toy of this.toys){toy.g.position.addScaledVector(toy.velocity,dt);toy.velocity.multiplyScalar(Math.exp(-dt*1.8));for(const axis of ['x','z'])if(Math.abs(toy.g.position[axis])>11){toy.g.position[axis]=Math.sign(toy.g.position[axis])*11;toy.velocity[axis]*=-.6;}toy.g.rotation.z-=toy.velocity.x*dt*4;toy.g.rotation.x+=toy.velocity.z*dt*4;}
    for(const a of this.animals){const t=this.time+a.phase;
      if(a.kind==='bird'||a.kind==='butterfly'){a.g.position.set(a.origin.x+Math.sin(t*.5)*2,a.origin.y+Math.sin(t*1.8)*.35,a.origin.z+Math.cos(t*.5)*2);a.wings.forEach((w,i)=>w.rotation.z=Math.sin(t*(a.kind==='bird'?9:18))*.65*(i?1:-1));a.g.rotation.y=-t*.5;}
      else{const near=a.g.position.distanceTo(this.cat.position)<2.5&&!this.getState().onMothership;if(a.kind==='dog'){a.tail.rotation.y=Math.sin(t*10)*(this.dogFriendly>0?.8:.25);if(near&&this.dogFriendly<=0)this.cat.position.addScaledVector(this.cat.position.clone().sub(a.g.position).setY(0).normalize(),dt*.8);}
        a.g.position.x=a.origin.x+Math.sin(t*.3)*1.5;a.g.rotation.y=Math.cos(t*.3)>0?0:Math.PI;
        if(a.model){a.model.legs.forEach((leg,i)=>leg.rotation.z=Math.sin(t*6+i*Math.PI)*.3);a.model.tail.rotation.x=Math.sin(t*2)*.25;}
      }
    }this.dogFriendly=Math.max(0,(this.dogFriendly||0)-dt);
    if(this.sleeping)this.setEnergy(Math.min(100,this.getState().energy+dt*12));this.cat.scale.y=this.hidden?.55:this.sleeping?.7:1;
    const nearest=this.nearest();this.prompt.hidden=!nearest;this.prompt.textContent=nearest?'E · '+nearest.label:'';
    const hour=Math.floor(this.data.clock/60),minute=Math.floor(this.data.clock%60);this.status.textContent=`${this.night()?'🌙':'☀️'} ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')} · ${rain?'🌧️ Дощ':'Ясно'} · ${this.hidden?'Схованка':this.sleeping?'Сон':({calm:'Господар спокійний',sleep:'Господар спить',chase:'Господар наздоганяє!',scold:'Господар сварить',pet:'Ласка',feed:'Годування'}[this.ownerState])}`;
    const mission=document.querySelector('#missionText'),progress=document.querySelector('#missionProgress');const task=[['dinner','Украсти вечерю'],['wake','Розбудити господаря'],['toy','Знайти сховану іграшку']].find(([id])=>!this.data.quests[id]);if(mission)mission.textContent=task?task[1]:'Усі котячі завдання виконано!';if(progress)progress.textContent=`${Object.keys(this.data.quests).length}/3 · 📖 Пригоди — підказки`;
  }
};
