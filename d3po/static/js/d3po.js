// Globals
var allPlotData,
    columnNames,
    columnDomains,
    svg,
    stateMarkerStyle, stateHistogramStyle;

/*
    Define some default style parameters
*/

// all size / padding parameters are specified in pixels
var defaults = {
    "stateStyle" : {
        "padding" : {
            "top" : 20,
            "left" : 50,
            "right" : -20,
            "bottom" : 0
        },
    },
    "plotStyle" : {
        "padding" : {
            "top" : 25,
            "left" : 20,
            "right" : 100,
            "bottom" : 50
        },
        "size" : {
            "width" : 200,
            "height" : 200
        }
    },
    "markerStyle" : {
        "selected" : {
            "opacity" : 0.75,
            "size" : 3,
            "color" : "#333333"
        },
        "unselected" : {
            "opacity" : 0.5,
            "size" : 3,
            "color" : "#cccccc"
        }
    },
    "histogramStyle" : {
        "selected" : {
            "opacity" : 1.,
            "color" : "#333333"
        },
        "unselected" : {
            "opacity" : 1.,
            "color" : "#cccccc"
        }
    },
    "colorScale" : {
        "map" : ["red", "blue"]
    },
    "bins" : 10,
    "tickSize" : 16,
    "nTicks" : 5
};

/*
    Generalized plotting
*/
// TODO: also pass in 'data' -- list of objects w/ x, y parameters?
function scatter(state, plot, cell) {
    // remove any histogram
    cell.selectAll("rect.data").data([]).exit().remove();

    var circ = cell.selectAll("circle.data")
                   .data(allPlotData);
    circ.enter().append("circle")
                .classed("data",true);
    circ.transition().duration(400).ease("quad-out")
        .attr("cx", function(d) { return state.xScaler(d[plot.xCol]); })
        .attr("cy", function(d) { return state.yScaler(d[plot.yCol]); })
        .attr("r", function (d,ii) {
            if (state.isSelected(d,ii)) {
                return plot.style['selected']['size'];
            } else {
                return plot.style['unselected']['size'];
            }
        })
        .style("fill", function (d,ii) {
            if (state.isSelected(d,ii)) {
                return state.cScaler(d[state.colorColumn]) || plot.style['selected']["color"];
            } else {
                return plot.style['unselected']['color'];
            }
        })
        .attr("opacity", function (d,ii) {
            if (state.isSelected(d,ii)) {
                return plot.style['selected']['opacity'];
            } else {
                return plot.style['unselected']['opacity'];
            }
        })
        .attr("plot-index", plot.index)
        .attr("clip-path", "url(#clip)");
    circ.exit().remove();
}

// TODO: how to support y histograms?
function histogram(state, plot, cell) {
    var nbins = plot.bins;

    var rawData = allPlotData.map(function(d) { return parseFloat(d[plot.xCol]); });
    var data = d3.layout.histogram().bins(nbins)(rawData);

    var barWidth = state.xScaler(2*data[0].dx) - state.xScaler(data[0].dx);
    var height = state.plotStyle['size']['height'];

    var barHeightScaler = d3.scale.linear()
              .domain([0, d3.max(data, function(d) { return d.y; })])
              .range([height, 0]);

    // remove any data points
    cell.selectAll("circle.data").data([]).exit().remove();
    var bar = cell.selectAll("rect.data").data(data);
    bar.enter().append("rect")
               .classed("bar", true)
               .classed("data", true);
    bar.style("fill", function (d,ii) {
            if (state.isSelected(d,ii)) {
                return plot.style['selected']['color'];
            } else {
                return plot.style['unselected']['color'];
            }
        })
       .style("opacity", function (d,ii) {
            if (state.isSelected(d,ii)) {
                return plot.style['selected']['opacity'];
            } else {
                return plot.style['unselected']['opacity'];
            }
        });
    bar.transition().duration(400).ease("quad-out")
        .attr("x", function(d) {
            return state.xScaler(d.x);
        })
        .attr("y", function(d) {
            return barHeightScaler(d.y) + state.plotStyle['padding']['top'];
        })
        .attr("width", barWidth)
        .attr("height", function(d) {
            return height - barHeightScaler(d.y);
        })
    bar.exit().remove();
}

/*
    Classes for parsing JSON and defaults
*/

