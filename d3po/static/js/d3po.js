// Globals
var jsonFilename,
    jsonData,
    allPlotData,
    columnNames,
    columnDomains,
    selectionDispatch = {};

var svg;

/*
    Define some default style parameters
*/

// all size / padding parameters are specified in pixels
var defaultFigure = { "padding" : { "top" : 0,
                                     "left" : 0,
                                     "right" : 0,
                                     "bottom" : 50},
                      "plotSpec" : { "spacing" : { "vertical" : 50,
                                                   "horizontal" : 100},
                                     "size" : {"width" : 200,
                                               "height" : 200}
                                   }
                    }

var defaultSelectedMarkerSpec = { "opacity" : 0.75,
                                  "color" : "#333333",
                                  "size" : 3};
var defaultDeselectedMarkerSpec = { "opacity" : 0.5,
                                    "color" : "#cccccc",
                                    "size" : 2};

// Default plot parameters
var defaultTickSize = 16,
    defaultColorMap = ["red", "blue"];

/*
    Generalized plotting
*/
function scatter(state, plot, cell) {
    var circ = cell.selectAll("circle").data(allPlotData)
    circ.enter().append("circle")
        .attr("class","data");
    circ.exit().remove();
    circ.transition().duration(500).ease("quad-out")
        .attr("cx", function(d) { return state.xScaler(d[plot.xCol]); })
        .attr("cy", function(d) { return state.yScaler(d[plot.yCol]); })
        .attr("r", function (d,ii) {
            if (state.isSelected(d,ii)) {
                return plot.markerSpec["size"];
            } else {
                return plot.deselectedMarkerSpec["size"];
            }
        })
        .style("fill", function (d,ii) {
            if (state.isSelected(d,ii)) {
                // TODO: color axis
                return state.cScaler(d[state['colorAxis']]) || plot.markerSpec["fill"];
            } else {
                return plot.deselectedMarkerSpec["fill"];
            }
        })
        .attr("opacity", function (d,ii) {
            if (state.isSelected(d,ii)) {
                return plot.markerSpec["opacity"];
            } else {
                return plot.deselectedMarkerSpec["opacity"];
            }
        })
        .attr("clip-path", "url(#clip)");
}

function histogram(state, plot, cell) {
    var nbins = p['bins'] || 10;

    var rawData = allPlotData.map(function(d) { return parseFloat(d[p['xAxis']['label']]); });
    var data = d3.layout.histogram()
                        .bins(nbins)
                        (rawData);

    var barWidth = xScaler(2*data[0].dx)-xScaler(data[0].dx);
    var height = plotSize['height'];

    var barHeightScaler = d3.scale.linear()
              .domain([0, d3.max(data, function(d) { return d.y; })])
              .range([height, 0]);

    // remove any data points
    cell.selectAll("circle").data([]).exit().remove();
    var bar = cell.selectAll(".bar").data(data)
                    .enter().append("g")
                    .attr("class", "bar data");

    bar.append("rect")
        .attr("x", function(d) {
            return xScaler(d.x);
        })
        .attr("y", function(d) {
            return barHeightScaler(d.y) + plotSpacing['vertical']/2 + figPadding['top'];
        })
        .attr("width", barWidth)
        .attr("height", function(d) {
            return height - barHeightScaler(d.y);
        })
        .style("fill", function (d) { return dMarkerFill; });
}

/*
    Classes for parsing JSON and defaults
*/

Figure = function(jsonFigure) {
    var defaultPadding = defaultFigure["padding"],
        defaultPlotSpec = defaultFigure["plotSpec"],
        figure = jsonFigure || {};

    var padding = figure["padding"] || {};
    this.padding = {"top" : padding["top"] || defaultPadding["top"],
                    "left" : padding["left"] || defaultPadding["left"],
                    "right" : padding["right"] || defaultPadding["right"],
                    "bottom" : padding["bottom"] || defaultPadding["bottom"]}

    var plotSpec = figure["plotSpec"] || {};
    var plotSpacing = plotSpec["spacing"] || {},
        plotSize = plotSpec["size"] || {};
    this.plotSpec = {"spacing" : { "vertical" : plotSpacing["vertical"] || defaultPlotSpec["spacing"]["vertical"],
                                   "horizontal" : plotSpacing["horizontal"] || defaultPlotSpec["spacing"]["horizontal"]},
                     "size" : { "width" : plotSize["width"] || defaultPlotSpec["size"]["width"],
                                "height" : plotSize["height"] || defaultPlotSpec["size"]["height"]}
                    }
    }

