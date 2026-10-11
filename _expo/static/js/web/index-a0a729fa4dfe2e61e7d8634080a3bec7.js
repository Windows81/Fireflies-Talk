var _sentryDebugIds, _sentryDebugIdIdentifier;
void 0 === _sentryDebugIds && (_sentryDebugIds = {});
try {
  var stack = new Error().stack;
  stack &&
    ((_sentryDebugIds[stack] = "a74e4d10-3f4f-40a1-9386-cf20a8db82b1"),
    (_sentryDebugIdIdentifier =
      "sentry-dbid-a74e4d10-3f4f-40a1-9386-cf20a8db82b1"));
} catch (e) {}
var SENTRY_RELEASE;
SENTRY_RELEASE = { name: "Fireflies", version: "0.5.56" };
__d(
  function (g, r, i, a, m, e, d) {
    "use strict";
    Object.defineProperty(e, "__esModule", { value: !0 }),
      Object.defineProperty(e, "LegacyDestination", {
        enumerable: !0,
        get: function () {
          return I;
        },
      }),
      (e.ajsDestinations = function (n, o, s, c, f, v) {
        var p, _;
        void 0 === s && (s = {});
        void 0 === c && (c = {});
        if ((0, u.isServer)()) return [];
        o.plan && ((c = null != c ? c : {}).plan = o.plan);
        var w =
            null !==
              (_ =
                null === (p = o.middlewareSettings) || void 0 === p
                  ? void 0
                  : p.routingRules) && void 0 !== _
              ? _
              : [],
          P = o.integrations,
          z = c.integrations,
          O = (0, h.mergedOptions)(o, null != c ? c : {}),
          S =
            null == v
              ? void 0
              : v.reduce(function (n, o) {
                  var s;
                  return (0,
                  t.__assign)((0, t.__assign)({}, n), (((s = {})[(0, y.resolveIntegrationNameFromSource)(o)] = o), s));
                }, {}),
          k = new Set(
            (0, t.__spreadArray)(
              (0, t.__spreadArray)(
                [],
                Object.keys(P).filter(function (t) {
                  return (0, b.isInstallableIntegration)(t, P[t]);
                }),
                !0
              ),
              Object.keys(S || {}).filter(function (t) {
                return (
                  (0, l.isPlainObject)(P[t]) ||
                  (0, l.isPlainObject)(null == z ? void 0 : z[t])
                );
              }),
              !0
            )
          );
        return Array.from(k)
          .filter(function (t) {
            return !(0, b.isDisabledIntegration)(t, s);
          })
          .map(function (t) {
            var o = P[t],
              s = (0, y.resolveVersion)(o),
              u = new I(t, s, n, O[t], c, null == S ? void 0 : S[t]);
            return (
              w.filter(function (n) {
                return n.destinationName === t;
              }).length > 0 &&
                f &&
                u.addMiddleware(f),
              u
            );
          });
      });
    var t = r(d[0]),
      n = r(d[1]),
      o = r(d[2]),
      s = r(d[3]),
      u = r(d[4]),
      l = r(d[5]),
      c = r(d[6]),
      h = r(d[7]),
      f = r(d[8]),
      v = r(d[9]),
      p = r(d[10]),
      _ = r(d[11]),
      y = r(d[12]),
      b = r(d[13]),
      w = r(d[14]),
      P = r(d[15]);
    function z(n, u) {
      return (0, t.__awaiter)(this, void 0, void 0, function () {
        var c,
          h = this;
        return (0, t.__generator)(this, function (v) {
          switch (v.label) {
            case 0:
              return (
                (c = []),
                (0, o.isOffline)()
                  ? [2, u]
                  : [
                      4,
                      (0, f.pWhile)(
                        function () {
                          return u.length > 0 && (0, o.isOnline)();
                        },
                        function () {
                          return (0, t.__awaiter)(
                            h,
                            void 0,
                            void 0,
                            function () {
                              var o, h;
                              return (0, t.__generator)(this, function (t) {
                                switch (t.label) {
                                  case 0:
                                    return (o = u.pop())
                                      ? [4, (0, l.attempt)(o, n)]
                                      : [2];
                                  case 1:
                                    return (
                                      (h = t.sent()),
                                      h instanceof s.Context || c.push(o),
                                      [2]
                                    );
                                }
                              });
                            }
                          );
                        }
                      ),
                    ]
              );
            case 1:
              return (
                v.sent(),
                c.map(function (t) {
                  return u.pushWithBackoff(t);
                }),
                [2, u]
              );
          }
        });
      });
    }
    var I = (function () {
      function u(n, o, s, u, l, c) {
        void 0 === u && (u = {});
        var h = this;
        (this.options = {}),
          (this.type = "destination"),
          (this.middleware = []),
          (this.initializePromise = (0, P.createDeferred)()),
          (this.flushing = !1),
          (this.name = n),
          (this.version = o),
          (this.settings = (0, t.__assign)({}, u)),
          (this.disableAutoISOConversion = l.disableAutoISOConversion || !1),
          (this.integrationSource = c),
          this.settings.type &&
            "browser" === this.settings.type &&
            delete this.settings.type,
          this.initializePromise.promise.then(
            function (t) {
              return (h._initialized = t);
            },
            function () {}
          ),
          (this.options = l),
          (this.buffer = l.disableClientPersistence
            ? new v.PriorityQueue(4, [])
            : new p.PersistedPriorityQueue(
                4,
                "".concat(s, ":dest-").concat(n)
              )),
          this.scheduleFlush();
      }
      return (
        (u.prototype.isLoaded = function () {
          return !!this._ready;
        }),
        (u.prototype.ready = function () {
          var t = this;
          return this.initializePromise.promise.then(function () {
            var n;
            return null !== (n = t.onReady) && void 0 !== n
              ? n
              : Promise.resolve();
          });
        }),
        (u.prototype.load = function (n, o) {
          var s;
          return (0, t.__awaiter)(this, void 0, void 0, function () {
            var u,
              l,
              c = this;
            return (0, t.__generator)(this, function (t) {
              switch (t.label) {
                case 0:
                  return this._ready || void 0 !== this.onReady
                    ? [2]
                    : null === (s = this.integrationSource) || void 0 === s
                    ? [3, 1]
                    : ((l = s), [3, 3]);
                case 1:
                  return [
                    4,
                    (0, y.loadIntegration)(
                      n,
                      this.name,
                      this.version,
                      this.options.obfuscate
                    ),
                  ];
                case 2:
                  (l = t.sent()), (t.label = 3);
                case 3:
                  (u = l),
                    (this.integration = (0, y.buildIntegration)(
                      u,
                      this.settings,
                      o
                    )),
                    (this.onReady = new Promise(function (t) {
                      c.integration.once("ready", function () {
                        (c._ready = !0), t(!0);
                      });
                    })),
                    this.integration.on("initialize", function () {
                      c.initializePromise.resolve(!0);
                    });
                  try {
                    (0, w.recordIntegrationMetric)(n, {
                      integrationName: this.name,
                      methodName: "initialize",
                      type: "classic",
                    }),
                      this.integration.initialize();
                  } catch (t) {
                    throw (
                      ((0, w.recordIntegrationMetric)(n, {
                        integrationName: this.name,
                        methodName: "initialize",
                        type: "classic",
                        didError: !0,
                      }),
                      this.initializePromise.resolve(!1),
                      t)
                    );
                  }
                  return [2];
              }
            });
          });
        }),
        (u.prototype.unload = function (t, n) {
          return (0, y.unloadIntegration)(
            this.name,
            this.version,
            this.options.obfuscate
          );
        }),
        (u.prototype.addMiddleware = function () {
          for (var t, n = [], o = 0; o < arguments.length; o++)
            n[o] = arguments[o];
          this.middleware = (t = this.middleware).concat.apply(t, n);
        }),
        (u.prototype.shouldBuffer = function (t) {
          return (
            "page" !== t.event.type &&
            ((0, o.isOffline)() ||
              !0 !== this._ready ||
              !0 !== this._initialized)
          );
        }),
        (u.prototype.send = function (n, o, u) {
          var l, h;
          return (0, t.__awaiter)(this, void 0, void 0, function () {
            var f, v, p, y, b, P;
            return (0, t.__generator)(this, function (z) {
              switch (z.label) {
                case 0:
                  return this.shouldBuffer(n)
                    ? (this.buffer.push(n), this.scheduleFlush(), [2, n])
                    : ((f =
                        null ===
                          (h =
                            null === (l = this.options) || void 0 === l
                              ? void 0
                              : l.plan) || void 0 === h
                          ? void 0
                          : h.track),
                      (v = n.event.event),
                      f &&
                        v &&
                        "Segment.io" !== this.name &&
                        ((p = f[v]),
                        (0, c.isPlanEventEnabled)(f, p)
                          ? n.updateEvent(
                              "integrations",
                              (0, t.__assign)(
                                (0, t.__assign)({}, n.event.integrations),
                                null == p ? void 0 : p.integrations
                              )
                            )
                          : (n.updateEvent(
                              "integrations",
                              (0, t.__assign)(
                                (0, t.__assign)({}, n.event.integrations),
                                { All: !1, "Segment.io": !0 }
                              )
                            ),
                            n.cancel(
                              new s.ContextCancelation({
                                retry: !1,
                                reason: "Event "
                                  .concat(v, " disabled for integration ")
                                  .concat(this.name, " in tracking plan"),
                                type: "Dropped by plan",
                              })
                            )),
                        (null == p ? void 0 : p.enabled) &&
                          !1 ===
                            (null == p ? void 0 : p.integrations[this.name]) &&
                          n.cancel(
                            new s.ContextCancelation({
                              retry: !1,
                              reason: "Event "
                                .concat(v, " disabled for integration ")
                                .concat(this.name, " in tracking plan"),
                              type: "Dropped by plan",
                            })
                          )),
                      [
                        4,
                        (0, _.applyDestinationMiddleware)(
                          this.name,
                          n.event,
                          this.middleware
                        ),
                      ]);
                case 1:
                  if (null === (y = z.sent())) return [2, n];
                  (b = new o(y, { traverse: !this.disableAutoISOConversion })),
                    (0, w.recordIntegrationMetric)(n, {
                      integrationName: this.name,
                      methodName: u,
                      type: "classic",
                    }),
                    (z.label = 2);
                case 2:
                  return (
                    z.trys.push([2, 5, , 6]),
                    this.integration
                      ? [
                          4,
                          this.integration.invoke.call(this.integration, u, b),
                        ]
                      : [3, 4]
                  );
                case 3:
                  z.sent(), (z.label = 4);
                case 4:
                  return [3, 6];
                case 5:
                  throw (
                    ((P = z.sent()),
                    (0, w.recordIntegrationMetric)(n, {
                      integrationName: this.name,
                      methodName: u,
                      type: "classic",
                      didError: !0,
                    }),
                    P)
                  );
                case 6:
                  return [2, n];
              }
            });
          });
        }),
        (u.prototype.track = function (o) {
          return (0, t.__awaiter)(this, void 0, void 0, function () {
            return (0, t.__generator)(this, function (t) {
              return [2, this.send(o, n.Track, "track")];
            });
          });
        }),
        (u.prototype.page = function (o) {
          var s;
          return (0, t.__awaiter)(this, void 0, void 0, function () {
            return (0, t.__generator)(this, function (t) {
              switch (t.label) {
                case 0:
                  return (
                    (null === (s = this.integration) || void 0 === s
                      ? void 0
                      : s._assumesPageview) &&
                      !this._initialized &&
                      this.integration.initialize(),
                    [4, this.initializePromise.promise]
                  );
                case 1:
                  return t.sent(), [2, this.send(o, n.Page, "page")];
              }
            });
          });
        }),
        (u.prototype.identify = function (o) {
          return (0, t.__awaiter)(this, void 0, void 0, function () {
            return (0, t.__generator)(this, function (t) {
              return [2, this.send(o, n.Identify, "identify")];
            });
          });
        }),
        (u.prototype.alias = function (o) {
          return (0, t.__awaiter)(this, void 0, void 0, function () {
            return (0, t.__generator)(this, function (t) {
              return [2, this.send(o, n.Alias, "alias")];
            });
          });
        }),
        (u.prototype.group = function (o) {
          return (0, t.__awaiter)(this, void 0, void 0, function () {
            return (0, t.__generator)(this, function (t) {
              return [2, this.send(o, n.Group, "group")];
            });
          });
        }),
        (u.prototype.scheduleFlush = function () {
          var n = this;
          this.flushing ||
            setTimeout(function () {
              return (0, t.__awaiter)(n, void 0, void 0, function () {
                var n;
                return (0, t.__generator)(this, function (t) {
                  switch (t.label) {
                    case 0:
                      return (0, o.isOffline)() ||
                        !0 !== this._ready ||
                        !0 !== this._initialized
                        ? (this.scheduleFlush(), [2])
                        : ((this.flushing = !0),
                          (n = this),
                          [4, z(this, this.buffer)]);
                    case 1:
                      return (
                        (n.buffer = t.sent()),
                        (this.flushing = !1),
                        this.buffer.todo > 0 && this.scheduleFlush(),
                        [2]
                      );
                  }
                });
              });
            }, 5e3 * Math.random());
        }),
        u
      );
    })();
  },
  5469,
  [
    1478, 1547, 1510, 1512, 1511, 1480, 5478, 1580, 1573, 1530, 1529, 1586,
    5476, 5477, 1587, 1492,
  ]
);
__d(
  function (g, r, i, a, m, e, d) {
    "use strict";
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.resolveIntegrationNameFromSource = function (n) {
        return ("Integration" in n ? n.Integration : n).prototype.name;
      }),
      (e.buildIntegration = function (n, t, o) {
        var c;
        if ("Integration" in n) {
          n({
            user: function () {
              return o.user();
            },
            addIntegration: function () {},
          }),
            (c = n.Integration);
        } else c = n;
        var u = new c(t);
        return (u.analytics = o), u;
      }),
      (e.loadIntegration = function (s, v, f, w) {
        return (0, n.__awaiter)(this, void 0, void 0, function () {
          var _, p, I, y, h, S;
          return (0, n.__generator)(this, function (n) {
            switch (n.label) {
              case 0:
                (_ = c(v)),
                  (p = u(_, w)),
                  (I = (0, t.getNextIntegrationsURL)()),
                  (y = ""
                    .concat(I, "/integrations/")
                    .concat(null != p ? p : _, "/")
                    .concat(f, "/")
                    .concat(null != p ? p : _, ".dynamic.js.gz")),
                  (n.label = 1);
              case 1:
                return n.trys.push([1, 3, , 4]), [4, (0, o.loadScript)(y)];
              case 2:
                return n.sent(), l(y, s, v), [3, 4];
              case 3:
                throw (
                  ((h = n.sent()),
                  s.stats.gauge("legacy_destination_time", -1, [
                    "plugin:".concat(v),
                    "failed",
                  ]),
                  h)
                );
              case 4:
                return (
                  (S = window["".concat(_, "Deps")]),
                  [
                    4,
                    Promise.all(
                      S.map(function (n) {
                        return (0, o.loadScript)(I + n + ".gz");
                      })
                    ),
                  ]
                );
              case 5:
                return (
                  n.sent(),
                  window["".concat(_, "Loader")](),
                  [2, window["".concat(_, "Integration")]]
                );
            }
          });
        });
      }),
      (e.unloadIntegration = function (l, s, v) {
        return (0, n.__awaiter)(this, void 0, void 0, function () {
          var f, w, _, p;
          return (0, n.__generator)(this, function (n) {
            return (
              (f = (0, t.getNextIntegrationsURL)()),
              (w = c(l)),
              (_ = u(l, v)),
              (p = ""
                .concat(f, "/integrations/")
                .concat(null != _ ? _ : w, "/")
                .concat(s, "/")
                .concat(null != _ ? _ : w, ".dynamic.js.gz")),
              [2, (0, o.unloadScript)(p)]
            );
          });
        });
      }),
      (e.resolveVersion = function (n) {
        var t, o, c, u;
        return null !==
          (u =
            null !==
              (o =
                null === (t = null == n ? void 0 : n.versionSettings) ||
                void 0 === t
                  ? void 0
                  : t.override) && void 0 !== o
              ? o
              : null === (c = null == n ? void 0 : n.versionSettings) ||
                void 0 === c
              ? void 0
              : c.version) && void 0 !== u
          ? u
          : "latest";
      });
    var n = r(d[0]),
      t = r(d[1]),
      o = r(d[2]);
    function c(n) {
      return n.toLowerCase().replace(".", "").replace(/\s+/g, "-");
    }
    function u(n, t) {
      return void 0 === t && (t = !1), t ? btoa(n).replace(/=/g, "") : void 0;
    }
    function l(t, o, c) {
      var u, l;
      try {
        var s = (
          null !==
            (l =
              null ===
                (u =
                  null === window || void 0 === window
                    ? void 0
                    : window.performance) || void 0 === u
                ? void 0
                : u.getEntriesByName(t, "resource")) && void 0 !== l
            ? l
            : []
        )[0];
        s &&
          o.stats.gauge(
            "legacy_destination_time",
            Math.round(s.duration),
            (0, n.__spreadArray)([c], s.duration < 100 ? ["cached"] : [], !0)
          );
      } catch (n) {}
    }
  },
  5476,
  [1478, 1578, 1585]
);
__d(
  function (g, r, i, a, m, e, d) {
    "use strict";
    Object.defineProperty(e, "__esModule", { value: !0 }),
      Object.defineProperty(e, "isInstallableIntegration", {
        enumerable: !0,
        get: function () {
          return n;
        },
      }),
      Object.defineProperty(e, "isDisabledIntegration", {
        enumerable: !0,
        get: function () {
          return t;
        },
      });
    var n = function (n, t) {
        var u,
          o = t.type,
          l = t.bundlingStatus,
          s = t.versionSettings,
          b =
            "unbundled" !== l &&
            ("browser" === o ||
              (null === (u = null == s ? void 0 : s.componentTypes) ||
              void 0 === u
                ? void 0
                : u.includes("browser")));
        return !n.startsWith("Segment") && "Iterable" !== n && b;
      },
      t = function (n, t) {
        var u = !1 === t.All && void 0 === t[n];
        return !1 === t[n] || u;
      };
  },
  5477,
  []
);
//# sourceMappingURL=/_expo/static/js/web/index-a0a729fa4dfe2e61e7d8634080a3bec7.js.map
//# debugId=a74e4d10-3f4f-40a1-9386-cf20a8db82b1