Plot = function(jsonPlot) {

    this.gridPosition = jsonPlot["gridPosition"] || [0,0];
    this.type = jsonPlot["type"] || "scatter";

    var xAxis = jsonPlot["xAxis"] || {},
        yAxis = jsonPlot["yAxis"] || {};

    // Set column names
    this.xCol = xAxis["columnName"] || undefined;
    this.yCol = yAxis["columnName"] || undefined;

    this.xLabel = xAxis["label"] || (this.xCol || "");
    this.yLabel = yAxis["label"] || (this.yCol || "");
    this.xLim = xAxis["range"];
    this.yLim = yAxis["range"];

    this.nXTicks = xAxis["xTicks"] || defaults["nTicks"];
    this.nYTicks = xAxis["yTicks"] || defaults["nTicks"];

    var defaultStyle,
        style = jsonPlot["style"] || {};
    if (this.type == "scatter") {
        defaultStyle = stateMarkerStyle;
    } else if (this.type == "histogram") {
        defaultStyle = stateHistogramStyle;
        this.bins = xAxis['bins'] || yAxis['bins'] || defaults["bins"];
        console.debug(this.bins);
    } else {
        console.log("Invalid type '" + this.type + "'");
        return;
    }

    for (var key in defaultStyle) {
        var thisStyle = style[key] || {};
        for (var key2 in defaultStyle[key]) {
            thisStyle[key2] = thisStyle[key2] || defaultStyle[key][key2];
        }
        style[key] = thisStyle;
    }
    this.style = style;

    this.translate = function(state) {
        // compute the amount to translate the individual plots by
        // TODO: why are indices flipped??

        var xIndex = this.gridPosition[1],
            yIndex = this.gridPosition[0];

        xTrans = xIndex * (state.plotStyle['padding']['left'] + state.plotStyle['padding']['right'] +
                           state.plotStyle['size']['width']);
        yTrans = yIndex *(state.plotStyle['padding']['top'] + state.plotStyle['padding']['bottom'] +
                          state.plotStyle['size']['height']);

        return [xTrans,yTrans];
    }

    this.drawAxes = function(state, cell) {
        // x-axis ticks and label
        if (this.xCol) {
            state.xScaler.domain(this.xLim || columnDomains[this.xCol]);

            // set up x axis ticks
            xAxisD3 = d3.svg.axis()
                            .scale(state.xScaler)
                            .orient("bottom")
                            .ticks(this.nXTicks)
                            .tickSize(defaults["tickSize"])
                            .tickFormat(function (d) {
                                if (d > 1e4) {
                                    var x = d3.format('e');
                                    return x(d);
                                } else {
                                    return d;
                                }
                            });

            var xAxis = cell.selectAll(".x-axis")
                          .data([this]);
            xAxis.enter().append("g")
                 .attr("class", "axis x-axis");
            xAxis.exit().remove();
            xAxis.transition().duration(0).ease('quad-out')
                 .attr("transform", function(p) {
                    return "translate(0," + (state.plotStyle['size']['height'] + state.plotStyle['padding']['top'] - 10) + ")";
                }).each(function(p) {
                    d3.select(this).call(xAxisD3);
                });

            // Add axis labels
            var xLabel = cell.selectAll(".x-label")
                            .data([this]);
            xLabel.enter().append("text")
                  .attr("class", "axis-label x-label");
            xLabel.exit().remove();
            xLabel.text(function(p, i) { return p.xLabel; });
            xLabel.attr("x", function(p) {
                return state.plotStyle['padding']['left'] + state.plotStyle['size']['width']/2. - $(this).width()/2.;
            });
            xLabel.attr("y", function(p) {
                return state.plotStyle['padding']['top'] + state.plotStyle['size']['height'] + $(this).height() + 15;
            });

        }

        // y axis ticks and label
        if (this.yCol) {
            state.yScaler.domain(this.yLim || columnDomains[this.yCol]);

            // set up y axis ticks
            yAxisD3 = d3.svg.axis()
                        .scale(state.yScaler)
                        .orient("left")
                        .ticks(this.nYTicks)
                        .tickSize(defaults["tickSize"])
                        .tickFormat(function (d) {
                                if (d > 1e4) {
                                    var x = d3.format('e');
                                    return x(d);
                                } else {
                                    return d;
                                }
                        });

            var yAxis = cell.selectAll(".y-axis")
                          .data([this]);
            yAxis.enter().append("g")
                 .attr("class", "axis y-axis");
            yAxis.transition().duration(0).ease('quad-out')
                .attr("transform", function(p, i) {
                    return "translate(" + (state.plotStyle['padding']['left'] + 10) + ",0)";
                }).each(function(p) {
                    d3.select(this).call(yAxisD3);
                });
            yAxis.exit().remove();

            var yLabel = cell.selectAll(".y-label")
                            .data([this]);
            yLabel.enter().append("text")
                  .attr("class", "axis-label y-label");
            yLabel.exit().remove();
            yLabel.text(function(p,i) { return p.yLabel; });
            yLabel.attr("x", function(p) {
                return -((state.plotStyle['padding']['top']) + state.plotStyle['size']['height']/2. + $(this).width()/2.);// deliberately backwards cause rotated
            })
            .attr("y", function(p) {
                return -(state.plotStyle['padding']['left']);
            });

        }

        // plot background
        var rect = cell.selectAll("rect.frame").data([1]);
        rect.enter().append("rect");
        rect.exit().remove();
        rect.transition().duration(400).ease("quad-out")
            .attr("class", "frame")
            .attr("x", state.plotStyle['padding']['left'])
            .attr("y", state.plotStyle['padding']['top'])
            .attr("width", state.plotStyle['size']['width'])
            .attr("height", state.plotStyle['size']['height']);

        // TODO: fix clippath
        svg.select("g.state-g")
           .append("defs").append("clipPath")
                          .attr("id", "clip")
                          .append("rect")
                          .attr("x", state.plotStyle['padding']['left'])
                          .attr("y", state.plotStyle['padding']['top'])
                          .attr("width", state.plotStyle['size']['width'])
                          .attr("height", state.plotStyle['size']['height']);

    }

    // TODO: store cell internally? make an 'overlay' method?
    this.drawData = function(state, cell) {

        if (this.type == "scatter") {
            scatter(state, this, cell);
        } else if (this.type == "histogram") {
            histogram(state, this, cell);
        } else {
            alert("Invalid plot type.");
            return;
        }
    }

}

