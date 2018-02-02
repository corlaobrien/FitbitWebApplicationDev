var bubbleChartModule = (function (bubbleChartModule) {

    bubbleChartModule.BubbleChart = (function () {
        BubbleChart.prototype.handleVisibilityChange = function () {
            var base = this;
            if (!document[base.hidden]) {
                base.start();
            }
        }

        function BubbleChart(chartId, data, xaxisMetrics, option, dimension1, dimension2, dimension3, bubbleLabel, rotatexAxisTicks) {
            var base = this;
            //chartId, data, xaxisMetrics, option("cycle"/"analyse" - tooltips), dimension1, dimension2, dimension3, bubbleLabel ("SITE"/"TesterName" - data attribute to use for label), 
            //      padding (for around graph), rotatexAxisTicks (true/false), dateAr (array[Period, From, To] - not used?)    

            // Set the name of the hidden property and the change event for visibility - fix for bubbles overlapping and text not displaying if tab is minimised during a refresh
            this.hidden, this.visibilityChange;
            if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
                this.hidden = "hidden";
                this.visibilityChange = "visibilitychange";
            } else if (typeof document.msHidden !== "undefined") {
                this.hidden = "msHidden";
                this.visibilityChange = "msvisibilitychange";
            } else if (typeof document.webkitHidden !== "undefined") {
                this.hidden = "webkitHidden";
                this.visibilityChange = "webkitvisibilitychange";
            }

            //var tooltip = CustomTooltip(dimension1, dimension2, dimension3, chartId, option, dateAr); //Temp fix for cycle.
            this.damper = 0.01;
            this.chartId = chartId;
            this.rotatexAxisTicks = rotatexAxisTicks;
            this.dimension1 = dimension1, this.dimension2 = dimension2, this.dimension3 = dimension3;
            this.bubbleLabel = bubbleLabel;
            this.vis = null;
            this.initial = null;
            this.nodes = [];
            this.force = null;
            this.circles = null;
            this.labels = null;
            this.xAxisScale = 1
            this.panExtent = null;
            this.zoomDetails = null;
            this.xScale, this.yScale;
            this.canvasWidth, this.canvasHeight;
            this.padding = { top: 0, right: 10, bottom: 20, left: 50, padding: 50 };
            this.xAxis = null, this.yAxis = null;
            this.columns = ["Plant", "Color"];
            this.fill_color = d3.scale.ordinal().domain([">25", "26-40", "41-55", "56-70", "71-85", "86+"]).range(["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6"]);
            this.nominal_text_size = 8;
            this.bubbleData = data;
            this.init();
            this.create_nodes();
            this.create_vis();    
            d3.selectAll("button[data-zoom]").on("click", this.buttonZoom);
            this.tooltip = d3.select("#pieChart").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .style("word-wrap", "break-word")
                .style("max-width", "17em")
                .style("color", "#000000")
                .style("background-color", "#FFFFFF")
                .style("padding", "5px")
                .style("border-radius", "5px")
                .style("z-Index", "-1")
                .style("border", "2px solid #000");
        }       

        BubbleChart.prototype.buttonZoom = function () {
            var base = this;
            // Record the coordinates (in data space) of the center (in screen space).
            var center0 = zoomDetails.center(), translate0 = base.zoomDetails.translate(), coordinates0 = base.coordinates(center0);
            base.zoomDetails.scale(base.zoomDetails.scale() + parseFloat(this.getAttribute("data-zoom")));

            // Translate back to the center.
            var center1 = base.point(coordinates0);
            base.zoomDetails.translate([translate0[0] + center0[0] - center1[0], translate0[1] + center0[1] - center1[1]]);

            base.vis.call(base.zoomDetails.event);
        }

        BubbleChart.prototype.coordinates = function (point) {
            var base = this;
            var scale = base.zoomDetails.scale(), translate = zoomDetails.translate();
            return [(point[0] - translate[0]) / scale, (point[1] - translate[1]) / scale];
        }

        BubbleChart.prototype.point = function (coordinates) {
            var base = this;
            var scale = base.zoomDetails.scale(), translate = base.zoomDetails.translate();
            return [coordinates[0] * scale + translate[0], coordinates[1] * scale + translate[1]];
        }

        BubbleChart.prototype.init = function () {
            var base = this;    
            base.canvasWidth = $(base.chartId).width() - base.padding.left - base.padding.right;
            base.canvasHeight = $(base.chartId).height() - base.padding.top - base.padding.bottom;
            //base.max_radius = 4;

            base.xScale = d3.scale.ordinal().rangeRoundBands([0, base.canvasWidth], 0.1);
            base.xScale.domain(["male", "female"]);

            base.xScale1 = d3.scale.ordinal().rangeRoundBands([0, base.xScale.rangeBand()]);            
            base.xScale1.domain(["active", "sedentary"]);

            base.yScale = d3.scale.linear().range([base.canvasHeight, base.padding.padding]);
            base.yScale.domain([-.9, 5]).clamp(true);
            base.xAxis = d3.svg.axis().scale(base.xScale).orient("bottom");
            base.yAxis = d3.svg.axis().scale(base.yScale).orient("left").ticks(5);
            base.yPanLimit = base.yScale.domain();
            base.panExtent = { x: [-10, base.canvasWidth], y: base.yPanLimit };
            base.zoomDetails = d3.behavior.zoom().center([base.canvasWidth / 2, base.canvasHeight / 2]).y(base.yScale).scaleExtent([1, 2]).on("zoom", function () { base.zoom(base) });
        }

        BubbleChart.prototype.create_nodes = function () {
            var base = this;
            var id = 0;
            base.bubbleData.sessions.forEach((function (d, i) {
                var node;
                node = {
                    id: id,
                    userId: d.userId,
                    name: d.name,
                    email: d.email,
                    radius: 20,
                    age: d.age,
                    ageGroup: d.ageGroup,
                    gender: d.gender,
                    occupationType: d.occupationType,
                    numberOfSessions: d.numberOfSessions,
                    x: base.xScale(d.gender) + base.xScale1(d.occupationType) + (base.xScale1.rangeBand() / 2),
                    y: base.yScale(d.numberOfSessions) - 20,
                
                };
                id++;
                return base.nodes.push(node);
            }));

            //nodes.sort(function (a, b) {
            //    one = a.radius;
            //    two = b.radius
            //    return one > two ? -1 : 1;
            //});
        };

        BubbleChart.prototype.create_vis = function () {
            var base = this;
            base.vis = d3.select(base.chartId)
                .append("svg")
                    .attr("id", "bubbleChart")
                    .attr("width", base.canvasWidth + base.padding.left + base.padding.right)
                    .attr("height", base.canvasHeight + base.padding.top + base.padding.bottom)
                .append("g")
                    .attr("transform", "translate(" + base.padding.left + "," + base.padding.top + ")")
                    .style("width", base.canvasWidth)
                    .style("height", base.canvasHeight)

            base.view = base.vis.append("rect")
                .attr("width", base.canvasWidth - 1)
                .attr("height", base.canvasHeight - 1)
                .style("fill", "white")
                .call(base.zoomDetails);

            base.vis.append("g")
                .attr("class", "axisX")
                .attr("transform", "translate(0," + base.canvasHeight + ")")
                .call(base.xAxis.ticks(base.xScale.domain().length));

            if (base.rotatexAxisTicks) {
                vis.select(".axisX").selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-30)");
            }

            base.vis.append("g")
                   .attr("class", "axisY")
                   .call(base.yAxis);

            base.horizontalGrid = base.vis.append("g")
                .attr("class", "grid vertical")
                .selectAll("line.horizontalGrid").data(base.yScale.ticks(5));

            base.horizontalGrid.enter()
                .append("line")
                .attr("class", "horizontalGrid")
                .transition().duration(250)
                .attr("x1", 0)
                .attr("x2", function (d, i) {
                    return base.canvasWidth;
                })
                .attr("y1", function (d) {
                    return base.yScale(d);
                })
                .attr("y2", function (d) {
                    return base.yScale(d);
                });

            base.verticalGrid = base.vis.append("g")
                .attr("class", "grid horizontal")
                .selectAll("line.verticalGrid").data(base.xScale.domain().filter(function (d, i) {
                    return d;
                }));

            base.verticalGrid.enter()
                .append("line")
                .attr("class", "verticalGrid")
                .transition().duration(250)
                .attr("x1", function (d) {
                    return base.xScale(d);
                })
                .attr("x2", function (d) {
                    return base.xScale(d);
                })
                .attr("y1", function (d, i) {
                    return base.canvasHeight;
                })
                .attr("y2", base.padding.padding);

            base.vis.append("svg").attr("class", "group2")
                    .attr("width", base.canvasWidth - 1)
                    .attr("height", base.canvasHeight - 1);                    
                

            base.initial = base.vis.select("svg").selectAll(".bubble").data(base.nodes, function (d) {
                return d.id;
            });

            base.groups = base.initial.enter().append("g").attr("id", (function (d) {
                return "group_" + d.id;
            }));

            base.circles = base.groups
                .append("circle")
                .attr("class", "circle")
                .attr("r", 0)
                .attr("fill", (function (d) {
                    return base.fill_color(d[base.dimension1]);
                }))
                .attr("opacity", 0.9)
                .attr("stroke-width", 1)
                .attr("stroke", (function (d) {
                    return d3.rgb(base.fill_color(d[base.dimension1])).darker();
                }))
                .attr("cx", (function (d) {
                    return parseFloat(d.x)
                }))
                .attr("cy", (function (d) {
                    return parseFloat(d.y)
                }))
                .attr("x", (function (d) {
                    return parseFloat(d.x)
                }))
                .attr("y", (function (d) {
                    return parseFloat(d.y)
                }))
                .attr("id", (function (d) {
                    return "bubble_" + d.id;
                }))
                .on("mouseover", function (d) { base.tooltipOnMouseOver(d, this, base); })
                .on("mouseout", function (d) { base.tooltipOnMouseOut(d, this, base); });

            base.labels = base.groups.append("text")
                .attr("class", "circleLabel")
                .attr("dy", "0.5ex")
                .attr("text-anchor", "middle")
                .attr("pointer-events", "none")
                .text(function (d) {
                    return d[base.bubbleLabel];
                })
                .style("font-size", function (d) {
                    if (d.occupationType == "active")
                        return "0.9em";
                    else if (d.occupationType == "sedentary")
                        return "0.5em";
                })
                .attr("cx", (function (d) {
                    return parseFloat(d.x)
                }))
                .attr("cy", (function (d) {
                    return parseFloat(d.y)
                }))
                .attr("x", (function (d) {
                    return parseFloat(d.x)
                }))
                .attr("y", (function (d) {
                    return parseFloat(d.y)
                }))
                .attr("id", (function (d) {
                    return "label_" + d.id;
                }))
                .on("mouseover", function (d) { base.tooltipOnMouseOver(d, this, base); })
                .on("mouseout", function (d) { base.tooltipOnMouseOut(d, this, base); });
            
            base.circles.transition().duration(250).attr("r", function (d) {
                return d.radius;
            });
            base.vis.selectAll(".tick")
                 .filter(function (d) { return d === -10 || d === -1; })
                 .remove();

            base.labelTooltipRender();
            //base.tooltipRender();

            base.display_axis_titles();
            base.start();
            base.display_by_xaxis();
        };

        BubbleChart.prototype.resize = function () {
            var base = this;
            d3.select(base.chartId).select("#bubbleChart")
                .attr("width", (base.canvasWidth + base.padding.left + base.padding.right))
                .attr('height', (base.canvasHeight + base.padding.bottom + base.padding.top));

            d3.select(base.chartId).select("rect")
                .attr("width", (base.canvasWidth - 1))
                .attr('height', (base.canvasHeight - 1))
                .style("fill", "white")
                .call(base.zoomDetails);

            d3.select(base.chartId).select(".group2")
                .attr("width", (base.canvasWidth - 1))
                .attr('height', (base.canvasHeight - 1));

            // Select the section we want to apply our changes to
            var transition = base.vis.transition();

            transition.select(".axisX") // change the x axis
                .duration(250)
                .attr("transform", "translate(0," + base.canvasHeight + ")")
                .call(base.xAxis.scale(base.xScale))
                .selectAll("text")
                .style("text-anchor", "middle")

            if (base.rotatexAxisTicks) {
                transition.select(".axisX").selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-30)");
            }

            transition.select(".axisY") // change the y axis
                .duration(250)
                .call(base.yAxis.scale(base.yScale));

            base.horizontalGrid = base.vis.select("g.grid.vertical")
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
                    return base.canvasWidth;
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
                .attr("x2", function (d, i) {
                    return base.canvasWidth;
                })
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

            base.verticalGrid = base.vis.select("g.grid.horizontal")
                .selectAll("line.verticalGrid")
                .data(base.xScale.domain().filter(function (d, i) { return d; }));

            base.verticalGrid.enter()
                .append("line")
                .attr("class", "verticalGrid")
                .attr("y1", 0)
                .attr("y2", 0)
                .transition().duration(250)
                .attr("y1", function (d, i) {
                    return base.canvasHeight;
                })
                .attr("y2", base.padding.padding)
                .attr("x1", function (d) {
                    return base.xScale(d);
                })
                .attr("x2", function (d) {
                    return base.xScale(d);
                });

            base.verticalGrid
                .transition().duration(250)
                .attr("y1", function (d, i) {
                    return base.canvasHeight;
                })
                .attr("y2", base.padding.padding)
                .attr("x1", function (d) {
                    return base.xScale(d);
                })
                .attr("x2", function (d) {
                    return base.xScale(d);
                });

            base.verticalGrid.exit()
                .transition().duration(250)
                .attr("x1", 0)
                .attr("x2", 0).remove();

            base.vis.selectAll('circle').transition().duration(250)
            .attr("cx", (function (d) {
                return parseFloat(d.x)
            }))
                .attr("cy", (function (d) {
                    return parseFloat(d.y)
                }))
                .attr("x", (function (d) {
                    return parseFloat(d.x)
                }))
                .attr("y", (function (d) {
                    return parseFloat(d.y)
                }))

            base.vis.selectAll('.circleLabel').transition().duration(250)
                .attr("x", (function (d) {
                    return parseFloat(d.x)
                }))
                .attr("y", (function (d) {
                    return parseFloat(d.y)
                }));

            //base.groups.attr("r", function (d) {
            //    return d.radius;
            //})
            //.sort(function (a, b) {
            //    one = a.radius;
            //    two = b.radius;
            //    return one > two ? -1 : 1;
            //});

            base.vis.selectAll(".tick")
                 .filter(function (d) { return d === -10 || d === -1; })
                 .remove();

            base.vis.selectAll("#labelYBubble")
                .transition().duration(250)
                .attr("text-anchor", "middle")
                .attr("transform", "translate(-40," + (base.canvasHeight / 2) + ")rotate(-90)");

            base.vis.selectAll("#labelXBubble")
                .transition().duration(250)
                .attr("text-anchor", "end")
                .attr("transform", function (d) {
                    if (base.rotatexAxisTicks)
                        return "translate(" + (base.canvasWidth / 2) + ", " + (base.canvasHeight + 85) + ")";
                    else
                        return "translate(" + (base.canvasWidth / 2) + ", " + (base.canvasHeight + 30) + ")";
                });

            //$(".tooltip").remove();
            //base.labelTooltipRender();
            //base.tooltipRender();
        }

        BubbleChart.prototype.charge = function (d) {
            return -Math.pow(d.radius, 2.0) / 20;
        };

        BubbleChart.prototype.display_by_xaxis = function () {
            var base = this;
            base.force.size([base.canvasWidth, base.canvasHeight]).resume()
        }

        BubbleChart.prototype.display_axis_titles = function () {
            var base = this;
            d3.selectAll("#labelYBubble").remove();
            d3.selectAll("#labelXBubble").remove();

            base.vis.append("text")
                .attr("text-anchor", "middle")
                .attr("id", 'labelYBubble')
                .attr("class", 'axisTitle')
                .attr("transform", "translate(-40," + (base.canvasHeight / 2) + ")rotate(-90)")
                .text("Number of Sessions"); //dim?

            base.vis.append("text")
                .attr("text-anchor", "middle")
                .attr("id", 'labelXBubble')
                .attr("class", 'axisTitle')
                .attr("transform", function (d) {
                    if (base.rotatexAxisTicks)
                        return "translate(" + (base.canvasWidth / 2) + ", " + (base.canvasHeight + 90) + ")";
                    else
                        return "translate(" + (base.canvasWidth / 2) + ", " + (base.canvasHeight + 20) + ")";
                })
                .text("Gender");//dim?
        }

        BubbleChart.prototype.start = function () {
            var base = this;
            base.force = d3.layout.force()
                    .nodes(base.nodes)
                    .size([base.canvasWidth, base.canvasHeight])
                    .gravity(0)
                    .charge(-1)
                    .on("tick", function () { base.tick() })
                    .start();

            return setTimeout(function () {
                base.force.stop()

            }, 1500);
        };

        BubbleChart.prototype.tick = function () {
            var base = this;
            base.labels.each(base.move_towards_process(base.force.alpha())).attr("x", function (d) {
                return parseFloat(d.x);
            }).attr("y", function (d) {
                return parseFloat(d.y);
            });

            base.circles.each(base.move_towards_process(base.force.alpha()))
            .attr("cx", function (d) {
                return parseFloat(d.x);
            }).attr("cy", function (d) {
                return parseFloat(d.y);
            }).attr("x", function (d) {
                return parseFloat(d.x);
            }).attr("y", function (d) {
                return parseFloat(d.y);
            });

            return base.circles.each(base.collide(base.force.alpha())).attr("cx", function (d) {
                return parseFloat(d.x);
            }).attr("cy", function (d) {
                return parseFloat(d.y);
            });
        };

        BubbleChart.prototype.move_towards_process = function (alpha) {
            var base = this;
            return function (d) {
                targetX = base.xScale(d.gender) + base.xScale1(d.occupationType) + (base.xScale1.rangeBand() / 2);
                targetY = base.yScale(d.numberOfSessions);
                d.x = d.x + (targetX - d.x) * (base.damper + 0.02) * alpha * 1.5;
                return d.y = targetY;
            };
        };

        // Resolve collisions between nodes.
        BubbleChart.prototype.collide = function (alpha) {
            var base = this;
            var quadtree = d3.geom.quadtree(base.nodes);
            return function (d) {
                var r = d.radius + base.max_radius + 5,
                    nx1 = d.x - r,
                    nx2 = d.x + r,
                    ny1 = d.y - r,
                    ny2 = d.y + r;
                quadtree.visit(function (quad, x1, y1, x2, y2) {
                    if (quad.point && (quad.point !== d)) {
                        var x = d.x - quad.point.x,
                            y = d.y - quad.point.y,
                            l = Math.sqrt(x * x + y * y),
                            r = d.radius + quad.point.radius + (d.color !== quad.point.color) * 5;
                        if (l < r) {
                            l = (l - r) / l * alpha;
                            d.x -= x *= l;
                            d.y -= y *= l;
                            quad.point.x += x;
                            quad.point.y += y;
                        }
                    }
                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            };
        };

        BubbleChart.prototype.hide_all_details = function () {
            var base = this;
            $.each($(".circleLabel"), function (index, value) {
                value.style.fontWeight = "normal";
            });
            d3.selectAll(".circle").attr("stroke", (function () {
                return function (d) {
                    var dim1Value;
                    $.each(d, function (index, value) {
                        if (index.toLowerCase() == base.dimension1.toLowerCase())
                            dim1Value = value;
                    });

                    return d3.rgb(base.fill_color(dim1Value)).darker();
                };
            }));
        };

        //function remove_tooltips() {
        //    //tooltip.tooltipRemoveAll();
        //};    

        BubbleChart.prototype.update = function (data) {
            var base = this;
            base.bubbleData = data;
            base.nodes = [];
            base.create_nodes();
            base.vis.selectAll('circle').data(base.nodes);
            base.vis.selectAll('.circleLabel').data(base.nodes);
            if (base.zoomDetails) {
                base.zoomDetails.translate([0, 0]);
                base.circles.attr("transform", [
                    "translate(0,0)",
                    "scale(1)"
                ].join(" "));

                base.labels.attr("transform", [
                    "translate(0,0)",
                    "scale(1)"
                ].join(" "));
            }
            base.init();
            base.resize();
            base.start();
            base.display_by_xaxis();
        }

        BubbleChart.prototype.zoom = function (base) {
            //var base = this;
            panLimitArray = base.panLimit();
            base.zoomDetails.translate(panLimitArray);

            base.circles.attr("transform", [
                "translate(" + panLimitArray + ")",
                "scale(" + d3.event.scale + ")"
            ].join(" "));

            base.labels.attr("transform", [
                "translate(" + panLimitArray + ")",
                "scale(" + d3.event.scale + ")"
            ].join(" "));

            base.vis.select(".axisX").call(base.xAxis.scale(base.xScale.rangeRoundBands([0, base.canvasWidth * d3.event.scale], .1 * d3.event.scale)));
            if (base.rotatexAxisTicks) {
                base.vis.select(".axisX").selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-30)");
            }

            var ticks = base.vis.select(".axisX").selectAll(".tick");
            $.each(ticks[0], function (index, value) {
                var currentx = d3.transform(d3.select(value).attr("transform")).translate[0];
                d3.select(value).attr("transform", "translate(" + (currentx + base.zoomDetails.translate()[0]) + ",0)") //d3.event.translate[0]<0?0:   d3.select(value).attr("transform", "translate(" + (d3.event.translate[0] + currentx) + ",0)") //d3.event.translate[0]<0?0:
            });
            var transition = vis.transition();
            transition.select(".axisY") // change the y axis
                .duration(250)
                .call(base.yAxis.scale(base.yScale));
        };

        BubbleChart.prototype.panLimit = function () {
            var base = this;
            var divisor = { h: base.canvasHeight / ((base.yScale.domain()[1] - base.yScale.domain()[0]) * base.zoomDetails.scale()), w: base.canvasWidth / ((base.xScale.domain()[1] - base.xScale.domain()[0]) * base.zoomDetails.scale()) },
		    minX = -(((base.xScale.domain()[0] - base.xScale.domain()[1]) * base.zoomDetails.scale()) + (base.panExtent.x[1] - (base.panExtent.x[1] - (base.canvasWidth / divisor.w)))),
		    minY = -(((base.yScale.domain()[0] - base.yScale.domain()[1]) * base.zoomDetails.scale()) + (base.panExtent.y[1] - (base.panExtent.y[1] - (base.canvasHeight * (base.zoomDetails.scale()) / divisor.h)))) * divisor.h,
		    maxX = (((base.xScale.domain()[0] - base.xScale.domain()[1])) + (base.panExtent.x[1] - base.panExtent.x[0])) * divisor.w * base.zoomDetails.scale(),
		    maxY = (((base.yScale.domain()[0] - base.yScale.domain()[1]) * base.zoomDetails.scale()) + (base.panExtent.y[1] - base.panExtent.y[0])) * divisor.h * base.zoomDetails.scale(),

		    tx = base.xScale.domain()[0] < base.panExtent.x[0] ?
                minX :
				    base.xScale.domain()[1] > base.panExtent.x[1] ?
                maxX :
					    base.zoomDetails.translate()[0],
		    ty = base.yScale.domain()[0] < base.panExtent.y[0] ?
                minY :
				    base.yScale.domain()[1] > base.panExtent.y[1] ?
                maxY :
					    base.zoomDetails.translate()[1];

            if (base.zoomDetails.translate()[0] < (base.canvasWidth - (base.canvasWidth * d3.event.scale))) {
                tx = (base.canvasWidth - (base.canvasWidth * d3.event.scale));
            }
            if (base.zoomDetails.translate()[0] > 0) {
                tx = 0;
            }

            if (base.zoomDetails.translate()[1] < (base.canvasHeight - (base.canvasHeight * d3.event.scale))) {
                ty = (base.canvasHeight - (base.canvasHeight * d3.event.scale));
            }
            if (base.zoomDetails.translate()[1] > 0) {
                ty = 0;
            }

            return [tx, ty];
        }

        BubbleChart.prototype.labelTooltipRender = function () {
            var base = this;
            var div = d3.select("body").append("div")
                .attr("class", "tooltipTH")
                .style("opacity", 0)
                .style("background-color", '#000000');
            var span = d3.select(".tooltipTH").append("span")
                .attr("class", "tooltipTHSpan")
                .style("font-size", '11px')
                .style("color", '#ffffff')
                .style('padding-bottom', "3px");
            base.vis.selectAll(".yaxisTH .tick").on("mouseover", function (d) {
                if (d.length > base.dimensionLabelsLength) {
                    div.transition()
                    .duration(0)
                    .style("opacity", .9)
                    .style("left", (d3.event.pageX) + "px")
                    .style("height", 'auto')
                    .style("top", (d3.event.pageY - 38) + "px");
                    span.html(d + "<br/>");
                }
            });
        }

        BubbleChart.prototype.tooltipOnMouseOver = function (d, element, base) {
            d3.select("#pieChart .tooltip")
                .style("opacity", 1)
                .style("z-Index", "301")
                .style("fixed", true)
                .html(this.tooltipText(d, element));

            var xPosition = d.x;
            //if (xPosition > (base.canvasWidth / 2) + base.padding.left) {
            //    xPosition = d.x;
            //}
            var yPosition = d.y + 130;
            if (yPosition > this.canvasHeight + base.padding.top) {
                yPosition = d.y - 130;
            }
            d3.select("#pieChart .tooltip")
                .style("left", (xPosition) + "px")
                .style("top", yPosition + "px");

            $("#pieChart .tooltip").connections({ to: "#bubble_" + d.id, "class": "line connectionLine" });
        }

        BubbleChart.prototype.tooltipOnMouseOut = function (d, element, base) {
            d3.selectAll("g.legendItemTH").style("opacity", 1);
            d3.select("#pieChart .tooltip")
                .style("z-Index", "-1").style("opacity", 0);
            $(".connectionLine").remove();
        }

        BubbleChart.prototype.tooltipText = function (d, element) {
            //var content, selClass = "optDisable", optStepDuration = "optDisable", optStepCount = "optDisable", optCPU = "optDisable", optMemory = "optDisable", optLogEntries = "optDisable";
            var content, selClass = "optEnable";
            //if ($('#toggle-dTooltip').prop('checked')) {
            //    selClass = "optEnable";
            //}

            //if (selClass == "optEnable")
            //    optStepDuration = "optEnable", optStepCount = "optEnable", optCPU = "optEnable", optMemory = "optEnable", optLogEntries = "optEnable";

            return "<span>User Id: " + d.userId + "</span><br/>" + // ToolTip Data.
                    "<span>Name: " + d.name + "</span><br/>" +
                    "<span>Email: " + d.email + "</span><br/>" +
                    "<span>Age: " + d.age + "</span><br/>" +
                    "<span>Age Group: " + d.ageGroup + "</span><br/>" +
                    "<span>Gender: " + d.gender + "</span><br/>" +
                    "<span>Occupation Type: " + d.occupationType + "</span><br/>" +
                    "<span># of Sessions: " + d.numberOfSessions + "</span><br/>";
        }

        // Handle page visibility change   
        document.addEventListener(this.visibilityChange, this.handleVisibilityChange, false);

        return BubbleChart;
    })();

    return bubbleChartModule;
}(bubbleChartModule || {}));
