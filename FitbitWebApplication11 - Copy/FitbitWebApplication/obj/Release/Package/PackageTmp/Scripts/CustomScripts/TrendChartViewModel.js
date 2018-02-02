var trendChartModule = (function (trendChartModule) {

    //var __bind = function (fn, me) { return function () { return fn.apply(me, arguments); }; };
    //var spinner;
    //var decapFirstLetter = function (text) {
    //    return text.substr(0, 1).toLowerCase() + text.substr(1);
    //}
    //var formatMeasureName = function (text) {
    //    if (text == "soeRate") return "SOE Rate";
    //    if (text == "TestFPY") return "Test FPY %";
    //    if (text == "CleanRun") return "CleanRun %";
    //    if (text == "ct") return "Cycle Time - Hrs";
    //    text = text.replace("_", " ");
    //    for (var i = 0; i < text.substr(1).length; i++) {
    //        if (text.substr(1)[i] === text.substr(1)[i].toUpperCase() && text.substr(1)[i - 1] != " ") {
    //            text = text.substr(0, i + 1) + " " + text.substr(i + 1, text.length - 1);
    //            i++;
    //        }
    //    }
    //    return text;
    //}

    trendChartModule.TrendChart = (function () {
        //function TrendChart(dataSet, spinner) {
        function TrendChart(dataSet) {
            var base = this;
            this.margin = { top: 50, right: 20, bottom: 40, left: 60 };
            width = 0, height = 0;
            //this.legendPadding = 0;
            //this.toolTipActive = false;
            this.trendData = dataSet;
            //this.controlLimitData = [];
            //this.spinner = spinner;
            //this.isUpdate = false;
            //this.plant_line_color = d3.scale.ordinal().domain(["Apex, NC", "CF2 Thailand", "Celestica China", "Celestica Galway", "Cork, Ireland", "Durham, NC", "Flex Cork", "Foxconn China", "Foxconn Mexico",
            //   "Foxconn Milford", "Franklin", "Hunter Technologies CA", "Jabil Wuxi", "Worldwide"]).range(["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00",
            //       "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc"]);
            //this.process_line_color = d3.scale.ordinal().domain(["BFT", "AFT", "ESS", "Burn In", "AVT", "BCT", "DRIVE TEST", "ENCLOSURE", "FC"])
            //    .range(["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e"]);

            this.init();
        }

        TrendChart.prototype.init = function () {
            var base = this;
            //base.initDates();
            base.updateDimensions();
            //tooltip = d3.select('#trend').append("div")
            //    .attr("class", "tooltip")
            //    .style("opacity", 0)
            //    .style("color", "#000000")
            //    .style("background-color", "#FFFFFF")
            //    .style("padding", "5px")
            //    .style("border-radius", "5px")
            //    .style("z-Index", "-1")
            //    .style("border", "2px solid #000");

            base.svg = d3.select('#trend')
             .append("svg")
             .attr("width", base.width + base.margin.left + base.margin.right)
             .attr("height", base.height + base.margin.top + base.margin.bottom)
             .append("g")
                .attr("class", "container")
                .attr("transform", "translate(" + base.margin.left + "," + base.margin.top + ")");

            base.render();
        }

        //TrendChart.prototype.initDates = function () {

        //    var base = this;
        //    var parseDate = function (d) {
        //        var arr = d.split(/-|\s|:/);// split string and create array.
        //        var date = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]); // decrease month value by 1
        //        return date;
        //        //return d3.time.format("%y-%b-%d").parse(date);
        //    }
        //    switch (chartFilterModule.filterModel.selectedDateSliceOption()) {
        //        case 'Month':
        //            this.trendData.forEach(function (d) {
        //                //d.date = d.date;
        //                d.date = moment(d.date, "YYYYMM")._i;
        //                d.testFPY = +d.testFPY;
        //            });
        //            break;
        //        case 'Week':
        //            this.trendData.forEach(function (d) {
        //                d.date = moment(d.date, "YYYYWW")._i;
        //                d.testFPY = +d.testFPY;
        //            });
        //            break;
        //        default: //Day
        //            base.trendData.forEach(function (d) {
        //                try { //breaks if call parseDate on dates that are already parsed
        //                    d.date = parseDate(d.date);
        //                }
        //                catch (err) { }
        //                d.testFPY = +d.testFPY;
        //            });
        //            break;
        //    }
        //}

        TrendChart.prototype.render = function () {
            var base = this;

            base.prepareScales();
            base.prepareData();
            base.prepareItem();
            base.itemEnter();
            base.prepareAxes();
            base.axesRender();
            //base.prepareCrossHairs();
            //this.tooltipRender();
            base.displayAxisTitles();
            //var timeOut = null;
            //$(window).on('resize', function () {
            //    if (timeOut != null) clearTimeout(timeOut);
            //    timeOut = setTimeout(function () {
            //        base.resize()
            //    }, 500);
            //});
        }

        TrendChart.prototype.displayAxisTitles = function () {
            d3.select("#labelYTrend").remove();
            d3.select("#labelXTrend").remove();

            this.svg.append("text")
                .attr("text-anchor", "middle")
                .attr("id", 'labelYTrend')
                .attr("class", 'axisTitle')
                .attr("transform", "translate(-40," + (this.height / 2) + ")rotate(-90)")
                .text("Heart Rate");

            this.svg.append("text")
                .attr("text-anchor", "end")
                .attr("id", 'labelXTrend')
                .attr("class", 'axisTitle')
                .attr("transform", "translate(" + (this.width / 2) + ", " + (this.height + 30) + ")")
                .text("Date/Time");
        }

        //TrendChart.prototype.update = function () {

        //    var base = this;
        //    this.updateDimensions();
        //    d3.select(base.svg.node().parentNode)
        //        .style('width', (this.width + this.margin.left + this.margin.right) + 'px')
        //        .style('height', (this.height + this.margin.bottom + this.margin.top) + 'px');
        //    if (chartFilterModule.filterModel.selectedDateSliceOption() != 'Day') {
        //        // Week/Month
        //        if (base.trendData.length < this.width / 80)
        //            base.xTicks = base.trendData.length;
        //    }
        //    this.initDates();
        //    this.prepareScales();
        //    this.axesUpdate();
        //    this.prepareItem();
        //    this.itemEnter();
        //    this.itemUpdate();
        //    this.itemExit();
        //    this.axesUpdate();
        //    //if ($('.trendDot').length < base.circle[0].length) {  // Fixes bug where circle appears under trendDot when new Circles > old Circles.
        //    $('.overlay').remove();
        //    $('.focusGroup').remove();
        //    this.prepareCrossHairs();
        //    //} else
        //    //    this.updateCrossHairs();
        //    this.tooltipRender();
        //    this.displayAxisTitles();
        //};

        //TrendChart.prototype.resize = function () {

        //    var base = this;
        //    this.updateDimensions();
        //    d3.select(base.svg.node().parentNode)
        //        .style('width', (this.width + this.margin.left + this.margin.right) + 'px')
        //        .style('height', (this.height + this.margin.bottom + this.margin.top) + 'px');
        //    this.prepareScales();
        //    this.itemUpdate();
        //    this.axesUpdate();
        //    this.updateCrossHairs();
        //    this.tooltipRender();
        //    this.displayAxisTitles();
        //}

        TrendChart.prototype.updateDimensions = function () {
            this.width = $('#trend').width() - this.margin.left - this.margin.right;
            this.height = $('#trend').height() - this.margin.top - this.margin.bottom;
            this.xTicks = this.width / 800;
        }

        TrendChart.prototype.prepareScales = function () {
            this.yScale = d3.scale.linear().rangeRound([this.height, 0]);
            this.xScale = d3.scale.ordinal().rangeRoundBands([0, this.width], 1, 0.2);
            
            this.yScale.domain([50, 150]).clamp(true);
            this.xScale.domain(this.trendData.map(function (d) { return d.DateTime; }));

            //this.xScale.domain(d3.extent(this.trendData, function (d) { return d.DateTime; }));
            //this.yScale.domain(d3.extent(this.trendData, function (d) { return d.Value; }));
        }

        //TrendChart.prototype.updateCrossHairs = function () {

        //    base = this;
        //    base.svg.select('rect')
        //      .attr('width', base.width + 10)
        //      .attr('height', base.height);
        //    var focus = base.svg.select('.focusGroup');
        //    with (focus) {
        //        focus.select(".focusCircle").remove();
        //        append('circle')
        //          .attr('r', 5)
        //          .attr('class', 'focusCircle')
        //            .on("mouseenter", function () {
        //                event.stopPropagation();
        //                base.toolTipActive = true;
        //                base.tooltipOnMouseOver(base.selectedPoint, this, base);
        //            });
        //    }
        //};

        TrendChart.prototype.prepareData = function () {
            var base = this;            
            //base.data = d3.nest().key(function (d) {
            //    return d.DateTime;
            //}).entries(this.trendData);
        }

        TrendChart.prototype.prepareItem = function () {
            var base = this;

            base.lineLayout = d3.svg.line()
                    .x(function (d) {
                        return parseFloat(base.xScale(d.DateTime));
                    })
                    .y(function (d) {
                        return base.yScale(parseFloat(d.Value));
                    });

            base.circle = this.svg.selectAll("circle.trendDot")
                .data(base.trendData);

            base.lines = this.svg.selectAll("path.line")
                .data(base.trendData);
        }

        TrendChart.prototype.itemEnter = function () {
            var base = this;
            // ? base.prepareAxes();
            //base.lines
            //    .enter()
            //    .append("path")
            //    .attr("class", "line")
            //    .attr("stroke", "rgb(51, 79, 204)")
            //    .attr("stroke-width", 2)
            //    .attr("fill", "none")
            //    .attr("d", function (d) {
            //        return base.lineLayout(d);
            //    });

            base.lines.enter()
                .append("path")
                .datum(base.trendData)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                //.attr("stroke-linejoin", "round")
                //.attr("stroke-linecap", "round")
                .attr("stroke-width", ".5")
                .attr("d", base.lineLayout);            

            base.circle
                .enter()
                .append("circle")
                .attr("class", "trendDot")
                .attr("r", 2)
                .attr("x", function (d) {
                    return parseFloat(base.xScale(d.DateTime));
                })
                .attr("y", function (d) {
                    return base.yScale(parseFloat(d.Value));
                })
                .attr("cx", function (d) {
                    return parseFloat(base.xScale(d.DateTime));
                })
                .transition().duration(250)
                .attr("cy", function (d) {
                    return base.yScale(parseFloat(d.Value));
                });
        }

        //TrendChart.prototype.itemUpdate = function () {

        //    var base = this;
        //    var transition = base.svg.transition();
        //    if (chartFilterModule.filterModel.selectedTrendBreakdown() == "Plant") {
        //        base.data.forEach(function (d, i) {
        //            base.lines.transition()   // change the lines
        //                .duration(250)
        //                .attr("stroke", (function (d) {
        //                    return base.plant_line_color(d.key)
        //                }))
        //                .attr("stroke-width", "3")
        //                .attr("x", function (d) {
        //                    return d.x;
        //                })
        //                .attr("y", function (d) {
        //                    return d.y;
        //                })
        //                .attr("d", function (d) {
        //                    return base.lineLayout(d.values);
        //                });
        //        });
        //    }
        //    else if (chartFilterModule.filterModel.selectedTrendBreakdown() == "Process") {
        //        base.data.forEach(function (d, i) {
        //            base.lines.transition()   // change the lines
        //                .duration(250)
        //                .attr("stroke", (function (d) {
        //                    return base.process_line_color(d.key)
        //                }))
        //                .attr("stroke-width", "3")
        //                .attr("x", function (d) {
        //                    return d.x;
        //                })
        //                .attr("y", function (d) {
        //                    return d.y;
        //                })
        //                .attr("d", function (d) {
        //                    return base.lineLayout(d.values);
        //                });
        //        });
        //    }
        //    else {
        //        //base.svg.selectAll(".line").transition()   // change the line
        //        base.data.forEach(function (d, i) {
        //            base.svg.selectAll(".lineNormal").transition()   // change the lines
        //                .duration(250)
        //                .attr("x", function (d) {
        //                    return d.x;
        //                })
        //                .attr("y", function (d) {
        //                    return d.y;
        //                })
        //                .attr("d", function (d) {
        //                    return base.lineLayout(d.values);
        //                });
        //        });
        //        if (chartFilterModule.filterModel.selectedTrendControlLimits() && base.controlLimitData.length > 0) {
        //            if (base.svg.selectAll(".lineUCL")[0].length > 0) {
        //                base.svg.selectAll(".lineLCL").transition()   // change the lines
        //                    .duration(250)
        //                    .attr("x", function (d) {
        //                        return d.x;
        //                    })
        //                    .attr("y", function (d) {
        //                        return d.y;
        //                    })
        //                    .attr("d", function (d) {
        //                        return base.lCLLineLayout(d.values);
        //                    });
        //                base.svg.selectAll(".lineUCL").transition()   // change the lines
        //                    .duration(250)
        //                    .attr("x", function (d) {
        //                        return d.x;
        //                    })
        //                    .attr("y", function (d) {
        //                        return d.y;
        //                    })
        //                    .attr("d", function (d) {
        //                        return base.uCLLineLayout(d.values);
        //                    });
        //            }
        //            else {
        //                base.uCLControlLine.enter()
        //                    .append("path")
        //                    .attr("class", function (d) {
        //                        return "line lineUCL controlLine";
        //                    })
        //                    .attr("stroke", "rgb(169, 169, 169)")
        //                    .attr("fill", "none")
        //                    .attr("x", function (d) {
        //                        return d.x;
        //                    })
        //                    .attr("y", function (d) {
        //                        return d.y;
        //                    })
        //                    .attr("d", function (d) {
        //                        return base.uCLLineLayout(d.values);
        //                    });
        //                //base.svg
        //                //    .append("text")
        //                //    .attr("id", "UCLControlLimitText")
        //                //    .attr("transform", "translate(3 ," + ((base.yScale(base.data[0].values[0].UCL * 100)) - 7) + ")")
        //                //    .attr("dy", ".35em")
        //                //    .text("UCL");
        //                base.lCLControlLine.enter()
        //                    .append("path")
        //                    .attr("class", function (d) {
        //                        return "line lineLCL controlLine";
        //                    })
        //                    .attr("stroke", "rgb(169, 169, 169)")
        //                    .attr("fill", "none")
        //                    .attr("x", function (d) {
        //                        return d.x;
        //                    })
        //                    .attr("y", function (d) {
        //                        return d.y;
        //                    })
        //                    .attr("d", function (d) {
        //                        return base.lCLLineLayout(d.values);
        //                    });
        //                //base.svg.append("text")
        //                //    .attr("id", "LCLControlLimitText")
        //                //    .attr("transform", "translate(3 ," + ((base.yScale(base.data[0].values[0].LCL * 100)) + 7) + ")")
        //                //    .attr("dy", ".35em")
        //                //    .text("LCL");
        //            }
        //        }
        //        else if (chartFilterModule.filterModel.selectedTrendControlLimits() && base.controlLimitData.length == 0) {
        //            d3.selectAll(".controlLine").remove();
        //        }
        //    }
        //    base.circle.transition()  // Transition from old to new
        //            .duration(250)  // Length of animation
        //            //.attr("class", "trendDot")
        //            .each("start", function () {  // Start animation
        //                d3.select(this)  // 'this' means the current element
        //                    .attr("fill", "red")  // Change color
        //                    .attr("r", 5);  // Change size
        //            })
        //            //.delay(function (d, i) {
        //            //    return i / base.trendData.length * 250;  // Dynamic delay (i.e. each item delays a little longer)
        //            //})
        //            .attr("cx", function (d) {
        //                return parseFloat(base.xScale(d.date));  // Circle's X
        //            })
        //            .attr("cy", function (d) { // Circle's Y
        //                return base.yScale(parseFloat(d[decapFirstLetter(chartFilterModule.filterModel.selectedMeasure() == "CleanRun" ? "PercentClean" : chartFilterModule.filterModel.selectedMeasure())]));
        //            })
        //            .each("end", function () {  // End animation
        //                d3.select(this)  // 'this' means the current element
        //                    .transition()
        //                    .duration(250)
        //                    .attr("fill", "black")  // Change color
        //                    .attr("r", 3.5);  // Change radius
        //            });
        //}

        TrendChart.prototype.itemExit = function () {
            var base = this;
            base.lines.exit()
                .transition().duration(250).ease("cubic-in-out")
                .attr("y", base.yScale(base.yScale.domain()[0]))
                .remove();
            base.circle.exit()
                .transition().duration(250).ease("cubic-in-out")
                .attr("cy", base.yScale(base.yScale.domain()[0]))
                .remove();
        };

        TrendChart.prototype.prepareAxes = function () {
            var base = this;
            base.xAxis = d3.svg.axis()
                .scale(base.xScale)
                .orient("bottom")           

            base.yAxis = d3.svg.axis()
                .scale(base.yScale)
                .orient("left")
                .ticks(5);
        }

        // Called for Week and Month trend charts
        // returns the closest selected point based on the Mouse position
        //TrendChart.prototype.positionXCrossHairs = function (mouse) {

        //    xPos = mouse[0];
        //    //// Iterate through the range to see which one is the xPos nearest to
        //    var dist;
        //    var closest;
        //    $.each(base.xScale.range(), function (i, d) {
        //        if (i == 0) {
        //            dist = Math.abs(xPos - d);
        //            closest = i;
        //        }
        //        else {
        //            if (dist > Math.abs(xPos - d)) {
        //                dist = Math.abs(xPos - d);
        //                closest = i;
        //            }
        //        }
        //    });
        //    return closest + 1;
        //}

        //TrendChart.prototype.prepareCrossHairs = function () {

        //    base = this;
        //    base.svg.append('rect')
        //        .attr('class', 'overlay')
        //        .attr('width', base.width + 10)
        //        .attr('height', base.height)
        //        .on('mousemove', function () {
        //            if (base.toolTipActive) {
        //                event.stopPropagation();
        //                return false;
        //            }
        //            var mouse = d3.mouse(this);
        //            var mouseDate, mouseYPoint;
        //            var i;
        //            if (chartFilterModule.filterModel.selectedTrendBreakdown() == "None") {
        //                if (chartFilterModule.filterModel.selectedDateSliceOption() == 'Day') {
        //                    mouseDate = base.xScale.invert(mouse[0]);
        //                    i = bisectDate(base.trendData, mouseDate); // returns the index to the current data item
        //                }
        //                else {
        //                    i = base.positionXCrossHairs(mouse);
        //                }
        //                mouseYPoint = base.yScale.invert(mouse[1]);
        //                if (i == 0) {
        //                    base.selectedPoint = base.trendData[0];
        //                } else if (i == base.trendData.length) {
        //                    base.selectedPoint = base.trendData[i - 1];
        //                }
        //                else {
        //                    var d0 = base.trendData[i - 1]
        //                    var d1 = base.trendData[i];
        //                    // work out which date value is closest to the mouse
        //                    base.selectedPoint = mouseDate - d0.date > d1.date - mouseDate ? d1 : d0;
        //                }
        //            }
        //            else {
        //                var Data = base.trendData.sort(function (a, b) {
        //                    return a.date - b.date;
        //                });
        //                var DataByDate = [];
        //                if (chartFilterModule.filterModel.selectedDateSliceOption() === 'Day') {
        //                    mouseDate = base.xScale.invert(mouse[0]);
        //                    mouseDate = new Date(mouseDate.setHours(0, 0, 0, 0));
        //                    $.each(Data, function (i, d) {
        //                        if (d.date.getTime() === mouseDate.getTime()) {
        //                            DataByDate.push(d);
        //                        }
        //                    });
        //                }
        //                else {
        //                    i = base.positionXCrossHairs(mouse);
        //                    var array = d3.nest().key(function (d) {
        //                        return d.date;
        //                    }).entries(base.trendData);
        //                    DataByDate.push.apply(DataByDate, array[i - 1].values);
        //                }
        //                var closestPoint = function (number, array) {
        //                    var errorMap = [];
        //                    $.each(array, function (i, d) {
        //                        errorMap.push("{ id: " + i + " , value: " + parseFloat(d[decapFirstLetter(chartFilterModule.filterModel.selectedMeasure() == "CleanRun" ? "PercentClean" : chartFilterModule.filterModel.selectedMeasure())]) + " }");
        //                    });
        //                    curr = array[0];
        //                    $.each(array, function (index, value) {
        //                        if (Math.abs(number - parseFloat(value[decapFirstLetter(chartFilterModule.filterModel.selectedMeasure() == "CleanRun" ? "PercentClean" : chartFilterModule.filterModel.selectedMeasure())])) < Math.abs(number - parseFloat(curr[decapFirstLetter(chartFilterModule.filterModel.selectedMeasure() == "CleanRun" ? "PercentClean" : chartFilterModule.filterModel.selectedMeasure())]))) {
        //                            curr = value;
        //                        }
        //                    });
        //                    return curr;
        //                }
        //                base.selectedPoint = closestPoint(base.yScale.invert(mouse[1]), DataByDate);
        //            }
        //            if (base.selectedPoint == null || base.selectedPoint == undefined)
        //                return;
        //            var x = base.xScale(base.selectedPoint.date);
        //            var y = base.yScale(parseFloat(base.selectedPoint[decapFirstLetter(chartFilterModule.filterModel.selectedMeasure() == "CleanRun" ? "PercentClean" : chartFilterModule.filterModel.selectedMeasure())]));
        //            with (focus) {
        //                style('display', null);
        //                select('.focusCircle')
        //                    .attr('cx', x)
        //                    .attr('cy', y);
        //                select('#focusLineX')
        //                    .attr('x1', x).attr('y1', 0)
        //                    .attr('x2', x).attr('y2', base.height);
        //                select('#focusLineY')
        //                    .attr('x1', 0).attr('y1', y)
        //                    .attr('x2', base.width).attr('y2', y);
        //                if ($('#toggle-Crosshairs').prop('checked')) {
        //                    $('.focusLine').css('visibility', '');
        //                } else {
        //                    $('.focusLine').css('visibility', 'hidden');
        //                }
        //            }
        //        });
        //    var focus = base.svg.append('g').attr("class", "focusGroup").style('display', 'none');
        //    with (focus) {
        //        append('line')
        //            .attr('id', 'focusLineX')
        //            .attr('class', 'focusLine')
        //        append('line')
        //            .attr('id', 'focusLineY')
        //            .attr('class', 'focusLine')
        //        append('circle')
        //            .attr('r', 5)
        //            .attr('class', 'focusCircle');
        //        if ($('#toggle-Crosshairs').prop('checked')) {
        //            $('.focusLine').css('visibility', '');
        //        } else {
        //            $('.focusLine').css('visibility', 'hidden');
        //        }
        //    }
        //    var bisectDate = d3.bisector(function (d) {
        //        return d.date;
        //    }).left;
        //    base.svg.on('mouseleave', function () {
        //        focus.style('display', 'none');
        //        event.stopPropagation();
        //    })
        //}
        //TrendChart.prototype.legendRender = function (func) {
        //    var base = this;
        //    d3.select("#trendLegend .trendLegend").remove();
        //    if (chartFilterModule.filterModel.selectedTrendChartTypeOption() != "Measure" && (func != "collapse" && chartFilterModule.filterModel.selectedTrendBreakdown() == "None") || (func != "collapse" && chartFilterModule.filterModel.selectedTrendBreakdown() != "None") || (func != "collapse" && chartFilterModule.filterModel.selectedTrendBreakdown() == "None" && chartFilterModule.filterModel.selectedTrendChartTypeOption() == "Measure" && chartFilterModule.filterModel.selectedTrendControlLimits() && base.controlLimitData.length > 0)) {
        //        var limitColor;
        //        var legendSVG = d3.select("#trendLegend").append("svg").attr("class", "trendLegend")
        //            .style("padding", "2px 0");
        //        if (chartFilterModule.filterModel.selectedTrendBreakdown() == "Plant")
        //            legend = legendSVG.selectAll("g.legendItem").data(base.data);
        //        else if (chartFilterModule.filterModel.selectedTrendBreakdown() == "Process")
        //            legend = legendSVG.selectAll("g.legendItem").data(base.data);
        //        if (chartFilterModule.filterModel.selectedTrendControlLimits()) {
        //            limitColor = d3.scale.ordinal().domain(["Test FPY", "Control Limits"]).range(["rgb(51, 79, 204)", "rgb(169, 169, 169)"]);
        //            legend = legendSVG.selectAll("g.legendItem").data(["Test FPY", "Control Limits"]);
        //        }
        //        var legendItem = legend.enter().append("g")
        //            .attr("class", "legendItem")
        //            .attr("height", "14px")
        //            .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });
        //        legendItem.append("text")
        //            .attr("x", 17)
        //            .attr("y", 11)
        //            .text(function (d, i) {
        //                if (chartFilterModule.filterModel.selectedTrendBreakdown() != "None")
        //                    return d.key
        //                if (chartFilterModule.filterModel.selectedTrendControlLimits())
        //                    return d;
        //            });
        //        legendItem.append("rect")
        //            .attr("width", 12)
        //            .attr("height", 12)
        //            .style("fill", function (d) {
        //                if (chartFilterModule.filterModel.selectedTrendBreakdown() == "Plant")
        //                    return base.plant_line_color(d.key)
        //                else if (chartFilterModule.filterModel.selectedTrendBreakdown() == "Process")
        //                    return base.process_line_color(d.key)
        //                else if (chartFilterModule.filterModel.selectedTrendControlLimits())
        //                    return limitColor(d);
        //            });
        //        legendItem.attr("width", "auto");
        //        legend.exit().remove();
        //        $("#trendLegend").css("width", function () {
        //            var max = Math.max.apply(null, $(".legendItem").map(function () {
        //                return $(this)[0].getBoundingClientRect().width;
        //            }).get());
        //            var min = Math.min(250, max);
        //            return min + "px";
        //        });
        //        legendSVG.style("width", function () {
        //            return Math.max.apply(null, $(".legendItem").map(function () {
        //                return $(this)[0].getBoundingClientRect().width;
        //            }).get());
        //        });
        //        if (chartFilterModule.filterModel.selectedTrendBreakdown() == "Plant")
        //            legendSVG.attr("height", (base.data.length * 20) + "px");
        //        else if (chartFilterModule.filterModel.selectedTrendBreakdown() == "Process")
        //            legendSVG.attr("height", (base.data.length * 20) + "px");
        //        base.legendPadding = $("#trendLegend").width() + 10;
        //        $("#trendLegend").css("visibility", "visible");
        //    }
        //    else if ((func == "collapse" && chartFilterModule.filterModel.selectedTrendBreakdown() == "None") || (func == "collapse" && chartFilterModule.filterModel.selectedTrendBreakdown() != "None") || (chartFilterModule.filterModel.selectedTrendChartTypeOption() == "Measure" && func != "collapse") || (chartFilterModule.filterModel.selectedTrendControlLimits() && base.controlLimitData.length == 0)) {
        //        $("#trendLegend").css("visibility", "collapse");
        //        base.legendPadding = 0;
        //        base.margin.right = 20;
        //    }
        //}

        TrendChart.prototype.axesRender = function () {
            var base = this;

            base.horizontalGrid = base.svg.append("g")
                .attr("class", "grid vertical")
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
            base.svg.append("g")
                .attr("class", "axisX")
                .attr("transform", "translate(0," + base.height + ")")
                .call(base.xAxis);


            //// Add the X2 Axis
            //if (this.trendData.length == 1) {
            //    base.svg.append("g")
            //        .attr("class", "axisX2Show")
            //        .attr("id", "axisX2")
            //        .attr("transform", "translate(0," + base.height + ")")
            //            .call(base.x2Axis);
            //}
            //else
            //    // hide the X2 Axis
            //{
            //    base.svg.append("g")
            //        .attr("class", "axisX2Hide")
            //        .attr("id", "axisX2")
            //        .attr("transform", "translate(0," + base.height + ")")
            //            .call(base.x2Axis);
            //}

            // Add the Y Axis
            base.svg.append("g")
                .attr("class", "axisY")
                .call(base.yAxis);
        }

        TrendChart.prototype.axesUpdate = function () {
            var base = this;

            d3.select(".grid vertical").remove();

            base.horizontalGrid = base.svg.select("g.grid.vertical")
                .selectAll("line.horizontalGrid")
                .data(base.yScale.ticks(5));

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

            base.horizontalGrid
                .transition().duration(250)
                .attr("x1", 0)
                .attr("x2", this.width)
                .attr("y1", function (d) {
                    return base.yScale(d);
                })
                .attr("y2", function (d) {
                    return base.yScale(d);
                });

            base.horizontalGrid.exit()
                .transition().duration(250)
                .attr("y1", 0)
                .attr("y2", 0).remove();

            //if (chartFilterModule.filterModel.selectedDateSliceOption() != 'Day') {
            //    var xValues = this.trendData.map(function (d) {
            //        return parseFloat(d.date);
            //    }).sort();
            //    this.xScale.domain(xValues);

            //    //Week/Month
            //    if (base.trendData.length < this.width / 80)
            //        base.xTicks = base.trendData.length;

            //    var tickReductionFactor = Math.ceil(base.trendData.length / (this.width / 80));

            //    base.xAxis = d3.svg.axis()
            //        .scale(base.xScale)
            //        .orient("bottom").ticks(base.xTicks)
            //        .tickFormat(function (d, i) {
            //            if ((Math.floor(d) == d) && (i % tickReductionFactor == 0))
            //                return d.toString();
            //            else
            //                return "";
            //        });
            //}
            
            base.xAxis = d3.svg.axis()
                .scale(base.xScale)
                .orient("bottom")
                .ticks(base.xTicks);
            base.svg.selectAll("#axisX2")
                .transition().duration(250)
                .attr("transform", "translate(0," + this.height + ")")
                .attr("class", "axisX2Hide")
                .call(base.x2Axis.scale(base.x2Scale).ticks(0));
            
            base.svg.selectAll(".axisX")
               .transition().duration(250)
               .attr("transform", "translate(0," + this.height + ")")
               .call(base.xAxis.scale(base.xScale).ticks(base.xTicks));
            base.svg.selectAll(".axisY")
               .transition().duration(250)
               .call(base.yAxis.scale(base.yScale));
        }

        

        //TrendChart.prototype.tooltipRender = function () {

        //    var base = this;
        //    d3.select('.focusCircle').on("mouseenter", function () {
        //        event.stopPropagation();
        //        base.toolTipActive = true;
        //        base.tooltipOnMouseOver(base.selectedPoint, this, base);
        //    });
        //    d3.select('.focusCircle').on("mouseleave", function () {
        //        event.stopPropagation();
        //        base.toolTipActive = false;
        //        base.tooltipOnMouseOut(base.selectedPoint, this, base);
        //    });
        //    d3.select('.focusCircle').on("dblclick", function () {
        //        event.stopPropagation();
        //        base.toolTipActive = true;
        //        base.doubleClickToReturnGridView(base.selectedPoint, this, base);
        //    });
        //}

        //TrendChart.prototype.tooltipOnMouseOver = function (d, element, base, q) {
            
        //    event.stopPropagation();
        //    if (d == undefined) {
        //        return;
        //    }
        //    var xPosition = parseInt($(element).attr('cx'));
        //    var yPosition = parseInt($(element).attr('cy')) + base.margin.top + 10;
        //    d3.select("#trend .tooltip")
        //        .style("opacity", 1)
		//		.style("min-width", "150px")
        //        .style("z-Index", "301")
        //        .html(this.tooltipText(d, element));
        //    if (yPosition > ($("#trend").height() / 2)) {
        //        yPosition = yPosition - ($(".tooltip").height()) - base.margin.top
        //    };
        //    d3.select("#trend .tooltip").style("top", yPosition + "px");
        //    if (xPosition > ($("#trend svg").width() - base.margin.left - $("#trend .tooltip").width())) {
        //        xPosition = (xPosition - ($("#trend .tooltip").width() / 1.5));
        //    };
        //    d3.select("#trend .tooltip").style("left", xPosition + "px");
        //};

        //TrendChart.prototype.tooltipOnMouseOut = function (d, element, base) {

        //    event.stopPropagation();
        //    d3.select("#trend .tooltip")
        //        .style("z-Index", "-1")
        //        .transition().duration(100).style("opacity", 0);
        //}

        //TrendChart.prototype.tooltipText = function (d, element) {

        //    var selClass = "optDisable", optTestFPY = "optDisable", optCT = "optDisable", optSOERate = "optDisable", optErrorRate = "optDisable", optRejectRate = "optDisable", optIncident = "optDisable", optProcess = "optDisable", optPlant = "optDisable", optCleanRun = "optDisable";
        //    if ($('#toggle-dTooltip').prop('checked')) {
        //        selClass = "optEnable";
        //    }
        //    switch ($("#measureDropdown").val()) {
        //        case "TestFPY":
        //            optTestFPY = "optEnable";
        //            break;
        //        case "ct":
        //            optCT = "optEnable";
        //            break;
        //        case "soeRate":
        //            optSOERate = "optEnable";
        //            break;
        //        case "ErrorRate":
        //            optErrorRate = "optEnable";
        //            break;
        //        case "RejectRate":
        //            optRejectRate = "optEnable";
        //            break;
        //        case "IncidentRate":
        //            optIncident = "optEnable";
        //            break;
        //        case "CleanRun":
        //            optCleanRun = "optEnable";
        //    }
        //    if (selClass == "optEnable")
        //        optTestFPY = "optEnable", optIncident = "optEnable", optCT = "optEnable", optErrorRate = "optEnable", optRejectRate = "optEnable", optSOERate = "optEnable", optProcess = "optDisable", optPlant = "optDisable", optCleanRun = "optEnable";
        //    switch ($("#breakdownDropdownTrend").val()) {
        //        case "Plant":
        //            optPlant = "optEnable";
        //            break;
        //        case "Process":
        //            optProcess = "optEnable";
        //            break;
        //        case "None":
        //            break;
        //    }
        //    var dateString;
        //    if (chartFilterModule.filterModel.selectedDateSliceOption() == "Day")
        //        dateString = moment(d.date.toISOString()).format("DD MMM YYYY");
        //    else
        //        dateString = d.date.toString();
        //    return "<span>Date: " + dateString + "</span><br/>" + // ToolTip Data.
        //            "<span class='" + optProcess + "'>Process: " + d.process + "</span><br class='" + optProcess + "'/>" +
        //            "<span class='" + optPlant + "'>Plant: " + d.plant + "</span><br class='" + optPlant + "'/>" +
        //            "<span>Runs: " + d.runs + "</span><br/>" +
        //            "<span class='" + optTestFPY + "'>Passed Runs: " + d.passedRuns + "</span><br class='" + optTestFPY + "'/>" +
        //            "<span class='" + optTestFPY + "'>Test FPY: " + d.testFPY + "%</span><br class='" + optTestFPY + "'/>" +
        //            "<span class='" + optCT + "'>CT: " + parseFloat(d.ct).toFixed(2) + "</span><br class='" + optCT + "'/>" +
        //            "<span class='" + selClass + "'>Complete Runs: " + d.completeRuns + "</span><br class='" + selClass + "'/>" +
        //            "<span class='" + selClass + "'>Percent Complete: " + d.percentComplete + "%</span><br class='" + selClass + "'/>" +
        //            "<span class='" + selClass + "'>Overall CT: " + parseFloat(d.overallCT).toFixed(2) + "</span><br class='" + selClass + "'/>" +
        //            "<span class='" + optCleanRun + "'>Clean Runs: " + d.cleanRuns + "</span><br class='" + optCleanRun + "'/>" +
        //            "<span class='" + optCleanRun + "'>Clean Run: " + d.percentClean + "%</span><br class='" + optCleanRun + "'\>" +
        //            "<span class='" + optIncident + "'>Incident Count: " + parseInt(d.incidentCount) + "</span><br class='" + optIncident + "'/>" +
        //            "<span class='" + optIncident + "'>Incident Rate: " + d.incidentRate + "</span><br class='" + optIncident + "'/>" +
        //            "<span class='" + optSOERate + "'>SOE Count: " + d.soeCount + "</span><br class='" + optSOERate + "'/>" +
        //            "<span class='" + optSOERate + "'>SOE Rate: " + d.soeRate + "</span><br class='" + optSOERate + "'/>" +
        //            "<span class='" + optErrorRate + "'>Error Count: " + d.errorCount + "</span><br class='" + optErrorRate + "'/>" +
        //            "<span class='" + optErrorRate + "'>Error Rate: " + d.errorRate + "</span><br class='" + optErrorRate + "'/>" +
        //            "<span class='" + optRejectRate + "'>Reject Count: " + d.rejectCount + "</span><br class='" + optRejectRate + "'/>" +
        //            "<span class='" + optRejectRate + "'>Reject Rate: " + d.rejectRate + "</span><br class='" + optRejectRate + "'/>";
        //}

        return TrendChart;
    })();

    return trendChartModule;
}(trendChartModule || {}));