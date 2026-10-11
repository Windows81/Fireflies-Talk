var _sentryDebugIds, _sentryDebugIdIdentifier;
void 0 === _sentryDebugIds && (_sentryDebugIds = {});
try {
  var stack = new Error().stack;
  stack &&
    ((_sentryDebugIds[stack] = "e36fca41-5410-4698-aed9-322288bdc788"),
    (_sentryDebugIdIdentifier =
      "sentry-dbid-e36fca41-5410-4698-aed9-322288bdc788"));
} catch (e) {}
var SENTRY_RELEASE;
SENTRY_RELEASE = { name: "Fireflies", version: "0.5.56" };
__d(
  function (g, r, _i, a, m, e, d) {
    "use strict";
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.schemaFilter = function (s, o) {
        function u(u) {
          var c = s,
            f = u.event.event;
          if (c && f) {
            var l = c[f];
            if (!(0, t.isPlanEventEnabled)(c, l))
              return (
                u.updateEvent(
                  "integrations",
                  (0, n.__assign)((0, n.__assign)({}, u.event.integrations), {
                    All: !1,
                    "Segment.io": !0,
                  })
                ),
                u
              );
            var v = i(l, o);
            u.updateEvent(
              "integrations",
              (0, n.__assign)(
                (0, n.__assign)(
                  (0, n.__assign)({}, u.event.integrations),
                  null == l ? void 0 : l.integrations
                ),
                v
              )
            );
          }
          return u;
        }
        return {
          name: "Schema Filter",
          version: "0.1.0",
          isLoaded: function () {
            return !0;
          },
          load: function () {
            return Promise.resolve();
          },
          type: "before",
          page: u,
          alias: u,
          track: u,
          identify: u,
          group: u,
        };
      });
    var n = r(d[0]),
      t = r(d[1]);
    function i(n, t) {
      var i, s;
      if (!n || !Object.keys(n)) return {};
      var o = n.integrations
          ? Object.keys(n.integrations).filter(function (t) {
              return !1 === n.integrations[t];
            })
          : [],
        u = [];
      return (
        (null !== (i = t.remotePlugins) && void 0 !== i ? i : []).forEach(
          function (n) {
            o.forEach(function (t) {
              n.creationName == t && u.push(n.name);
            });
          }
        ),
        (null !== (s = t.remotePlugins) && void 0 !== s ? s : []).reduce(
          function (n, t) {
            return (
              t.settings.subscriptions &&
                u.includes(t.name) &&
                t.settings.subscriptions.forEach(function (i) {
                  return (n["".concat(t.name, " ").concat(i.partnerAction)] =
                    !1);
                }),
              n
            );
          },
          {}
        )
      );
    }
  },
  5471,
  [1478, 5478]
);
//# sourceMappingURL=/_expo/static/js/web/index-b460ae7adbc7d47a246c51aa58242945.js.map
//# debugId=e36fca41-5410-4698-aed9-322288bdc788
