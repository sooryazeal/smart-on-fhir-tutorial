function loadGraphs(pat_id) {
  var header = d3.select("body").append("div").attr("class", "well");
  var tableDiv = d3.select("body").append("div").attr("id", "tableDiv1"), pat_name = patientInfo[pat_id];
  var divs = tableDiv.append("div")
      .attr("id", function(d) { return "Div"; })
      .attr("class", "well")
  header.append("h1").text("Emory Hospital");
  header.append("h2").text(" Sepsis prediction");
  divs.append("h3").text(function(d) { return pat_name; });

  window.prepareloadGraph = function(labValues = window.labValues, time = false, click = false) {
    debugger
    var labs = location.search.substring(1).split("&")[2];
    if(labs)
    {
      var lab = labs.split("=")[1];
      loadGraph(lab, labValues, time, click);
    }
    else{
      loadGraph("804-5", labValues, time, click),loadGraph("718-7", labValues, time),loadGraph("32693-4", labValues, time),loadGraph("1975-2", labValues, time),loadGraph("2160-0", labValues, time),loadGraph("777-3", labValues, time);
    }
  }

  function loadGraph(lab_name, labValues, time = false, click = false) {
    if(click)
      d3.selectAll('#tableDiv1 .well a').remove();

      var labs = location.search.substring(1).split("&")[2], red = false, trans = {
        "804-5":{"name": "WBC", "unit": "K/uL"},
        "718-7":{"name": "Hemoglobin", "unit": "g/dL"},
        "32693-4":{"name": "Lactate", "unit": "mmol/L"},
        "1975-2":{"name": "Bilirubin", "unit": "mg/dL"},
        "2160-0":{"name": "Creatinine", "unit": "mg/dL"},
        "777-3":{"name": "Platelet", "unit": "K/uL"}      
      };

        window.labValues = labValues, data = labValues[lab_name]["data"]
        if(time == 3){data = data['d7'].concat(data['h12']).concat(data['h24']).concat(data['h72'])}
          else if(time == 2) {data = data['h12'].concat(data['h24']).concat(data['h72'])}
            else if(time == 1) {data = data['h12'].concat(data['h24'])}
              else {data = data['h12']}
        // change string (from CSV) into number format
        data.forEach(function(d) {
          d["value"] = +d["value"];
          if(d["value"] <= labValues[lab_name]["critical"]["low"] || d["value"] >= labValues[lab_name]["critical"]["high"])
            red = true;
        });
        var lastActual = $.grep(data, function(d) {return d.type == "actual";}).sort(function(a,b) {return (a.timestamp > b.timestamp) ? 1 : ((b.timestamp > a.timestamp) ? -1 : 0);} ).slice(-1);
        var newt = lastActual.concat($.grep(data, function(d) {return d.type == "pred";}).sort(function(a,b) {return (a.timestamp > b.timestamp) ? 1 : ((b.timestamp > a.timestamp) ? -1 : 0);} ));
        var limit = newt.length -  1;
        if(!red)
          for (var i = 0; i < limit; ++i) { if(newt[i].value/newt[i+1].value <= 0.5 || newt[i].value/newt[i+1].value >= 2) {red = true; break;}} 
        console.log(red);
        d3.select("h5").text(pat_name);
        var margin = {top: 20, right: 20, bottom: 30, left: 40}, width, height;
        if(labs){
          width = innerWidth * 0.75 - margin.left - margin.right,
          height = innerHeight * 0.75 - margin.top - margin.bottom;
        }
          else {
            width = 380 - margin.left - margin.right,
          height = 250 - margin.top - margin.bottom;
          }
        

      // setup x 
        var xValue = function(d) { return d.timestamp;}, // data -> value
            xScale = d3.time.scale().range([0, width]), // value -> display
            xMap = function(d) { return xScale(xValue(d));}, // data -> display
            xAxis = d3.svg.axis().scale(xScale).orient("bottom");

        // setup y
        var yValue = function(d) { return d["value"];}, // data -> value
            yScale = d3.scale.linear().range([height, 0]), // value -> display
            yMap = function(d) { return yScale(yValue(d));}, // data -> display
            yAxis = d3.svg.axis().scale(yScale).orient("left");

        // setup fill color
        var cValue = function(d) { return d.type;},
            color = d3.scale.category10();

        // add the graph canvas to the body of the webpage
        var svg_parent = d3.selectAll('#tableDiv1 .well').append('a')
        .attr("href", location.pathname.split("/").slice(-1)[0] + location.search + "&lab="+lab_name)
        .append("svg"), 
        svg = svg_parent.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("style", function() {
              if(red) 
                return "background-color:#ffe4e1";
            })
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg_parent.append('g').append("text")
        .attr("x", width/2)
        .attr("y", 10)
        .attr("class", "label lab")
        .text(trans[lab_name]["name"]);
        // add the tooltip area to the webpage
        var tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // load data

        // don't want dots overlapping axis, so add in buffer to data domain
        xScale.domain([d3.min(data, xValue), d3.max(data, xValue)]);
        yScale.domain([d3.min(data, yValue) - 1, d3.max(data, yValue)+1]);

        // x-axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
          .append("text")
            .attr("class", "label")
            .attr("x", width)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text("timestamp");

        // y-axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
          .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(trans[lab_name]["unit"]);

        // draw dots
        svg.selectAll(".dot")
            .data(data)
          .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 3.5)
            .attr("cx", xMap)
            .attr("cy", yMap)
            .style("fill", function(d) { return color(cValue(d));}) 
            .on("mouseover", function(d) {
                tooltip.transition()
                     .duration(200)
                     .style("opacity", .9);
                tooltip.html(d["type"] + "<br/> (" + xValue(d) 
                + ", " + yValue(d) + ")")
                     .style("left", (d3.event.pageX + 5) + "px")
                     .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                     .duration(500)
                     .style("opacity", 0);
            });

        // draw legend
        var legend = svg.selectAll(".legend")
            .data(color.domain())
          .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        // draw legend colored rectangles
        legend.append("rect")
            .attr("x", width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        // draw legend text
        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) { return d;})

        svg.append("svg:line")
                        .attr("x1", 0)
                        .attr("x2", width)
                        .attr("y1", yScale(labValues[lab_name]["critical"]["low"]))
                        .attr("y2", yScale(labValues[lab_name]["critical"]["low"]))
                        .style("stroke", "rgb(255, 0, 0)")
                        .attr("stroke-dasharray", "5, 5"  );

          svg.append("svg:line")
                        .attr("x1", 0)
                        .attr("x2", width)
                        .attr("y1", yScale(labValues[lab_name]["critical"]["high"]))
                        .attr("y2", yScale(labValues[lab_name]["critical"]["high"]))
                        .style("stroke", "rgb(255, 0, 0)")
                        .attr("stroke-dasharray", "5, 5"  );
  }

  getLabValues(pat_id, prepareloadGraph);
  
};
