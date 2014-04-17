/**
 * Created by hen on 3/8/14.
 */
var yearString = "2000";

var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 960 - margin.left - margin.right;
var height = 700 - margin.bottom - margin.top;

var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 300
};

var dataSet = {};
var dataArray = [];
	
var svg = d3.select("#vis").append("svg").attr({
	width: width + margin.left + margin.right,
	height: height + margin.top + margin.bottom
}).append("g").attr({
		transform: "translate(" + margin.left + "," + margin.top + ")"
	});
	
var g = svg.append("g");

var projectionMethods = [
	{
	name:"mercator",
	method: d3.geo.mercator().translate([width / 2, height / 2])
	//.center([0,40])
	//.scale(100)
	//.rotate([-12,0])
	//.precision(.1);
	},{
	name:"equiRect",
	method: d3.geo.equirectangular().translate([width / 2, height / 2])//.precision(.1);
	},{
	name:"stereo",
	method: d3.geo.stereographic().translate([width / 2, height / 2])//.precision(.1);
	}
];

	var ActualIndicatorString = "NY.GDP.PCAP.KD";
	var ActualYearString = "2005";
	var actualProjectionMethod = 0;
	//probably don't need TryArray
	var TryArray = [];
	var commasFormatter = d3.format(",.1f");
	var TooltipsFormatter = d3.format(",.0d");
	
	// where is the number of categories specified????
//	var colorMin = colorbrewer.Greens[3][0];
//	var colorMax = colorbrewer.Greens[3][2];
	var color = d3.scale.quantize()
		.range(colorbrewer.Greens[7]);
		//.interpolate(d3.interpolateHcl);
	
	////////////////
	//doesn't work
	var colorThres = d3.scale.threshold()
    //.domain([.11, .22, .33, .50])//must be defined
    .range(colorbrewer.Greens[6]);
////////////////
	var color2	= d3.scale.quantile()
    //.domain([.11, .22, .33, .50])//must be defined
    .range(colorbrewer.Greens[7]);

