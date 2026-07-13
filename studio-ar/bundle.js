(() => {
  "use strict";

  const e = window.ecs,
    t = () => !0 === window.__supraModelReady,
    a = () => {
      t() || (window.__supraModelReady = !0, window.dispatchEvent(new Event("supra-model-ready")));
    };
  e.registerComponent({
    name: "model-ready",
    stateMachine: ({
      world: e,
      eid: t,
      defineState: o
    }) => {
      const n = () => {
        for (const t of e.three.entityToObject.values()) {
          const e = t;
          if (e.userData?.gltf) return void a();
        }
      };
      o("loading").initial().onTick(n), o("ready").onEnter(a).onTick(n);
    }
  });
  const o = e.registerComponent({
      name: "hotspot-anchor",
      schema: {
        label: "string"
      }
    }),
    n = "object-placed",
    r = 30;
  let i = null,
    d = null,
    s = null,
    c = null,
    l = 1,
    p = null;
  const b = () => {
      p && (window.clearTimeout(p), p = null), i = null, d = null;
    },
    f = () => i;
  e.registerComponent({
    name: "tap-to-place",
    schema: {
      prefab: "eid"
    },
    stateMachine: ({
      world: a,
      eid: o,
      schemaAttribute: b,
      defineState: f
    }) => {
      f("initial").initial().onEnter(() => {
        ((t, a) => {
          if (s) return;
          const o = t.getEntity(t.createEntity(a));
          o.setLocalPosition({
            x: 0,
            y: -100,
            z: 0
          }), o.set(e.Scale, {
            x: r * l,
            y: r * l,
            z: r * l
          }), s = o.eid, c = t;
        })(a, b.get(o).prefab);
      }).listen(o, e.input.SCREEN_TOUCH_START, f => {
        t() && f.data.worldPosition && (p = window.setTimeout(() => {
          (t => {
            const p = !i,
              f = b.get(o).prefab;
            i || (i = s || a.createEntity(f), s = null, c = null), d = a;
            const u = a.getEntity(i);
            u.show(), u.setLocalPosition(t), u.set(e.Scale, {
              x: r * l,
              y: r * l,
              z: r * l
            }), p && (u.set(e.Quaternion, e.math.quat.yRadians(Math.random() * Math.PI)), e.PositionAnimation.set(a, i, {
              duration: 650,
              loop: !1,
              fromX: t.x,
              fromY: t.y - 1.2,
              fromZ: t.z,
              toX: t.x,
              toY: t.y,
              toZ: t.z,
              easeOut: !0,
              easingFunction: "Quadratic"
            })), a.events.dispatch(o, n);
          })(f.data.worldPosition), p = null;
        }, 90));
      }).listen(o, e.input.GESTURE_START, () => {
        p && (window.clearTimeout(p), p = null);
      });
    }
  });
  const u = e.defineQuery([o]),
    m = [{
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
      world: t,
      defineState: a
    }) => {
      let n = [];
      const p = () => {
        const e = f();
        if (n.forEach(e => {
          e.style.display = "none";
        }), !e) return;
        const a = t.three.activeCamera;
        if (!a) return;
        const r = a.matrixWorldInverse.elements,
          i = a.projectionMatrix.elements;
        u(t).forEach(e => {
          const a = o.get(t, e),
            d = n.find(e => e.dataset.hotspot === a.label);
          if (d) try {
            const a = t.transform.getWorldPosition(e),
              o = r[0] * a.x + r[4] * a.y + r[8] * a.z + r[12],
              n = r[1] * a.x + r[5] * a.y + r[9] * a.z + r[13],
              s = r[2] * a.x + r[6] * a.y + r[10] * a.z + r[14],
              c = r[3] * a.x + r[7] * a.y + r[11] * a.z + r[15],
              l = i[0] * o + i[4] * n + i[8] * s + i[12] * c,
              p = i[1] * o + i[5] * n + i[9] * s + i[13] * c,
              b = i[3] * o + i[7] * n + i[11] * s + i[15] * c;
            if (b <= 0) return;
            const f = (l / b * .5 + .5) * window.innerWidth,
              u = (-p / b * .5 + .5) * window.innerHeight;
            d.style.display = "block", d.style.transform = `translate(-50%, -50%) translate(${f}px, ${u}px)`;
          } catch {
            return;
          }
        });
      };
      a("initial").initial().onEnter(() => {
        const t = document.createElement("div");
        t.id = "supra-ui-root", t.innerHTML = '\n  <style>\n    #supra-ar-hud { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }\n    #supra-ar-hud { position: fixed; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); left: 16px; z-index: 9999; pointer-events: none; }\n    .supra-panel { display: grid; grid-template-columns: 1fr auto; gap: 14px 18px; align-items: center; box-sizing: border-box; padding: 15px 16px; border: 1px solid rgba(255,255,255,.3); border-radius: 8px; background: rgba(7, 18, 16, .84); box-shadow: 0 12px 36px rgba(0,0,0,.26); backdrop-filter: blur(14px); color: white; pointer-events: auto; }\n    .supra-name { font-size: 15px; font-weight: 760; letter-spacing: .04em; }\n    .supra-status { margin-top: 4px; color: #70e9c9; font-size: 12px; font-weight: 650; }\n    .supra-reset { width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.34); border-radius: 50%; background: rgba(255,255,255,.08); color: #fff; font-size: 24px; line-height: 1; cursor: pointer; }\n    .supra-scale { grid-column: 1 / -1; display: grid; grid-template-columns: 44px 1fr 50px; gap: 12px; align-items: center; }\n    .supra-scale label, .supra-scale output { font-size: 13px; font-weight: 700; }\n    .supra-scale output { color: #70e9c9; text-align: right; }\n    #supra-scale-input { width: 100%; accent-color: #1ed7ac; }\n    #supra-car-hotspots { position: fixed; inset: 0; z-index: 9998; pointer-events: none; }\n    .supra-car-hotspot { position: fixed; display: none; min-width: 54px; height: 28px; padding: 0 12px; border: 1px solid #76f0d2; border-radius: 14px; background: rgba(5, 55, 44, .94); box-shadow: 0 5px 16px rgba(0, 0, 0, .25); color: #fff; font: 750 11px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; pointer-events: auto; }\n  </style>\n  <aside id="supra-ar-hud">\n    <div class="supra-panel">\n      <div><div class="supra-name">TOYOTA GR SUPRA</div><div class="supra-status">AR Preview</div></div>\n      <button class="supra-reset" type="button" aria-label="Reset car" title="Reset car">&#8635;</button>\n      <div class="supra-scale">\n        <label for="supra-scale-input">Scale</label>\n        <input id="supra-scale-input" type="range" min="0.5" max="1.75" step="0.05" value="1" aria-label="Car scale">\n        <output for="supra-scale-input">1.00x</output>\n      </div>\n    </div>\n  </aside>\n  <div id="supra-car-hotspots"></div>\n', document.body.appendChild(t);
        const a = document.querySelector("#supra-ar-hud"),
          o = document.querySelector("#supra-scale-input"),
          p = document.querySelector(".supra-scale output"),
          f = document.querySelector(".supra-reset"),
          u = document.querySelector("#supra-car-hotspots"),
          h = e => e.stopPropagation();
        n = m.map(e => {
          const t = document.createElement("button");
          return t.className = "supra-car-hotspot", t.type = "button", t.dataset.hotspot = e.label, t.textContent = e.label, t.addEventListener("pointerdown", h), t.addEventListener("touchstart", h), t.addEventListener("click", () => window.location.assign(e.destination)), u.appendChild(t), t;
        }), a?.addEventListener("pointerdown", h), a?.addEventListener("touchstart", h), o.addEventListener("input", () => {
          const t = Number(o.value);
          p.value = `${t.toFixed(2)}x`, p.textContent = p.value, (t => {
            l = t, i && d && d.getEntity(i).set(e.Scale, {
              x: r * l,
              y: r * l,
              z: r * l
            });
          })(t);
        }), f.addEventListener("click", () => {
          (() => {
            if (!i || !d) return;
            const t = i,
              a = d,
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
              i === t && (a.getEntity(t).hide(), s = t, c = a, b());
            }, 650);
          })();
        });
        let g = null;
        const y = t => {
          if (2 !== t.touches.length || t.target instanceof Element && t.target.closest("#supra-ar-hud")) return void (g = null);
          const [a, o] = [t.touches[0], t.touches[1]],
            n = Math.atan2(o.clientY - a.clientY, o.clientX - a.clientX);
          var r;
          null !== g && (r = g - n, i && d && d.getEntity(i).rotateSelf(e.math.quat.yRadians(r))), g = n;
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
      }).onTick(p).onEvent(e.events.REALITY_READY, "ready", {
        target: t.events.globalId
      }), a("ready").onTick(p);
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
  const h = e.registerComponent({
      name: "logo"
    }),
    g = e.defineQuery([h]);
  e.registerComponent({
    name: "reset-button",
    stateMachine: ({
      world: t,
      entity: a,
      defineState: o
    }) => {
      o("nothing-placed").initial().onEvent(n, "placed", {
        target: t.events.globalId
      }).onEnter(() => a.hide()).onExit(() => a.show()), o("placed").onEvent(e.input.UI_CLICK, "resetting"), o("resetting").wait(1e3, "nothing-placed").onEnter(() => {
        const a = e.math.vec3.zero();
        g(t).forEach(o => {
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
        g(t).forEach(e => {
          t.deleteEntity(e);
        }), b();
      });
    }
  });
  const y = JSON.parse('{"objects":{"b534657a-38e6-4275-a37d-77b655561d5b":{"id":"b534657a-38e6-4275-a37d-77b655561d5b","position":[0,0,0],"rotation":[0,0,0,1],"scale":[30,30,30],"components":{"92cc446e-2931-499b-9be0-0472f042433a":{"id":"92cc446e-2931-499b-9be0-0472f042433a","name":"logo","parameters":{}}},"name":"Logo","order":8.599486645057333,"shadow":{"castShadow":true},"prefab":true},"492cfe2c-9334-4a9c-a48a-be80132af9fb":{"id":"492cfe2c-9334-4a9c-a48a-be80132af9fb","position":[5,25,5],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"84028e73-ee70-412d-b8d4-c09bf07c655c","components":{},"light":{"type":"directional","shadowBias":0,"shadowRadius":2,"followCamera":false,"shadowCamera":[-10,10,10,-10,0.5,200]},"name":"Directional Light","order":0.6785011504707911},"87113aa9-b52e-4fba-b937-63fbec393fa9":{"id":"87113aa9-b52e-4fba-b937-63fbec393fa9","position":[10,5,5],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"84028e73-ee70-412d-b8d4-c09bf07c655c","components":{},"light":{"type":"ambient","intensity":1},"name":"Ambient Light","order":1.2491958667939822},"52ba8a86-a459-4df8-b954-a570e85e0484":{"id":"52ba8a86-a459-4df8-b954-a570e85e0484","position":[0,2,3.211226375221431],"rotation":[-0.0004637899966810532,0.9978406073902779,-0.06529682289718859,-0.007087458033270938],"scale":[1.0000000000000002,1,1.0000000000000004],"geometry":null,"material":null,"parentId":"84028e73-ee70-412d-b8d4-c09bf07c655c","components":{},"name":"Camera","camera":{"type":"perspective","xr":{"xrCameraType":"world","phone":"AR","desktop":"disabled","headset":"disabled"}},"order":2.1029089692509704},"bc7753ae-2b39-4f48-910a-7921b756487b":{"id":"bc7753ae-2b39-4f48-910a-7921b756487b","position":[0,0,0],"rotation":[-0.7071068,0,0,0.7071068],"scale":[50,50,50],"geometry":{"type":"plane","width":1,"height":1},"material":{"type":"shadow","color":"#000000","opacity":0.4},"parentId":"84028e73-ee70-412d-b8d4-c09bf07c655c","components":{"efcfa10c-5fe6-4a92-85de-a602a68683b2":{"id":"efcfa10c-5fe6-4a92-85de-a602a68683b2","name":"tap-to-place","parameters":{"prefab":{"type":"entity","id":"b534657a-38e6-4275-a37d-77b655561d5b"}}},"c1e9d356-9168-4cc8-bfcf-892a9b9a67bf":{"id":"c1e9d356-9168-4cc8-bfcf-892a9b9a67bf","name":"ar-ui","parameters":{}},"cdf0f8b0-7f7d-4ae3-8798-b1faf01a527f":{"id":"cdf0f8b0-7f7d-4ae3-8798-b1faf01a527f","name":"model-ready","parameters":{}}},"name":"Ground","order":5.877553308364804,"shadow":{"receiveShadow":true}},"17af117a-efce-48dd-857e-e383a3649c7b":{"id":"17af117a-efce-48dd-857e-e383a3649c7b","position":[0,-0.01,0],"rotation":[-0.707106799999999,0,0,0.7071067623730954],"scale":[50,50,50],"geometry":{"type":"plane","width":1,"height":1},"material":{"type":"hider"},"parentId":"84028e73-ee70-412d-b8d4-c09bf07c655c","components":{},"name":"Hider","order":7.322553197845954},"9b5668bc-b512-4bb6-9c6b-8ba97d3f8af0":{"id":"9b5668bc-b512-4bb6-9c6b-8ba97d3f8af0","position":[16.857510635812545,15.927690665172552,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"904308fe-98f5-4c93-bf62-f39d50c6e602","components":{"9d4b2233-b6c1-4f15-a27c-df4d25b91182":{"id":"9d4b2233-b6c1-4f15-a27c-df4d25b91182","name":"hide-on-ready","parameters":{}}},"ui":{"text":"Toyota GR Supra","width":"100%","height":32,"type":"overlay","verticalTextAlign":"start","textAlign":"center","fontSize":14,"position":"absolute","top":18,"left":20,"bottom":"","right":"","stackingOrder":3,"color":"#18c6a3","font":{"type":"font","font":"Roboto"}},"name":"Tap Prompt","order":10.427624126637916},"637f7413-261d-48bb-99c9-154bd99360da":{"id":"637f7413-261d-48bb-99c9-154bd99360da","position":[16.857510635812545,15.927690665172552,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"904308fe-98f5-4c93-bf62-f39d50c6e602","components":{"7abb1265-4450-48e1-bc0e-dcaf1209b24a":{"id":"7abb1265-4450-48e1-bc0e-dcaf1209b24a","name":"hide-on-ready","parameters":{}}},"ui":{"text":"Tap the floor to place or move the car","width":"100%","height":72,"type":"overlay","verticalTextAlign":"start","textAlign":"left","fontSize":24,"position":"absolute","top":42,"left":20,"bottom":"","right":"","stackingOrder":3,"color":"#ffffff","font":{"type":"font","font":"Roboto"}},"name":"Tap Prompt Shadow","order":11.644447501347162},"a02b4479-461e-40c2-ba91-0ccabbd1bd83":{"id":"a02b4479-461e-40c2-ba91-0ccabbd1bd83","position":[0,0,0],"rotation":[0,0,0,1],"scale":[1,1,1],"parentId":"b534657a-38e6-4275-a37d-77b655561d5b","components":{"c738a811-32f7-4c0c-8516-0d2b5cf9cf46":{"id":"c738a811-32f7-4c0c-8516-0d2b5cf9cf46","name":"model-ready","parameters":{}}},"name":"Model","order":1.1209803013844988,"gltfModel":{"src":{"type":"asset","asset":"assets/toyota_gr_supra.glb"},"animationClip":"","loop":true},"shadow":{"castShadow":true}},"5ac3deca-2126-4b56-b6a2-1442d035047a":{"id":"5ac3deca-2126-4b56-b6a2-1442d035047a","position":[-8.46107198766815,7.181789778649719,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"904308fe-98f5-4c93-bf62-f39d50c6e602","components":{"2100d3e9-8fed-4773-bc39-6f2ca5042375":{"id":"2100d3e9-8fed-4773-bc39-6f2ca5042375","name":"reset-button","parameters":{}},"4b2cd306-6f9c-49da-9fb7-8f5b038c5d0f":{"id":"4b2cd306-6f9c-49da-9fb7-8f5b038c5d0f","name":"hide-on-ready","parameters":{}}},"ui":{"type":"overlay","width":136,"height":48,"background":"#111827","borderRadius":24,"flexDirection":"row","backgroundOpacity":1,"padding":"10","gap":"6","alignItems":"center","justifyContent":"center","position":"absolute","top":"","left":"","bottom":24,"right":20,"stackingOrder":6},"name":"Button","order":13.280785398189009},"543540e1-7086-4068-a4e3-394084c146f8":{"id":"543540e1-7086-4068-a4e3-394084c146f8","position":[0,0,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"5ac3deca-2126-4b56-b6a2-1442d035047a","components":{"866bb4a5-c0d8-459b-9843-b280b5da7257":{"id":"866bb4a5-c0d8-459b-9843-b280b5da7257","name":"hide-on-ready","parameters":{}}},"name":"Text","ui":{"width":90,"height":18,"text":"Reset car","color":"#ffffff","fontSize":16,"font":{"type":"font","font":"Roboto"}},"order":1.2563868233834565},"33af79ad-7140-4ced-82d8-cbf5f5c754b0":{"id":"33af79ad-7140-4ced-82d8-cbf5f5c754b0","position":[0,0.01,0.015],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"b534657a-38e6-4275-a37d-77b655561d5b","components":{"90f4b8bd-c582-4e8a-9f47-1db70e097564":{"id":"90f4b8bd-c582-4e8a-9f47-1db70e097564","name":"hotspot-anchor","parameters":{"label":"Hood"}}},"name":"Hood Hotspot","order":15},"56cf649b-5d1a-4b2c-a679-e832fb798b23":{"id":"56cf649b-5d1a-4b2c-a679-e832fb798b23","position":[0,0.005,-0.02],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"b534657a-38e6-4275-a37d-77b655561d5b","components":{"d7dfa663-6dfc-4618-8b61-cd04b622f054":{"id":"d7dfa663-6dfc-4618-8b61-cd04b622f054","name":"hotspot-anchor","parameters":{"label":"Trunk"}}},"name":"Trunk Hotspot","order":16},"487d2f11-906f-40c1-b549-5a56c8a38fcb":{"id":"487d2f11-906f-40c1-b549-5a56c8a38fcb","position":[-0.015,0.005,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"b534657a-38e6-4275-a37d-77b655561d5b","components":{"d98be469-0e43-4078-aac7-afdfb3a075c5":{"id":"d98be469-0e43-4078-aac7-afdfb3a075c5","name":"hotspot-anchor","parameters":{"label":"Left door"}}},"name":"Left Door Hotspot","order":17},"5fa6e08f-6a26-4d84-968d-d11e11dde214":{"id":"5fa6e08f-6a26-4d84-968d-d11e11dde214","position":[0.015,0.005,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"b534657a-38e6-4275-a37d-77b655561d5b","components":{"99d628f0-3d72-4ce7-8d85-14343015d685":{"id":"99d628f0-3d72-4ce7-8d85-14343015d685","name":"hotspot-anchor","parameters":{"label":"Right door"}}},"name":"Right Door Hotspot","order":18},"904308fe-98f5-4c93-bf62-f39d50c6e602":{"id":"904308fe-98f5-4c93-bf62-f39d50c6e602","position":[9.546973370717888,17.058059801097308,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"84028e73-ee70-412d-b8d4-c09bf07c655c","components":{"25ca58dd-b932-451c-bb8d-666a0afbeee1":{"id":"25ca58dd-b932-451c-bb8d-666a0afbeee1","name":"hide-on-ready","parameters":{}}},"name":"Main Screen","hidden":true,"order":14.958687422311806,"ui":{"type":"overlay"}}},"spaces":{"84028e73-ee70-412d-b8d4-c09bf07c655c":{"id":"84028e73-ee70-412d-b8d4-c09bf07c655c","name":"Default","activeCamera":"52ba8a86-a459-4df8-b954-a570e85e0484"}},"entrySpaceId":"84028e73-ee70-412d-b8d4-c09bf07c655c","runtimeVersion":{"type":"version","level":"major","major":2,"minor":0,"patch":0}}');
  delete y.history, delete y.historyVersion, window.ecs.application.init(y);
})();
