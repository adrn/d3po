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
                        update_state(jsonData['states'][i]);
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
