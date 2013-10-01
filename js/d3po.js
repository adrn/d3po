// Globals
var jsonFilename, 
    jsonData,
    allPlotData,
    columnNames;

var svg;

function initialize() {
}

function loadJSON(jsonFilename) {
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
        d3.csv(jsonData["filename"], function(error, _tmp) {
            if (error) {
                console.warn(error);
                alert('Unable to read/parse file "' + jsonData["filename"] + '"');
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

function isSelected (selection, d) {
    // If selection is not empty
    if (!($.isEmptyObject(selection))) {
        var xr = selection['xRange'],
            yr = selection['yRange'];
        var e = [[xr[0],yr[0]],
                 [xr[1],yr[1]]];

        var xCol = selection['xAxis'],
            yCol = selection['yAxis'];

        if (e[0][0] > d[xCol] || d[xCol] > e[1][0] || e[0][1] > d[yCol] || d[yCol] > e[1][1]) {
            return false;
        } else {
            return true;
        };

    } else { // selection is empty, all points are selected
        return true;
    }
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
            selection['xAxis'] = p['xAxis'],
            selection['yAxis'] = p['yAxis'],
            selection['xRange'] = p['selection']['xRange'],
            selection['yRange'] = p['selection']['yRange'];
        }
    }
    
    // Set up a cell group for each plot window, to then draw points and rectangle over
    var cells = d3.select("svg").selectAll("g.cell").data(state["plots"]);
    cells.enter().append("g")
         .attr("class", "cell");
    cells.exit().remove();
    cells.transition().duration(500).ease('quad-out')
         .attr("transform", function(p) { return "translate(" + xPlotTranslator(p) + "," 
                                                              + yPlotTranslator(p) + ")"; })
         .each(plot);
    
    // Define the brush object
    var brush = d3.svg.brush()
                  .x(xScaler).y(yScaler)
                  .on("brushstart", brushstart)
                  .on("brush", brushmove)
                  .on("brushend", brushend);

    // have the cells call the brush
    cells.call(brush);
    
    // Add axes to the plots
    // TODO: figure out how to give user better control over ticks?
    var xAxisD3 = d3.svg.axis()
                .scale(xScaler)
                .orient("bottom")
                .ticks(5)
                .tickSize(dTickSize);
            
    var yAxisD3 = d3.svg.axis()
                .scale(yScaler)
                .orient("left")
                .ticks(5)
                .tickSize(dTickSize);
    
    // Draw / update axes
    var xAxis = d3.select("svg").selectAll(".x.axis")
                  .data(state["plots"]);
    xAxis.enter().append("g")
         .attr("class", "x axis");
    xAxis.exit().remove();
    xAxis.transition().duration(500).ease('quad-out')
         .attr("transform", function(p, i) { 
            return "translate(" + xPlotTranslator(p) + "," 
                                + (yPlotTranslator(p) + plotSize['height'] + 15) + ")"; 
        }).each(function(p) { 
            xScaler.domain(columnDomains[p['xAxis']]); 
            d3.select(this).call(xAxisD3); 
        });

    var yAxis = d3.select("svg").selectAll(".y.axis")
                  .data(state["plots"]);
    yAxis.enter().append("g")
         .attr("class", "y axis");
    yAxis.exit().remove();
    yAxis.transition().duration(500).ease('quad-out')
         .attr("transform", function(p, i) { 
            return "translate(" + (xPlotTranslator(p) + plotSpacing['horizontal']/2 + 10) + "," 
                                + yPlotTranslator(p) + ")"; 
        }).each(function(p) { 
            yScaler.domain(columnDomains[p['yAxis']]); 
            d3.select(this).call(yAxisD3); 
        });

    // Add axis labels
    var xLabel = svg.selectAll(".x-label")
                    .data(state["plots"]);
    xLabel.enter().append("text")
          .attr("class", "axis-label x-label");
    xLabel.exit().remove();
    xLabel.text(function(p, i) { return p['xAxis']; });
    xLabel.attr("x", function(p) { return xPlotTranslator(p) + plotSpacing['horizontal']/2 + plotSize['width']/2. - $(this).width()/2.; }) 
          .attr("y", function(p) { return yPlotTranslator(p) + plotSpacing['vertical']/2 + plotSize['height'] + 50; });
    
    var yLabel = svg.selectAll(".y-label")
                    .data(state["plots"]);
    yLabel.enter().append("text")
          .attr("class", "axis-label y-label");
    yLabel.exit().remove();
    yLabel.text(function(p,i) { return p['yAxis']; });
    yLabel.attr("x", function(p) { return -((plotSpacing['vertical']/2-yPlotTranslator(p)) + plotSize['height']/2. + $(this).width()/2.); }) // deliberately backwards cause rotated
          .attr("y", function(p) { return xPlotTranslator(p); });

    var brushCell;
    // Clear the previously-active brush, if any.
    function brushstart(p) {
        if (brushCell !== this) {
            d3.select(brushCell).call(brush.clear());
            xScaler.domain(columnDomains[p['xAxis']]);
            yScaler.domain(columnDomains[p['yAxis']]);
            brushCell = this;
        }
    }
    
    // Highlight the selected circles.
    function brushmove(p) {
        var e = brush.extent(),
            xCol = p['xAxis'],
            yCol = p['yAxis'];
        
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
    
    // TODO: wtf
    function plot(p) {
        var cell = d3.select(this);
        
        xScaler.domain(columnDomains[p['xAxis']]);
        yScaler.domain(columnDomains[p['yAxis']]);
        
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
        
        var rect = cell.selectAll("rect.frame").data([1]);
        rect.enter().append("rect");
        rect.exit().remove();
        rect.transition().duration(500).ease("quad-out")
            .attr("class", "frame")
            .attr("x", plotSpacing['horizontal'] / 2)
            .attr("y", plotSpacing['vertical'] / 2)
            .attr("width", plotSize['width'])
            .attr("height", plotSize['height']);
        
        var circ = cell.selectAll("circle").data(allPlotData)
        circ.enter().append("circle");
        circ.exit().remove();
        circ.transition().duration(500).ease("quad-out")
            .attr("cx", function(d) { return xScaler(d[p['xAxis']]); })
            .attr("cy", function(d) { return yScaler(d[p['yAxis']]); })
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
            });
    }

    // Finally, update caption
    var caption = d3.select("#caption")
                    .style('opacity', 0)
                    .text(state.caption || "")
                    .transition()
                    .duration(500)
                    .style('opacity', 1);
}