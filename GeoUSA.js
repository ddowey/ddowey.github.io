

		var FocusVis, ContextVis, brush, createVis, padding, outerWidth, outerHeight, 	centered, height, width, margin, innerWidth, innerHeight,
		height2, width2, margin2, outerWidth2, outerHeight2, innerWidth2, innerHeight2,
		data, parseDate, color, svg, canvas;
			
	margin = {top: 30, right: 0, bottom: 30, left: 30},
    margin2 = {top: 350, right: 0, bottom: 70, left: 45},
    padding = {top: 0, right: 0, bottom: 0, left: 0},
	padding2 = {top: 0, right: 0, bottom: 0, left: 0},
    outerWidth = 1060,
    outerHeight = 800,
    outerWidth2 = 250,
    outerHeight2 = 520,
    innerWidth = outerWidth - margin.left - margin.right,
    innerHeight = outerHeight - margin.top - margin.bottom,
    width = innerWidth - padding.left - padding.right,
    height = innerHeight - padding.top - padding.bottom;
    innerWidth2 = outerWidth2 - margin2.left - margin2.right,
    innerHeight2 = outerHeight2 - margin2.top - margin2.bottom,
    width2 = innerWidth2 - padding2.left - padding2.right,
    height2 = innerHeight2 - padding2.top - padding2.bottom;
	
    FocusVis = {x: margin2.left, y: margin2.top, w: innerWidth2, h: innerHeight2};
    ContextVis = {w: width, h: height};

	
// Original stuff	
	//var bbVis = { x: 100, y: 10, w: width - 100, h: 300};

var detailVis = d3.select("#detailVis").append("svg").attr({
		width: outerWidth2,
		height: outerHeight2
	})
	//.style("border", "1px solid black");


var canvas = d3.select("#vis").append("svg").attr({
    width: ContextVis.w,
    height: ContextVis.h
    })

var svg = canvas.append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });

var focus = detailVis.append("g")
		.attr({ transform: "translate(" + margin2.left + "," + (margin2.top) + ")" });
		
var projection = d3.geo.albersUsa().scale(width).translate([width / 2, height / 2]);//.precision(.1);
var path = d3.geo.path().projection(projection);
// end of original stuff

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", clicked);

var g = svg.append("g");

var div = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);
	
var radius = d3.scale.sqrt()
    .range([0, 5]);

////////////// Data variables here
var CompleteDataSet = {};
var NestedStations = d3.nest().key(function(d) { return d.USAF; });
var yDetailScale = d3.scale.linear().range([FocusVis.h, 0]);
var XaxisLabels = ["0:00", "1:00", "2:00", "3:00", "4:00", "5:00", 
	"6:00", "7:00", "8:00", "9:00", "10:00", "11:00", "12:00", "13:00", 
	"14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", 
	"21:00", "22:00", "23:00"];
var xDetailScale = d3.scale.ordinal()
	.domain(d3.range(XaxisLabels.length))
	.rangeRoundBands([0, FocusVis.w], 0.1);

	
queue()
    .defer(d3.json, "../data/us-named.json")
    .defer(d3.json, "../data/reducedMonthStationHour2003_2004.json")
	.defer(d3.csv, "../data/NSRDB_StationsMeta.csv")
    .await(MaketheMap);

function MaketheMap(error, usMap, LuminosityData, StationsData) {
	g.append("g")
	  .attr("id", "states")
	.selectAll("path")
	  .data(topojson.feature(usMap, usMap.objects.states).features)
	.enter().append("path")
	  .attr("d", path)
	  .on("click", clicked);

	g.append("path")
	  .datum(topojson.mesh(usMap, usMap.objects.states, function(a, b) { return a !== b; }))
	  .attr("id", "states-borders")
	  .attr("d", path);

    svg.selectAll(".country").data(topojson.feature(usMap, usMap.objects.states).features).enter()

	////////////// Data processing to create GeoJSON here

	var CombinedData = {};
	var features = [];
	// Make features array by iterating over data for each Station
	StationsData.forEach(function(d, i) { 
	var coord =[];
	coord[0] = parseFloat(StationsData[i]["NSRDB_LON(dd)"]);
	coord[1] = parseFloat(StationsData[i]["NSRDB_LAT (dd)"]);
	nameList  = {"type": "Point", "coordinates": coord}; 	 // add name to nameList
	var propList = {"name": StationsData[i]["STATION"], "code": StationsData[i]["ST"], "sum": "", "hourly": "" }; 
	features.push({"geometry": nameList, "id": StationsData[i]["USAF"], "properties": propList, "type": "Feature"}); 
	})
	// Combine together to put in the GeoJSON format 
	CombinedData  = {"type": "FeatureCollection", "features": features}; 
		
	// Combine with the csv file data to make one combined GeoJSON 
	for (var obj in LuminosityData) {
		var dataStation = parseInt(obj);
		var dataSum = LuminosityData[obj].sum;
		var dataHourly =  LuminosityData[obj].hourly;
	
		for (var j = 0; j < CombinedData.features.length; j++) { 
		var jsonStation = parseInt(CombinedData.features[j].id);
		if (dataStation == jsonStation) {
			CombinedData.features[j].properties.sum = dataSum;
			CombinedData.features[j].properties.hourly = dataHourly;
			break;
			}
		}
	}
	// Done the GeoJSON CombinedData has all the geo-located data

	var maxSum = d3.max(CombinedData.features, function(d){return d.properties.sum});
	radius.domain([0, maxSum])
	
	////////////// add circles to map located at each station, with the radius equal to the sum
	g.selectAll(".symbol")
		.data(CombinedData.features.sort(function(a, b) { return b.properties.sum - a.properties.sum; }))
	   .enter().append("path")
		.attr("class", "symbol")
		.attr("fill", function(d) {if (d.properties.sum == "") {return "grey" ;} 
			else {return "#fed976"; }})
		.attr("stroke", function(d) {if (d.properties.sum == "") {return "none" ;} 
			else {return "#253494"; }})
		.attr("d", path.pointRadius(function(d) {
			if (d.properties.sum == "") {return radius(4000000); }
			else {return radius(d.properties.sum); }}))
		//.on("click",  function(d) { updateDetailVis(d, d.properties.name)})
		.on("click",  function(d) {  updateDetailVis(d.properties.hourly, d.properties.name)})
		.on("mouseover", function(d) { 
				d3.select(this).transition().duration(100).style("fill", "red");
				div.transition()        
					.duration(200)      
					.style("opacity", .9);      
				div.html(function(dd) {
				if (d.properties.sum == "") 
				{return d.properties.name + "<br/>" + "Not Available";} 
				else 
				{return d.properties.name + "<br/>" + TooltipsFormatter(d.properties.sum) + " Hours";}
				})  
					.style("left", (d3.event.pageX) + "px")     
					.style("top", (d3.event.pageY - 28) + "px");    
				})                  
		.on("mouseout", function(d) {   
				d3.select(this).transition().duration(100).style("fill", function(dd) {if (dd.properties.sum == "") {return "grey" ;} 
			else {return "#fed976"; }});		
				div.transition()        
					.duration(500)      
					.style("opacity", 0);   
			});

	createDetailVis(CombinedData.features[1].properties.hourly, CombinedData.features[1].properties.name)	
	
}