State = function(jsonState) {
    var grid = jsonState['grid'] || {};

    this.nRows = grid['nRows'] || 1;
    this.nCols = grid['nColumns'] || 1;

    var stateStyle = jsonState["stateStyle"] || {};
    var defaultPadding = defaults["stateStyle"]["padding"],
        statePadding = stateStyle["padding"] || {};

    this.padding = {
        "top" : statePadding["top"] || defaultPadding["top"],
        "left" : statePadding["left"] || defaultPadding["left"],
        "right" : statePadding["right"] || defaultPadding["right"],
        "bottom" : statePadding["bottom"] || defaultPadding["bottom"]
    };

    //// these must go before the plot definitions
    // state-global plot padding / size
    this.plotStyle = JSON.parse(JSON.stringify(defaults["plotStyle"]));
    var plotStyle = jsonState["plotStyle"] || {}; // for this particular state
    for (var key in this.plotStyle) {
        var tmp = plotStyle[key] || {};
        for (var key2 in tmp) {
            console.debug("changing state plot " + key + " " + key2 + " from " +
                          this.plotStyle[key][key2] + " to " + tmp[key2]);
            this.plotStyle[key][key2] = tmp[key2];
        }
    }

    // state-global marker styling
    stateMarkerStyle = defaults["markerStyle"];
    var markerStyle = jsonState["markerStyle"] || {}; // for this particular state
    for (var key in stateMarkerStyle) {
        var tmp = markerStyle[key] || {};
        for (var key2 in tmp) {
            console.debug("changing state marker " + key + " " + key2 + " from " +
                          stateMarkerStyle[key][key2] + " to " + tmp[key2]);
            stateMarkerStyle[key][key2] = tmp[key2];
        }
    }

    // state-global histogram styling
    stateHistogramStyle = defaults["histogramStyle"];
    var histogramStyle = jsonState["histogramStyle"] || {}; // for this particular state
    for (var key in stateHistogramStyle) {
        var tmp = histogramStyle[key] || {};
        for (var key2 in tmp) {
            console.debug("changing state histogram " + key + " " + key2 + " from " +
                          stateHistogramStyle[key][key2] + " to " + tmp[key2]);
            stateHistogramStyle[key][key2] = tmp[key2];
        }
    }

    // Compute the height / width of the svg element based on the plot size, plot spacing, and figure padding.
    var plotHeight = this.plotStyle['padding']['top'] + this.plotStyle['padding']['bottom'] +
                     this.plotStyle['size']['height'],
        plotWidth  = this.plotStyle['padding']['left'] + this.plotStyle['padding']['right'] +
                     this.plotStyle['size']['width'];

    this.height = this.padding['top'] + this.padding['bottom'] + this.nRows * plotHeight;
    this.width = this.padding['left'] + this.padding['right'] + this.nCols * plotWidth;
    console.log(this.height);

    this.plots = [];
    for (var ii=0; ii < jsonState['plots'].length; ii++) {
        var plot = new Plot(jsonState['plots'][ii]);
        plot.index = ii;
        this.plots.push(plot);
    }

    // Scalers for x / y axes from data space to pixel space relative to each plot cell
    // -- must go after height, width
    this.xScaler = d3.scale.linear()
                     .range([this.plotStyle['padding']['left'],
                             this.plotStyle['padding']['left'] + this.plotStyle['size']['width']]);
    this.yScaler = d3.scale.linear()
                     .range([this.plotStyle['size']['height'] + this.plotStyle['padding']['top'],
                             this.plotStyle['padding']['top']]);

    this.cScaler = d3.scale.linear();
    var colorScale = jsonState['colorScale'] || {};
    this.colorColumn = colorScale['columnName'] || undefined;
    if (this.colorColumn) {
        this.cScaler.domain(columnDomains[this.colorColumn]);
        this.cScaler.range(colorScale['map'] || defaults["colorScale"]["map"]);
    }

    // state caption
    this.caption = jsonState["caption"] || "";

    /*
        brushes
    */
    // keep track of what cell is being brushed
    // TODO: bug here with histogram...
    var brushCell = undefined,
        brushPlot = undefined;
    state = this;
    this.xyBrush = d3.svg.brush()
                    .x(state.xScaler)
                    .y(state.yScaler)
                    .on("brushstart", function(p) {
                        if (brushPlot === undefined) {
                            brushPlot = p;
                        }
                        if (brushCell !== this) {
                            if (brushPlot.type == "scatter") {
                                d3.select(brushCell).call(state.xyBrush.clear());
                            } else if (brushPlot.type == "histogram") {
                                d3.select(brushCell).call(state.xBrush.clear());
                            }
                            brushCell = this;
                            brushPlot = p;
                        } else {
                            //brushCell = this;
                        }

                        state.xScaler.domain(p.xLim || columnDomains[p.xCol]);
                        state.yScaler.domain(p.yLim || columnDomains[p.yCol]);
                    })
                    .on("brush", function(p) {
                        var e = state.xyBrush.extent();
                        var xRange = [e[0][0], e[1][0]],
                            yRange = [e[0][1], e[1][1]];

                        state.jsonSelection = {
                            "type" : "box",
                            "bounds" : [
                                {
                                    "range" : xRange,
                                    "columnName" : p.xCol
                                },
                                {
                                    "range" : yRange,
                                    "columnName" : p.yCol
                                }
                            ]
                        };

                        // grey out any histogram bars
                        svg.selectAll("rect.data")
                           .style("fill", "#cccccc")
                           .style("fill-opacity", 0.5);

                        svg.selectAll("circle.data")
                           .attr("r", function (d,ii) {
                                if (state.isSelected(d,ii)) {
                                    return state.plots[$(this).attr('plot-index')].style["selected"]["size"];
                                } else {
                                    return state.plots[$(this).attr('plot-index')].style["unselected"]["size"];
                                }
                            })
                            .style("fill", function (d,ii) {
                                if (state.isSelected(d,ii)) {
                                    return state.cScaler(d[state.colorColumn]) || state.plots[$(this).attr('plot-index')].style["selected"]["color"];
                                } else {
                                    return state.plots[$(this).attr('plot-index')].style["unselected"]["color"];
                                }
                            })
                            .attr("opacity", function (d,ii) {
                                if (state.isSelected(d,ii)) {
                                    return state.plots[$(this).attr('plot-index')].style["selected"]["opacity"];
                                } else {
                                    return state.plots[$(this).attr('plot-index')].style["unselected"]["opacity"];
                                }
                            })
                    })

    this.xBrush = d3.svg.brush()
                    .x(state.xScaler).y(state.yScaler)
                    .on("brushstart", function(p) {
                        if (brushPlot === undefined) {
                            brushPlot = p;
                        }
                        if (brushPlot.type == "scatter") {
                            d3.select(brushCell).call(state.xyBrush.clear());
                        } else if (brushPlot.type == "histogram") {
                            d3.select(brushCell).call(state.xBrush.clear());
                        }
                        brushPlot = p;
                        brushCell = this;

                        state.xScaler.domain(p.xLim || columnDomains[p.xCol]);
                    })
                    .on("brush", function(p) {
                        var _extent0 = state.xBrush.extent();
                        var extent1 = _extent0;
                        var extent0 = [_extent0[0][0], _extent0[1][0]];

                        var rawData = allPlotData.map(function(d) { return parseFloat(d[p.xCol]); });
                        var data = d3.layout.histogram().bins(p.bins)(rawData);

                        var min_d0, min_d1, e0, e1, dx;
                        for (var ii=0; ii < (data.length+1); ii++) {
                            if (ii == data.length) {
                                dx = data[ii-1].x + data[ii-1].dx
                            } else {
                                dx = data[ii].x;
                            }

                            var d0 = Math.abs(dx - extent0[0]),
                                d1 = Math.abs(dx - extent0[1]);

                            if ((!min_d0) || (d0 < min_d0)) {
                                min_d0 = d0;
                                e0 = dx;
                            }

                            if ((!min_d1) || (d1 < min_d1)) {
                                min_d1 = d1;
                                e1 = dx;
                            }
                        }

                        extent1[0][0] = e0;
                        extent1[1][0] = e1;
                        extent1[0][1] = 0;
                        extent1[1][1] = d3.max(data, function(d) { return d.y; });

                        d3.select(this).call(state.xBrush.extent(extent1));
                        d3.select(this).select(".extent")
                                       .attr("height", state.plotStyle['size']['height'])
                                       .attr("y", state.plotStyle['padding']['top']);

                        state.jsonSelection = {
                            "type" : "box",
                            "bounds" : [
                                {
                                    "range" : [e0,e1],
                                    "columnName" : p.xCol
                                }
                            ]
                        };

                        svg.selectAll("rect.data")
                           .style("fill", function(d,ii) {
                                if ((d.x >= e0) && ((d.x+d.dx) <= e1)) {
                                    return p.style["selected"]["color"];
                                } else {
                                    return p.style["unselected"]["color"];
                                }
                           })
                           .attr("fill-opacity", function(d,ii) {
                                if ((d.x >= e0) && ((d.x+d.dx) <= e1)) {
                                    return p.style["selected"]["opacity"];
                                } else {
                                    return p.style["unselected"]["opacity"];
                                }
                           })

                        svg.selectAll("circle.data")
                           .attr("r", function (d,ii) {
                                if (state.isSelected(d,ii)) {
                                    return state.plots[$(this).attr('plot-index')].style["selected"]["size"];
                                } else {
                                    return state.plots[$(this).attr('plot-index')].style["unselected"]["size"];
                                }
                            })
                            .style("fill", function (d,ii) {
                                if (state.isSelected(d,ii)) {
                                    return state.cScaler(d[state.colorColumn]) || state.plots[$(this).attr('plot-index')].style["selected"]["color"];
                                } else {
                                    return state.plots[$(this).attr('plot-index')].style["unselected"]["color"];
                                }
                            })
                            .attr("opacity", function (d,ii) {
                                if (state.isSelected(d,ii)) {
                                    return state.plots[$(this).attr('plot-index')].style["selected"]["opacity"];
                                } else {
                                    return state.plots[$(this).attr('plot-index')].style["unselected"]["opacity"];
                                }
                            })
                    })

    this.jsonSelection = jsonState['selection'];
    if (!this.jsonSelection) {
        console.debug("no selection provided");
        this.jsonSelection = {
            "type" : "none"
        }
    }
    this.isSelected = function(d,ii) {
        return selectionFunctionDispatch[this.jsonSelection['type']](this,d,ii);
    }
}

