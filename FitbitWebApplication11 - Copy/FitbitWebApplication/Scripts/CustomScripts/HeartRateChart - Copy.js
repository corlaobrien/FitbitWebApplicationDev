var heartRateChartModule = (function (heartRateChartModule) {

    heartRateChartModule.HRChart = (function () {
        function HRChart(dataSet) {
            var base = this;
            this.margin = { top: 20, right: 20, bottom: 60, left: 50 },
                this.width = $('#trend').width() - this.margin.left - this.margin.right,
                this.height = $('#trend').height() - this.margin.top - this.margin.bottom;
            this.path, this.svg;
            this.trendData = dataSet;
            this.points = dataSet;

            this.minXValue = new Date(this.trendData[0].DateTime);
            this.maxXValue = new Date(base.trendData[base.trendData.length - 1].DateTime);

            this.maxYValue = d3.max(this.trendData, function (d) { return parseInt(d.Value); });
            this.minYValue = d3.min(this.trendData, function (d) { return parseInt(d.Value); });

            this.init();
            this.redraw()();
        }

        HRChart.prototype.init = function () {
            var base = this;
            var parseTime = d3.time.format("%d-%b %H:%M");

            base.x = d3.time.scale().domain(d3.extent(base.points, function (d) { return new Date(d.DateTime); })).rangeRound([0, base.width]);
            base.y = d3.scale.linear().domain(d3.extent(base.points, function (d) { return parseFloat(d.Value); })).rangeRound([base.height, 0]);

            base.panExtent = { x: [0, base.width], y: [0, 200] };

            base.dragged = base.selected = null;

            base.line = d3.svg.line()
                .x(function (d) { return base.x(new Date(d.DateTime)); })
                .y(function (d) { return base.y(parseFloat(d.Value)); });

            //base.xAxis = d3.svg.axis()
            //    //.scale(base.x)
            //    .orient("bottom");
            //    //.tickFormat(parseTime).ticks(7);

            //base.yAxis = d3.svg.axis()
            //    //.scale(base.y)
            //    .orient("left");//.ticks(15);

            base.zoom = d3.behavior.zoom().x(base.x).y(base.y).on("zoom", this.redraw());

            base.svg = d3.select("svg")
                .attr("width", base.width)
                .attr("height", base.height)
                .append("g")
                .attr("transform", "translate(" + base.margin.left + "," + base.margin.top + ")");

            base.plot = base.svg.append("rect")
                .attr("width", base.width)
                .attr("height", base.height)
                .style("fill", "#FFFFFF")
                .attr("pointer-events", "all")
                this.plot.call(base.zoom);

            base.path = base.svg.append("path")
                .datum(base.points)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("shape-rendering", "geometricPrecision")
                .attr("stroke-width", "2px")
                .attr("d", base.line);

            //var circle = svg.selectAll("circle.trendDot").data(trendData);

            base.svg.append("text")
                .attr("text-anchor", "middle")
                .attr("id", "labelY")
                .attr("class", "axisTitle")
                .style("font-size", "14px")
                .attr("transform", "translate(-40," + (base.height / 2) + ")rotate(-90)")
                .text("Heart Rate (bpm)");

            base.svg.append("text")
                .attr("text-anchor", "end")
                .attr("id", "labelX")
                .attr("class", "axisTitle")
                .style("font-size", "14px")
                .attr("transform", "translate(" + (base.width / 2) + ", " + (base.height + 50) + ")")
                .text("Date/Time");            
        }

        HRChart.prototype.prepareCrossHairs = function () {
            //base.selectedPoint;

            //base.svg.append("rect")
            //    .attr("class", "overlay")
            //    .attr("width", base.width)
            //    .attr("height", base.height)
            //    .on("mousemove", function () {
            //        var mouse = d3.mouse(this);
            //        var mouseDate, mouseYPoint;
            //        var i;
            //        mouseDate = base.x.invert(mouse[0]);
            //        i = bisectDate(base.trendData, mouseDate);
            //        mouseYPoint = base.y.invert(mouse[1]);

            //        if (i == 0) {
            //            base.selectedPoint = base.trendData[0];
            //        }
            //        else if (i == trendData.length) {
            //            base.selectedPoint = base.trendData[i - 1];
            //        }
            //        else {
            //            var d0 = base.trendData[i - 1];
            //            var d1 = base.trendData[i];
            //            base.selectedPoint = mouseDate - d0.DateTime > d1.mouseDate ? d1 : d0;
            //        }

            //        var crossHairX = base.x(new Date(selectedPoint.DateTime));
            //        var crossHairY = base.y(parseFloat(selectedPoint.Value));

            //        with (focus) {
            //            style('display', null);
            //            select('.focusCircle', null);
            //            select(".focusCircle")
            //                .attr("cx", crossHairX)
            //                .attr("cy", crossHairY);
            //            select(".focusLineX")
            //                .attr("x1", crossHairX).attr("y1", crossHairY)
            //                .attr("x2", crossHairX).attr("y2", base.height);
            //            select(".focusLineY")
            //                .attr("x1", 0).attr("y1", crossHairY)
            //                .attr("x2", base.width).attr("y2", crossHairY)
            //        }
            //    });

            //var focus = svg.append("g").attr("class", "focusGroup").style("display", "none");
            //with (focus) {
            //    append("line")
            //        .attr("id", "focusLineX")
            //        .attr("class", "focusLine")
            //    append("line")
            //        .attr("id", "focusLineY")
            //        .attr("class", "focusLine")
            //    .append("circle")
            //        .attr("r", 2)
            //        .attr("class", "focusCircle");
            //}
        }


        HRChart.prototype.refresh = function () {
            var base = this;

            base.circle = base.svg.selectAll("circle")
                .data(this.points, function (d) { return d; });

            base.circle.enter().append("circle")
                .attr("class", "trendDot")
                .attr("r", 1)
                .attr("fill", "steelblue")
                .attr("x", function (d) {
                    return base.x(new Date(d.DateTime));
                })
                .attr("y", function (d) {
                    return base.y(parseFloat(d.Value));
                })
                .attr("cx", function (d) {
                    return base.x(new Date(d.DateTime));
                })
                .transition().duration(250)
                .attr("cy", function (d) {
                    return base.y(parseFloat(d.Value));
                });

            base.circle.exit().remove();

            base.path = base.svg.select("path")
                //.datum(base.points)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("shape-rendering", "geometricPrecision")
                .attr("stroke-width", "2px")
                .attr("d", base.line(base.points));

            base.svg.append("path")
                .attr("stroke", "#A9A9A9")
                .attr("stroke-width", 2)
                //.attr("fill", "#000")
                .attr("transform", "translate(0," + base.height + ")");

            base.svg.append("path")
                //.attr("fill", "#000")
                .attr("stroke", "#A9A9A9")
                .attr("stroke-width", 2);

            if (d3.event && d3.event.keyCode) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        }

        HRChart.prototype.redraw = function () {
            var base = this;

            return function () {
                //console.log("x[0]")
                //console.log(base.x.domain()[0] >= new Date(base.trendData[0].DateTime));
                //console.log("x[1]")
                //console.log(base.x.domain()[1] <= new Date(base.trendData[base.trendData.length - 1].DateTime));
                //console.log("y[0]")
                //console.log(base.y.domain()[0] <= base.maxValue);
                //console.log("y[1]")
                //console.log(base.y.domain()[1] >= base.minValue);

                //if (base.x.domain()[0] >= base.minXValue && base.x.domain()[1] <= base.maxXValue && base.y.domain()[0] <= base.maxYValue && base.y.domain()[1] >= base.minYValue)
                //{
                    base.tx = function (d) {
                        return "translate(" + base.x(d) + ",0)";
                    },
                    base.ty = function (d) {
                        return "translate(0," + base.y(d) + ")";
                    },
                    base.stroke = function (d) {
                        return "#C0C0C0";
                    },
                    base.fx = base.x.tickFormat(10),
                    base.fy = base.y.tickFormat(10);

                    // Regenerate x-ticks…
                    base.gx = base.svg.selectAll("g.x")
                        .data(base.x.ticks(10), String)
                        .attr("transform", base.tx);

                    base.gx.select("text")
                        .text(base.fx);

                    base.gxe = base.gx.enter().insert("g", "a")
                        .attr("class", "x")
                        .attr("transform", base.tx);

                    base.gxe.append("line")
                        .attr("stroke", base.stroke)
                        .attr("y1", 0)
                        .attr("y2", base.height);

                    base.gxe.append("text")
                        .attr("class", "axis")
                        .attr("y", base.height)
                        .attr("dy", "1em")
                        .attr("text-anchor", "middle")
                        .text(base.fx)
                        .style("cursor", "ew-resize")
                        .on("mouseover", function (d) { d3.select(this).style("font-weight", "bold"); })
                        .on("mouseout", function (d) { d3.select(this).style("font-weight", "normal"); });

                    base.gx.exit().remove();

                    // Regenerate y-ticks…
                    base.gy = base.svg.selectAll("g.y")
                        .data(base.y.ticks(10), String)
                        .attr("transform", base.ty);

                    base.gy.select("text")
                        .text(base.fy);

                    base.gye = base.gy.enter().insert("g", "a")
                        .attr("class", "y")
                        .attr("transform", base.ty)
                        .attr("background-fill", "#FFEEB6");

                    base.gye.append("line")
                        .attr("stroke", base.stroke)
                        .attr("x1", 0)
                        .attr("x2", base.width);

                    base.gye.append("text")
                        .attr("class", "axis")
                        .attr("x", -3)
                        .attr("dy", ".35em")
                        .attr("text-anchor", "end")
                        .text(base.fy)
                        .style("cursor", "ns-resize")
                        .on("mouseover", function (d) { d3.select(this).style("font-weight", "bold"); })
                        .on("mouseout", function (d) { d3.select(this).style("font-weight", "normal"); });

                    base.gy.exit().remove();
                    base.plot.call(d3.behavior.zoom().x(base.x).y(base.y).on("zoom", base.redraw()));
                    base.refresh();
                //}
                //else {
                //    base.x.domain([base.minXValue, base.maxXValue]);
                //    base.y.domain([base.minYValue, base.maxYValue]);
                //    base.redraw();
                //}
            }
        }

        function positionXCrossHairs(mouse) {
            xPos = mouse[0];
            //// Iterate through the range to see which one is the xPos nearest to
            var dist;
            var closest;
            $.each(base.x.range(), function (i, d) {
                if (i == 0) {
                    dist = Math.abs(xPos - d);
                    closest = i;
                }
                else {
                    if (dist > Math.abs(xPos - d)) {
                        dist = Math.abs(xPos - d);
                        closest = i;
                    }
                }
            });
            return closest + 1;
        }

        var bisectDate = d3.bisector(function (d) {
            return d.DateTime;
        }).left;

        return HRChart;
    })();

    return heartRateChartModule;
}(heartRateChartModule || {}));