var xAxis = d3.svg.axis().scale(xDetailScale).orient("bottom").ticks(24);
var yAxis = d3.svg.axis().scale(yDetailScale).orient("left");
var commasFormatter = d3.format(",.1f");
var TooltipsFormatter = d3.format(",.0d");
xAxis.tickFormat(function(yval) {return yval + ":00"  });
yAxis.tickFormat(function(yval) {
	return commasFormatter(yval/1000000) ;
	});

// ALL THESE FUNCTIONS are just a RECOMMENDATION !!!!
var createDetailVis = function(data, name){
	////////////// Create small focus barchart

		yDetailScale.domain([0, d3.max(d3.entries(data), function(d) { return d.value; })])
		if (d3.max(d3.entries(data), function(d) { return d.value; }) > 0 ) {
			focus.selectAll("rect").style("display", "block") }
			else {	focus.selectAll("rect").style("display", "none") };
		//Create barchart rects
		focus.selectAll("rect")
			   .data(d3.entries(data))
			  .enter()
			  .append("rect")
				.style("display", function(d) {
                return d.value > 0 ? "block" : "none";
				})
			   .attr("x", function(d, i) {
						return xDetailScale(i);
				   })
				   .attr("y", function(d) {
						return yDetailScale(d.value);
				   })
				   .attr("width", xDetailScale.rangeBand())
				   .attr("height", function(d) {
						return yDetailScale(0) - yDetailScale(d.value);
				   })
				   .attr("fill", function(d) {
						return "#253494";
				   });	
				   
		var XaxisGroup = focus.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + FocusVis.h + ")")
			.call(xAxis)
		  .selectAll("text")
			//.attr("transform", "translate(" + FocusVis.w + ", 15)")
            .style("text-anchor", "end")
            .attr("dx", "-1.0em") // vertical
            .attr("dy", "-0.5em") // horizontal
            .attr("transform", function(d) {
                return "rotate(-90)" 
                });
			
		focus.append("text")
			.attr("class", "x axis")
			.attr("transform", "translate(" + FocusVis.w + "," + FocusVis.h + ")")
			.attr("dx", "-1.0em")
			.attr("dy", "4.71em")
			.style("text-anchor", "end")
			.style("font", "10px sans-serif")
			.text("Hour");
					
		var chartLabel = focus.append("text")
			.attr("class", "chartLabel")
			.attr("transform", "translate(-10, -20)")
			.style("text-anchor", "beginning")
			.style("font", "16px sans-serif")
			.text(name);
			
		//XaxisGroup.attr("transform", "translate(0," + FocusVis.h + ")");
			
			focus.append("g")
			.attr("class", "y axis")
			.call(yAxis)
		  .append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text("Sunlight ( '000,000)");				

}


var updateDetailVis = function(data, name){
		yDetailScale.domain([0, d3.max(d3.entries(data), function(d) { return d.value; })])
			if (d3.max(d3.entries(data), function(d) { return d.value; }) > 0 ) {
			focus.selectAll("rect").style("display", "block") }
			else {	focus.selectAll("rect").style("display", "none") };
		//Update all rects
		focus.selectAll("rect")
		   .data(d3.entries(data))
			   .attr("x", function(d, i) {
						return xDetailScale(i);
				   })
				   .attr("y", function(d) {
						return yDetailScale(d.value);
				   })
				   .attr("width", xDetailScale.rangeBand())
				   .attr("height", function(d) {
						return yDetailScale(0) - yDetailScale(d.value);
				   })
				   .attr("fill", function(d) {
						return "#253494";
				   });	
		focus.select(".y.axis")
			.call(yAxis);
		focus.select(".chartLabel").text(name);
}


function clicked(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  g.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
}



// ZOOMING
function zoomToBB() {


}

function resetZoom() {
    
}


