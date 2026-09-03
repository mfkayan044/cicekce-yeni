// Web Worker for background order polling without browser throttling
let prevCount = null;

setInterval(async () => {
  try {
    const res = await fetch("/api/orders");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const count = data.length;
        if (prevCount !== null && count > prevCount) {
          const latestOrder = data[0] || {};
          self.postMessage({ type: "NEW_ORDER", order: latestOrder, count });
        }
        prevCount = count;
      }
    }
  } catch (e) {}
}, 4000);
