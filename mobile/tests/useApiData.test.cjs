const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const { transformSync } = require("@babel/core");

// A small hook lifecycle harness keeps these async regression tests runnable
// with installed dependencies, without needing a device or a DOM library.
const source = transformSync(
  fs.readFileSync(path.join(__dirname, "../src/hooks/useApiData.js"), "utf8"),
  { babelrc: false, configFile: false, plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")] },
).code;

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function mount(fetcher, deps = []) {
  const slots = [];
  let cursor = 0, effects = [], mounted = true, updatesAfterUnmount = 0;
  const changed = (a, b) => !a || a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: initial };
      return [slots[index].value, value => {
        if (!mounted) updatesAfterUnmount++;
        slots[index].value = typeof value === "function" ? value(slots[index].value) : value;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ??= { current: initial };
    },
    useCallback(callback, dependencies) {
      const index = cursor++;
      if (!slots[index] || changed(slots[index].deps, dependencies)) {
        slots[index] = { value: callback, deps: dependencies };
      }
      return slots[index].value;
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      if (!slots[index] || changed(slots[index].deps, dependencies)) {
        effects.push(() => {
          slots[index]?.cleanup?.();
          slots[index] = { effect, deps: dependencies, cleanup: effect() };
        });
      }
    },
  };
  const exports = {};
  vm.runInNewContext(source, { exports, require: () => react, Error });
  const render = () => {
    cursor = 0;
    const result = exports.useApiData(fetcher, deps);
    const pending = effects;
    effects = [];
    pending.forEach(effect => effect());
    return result;
  };
  render();
  return {
    current: render,
    async settle() { await new Promise(resolve => setImmediate(resolve)); return render(); },
    change(nextFetcher, nextDeps) { fetcher = nextFetcher; deps = nextDeps; return render(); },
    unmount() { slots.forEach(slot => slot.cleanup?.()); mounted = false; },
    replayEffects() {
      slots.filter(slot => slot.effect).forEach(slot => { slot.cleanup?.(); slot.cleanup = slot.effect(); });
    },
    get updatesAfterUnmount() { return updatesAfterUnmount; },
  };
}

test("initial load resolves and refresh keeps existing data visible", async () => {
  const requests = [deferred(), deferred()];
  let calls = 0;
  const hook = mount(() => requests[calls++].promise);
  assert.equal(hook.current().loading, true);
  requests[0].resolve("initial");
  await hook.settle();
  const refresh = hook.current().refetch();
  assert.equal(hook.current().loading, false);
  assert.equal(hook.current().data, "initial");
  requests[1].resolve("refreshed");
  await refresh;
  assert.equal(hook.current().data, "refreshed");
  hook.unmount();
});

test("refresh wins over an older initial request", async () => {
  const requests = [deferred(), deferred()];
  let calls = 0;
  const hook = mount(() => requests[calls++].promise);
  const refresh = hook.current().refetch();
  requests[1].resolve("new");
  await refresh;
  requests[0].resolve("old");
  assert.equal((await hook.settle()).data, "new");
  hook.unmount();
});

test("older refresh errors cannot overwrite a newer success", async () => {
  const requests = [deferred(), deferred(), deferred()];
  let calls = 0;
  const hook = mount(() => requests[calls++].promise);
  requests[0].resolve("initial");
  await hook.settle();
  const older = hook.current().refetch();
  const newer = hook.current().refetch();
  requests[2].resolve("new");
  await newer;
  requests[1].reject(new Error("stale failure"));
  await older;
  assert.equal(hook.current().data, "new");
  assert.equal(hook.current().error, null);
  hook.unmount();
});

test("older completion cannot end the latest initial loading state", async () => {
  const old = deferred(), next = deferred();
  const hook = mount(() => old.promise);
  const refresh = hook.current().refetch();
  hook.change(() => next.promise, ["next"]);
  old.resolve("old");
  await refresh;
  assert.equal(hook.current().loading, true);
  assert.equal(hook.current().data, null);
  next.resolve("next");
  assert.equal((await hook.settle()).data, "next");
  hook.unmount();
});

test("latest failure is shown and a later refresh clears it", async () => {
  const requests = [deferred(), deferred()];
  let calls = 0;
  const hook = mount(() => requests[calls++].promise);
  requests[0].reject(new Error("offline"));
  assert.equal((await hook.settle()).error, "offline");
  assert.equal(hook.current().loading, false);
  const refresh = hook.current().refetch();
  assert.equal(hook.current().error, null);
  requests[1].resolve("recovered");
  await refresh;
  assert.equal(hook.current().data, "recovered");
  hook.unmount();
});

test("initial and refresh completions do not update an unmounted hook", async () => {
  const requests = [deferred(), deferred()];
  let calls = 0;
  const hook = mount(() => requests[calls++].promise);
  const refresh = hook.current().refetch();
  hook.unmount();
  requests[0].resolve("initial");
  requests[1].reject(new Error("late failure"));
  await refresh;
  await Promise.resolve();
  assert.equal(hook.updatesAfterUnmount, 0);
});

test("effect cleanup and replay ignore results from the discarded mount", async () => {
  const requests = [deferred(), deferred()];
  let calls = 0;
  const hook = mount(() => requests[calls++].promise);
  hook.replayEffects();
  requests[1].resolve("active");
  await hook.settle();
  requests[0].resolve("discarded");
  assert.equal((await hook.settle()).data, "active");
  hook.unmount();
});
