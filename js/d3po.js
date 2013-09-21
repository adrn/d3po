/*
    Define some default style parameters
    
    (TODO: add other ones here...)
*/

// all size / padding parameters are specified in pixels
var figureSpec = {  "figurePadding" : { "top" : 0, 
                                        "left" : 40, 
                                        "right" : 20, 
                                        "bottom" : 35},
                    "plotSpacing" : { "vertical" : 40,
                                      "horizontal" : 60},
                    "plotSize" : 250
                 }


var figPadding = figureSpec["figurePadding"],
    plotSpacing = figureSpec["plotSpacing"],
    plotSize = figureSpec["plotSize"]; 

/*
    These are some global variables we use below
*/
var currentState, 
    jsonData, 
    csvData;

// Scalers for x / y axes from data space to pixel space
var xScaler = d3.scale.linear()
                .range([plotSpacing['horizontal']/2, 
                        plotSize - plotSpacing['horizontal']/2]);

var yScaler = d3.scale.linear()
                .range([plotSize - plotSpacing['vertical']/2,
                        plotSpacing['vertical']/2]);

function readD3POCSV(filename) {
    /* 
        TODO
    */
    d3.csv(filename, function(error, data) {
        csvData = data;
        update_state(jsonData['states'][0]);
        
        d3.select("#controls").selectAll("button").data(jsonData['states'])
            .enter().append("button")
            .html(function(d, i){ return d['name']; })
            .on("click", function(e,i) {
                update_state(jsonData['states'][i]);
            });
    });
}