selectionFunctionDispatch = {};

selectionFunctionDispatch['none'] = function(state,d,ii) {
    return false;
}

selectionFunctionDispatch['all'] = function(state,d,ii) {
    return true;
}

selectionFunctionDispatch['box'] = function(state,d,ii) {
    var boundsList = state.jsonSelection ['bounds'];

    var bools = [];
    for (var jj=0; jj < boundsList.length; jj++) {
        var rng = boundsList[jj]['range'],
        colName = boundsList[jj]['columnName'];

        if ((d[colName] >= rng[0]) && (d[colName] <= rng[1])) {
            bools.push(true);
        } else {
            bools.push(false);
        }
    }
    return bools.every(Boolean);
}

selectionFunctionDispatch['booleanColumn'] = function(state,d,ii) {
    var boolColName = state.jsonSelection['columnName'];
    if (allPlotData[ii][boolColName] == 1) {
        return true;
    }
}

function initialize(jsonFilename, csvFilename) {
    /*
        Initialize the D3PO figure given a JSON specification.

        Parameters
        ----------
        jsonFilename : string
            The relative path to a D3PO JSON spec file.
    */
    d3.json(jsonFilename, function(error, _tmp) {
        if (error) {
            console.warn(error);
            alert('Unable to find file or error parsing "' + jsonFilename + '"');
        }
        jsonData = _tmp;

        // TODO: figure out type of file, use appropriate reader
        d3.csv(csvFilename, function(error, _tmp) {
            if (error) {
                console.warn(error);
                alert('Unable to read/parse file "' + csvFilename + '"');
            }
            allPlotData = _tmp;
            columnNames = d3.keys(allPlotData[0]);

            // draw the first state
            drawState(jsonData['states'][0]);

            var presets = d3.select("#controls .navigation").selectAll("li")
                            .data(jsonData['states']);

            presets.enter().append("li")
                   .on("click", function(e,i) {
                        drawState(jsonData['states'][i]);
                        $(".navigation li").removeClass("selected");
                        $(this).addClass("selected");
                   });

            presets.text(function(d, i){ return d['name']; });
            presets.exit().remove();

            $(".navigation li:first-of-type").addClass("selected");
        });
    });

    //
}

