(() => {
  "use strict";

  const e = window.ecs;
  e.registerComponent({
    name: "model-ready",
    stateMachine: ({
      eid: t,
      defineState: a
    }) => {
      a("loading").initial().onEvent(e.events.GLTF_MODEL_LOADED, "ready", {
        target: t
      }), a("ready").onEnter(() => {
        window.__supraModelReady = !0, window.dispatchEvent(new Event("supra-model-ready"));
      });
    }
  });
  const t = e.registerComponent({
      name: "hotspot-anchor",
      schema: {
        label: "string"
      }
    }),
    a = "object-placed",
    o = 30;
  let n = null,
    r = null,
    i = null,
    d = null,
    s = 1,
    c = null;
  const l = () => {
      c && (window.clearTimeout(c), c = null), n = null, r = null;
    },
    p = () => n;
  e.registerComponent({
    name: "tap-to-place",
    schema: {
      prefab: "eid"
    },
    stateMachine: ({
      world: t,
      eid: l,
      schemaAttribute: p,
      defineState: b
    }) => {
      b("initial").initial().onEnter(() => {
        ((t, a) => {
          if (i) return;
          const n = t.createEntity(a);
          n.setLocalPosition({
            x: 0,
            y: -100,
            z: 0
          }), n.set(e.Scale, {
            x: o * s,
            y: o * s,
            z: o * s
          }), i = n.eid, d = t;
        })(t, p.get(l).prefab);
      }).listen(l, e.input.SCREEN_TOUCH_START, b => {
        !0 === window.__supraModelReady && b.data.worldPosition && (c = window.setTimeout(() => {
          (c => {
            const b = !n,
              f = p.get(l).prefab;
            n || (n = i || t.createEntity(f), i = null, d = null), r = t;
            const u = t.getEntity(n);
            u.show(), u.setLocalPosition(c), u.set(e.Scale, {
              x: o * s,
              y: o * s,
              z: o * s
            }), b && (u.set(e.Quaternion, e.math.quat.yRadians(Math.random() * Math.PI)), e.PositionAnimation.set(t, n, {
              duration: 650,
              loop: !1,
              fromX: c.x,
              fromY: c.y - 1.2,
              fromZ: c.z,
              toX: c.x,
              toY: c.y,
              toZ: c.z,
              easeOut: !0,
              easingFunction: "Quadratic"
            })), t.events.dispatch(l, a);
          })(b.data.worldPosition), c = null;
        }, 90));
      }).listen(l, e.input.GESTURE_START, () => {
        c && (window.clearTimeout(c), c = null);
      });
    }
  });
  const b = e.defineQuery([t]),
    f = [{
      label: "Hood",
      destination: "./details.html?part=hood"
    }, {
      label: "Trunk",
      destination: "./details.html?part=trunk"
    }, {
      label: "Left door",
      destination: "./details.html?part=left-door"
    }, {
      label: "Right door",
      destination: "./details.html?part=right-door"
    }];
  e.registerComponent({
    name: "ar-ui",
    stateMachine: ({
      world: a,
      defineState: c
    }) => {
      let u = [];
      const m = () => {
        const e = p();
        if (u.forEach(e => {
          e.style.display = "none";
        }), !e) return;
        const o = a.three.activeCamera;
        if (!o) return;
        const n = o.matrixWorldInverse.elements,
          r = o.projectionMatrix.elements;
        b(a).forEach(e => {
          const o = t.get(a, e),
            i = u.find(e => e.dataset.hotspot === o.label);
          if (i) try {
            const t = a.transform.getWorldPosition(e),
              o = n[0] * t.x + n[4] * t.y + n[8] * t.z + n[12],
              d = n[1] * t.x + n[5] * t.y + n[9] * t.z + n[13],
              s = n[2] * t.x + n[6] * t.y + n[10] * t.z + n[14],
              c = n[3] * t.x + n[7] * t.y + n[11] * t.z + n[15],
              l = r[0] * o + r[4] * d + r[8] * s + r[12] * c,
              p = r[1] * o + r[5] * d + r[9] * s + r[13] * c,
              b = r[3] * o + r[7] * d + r[11] * s + r[15] * c;
            if (b <= 0) return;
            const f = (l / b * .5 + .5) * window.innerWidth,
              u = (-p / b * .5 + .5) * window.innerHeight;
            i.style.display = "block", i.style.transform = `translate(-50%, -50%) translate(${f}px, ${u}px)`;
          } catch {
            return;
          }
        });
      };
      c("initial").initial().onEnter(() => {
        const t = document.createElement("div");
        t.id = "supra-ui-root", t.innerHTML = '\n  <style>\n    #supra-ar-hud { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }\n    #supra-ar-hud { position: fixed; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); left: 16px; z-index: 9999; pointer-events: none; }\n    .supra-panel { display: grid; grid-template-columns: 1fr auto; gap: 14px 18px; align-items: center; box-sizing: border-box; padding: 15px 16px; border: 1px solid rgba(255,255,255,.3); border-radius: 8px; background: rgba(7, 18, 16, .84); box-shadow: 0 12px 36px rgba(0,0,0,.26); backdrop-filter: blur(14px); color: white; pointer-events: auto; }\n    .supra-name { font-size: 15px; font-weight: 760; letter-spacing: .04em; }\n    .supra-status { margin-top: 4px; color: #70e9c9; font-size: 12px; font-weight: 650; }\n    .supra-reset { width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.34); border-radius: 50%; background: rgba(255,255,255,.08); color: #fff; font-size: 24px; line-height: 1; cursor: pointer; }\n    .supra-scale { grid-column: 1 / -1; display: grid; grid-template-columns: 44px 1fr 50px; gap: 12px; align-items: center; }\n    .supra-scale label, .supra-scale output { font-size: 13px; font-weight: 700; }\n    .supra-scale output { color: #70e9c9; text-align: right; }\n    #supra-scale-input { width: 100%; accent-color: #1ed7ac; }\n    #supra-car-hotspots { position: fixed; inset: 0; z-index: 9998; pointer-events: none; }\n    .supra-car-hotspot { position: fixed; display: none; min-width: 54px; height: 28px; padding: 0 12px; border: 1px solid #76f0d2; border-radius: 14px; background: rgba(5, 55, 44, .94); box-shadow: 0 5px 16px rgba(0, 0, 0, .25); color: #fff; font: 750 11px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; pointer-events: auto; }\n  </style>\n  <aside id="supra-ar-hud">\n    <div class="supra-panel">\n      <div><div class="supra-name">TOYOTA GR SUPRA</div><div class="supra-status">AR Preview</div></div>\n      <button class="supra-reset" type="button" aria-label="Reset car" title="Reset car">&#8635;</button>\n      <div class="supra-scale">\n        <label for="supra-scale-input">Scale</label>\n        <input id="supra-scale-input" type="range" min="0.5" max="1.75" step="0.05" value="1" aria-label="Car scale">\n        <output for="supra-scale-input">1.00x</output>\n      </div>\n    </div>\n  </aside>\n  <div id="supra-car-hotspots"></div>\n', document.body.appendChild(t);
        const a = document.querySelector("#supra-ar-hud"),
          c = document.querySelector("#supra-scale-input"),
          p = document.querySelector(".supra-scale output"),
          b = document.querySelector(".supra-reset"),
          m = document.querySelector("#supra-car-hotspots"),
          h = e => e.stopPropagation();
        u = f.map(e => {
          const t = document.createElement("button");
          return t.className = "supra-car-hotspot", t.type = "button", t.dataset.hotspot = e.label, t.textContent = e.label, t.addEventListener("pointerdown", h), t.addEventListener("touchstart", h), t.addEventListener("click", () => window.location.assign(e.destination)), m.appendChild(t), t;
        }), a?.addEventListener("pointerdown", h), a?.addEventListener("touchstart", h), c.addEventListener("input", () => {
          const t = Number(c.value);
          p.value = `${t.toFixed(2)}x`, p.textContent = p.value, (t => {
            s = t, n && r && r.getEntity(n).set(e.Scale, {
              x: o * s,
              y: o * s,
              z: o * s
            });
          })(t);
        }), b.addEventListener("click", () => {
          (() => {
            if (!n || !r) return;
            const t = n,
              a = r,
              o = a.transform.getLocalPosition(t);
            e.PositionAnimation.set(a, t, {
              duration: 650,
              loop: !1,
              fromX: o.x,
              fromY: o.y,
              fromZ: o.z,
              toX: o.x,
              toY: o.y - 1.2,
              toZ: o.z,
              easeIn: !0,
              easingFunction: "Quadratic"
            }), window.setTimeout(() => {
              n === t && (a.getEntity(t).hide(), i = t, d = a, l());
            }, 650);
          })();
        });
        let g = null;
        const y = t => {
          if (2 !== t.touches.length || t.target instanceof Element && t.target.closest("#supra-ar-hud")) return void (g = null);
          const [a, o] = [t.touches[0], t.touches[1]],
            i = Math.atan2(o.clientY - a.clientY, o.clientX - a.clientX);
          var d;
          null !== g && (d = g - i, n && r && r.getEntity(n).rotateSelf(e.math.quat.yRadians(d))), g = i;
        };
        document.addEventListener("touchstart", y, {
          passive: !0
        }), document.addEventListener("touchmove", y, {
          passive: !0
        }), document.addEventListener("touchend", () => {
          g = null;
        }, {
          passive: !0
        });
      }).onTick(m).onEvent(e.events.REALITY_READY, "ready", {
        target: a.events.globalId
      }), c("ready").onTick(m);
    }
  }), e.registerComponent({
    name: "hide-on-ready",
    stateMachine: ({
      world: t,
      eid: a,
      defineState: o
    }) => {
      o("initial").initial().onEvent(e.events.REALITY_READY, "ready", {
        target: t.events.globalId
      }), o("ready").onEnter(() => {
        e.Disabled.reset(t, a);
      });
    }
  });
  const u = e.registerComponent({
      name: "logo"
    }),
    m = e.defineQuery([u]);
  e.registerComponent({
    name: "reset-button",
    stateMachine: ({
      world: t,
      entity: o,
      defineState: n
    }) => {
      n("nothing-placed").initial().onEvent(a, "placed", {
        target: t.events.globalId
      }).onEnter(() => o.hide()).onExit(() => o.show()), n("placed").onEvent(e.input.UI_CLICK, "resetting"), n("resetting").wait(1e3, "nothing-placed").onEnter(() => {
        const a = e.math.vec3.zero();
        m(t).forEach(o => {
          t.transform.getLocalPosition(o, a), e.PositionAnimation.set(t, o, {
            duration: 1e3,
            loop: !1,
            fromX: a.x,
            fromY: a.y,
            fromZ: a.z,
            toX: a.x,
            toY: -4,
            toZ: a.z,
            easeIn: !0,
            easingFunction: "Quadratic"
          });
        });
      }).onExit(() => {
        m(t).forEach(e => {
          t.deleteEntity(e);
        }), l();
      });
    }
  });
  const h = JSON.parse('{"objects":{"b534657a-38e6-4275-a37d-77b655561d5b":{"id":"b534657a-38e6-4275-a37d-77b655561d5b","position":[0,0,0],"rotation":[0,0,0,1],"scale":[30,30,30],"components":{"92cc446e-2931-499b-9be0-0472f042433a":{"id":"92cc446e-2931-499b-9be0-0472f042433a","name":"logo","parameters":{}}},"name":"Logo","order":8.599486645057333,"shadow":{"castShadow":true},"prefab":true},"492cfe2c-9334-4a9c-a48a-be80132af9fb":{"id":"492cfe2c-9334-4a9c-a48a-be80132af9fb","position":[5,25,5],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"84028e73-ee70-412d-b8d4-c09bf07c655c","components":{},"light":{"type":"directional","shadowBias":0,"shadowRadius":2,"followCamera":false,"shadowCamera":[-10,10,10,-10,0.5,200]},"name":"Directional Light","order":0.6785011504707911},"87113aa9-b52e-4fba-b937-63fbec393fa9":{"id":"87113aa9-b52e-4fba-b937-63fbec393fa9","position":[10,5,5],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"84028e73-ee70-412d-b8d4-c09bf07c655c","components":{},"light":{"type":"ambient","intensity":1},"name":"Ambient Light","order":1.2491958667939822},"52ba8a86-a459-4df8-b954-a570e85e0484":{"id":"52ba8a86-a459-4df8-b954-a570e85e0484","position":[0,2,3.211226375221431],"rotation":[-0.0004637899966810532,0.9978406073902779,-0.06529682289718859,-0.007087458033270938],"scale":[1.0000000000000002,1,1.0000000000000004],"geometry":null,"material":null,"parentId":"84028e73-ee70-412d-b8d4-c09bf07c655c","components":{},"name":"Camera","camera":{"type":"perspective","xr":{"xrCameraType":"world","phone":"AR","desktop":"disabled","headset":"disabled"}},"order":2.1029089692509704},"bc7753ae-2b39-4f48-910a-7921b756487b":{"id":"bc7753ae-2b39-4f48-910a-7921b756487b","position":[0,0,0],"rotation":[-0.7071068,0,0,0.7071068],"scale":[50,50,50],"geometry":{"type":"plane","width":1,"height":1},"material":{"type":"shadow","color":"#000000","opacity":0.4},"parentId":"84028e73-ee70-412d-b8d4-c09bf07c655c","components":{"efcfa10c-5fe6-4a92-85de-a602a68683b2":{"id":"efcfa10c-5fe6-4a92-85de-a602a68683b2","name":"tap-to-place","parameters":{"prefab":{"type":"entity","id":"b534657a-38e6-4275-a37d-77b655561d5b"}}},"c1e9d356-9168-4cc8-bfcf-892a9b9a67bf":{"id":"c1e9d356-9168-4cc8-bfcf-892a9b9a67bf","name":"ar-ui","parameters":{}}},"name":"Ground","order":5.877553308364804,"shadow":{"receiveShadow":true}},"17af117a-efce-48dd-857e-e383a3649c7b":{"id":"17af117a-efce-48dd-857e-e383a3649c7b","position":[0,-0.01,0],"rotation":[-0.707106799999999,0,0,0.7071067623730954],"scale":[50,50,50],"geometry":{"type":"plane","width":1,"height":1},"material":{"type":"hider"},"parentId":"84028e73-ee70-412d-b8d4-c09bf07c655c","components":{},"name":"Hider","order":7.322553197845954},"9b5668bc-b512-4bb6-9c6b-8ba97d3f8af0":{"id":"9b5668bc-b512-4bb6-9c6b-8ba97d3f8af0","position":[16.857510635812545,15.927690665172552,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"904308fe-98f5-4c93-bf62-f39d50c6e602","components":{"9d4b2233-b6c1-4f15-a27c-df4d25b91182":{"id":"9d4b2233-b6c1-4f15-a27c-df4d25b91182","name":"hide-on-ready","parameters":{}}},"ui":{"text":"Toyota GR Supra","width":"100%","height":32,"type":"overlay","verticalTextAlign":"start","textAlign":"center","fontSize":14,"position":"absolute","top":18,"left":20,"bottom":"","right":"","stackingOrder":3,"color":"#18c6a3","font":{"type":"font","font":"Roboto"}},"name":"Tap Prompt","order":10.427624126637916},"637f7413-261d-48bb-99c9-154bd99360da":{"id":"637f7413-261d-48bb-99c9-154bd99360da","position":[16.857510635812545,15.927690665172552,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"904308fe-98f5-4c93-bf62-f39d50c6e602","components":{"7abb1265-4450-48e1-bc0e-dcaf1209b24a":{"id":"7abb1265-4450-48e1-bc0e-dcaf1209b24a","name":"hide-on-ready","parameters":{}}},"ui":{"text":"Tap the floor to place or move the car","width":"100%","height":72,"type":"overlay","verticalTextAlign":"start","textAlign":"left","fontSize":24,"position":"absolute","top":42,"left":20,"bottom":"","right":"","stackingOrder":3,"color":"#ffffff","font":{"type":"font","font":"Roboto"}},"name":"Tap Prompt Shadow","order":11.644447501347162},"a02b4479-461e-40c2-ba91-0ccabbd1bd83":{"id":"a02b4479-461e-40c2-ba91-0ccabbd1bd83","position":[0,0,0],"rotation":[0,0,0,1],"scale":[1,1,1],"parentId":"b534657a-38e6-4275-a37d-77b655561d5b","components":{"c738a811-32f7-4c0c-8516-0d2b5cf9cf46":{"id":"c738a811-32f7-4c0c-8516-0d2b5cf9cf46","name":"model-ready","parameters":{}}},"name":"Model","order":1.1209803013844988,"gltfModel":{"src":{"type":"asset","asset":"assets/toyota_gr_supra.glb"},"animationClip":"","loop":true},"shadow":{"castShadow":true}},"5ac3deca-2126-4b56-b6a2-1442d035047a":{"id":"5ac3deca-2126-4b56-b6a2-1442d035047a","position":[-8.46107198766815,7.181789778649719,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"904308fe-98f5-4c93-bf62-f39d50c6e602","components":{"2100d3e9-8fed-4773-bc39-6f2ca5042375":{"id":"2100d3e9-8fed-4773-bc39-6f2ca5042375","name":"reset-button","parameters":{}},"4b2cd306-6f9c-49da-9fb7-8f5b038c5d0f":{"id":"4b2cd306-6f9c-49da-9fb7-8f5b038c5d0f","name":"hide-on-ready","parameters":{}}},"ui":{"type":"overlay","width":136,"height":48,"background":"#111827","borderRadius":24,"flexDirection":"row","backgroundOpacity":1,"padding":"10","gap":"6","alignItems":"center","justifyContent":"center","position":"absolute","top":"","left":"","bottom":24,"right":20,"stackingOrder":6},"name":"Button","order":13.280785398189009},"543540e1-7086-4068-a4e3-394084c146f8":{"id":"543540e1-7086-4068-a4e3-394084c146f8","position":[0,0,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"5ac3deca-2126-4b56-b6a2-1442d035047a","components":{"866bb4a5-c0d8-459b-9843-b280b5da7257":{"id":"866bb4a5-c0d8-459b-9843-b280b5da7257","name":"hide-on-ready","parameters":{}}},"name":"Text","ui":{"width":90,"height":18,"text":"Reset car","color":"#ffffff","fontSize":16,"font":{"type":"font","font":"Roboto"}},"order":1.2563868233834565},"33af79ad-7140-4ced-82d8-cbf5f5c754b0":{"id":"33af79ad-7140-4ced-82d8-cbf5f5c754b0","position":[0,0.01,0.015],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"b534657a-38e6-4275-a37d-77b655561d5b","components":{"90f4b8bd-c582-4e8a-9f47-1db70e097564":{"id":"90f4b8bd-c582-4e8a-9f47-1db70e097564","name":"hotspot-anchor","parameters":{"label":"Hood"}}},"name":"Hood Hotspot","order":15},"56cf649b-5d1a-4b2c-a679-e832fb798b23":{"id":"56cf649b-5d1a-4b2c-a679-e832fb798b23","position":[0,0.005,-0.02],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"b534657a-38e6-4275-a37d-77b655561d5b","components":{"d7dfa663-6dfc-4618-8b61-cd04b622f054":{"id":"d7dfa663-6dfc-4618-8b61-cd04b622f054","name":"hotspot-anchor","parameters":{"label":"Trunk"}}},"name":"Trunk Hotspot","order":16},"487d2f11-906f-40c1-b549-5a56c8a38fcb":{"id":"487d2f11-906f-40c1-b549-5a56c8a38fcb","position":[-0.015,0.005,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"b534657a-38e6-4275-a37d-77b655561d5b","components":{"d98be469-0e43-4078-aac7-afdfb3a075c5":{"id":"d98be469-0e43-4078-aac7-afdfb3a075c5","name":"hotspot-anchor","parameters":{"label":"Left door"}}},"name":"Left Door Hotspot","order":17},"5fa6e08f-6a26-4d84-968d-d11e11dde214":{"id":"5fa6e08f-6a26-4d84-968d-d11e11dde214","position":[0.015,0.005,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"b534657a-38e6-4275-a37d-77b655561d5b","components":{"99d628f0-3d72-4ce7-8d85-14343015d685":{"id":"99d628f0-3d72-4ce7-8d85-14343015d685","name":"hotspot-anchor","parameters":{"label":"Right door"}}},"name":"Right Door Hotspot","order":18},"904308fe-98f5-4c93-bf62-f39d50c6e602":{"id":"904308fe-98f5-4c93-bf62-f39d50c6e602","position":[9.546973370717888,17.058059801097308,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"84028e73-ee70-412d-b8d4-c09bf07c655c","components":{"25ca58dd-b932-451c-bb8d-666a0afbeee1":{"id":"25ca58dd-b932-451c-bb8d-666a0afbeee1","name":"hide-on-ready","parameters":{}}},"name":"Main Screen","hidden":true,"order":14.958687422311806,"ui":{"type":"overlay"}}},"spaces":{"84028e73-ee70-412d-b8d4-c09bf07c655c":{"id":"84028e73-ee70-412d-b8d4-c09bf07c655c","name":"Default","activeCamera":"52ba8a86-a459-4df8-b954-a570e85e0484"}},"entrySpaceId":"84028e73-ee70-412d-b8d4-c09bf07c655c","runtimeVersion":{"type":"version","level":"major","major":2,"minor":0,"patch":0}}');
  delete h.history, delete h.historyVersion, window.ecs.application.init(h);
})();
