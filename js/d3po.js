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
        svg_width = nCols*(plotSize['width'] + plotSpacing['horizontal']) + 
                     figPadding['left'] + figPadding['right'];

    // Define top level svg tag
    svg = d3.select("#svg svg");
    svg.transition()
       .duration(500)
       .ease('quad-out')
       .attr("width", svg_width)
       .attr("height", svg_height)
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
        return index*(plotSize['width'] + plotSpacing['horizontal']); 
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
    
    // Set up a cell group for each plot window, to then draw points and rectangle over
    var cells = d3.select("svg").selectAll("g.cell").data(state["plots"]);
    cells.enter().append("g")
         .attr("class", "cell");
    cells.exit().remove();
    cells.transition()
         .duration(500)
         .ease('quad-out')
         .attr("transform", function(p) { return "translate(" + xPlotTranslator(p) + "," 
                                                              + yPlotTranslator(p) + ")"; })
         .each(plot);
    
    // Define the brush object
    var brush = d3.svg.brush()
                  .x(xScaler)
                  .y(yScaler)
                  .on("brushstart", brushstart)
                  .on("brush", brushmove)
                  .on("brushend", brushend);
    
    cells.call(brush);
    
    // Add axes to the plots
    var xAxis = d3.svg.axis()
                .scale(xScaler)
                .orient("bottom")
                .ticks(5);
            
    var yAxis = d3.svg.axis()
                .scale(yScaler)
                .orient("left")
                .ticks(5);
    
    xAxis.tickSize(dTickSize);
    yAxis.tickSize(dTickSize);
    
    // TODO: fix the axes here. should really pass in full data info, so i know about grid position, etc...
    svg.selectAll(".x.axis")
      .data(state["plots"])
      .enter().append("g")
      .attr("class", "x axis")
      .attr("transform", function(p, i) { return "translate(" + xPlotTranslator(p) + "," 
                                                + (yPlotTranslator(p) + plotSize['height'] + 15) + ")"; })
      .each(function(p) { xScaler.domain(columnDomains[p['xAxis']]); 
                          d3.select(this).call(xAxis); 
            });
        
    svg.selectAll(".y.axis")
      .data(state["plots"])
      .enter().append("g")
      .attr("class", "y axis")
      .attr("transform", function(p, i) { return "translate(" + (xPlotTranslator(p) + plotSpacing['horizontal']/2 + 10) + "," 
                                                    + yPlotTranslator(p) + ")"; })
      .each(function(p) { yScaler.domain(columnDomains[p['yAxis']]); 
                          d3.select(this).call(yAxis); 
            });
    
    // add axis labels
    svg.selectAll(".x-label")
      .data(state["plots"])
      .enter().append("text")
      .text(function(p,i) { return p['xAxis']; })
      .attr("class", "axis-label")
      .attr("x", function(p, i) { return xPlotTranslator(p) + plotSpacing['horizontal']/2 + plotSize['width']/2. - $(this).width()/2.; })
      .attr("y", function(p, i) { return yPlotTranslator(p) + plotSpacing['vertical']/2 + plotSize['height'] + 50; });
    
    svg.selectAll(".y-label")
      .data(state["plots"])
      .enter().append("text")
      .text(function(p,i) { return p['yAxis']; })
      .attr("class", "axis-label") 
      .attr("x", function(p, i) { return xPlotTranslator(p); })
      .attr("y", function(p, i) { return (plotSpacing['vertical']/2-yPlotTranslator(p)) + plotSize['height']/2. + $(this).width()/2.; })
      .attr("transform", function (d,i) { return "rotate(-90," + $(this).attr('x') + "," + $(this).attr('y') + ")"; });
    
    // If state has a 'selection':
    state['plots'].forEach(function(p,i) {
        if (typeof p['selection'] != 'undefined') {
            var e = [[p['selection']['xRange'][0],p['selection']['yRange'][0]],
                          [p['selection']['xRange'][1],p['selection']['yRange'][1]]];
            //brush.extent(extent);
            //brushmove(p);
            var xCol = p.xColumnName || p.xAxis,
                yCol = p.yColumnName || p.yAxis;
            svg.selectAll("circle").classed("hidden", function(d) {
                  return e[0][0] > d[xCol] || d[xCol] > e[1][0]
                          || e[0][1] > d[yCol] || d[yCol] > e[1][1];
            });
        }
    });

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
        
        svg.selectAll("circle").classed("hidden", function(d) {
              return e[0][0] > d[xCol] || d[xCol] > e[1][0]
                      || e[0][1] > d[yCol] || d[yCol] > e[1][1];
        });
    }
    
    // If the brush is empty, select all circles.
    function brushend() {
        if (brush.empty()) svg.selectAll(".hidden").classed("hidden", false);
    }
    
    // TODO: wtf
    function plot(p) {
        var cell = d3.select(this);
        
        xScaler.domain(columnDomains[p['xAxis']]);
        yScaler.domain(columnDomains[p['yAxis']]);
        
        var marker = p['marker'];
        
        if (typeof marker != 'undefined') {
            opacity = marker['opacity'];
            size = marker['size'];
        } else {
            opacity = 0.75;
            size = 3;
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
            .attr("opacity", opacity)
            .style("fill", function(d) { return cScaler(d[state['colorAxis']]) || "#333333"; }); 
    }

    // Finally, update caption
    var caption = d3.select("#caption")
                    .style('opacity', 0)
                    .text(state.caption || "")
                    .transition()
                    .duration(1000)
                    .style('opacity', 1);
}