Plot = function(jsonPlot) {

    this.gridPosition = jsonPlot["gridPosition"] || [0,0];

    if ("type" in jsonPlot) {
        this.type = jsonPlot["type"];
    } else {
        if (("xAxis" in jsonPlot) && ("yAxis" in jsonPlot)){
            this.type = "scatter";
            this.xCol = jsonPlot["xAxis"]["columnName"];
            this.yCol = jsonPlot["yAxis"]["columnName"];
        } else if (("xAxis" in jsonPlot) && !("yAxis" in jsonPlot)){
            this.type = "histogram";
            this.xCol = jsonPlot["xAxis"]["columnName"];
            this.yCol = undefined;
        } else if (!("xAxis" in jsonPlot) && ("yAxis" in jsonPlot)){
            this.type = "histogram";
            this.xCol = undefined;
            this.yCol = jsonPlot["yAxis"]["columnName"];
        } else {
            alert("Invalid axis specification.");
            return false;
        }
    }

    var xAxis = jsonPlot["xAxis"] || {},
        yAxis = jsonPlot["yAxis"] || {};

    this.xLabel = xAxis["label"] || (this.xCol || "");
    this.yLabel = yAxis["label"] || (this.yCol || "");
    this.xLim = xAxis["range"];
    this.yLim = yAxis["range"];

    this.markerSpec = jsonPlot["marker"] || {};
    this.deselectedMarkerSpec = jsonPlot["deselectedMarker"] || {};

    for (var key in defaultSelectedMarkerSpec) {
        this.markerSpec[key] = this.markerSpec[key] || defaultSelectedMarkerSpec[key];
    }

    for (var key in defaultDeselectedMarkerSpec) {
        this.deselectedMarkerSpec[key] = this.deselectedMarkerSpec[key] || defaultDeselectedMarkerSpec[key];
    }

    this.translate = function(state) {
        // compute the amount to translate the individual plots by
        // TODO: why are indices flipped??
        var xIndex = this.gridPosition[1],
            xTrans = xIndex * (state.figure.plotSpec['size']['width'] +
                               state.figure.plotSpec['spacing']['horizontal']) +
                               state.figure.plotSpec['spacing']['horizontal']/2.;

        var yIndex = this.gridPosition[0],
            yTrans = (state.nRows - yIndex - 1) * (state.figure.plotSpec['size']['height'] +
                                                   state.figure.plotSpec['spacing']['vertical']);

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
                            .ticks(5)
                            .tickSize(defaultTickSize);

            var xAxis = cell.selectAll(".x-axis")
                          .data([this]);
            xAxis.enter().append("g")
                 .attr("class", "axis x-axis");
            xAxis.exit().remove();
            xAxis.transition().duration(500).ease('quad-out')
                 .attr("transform", function(p) {
                    return "translate(0," + (state.figure.plotSpec['size']['height'] + 15) + ")";
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
            xLabel.attr("x", function(p) { return state.figure.plotSpec['spacing']['horizontal']/2 + state.figure.plotSpec['size']['width']/2. - $(this).width()/2.; })
                  .attr("y", function(p) { return state.figure.plotSpec['spacing']['vertical']/2 + state.figure.plotSpec['size']['height'] + 50; });

        }

        // y axis ticks and label
        if (this.yCol) {
            state.yScaler.domain(this.yLim || columnDomains[this.yCol]);

            // set up y axis ticks
            yAxisD3 = d3.svg.axis()
                        .scale(state.yScaler)
                        .orient("left")
                        .ticks(5)
                        .tickSize(defaultTickSize);

            var yAxis = cell.selectAll(".y-axis")
                          .data([this]);
            yAxis.enter().append("g")
                 .attr("class", "axis y-axis");
            yAxis.transition().duration(500).ease('quad-out')
                .attr("transform", function(p, i) {
                    return "translate(" + (state.figure.plotSpec['spacing']['horizontal']/2 + 10) + ",0)";
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
            yLabel.attr("x", function(p) { return -((state.figure.plotSpec['spacing']['vertical']/2) + state.figure.plotSpec['size']['height']/2. + $(this).width()/2.); }) // deliberately backwards cause rotated
                  .attr("y", function(p) { return 0.; });

        }

        // plot background
        var rect = cell.selectAll("rect.frame").data([1]);
        rect.enter().append("rect");
        rect.exit().remove();
        rect.transition().duration(500).ease("quad-out")
            .attr("class", "frame")
            .attr("x", state.figure.plotSpec['spacing']['horizontal'] / 2)
            .attr("y", state.figure.plotSpec['spacing']['vertical'] / 2)
            .attr("width", state.figure.plotSpec['size']['width'])
            .attr("height", state.figure.plotSpec['size']['height']);

        svg.append("defs").append("clipPath")
                          .attr("id", "clip")
                          .append("rect")
                          .attr("x", state.figure.plotSpec['spacing']['horizontal'] / 2)
                          .attr("y", state.figure.plotSpec['spacing']['vertical'] / 2)
                          .attr("width", state.figure.plotSpec['size']['width'])
                          .attr("height", state.figure.plotSpec['size']['height']);

    }

    this.drawData = function(state, cell) {

        if (this.type == "scatter") {
            scatter(state, this, cell);
        } else if (this.type == "histogram") {
            // TODO: histogram
            //console.log("Not implemented");
        } else {
            alert("Invalid plot type.");
            return false;
        }
    }

}

State = function(jsonState) {
    var grid = jsonState['grid'] || {};

    this.nRows = grid['nRows'] || 1;
    this.nCols = grid['nColumns'] || 1;
    this.figure = new Figure(jsonState['figure']);

    // Compute the height / width of the svg element based on the plot size, plot spacing, and figure padding.
    this.height = this.figure['padding']['top'] + this.figure['padding']['bottom'] +
                  this.nRows * (this.figure.plotSpec['size']['height'] + this.figure.plotSpec['spacing']['vertical']);
    this.width = this.figure['padding']['left'] + this.figure['padding']['right'] +
                  this.nCols * (this.figure.plotSpec['size']['width'] + this.figure.plotSpec['spacing']['horizontal']) +
                  this.figure.plotSpec['spacing']['horizontal'];

    this.plots = [];
    for (var ii=0; ii < jsonState['plots'].length; ii++) {
        var plot = new Plot(jsonState['plots'][ii]);
        this.plots.push(plot);
    }

    // Scalers for x / y axes from data space to pixel space relative to each plot cell
    this.xScaler = d3.scale.linear()
                     .range([this.figure.plotSpec['spacing']['horizontal']/2,
                             this.figure.plotSpec['size']['width'] + this.figure.plotSpec['spacing']['horizontal']/2]);
    this.yScaler = d3.scale.linear()
                     .range([this.figure.plotSpec['size']['height'] + this.figure.plotSpec['spacing']['vertical']/2,
                             this.figure.plotSpec['spacing']['vertical']/2]);
    this.cScaler = d3.scale.linear();

    if ('colorAxis' in jsonState) {
        this.colorAxis = jsonState['colorAxis'];
        this.cScaler.domain(columnDomains[this.colorAxis]);
        this.cScaler.range(jsonState['colorMap'] || defaultColorMap);
    }

    /*
        brushes
    */

    // keep track of what cell is being brushed
    this.brushCell = undefined;
    state = this;
    this.xyBrush = d3.svg.brush()
                    .x(state.xScaler).y(state.yScaler)
                    .on("brushstart", function(p) {
                        if (state.brushCell !== this) {
                            d3.select(state.brushCell).call(state.xyBrush.clear());
                            state.brushCell = this;
                        } else {
                            state.brushCell = this;
                        }

                        state.xScaler.domain(p.xLim || columnDomains[p.xCol]);
                        state.yScaler.domain(p.yLim || columnDomains[p.yCol]);
                    })
                    .on("brush", function(p) {
                        var e = state.xyBrush.extent();
                        var xRange = [e[0][0], e[1][0]],
                            yRange = [e[0][1], e[1][1]];

                        state.selection = {'range' : {}}
                        state.selection['range'][p.xCol] = xRange;
                        state.selection['range'][p.yCol] = yRange;

                        svg.selectAll("circle")
                           .attr("r", function (d,ii) {
                                if (state.isSelected(d,ii)) {
                                    return p.markerSpec["size"];
                                } else {
                                    return p.deselectedMarkerSpec["size"];
                                }
                            })
                            .style("fill", function (d,ii) {
                                if (state.isSelected(d,ii)) {
                                    // TODO: color axis
                                    return state.cScaler(d[state.colorAxis]) || p.markerSpec["fill"];
                                } else {
                                    return p.deselectedMarkerSpec["fill"];
                                }
                            })
                            .attr("opacity", function (d,ii) {
                                if (state.isSelected(d,ii)) {
                                    return p.markerSpec["opacity"];
                                } else {
                                    return p.deselectedMarkerSpec["opacity"];
                                }
                            })
                    })
                    .on("brushend", function(p) {
                        if (state.xyBrush.empty()) {
                            svg.selectAll("circle").classed("hidden", false);
                        }
                    });


    this.selection = jsonState['selection'];
    this.isSelected = function(d, ii) {
        if (!this.selection) {
            return true;
        }

        range_bool = true;
        if ('range' in this.selection) {
            var bools = [];
            for (var colName in this.selection['range']) {
                var r = this.selection['range'][colName];
                if ((d[colName] >= r[0]) && (d[colName] <= r[1])) {
                    bools.push(true);
                } else {
                    bools.push(false);
                }
            }
            range_bool = bools.every(Boolean);
        }

        if ('booleanColumn' in this.selection) {
            var boolColName = this.selection['booleanColumn'];
            if (allPlotData[ii][boolColName] == 1) {
                return true && range_bool;
            }
        }

        return range_bool;
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
            alert('Unable to find file "' + jsonFilename + '"');
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

    // define a state object which automatically sets defaults
    state = new State(jsonState);
    console.log(state.selection);

    // Define top level svg tag
    svg = d3.select("#svg svg");
    svg.transition()
       .duration(500)
       .ease('quad-out')
       .attr("width", state.width)
       .attr("height", state.height)
       .each("end", function () {
            $("body").toggleClass("hack");
            setTimeout(function (){ $("body").toggleClass("hack"); });
        });

    // move the plot container group to account for figure padding
    svg.append("g")
       .attr("transform", "translate(" + state.figure['padding']['left'] + "," +
                                         state.figure['padding']['top'] + ")");

    // Get the domains in data units for each column in the data file
    columnDomains = domains(allPlotData, columnNames);

    // Set up a cell group for each plot window, to then draw points and rectangle over
    var cells = d3.select("svg").selectAll("g.cell").data(state.plots);
    cells.enter().append("g")
         .attr("class", "cell");
    cells.exit().remove();
    cells.transition().duration(500).ease('quad-out')
         .attr("transform", function(p) { return "translate(" + p.translate(state)[0] + ","
                                                              + p.translate(state)[1] + ")"; });

    // Add axes to the plots
    cells.each(function(p,ii) {
        var cell = d3.select(this);
        p.drawAxes(state, cell);
        p.drawData(state, cell);
        state.xyBrush(cell);
    })

    // Finally, update caption
    var caption = d3.select("#caption")
                    .style('opacity', 0)
                    .text(state.caption || "")
                    .transition()
                    .duration(500)
                    .style('opacity', 1);
}