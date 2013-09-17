(function(){if (!Date.now) Date.now = function() {
            return +new Date;
        };
    try {
        document.createElement("div").style.setProperty("opacity", 0, "");
    } catch (error) {
        var d3_style_prototype = CSSStyleDeclaration.prototype,
            d3_style_setProperty = d3_style_prototype.setProperty;
        d3_style_prototype.setProperty = function(name, value, priority) {
            d3_style_setProperty.call(this, name, value + "", priority);
        };
    }
    d3 = {version: "2.5.0"}; // semver
    var d3_array = d3_arraySlice; // conversion for NodeLists

    function d3_arrayCopy(pseudoarray) {
        var i = -1, n = pseudoarray.length, array = [];
        while (++i < n) array.push(pseudoarray[i]);
        return array;
    }

    function d3_arraySlice(pseudoarray) {
        return Array.prototype.slice.call(pseudoarray);
    }

    try {
        d3_array(document.documentElement.childNodes)[0].nodeType;
    } catch(e) {
        d3_array = d3_arrayCopy;
    }

var d3_arraySubclass = [].__proto__?

    // Until ECMAScript supports array subclassing, prototype injection works well.
    function(array, prototype) {
    array.__proto__ = prototype;
}:

// And if your browser doesn't support __proto__, we'll use direct extension.
function(array, prototype) {
    for (var property in prototype) array[property] = prototype[property];
};
function d3_this() {
    return this;
}
d3.functor = function(v) {
    return typeof v === "function" ? v : function() { return v; };
};
// A getter-setter method that preserves the appropriate `this` context.
d3.rebind = function(object, method) {
    return function() {
        var x = method.apply(object, arguments);
        return arguments.length ? object : x;
    };
};
d3.ascending = function(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
};
d3.descending = function(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
};
d3.mean = function(array, f) {
    var n = array.length,
    a,
    m = 0,
    i = -1,
    j = 0;
    if (arguments.length === 1) {
        while (++i < n) if (d3_number(a = array[i])) m += (a - m) / ++j;
    } else {
        while (++i < n) if (d3_number(a = f.call(array, array[i], i))) m += (a - m) / ++j;
    }
    return j ? m : undefined;
};
d3.median = function(array, f) {
    if (arguments.length > 1) array = array.map(f);
    array = array.filter(d3_number);
    return array.length ? d3.quantile(array.sort(d3.ascending), .5) : undefined;
};
d3.min = function(array, f) {
    var i = -1,
    n = array.length,
    a,
    b;
    if (arguments.length === 1) {
        while (++i < n && ((a = array[i]) == null || a != a)) a = undefined;
        while (++i < n) if ((b = array[i]) != null && a > b) a = b;
    } else {
        while (++i < n && ((a = f.call(array, array[i], i)) == null || a != a)) a = undefined;
        while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
    }
    return a;
};
d3.max = function(array, f) {
    var i = -1,
    n = array.length,
    a,
    b;
    if (arguments.length === 1) {
        while (++i < n && ((a = array[i]) == null || a != a)) a = undefined;
        while (++i < n) if ((b = array[i]) != null && b > a) a = b;
    } else {
        while (++i < n && ((a = f.call(array, array[i], i)) == null || a != a)) a = undefined;
        while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
    }
    return a;
};
d3.extent = function(array, f) {
    var i = -1,
    n = array.length,
    a,
    b,
    c;
    if (arguments.length === 1) {
        while (++i < n && ((a = c = array[i]) == null || a != a)) a = c = undefined;
        while (++i < n) if ((b = array[i]) != null) {
                if (a > b) a = b;
                if (c < b) c = b;
            }
    } else {
        while (++i < n && ((a = c = f.call(array, array[i], i)) == null || a != a)) a = undefined;
        while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
                if (a > b) a = b;
                if (c < b) c = b;
            }
    }
    return [a, c];
};
d3.random = {
    normal: function(mean, deviation) {
        if (arguments.length < 2) deviation = 1;
        if (arguments.length < 1) mean = 0;
        return function() {
            var x, y, r;
            do {
                x = Math.random() * 2 - 1;
                y = Math.random() * 2 - 1;
                r = x * x + y * y;
            } while (!r || r > 1);
            return mean + deviation * x * Math.sqrt(-2 * Math.log(r) / r);
        };
    }
};
function d3_number(x) {
    return x != null && !isNaN(x);
}
d3.sum = function(array, f) {
    var s = 0,
    n = array.length,
    a,
    i = -1;

    if (arguments.length === 1) {
        while (++i < n) if (!isNaN(a = +array[i])) s += a;
    } else {
        while (++i < n) if (!isNaN(a = +f.cahe array into two halves so that
                                   // all v <= x for v in a[lo depth) {
                                   if (depth >= keys.length) return rollup
                                                                 ? rollup.call(nest, array) : (sortValues
                                                                                               s[i] = array[indexes[i]];
                                                                                               return permutes;
                                                                                               };
                                   d3.merge = fuile ((j = start + step * ++i) > stop) range.push(j);
                                   else while ((j = start + step * ++i) function(text) {
                                           callback(text ? JSON.parse(text) : null);
                                       });
                                   };
                            d3.html = function(url, callback) {
                                d3.text(url, "text/html", fu3.dispatch = function() {
                                        te listenerByName[name];
                                    }

                                    // add the new listener, if any
                                    if (listener) {
                                        listener._on = true;
                                        listeners.push(listener);
                                        listenerByName[name] = listener;
                                    }

                                    // If no precision is specified for r, fallback to general notation.
                                    if (type == "r" && !preccomma) value = d3_format_group(value);
                                    value = negative + value;
                                    }

                                d3_format_typeDefault(x) {
                                    return x + "";
                                }

                                // Apply comma grouping for thou 001 Robert Penner
 * All rights reserved.
 *
 * Redistribution and use in source and biOPYRIGHT OWNER OR CONTRIBUTORS BE
                                * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
                                * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
                                                         * SUBSTITUTE GOODle(t) {
                                                             return 1 - Math.sqrt(1 - t * t);
                                                         }

                                                         function d3_ease_elastic(a, p) {
                                                             var s;
                                                             return a + b * t; };
                                                         };

                                d3.interpolateRound = function(a, b) {
                                    b -= a;
  rowed by another number.
                                    s[o.i] = o.x;
                                } else { // This match is followed by a string, so HSL space, but outputs RGB string (for compatibility)
                                    d3.interpolateHs {
  return arguments.length === 1
  ? (r instanceoe.toString = function() {
          return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(t

                                                       /*l);
}

function d3_rgb_parseNumbeteblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00cede: "#87cefa",
  lightslategray: "#778899",
  lightslategr80",
  red: "#ff0000",
  rosyb_Hsl(h, s, l);
}

funct(m2 - m1) * (240 - h) / 60;
    return m1;
  }

  function vv(h) {
    return Math.round(v(h) * 255);
  }

  return d3_rgb(vv(h +function d3_selection_selectorAll(selector) {
 ocal);
    else this.setAttributeNS(name.space, name.local, x);
  }

  return tclassName;
    re.lastIndex =uments.length < 3)    if (x == null) delete this[name];
    else this[name] = x;
  }

  retur.createElementNS(name.space, name.local));
  }

  returdelete nodeByKey[key];
      }

      for (i = -1; ++i exit.push(exitNodes);
  }

  var i = -1,
      n = this.length,
      group;
  if (typeof data === "function") {
    we type specifier
  var name = "__on" + type,;) {
      var node = group[i];
      if (node) callback.call(node, node.__for (var j = -1, m = this.length; ++ type);

  var tweens = {},
      event (elapsed) : d3.timer(start, delay, time);

      function start(elapsed)

var d3_transitionRemove = {};

functio,
 call(node.node, node.node.__data__, i);
        subgroups.push(subgroup = []);
        for (var k = -1, o = subnodes.length; ++kction(t) { this.setAttributeNS(name.space, nrfunction() {
  return this.select(d3_this);
};
var d3_timer_queue = null,
    d3_timerame(d3_timer_step);
  }
}

function d3_timer_step() {
  var elapse.atan2(m.b, m.a) * d3_transformDegrees;
  this.scale = [1 = domain[i1],
      dx;

  if (x1 < x0) {
    dx =ts.length) return domain;
    domain = r.return extent;
}

function d3_scale_linearTicks(domain, g) {
  var pow = log.pow;

  function scale(x) {
    return linear(log(     }
      forscale.pow = function() {
  returction() {
    return d3_scale_pow(linear.copy(), exponent);
  };

  return d3_scale_linearRebinth) return range;
    range = x;
    rangeBand = 0;
    in.length + padding67bd",
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
];

var d3_category20 = [
  "#1f77b4", "#aec7e8",
  "#ff7f0e", "#ffbb7 n = domain.length,
    s0 = Math.sin(a0),
        c1 = Math.cos(a1),
    arc.outerRadius = function(v) {
    if (!arguments.length) return outerRadius;
    outerRadius = d3.functor(v);
    returgle;
}
functih
// dataore": d3_svg_lineStepBefore,
  "step-after": d3_svg_lineStepAfter,
  "basis": d3_svg_lineBasis,
  0,
      n = points.length,
      p = points[0],
      path = [p[0], s)
      : points[0th += "S" + (p[0] - t[0]) + "," + (p[1] - t[1])
          + "," + p[0] + "," + p[1];
    }
BasisBezier(path, px, py);
  while (++i < n) {
    pi = points[i];
    px.shift(); px.piven four-elemen1]) / (p1[0] - p0[0]);
}

// Compute three-point differences for the given poiialize the tang   interpolate,
      i0,
      i1,
      tension = .7;


  area.interpolate = function(x) {
    if (!arguments.length) return interpolate;
    i0 = d3_svg_lineInterpolators[interpoon equals(a, b) {
    return a.a0 == b.a0 && a.a1 == b.a1;
 ius;
}

function d3_svg_chordStartAngle(d) {
  return d.startAngle;
}

function d3_svg_chordEndAngle(d) {
  return d.endAngle;
}
d3.svg.diagonal = furn [d.x, d.y];
}
d3.svg.diagonal.radiment.body)
      .append("svg:svg")
   ion(x) {
    if (!arguments.length) return type;
    type = d3.functor(x);
    return symbol;
  };

  // size of symbol in square pixels
  symbol.size = function(x) {
    if (!argumentsze / (2 * d3_svg_symbolTan30)),
        rx = ryr scale = d3.scale.lind3_svg_axisSubdivide(scale, ticks, tickSubdivide),
          subtick = g.selectAll(".minor").data(subticks, String),
          subtickEnter  s.__ct-anchor", "start");
          pathUpdate.attr("d", "M" + tickEndSize + "," + range[0] + "H0V" + range[1] + "H" n = arguments.length - 1;
    tickMajorSize = +x;
    ti;) {
 lity", "hidden")
          .style("pointer-events", "all")
          .style("cursor", "crosshair");

      // The visible brush extent; style this as you like!
      fg.enter().append("svg:rect")
 {
        e = d3_scaleExtent(y.range(!arguments.length) return y;
    y = z;
    return brush;
  };

  brush.extent = function(z) {
    var x0, x1, y0, y1, t;

    // Invert the pixel extent to data-space.
    if (!arguments.leng
  brush.clear = function() {
    extent[0][0] =
    extent[0][1] =
    extent[1][0] =
    extent[1][1] = 0;
            g = d3.select(d3_svg_brushTarget);

    if (!d3_svg_brushDrag) {

      // If needed, determine the center from the current extent.
      if (d3.event.altKey) {
        if (!d3_svg_brushCe   d3_svg_brushRedrawY(g, d3_svg_brushExtent);
    }

    // Notify listeners.
    d3_svg_brushDispatch("brush");
  }
}

function d3_svg_bction drag() {
    this
        .on("mousedown.drag", mousedown)
        .on("touchstart.drag", mousedown);

    d3.select(windvior_dragMoved = 0;
  }

  function mousedown() {
    start.apply(this, arguments);
    d3_behavior_dragDispatch("dragstart");
  }

  drag.on = function(type, listener) {
    event.on(type, listener);
    return dragEventTarget =
  d3_behavior_dragTarget =
  d3_behavior_dragArguments =
  d3_behavior_dragOffset =
  d3_behavior dispatch
  function start() {
    d3_behavior_zoomXyz = xyz;
    d3_behavior_zoomExtent = extent;
    d3_behavior_zoomDispatch = event.zoom;
    d3_behavior_zoomEventTarget = d3.event.target;
    d3_behavl(xyz[2] - 1) : Mior_zoomEventTarget,
    d3_behavior_zoomTarget,
    d3_behavior_zoomArguments,
    d3_behavior_zoomMoved;

function d3_behavior_zoomLocation(poin_zoomDiv.scrollTop;
  } catch (error) {
    delta = e.wheelDelta || (-e.d0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2],
          l0 = d3_behavior_zoomLocations[p0.identifier],
   t, d3_behavior_zoomArguments);
  } finally {
    d3.event = o;
  }

  o.preventDefault();
}

var d3_behavior_zoomInfiniteExtent = [
  [-Infinity, Infinity],
  [-Infinity, Infinity],
