function readD3POCSV(filename) {
    /* 
        TODO
    */
    d3.csv(filename, function(error, data) {
        csvData = data;
        update_state(jsonData['states'][0]);
        
        d3.select("#controls .navigation").selectAll("li")
            .data(jsonData['states'])
            .enter().append("li")
            .text(function(d, i){ return d['name']; })
            .on("click", function(e,i) {
                update_state(jsonData['states'][i]);
                $(".navigation li").removeClass("selected");
                $(this).addClass("selected");
            });

        $(".navigation li:first-of-type").addClass("selected");
    });
}