//////////////////////////////////////////
	
	// A position encoding for the key only.
	var x = d3.scale.linear()
		//.domain([0, 390])
		.range([0, 240]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");
	  //  .tickSize(7)
	   // .tickValues(color.domain());
////////////////////////////////	
		
	var path = d3.geo.path().projection(projectionMethods[0].method);

	var zoom = d3.behavior.zoom()
		.on("zoom",function() {
			g.attr("transform","translate("+ 
				d3.event.translate.join(",")+")scale("+d3.event.scale+")");
			g.selectAll("path")  
				.attr("d", path.projection(projectionMethods[0].method)); 
	});

	var initVis = function(error, indicators, world, isoCode){
		console.log(indicators);
		console.log(world);
		
		g.append("g")
		  .attr("id", "country")
		.selectAll("path")
		  .data(world.features)
		.enter().append("path")
		  .attr("d", path);

		svg.selectAll(".country").data(world.features).enter();
		runAQueryOn(ActualIndicatorString, ActualYearString)
		runAnotherQueryOn(ActualIndicatorString);
		
		svg.call(zoom)	
				
		// combine ISO 2-digit codes and ISO 3-digit codes in JSON
		for (var obj in isoCode) {
		var ISO3Code = isoCode[obj]["Alpha-3 code"];

		for (var j = 0; j < world.features.length; j++) { 
		var WorldID = world.features[j].id;
			if (obj == "0") { 
			if (j < 5) { console.log("WorldID", WorldID); }
			}
		if (ISO3Code == WorldID) {
			for (var entry in isoCode[obj]) {
				world.features[j].properties[entry] = isoCode[obj][entry];
				}
			break;
			}
		}
		}
		// end combine loop for ISO codes
		
				/////////////////////////////////////////////	
		// create a list of years to populate the list that will be in the year selector
		var years = [];
		var yeardate = 1960;
		for (var i = 0; i<50; i++) {
			yeardate++;
			years[i] = yeardate.toString();
		 }
		// var years = ["1960", "1990", "2000", "2005", "2010", "2015"];

	// put together the selector for indicator, from the list of indicators in the csv file
		var IndicatorSelect = d3.select("#selector").append("select")
			.attr("id", "selectIndicator")
		
			.on("change", IndicatorChange)
				.selectAll("option")
				.data(indicators)
			  .enter()
				.append("option")
					.attr("value", function(d){ return d.IndicatorCode; })
					.text( function (d) { return d.IndicatorName  + ": Database Code( " + d.IndicatorCode + " )"} );

		// put together the selector for years from the list created above
		// need to add a way of getting valid years from API call
		var DateSelect = d3.select("#selectorYear").append("select")
			.attr("id", "selectYear")
			.on("change", YearChange)
				.selectAll("option")
				.data(years)
			  .enter()
				.append("option")
					.attr("value", function(d){ return d; })
					//.attr("selected", "2005")
					.text( function (d, i ) { return d;} );
			
	////////////////////////////

	var legend = svg.selectAll('g.legendEntry')
							.data(color.range().reverse())
							.enter()
							.append('g').attr('class', 'legendEntry');
	
					legend.append('rect')
							.attr("x",  30)
							.attr("y", function(d, i) {
							   return (i * 20 + 400);	})
						   .attr("width", 10)
						   .attr("height", 10)
						   .style("stroke", "black")
						   .style("stroke-width", 1)
						   .style("fill", function(d){return d;}); 	
						   
				var legendtext	=	legend
								.append('text')
								.attr("class", "legendtext")
								.attr("x", 45) //leave 5 pixel space after the <rect>
								.attr("y", function(d, i) {
								   return (i * 20 + 400);	})
								.attr("dy", "0.8em") //place text one line *below* the x,y point;
								.text(function(d,i) {
										var extent = color.invertExtent(d);
										//extent will be a two-element array, format it however you want:
										if (-10 < +extent[1] < 10) { var format = d3.format(".2f")} 
										else { var format = d3.format(",.0f")}  ;
										return format(+extent[0]) + " - " + format(+extent[1]);
									});
//////////////////////////////	
			
		function IndicatorChange() {
		ActualIndicatorString = this.options[this.selectedIndex].value;
		console.log("World JSON by Indicator", ActualIndicatorString);
		//YearChange(); 
		runAQueryOn(ActualIndicatorString, ActualYearString);
		runAnotherQueryOn(ActualIndicatorString);
		}

		function YearChange() {
		ActualYearString = this.options[this.selectedIndex].value;
		runAQueryOn(ActualIndicatorString, ActualYearString);
		runAnotherQueryOn(ActualIndicatorString);

		}
		
/////////////////////////////////////////////
		function country_display(data){
		var Country_info ="<div id='Country_info' style='width: "+ "px;'>"+ "<h4>Country information : </h4>" + data.name + "     " + commasFormatter(data.value) +"</div>";
							$("#Country_info").remove();
							$("#textLabel").append(Country_info);
							$("#Country_info").replaceWith(Country_info);}
							
		function country_display_out() { $("#Country_info").remove(); }
							
//IndicatorSelect.property("selected", "NY.GDP.PCAP.KD");
		
		function runAQueryOn(indicatorString, yearString) {
			var url = "http://api.worldbank.org/countries/all/indicators/" + indicatorString + "?format=jsonP&prefix=Getdata&per_page=500&date=" + yearString ;
			TryArray = [];
				$.ajax({
					url: url, 
					 jsonpCallback:'getdata',
					 dataType:'jsonp',
					 success: function (data, status){
					   
					  $.each(data[1], function(index, value) {
						// add values from API call to the GeoJSON
						for (var j = 0; j < world.features.length; j++) { 
						var WorldID = world.features[j].properties["Alpha-2 code"];
						if (value.country.id == WorldID) {
							world.features[j].properties.value = value.value
							//world.features[j].properties.year = value.date
							break;
							}
						}
					  })
	/////////////////////////////////////////////////////////////////////		
					
					var Name ="<div id='Name' style='width: "+ "px;'>"+ "<h3 style='text-decoration-line:underline'>Indicator Presented: </h3>" + TryArray["name"] +"</div>";
					$("#Name").remove();
					$("#textLabel").append(Name);
					$("#Name").replaceWith(Name);
					
					var Year ="<div id='Year' style='width: "+ "px;'>"+ "<h3>Year Presented: " + yearString +"</h3></div>";
					$( "#Year" ).remove();
					$( "#textLabel" ).append(Year);
					$( "#Year" ).replaceWith(Year);
					
					var IndicatorCode ="<div id='IndicatorCode' style='width: "+ "px;'>"+ "<h4>World Bank Indicator code: </h4>" + TryArray["id"] +"</div>";
					$( "#IndicatorCode" ).remove();
					$( "#textLabel" ).append(IndicatorCode);
					$( "#IndicatorCode" ).replaceWith(IndicatorCode);
					
					var SourceNote ="<div id='SourceNote' style='width: "+ "px;'>"+ "<h4>Source Note:</h4>" + TryArray["sourceNote"] + "</div>";
					$( "#SourceNote" ).remove();
					$( "#textLabel" ).append(SourceNote);
					$( "#SourceNote" ).replaceWith(SourceNote);
					
					var Sources ="<div id='Sources' style='width: "+ "px;'>"+ "<h4>Sources:</h4>" + TryArray["sourceOrganization"] +"</div>";
					$( "#Sources" ).remove();
					$( "#textLabel" ).append(Sources);
					$( "#Sources" ).replaceWith(Sources);

///////////////////////////////////////////////////////////////////
						

						// Adjust the colour domain to the new data values from the API call  - something is not right here
						color.domain([
						d3.min(world.features, function(d) { return d.properties.value; }), 
						d3.max(world.features, function(d) { return d.properties.value; })
						]);
						x.domain([
						d3.min(world.features, function(d) { return d.properties.value; }), 
						d3.max(world.features, function(d) { return d.properties.value; })
						]);
												
						// Update the map colouring based on the new values	
						svg.selectAll("path")
								   .style("fill", function(d) {
										var value = d.properties.value;
										if (value) {
											return color(value);
										} else {
											return "#ccc";
										}
								   })
						   		  .on("mouseover",  function(d) { d3.select(this).transition().duration(300).style("fill", "#f7fcb9"); country_display(d.properties)})
									.on("mouseout", function(d) { d3.select(this).transition().duration(300)
										.style("fill", function(d) {
										var value = d.properties.value;
										if (value) {
											return color(value);
										} else {
											return "#ccc";
										}
								   }); country_display_out();
										});
										
										
									legend.select(".legendtext")
									.text(function(d,i) {
										var extent = color.invertExtent(d);
										//extent will be a two-element array, format it however you want:
										if (-10+extent[1] < 10) { var format = d3.format(".2f")} 
										else { var format = d3.format(",.0f")}  ;
										return format(+extent[0]) + " - " + format(+extent[1]);
									});
										
			
						},
						 error: function(data, status) { return console.log("ajax did not finish"); }
					});
					 
				};	
				
	}
	///////////////////////////////////////
function runAnotherQueryOn(indicatorString) {
			var url = "http://api.worldbank.org/indicators/" + indicatorString + "?format=jsonP&prefix=Getdata&per_page=50";
			console.log(url)
			TryArray = [];
				$.ajax({
					url: url, 
					jsonpCallback:'getdata',
					dataType:'jsonp',
					success: function (data, status){
					   console.log("data", data);
					  $.each(data[1], function(index, value) {
						//dataArray[value.country.id] = value.value;
						//return dataArray;
						console.log("success")
						TryArray = value;

					  })

				
						},
						 error: function(data, status) { return console.log("ajax did not finish"); }
					});
					 
				};	
			
	
	/////////////////////////////////////////////////////////////////////

	queue()
		.defer(d3.csv,"../data/worldBank_indicators.csv")
		.defer(d3.json,"../data/world_data.json")
		.defer(d3.json,"../data/Iso3CodeToIso2Code.json")
		.await(initVis);

		// just for fun 
/*	var textLabel = svg.append("text").text(projectionMethods[actualProjectionMethod].name).attr({
		"transform":"translate(-40,-30)"
	})
	//takes away the name of projection method from the screen
*/
	var changePro = function(){
		actualProjectionMethod = (actualProjectionMethod+1) % (projectionMethods.length);

		textLabel.text(projectionMethods[actualProjectionMethod].name);
		path= d3.geo.path().projection(projectionMethods[actualProjectionMethod].method);
		svg.selectAll(".country").transition().duration(750).attr("d",path);
	};

	// put into the <td> with the id  "Projbutton"
	/* d3.select("#Projbutton").append("button")
		.text("changePro")
		.attr("id", "Projbutton")
		.on({
		"click":changePro
	})

	*/





