'use strict';
!function() {
  function filter(n, e) {
    return n === e ? true : n.children ? n.children.some(function(n) {
      return filter(n, e);
    }) : false;
  }
  function remove(data) {
    if (data.children) {
      var d = data.children.map(remove);
      var r = d3.hsl(d[0]);
      var num = d3.hsl(d[1]);
      return d3.hsl((r.h + num.h) / 2, 1.2 * r.s, r.l / 1.2);
    }
    return data.colour || "#fff";
  }
  function arcTween(d) {
    var y = range(d);
    var xd = d3.interpolate(varx.domain(), [d.x, d.x + d.dx]);
    var yd = d3.interpolate(vary.domain(), [d.y, y]);
    var yr = d3.interpolate(vary.range(), [d.y ? 20 : 0, radius]);
    return function(xMove) {
      return function(t) {
        return varx.domain(xd(t)), vary.domain(yd(t)).range(yr(t)), x(xMove);
      };
    };
  }
  function range(c) {
    return c.children ? Math.max.apply(Math, c.children.map(range)) : c.y + c.dy;
  }
  function _rgb_to_xyz(rgb) {
    return .299 * rgb.r + .587 * rgb.g + .114 * rgb.b;
  }
  var width = 900;
  var height = width;
  var radius = width / 2;
  var varx = d3.scale.linear().range([0, 2 * Math.PI]);
  var vary = d3.scale.pow().exponent(1.3).domain([0, 1]).range([0, radius]);
  var padding = 5;
  var ANIMATION_DURATION = 1e3;
  var chart = d3.select("#vis");
  chart.select("img").remove();
  var thermometerLines = chart.append("svg").attr("width", width + 2 * padding).attr("height", height + 2 * padding).append("g").attr("transform", "translate(" + [radius + padding, radius + padding] + ")");
  chart.append("p").attr("id", "intro").text("\u2001");
  var h = d3.layout.partition().sort(null).value(function(itemCfg) {
    return 5.8 - itemCfg.depth;
  });
  var x = d3.svg.arc().startAngle(function(d) {
    return Math.max(0, Math.min(2 * Math.PI, varx(d.x)));
  }).endAngle(function(rect) {
    return Math.max(0, Math.min(2 * Math.PI, varx(rect.x + rect.dx)));
  }).innerRadius(function(d) {
    return Math.max(0, d.y ? vary(d.y) : d.y);
  }).outerRadius(function(rect) {
    return Math.max(0, vary(rect.y + rect.dy));
  });
  d3.json("wheel.json", function(canCreateDiscussions, contextMenu) {
    function update(d) {
      stationHeaders.transition().duration(ANIMATION_DURATION).attrTween("d", arcTween(d));
      stationLabels.style("visibility", function(e) {
        return filter(d, e) ? null : d3.select(this).style("visibility");
      }).transition().duration(ANIMATION_DURATION).attrTween("text-anchor", function(deltas) {
        return function() {
          return varx(deltas.x + deltas.dx / 2) > Math.PI ? "end" : "start";
        };
      }).attrTween("transform", function(d) {
        var type = (d.name || "").split(" ").length > 1;
        return function() {
          var admincoursecontents = 180 * varx(d.x + d.dx / 2) / Math.PI - 90;
          var courseContentPage = admincoursecontents + (type ? -.5 : 0);
          return "rotate(" + courseContentPage + ")translate(" + (vary(d.y) + padding) + ")rotate(" + (admincoursecontents > 90 ? -180 : 0) + ")";
        };
      }).style("fill-opacity", function(e) {
        return filter(d, e) ? 1 : 1e-6;
      }).each("end", function(e) {
        d3.select(this).style("visibility", filter(d, e) ? null : "hidden");
      });
    }
    var nodesPerLine = h.nodes({
      children : contextMenu
    });
    var stationHeaders = thermometerLines.selectAll("path").data(nodesPerLine);
    stationHeaders.enter().append("path").attr("id", function(canCreateDiscussions, index) {
      return "path-" + index;
    }).attr("d", x).attr("fill-rule", "evenodd").style("fill", remove).on("click", update);
    var stationLabels = thermometerLines.selectAll("text").data(nodesPerLine);
    var el = stationLabels.enter().append("text").style("fill-opacity", 1).style("fill", function(i) {
      return _rgb_to_xyz(d3.rgb(remove(i))) < 125 ? "#eee" : "#000";
    }).attr("text-anchor", function(deltas) {
      return varx(deltas.x + deltas.dx / 2) > Math.PI ? "end" : "start";
    }).attr("dy", ".2em").attr("transform", function(d) {
      var type = (d.name || "").split(" ").length > 1;
      var admincoursecontents = 180 * varx(d.x + d.dx / 2) / Math.PI - 90;
      var courseContentPage = admincoursecontents + (type ? -.5 : 0);
      return "rotate(" + courseContentPage + ")translate(" + (vary(d.y) + padding) + ")rotate(" + (admincoursecontents > 90 ? -180 : 0) + ")";
    }).on("click", update);
    el.append("tspan").attr("x", 0).text(function(tok) {
      return tok.depth ? tok.name.split(" ")[0] : "";
    });
    el.append("tspan").attr("x", 0).attr("dy", "1em").text(function(params) {
      return params.depth ? params.name.split(" ")[1] || "" : "";
    });
  });
}();
