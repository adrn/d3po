function readD3POCSV(filename) {
    /* 
        TODO
    */
    d3.csv(filename, function(error, data) {
        csvData = data;
        update_state(jsonData['states'][0]);
        
        d3.select("#controls").selectAll("button")
            .data(jsonData['states'])
            .enter().append("button")
            .text(function(d, i){ return d['name']; })
            .on("click", function(e,i) {
                update_state(jsonData['states'][i]);
            });
    });
}