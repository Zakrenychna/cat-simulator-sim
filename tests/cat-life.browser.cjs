/* Run with PLAYWRIGHT_MODULE pointing to a Playwright installation.
   Serve the repository at http://127.0.0.1:8765 before running. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1')&&r.status()>=400)failed.push(r.url());});
  await page.addInitScript(()=>{let implementation;Object.defineProperty(window,'CatLife',{configurable:true,get:()=>implementation,set:value=>{implementation=new Proxy(value,{construct(target,args){const life=Reflect.construct(target,args);window.__life=life;return life;}});}});});
  await page.goto('http://127.0.0.1:8765');await page.waitForFunction(()=>window.__life,{timeout:60000});
  await page.getByRole('button',{name:"LET'S CAUSE CHAOS"}).click();
  await page.locator('[data-life="home"]').click();
  await page.waitForFunction(()=>window.__life.cat.position.y<1);
  const initial=await page.evaluate(()=>({toys:__life.toys.length,animals:__life.animals.length,platforms:__life.platforms.length,actions:__life.actions.length}));
  assert.equal(initial.toys,3);assert.equal(initial.animals,10);assert(initial.platforms>=12);assert(initial.actions>=30);
  await page.locator('[data-life="journal"]').click();assert(await page.getByRole('heading',{name:'📖 Котячі пригоди'}).isVisible());
  const frozen=await page.evaluate(()=>__life.data.clock);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__life.data.clock),frozen);await page.locator('.close').click();
  // Owner supplies food, pets a friendly cat, then pursues/catches after mischief.
  await page.evaluate(()=>{__life.save.anger=0;__life.data.clock=600;__life.teleport(-3.8,.12,-8);});
  await page.keyboard.press('f');assert.equal(await page.evaluate(()=>__life.food.visible),true);
  await page.evaluate(()=>__life.teleport(-2,.12,5));await page.keyboard.press('e');assert.equal(await page.evaluate(()=>__life.food.visible),false);
  await page.evaluate(()=>{__life.food.visible=true;__life.teleport(__life.owner.position.x+.8,.12,__life.owner.position.z);__life.setEnergy(100);});
  await page.keyboard.press('f');assert.equal(await page.evaluate(()=>__life.ownerState),'pet');
  await page.evaluate(()=>{__life.save.anger=80;__life.ownerCooldown=0;__life.teleport(__life.owner.position.x+.4,.12,__life.owner.position.z);__life.hidden=true;});
  await page.waitForFunction(()=>__life.ownerState==='calm');assert(await page.evaluate(()=>__life.cat.position.x!==0));
  await page.evaluate(()=>__life.hidden=false);await page.waitForFunction(()=>__life.ownerState==='scold'&&__life.cat.position.x===0);assert(await page.evaluate(()=>__life.save.anger<80));
  await page.evaluate(()=>{__life.save.anger=0;__life.ownerCooldown=0;});
  // Exercise keyboard interactions through proximity prompts.
  await page.evaluate(()=>__life.teleport(8,.12,-5.45));await page.waitForTimeout(100);await page.keyboard.press('e');await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>__life.cabinets[0].open),true);
  await page.evaluate(()=>__life.teleport(8,.12,-6.2));await page.keyboard.press('e');
  assert.equal(await page.evaluate(()=>__life.data.quests.toy),true);
  await page.evaluate(()=>__life.teleport(6,.97,-3.2));await page.keyboard.press('e');assert.equal(await page.evaluate(()=>__life.data.quests.dinner),true);
  await page.evaluate(()=>{__life.data.clock=1320;__life.save.anger=0;__life.ownerCooldown=0;__life.owner.position.set(-3.8,0,-8.7);__life.teleport(-3,.12,-8.7);});
  await page.waitForFunction(()=>__life.ownerState==='sleep');await page.keyboard.press('f');assert.equal(await page.evaluate(()=>__life.data.quests.wake),true);
  // Purchases use real UI and deduct money once.
  await page.locator('[data-life="corner"]').click();const money=await page.evaluate(()=>__life.save.money);await page.locator('[data-item="scratch"]').click();assert.equal(await page.evaluate(()=>__life.save.money),money-45);assert(await page.locator('[data-item="scratch"]').isDisabled());await page.locator('.close').click();
  // Hide, escape, toys and climb links.
  await page.evaluate(()=>__life.teleport(-6,.12,5));await page.keyboard.press('e');assert.equal(await page.evaluate(()=>__life.hidden),true);
  await page.keyboard.down('w');await page.waitForFunction(()=>!__life.hidden);await page.keyboard.up('w');assert.equal(await page.evaluate(()=>__life.hidden),false);
  await page.evaluate(()=>__life.teleport(-3,.12,3.2));await page.keyboard.press('e');assert(await page.evaluate(()=>__life.toys[0].velocity.length()>0));
  await page.evaluate(()=>__life.teleport(-6,.12,-2.9));await page.keyboard.press('e');await page.waitForFunction(()=>!__life.climb);await page.waitForTimeout(200);assert(await page.evaluate(()=>Math.abs(__life.cat.position.y-.92)<.08));
  await page.keyboard.press('Space');await page.waitForFunction(()=>__life.cat.position.y>1.1);assert(await page.evaluate(()=>__life.cat.position.y>1.1));await page.waitForFunction(()=>__life.grounded);
  await page.evaluate(()=>__life.teleport(-8,.12,16.3));await page.keyboard.press('e');await page.waitForFunction(()=>!__life.climb);assert(await page.evaluate(()=>__life.cat.position.y>2.4));
  await page.evaluate(()=>__life.teleport(-16.3,.12,54));await page.keyboard.press('e');await page.waitForFunction(()=>!__life.climb);assert(await page.evaluate(()=>__life.cat.position.y>6.9));
  await page.evaluate(()=>__life.teleport(10,7.4,56));await page.keyboard.press('e');assert.equal(await page.evaluate(()=>__life.data.secrets.roof),true);
  const treasureMoney=await page.evaluate(()=>__life.save.money);await page.keyboard.press('e');assert.equal(await page.evaluate(()=>__life.save.money),treasureMoney);
  await page.evaluate(()=>__life.teleport(-12,.12,3));await page.keyboard.press('e');assert.equal(await page.evaluate(()=>__life.data.secrets.passage),true);
  await page.evaluate(()=>__life.teleport(11,22.62,48));await page.keyboard.press('e');assert.equal(await page.evaluate(()=>__life.data.secrets.ship),true);
  await page.locator('[data-life="journal"]').click();await page.locator('[data-life-action="weather"]').click();assert.equal(await page.evaluate(()=>__life.data.weather),'rain');await page.locator('.close').click();await page.waitForFunction(()=>__life.rain.visible);assert.equal(await page.evaluate(()=>__life.rain.visible),true);
  await page.screenshot({path:'/tmp/cat-life-ship.png'});
  await page.locator('[data-life="home"]').click();await page.evaluate(()=>{__life.data.clock=600;__life.data.weather='clear';__life.persist();});await page.keyboard.press('v');await page.waitForTimeout(200);await page.screenshot({path:'/tmp/cat-life-home.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/cat-life-mobile.png'});assert(await page.locator('[data-life=journal]').isVisible());await page.setViewportSize({width:1365,height:900});
  await page.reload();await page.waitForFunction(()=>window.__life);assert.deepEqual(await page.evaluate(()=>__life.data.quests),{toy:true,dinner:true,wake:true});assert((await page.evaluate(()=>__life.data.corner)).includes('scratch'));assert.equal(await page.evaluate(()=>Object.keys(__life.data.secrets).length),3);
  // New home rebuild must recreate interaction links and preserve purchased items.
  await page.evaluate(()=>{__life.save.unlocked=2;window.travelHouse(1);});assert.equal(await page.evaluate(()=>__life.toys.length),3);assert.equal(await page.evaluate(()=>__life.actions.filter(a=>a.id==='corner-scratch').length),1);
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('PASS: initialization, modal pause, owner feeding/petting/capture, all quests, purchase, hiding, toy physics, sofa landing/jump, climbing, secrets, rain, reload, home rebuild.',initial);
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
