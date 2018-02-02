var pieChartModule = (function (pieChartModule) {

    var width = $('#pieChart').width() - 20 - 20;
    var height = $('#pieChart').height() - 10 - 10;
    var radius = radius = Math.min(width, height) / 2;
    var arc = d3.svg.arc()
                .outerRadius(radius - 20)
                .innerRadius(0);

    pieChartModule.PieChart = (function () {
        function PieChart(dataSet) {
            var base = this;
            this.margin = { top: 10, right: 20, bottom: 10, left: 20 },
                this.width = $('#pieChart').width() - this.margin.left - this.margin.right,
                this.height = $('#pieChart').height() - this.margin.top - this.margin.bottom,
            
                this.radius = Math.min(base.width, base.height) / 2,
                this.labelr = this.radius + 30;
            this.color = d3.scale.ordinal().domain(["0", "1", "2", "3", "4", ">4"])
                .range(["#6666ff", "#7f7fff", "#9999ff", "#b2b2ff", "#ccccff", "#9f9fce"]);
            this.pieData = dataSet;
            this.init();
        }

        PieChart.prototype.setPieData = function (dataSet) {
            var base = this;
            base.pieData = dataSet;
        }

        PieChart.prototype.init = function () {
            var base = this;

            //tooltip = d3.select('#trend').append("div")
            //    .attr("class", "tooltip")
            //    .style("opacity", 0)
            //    .style("color", "#000000")
            //    .style("background-color", "#FFFFFF")
            //    .style("padding", "5px")
            //    .style("border-radius", "5px")
            //    .style("z-Index", "-1")
            //    .style("border", "2px solid #000");

            base.svg = d3.select('#pieChart')
             .append("svg")
                .attr("width", base.width)
                .attr("height", base.height)
                .attr("transform", "translate(" + base.margin.left + "," + base.margin.top + ")")
             .append("g").attr("transform", "translate(" + (base.width / 2) + "," + (base.height / 2)+ ")")
                .attr("width", base.width)
                .attr("height", base.height);

            base.render();
        }

        PieChart.prototype.render = function () {
            var base = this;
            base.prepareItem();
            base.itemEnter();
            base.tooltipRender();
            var timeOut = null;
        }

        PieChart.prototype.update = function () {
            var base = this;
            base.prepareItem();
            base.itemUpdate();
            //base.tooltipRender();
            var timeOut = null;
        }

        PieChart.prototype.prepareItem = function () {
            var base = this;

            base.pie = d3.layout.pie()
                .sort(null)
                .value(function (d) {
                    return d.Population;
                });

            arc = d3.svg.arc()
                .outerRadius(base.radius - 10)
                .innerRadius(0);

            base.labelArc = d3.svg.arc()
                .outerRadius(base.radius - 20)
                .innerRadius(base.radius - 40);
        }

        PieChart.prototype.itemEnter = function () {
            var base = this;

            base.path = base.svg.selectAll("path")
                .data(base.pie(base.pieData))
                .enter().append("g")
                .attr("class", "arc");

            base.path.append("path")
                .style("fill", function (d, i) {
                    if (d.data.Population > 0)
                        return base.color(d.data.Session);
                })
                .attr("d", arc)
                .on("click", function (d) {
                    dashboardModule.dashboardHomeViewModel.filterFromPieChart(d.data);
                })
                .each(function (d) { this._current = d; });

            //base.arc.selectAll("text").remove();
            base.path.append("text")
                //.attr("transform", function (d) {
                //    return "translate(" + base.label.centroid(d) + ")";
                //})
                .attr("transform", function (d) {
                	var midAngle = d.endAngle < Math.PI ? d.startAngle / 2 + d.endAngle / 2 : d.startAngle / 2 + d.endAngle / 2 + Math.PI;
                	return "translate(" + base.labelArc.centroid(d)[0] + "," + base.labelArc.centroid(d)[1] + ") rotate(-90) rotate(" + (midAngle * 180 / Math.PI) + ")";
                })
	            .attr("dy", ".35em")
	            .attr('text-anchor', 'middle')
                .attr("fill", "white")

                .text(function (d) {
                    if (d.data.Population > 0)
                        return d.data.Session + "(" + d.data.Population + ")";
                });
        }

        PieChart.prototype.itemUpdate = function () {
            var base = this;

            base.path = base.path.data(base.pie(base.pieData));

            base.path.exit().remove();

            base.path
                .enter().append("path")
                .attr("class", "path")
                .attr("d", arc(enterAntiClockwise))
                .each(function (d) {
                    this._current = {
                        data: d.data,
                        value: d.value,
                        startAngle: enterAntiClockwise.startAngle,
                        endAngle: enterAntiClockwise.endAngle
                    };                    
                })
            .style("fill", function (d, i) {
                if (d.data.Population > 0)
                    return
            });

            base.path.exit()
              .transition()
              .duration(750)
              .attrTween('d', base.arcTweenOut)
              .remove();

            base.path.transition().duration(750).attrTween("d", base.arcTween);

            //base.arc.selectAll("text").remove();
            //base.arc.append("text")
            //    .attr("transform", function (d) {
            //        return "translate(" + base.label.centroid(d) + ")";
            //    })
            //    .text(function (d) {
            //        if (d.data.Population > 0)
            //            return d.data.Session + "(" + d.data.Population + ")";
            //    });
        }

        PieChart.prototype.tooltipRender = function () {
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

        PieChart.prototype.tooltipOnMouseOver = function (d, element, base, q) {
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

        PieChart.prototype.tooltipOnMouseOut = function (d, element, base) {
            event.stopPropagation();
            d3.select("#trend .tooltip")
                .style("z-Index", "-1").style("opacity", 0);
        }

        PieChart.prototype.tooltipText = function (d, element) {

            //dateString = d.date.toString();

            return "<span>Date: " + d.DateTime + "</span><br/>" + // ToolTip Data.
                    "<span>Process: " + d.Name + "</span><br />" +
                    "<span>Plant: " + d.Value + "</span><br />";
            //"<span>Runs: " + d.UserId + "</span><br/>";
        }

        PieChart.prototype.arcTween = function (a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function (t) {
                return arc(i(t));
            };
        }

        PieChart.prototype.arcTweenOut = function (a) {
            var i = d3.interpolate(this._current, { startAngle: Math.PI * 2, endAngle: Math.PI * 2, value: 0 });
            this._current = i(0);
            return function (t) {
                return arc(i(t));
            };
        }

        var enterAntiClockwise = {
            startAngle: Math.PI * 2,
            endAngle: Math.PI * 2
        };

        return PieChart;
    })();

    return pieChartModule;
}(pieChartModule || {}));