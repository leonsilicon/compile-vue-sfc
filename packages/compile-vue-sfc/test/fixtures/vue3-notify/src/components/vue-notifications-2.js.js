import { defineComponent, ref, computed, onMounted, openBlock, createElementBlock, normalizeStyle, createVNode, TransitionGroup, withCtx, Fragment, renderList, renderSlot, normalizeClass, createCommentVNode, createElementVNode } from 'vue';
import { listToDirection } from '~/utils/direction.js';
import { emitter } from '~/utils/events.js';
import { generateId } from '~/utils/id.js';
import { parseNumericValue } from '~/utils/parser.js';
import { Timer } from '~/utils/timer.js';

var e=[],t=[];function n(n,r){if(n&&"undefined"!=typeof document){var a,s=!0===r.prepend?"prepend":"append",d=!0===r.singleTag,i="string"==typeof r.container?document.querySelector(r.container):document.getElementsByTagName("head")[0];if(d){var u=e.indexOf(i);-1===u&&(u=e.push(i)-1,t[u]={}),a=t[u]&&t[u][s]?t[u][s]:t[u][s]=c();}else a=c();65279===n.charCodeAt(0)&&(n=n.substring(1)),a.styleSheet?a.styleSheet.cssText+=n:a.appendChild(document.createTextNode(n));}function c(){var e=document.createElement("style");if(e.setAttribute("type","text/css"),r.attributes)for(var t=Object.keys(r.attributes),n=0;n<t.length;n++)e.setAttribute(t[n],r.attributes[t[n]]);var a="prepend"===s?"afterbegin":"beforeend";return i.insertAdjacentElement(a,e),e}}

var css = "\n.vue-notification-group {\n\tdisplay: block;\n\tposition: fixed;\n\tz-index: 5000;\n}\n.vue-notification-wrapper {\n\tdisplay: block;\n\toverflow: hidden;\n\twidth: 100%;\n\tmargin: 0;\n\tpadding: 0;\n}\n.notification-title {\n\tfont-weight: 600;\n}\n.vue-notification-template {\n\tdisplay: block;\n\tbox-sizing: border-box;\n\tbackground: white;\n\ttext-align: left;\n}\n.vue-notification {\n\tdisplay: block;\n\tbox-sizing: border-box;\n\ttext-align: left;\n\tfont-size: 12px;\n\tpadding: 10px;\n\tmargin: 0 5px 5px;\n\n\tcolor: white;\n\tbackground: #44a4fc;\n\tborder-left: 5px solid #187fe7;\n}\n.vue-notification.warn {\n\tbackground: #ffb648;\n\tborder-left-color: #f48a06;\n}\n.vue-notification.error {\n\tbackground: #e54d42;\n\tborder-left-color: #b82e24;\n}\n.vue-notification.success {\n\tbackground: #68cd86;\n\tborder-left-color: #42a85f;\n}\n.vn-fade-enter-active,\n.vn-fade-leave-active,\n.vn-fade-move {\n\ttransition: all 0.5s;\n}\n.vn-fade-enter-from,\n.vn-fade-leave-to {\n\topacity: 0;\n}\n";
n(css,{});

var _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};

