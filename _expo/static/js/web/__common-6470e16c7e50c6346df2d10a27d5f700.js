var _sentryDebugIds, _sentryDebugIdIdentifier;
void 0 === _sentryDebugIds && (_sentryDebugIds = {});
try {
  var stack = new Error().stack;
  stack &&
    ((_sentryDebugIds[stack] = "22792c60-ccb1-4b51-ab4d-232dd5dae238"),
    (_sentryDebugIdIdentifier =
      "sentry-dbid-22792c60-ccb1-4b51-ab4d-232dd5dae238"));
} catch (e) {}
var SENTRY_RELEASE;
SENTRY_RELEASE = { name: "Fireflies", version: "0.5.56" };
__d(
  function (g, r, i, a, m, e, d) {
    "use strict";
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.isPlanEventEnabled = function (n, l) {
        var o, u;
        if ("boolean" == typeof (null == l ? void 0 : l.enabled))
          return l.enabled;
        return (
          null ===
            (u =
              null === (o = null == n ? void 0 : n.__default) || void 0 === o
                ? void 0
                : o.enabled) ||
          void 0 === u ||
          u
        );
      });
  },
  5478,
  []
);
//# sourceMappingURL=/_expo/static/js/web/__common-6470e16c7e50c6346df2d10a27d5f700.js.map
//# debugId=22792c60-ccb1-4b51-ab4d-232dd5dae238
