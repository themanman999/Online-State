! function(e) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
    else if ("function" == typeof define && define.amd) define([], e);
    else {
        ("undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this).toolbox = e()
    }
}(function() {
    return function e(t, n, r) {
        function o(s, c) {
            if (!n[s]) {
                if (!t[s]) {
                    var a = "function" == typeof require && require;
                    if (!c && a) return a(s, !0);
                    if (i) return i(s, !0);
                    var u = new Error("Cannot find module '" + s + "'");
                    throw u.code = "MODULE_NOT_FOUND", u
                }
                var f = n[s] = {
                    exports: {}
                };
                t[s][0].call(f.exports, function(e) {
                    return o(t[s][1][e] || e)
                }, f, f.exports, e, t, n, r)
            }
            return n[s].exports
        }
        for (var i = "function" == typeof require && require, s = 0; s < r.length; s++) o(r[s]);
        return o
    }({
        1: [function(e, t, n) {
            "use strict";

            function r(e, t) {
                ((t = t || {}).debug || c.debug) && console.log("[sw-toolbox] " + e)
            }

            function o(e) {
                var t;
                return e && e.cache && (t = e.cache.name), t = t || c.cache.name, caches.open(t)
            }

            function i(e) {
                var t = Array.isArray(e);
                if (t && e.forEach(function(e) {
                        "string" == typeof e || e instanceof Request || (t = !1)
                    }), !t) throw new TypeError("The precache method expects either an array of strings and/or Requests or a Promise that resolves to an array of strings and/or Requests.");
                return e
            }
            var s, c = e("./options"),
                a = e("./idb-cache-expiration");
            t.exports = {
                debug: r,
                fetchAndCache: function(e, t) {
                    var n = (t = t || {}).successResponses || c.successResponses;
                    return fetch(e.clone()).then(function(i) {
                        return "GET" === e.method && n.test(i.status) && o(t).then(function(n) {
                            n.put(e, i).then(function() {
                                var o, i = t.cache || c.cache;
                                (i.maxEntries || i.maxAgeSeconds) && i.name && (o = function(e, t, n) {
                                    var o = e.url,
                                        i = n.maxAgeSeconds,
                                        s = n.maxEntries,
                                        c = n.name,
                                        u = Date.now();
                                    return r("Updating LRU order for " + o + ". Max entries is " + s + ", max age is " + i), a.getDb(c).then(function(e) {
                                        return a.setTimestampForUrl(e, o, u)
                                    }).then(function(e) {
                                        return a.expireEntries(e, s, i, u)
                                    }).then(function(e) {
                                        r("Successfully updated IDB.");
                                        var n = e.map(function(e) {
                                            return t.delete(e)
                                        });
                                        return Promise.all(n).then(function() {
                                            r("Done with cache cleanup.")
                                        })
                                    }).catch(function(e) {
                                        r(e)
                                    })
                                }.bind(null, e, n, i), s = s ? s.then(o) : o())
                            })
                        }), i.clone()
                    })
                },
                openCache: o,
                renameCache: function(e, t, n) {
                    return r("Renaming cache: [" + e + "] to [" + t + "]", n), caches.delete(t).then(function() {
                        return Promise.all([caches.open(e), caches.open(t)]).then(function(t) {
                            var n = t[0],
                                r = t[1];
                            return n.keys().then(function(e) {
                                return Promise.all(e.map(function(e) {
                                    return n.match(e).then(function(t) {
                                        return r.put(e, t)
                                    })
                                }))
                            }).then(function() {
                                return caches.delete(e)
                            })
                        })
                    })
                },
                cache: function(e, t) {
                    return o(t).then(function(t) {
                        return t.add(e)
                    })
                },
                uncache: function(e, t) {
                    return o(t).then(function(t) {
                        return t.delete(e)
                    })
                },
                precache: function(e) {
                    e instanceof Promise || i(e), c.preCacheItems = c.preCacheItems.concat(e)
                },
                validatePrecacheInput: i,
                isResponseFresh: function(e, t, n) {
                    if (!e) return !1;
                    if (t) {
                        var r = e.headers.get("date");
                        if (r && new Date(r).getTime() + 1e3 * t < n) return !1
                    }
                    return !0
                }
            }
        }, {
            "./idb-cache-expiration": 2,
            "./options": 4
        }],
        2: [function(e, t, n) {
            "use strict";
            var r = "sw-toolbox-",
                o = 1,
                i = "store",
                s = "url",
                c = "timestamp",
                a = {};
            t.exports = {
                getDb: function(e) {
                    return e in a || (a[e] = (t = e, new Promise(function(e, n) {
                        var a = indexedDB.open(r + t, o);
                        a.onupgradeneeded = function() {
                            a.result.createObjectStore(i, {
                                keyPath: s
                            }).createIndex(c, c, {
                                unique: !1
                            })
                        }, a.onsuccess = function() {
                            e(a.result)
                        }, a.onerror = function() {
                            n(a.error)
                        }
                    }))), a[e];
                    var t
                },
                setTimestampForUrl: function(e, t, n) {
                    return new Promise(function(r, o) {
                        var s = e.transaction(i, "readwrite");
                        s.objectStore(i).put({
                            url: t,
                            timestamp: n
                        }), s.oncomplete = function() {
                            r(e)
                        }, s.onabort = function() {
                            o(s.error)
                        }
                    })
                },
                expireEntries: function(e, t, n, r) {
                    return (o = e, a = n, u = r, a ? new Promise(function(e, t) {
                        var n = 1e3 * a,
                            r = [],
                            f = o.transaction(i, "readwrite"),
                            h = f.objectStore(i);
                        h.index(c).openCursor().onsuccess = function(e) {
                            var t = e.target.result;
                            if (t && u - n > t.value[c]) {
                                var o = t.value[s];
                                r.push(o), h.delete(o), t.continue()
                            }
                        }, f.oncomplete = function() {
                            e(r)
                        }, f.onabort = t
                    }) : Promise.resolve([])).then(function(n) {
                        return (r = e, o = t, o ? new Promise(function(e, t) {
                            var n = [],
                                a = r.transaction(i, "readwrite"),
                                u = a.objectStore(i),
                                f = u.index(c),
                                h = f.count();
                            f.count().onsuccess = function() {
                                var e = h.result;
                                e > o && (f.openCursor().onsuccess = function(t) {
                                    var r = t.target.result;
                                    if (r) {
                                        var i = r.value[s];
                                        n.push(i), u.delete(i), e - n.length > o && r.continue()
                                    }
                                })
                            }, a.oncomplete = function() {
                                e(n)
                            }, a.onabort = t
                        }) : Promise.resolve([])).then(function(e) {
                            return n.concat(e)
                        });
                        var r, o
                    });
                    var o, a, u
                }
            }
        }, {}],
        3: [function(e, t, n) {
            "use strict";

            function r(e) {
                return e.reduce(function(e, t) {
                    return e.concat(t)
                }, [])
            }
            e("serviceworker-cache-polyfill");
            var o = e("./helpers"),
                i = e("./router"),
                s = e("./options");
            t.exports = {
                fetchListener: function(e) {
                    var t = i.match(e.request);
                    t ? e.respondWith(t(e.request)) : i.default && "GET" === e.request.method && 0 === e.request.url.indexOf("http") && e.respondWith(i.default(e.request))
                },
                activateListener: function(e) {
                    o.debug("activate event fired");
                    var t = s.cache.name + "$$$inactive$$$";
                    e.waitUntil(o.renameCache(t, s.cache.name))
                },
                installListener: function(e) {
                    var t = s.cache.name + "$$$inactive$$$";
                    o.debug("install event fired"), o.debug("creating cache [" + t + "]"), e.waitUntil(o.openCache({
                        cache: {
                            name: t
                        }
                    }).then(function(e) {
                        return Promise.all(s.preCacheItems).then(r).then(o.validatePrecacheInput).then(function(t) {
                            return o.debug("preCache list: " + (t.join(", ") || "(none)")), e.addAll(t)
                        })
                    }))
                }
            }
        }, {
            "./helpers": 1,
            "./options": 4,
            "./router": 6,
            "serviceworker-cache-polyfill": 16
        }],
        4: [function(e, t, n) {
            "use strict";
            var r;
            r = self.registration ? self.registration.scope : self.scope || new URL("./", self.location).href, t.exports = {
                cache: {
                    name: "$$$toolbox-cache$$$" + r + "$$$",
                    maxAgeSeconds: null,
                    maxEntries: null,
                    queryOptions: null
                },
                debug: !1,
                networkTimeoutSeconds: null,
                preCacheItems: [],
                successResponses: /^0|([123]\d\d)|(40[14567])|410$/
            }
        }, {}],
        5: [function(e, t, n) {
            "use strict";
            var r = new URL("./", self.location).pathname,
                o = e("path-to-regexp"),
                i = function(e, t, n, i) {
                    t instanceof RegExp ? this.fullUrlRegExp = t : (0 !== t.indexOf("/") && (t = r + t), this.keys = [], this.regexp = o(t, this.keys)), this.method = e, this.options = i, this.handler = n
                };
            i.prototype.makeHandler = function(e) {
                var t;
                if (this.regexp) {
                    var n = this.regexp.exec(e);
                    t = {}, this.keys.forEach(function(e, r) {
                        t[e.name] = n[r + 1]
                    })
                }
                return function(e) {
                    return this.handler(e, t, this.options)
                }.bind(this)
            }, t.exports = i
        }, {
            "path-to-regexp": 15
        }],
        6: [function(e, t, n) {
            "use strict";
            var r = e("./route"),
                o = e("./helpers"),
                i = function(e, t) {
                    for (var n = e.entries(), r = n.next(), o = []; !r.done;) new RegExp(r.value[0]).test(t) && o.push(r.value[1]), r = n.next();
                    return o
                },
                s = function() {
                    this.routes = new Map, this.routes.set(RegExp, new Map), this.default = null
                };
            ["get", "post", "put", "delete", "head", "any"].forEach(function(e) {
                s.prototype[e] = function(t, n, r) {
                    return this.add(e, t, n, r)
                }
            }), s.prototype.add = function(e, t, n, i) {
                var s;
                i = i || {}, t instanceof RegExp ? s = RegExp : s = (s = i.origin || self.location.origin) instanceof RegExp ? s.source : s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), e = e.toLowerCase();
                var c = new r(e, t, n, i);
                this.routes.has(s) || this.routes.set(s, new Map);
                var a = this.routes.get(s);
                a.has(e) || a.set(e, new Map);
                var u = a.get(e),
                    f = c.regexp || c.fullUrlRegExp;
                u.has(f.source) && o.debug('"' + t + '" resolves to same regex as existing route.'), u.set(f.source, c)
            }, s.prototype.matchMethod = function(e, t) {
                var n = new URL(t),
                    r = n.origin,
                    o = n.pathname;
                return this._match(e, i(this.routes, r), o) || this._match(e, [this.routes.get(RegExp)], t)
            }, s.prototype._match = function(e, t, n) {
                if (0 === t.length) return null;
                for (var r = 0; r < t.length; r++) {
                    var o = t[r],
                        s = o && o.get(e.toLowerCase());
                    if (s) {
                        var c = i(s, n);
                        if (c.length > 0) return c[0].makeHandler(n)
                    }
                }
                return null
            }, s.prototype.match = function(e) {
                return this.matchMethod(e.method, e.url) || this.matchMethod("any", e.url)
            }, t.exports = new s
        }, {
            "./helpers": 1,
            "./route": 5
        }],
        7: [function(e, t, n) {
            "use strict";
            var r = e("../options"),
                o = e("../helpers");
            t.exports = function(e, t, n) {
                var i = (n = n || {}).cache || r.cache,
                    s = i.queryOptions;
                return o.debug("Strategy: cache first [" + e.url + "]", n), o.openCache(n).then(function(t) {
                    return t.match(e, s).then(function(t) {
                        var r = Date.now();
                        return o.isResponseFresh(t, i.maxAgeSeconds, r) ? t : o.fetchAndCache(e, n)
                    })
                })
            }
        }, {
            "../helpers": 1,
            "../options": 4
        }],
        8: [function(e, t, n) {
            "use strict";
            var r = e("../options"),
                o = e("../helpers");
            t.exports = function(e, t, n) {
                var i = (n = n || {}).cache || r.cache,
                    s = i.queryOptions;
                return o.debug("Strategy: cache only [" + e.url + "]", n), o.openCache(n).then(function(t) {
                    return t.match(e, s).then(function(e) {
                        var t = Date.now();
                        if (o.isResponseFresh(e, i.maxAgeSeconds, t)) return e
                    })
                })
            }
        }, {
            "../helpers": 1,
            "../options": 4
        }],
        9: [function(e, t, n) {
            "use strict";
            var r = e("../helpers"),
                o = e("./cacheOnly");
            t.exports = function(e, t, n) {
                return r.debug("Strategy: fastest [" + e.url + "]", n), new Promise(function(i, s) {
                    var c = !1,
                        a = [],
                        u = function(e) {
                            a.push(e.toString()), c ? s(new Error('Both cache and network failed: "' + a.join('", "') + '"')) : c = !0
                        },
                        f = function(e) {
                            e instanceof Response ? i(e) : u("No result returned")
                        };
                    r.fetchAndCache(e.clone(), n).then(f, u), o(e, t, n).then(f, u)
                })
            }
        }, {
            "../helpers": 1,
            "./cacheOnly": 8
        }],
        10: [function(e, t, n) {
            t.exports = {
                networkOnly: e("./networkOnly"),
                networkFirst: e("./networkFirst"),
                cacheOnly: e("./cacheOnly"),
                cacheFirst: e("./cacheFirst"),
                fastest: e("./fastest")
            }
        }, {
            "./cacheFirst": 7,
            "./cacheOnly": 8,
            "./fastest": 9,
            "./networkFirst": 11,
            "./networkOnly": 12
        }],
        11: [function(e, t, n) {
            "use strict";
            var r = e("../options"),
                o = e("../helpers");
            t.exports = function(e, t, n) {
                var i = (n = n || {}).cache || r.cache,
                    s = i.queryOptions,
                    c = n.successResponses || r.successResponses,
                    a = n.networkTimeoutSeconds || r.networkTimeoutSeconds;
                return o.debug("Strategy: network first [" + e.url + "]", n), o.openCache(n).then(function(t) {
                    var r, u, f = [];
                    if (a) {
                        var h = new Promise(function(n) {
                            r = setTimeout(function() {
                                t.match(e, s).then(function(e) {
                                    var t = Date.now(),
                                        r = i.maxAgeSeconds;
                                    o.isResponseFresh(e, r, t) && n(e)
                                })
                            }, 1e3 * a)
                        });
                        f.push(h)
                    }
                    var p = o.fetchAndCache(e, n).then(function(e) {
                        if (r && clearTimeout(r), c.test(e.status)) return e;
                        throw o.debug("Response was an HTTP error: " + e.statusText, n), u = e, new Error("Bad response")
                    }).catch(function(r) {
                        return o.debug("Network or response error, fallback to cache [" + e.url + "]", n), t.match(e, s).then(function(e) {
                            if (e) return e;
                            if (u) return u;
                            throw r
                        })
                    });
                    return f.push(p), Promise.race(f)
                })
            }
        }, {
            "../helpers": 1,
            "../options": 4
        }],
        12: [function(e, t, n) {
            "use strict";
            var r = e("../helpers");
            t.exports = function(e, t, n) {
                return r.debug("Strategy: network only [" + e.url + "]", n), fetch(e)
            }
        }, {
            "../helpers": 1
        }],
        13: [function(e, t, n) {
            "use strict";
            var r = e("./options"),
                o = e("./router"),
                i = e("./helpers"),
                s = e("./strategies"),
                c = e("./listeners");
            i.debug("Service Worker Toolbox is loading"), self.addEventListener("install", c.installListener), self.addEventListener("activate", c.activateListener), self.addEventListener("fetch", c.fetchListener), t.exports = {
                networkOnly: s.networkOnly,
                networkFirst: s.networkFirst,
                cacheOnly: s.cacheOnly,
                cacheFirst: s.cacheFirst,
                fastest: s.fastest,
                router: o,
                options: r,
                cache: i.cache,
                uncache: i.uncache,
                precache: i.precache
            }
        }, {
            "./helpers": 1,
            "./listeners": 3,
            "./options": 4,
            "./router": 6,
            "./strategies": 10
        }],
        14: [function(e, t, n) {
            t.exports = Array.isArray || function(e) {
                return "[object Array]" == Object.prototype.toString.call(e)
            }
        }, {}],
        15: [function(e, t, n) {
            function r(e, t) {
                for (var n, r = [], o = 0, i = 0, c = "", a = t && t.delimiter || "/"; null != (n = p.exec(e));) {
                    var u = n[0],
                        f = n[1],
                        h = n.index;
                    if (c += e.slice(i, h), i = h + u.length, f) c += f[1];
                    else {
                        var l = e[i],
                            d = n[2],
                            m = n[3],
                            g = n[4],
                            v = n[5],
                            x = n[6],
                            w = n[7];
                        c && (r.push(c), c = "");
                        var y = null != d && null != l && l !== d,
                            b = "+" === x || "*" === x,
                            E = "?" === x || "*" === x,
                            R = n[2] || a,
                            k = g || v;
                        r.push({
                            name: m || o++,
                            prefix: d || "",
                            delimiter: R,
                            optional: E,
                            repeat: b,
                            partial: y,
                            asterisk: !!w,
                            pattern: k ? ($ = k, $.replace(/([=!:$\/()])/g, "\\$1")) : w ? ".*" : "[^" + s(R) + "]+?"
                        })
                    }
                }
                var $;
                return i < e.length && (c += e.substr(i)), c && r.push(c), r
            }

            function o(e) {
                return encodeURI(e).replace(/[\/?#]/g, function(e) {
                    return "%" + e.charCodeAt(0).toString(16).toUpperCase()
                })
            }

            function i(e) {
                for (var t = new Array(e.length), n = 0; n < e.length; n++) "object" == typeof e[n] && (t[n] = new RegExp("^(?:" + e[n].pattern + ")$"));
                return function(n, r) {
                    for (var i = "", s = n || {}, c = (r || {}).pretty ? o : encodeURIComponent, a = 0; a < e.length; a++) {
                        var u = e[a];
                        if ("string" != typeof u) {
                            var f, p = s[u.name];
                            if (null == p) {
                                if (u.optional) {
                                    u.partial && (i += u.prefix);
                                    continue
                                }
                                throw new TypeError('Expected "' + u.name + '" to be defined')
                            }
                            if (h(p)) {
                                if (!u.repeat) throw new TypeError('Expected "' + u.name + '" to not repeat, but received `' + JSON.stringify(p) + "`");
                                if (0 === p.length) {
                                    if (u.optional) continue;
                                    throw new TypeError('Expected "' + u.name + '" to not be empty')
                                }
                                for (var l = 0; l < p.length; l++) {
                                    if (f = c(p[l]), !t[a].test(f)) throw new TypeError('Expected all "' + u.name + '" to match "' + u.pattern + '", but received `' + JSON.stringify(f) + "`");
                                    i += (0 === l ? u.prefix : u.delimiter) + f
                                }
                            } else {
                                if (f = u.asterisk ? encodeURI(p).replace(/[?#]/g, function(e) {
                                        return "%" + e.charCodeAt(0).toString(16).toUpperCase()
                                    }) : c(p), !t[a].test(f)) throw new TypeError('Expected "' + u.name + '" to match "' + u.pattern + '", but received "' + f + '"');
                                i += u.prefix + f
                            }
                        } else i += u
                    }
                    return i
                }
            }

            function s(e) {
                return e.replace(/([.+*?=^!:${}()[\]|\/\\])/g, "\\$1")
            }

            function c(e, t) {
                return e.keys = t, e
            }

            function a(e) {
                return e.sensitive ? "" : "i"
            }

            function u(e, t, n) {
                h(t) || (n = t || n, t = []);
                for (var r = (n = n || {}).strict, o = !1 !== n.end, i = "", u = 0; u < e.length; u++) {
                    var f = e[u];
                    if ("string" == typeof f) i += s(f);
                    else {
                        var p = s(f.prefix),
                            l = "(?:" + f.pattern + ")";
                        t.push(f), f.repeat && (l += "(?:" + p + l + ")*"), i += l = f.optional ? f.partial ? p + "(" + l + ")?" : "(?:" + p + "(" + l + "))?" : p + "(" + l + ")"
                    }
                }
                var d = s(n.delimiter || "/"),
                    m = i.slice(-d.length) === d;
                return r || (i = (m ? i.slice(0, -d.length) : i) + "(?:" + d + "(?=$))?"), i += o ? "$" : r && m ? "" : "(?=" + d + "|$)", c(new RegExp("^" + i, a(n)), t)
            }

            function f(e, t, n) {
                return h(t) || (n = t || n, t = []), n = n || {}, e instanceof RegExp ? function(e, t) {
                    var n = e.source.match(/\((?!\?)/g);
                    if (n)
                        for (var r = 0; r < n.length; r++) t.push({
                            name: r,
                            prefix: null,
                            delimiter: null,
                            optional: !1,
                            repeat: !1,
                            partial: !1,
                            asterisk: !1,
                            pattern: null
                        });
                    return c(e, t)
                }(e, t) : h(e) ? function(e, t, n) {
                    for (var r = [], o = 0; o < e.length; o++) r.push(f(e[o], t, n).source);
                    return c(new RegExp("(?:" + r.join("|") + ")", a(n)), t)
                }(e, t, n) : (o = t, u(r(e, i = n), o, i));
                var o, i
            }
            var h = e("isarray");
            t.exports = f, t.exports.parse = r, t.exports.compile = function(e, t) {
                return i(r(e, t))
            }, t.exports.tokensToFunction = i, t.exports.tokensToRegExp = u;
            var p = new RegExp(["(\\\\.)", "([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))"].join("|"), "g")
        }, {
            isarray: 14
        }],
        16: [function(e, t, n) {
            ! function() {
                var e = Cache.prototype.addAll,
                    t = navigator.userAgent.match(/(Firefox|Chrome)\/(\d+\.)/);
                if (t) var n = t[1],
                    r = parseInt(t[2]);
                e && (!t || "Firefox" === n && r >= 46 || "Chrome" === n && r >= 50) || (Cache.prototype.addAll = function(e) {
                    function t(e) {
                        this.name = "NetworkError", this.code = 19, this.message = e
                    }
                    var n = this;
                    return t.prototype = Object.create(Error.prototype), Promise.resolve().then(function() {
                        if (arguments.length < 1) throw new TypeError;
                        return e = e.map(function(e) {
                            return e instanceof Request ? e : String(e)
                        }), Promise.all(e.map(function(e) {
                            "string" == typeof e && (e = new Request(e));
                            var n = new URL(e.url).protocol;
                            if ("http:" !== n && "https:" !== n) throw new t("Invalid scheme");
                            return fetch(e.clone())
                        }))
                    }).then(function(r) {
                        if (r.some(function(e) {
                                return !e.ok
                            })) throw new t("Incorrect response status");
                        return Promise.all(r.map(function(t, r) {
                            return n.put(e[r], t)
                        }))
                    }).then(function() {})
                }, Cache.prototype.add = function(e) {
                    return this.addAll([e])
                })
            }()
        }, {}]
    }, {}, [13])(13)
});
