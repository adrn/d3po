// Globals
var jsonFilename, 
    jsonData,
    allPlotData;

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
                            plotSize['width'] + plotSpacing['horizontal']/2]);

    var yScaler = d3.scale.linear()
                    .range([plotSize['height'] + plotSpacing['vertical']/2,
                            plotSpacing['vertical']/2]);


    var brushCell,
        color_scale = d3.scale.linear();

    // Define an object to contain the domains (in data space) for each column
    var domainByDataColumn = {},
        dataColumns = d3.keys(allPlotData[0]);                
        
    dataColumns.forEach(function(colName) {
        var domain = d3.extent(allPlotData, function(d) { return parseFloat(d[colName]); });
        
        // if parseFloat failed, probably string values in the column
        if (isNaN(domain[0]) || isNaN(domain[1])){
            var this_col = [];
            allPlotData.map(function(d) {
                this_col.push(d[colName]);
            });
            
            domainByDataColumn[colName] = this_col.unique();
        } else {
            var size = domain[1]-domain[0];
            domainByDataColumn[colName] = [domain[0] - size/25., 
                                           domain[1] + size/25.];
        }
    });
    
    if (typeof state['colorAxis'] != 'undefined') {
        color_scale.domain(domainByDataColumn[state['colorAxis']]);
        color_scale.range(state['colorMap'] || dColorMap);
    }
    
    // TODO: needs better names, brain dumping...
    var d = [];
    for (var ii=0; ii < state['plots'].length; ii++) {
        var this_plot = state['plots'][ii];
        
        d.push({ xColumnName : this_plot['xAxis'],
                 yColumnName : this_plot['yAxis'],
                 i : this_plot['gridPosition'][0],
                 j : this_plot['gridPosition'][1],
                 plotIndex : ii
               });
    }
    
    var xColumnNames = [],
        yColumnNames = [];
    
    d.map(function(dd) {
            xColumnNames.push(dd.xColumnName);
            yColumnNames.push(dd.yColumnName);
        });
    
    d3.select("#caption")
            .text(state.caption)
    
    function x_translate(j) {
        return j*(plotSize['width'] + plotSpacing['horizontal']);
    }
    
    function y_translate(i) {
        return (nRows - i - 1)*(plotSize['height'] + plotSpacing['vertical']);
    }
    
    var cell = svg.selectAll(".cell")
                  .data(d)
                  .enter().append("g")
                  .attr("class", "cell")
                  .attr("transform", function(d) { 
                                        return "translate(" + x_translate(d.j) + "," 
                                                            + y_translate(d.i) + ")"; 
                                    })
                  .each(plot);
    
    // Define the brush object
    var brush = d3.svg.brush()
                  .x(xScaler)
                  .y(yScaler)
                  .on("brushstart", brushstart)
                  .on("brush", brushmove)
                  .on("brushend", brushend);
    
    cell.call(brush);
    
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
      .data(d)
      .enter().append("g")
      .attr("class", "x axis")
      .attr("transform", function(d, i) { return "translate(" + x_translate(d.j) + "," 
                                                    + (y_translate(d.i) + plotSize['height'] + 15) + ")"; })
      .each(function(d) { xScaler.domain(domainByDataColumn[d.xColumnName]); 
                          d3.select(this).call(xAxis); 
            });
        
    svg.selectAll(".y.axis")
      .data(d)
      .enter().append("g")
      .attr("class", "y axis")
      .attr("transform", function(d, i) { return "translate(" + (x_translate(d.j) + plotSpacing['horizontal']/2 + 10) + "," 
                                                    + y_translate(d.i) + ")"; })
      .each(function(d) { yScaler.domain(domainByDataColumn[d.yColumnName]); 
                          d3.select(this).call(yAxis); 
            });
    
    // add axis labels
    svg.selectAll(".x-label")
      .data(d)
      .enter().append("text")
      .text(function(d,i) { return d.xColumnName; })
      .attr("class", "axis-label")
      .attr("x", function(d, i) { return x_translate(d.j) + plotSpacing['horizontal']/2 + plotSize['width']/2. - $(this).width()/2.; })
      .attr("y", function(d, i) { return y_translate(d.i) + plotSpacing['vertical']/2 + plotSize['height'] + 50; });
    
    svg.selectAll(".y-label")
      .data(d)
      .enter().append("text")
      .text(function(d,i) { return d.yColumnName; })
      .attr("class", "axis-label") 
      .attr("x", function(d, i) { return x_translate(d.j); })
      .attr("y", function(d, i) { return (plotSpacing['vertical']/2-y_translate(d.i)) + plotSize['height']/2. + $(this).width()/2.; })
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

    // Clear the previously-active brush, if any.
    function brushstart(p) {
        if (brushCell !== this) {
            d3.select(brushCell).call(brush.clear());
            xScaler.domain(domainByDataColumn[p.xColumnName]);
            yScaler.domain(domainByDataColumn[p.yColumnName]);
            brushCell = this;
        }
    }
    
    // Highlight the selected circles.
    function brushmove(p) {
        var e = brush.extent(),
            xCol = p.xColumnName || p.xAxis,
            yCol = p.yColumnName || p.yAxis;
        
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
        
        xScaler.domain(domainByDataColumn[p.xColumnName]);
        yScaler.domain(domainByDataColumn[p.yColumnName]);
        
        var marker = state['plots'][p['plotIndex']]['marker'];
        
        if (typeof marker != 'undefined') {
            opacity = marker['opacity'];
            size = marker['size'];
        } else {
            opacity = 0.75;
            size = 3;
        }
        
        cell.append("rect")
            .attr("class", "frame")
            .attr("x", plotSpacing['horizontal'] / 2)
            .attr("y", plotSpacing['vertical'] / 2)
            .attr("width", plotSize['width'])
            .attr("height", plotSize['height']);
        
        cell.selectAll("circle")
            .data(allPlotData)
            .enter().append("circle")
            .attr("cx", function(d) { return xScaler(d[p.xColumnName]); })
            .attr("cy", function(d) { return yScaler(d[p.yColumnName]); })
            .attr("r", size)
            .attr("opacity", opacity)
            .style("fill", function(d) { return color_scale(d[state['colorAxis']]) || "#333333"; }); 
    }
}