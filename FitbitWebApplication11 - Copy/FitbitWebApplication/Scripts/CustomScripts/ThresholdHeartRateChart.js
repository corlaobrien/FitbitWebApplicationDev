var thresholdHeartRateChartModule = (function (thresholdHeartRateChartModule) {

    thresholdHeartRateChartModule.ThresholdHRChart = (function () {
        function ThresholdHRChart(dataSet, spinner) {
            var base = this;
            this.margin = { top: 20, right: 20, bottom: 60, left: 50 },
                this.width = $('#thresholdTrend').width() - this.margin.left - this.margin.right,
                this.height = $('#thresholdTrend').height() - this.margin.top - this.margin.bottom;
            this.xTicks = this.width / 80;
            this.circle;
            this.toolTipActive = false;
            this.percentages = [];
            //this.trendData = dataSet.result;
            this.movingAverage = dataSet.resultList;
            this.trendData = dataSet.result;
            //this.trendData = this.trendDataUnsorted.sort(function (a, b) {
            //    return new Date(a.DateTime) - new Date(b.DateTime);
            //});
            this.sections = [];           

            //this.points = dataSet;
            this.spinner = spinner;
            this.x, this.y;
            //this.points = dataSet;

            this.minXValue = new Date(this.trendData[0].DateTime);
            this.maxXValue = new Date(base.trendData[base.trendData.length - 1].DateTime);

            this.maxYValue = d3.max(this.trendData, function (d) { return parseInt(d.Value); });
            this.minYValue = d3.min(this.trendData, function (d) { return parseInt(d.Value); });

            this.init();
        }

        ThresholdHRChart.prototype.init = function () {
            var base = this;            

            tooltip = d3.select('#thresholdTrend').append("div")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .style("color", "#000000")
                .style("background-color", "#FFFFFF")
                .style("padding", "5px")
                .style("border-radius", "5px")
                .style("z-Index", "-1")
                .style("border", "2px solid #000");

            base.svg = d3.select('#thresholdTrend')
             .append("svg")
             .attr("width", base.width + base.margin.left + base.margin.right)
             .attr("height", base.height + base.margin.top + base.margin.bottom)
             .append("g")
                .attr("class", "container")
                .attr("transform", "translate(" + base.margin.left + "," + base.margin.top + ")");

            base.render();         
        }

        ThresholdHRChart.prototype.render = function () {
            var base = this;
            base.prepareScales();
            base.prepareData();
            base.prepareItem();
            base.prepareAxes(); 
            base.axesRender();
            base.itemEnter();
            base.prepareCrossHairs();                        
            base.tooltipRender();
            base.displayAxisTitles();
            base.drawThreshold();
            var timeOut = null;
            $(window).on('resize', function () {
                if (timeOut != null) clearTimeout(timeOut);
                timeOut = setTimeout(function () {
                    base.resize()
                }, 500);
            });
        }

        ThresholdHRChart.prototype.drawThreshold = function () {
            var base = this;
            this.lastTrue = null;
            base.percentages = [];
            $.each(base.trendData, function (j, data) {
                $.each(base.movingAverage, function (i, d) {
                    if (d.DateTime == data.DateTime && base.lastTrue != j - 1) {
                        var x = parseInt(d3.select($('.' + j)[0]).attr("cx")) / base.width;
                        base.percentages[base.percentages.length] = { start: x * 100, end: x * 100 };
                        base.lastTrue = j;
                    }
                    else if (d.DateTime == data.DateTime && base.lastTrue == j - 1) {
                        base.lastTrue = j;
                    }
                });

                if (base.percentages.length > 0) {
                    var x;
                    if(base.lastTrue < (base.trendData.length - 1))
                        x = parseInt(d3.select($('.' + (base.lastTrue + 1))[0]).attr("cx")) / base.width;
                    else if (base.lastTrue == (base.trendData.length - 1))
                        x = parseInt(d3.select($('.' + (base.lastTrue))[0]).attr("cx")) / base.width;
                    base.percentages[base.percentages.length - 1].end = x * 100;
                }
            });

            var linearGradientData = [];
            linearGradientData.push({ offset: "0%", color: "steelblue" });
            $.each(base.percentages, function (i, d) {
                linearGradientData.push({ offset: d.start.toString() + "%", color: "steelblue" });
                linearGradientData.push({ offset: d.start.toString() + "%", color: "red" });
                linearGradientData.push({ offset: d.end.toString() + "%", color: "red" });
                linearGradientData.push({ offset: d.end.toString() + "%", color: "steelblue" });
            });
            linearGradientData.push({ offset: "100%", color: "steelblue" });

            d3.select("#threshold-gradient").remove();
            base.svg.append("linearGradient")
                .attr("id", "threshold-gradient")
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", base.width).attr("y2", 0)
              .selectAll("stop")
                .data(linearGradientData)
              .enter().append("stop")
                .attr("offset", function (d) { return d.offset; })
                .attr("stop-color", function (d) { return d.color; });
        }

        ThresholdHRChart.prototype.displayAxisTitles = function () {
            d3.select("#labelYTrend").remove();
            d3.select("#labelXTrend").remove();

            this.svg.append("text")
                .attr("text-anchor", "middle")
                .attr("id", 'labelYTrend')
                .attr("class", 'axisTitle')
                .attr("transform", "translate(-40," + (this.height / 2) + ")rotate(-90)")
                .text("Heart Rate (bpm)");

            this.svg.append("text")
                .attr("text-anchor", "end")
                .attr("id", 'labelXTrend')
                .attr("class", 'axisTitle')
                .attr("transform", "translate(" + (this.width / 2) + ", " + (this.height + 30) + ")")
                .text("Date/Time");
        }

        ThresholdHRChart.prototype.prepareScales = function () {
            var base = this;

            var parseTime = d3.time.format("%d-%b %H:%M");
            this.xExtent = d3.extent(base.trendData, function (d, i) {
                return new Date(d.DateTime);
            });
            base.zoom = d3.behavior.zoom().on("zoom", base.redraw());
            base.x = d3.time.scale().domain(d3.extent(base.trendData, function (d) { return new Date(d.DateTime); })).rangeRound([0, base.width]);
            base.y = d3.scale.linear().domain(d3.extent(base.trendData, function (d) { return parseFloat(d.Value); })).rangeRound([base.height, 0]);            
        }

        ThresholdHRChart.prototype.prepareData = function () {
            var base = this;
            base.data = d3.nest().key(function (d) {
                return "none";
            }).entries(this.trendData);
        }

        ThresholdHRChart.prototype.prepareItem = function () {
            var base = this;

            base.lineLayout = d3.svg.line()                
                .x(function (d) {
                    return base.x(new Date(d.DateTime));
                })
                .y(function (d) { return base.y(parseFloat(d.Value)); });            

            base.circle = this.svg.selectAll("circle.trendDot")
                .data(base.trendData);

            base.clip = base.svg.append("svg:clipPath")
                .attr("id", "clip")
                .append("svg:rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", base.width)
                .attr("height", base.height);

            base.lines = base.svg.selectAll("path.lineNormal")
                .data(base.data);
        }

        ThresholdHRChart.prototype.itemEnter = function () {
            var base = this;            

            base.lines
                .enter()
                .append("path")
                .attr("clip-path", "url(#clip)")
                .attr("height", base.height)
                .attr("width", base.width)
                .attr("class", function (d) {
                    return "line lineNormal";
                })
                .attr("stroke-width", "2")
                .attr("fill", "none")
                .attr("x", function (d) {
                    return base.x(new Date(d.DateTime));
                })
                .attr("y", function (d) {
                    return base.y(parseFloat(d.Value));
                })
                .attr("cx", function (d) {
                    return base.x(new Date(d.DateTime));
                })
                .attr("cy", function (d) {
                    return base.y(parseFloat(d.Value));
                })
                .attr("d", function (d) {
                    return base.lineLayout(d.values);

                    //if (parseInt(d.Value) <= 100) {
                    //    return base.lineLayout(d).attr("stroke", "steelblue")
                    //}
                })
                .attr('data-flagged', function (d) {
                    if (parseInt(d.Value) > 100) {
                        flagged = true;
                        return true;
                    } else {
                        return false;
                    }
                });

            base.circle
                .enter()
                .append("circle")
                .attr("clip-path", "url(#clip)")
                .attr("class", function (d, i) {
                    return "trendDot " + d.ID + " " + i;
                })
                .attr("fill", "steelblue")
                .attr("r", 1)
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
        }

        ThresholdHRChart.prototype.prepareAxes = function () {
            var base = this;           

            base.xAxis = d3.svg.axis()
                .scale(base.x)
                .orient("bottom")
                .ticks(base.xTicks);

            base.yAxis = d3.svg.axis()
                .scale(base.y)
                .orient("left")
                .ticks(5)
                .tickFormat(function (d, i) {
                    return d;
                });
        }

        ThresholdHRChart.prototype.axesRender = function () {
            var base = this;
            base.svg.append("linearGradient")
                            .attr("id", "threshold-gradient")
                            .attr("gradientUnits", "userSpaceOnUse")
                            .attr("x1", 0).attr("y1", 0)
                            .attr("x2", base.width).attr("y2", 0)
                          .selectAll("stop")
                            .data([
                              { offset: "0%", color: "steelblue" },
                              { offset: "100%", color: "steelblue" }
                            ])
                          .enter().append("stop")
                            .attr("offset", function (d) { return d.offset; })
                            .attr("stop-color", function (d) { return d.color; });

            base.xAxisGroup = base.svg.append("g");
            base.yAxisGroup = base.svg.append("g");

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
            base.gx = base.xAxisGroup.selectAll("g.x")
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
                .text(base.fx);

            base.gx.exit().remove();

            // Regenerate y-ticks…
            base.gy = base.yAxisGroup.selectAll("g.y")
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
                .text(base.fy);

            base.gy.exit().remove();            
        }

        ThresholdHRChart.prototype.prepareCrossHairs = function () {
            base = this;
            base.plot = base.svg.append('rect')
                .attr('class', 'overlay')
                .attr('width', base.width + 10)
                .attr('height', base.height)
                .on('mousemove', function () {
                    if (base.toolTipActive) {
                        event.stopPropagation();
                        return false;
                    }
                    var mouse = d3.mouse(this);
                    var mouseDate, mouseYPoint;
                    var i;                    
                    
                    mouseDate = base.x.invert(mouse[0]);
                    i = bisectDate(base.trendData, mouseDate, 1); // returns the index to the current data item
                    mouseYPoint = base.y.invert(mouse[1]);

                    if (i == 0) {
                        base.selectedPoint = base.trendData[0];
                    } else if (i == base.trendData.length) {
                        base.selectedPoint = base.trendData[i - 1];
                    }
                    else {
                        var d0 = base.trendData[i - 1]
                        var d1 = base.trendData[i];
                        // work out which date value is closest to the mouse
                        base.selectedPoint = mouseDate - new Date(d0.DateTime) > new Date(d1.DateTime) - mouseDate ? d1 : d0;
                    }
                    
                    if (base.selectedPoint == null || base.selectedPoint == undefined)
                        return;

                    var x = base.x(new Date(base.selectedPoint.DateTime));
                    var y = base.y(parseFloat(base.selectedPoint.Value));

                    with (focus) {
                        style('display', null);
                        select('.focusCircle')
                            .attr('cx', x)
                            .attr('cy', y);
                        //select('#focusLineX')
                        //    .attr('x1', x).attr('y1', 0)
                        //    .attr('x2', x).attr('y2', base.height);
                        //select('#focusLineY')
                        //    .attr('x1', 0).attr('y1', y)
                        //    .attr('x2', base.width).attr('y2', y)
                        //select('.focusText')
                        //    .text(base.selectedPoint.Value)
                        //    .attr('x', x + 5)
                        //    .attr('dy', y - 5);
                    }
                })
            this.plot.call(base.zoom);
            var focus = base.svg.append('g').attr("class", "focusGroup").style('display', 'none');
            with (focus) {
                append('line')
                    .attr('id', 'focusLineX')
                    .attr('class', 'focusLine')
                append('line')
                    .attr('id', 'focusLineY')
                    .attr('class', 'focusLine')
                append('circle')
                    .attr('r', 5)
                    .attr('class', 'focusCircle')
                append('text')
                    .attr('class', 'focusText');
            }
            var bisectDate = d3.bisector(function (d) {
                return new Date(d.DateTime);
            }).left;

            base.svg.on('mouseleave', function () {
                focus.style('display', 'none');
                event.stopPropagation();
            });

            base.plot.call(d3.behavior.zoom().x(base.x).on("zoom", base.redraw()));
        }

        ThresholdHRChart.prototype.positionXCrossHairs = function (mouse) {
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

        ThresholdHRChart.prototype.tooltipRender = function () {
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

        ThresholdHRChart.prototype.tooltipOnMouseOver = function (d, element, base, q) {
            event.stopPropagation();
            if (d == undefined) {
                return;
            }
            var xPosition = parseInt($(element).attr('cx'));
            var yPosition = parseInt($(element).attr('cy')) + base.margin.top + 10;

            d3.select("#thresholdTrend .tooltip")
                .style("opacity", 1)
				.style("min-width", "150px")
                .style("z-Index", "301")
                .html(this.tooltipText(d, element));

            if (yPosition > ($("#thresholdTrend").height() / 2)) {
                yPosition = yPosition - ($(".tooltip").height()) - base.margin.top - 20
            };
            d3.select("#thresholdTrend .tooltip").style("top", yPosition + "px");
            if (xPosition > ($("#thresholdTrend svg").width() - base.margin.left - $("#thresholdTrend .tooltip").width())) {
                xPosition = (xPosition - ($("#thresholdTrend .tooltip").width() / 1.5));
            };
            d3.select("#thresholdTrend .tooltip").style("left", xPosition + "px");
        };

        ThresholdHRChart.prototype.tooltipOnMouseOut = function (d, element, base) {
            event.stopPropagation();
            d3.select("#thresholdTrend .tooltip")
                .style("z-Index", "-1").style("opacity", 0);
        }

        ThresholdHRChart.prototype.tooltipText = function (d, element) {
            return "<span>Date: " + d.DateTime + "</span><br/>" + // ToolTip Data.
                    "<span>Name: " + d.Name + "</span><br />" +
                    "<span>Value: " + d.Value + "</span><br />";
                    //"<span>Runs: " + d.UserId + "</span><br/>";
        }

        ThresholdHRChart.prototype.refresh = function () {
            var base = this;

            base.lines = base.svg.select("path")
                //.datum(base.points)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("shape-rendering", "geometricPrecision")
                .attr("stroke-width", "2px")
                .attr("fill", "none")
                .attr("x", function (d) {
                    return base.x(new Date(d.DateTime));
                })
                .attr("y", function (d) {
                    return base.y(parseFloat(d.Value));
                })
                .attr("d", function (d) {
                    return base.lineLayout(d.values);
                });

            base.circle = base.svg.selectAll("circle.trendDot")
                .attr("clip-path", "url(#clip)")
                .attr("class", function (d, i) {
                    return "trendDot " + d.ID + " " + i;
                })
                .attr("fill", "steelblue")
                .attr("r", 1)
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

            base.drawThreshold();

            if (d3.event && d3.event.keyCode) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        }

        ThresholdHRChart.prototype.redraw = function () {
            var base = this;

            return function () {
                //if (base.x.domain()[0] >= base.minXValue && base.x.domain()[1] <= base.maxXValue && base.y.domain()[0] <= base.maxYValue && base.y.domain()[1] >= base.minYValue)


                if (base.x.domain()[0] < base.minXValue) {
                    base.x.domain([base.minXValue, base.x.domain()[1]]);
                    base.redraw()();
                    return;
                }
                else if(base.x.domain()[1] > base.maxXValue) {
                    base.x.domain([base.x.domain()[0], base.maxXValue]);
                    base.redraw()();
                    return;
                }
                else if(base.y.domain()[0] < base.minYValue) {
                    base.y.domain([base.minYValue, base.y.domain()[1]]);
                    base.redraw()();
                    return;
                }
                else if(base.y.domain()[1] > base.maxYValue) {
                    base.y.domain([base.y.domain()[0], base.maxYValue]);
                    base.redraw()();
                    return;
                }
                else
                {
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
                    base.gx = base.xAxisGroup.selectAll("g.x")
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
                        .text(base.fx);

                    base.gx.exit().remove();

                    // Regenerate y-ticks…
                    base.gy = base.yAxisGroup.selectAll("g.y")
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
                        .text(base.fy);

                    base.gy.exit().remove();
                    base.plot.call(d3.behavior.zoom().x(base.x).on("zoom", base.redraw()));
                    base.refresh();
                }
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

        return ThresholdHRChart;
    })();

    return thresholdHeartRateChartModule;
}(thresholdHeartRateChartModule || {}));