function domains(data, columns) {
    /*
        Get the domains (min, max) for each column in the plot data.
    */

    // Define an object to contain the domains (in data space) for each column
    var domainByDataColumn = {};

    columnNames.forEach(function(colName) {
        var domain = d3.extent(data, function(d) { return parseFloat(d[colName]); });

        // if parseFloat failed, probably string values in the column
        if (isNaN(domain[0]) || isNaN(domain[1])){
            var this_col = [];
            data.map(function(d) {
                this_col.push(d[colName]);
            });

            domainByDataColumn[colName] = this_col.unique();
        } else {
            var size = domain[1]-domain[0];
            domainByDataColumn[colName] = [domain[0] - size/25.,
                                           domain[1] + size/25.];
        }
    });

    return domainByDataColumn;
}

function drawState(jsonState) {
/*
    TODO
*/

    // Get the domains in data units for each column in the data file
    columnDomains = domains(allPlotData, columnNames);

    // define a state object which automatically sets defaults
    state = new State(jsonState);

    // Define top level svg tag
    svg = d3.select("#svg svg");
    svg.transition()
       .duration(400)
       .ease('quad-out')
       .attr("width", state.width)
       .attr("height", state.height)
       .each("end", function () {
            $("body").toggleClass("hack");
            setTimeout(function (){ $("body").toggleClass("hack"); });
        });

    // move the plot container group to account for figure padding
    svg.append("g")
       .attr("class", "state-g")
       .attr("transform", "translate(" + state.padding['left'] + "," +
                                         state.padding['top'] + ")");

    // Set up a cell group for each plot window, to then draw points and rectangle over
    var cells = d3.select("g.state-g").selectAll("g.cell").data(state.plots);
    cells.enter().append("g")
         .attr("class", "cell");
    cells.exit().remove();
    cells.transition().duration(400).ease('quad-out')
         .attr("transform", function(p) {
            var xy = p.translate(state);
            return "translate(" + xy[0] + "," + xy[1] + ")";
        });

    // Add axes to the plots
    cells.each(function(p,ii) {
        var cell = d3.select(this);
        p.drawAxes(state, cell);
        p.drawData(state, cell);

        if (p.type == "scatter") {
            state.xyBrush(cell);
        } else if (p.type == "histogram") {
            // TODO: y histogram?
            state.xBrush(cell);
        }
    })

    // Finally, update caption
    var caption = d3.select("#caption")
                    .style('opacity', 0)
                    .text(state.caption)
                    .transition()
                    .duration(400)
                    .style('opacity', 1);
}