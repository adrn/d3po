// Globals
var jsonFilename,
    jsonData,
    allPlotData,
    columnNames,
    selectionDispatch = {};

var svg;

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

function isSelectedBox(selection, d) {
    // test for a selection based on a box
    var xr = selection['xRange'],
        yr = selection['yRange'];
    var e = [
        [xr[0], yr[0]],
        [xr[1], yr[1]]
    ];

    var xCol = selection['xAxis']['label'],
        yCol = selection['yAxis']['label'];

    if (e[0][0] > d[xCol] || d[xCol] > e[1][0] || e[0][1] > d[yCol] || d[yCol] > e[1][1]) {
        return false;
    } else {
        return true;
    }
}

selectionDispatch['box'] = isSelectedBox;

function isSelectedAttribute(selection, d) {
    // test for selection based on the value of a binary-valued column in the data
    var att = selection['attribute'];
    return d[att] > 0;
}
selectionDispatch['attribute'] = isSelectedAttribute;


function isSelected(selection, d) {
    if ($.isEmptyObject(selection)) {
        return true;
    } // empty selection defaults to select all

    // determine what kind of selection to perform
    var selectionType = selection['type'] || 'box';
    return selectionDispatch[selectionType](selection, d);
}

function drawState(state) {
/*
    TODO
*/

    var nRows = state['grid']['nRows'],
        nCols = state['grid']['nColumns'],
        figSpec = state['figure'] || dFigureSpec;

    var figPadding = figSpec["figurePadding"],
        plotSpacing = figSpec["plotSpacing"],
        plotSize = figSpec["plotSize"];

    // Compute the height / width of the svg element based on the plot size,
    // plot spacing, and figure padding.
    var svg_height = nRows*(plotSize['height'] + plotSpacing['vertical']) +
                     figPadding['top'] + figPadding['bottom'],
        svg_width = nCols*(plotSize['width'] + plotSpacing['horizontal']) + plotSpacing['horizontal']
                     figPadding['left'] + figPadding['right'];

    // Define top level svg tag
    svg = d3.select("#svg svg");
    svg.transition()
       .duration(500)
       .ease('quad-out')
       .attr("width", svg_width)
       .attr("height", svg_height)
       .each("end", function () {
            $("body").toggleClass("hack");
            setTimeout(function (){ $("body").toggleClass("hack"); });
        });

    svg.append("g")
       .attr("transform", "translate(" + figPadding["left"] + "," + figPadding["top"] + ")");

    // Scalers for x / y axes from data space to pixel space
    // TODO: build in log support here - if statement? need to keep track of what
    //       axes are log, which are linear, etc.
    var xScaler = d3.scale.linear()
                    .range([plotSpacing['horizontal']/2,
                            plotSize['width'] + plotSpacing['horizontal']/2]),
        yScaler = d3.scale.linear()
                    .range([plotSize['height'] + plotSpacing['vertical']/2,
                            plotSpacing['vertical']/2]),
        cScaler = d3.scale.linear();

    // Functions to compute the amount to translate the individual plots by
    xPlotTranslator = function (plot) {
        index = plot["gridPosition"][1];
        return index*(plotSize['width'] + plotSpacing['horizontal']) + plotSpacing['horizontal']/2.;
    }
    yPlotTranslator = function (plot) {
        index = plot["gridPosition"][0];
        return (nRows - index - 1)*(plotSize['height'] + plotSpacing['vertical']);
    }

    // Get the domains in data units for each column in the data file
    var columnDomains = domains(allPlotData, columnNames);

    // if this plot has a color-by axis, set the domain and range of the color scaler
    if (typeof state['colorAxis'] != 'undefined') {
        cScaler.domain(columnDomains[state['colorAxis']]);
        cScaler.range(state['colorMap'] || dColorMap);
    }

    // set up the selection object if some points are highlighted
    var selection = {};
    for (var ii=0; ii < state['plots'].length; ii++) {
        var p = state['plots'][ii];
        if (typeof p['selection'] != 'undefined') {
            selection['xAxis'] = p['xAxis']['label'];
            selection['yAxis'] = p['yAxis']['label'];
            for (var item in p['selection'])
                selection[item] = p['selection'][item];
        }
    }

    // Set up a cell group for each plot window, to then draw points and rectangle over
    var cells = d3.select("svg").selectAll("g.cell").data(state["plots"]);
    cells.enter().append("g")
         .attr("class", "cell");
    cells.exit().remove();
    cells.transition().duration(500).ease('quad-out')
         .attr("transform", function(p) { return "translate(" + xPlotTranslator(p) + ","
                                                              + yPlotTranslator(p) + ")"; });
         //.each(plot);

    // Add axes to the plots
    cells.each(function(p,ii) {
        var cell = d3.select(this);

        if ('xAxis' in p) {
            xScaler.domain(p['xAxis']['range'] || columnDomains[p['xAxis']['label']]);

            // set up x axis ticks
            xAxisD3 = d3.svg.axis()
                            .scale(xScaler)
                            .orient("bottom")
                            .ticks(5)
                            .tickSize(dTickSize);

            var xAxis = cell.selectAll(".x.axis")
                          .data([p]);
            xAxis.enter().append("g")
                 .attr("class", "x axis");
            xAxis.exit().remove();
            xAxis.transition().duration(500).ease('quad-out')
                 .attr("transform", function(p, i) {
                    return "translate(0," + (plotSize['height'] + 15) + ")";
                }).each(function(p) {
                    d3.select(this).call(xAxisD3);
                });

            // Add axis labels
            var xLabel = cell.selectAll(".x-label")
                            .data([p]);
            xLabel.enter().append("text")
                  .attr("class", "axis-label x-label");
            xLabel.exit().remove();
            xLabel.text(function(p, i) { return p['xAxis']['label']; });
            xLabel.attr("x", function(p) { return plotSpacing['horizontal']/2 + plotSize['width']/2. - $(this).width()/2.; })
                  .attr("y", function(p) { return plotSpacing['vertical']/2 + plotSize['height'] + 50; });

        }

        if ('yAxis' in p) {
            yScaler.domain(p['yAxis']['range'] || columnDomains[p['yAxis']['label']]);

            // set up y axis ticks
            yAxisD3 = d3.svg.axis()
                        .scale(yScaler)
                        .orient("left")
                        .ticks(5)
                        .tickSize(dTickSize);

            var yAxis = cell.selectAll(".y.axis")
                          .data([p]);
            yAxis.enter().append("g")
                 .attr("class", "y axis");
            yAxis.exit().remove();
            yAxis.transition().duration(500).ease('quad-out')
                 .attr("transform", function(p, i) {
                    return "translate(" + (plotSpacing['horizontal']/2 + 10) + ",0)";
                }).each(function(p) {
                    d3.select(this).call(yAxisD3);
                });

            var yLabel = cell.selectAll(".y-label")
                            .data([p]);
            yLabel.enter().append("text")
                  .attr("class", "axis-label y-label");
            yLabel.exit().remove();
            yLabel.text(function(p,i) { return p['yAxis']['label']; });
            yLabel.attr("x", function(p) { return -((plotSpacing['vertical']/2) + plotSize['height']/2. + $(this).width()/2.); }) // deliberately backwards cause rotated
                  .attr("y", function(p) { return 0.; });
        }

        plot(p,cell);
    })

    // Define the brush object
    var brush = d3.svg.brush()
                  .x(xScaler).y(yScaler)
                  .on("brushstart", brushstart)
                  .on("brush", brushmove)
                  .on("brushend", brushend);

    // have the cells call the brush
    cells.call(brush);

    var brushCell;
    // Clear the previously-active brush, if any.
    function brushstart(p) {
        if (brushCell !== this) {
            d3.select(brushCell).call(brush.clear());
            xScaler.domain(p['xAxis']['range'] || columnDomains[p['xAxis']['label']]);
            yScaler.domain(p['yAxis']['range'] || columnDomains[p['yAxis']['label']]);
            brushCell = this;
        }
    }

    // Highlight the selected circles.
    function brushmove(p) {
        var e = brush.extent(),
            xCol = p['xAxis']['label'],
            yCol = p['yAxis']['label'];

        svg.selectAll("circle")
           .style("fill", function (d) { return cScaler(d[state['colorAxis']]) || dMarkerFill; })
           .attr("opacity", function (d) { return dMarkerOpacity; })
           .classed("hidden", function(d) {
              return e[0][0] > d[xCol] || d[xCol] > e[1][0]
                      || e[0][1] > d[yCol] || d[yCol] > e[1][1];
        });
    }

    // If the brush is empty, select all circles.
    function brushend() {
        if (brush.empty()) svg.selectAll("circle").classed("hidden", false);
    }

    function scatter(cell, p) {

        var marker = p['marker'];

        if (typeof marker != 'undefined') {
            opacity = marker['opacity'] || dMarkerOpacity;
            size = marker['size'] || dMarkerSize;
            fill = marker['fill'] || dMarkerFill;
        } else {
            opacity = dMarkerOpacity;
            size = dMarkerSize;
            fill = dMarkerFill;
        }

        var circ = cell.selectAll("circle").data(allPlotData)
        circ.enter().append("circle");
        circ.exit().remove();
        circ.transition().duration(500).ease("quad-out")
            .attr("cx", function(d) { return xScaler(d[p['xAxis']['label']]); })
            .attr("cy", function(d) { return yScaler(d[p['yAxis']['label']]); })
            .attr("r", size)
            .style("fill", function (d) {
                if (isSelected(selection, d)) {
                    return cScaler(d[state['colorAxis']]) || fill;
                } else {
                    return "#cccccc";
                }
            })
            .attr("opacity", function (d) {
                if (isSelected(selection, d)) {
                    return opacity;
                } else {
                    return 0.5;
                }
            })
            .attr("clip-path", "url(#clip)");
    }

    function xhistogram(cell, p) {
        var nbins = 12;

        console.log(xScaler.ticks(nbins).length);

        var rawData = allPlotData.map(function(d) { return parseFloat(d[p['xAxis']['label']]); });
        var data = d3.layout.histogram()
                            .bins(xScaler.ticks(nbins))
                            (rawData);

        var barWidth = xScaler(2*data[0].dx)-xScaler(data[0].dx);
        console.log(barWidth);
        var height = plotSize['height'];

        var barHeightScaler = d3.scale.linear()
                  .domain([0, d3.max(data, function(d) { return d.y; })])
                  .range([height, 0]);

        var bar = cell.selectAll(".bar").data(data)
                        .enter().append("g")
                        .attr("class", "bar");

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
            });
    }

    function plot(p,cell) {

        var rect = cell.selectAll("rect.frame").data([1]);
        rect.enter().append("rect");
        rect.exit().remove();
        rect.transition().duration(500).ease("quad-out")
            .attr("class", "frame")
            .attr("x", plotSpacing['horizontal'] / 2)
            .attr("y", plotSpacing['vertical'] / 2)
            .attr("width", plotSize['width'])
            .attr("height", plotSize['height']);

        svg.append("defs").append("clipPath")
                          .attr("id", "clip")
                          .append("rect")
                          .attr("x", plotSpacing['horizontal'] / 2)
                          .attr("y", plotSpacing['vertical'] / 2)
                          .attr("width", plotSize['width'])
                          .attr("height", plotSize['height']);

        if (('xAxis' in p) && ('yAxis' in p)) {
            scatter(cell, p);
        } else if ('xAxis' in p) {
            xhistogram(cell, p);
        } else if ('yAxis' in p) {
            yhistogram(cell, p);
        }
    }

    // Finally, update caption
    var caption = d3.select("#caption")
                    .style('opacity', 0)
                    .text(state.caption || "")
                    .transition()
                    .duration(500)
                    .style('opacity', 1);
}