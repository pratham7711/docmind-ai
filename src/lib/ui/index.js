import { jsxs as d, jsx as e, Fragment as B } from "react/jsx-runtime";
import y, { useState as w, useId as j, useRef as b, useEffect as g, useCallback as $ } from "react";
import { createPortal as k } from "react-dom";
function D(i) {
  const n = i.trim().split(/\s+/);
  return n.length === 1 ? n[0].slice(0, 2).toUpperCase() : (n[0][0] + n[n.length - 1][0]).toUpperCase();
}
const q = ({
  src: i,
  alt: n,
  name: a = "",
  size: r = "md",
  online: t = !1,
  className: s = ""
}) => {
  const [o, l] = w(!1), u = i && !o;
  return /* @__PURE__ */ d("span", { className: `ui-avatar ui-avatar-${r} ${s}`, children: [
    u ? /* @__PURE__ */ e(
      "img",
      {
        src: i,
        alt: n ?? a,
        onError: () => l(!0)
      }
    ) : /* @__PURE__ */ e("span", { "aria-label": a, children: a ? D(a) : "?" }),
    t && /* @__PURE__ */ e("span", { className: "ui-avatar-dot", "aria-label": "Online" })
  ] });
}, G = ({
  variant: i = "accent",
  size: n = "md",
  outlined: a = !1,
  dot: r = !1,
  className: t = "",
  children: s,
  ...o
}) => {
  const l = [
    "ui-badge",
    `ui-badge-${i}`,
    `ui-badge-${n}`,
    a ? "ui-badge-outlined" : "",
    t
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ d("span", { className: l, ...o, children: [
    r && /* @__PURE__ */ e("span", { className: "ui-badge-dot", "aria-hidden": "true" }),
    s
  ] });
}, F = y.forwardRef(
  ({
    variant: i = "primary",
    size: n = "md",
    loading: a = !1,
    iconLeft: r,
    iconRight: t,
    fullWidth: s = !1,
    disabled: o,
    className: l = "",
    children: u,
    style: f,
    ...c
  }, h) => {
    const m = [
      "ui-btn",
      `ui-btn-${i}`,
      `ui-btn-${n}`,
      a ? "ui-btn-loading" : "",
      s ? "ui-btn-full" : "",
      l
    ].filter(Boolean).join(" ");
    return /* @__PURE__ */ e(
      "button",
      {
        ref: h,
        className: m,
        disabled: o || a,
        "aria-busy": a,
        style: { width: s ? "100%" : void 0, ...f },
        ...c,
        children: a ? /* @__PURE__ */ e("span", { className: "ui-btn-spinner", "aria-hidden": "true" }) : /* @__PURE__ */ d(B, { children: [
          r && /* @__PURE__ */ e("span", { className: "ui-btn-icon", "aria-hidden": "true", children: r }),
          u,
          t && /* @__PURE__ */ e("span", { className: "ui-btn-icon", "aria-hidden": "true", children: t })
        ] })
      }
    );
  }
);
F.displayName = "Button";
const A = y.forwardRef(
  ({
    variant: i = "glass",
    clickable: n = !1,
    noPadding: a = !1,
    className: r = "",
    children: t,
    ...s
  }, o) => {
    const l = [
      "ui-card",
      `ui-card-${i}`,
      n ? "ui-card-clickable" : "",
      r
    ].filter(Boolean).join(" ");
    return /* @__PURE__ */ e(
      "div",
      {
        ref: o,
        className: l,
        role: n ? "button" : void 0,
        tabIndex: n ? 0 : void 0,
        onKeyDown: n ? (u) => {
          (u.key === "Enter" || u.key === " ") && s.onClick && s.onClick(u);
        } : void 0,
        ...s,
        children: a ? t : /* @__PURE__ */ e("div", { className: "ui-card-body", children: t })
      }
    );
  }
);
A.displayName = "Card";
const R = {
  connected: "Connected",
  connecting: "Connecting…",
  disconnected: "Disconnected",
  unavailable: "Unavailable"
}, Y = ({
  state: i,
  variant: n = "badge",
  label: a,
  className: r = ""
}) => {
  const t = a ?? R[i], s = i === "connecting", o = [
    n === "banner" ? "ui-conn-banner" : "ui-conn-badge",
    `ui-conn-${i}`,
    r
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ d(
    "div",
    {
      className: o,
      role: "status",
      "aria-live": "polite",
      "aria-label": `Connection status: ${t}`,
      children: [
        /* @__PURE__ */ e(
          "span",
          {
            className: `ui-conn-dot${s ? " ui-conn-dot-pulse" : ""}`,
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ e("span", { children: t })
      ]
    }
  );
}, _ = ({
  icon: i,
  title: n,
  description: a,
  action: r,
  className: t = ""
}) => /* @__PURE__ */ d("div", { className: `ui-empty ${t}`, role: "status", children: [
  i && /* @__PURE__ */ e("div", { className: "ui-empty-icon", "aria-hidden": "true", children: i }),
  /* @__PURE__ */ e("h3", { className: "ui-empty-title", children: n }),
  a && /* @__PURE__ */ e("p", { className: "ui-empty-desc", children: a }),
  r && /* @__PURE__ */ e("div", { children: r })
] }), V = ({
  brand: i,
  tagline: n,
  links: a = [],
  copyright: r,
  bottomRight: t,
  className: s = ""
}) => {
  const o = (/* @__PURE__ */ new Date()).getFullYear();
  return /* @__PURE__ */ e("footer", { className: `ui-footer ${s}`, children: /* @__PURE__ */ d("div", { className: "ui-footer-inner", children: [
    /* @__PURE__ */ d("div", { className: "ui-footer-top", children: [
      /* @__PURE__ */ d("div", { children: [
        /* @__PURE__ */ e("div", { className: "ui-footer-brand", children: i ?? "Brand" }),
        n && /* @__PURE__ */ e("p", { className: "ui-footer-tagline", children: n })
      ] }),
      a.length > 0 && /* @__PURE__ */ e("nav", { "aria-label": "Footer links", children: /* @__PURE__ */ e("ul", { className: "ui-footer-links", role: "list", children: a.map((l) => /* @__PURE__ */ e("li", { children: /* @__PURE__ */ e("a", { href: l.href, className: "ui-footer-link", children: l.label }) }, l.href)) }) })
    ] }),
    /* @__PURE__ */ d("div", { className: "ui-footer-bottom", children: [
      /* @__PURE__ */ e("p", { className: "ui-footer-copy", children: r ?? `© ${o} All rights reserved.` }),
      t && /* @__PURE__ */ e("div", { children: t })
    ] })
  ] }) });
}, K = y.forwardRef(
  ({ glow: i = !1, noPadding: n = !1, className: a = "", children: r, style: t, ...s }, o) => {
    const l = [
      "ui-glass-panel",
      i ? "ui-glass-panel-glow" : "",
      a
    ].filter(Boolean).join(" ");
    return /* @__PURE__ */ e(
      "div",
      {
        ref: o,
        className: l,
        style: n ? { padding: 0, ...t } : t,
        ...s,
        children: r
      }
    );
  }
);
K.displayName = "GlassPanel";
const L = y.forwardRef(
  ({
    label: i,
    error: n,
    iconLeft: a,
    iconRight: r,
    showCount: t = !1,
    size: s = "md",
    className: o = "",
    id: l,
    maxLength: u,
    value: f,
    ...c
  }, h) => {
    const m = j(), v = l ?? m, p = [
      "ui-input-root",
      n ? "ui-input-error" : ""
    ].filter(Boolean).join(" "), N = [
      "ui-input",
      `ui-input-${s}`,
      a ? "ui-input-with-left" : "",
      r ? "ui-input-with-right" : "",
      o
    ].filter(Boolean).join(" "), x = typeof f == "string" ? f.length : 0;
    return /* @__PURE__ */ d("div", { className: p, children: [
      i && /* @__PURE__ */ e("label", { htmlFor: v, className: "ui-input-label", children: i }),
      /* @__PURE__ */ d("div", { className: "ui-input-wrap", children: [
        a && /* @__PURE__ */ e("span", { className: "ui-input-icon-left", "aria-hidden": "true", children: a }),
        /* @__PURE__ */ e(
          "input",
          {
            ref: h,
            id: v,
            className: N,
            "aria-invalid": !!n,
            "aria-describedby": n ? `${v}-error` : void 0,
            maxLength: u,
            value: f,
            ...c
          }
        ),
        r && /* @__PURE__ */ e("span", { className: "ui-input-icon-right", "aria-hidden": "true", children: r })
      ] }),
      n && /* @__PURE__ */ e("span", { id: `${v}-error`, className: "ui-input-error-msg", role: "alert", children: n }),
      t && u && /* @__PURE__ */ d("span", { className: "ui-input-count", "aria-live": "polite", children: [
        x,
        "/",
        u
      ] })
    ] });
  }
);
L.displayName = "Input";
const z = ({
  size: i = "md",
  label: n = "Loading…",
  className: a = ""
}) => /* @__PURE__ */ e(
  "span",
  {
    className: `ui-spinner ui-spinner-${i} ${a}`,
    role: "status",
    "aria-label": n
  }
), E = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])', J = ({
  open: i,
  onClose: n,
  title: a,
  size: r = "md",
  footer: t,
  hideClose: s = !1,
  children: o
}) => {
  const l = b(null), u = b(null);
  g(() => (i ? (u.current = document.activeElement, document.body.style.overflow = "hidden", setTimeout(() => {
    l.current?.querySelectorAll(E)[0]?.focus();
  }, 50)) : (document.body.style.overflow = "", u.current?.focus()), () => {
    document.body.style.overflow = "";
  }), [i]), g(() => {
    if (!i) return;
    const h = (m) => {
      m.key === "Escape" && n();
    };
    return document.addEventListener("keydown", h), () => document.removeEventListener("keydown", h);
  }, [i, n]);
  const f = $((h) => {
    if (h.key !== "Tab" || !l.current) return;
    const m = Array.from(
      l.current.querySelectorAll(E)
    ).filter((N) => !N.closest("[aria-hidden]"));
    if (!m.length) return;
    const v = m[0], p = m[m.length - 1];
    h.shiftKey ? document.activeElement === v && (h.preventDefault(), p.focus()) : document.activeElement === p && (h.preventDefault(), v.focus());
  }, []);
  if (!i) return null;
  const c = /* @__PURE__ */ e(
    "div",
    {
      className: "ui-modal-backdrop",
      onClick: (h) => {
        h.target === h.currentTarget && n();
      },
      "aria-modal": "true",
      role: "dialog",
      "aria-label": a,
      children: /* @__PURE__ */ d(
        "div",
        {
          ref: l,
          className: `ui-modal ui-modal-${r}`,
          onKeyDown: f,
          children: [
            (a || !s) && /* @__PURE__ */ d("div", { className: "ui-modal-header", children: [
              a && /* @__PURE__ */ e("h2", { className: "ui-modal-title", children: a }),
              !s && /* @__PURE__ */ e(
                "button",
                {
                  className: "ui-modal-close",
                  onClick: n,
                  "aria-label": "Close modal",
                  children: "×"
                }
              )
            ] }),
            /* @__PURE__ */ e("div", { className: "ui-modal-body", children: o }),
            t && /* @__PURE__ */ e("div", { className: "ui-modal-footer", children: t })
          ]
        }
      )
    }
  );
  return k(c, document.body);
}, Q = ({
  logo: i,
  links: n = [],
  cta: a,
  className: r = ""
}) => {
  const [t, s] = w(!1), [o, l] = w(!1), u = b(null);
  g(() => {
    const c = document.createElement("div");
    c.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;pointer-events:none;", document.body.prepend(c);
    const h = new IntersectionObserver(
      ([p]) => s(!p.isIntersecting),
      { threshold: 0 }
    ), m = document.createElement("div");
    m.style.cssText = "position:absolute;top:80px;left:0;width:1px;height:1px;pointer-events:none;", document.body.prepend(m), h.observe(m);
    const v = () => s(window.scrollY > 20);
    return window.addEventListener("scroll", v, { passive: !0 }), () => {
      h.disconnect(), window.removeEventListener("scroll", v), c.remove(), m.remove();
    };
  }, []), g(() => {
    const c = () => {
      window.innerWidth > 768 && l(!1);
    };
    return window.addEventListener("resize", c), () => window.removeEventListener("resize", c);
  }, []);
  const f = [
    "ui-nav",
    t ? "ui-nav-glass" : "ui-nav-transparent",
    r
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ d(B, { children: [
    /* @__PURE__ */ e("nav", { className: f, ref: u, "aria-label": "Main navigation", children: /* @__PURE__ */ d("div", { className: "ui-nav-inner", children: [
      /* @__PURE__ */ e("div", { className: "ui-nav-logo", children: i ?? /* @__PURE__ */ e("span", { style: { color: "var(--ui-accent)" }, children: "@pratham/ui" }) }),
      n.length > 0 && /* @__PURE__ */ e("ul", { className: "ui-nav-links", role: "list", children: n.map((c) => /* @__PURE__ */ e("li", { children: /* @__PURE__ */ e("a", { href: c.href, className: "ui-nav-link", children: c.label }) }, c.href)) }),
      /* @__PURE__ */ d("div", { style: { display: "flex", alignItems: "center", gap: "var(--ui-sp-4)" }, children: [
        a && /* @__PURE__ */ e("div", { className: "ui-nav-cta", children: a }),
        /* @__PURE__ */ d(
          "button",
          {
            className: `ui-nav-hamburger${o ? " open" : ""}`,
            "aria-label": o ? "Close menu" : "Open menu",
            "aria-expanded": o,
            "aria-controls": "ui-nav-mobile",
            onClick: () => l((c) => !c),
            children: [
              /* @__PURE__ */ e("span", {}),
              /* @__PURE__ */ e("span", {}),
              /* @__PURE__ */ e("span", {})
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ d(
      "div",
      {
        id: "ui-nav-mobile",
        className: `ui-nav-mobile${o ? " open" : ""}`,
        "aria-hidden": !o,
        children: [
          n.map((c) => /* @__PURE__ */ e(
            "a",
            {
              href: c.href,
              className: "ui-nav-link",
              onClick: () => l(!1),
              children: c.label
            },
            c.href
          )),
          a && /* @__PURE__ */ e("div", { style: { paddingTop: "var(--ui-sp-2)" }, children: a })
        ]
      }
    )
  ] });
}, W = ({
  overline: i,
  title: n,
  subtitle: a,
  centered: r = !1,
  as: t = "h2",
  className: s = ""
}) => {
  const o = [
    "ui-section-header",
    r ? "ui-section-header-center" : "",
    s
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ d("div", { className: o, children: [
    i && /* @__PURE__ */ e("span", { className: "ui-section-overline", "aria-hidden": "true", children: i }),
    /* @__PURE__ */ e(t, { className: "ui-section-title", children: n }),
    a && /* @__PURE__ */ e("p", { className: "ui-section-subtitle", children: a })
  ] });
}, C = (i) => typeof i == "number" ? `${i}px` : i, X = ({
  variant: i = "text",
  width: n,
  height: a,
  className: r = ""
}) => {
  const t = {
    text: { width: "100%", height: "14px" },
    rect: { width: "100%", height: "120px" },
    circle: { width: "40px", height: "40px" }
  }, s = [
    "ui-skeleton",
    `ui-skeleton-${i}`,
    r
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ e(
    "div",
    {
      className: s,
      "aria-hidden": "true",
      style: {
        width: C(n) ?? t[i].width,
        height: C(a) ?? t[i].height
      }
    }
  );
}, O = {
  up: "↑",
  down: "↓",
  neutral: "→"
}, Z = ({
  value: i,
  label: n,
  trend: a,
  trendLabel: r,
  icon: t,
  className: s = ""
}) => /* @__PURE__ */ d("div", { className: `ui-statcard ${s}`, children: [
  /* @__PURE__ */ d("div", { className: "ui-statcard-header", children: [
    /* @__PURE__ */ e("span", { className: "ui-statcard-label", children: n }),
    t && /* @__PURE__ */ e("div", { className: "ui-statcard-icon", "aria-hidden": "true", children: t })
  ] }),
  /* @__PURE__ */ e("div", { className: "ui-statcard-value", "aria-label": `${n}: ${i}`, children: i }),
  a && /* @__PURE__ */ d(
    "div",
    {
      className: `ui-statcard-trend ui-statcard-trend-${a}`,
      "aria-label": `Trend: ${r ?? a}`,
      children: [
        /* @__PURE__ */ e("span", { "aria-hidden": "true", children: O[a] }),
        r && /* @__PURE__ */ e("span", { children: r })
      ]
    }
  )
] }), ee = ({
  outlined: i = !1,
  clickable: n = !1,
  icon: a,
  removable: r = !1,
  onRemove: t,
  className: s = "",
  children: o,
  onClick: l,
  ...u
}) => {
  const f = [
    "ui-tag",
    i ? "ui-tag-outlined" : "",
    n ? "ui-tag-clickable" : "",
    s
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ d(
    "span",
    {
      className: f,
      role: n ? "button" : void 0,
      tabIndex: n ? 0 : void 0,
      onClick: n ? l : void 0,
      onKeyDown: n ? (c) => {
        (c.key === "Enter" || c.key === " ") && l && l(c);
      } : void 0,
      ...u,
      children: [
        a && /* @__PURE__ */ e("span", { "aria-hidden": "true", children: a }),
        o,
        r && /* @__PURE__ */ e(
          "button",
          {
            className: "ui-tag-remove",
            onClick: (c) => {
              c.stopPropagation(), t?.();
            },
            "aria-label": "Remove tag",
            children: "×"
          }
        )
      ]
    }
  );
}, P = y.forwardRef(
  ({
    label: i,
    error: n,
    autoResize: a = !1,
    showCount: r = !1,
    className: t = "",
    id: s,
    maxLength: o,
    value: l,
    onChange: u,
    ...f
  }, c) => {
    const h = j(), m = s ?? h, v = b(null), p = c ?? v, N = (I) => {
      a && p.current && (p.current.style.height = "auto", p.current.style.height = p.current.scrollHeight + "px"), u?.(I);
    };
    g(() => {
      a && p.current && (p.current.style.height = "auto", p.current.style.height = p.current.scrollHeight + "px");
    }, [l, a, p]);
    const x = ["ui-input-root", n ? "ui-textarea-error" : ""].filter(Boolean).join(" "), S = [
      "ui-textarea",
      a ? "ui-textarea-auto" : "",
      t
    ].filter(Boolean).join(" "), T = typeof l == "string" ? l.length : 0;
    return /* @__PURE__ */ d("div", { className: x, children: [
      i && /* @__PURE__ */ e("label", { htmlFor: m, className: "ui-input-label", children: i }),
      /* @__PURE__ */ e(
        "textarea",
        {
          ref: p,
          id: m,
          className: S,
          "aria-invalid": !!n,
          "aria-describedby": n ? `${m}-error` : void 0,
          maxLength: o,
          value: l,
          onChange: N,
          ...f
        }
      ),
      n && /* @__PURE__ */ e("span", { id: `${m}-error`, className: "ui-input-error-msg", role: "alert", children: n }),
      r && o && /* @__PURE__ */ d("span", { className: "ui-input-count", "aria-live": "polite", children: [
        T,
        "/",
        o
      ] })
    ] });
  }
);
P.displayName = "Textarea";
const ne = ({
  content: i,
  placement: n = "top",
  delay: a = 300,
  children: r
}) => {
  const [t, s] = w(!1), o = b(null), l = $(() => {
    o.current = setTimeout(() => s(!0), a);
  }, [a]), u = $(() => {
    o.current && clearTimeout(o.current), s(!1);
  }, []);
  return /* @__PURE__ */ d(
    "span",
    {
      className: "ui-tooltip-root",
      onMouseEnter: l,
      onMouseLeave: u,
      onFocus: l,
      onBlur: u,
      children: [
        r,
        t && /* @__PURE__ */ e(
          "span",
          {
            className: `ui-tooltip-box ui-tooltip-${n}`,
            role: "tooltip",
            "aria-live": "polite",
            children: i
          }
        )
      ]
    }
  );
};
export {
  q as Avatar,
  G as Badge,
  F as Button,
  A as Card,
  Y as ConnectionStatus,
  _ as EmptyState,
  V as Footer,
  K as GlassPanel,
  L as Input,
  z as LoadingSpinner,
  J as Modal,
  Q as Nav,
  W as SectionHeader,
  X as Skeleton,
  Z as StatCard,
  ee as Tag,
  P as Textarea,
  ne as Tooltip
};
