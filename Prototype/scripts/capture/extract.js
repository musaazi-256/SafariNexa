// Runs inside the browser page. Walks the rendered DOM and returns a compact tree
// of what is actually painted: boxes (fill, border, radius, shadow, clipping),
// text runs with their computed type styles, inline SVG icons and images.
// Positions are absolute page coordinates; the Figma side makes them relative.
async (opts) => {
  const W = opts.width;
  const H = opts.height;
  const px = (v) => Math.round(parseFloat(v) * 100) / 100 || 0;
  const visibleColor = (c) => c && c !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(c);
  const imgCache = new Map();
  const toData = (src) => {
    if (!imgCache.has(src)) {
      const pending = (async () => {
        try {
          const response = await fetch(src, { signal: AbortSignal.timeout(3500) });
          if (!response.ok) return null;
          const blob = await response.blob();
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      })();
      imgCache.set(src, pending);
    }
    return imgCache.get(src);
  };
  // Big images (map tiles, photos) are re-encoded as JPEG at 2x their shown size.
  const shrink = async (data, w, h) => {
    if (!data || data.length < 150000) return data;
    try {
      const im = new Image();
      im.src = data;
      await im.decode();
      const scale = Math.min(1, (2 * Math.max(w, 1)) / im.naturalWidth, (2 * Math.max(h, 1)) / im.naturalHeight);
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(im.naturalWidth * scale));
      c.height = Math.max(1, Math.round(im.naturalHeight * scale));
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      const jpg = c.toDataURL("image/jpeg", 0.82);
      return jpg.length < data.length ? jpg : data;
    } catch {
      return data;
    }
  };
  const inView = (r) => r.width > 0.5 && r.height > 0.5 && r.right > 0 && r.bottom > 0 && r.left < W && r.top < H;
  // Start image requests together so a series of unavailable images cannot stall the DOM walk.
  for (const img of document.images) {
    const src = img.currentSrc || img.src;
    if (src && inView(img.getBoundingClientRect())) toData(src);
  }

  const svgMarkup = (svg, color) => {
    const clone = svg.cloneNode(true);
    const r = svg.getBoundingClientRect();
    clone.setAttribute("width", String(r.width));
    clone.setAttribute("height", String(r.height));
    if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    // Inline computed paint so currentColor and CSS-driven fills survive.
    const src = [svg, ...svg.querySelectorAll("*")];
    const dst = [clone, ...clone.querySelectorAll("*")];
    src.forEach((el, i) => {
      const cs = getComputedStyle(el);
      for (const k of ["fill", "stroke"]) {
        const v = cs[k];
        if (v && v !== "none") dst[i].setAttribute(k, v === "currentcolor" || v === "currentColor" ? color : v);
        else if (v === "none") dst[i].setAttribute(k, "none");
      }
      if (cs.strokeWidth && el !== svg) dst[i].setAttribute("stroke-width", cs.strokeWidth);
      if (cs.opacity !== "1") dst[i].setAttribute("opacity", cs.opacity);
    });
    return clone.outerHTML.replace(/currentColor/g, color);
  };

  const textStyle = (cs) => ({
    f: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
    s: px(cs.fontSize),
    w: parseInt(cs.fontWeight, 10) || 400,
    i: cs.fontStyle === "italic" ? 1 : 0,
    c: cs.color,
    lh: cs.lineHeight === "normal" ? 0 : px(cs.lineHeight),
    ls: cs.letterSpacing === "normal" ? 0 : px(cs.letterSpacing),
    a: cs.textAlign,
    tt: cs.textTransform !== "none" ? cs.textTransform : undefined,
    td: cs.textDecorationLine !== "none" ? cs.textDecorationLine : undefined,
  });

  async function walk(el, inheritedOpacity) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return null;
    // (Radix marks the page behind an open dialog or menu aria-hidden; it is still painted, so keep it.)
    const op = parseFloat(cs.opacity);
    if (op === 0) return null;
    const r = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();
    const name = el.getAttribute("data-testid") || el.getAttribute("aria-label") || el.getAttribute("role") || tag;

    if (tag === "svg") {
      if (!inView(r)) return null;
      return { k: "svg", n: name, x: r.left, y: r.top, w: r.width, h: r.height, o: op, svg: svgMarkup(el, cs.color) };
    }
    if (tag === "img" || tag === "canvas" || tag === "video") {
      if (!inView(r)) return null;
      let data = null;
      if (tag === "img") data = await shrink(await toData(el.currentSrc || el.src), r.width, r.height);
      else if (tag === "canvas") {
        try {
          data = await shrink(el.toDataURL("image/png"), r.width, r.height);
        } catch {
          data = null;
        }
      }
      return { k: "img", n: name, x: r.left, y: r.top, w: r.width, h: r.height, o: op, r: px(cs.borderTopLeftRadius), fit: cs.objectFit, data };
    }

    const node = { k: "box", n: name, x: r.left, y: r.top, w: r.width, h: r.height, kids: [] };
    if (tag === "input" || tag === "textarea") {
      const value = el.value || el.placeholder || "";
      if (value && el.type !== "hidden" && el.type !== "checkbox") {
        const ph = !el.value;
        const st = textStyle(ph ? getComputedStyle(el, "::placeholder") : cs);
        if (ph) st.c = getComputedStyle(el, "::placeholder").color;
        const left = r.left + px(cs.paddingLeft) + px(cs.borderLeftWidth);
        const lh = st.lh || st.s * 1.2;
        const top = tag === "textarea" ? r.top + px(cs.paddingTop) + px(cs.borderTopWidth) : r.top + (r.height - lh) / 2;
        const shown = el.type === "password" && el.value ? "•".repeat(el.value.length) : value;
        node.kids.push({ k: "text", x: left, y: top, w: r.width - px(cs.paddingLeft) - px(cs.paddingRight), h: lh, t: shown, lines: 1, st });
      }
    }
    // Native selects paint their chosen option and an arrow, neither of which is in the DOM.
    if (tag === "select") {
      const t = el.selectedOptions[0]?.text || "";
      if (t) {
        const st = textStyle(cs);
        const lh = st.lh || st.s * 1.2;
        const left = r.left + px(cs.paddingLeft) + px(cs.borderLeftWidth);
        node.kids.push({ k: "text", x: left, y: r.top + (r.height - lh) / 2, w: r.width - px(cs.paddingLeft) - 32, h: lh, t, lines: 1, st });
      }
      if (cs.appearance !== "none") {
        const s = 16;
        node.kids.push({ k: "svg", n: "chevron", x: r.right - s - 12, y: r.top + (r.height - s) / 2, w: s, h: s, o: 1, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${cs.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>` });
      }
    }
    // Native checkboxes and radios are drawn by the browser, not by CSS: draw the box.
    const nativeCheck = tag === "input" && (el.type === "checkbox" || el.type === "radio") && cs.appearance !== "none";
    if (nativeCheck) {
      const accent = cs.accentColor && cs.accentColor !== "auto" ? cs.accentColor : "rgb(0, 117, 255)";
      node.bg = el.checked ? accent : "rgb(255, 255, 255)";
      node.bw = [1, 1, 1, 1];
      node.bc = el.checked ? accent : "rgb(118, 118, 118)";
      const rr = el.type === "radio" ? r.width / 2 : 3;
      node.rad = [rr, rr, rr, rr];
      if (el.disabled) node.o = 0.5;
      if (el.checked) node.kids.push({ k: "svg", n: "check", x: r.left, y: r.top, w: r.width, h: r.height, o: 1, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${r.width}" height="${r.height}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>` });
      return inView(r) ? node : null;
    }
    if (op < 1) node.o = op;
    if (visibleColor(cs.backgroundColor)) node.bg = cs.backgroundColor;
    if (cs.backgroundImage && cs.backgroundImage !== "none") {
      const m = cs.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
      if (m) node.bgImg = await shrink(await toData(m[1]), r.width, r.height);
      else node.grad = cs.backgroundImage;
      if (m) node.bgSize = cs.backgroundSize;
    }
    const bw = ["Top", "Right", "Bottom", "Left"].map((s) => px(cs["border" + s + "Width"]));
    const bc = ["Top", "Right", "Bottom", "Left"].map((s) => cs["border" + s + "Color"]);
    const bs = ["Top", "Right", "Bottom", "Left"].map((s) => cs["border" + s + "Style"]);
    if (bw.some((w, i) => w > 0 && bs[i] !== "none" && visibleColor(bc[i]))) {
      node.bw = bw.map((w, i) => (bs[i] === "none" || !visibleColor(bc[i]) ? 0 : w));
      node.bc = bc.find((c, i) => node.bw[i] > 0);
      if (bs.includes("dashed")) node.dash = 1;
    }
    const rad = ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map((s) => Math.min(px(cs["border" + s + "Radius"]), r.width / 2, r.height / 2));
    if (rad.some((x) => x > 0)) node.rad = rad;
    if (cs.boxShadow && cs.boxShadow !== "none") node.sh = cs.boxShadow;
    if (cs.overflow !== "visible" || cs.overflowX !== "visible" || cs.overflowY !== "visible") node.clip = 1;
    if (cs.transform && cs.transform !== "none") node.tf = cs.transform;

    for (const child of tag === "select" ? [] : el.childNodes) {
      if (child.nodeType === 3) {
        const t = child.textContent;
        if (!t || !t.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(child);
        const rects = [...range.getClientRects()].filter((q) => q.width > 0);
        if (!rects.length) continue;
        const left = Math.min(...rects.map((q) => q.left));
        const top = Math.min(...rects.map((q) => q.top));
        const right = Math.max(...rects.map((q) => q.right));
        const bottom = Math.max(...rects.map((q) => q.bottom));
        if (!inView({ left, top, right, bottom, width: right - left, height: bottom - top })) continue;
        const lines = new Set(rects.map((q) => Math.round(q.top))).size;
        node.kids.push({ k: "text", x: left, y: top, w: right - left, h: bottom - top, t: t.replace(/\s+/g, " ").trimStart(), lines, st: textStyle(cs) });
      } else if (child.nodeType === 1) {
        const k = await walk(child, op);
        if (k) node.kids.push(k);
      }
    }
    // Pure layout wrappers paint nothing: hoist their children to keep layers lean.
    const paints = node.bg || node.grad || node.bgImg || node.bw || node.sh;
    if (!inView(r) && !paints) return node.kids.length ? { k: "group", kids: node.kids } : null;
    if (!paints && !(node.clip && node.kids.length) && !node.o) return node.kids.length ? { k: "group", kids: node.kids } : null;
    if (!inView(r)) return null;
    return node;
  }

  const flat = (n) => (n && n.k === "group" ? n.kids.flatMap(flat) : n ? [n] : []);
  const fix = (n) => {
    if (n.kids) n.kids = n.kids.flatMap(flat).map(fix);
    return n;
  };
  const root = await walk(document.body, 1);
  const kids = flat(root).map(fix);
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  return { w: W, h: H, bg: visibleColor(bodyBg) ? bodyBg : "rgb(255, 255, 255)", kids };
};
