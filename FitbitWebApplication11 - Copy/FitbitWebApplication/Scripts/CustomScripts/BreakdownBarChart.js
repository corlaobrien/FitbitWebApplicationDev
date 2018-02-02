var breakdownBarChartModule = (function (breakdownBarChartModule) {

    breakdownBarChartModule.BreakdownBarChart = (function () {
        function BreakdownBarChart(dataSet, breakdownX) {
            var base = this;
            this.margin = { top: 20, right: 20, bottom: 35, left: 50 },
                this.width = $('#pieChart').width() - this.margin.left - this.margin.right,
                this.height = $('#pieChart').height() - this.margin.top - this.margin.bottom;
            this.color = d3.scale.ordinal().domain(["Male", "Female", "Active", "Sedentary", "0-25", "26-40", "41-55", "56-70", "71-85", "86+"]).range(["#3366cc", "#dc3912", "#3366cc", "#dc3912", "#3366cc", "#dc3912", "#2ca02c", "#d62728", "#9467bd", "#8c564b"]);
            this.barData = [];
            this.breakdownX = breakdownX;
            $.each(dataSet, function (i, d) {
                base.barData.push({ [base.breakdownX]: d.BreakdownKey, ["breakdownPopulation"]: d.BreakdownPopulation });
            });
            this.init();
        }

        BreakdownBarChart.prototype.setBarData = function (dataSet, breakdownX) {
            var base = this;
            base.breakdownX = breakdownX;
            base.barData = [];
            $.each(dataSet, function (i, d) {
                base.barData.push({ [base.breakdownX]: d.BreakdownKey, ["breakdownPopulation"]: d.BreakdownPopulation });
            });
            
        }

        BreakdownBarChart.prototype.init = function () {
            var base = this;

            base.svg = d3.select('#pieChart')
             .append("svg")
                .attr("width", base.width + base.margin.left + base.margin.right)
                .attr("height", base.height + base.margin.top + base.margin.bottom)
                .append("g").attr("transform", "translate(" + base.margin.left + "," + base.margin.top + ")");            

            base.render();
        }

        BreakdownBarChart.prototype.render = function () {
            var base = this;
            base.prepareScales();
            base.itemEnter();
            base.prepareAxes();
            base.axesRender();
            //base.tooltipRender();
            base.displayAxisTitles();
            var timeOut = null;
        }

        BreakdownBarChart.prototype.update = function () {
            var base = this;
            base.prepareScales();
            base.itemUpdate();
            base.prepareAxes();
            base.axesUpdate();            
            //base.tooltipRender();
            base.displayAxisTitles();
            var timeOut = null;
        }

        BreakdownBarChart.prototype.prepareScales = function () {
            var base = this;

            base.bars = base.svg.selectAll(".bar")
                .data(base.barData);

            base.bars.exit().remove();
            base.bars.enter().append("rect").attr("class", "bar");

            base.yScale = d3.scale.linear().rangeRound([this.height, 0]);
            base.xScale = d3.scale.ordinal().rangeRoundBands([0, this.width], .5);

            base.yScale.domain([0, d3.max(base.barData, function (d) { return d.breakdownPopulation; })]).clamp(true);
            if (base.breakdownX == "gender")
                base.xScale.domain(["male", "female"]);
            else if (base.breakdownX == "occupationType")
                base.xScale.domain(["active", "sedentary"]);
            else if (base.breakdownX == "age")
                base.xScale.domain(["0-25", "26-40", "41-55", "56-70", "71-85", "86+"]);            
        }

        BreakdownBarChart.prototype.itemEnter = function () {
            var base = this;

            base.bars
                .enter().append("rect")
                    .attr("class", "bar")
                    .style("fill", function (d, i) {
                        return base.color(d[base.breakdownX]);
                    })
                    .attr("x", function (d) {
                        return base.xScale(d[base.breakdownX]);
                    })
                    .attr("width", base.xScale.rangeBand())
                    .attr("y", function (d) {
                        return base.yScale(d.breakdownPopulation);
                    })
                    .transition().delay(300).duration(500).ease("cubic-in-out")
                    .attr("height", function (d) {
                        return base.height - base.yScale(d.breakdownPopulation);
                    });
        }

        BreakdownBarChart.prototype.itemUpdate = function () {
            var base = this;

            base.bars
                .transition().duration(500).ease("cubic-in-out")
                .style("fill", function (d, i) {
                    return base.color(d[base.breakdownX]);
                })
                .attr("x", function (d) {
                    return base.xScale(d[base.breakdownX]);
                })
                .attr("width", base.xScale.rangeBand())
                .attr("y", function (d) {
                    return base.yScale(d.breakdownPopulation);
                })
                .attr("height", function (d) {
                    return base.height - base.yScale(d.breakdownPopulation);
                });
        }

        BreakdownBarChart.prototype.prepareAxes = function () {
            var base = this;
            base.xAxis = d3.svg.axis()
                .scale(base.xScale)
                .orient("bottom")
                .tickFormat(function (d) {
                    return d.substr(0, 1).toUpperCase() + d.substr(1);
                });

            base.yAxis = d3.svg.axis()
                .scale(base.yScale)
                .orient("left")
                .ticks(5);                
        }

        BreakdownBarChart.prototype.axesRender = function () {
            var base = this;

            base.horizontalGrid = base.svg.append("g")
                .attr("class", "grid vertical")
                .selectAll("line.horizontalGrid").data(base.yScale.ticks(5));

            base.horizontalGrid.enter()
                .append("line")
                .attr("class", "horizontalGrid")
                .transition().duration(250)
                .attr("x1", 0)
                .attr("x2", function (d, i) {
                    if (i == 0) {
                        return 0;
                    }
                    else {
                        return base.width;
                    }
                })
                .attr("y1", function (d) {
                    return base.yScale(d);
                })
                .attr("y2", function (d) {
                    return base.yScale(d);
                });

            // Add the X Axis
            base.svg.append("g")
                .attr("class", "axisX")
                .attr("transform", "translate(0," + base.height + ")")
                .call(base.xAxis);

            // Add the Y Axis
            base.svg.append("g")
                .attr("class", "axisY")
                .call(base.yAxis);
        }

        BreakdownBarChart.prototype.axesUpdate = function () {
            var base = this;

            base.horizontalGrid = base.svg.select("g.grid.horizontal")
                .selectAll("line.horizontalGrid")
                .data(base.yScale.ticks(5));

            base.horizontalGrid.enter()
                .append("line")
                .attr("class", "horizontalGrid")
                .attr("y1", 0)
                .attr("y2", 0)
                .transition().duration(250)
                .attr("x1", 0)
                .attr("x2", function (d, i) {
                    if (i == 0) {
                        return 0;
                    }
                    else {
                        return base.width;
                    }
                })
                .attr("y1", function (d) {
                    return base.yScale(d);
                })
                .attr("y2", function (d) {
                    return base.yScale(d);
                });

            base.horizontalGrid //
                .transition().duration(250)
                .attr("x1", 0)
                .attr("x2", this.width)
                .attr("y1", function (d) {
                    return base.yScale(d);
                })
                .attr("y2", function (d) {
                    return base.yScale(d);
                });

            base.horizontalGrid.exit() //
                .transition().duration(250)
                .attr("y1", 0)
                .attr("y2", 0).remove();

            // Add the X Axis
            base.svg.selectAll(".axisX")
                .transition().duration(1000)
                .attr("transform", "translate(0," + base.height + ")")
                .call(base.xAxis.scale(base.xScale));

            // Add the Y Axis
            base.svg.selectAll(".axisY")
                .transition().duration(1000)
                .call(base.yAxis.scale(base.yScale));
        }

        BreakdownBarChart.prototype.displayAxisTitles = function () {
            var base = this;
            d3.select("#labelYTrend").remove();
            d3.select("#labelXTrend").remove();

            //var text;
            //if (userDashboardModule.userDashboardHomeViewModel.selectedComparison() == "sessions")
            //    text = "# of Sessions";
            //else
            //    text = "Duration of Sessions";

            this.svg.append("text")
                .attr("text-anchor", "middle")
                .attr("id", 'labelYTrend')
                .attr("class", 'axisTitle')
                .attr("transform", "translate(-40," + (this.height / 2) + ")rotate(-90)")
                .text("# of Sessions");

            this.svg.append("text")
                .attr("text-anchor", "middle")
                .attr("id", 'labelXTrend')
                .attr("class", 'axisTitle')
                .attr("transform", "translate(" + (this.width / 2) + ", " + (this.height + 25) + ")")
                .text(base.formatLabel(base.breakdownX));
        }

        BreakdownBarChart.prototype.tooltipRender = function () {
            var base = this;
            d3.select('.focusCircle').on("mouseenter", function () {
                event.stopPropagation();
                base.toolTipActive = true;
                base.tooltipOnMouseOver(base.selectedPoint, this, base);
            });
            d3.select('.focusCircle').on("mouseleave", function () {
                event.stopPropagation();
                base.toolTipActive = false;
                base.tooltipOnMouseOut(base.selectedPoint, this, base);
            });
        }

        BreakdownBarChart.prototype.tooltipOnMouseOver = function (d, element, base, q) {
            event.stopPropagation();
            if (d == undefined) {
                return;
            }
            var xPosition = parseInt($(element).attr('cx'));
            var yPosition = parseInt($(element).attr('cy')) + base.margin.top + 10;

            d3.select("#trend .tooltip")
                .style("opacity", 1)
				.style("min-width", "150px")
                .style("z-Index", "301")
                .html(this.tooltipText(d, element));

            if (yPosition > ($("#trend").height() / 2)) {
                yPosition = yPosition - ($(".tooltip").height()) - base.margin.top
            };
            d3.select("#trend .tooltip").style("top", yPosition + "px");
            if (xPosition > ($("#trend svg").width() - base.margin.left - $("#trend .tooltip").width())) {
                xPosition = (xPosition - ($("#trend .tooltip").width() / 1.5));
            };
            d3.select("#trend .tooltip").style("left", xPosition + "px");
        };

        BreakdownBarChart.prototype.tooltipOnMouseOut = function (d, element, base) {
            event.stopPropagation();
            d3.select("#trend .tooltip")
                .style("z-Index", "-1").style("opacity", 0);
        }

        BreakdownBarChart.prototype.tooltipText = function (d, element) {

            //dateString = d.date.toString();

            return "<span>Date: " + d.DateTime + "</span><br/>" + // ToolTip Data.
                    "<span>Process: " + d.Name + "</span><br />" +
                    "<span>Plant: " + d.Value + "</span><br />";
            //"<span>Runs: " + d.UserId + "</span><br/>";
        }

        BreakdownBarChart.prototype.formatLabel = function (text) {
            switch (text) {
                case "age":
                    text = "Age";
                    break;
                case "gender":
                    text = "Gender";
                    break;
                case "occupationType":
                    text = "Occupation Type";
                    break;
            }
            return text;
        }

        return BreakdownBarChart;
    })();

    return breakdownBarChartModule;
}(breakdownBarChartModule || {}));