const _hoisted_1 = ["data-id"];
const _hoisted_2 = ["onClick"];
const _hoisted_3 = ["innerHTML"];
const _hoisted_4 = ["innerHTML"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  props: {
    group: { type: String, required: false, default: "" },
    width: { type: [Number, String], required: false, default: 300 },
    reverse: { type: Boolean, required: false, default: false },
    position: { type: [String, Array], required: false, default: () => ["top", "right"] },
    classes: { type: String, required: false, default: "vue-notification" },
    animationName: { type: String, required: false, default: "vn-fade" },
    speed: { type: Number, required: false, default: 300 },
    cooldown: { type: Number, required: false, default: 0 },
    duration: { type: Number, required: false, default: 3e3 },
    delay: { type: Number, required: false, default: 0 },
    max: { type: Number, required: false, default: () => Number.POSITIVE_INFINITY },
    ignoreDuplicates: { type: Boolean, required: false, default: false },
    closeOnClick: { type: Boolean, required: false, default: true },
    pauseOnHover: { type: Boolean, required: false, default: false }
  },
  emits: ["click", "destroy"],
  setup(__props, { expose, emit }) {
    const STATE = {
      IDLE: 0,
      DESTROYED: 2
    };
    let list = ref([]);
    let timerControl = ref();
    const actualWidth = computed(() => parseNumericValue(__props.width));
    const styles = computed(() => {
      const { x, y } = listToDirection(__props.position);
      const width = actualWidth.value.value;
      const suffix = actualWidth.value.type;
      const styles2 = {
        width: String(width) + suffix
      };
      if (y) {
        styles2[y] = "0px";
      }
      if (x) {
        if (x === "center") {
          styles2.left = `calc(50% - ${Number(width) / 2}${suffix})`;
        } else {
          styles2[x] = "0px";
        }
      }
      return styles2;
    });
    const activeNotifications = computed(() => list.value.filter((v) => v.state !== STATE.DESTROYED));
    const bottomToTop = computed(() => Object.prototype.hasOwnProperty.call(styles.value, "bottom"));
    onMounted(() => {
      emitter.on("add", addItem);
      emitter.on("close", closeItem);
    });
    function destroyIfNecessary(item) {
      emit("click", item);
      if (__props.closeOnClick) {
        destroy(item);
      }
    }
    function pauseTimeout() {
      if (__props.pauseOnHover) {
        timerControl.value?.pause();
      }
    }
    function resumeTimeout() {
      if (__props.pauseOnHover) {
        timerControl.value?.resume();
      }
    }
    function addItem(event = {}) {
      event.group ??= "";
      event.data ??= {};
      if (__props.group !== event.group) {
        return;
      }
      if (event.clear) {
        destroyAll();
        return;
      }
      const duration = typeof event.duration === "number" ? event.duration : __props.duration;
      const speed = typeof event.speed === "number" ? event.speed : __props.speed;
      const ignoreDuplicates = typeof event.ignoreDuplicates === "boolean" ? event.ignoreDuplicates : __props.ignoreDuplicates;
      const { title, text, type, data, id } = event;
      const item = {
        id: id ?? generateId(),
        title,
        text,
        type,
        state: STATE.IDLE,
        speed,
        length: duration + 2 * speed,
        data
      };
      if (duration >= 0) {
        timerControl.value = new Timer(() => {
          destroy(item);
        }, item.length, item);
      }
      const direction = __props.reverse ? !bottomToTop.value : bottomToTop.value;
      let indexToDestroy = -1;
      const isDuplicate = activeNotifications.value.some((i) => i.title === event.title && i.text === event.text);
      const canAdd = ignoreDuplicates ? !isDuplicate : true;
      if (!canAdd) {
        return;
      }
      if (direction) {
        list.value.push(item);
        if (activeNotifications.value.length > __props.max) {
          indexToDestroy = 0;
        }
      } else {
        list.value.unshift(item);
        if (activeNotifications.value.length > __props.max) {
          indexToDestroy = activeNotifications.value.length - 1;
        }
      }
      if (indexToDestroy !== -1) {
        destroy(activeNotifications.value[indexToDestroy]);
      }
    }
    function closeItem(id) {
      destroyById(id);
    }
    function notifyClass(item) {
      return ["vue-notification-template", __props.classes, item.type ?? ""];
    }
    function notifyWrapperStyle(item) {
      return { transition: `all ${item.speed}ms` };
    }
    function destroy(item) {
      if (item.timer !== void 0) {
        clearTimeout(item.timer);
      }
      item.state = STATE.DESTROYED;
      clean();
      emit("destroy", item);
    }
    function destroyById(id) {
      const item = list.value.find((v) => v.id === id);
      if (item) {
        destroy(item);
      }
    }
    function destroyAll() {
      for (const activeNotification of activeNotifications.value) {
        destroy(activeNotification);
      }
    }
    function clean() {
      list.value = list.value.filter((v) => v.state !== STATE.DESTROYED);
    }
    expose({
      addItem,
      list: list.value
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        class: "vue-notification-group",
        style: normalizeStyle(styles.value)
      }, [
        createVNode(TransitionGroup, {
          tag: "span",
          name: __props.animationName
        }, {
          default: withCtx(() => [
            (openBlock(true), createElementBlock(Fragment, null, renderList(activeNotifications.value, (item) => {
              return openBlock(), createElementBlock("div", {
                key: item.id,
                class: "vue-notification-wrapper",
                style: normalizeStyle(notifyWrapperStyle(item)),
                "data-id": item.id,
                onMouseenter: pauseTimeout,
                onMouseleave: resumeTimeout
              }, [
                renderSlot(_ctx.$slots, "body", {
                  class: normalizeClass([__props.classes, item.type]),
                  item,
                  close: () => destroy(item)
                }, () => [
                  createCommentVNode(" Default slot template "),
                  createElementVNode("div", {
                    class: normalizeClass(notifyClass(item)),
                    onClick: ($event) => destroyIfNecessary(item)
                  }, [
                    item.title ? (openBlock(), createElementBlock("div", {
                      key: 0,
                      class: "notification-title",
                      innerHTML: item.title
                    }, null, 8, _hoisted_3)) : createCommentVNode("v-if", true),
                    createElementVNode("div", {
                      class: "notification-content",
                      innerHTML: item.text
                    }, null, 8, _hoisted_4)
                  ], 10, _hoisted_2)
                ])
              ], 44, _hoisted_1);
            }), 128))
          ]),
          _: 3
        }, 8, ["name"])
      ], 4);
    };
  }
});
var vueNotifications2 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "/Users/leonzalion/projects/compile-vue-sfc/packages/compile-vue-sfc/test/fixtures/vue3-notify/src/components/vue-notifications-2.vue"]]);

export { vueNotifications2 as default };
