var leftButtonDown = false;

$(document).mousedown(function (e) {
    // Left mouse button was pressed, set flag
    if (e.which === 1) leftButtonDown = true;
});
$(document).mouseup(function (e) {
    // Left mouse button was released, clear flag
    if (e.which === 1) leftButtonDown = false;
});



var heartRateChartModule = (function (heartRateChartModule) {   

    heartRateChartModule.HRChart = (function () {
        function HRChart(dataSet, annotation, spinner) {
            var base = this;
            this.margin = { top: 20, right: 20, bottom: 60, left: 50 },
                this.width = $('#trend').width() - this.margin.left - this.margin.right,
                this.height = $('#trend').height() - this.margin.top - this.margin.bottom;
            this.xTicks = this.width / 80;
            this.toolTipActive = false;
            this.trendDataUnsorted = dataSet;
            this.trendData = this.trendDataUnsorted.sort(function (a, b) {
                return new Date(a.DateTime) - new Date(b.DateTime);
            });
            this.points = dataSet
            this.spinner = spinner;
            this.x, this.y;
            this.parseTime = d3.time.format("%d-%b %H:%M");
            this.savedAnnotations = annotation;
            this.annotation = ["", ""];
            this.annotationPercentage = ["", ""];
            this.percentages = [];
            this.annotationInfoPosition = [];
            this.annotationInterval;
            this.icons;

            if (this.trendData != null && this.trendData != undefined && this.trendData.length > 0) {

                this.minXValue = new Date(this.trendData[0].DateTime);
                this.maxXValue = new Date(base.trendData[base.trendData.length - 1].DateTime);

                this.maxYValue = d3.max(this.trendData, function (d) { return parseInt(d.Value); });
                this.minYValue = d3.min(this.trendData, function (d) { return parseInt(d.Value); });

                this.init();
            }
        }

        HRChart.prototype.init = function () {
            var base = this;            

            tooltip = d3.select('#trend').append("div")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .style("color", "#000000")
                .style("background-color", "#FFFFFF")
                .style("padding", "5px")
                .style("border-radius", "5px")
                .style("z-Index", "-1")
                .style("border", "2px solid #000");

            base.svg = d3.select('#trend')
             .append("svg")
             .attr("width", base.width + base.margin.left + base.margin.right)
             .attr("height", base.height + base.margin.top + base.margin.bottom)
             .append("g")
                .attr("class", "container")
                .attr("transform", "translate(" + base.margin.left + "," + base.margin.top + ")");

            base.render();         
        }

        HRChart.prototype.updateAnnotation = function (newAnnotations) {
            var base = this;

            $.each(newAnnotations, function(i, d) {
                base.savedAnnotations.push(d)
            });

            base.drawAnnotations();
        }

        HRChart.prototype.render = function () {
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
            base.drawAnnotations();
            var timeOut = null;
            $(window).on('resize', function () {
                if (timeOut != null) clearTimeout(timeOut);
                timeOut = setTimeout(function () {
                    base.resize()
                }, 500);
            });
        }

        HRChart.prototype.drawAnnotations = function () {
            var base = this;
            base.annotationInfoPosition = [];
            base.annotation = ["", ""];
            base.annotationPercentage = ["", ""];
            base.percentages = [];
            base.svg.selectAll(".annotation-tooltips").remove();

            base.savedAnnotations.sort(function (a, b) {
                return new Date(a.start) - new Date(b.start);
            });
            $.each(base.trendData, function (j, data) {
                $.each(base.savedAnnotations, function (i, d) {
                    if (new Date(d.DateTimeStart).toUTCString() == new Date(data.DateTime).toUTCString()) {
                        base.annotationInfoPosition.push({ x: parseInt(d3.select($('.' + j)[0]).attr("cx")), y: base.y(data.Value), description: d.Description, tags: d.Tags });
                        var x = parseInt(d3.select($('.' + j)[0]).attr("cx")) / base.width;
                        base.percentages[base.percentages.length] = { start: x * 100, end: x * 100, type: 'existing' };
                    }
                    else if (new Date(d.DateTimeEnd).toUTCString() == new Date(data.DateTime).toUTCString()) {
                        var x = parseInt(d3.select($('.' + j)[0]).attr("cx")) / base.width;
                        base.percentages[base.percentages.length - 1].end = x * 100;
                    }
                });
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

            d3.select("#annotation-gradient").remove();
            base.svg.append("linearGradient")
                .attr("id", "annotation-gradient")
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", base.width).attr("y2", 0)
              .selectAll("stop")
                .data(linearGradientData)
              .enter().append("stop")
                .attr("offset", function (d) { return d.offset; })
                .attr("stop-color", function (d) { return d.color; });
            
            $.each(base.annotationInfoPosition, function (i, d) {
                //var circle = base.svg.append("g").attr("class", "annotation-tooltips");
                var group = base.svg.append("g").attr("class", "annotation-tooltips")
                    .on("mouseover", function () {
                        group.select("rect").transition().duration(500).attr("width", "150px").attr("height", "50px");
                        group.select("text").transition().duration(500).attr("x", d.x + 12).attr("y", d.y - 22).attr("height", "150px");
                        group.append("g")
                            .on("mouseover", function () {
                                group.select("rect").transition().duration(500).attr("width", "150px").attr("height", "150px");
                                group.select("text").transition().duration(500).attr("x", d.x + 12).attr("y", d.y - 22).attr("height", "150px");
                            })
                            .append("text")
                            .on("mouseover", function () {
                                group.select("rect").transition().duration(500).attr("width", "150px").attr("height", "150px");
                                group.select("text").transition().duration(500).attr("x", d.x + 12).attr("y", d.y - 22).attr("height", "150px");
                            })
                            .attr("class", "annotationText")
                            .text(d.description)
                            .attr("x", d.x + 30)
                            .attr("y", d.y - 20)
                            .attr("width", "400px")
                            .attr("height", "150px")                            
                            .call(wrap, 130, d.description, d.tags);
                    })
                    .on("mouseout", function () {
                        group.select("rect").transition().duration(500).attr("width", "15px").attr("height", "15px");
                        group.select("text").transition().duration(500).attr("x", d.x + 10).attr("y", d.y - 25).attr("height", "150px");
                        base.svg.selectAll(".annotationText").remove();
                    });
                group.append("rect")
                    .attr("x", d.x + 9)
                    .attr("y", d.y - 38)
                    .attr("rx", 6)
                    .attr("ry", 6)
                    .style("color", "white")
                    .attr("width", "15px")
                    .attr("height", "15px");
                group.append("text")
                    .attr("x", d.x + 10)
                    .attr("y", d.y - 25)
                    .attr('font-family', 'FontAwesome')
                    .attr('font-size', '1em')
                    .text(function (d) { return '\uF05A' })
            });
        }

        HRChart.prototype.displayAxisTitles = function () {
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

        HRChart.prototype.prepareScales = function () {
            var base = this;
            this.xExtent = d3.extent(base.trendData, function (d, i) {
                return new Date(d.DateTime);
            });
            base.zoom = d3.behavior.zoom().on("zoom", base.redraw());
            base.x = d3.time.scale().domain(d3.extent(base.trendData, function (d) { return new Date(d.DateTime); })).rangeRound([0, base.width]);
            base.y = d3.scale.linear().domain(d3.extent(base.trendData, function (d) { return parseFloat(d.Value); })).rangeRound([base.height, 0]);
        }

        HRChart.prototype.prepareData = function () {
            var base = this;
            base.data = d3.nest().key(function (d) {
                return "none";
            }).entries(this.trendData);
        }

        HRChart.prototype.prepareItem = function () {
            var base = this;

            base.lineLayout = d3.svg.line()
                .x(function (d) {
                    return base.x(new Date(d.DateTime));
                })
                .y(function (d) { return base.y(parseFloat(d.Value)); });            

            base.clip = base.svg.append("svg:clipPath")
                .attr("id", "clip")
                .append("svg:rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", base.width)
                .attr("height", base.height);

            base.lines = base.svg.selectAll("path.lineNormal")
                .data(base.data);

            base.circle = base.svg.selectAll("circle.trendDot")
                .data(base.trendData);
        }

        HRChart.prototype.itemEnter = function () {
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
                .attr("stroke", "steelblue")
                .attr("stroke-width", "2")
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

        HRChart.prototype.prepareAxes = function () {
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

        HRChart.prototype.axesRender = function () {
            var base = this;

            base.svg.append("linearGradient")
                            .attr("id", "annotation-gradient")
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
                .text(function (d) {
                    return base.parseTime(d);
                });

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
                .style("font-size", "10px")
                .attr("text-anchor", "middle")
                .text(function (d) {
                    return base.parseTime(d);
                });

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

        HRChart.prototype.prepareCrossHairs = function () {
            base = this;

            base.plot = base.svg.append('rect')
                .attr('class', 'overlay')
                .attr('width', base.width + 10)
                .attr('height', base.height)                
                .on('mousemove', function () {
                    //if (!leftButtonDown) {
                    //    console.log("mousemove");
                    //    if (base.toolTipActive) {
                    //        event.stopPropagation();
                    //        return false;
                    //    }
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
                    //        // work out which date value is closest to the mouse
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
                    //}
                });
                    
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
                    .attr('r', 4)
                    .attr('class', 'focusCircle')
                append('text')
                    .attr('class', 'focusText');
            }

            d3.selectAll("circle.focusCircle")
                .on('click', function (d) {
                    var ID = base.selectedPoint.ID;
                    var DateTime = base.selectedPoint.DateTime;
                    var mouse = d3.mouse(this);
                    if (base.annotation[0] == "")
                    {
                        var percentage = mouse[0] / base.width;
                        base.annotationPercentage[0] = percentage;

                        base.annotation[0] = DateTime;
                        $("." + ID).attr("stroke", "green").attr("color", "green").attr("r", 3);
                    }
                    else if (base.annotation[0] != "" && base.annotation[1] == "")
                    {
                        var percentage = mouse[0] / base.width;

                        if (percentage < base.annotationPercentage[0])
                        {
                            base.annotation = ["", ""];
                            base.annotationPercentage = ["", ""];
                            $(".trendDot").attr("stroke", "steelblue").attr("r", 1);
                            var percentage = mouse[0] / base.width;
                            base.annotationPercentage[0] = percentage;

                            base.annotation[0] = DateTime;
                            $("." + ID).attr("stroke", "green").attr("color", "green").attr("r", 3);
                            return
                        }
                        base.annotationPercentage[1] = percentage;

                        base.annotation[1] = DateTime;
                        $("." + ID).attr("stroke", "green").attr("color", "green").attr("r", 3);
                        
                        base.percentages.push({ start: base.annotationPercentage[0] * 100, end: base.annotationPercentage[1] * 100, type: 'new' });
                        base.percentages.sort(function (a, b) {
                            return new Date(a.start) - new Date(b.start);
                        });

                        var linearGradientData = [];
                        linearGradientData.push({ offset: "0%", color: "steelblue" });
                        $.each(base.percentages, function (i, d) {
                            if (d.type == 'existing') {
                                linearGradientData.push({ offset: d.start.toString() + "%", color: "steelblue" });
                                linearGradientData.push({ offset: d.start.toString() + "%", color: "red" });
                                linearGradientData.push({ offset: d.end.toString() + "%", color: "red" });
                                linearGradientData.push({ offset: d.end.toString() + "%", color: "steelblue" });
                            }
                            else {
                                linearGradientData.push({ offset: d.start.toString() + "%", color: "steelblue" });
                                linearGradientData.push({ offset: d.start.toString() + "%", color: "lime" });
                                linearGradientData.push({ offset: d.end.toString() + "%", color: "lime" });
                                linearGradientData.push({ offset: d.end.toString() + "%", color: "steelblue" });
                            }
                        });
                        linearGradientData.push({ offset: "100%", color: "steelblue" });                        

                        d3.select("#annotation-gradient").remove();
                        base.svg.append("linearGradient")
                            .attr("id", "annotation-gradient")
                            .attr("gradientUnits", "userSpaceOnUse")
                            .attr("x1", 0).attr("y1", 0)
                            .attr("x2", base.width).attr("y2", 0)
                          .selectAll("stop")
                            .data(linearGradientData)
                          .enter().append("stop")
                            .attr("offset", function (d) { return d.offset; })
                            .attr("stop-color", function (d) { return d.color; });

                        var circle = base.svg.append("g").attr("class", "annotation-tooltips");
                        circle.append("rect")
                            .attr("x", mouse[0] - 23)
                            .attr("y", mouse[1] - 45)
                            .attr("rx", 6)
                            .attr("ry", 6)
                            .style("color", "white")
                            .attr("width", "30px")
                            .attr("height", "30px");
                            
                        circle.append("text")
                            .attr("x", mouse[0] - 20)
                            .attr("y", mouse[1] - 20)
                            .attr('font-family', 'FontAwesome')
                            .attr('font-size', '2em')
                            .text(function (d) { return '\uF0C7' })
                            .style("color", "lime")
                            .on("mouseover", function () {
                                circle.select("rect").transition().duration(500).attr("width", "150px");
                                base.svg.append("g").attr("class", "annotationText").style("color", "lime")
                                    .append("text")
                                    .text("Save Annotation")
                                .attr("x", mouse[0] + 10)
                                .attr("y", mouse[1] - 25)
                            })
                            .on("mouseout", function () {
                                circle.select("rect").transition().duration(500).attr("width", "30px");
                                base.svg.selectAll(".annotationText").remove();
                            })
                            .on("click", function () {
                                $("#saveAnnotation").modal("show");
                            });
                            
                    }
                    else {
                        base.drawAnnotations();

                        base.annotation = ["", ""];
                        base.annotationPercentage = ["", ""];
                        $(".trendDot").attr("stroke", "steelblue").attr("r", 1);
                        var percentage = mouse[0] / base.width;
                        base.annotationPercentage[0] = percentage;

                        base.annotation[0] = DateTime;
                        $("." + ID).attr("stroke", "green").attr("color", "green").attr("r", 3);
                    }
                })

            var bisectDate = d3.bisector(function (d) {
                return new Date(d.DateTime);
            }).left;

            base.svg.on('mouseleave', function () {
                focus.style('display', 'none');
                event.stopPropagation();
            });

            base.plot.call(d3.behavior.zoom().x(base.x).on("zoom", base.redraw()));
        }

        HRChart.prototype.positionXCrossHairs = function (mouse) {
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

        HRChart.prototype.tooltipRender = function () {
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

        HRChart.prototype.tooltipOnMouseOver = function (d, element, base, q) {
            event.stopPropagation();
            if (d == undefined) {
                return;
            }
            var xPosition = parseInt($(element).attr('cx'));
            var yPosition = parseInt($(element).attr('cy')) + base.margin.top + 100;

            d3.select("#trend .tooltip")
                .style("opacity", 1)
				.style("min-width", "150px")
                .style("z-Index", "301")
                .html(this.tooltipText(d, element));

            if (yPosition > ($("#trend").height() / 2)) {
                yPosition = yPosition - ($(".tooltip").height()) - base.margin.top - 20
            };
            d3.select("#trend .tooltip").style("top", yPosition + "px");
            if (xPosition > ($("#trend svg").width() - base.margin.left - $("#trend .tooltip").width())) {
                xPosition = (xPosition - ($("#trend .tooltip").width() / 1.5));
            };
            d3.select("#trend .tooltip").style("left", xPosition + "px");
        };

        HRChart.prototype.tooltipOnMouseOut = function (d, element, base) {
            event.stopPropagation();
            d3.select("#trend .tooltip")
                .style("z-Index", "-1").style("opacity", 0);
        }

        HRChart.prototype.tooltipText = function (d, element) {
            
            //dateString = d.date.toString();

            return "<span>Date: " + d.DateTime + "</span><br/>" + // ToolTip Data.
                    "<span>Health Key: " + d.Name + "</span><br />" +
                    "<span>Health Value: " + d.Value + "</span><br />";
                    //"<span>Runs: " + d.UserId + "</span><br/>";
        }

        HRChart.prototype.refresh = function () {
            var base = this;

            base.lines = base.svg.select("path")
                //.datum(base.points)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", "steelblue")
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
                //.attr("class", function (d) {
                //    return "trendDot " + d.ID + " " + i;
                //})
                .attr("stroke", "steelblue")
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

            base.drawAnnotations();


            if (d3.event && d3.event.keyCode) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        }

        HRChart.prototype.redraw = function () {
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
                        .text(function (d) {
                            return base.parseTime(d);
                        });

                    base.gxe = base.gx.enter().insert("g", "a")
                        .attr("class", "x")
                        .attr("transform", base.tx);

                    base.gxe.append("line")
                        .attr("stroke", base.stroke)
                        .attr("y1", 0)
                        .attr("y2", base.height);

                    base.gxe.append("text")
                        .attr("class", "axis")
                        .style("font-size", "10px")
                        .attr("y", base.height)
                        .attr("dy", "1em")
                        .attr("text-anchor", "middle")
                        .text(function (d) {
                            return base.parseTime(d);
                        });

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

        function wrap(text, width, description, savedTags) {
            text.each(function () {
                var text = d3.select(this),
                    words = description.split(/\s+/).reverse(),
                    word,
                    tags = savedTags.split(/\s+/).reverse(),
                    tag,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    x = text.attr("x"),
                    y = text.attr("y"),
                    dy = 0, //parseFloat(text.attr("dy")),
                    tspan = text.text(null)
                                .append("tspan")
                                .attr("x", x)
                                .attr("y", y)
                                .attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan")
                                    .attr("x", x)
                                    .attr("y", y)
                                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                    .text(word);                        
                    }
                }
                //tspan.append("&#xA &#xA");
                //tspan.append("Tags: &#xA");
                //while (tag = tags.pop()) {
                //    line.push(tag);
                //    tspan.text(line.join(" "));
                //    if (tspan.node().getComputedTextLength() > width) {
                //        line.pop();
                //        tspan.text(line.join(" "));
                //        line = [tag];
                //        tspan = text.append("tspan")
                //                    .attr("x", x)
                //                    .attr("y", y)
                //                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                //                    .text(tag + "\n");
                //    }
                //}
            });
        }

        return HRChart;
    })();

    return heartRateChartModule;
}(heartRateChartModule || {}));