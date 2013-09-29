/*
    Define some default style parameters
*/

// all size / padding parameters are specified in pixels
var figureSpec = {  "figurePadding" : { "top" : 0, 
                                        "left" : 50, 
                                        "right" : 10, 
                                        "bottom" : 40},
                    "plotSpacing" : { "vertical" : 50,
                                      "horizontal" : 100},
                    "plotSize" : {"width" : 200,
                                  "height" : 200}
                 }

var figPadding = figureSpec["figurePadding"],
    plotSpacing = figureSpec["plotSpacing"],
    plotSize = figureSpec["plotSize"]; 

// Scalers for x / y axes from data space to pixel space
var xScaler = d3.scale.linear()
                .range([plotSpacing['horizontal']/2, 
                        plotSize['width'] + plotSpacing['horizontal']/2]);

var yScaler = d3.scale.linear()
                .range([plotSize['height'] + plotSpacing['vertical']/2,
                        plotSpacing['vertical']/2]);

// Default plot parameters
var dTickSize = 16,
    dColorMap = ["red", "blue"];