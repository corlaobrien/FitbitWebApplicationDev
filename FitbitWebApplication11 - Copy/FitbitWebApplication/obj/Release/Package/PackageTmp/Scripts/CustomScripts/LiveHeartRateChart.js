var liveHRChartModule = (function (liveHRChartModule) {

    liveHRChartModule.LiveHRChart = (function () {
        function LiveHRChart(dataSet) {
            var base = this;  
            this.margin = { top: 20, right: 20, bottom: 60, left: 50 },
                this.width = $('#liveTrend').width() - base.margin.left - base.margin.right,
                this.height = $('#liveTrend').height() - base.margin.top - base.margin.bottom;
            this.trendDataUnsorted = dataSet;
            this.trendData = this.trendDataUnsorted.sort(function (a, b) {
                return new Date(a.DateTime) - new Date(b.DateTime);
            });
            this.limit = 60 * 1;
            this.duration = 2000;
            this.time = new Date(base.trendData[0].DateTime).getTime() - base.duration;
            this.svg;
            this.x, this.y;
            this.parseTime = d3.time.format("%H:%M");
            this.groups;

            this.init();
            this.tick();
        }

        LiveHRChart.prototype.init = function () {
            var base = this;           

            base.x = d3.time.scale()
                .domain([base.time - (base.limit - 2), base.time - base.duration])
                .range([0, base.width]);

            base.y = d3.scale.linear()
                .domain([0, 200])
                .range([base.height, 0]);            

            base.line = d3.svg.line()
                .interpolate('basis')
                .x(function (d, i) {
                    return base.x(base.time - (base.limit - 1 - i) * base.duration)
                })
                .y(function (d) {
                    return base.y(d)
                });

            base.svg = d3.select('#liveTrend')
                .append("svg")
                .attr('class', 'chart')
                .attr('width', base.width)
                .attr('height', base.height + 60)
            .style('padding-top', "20px");

            
            d3.select("#labelXTrend").remove();   
            base.svg.append("text")
                .attr("text-anchor", "end")
                .attr("id", 'labelXTrend')
                .attr("class", 'axisTitle')
                .attr("transform", "translate(" + (this.width / 2) + ", " + (this.height + 40) + ")")
                .text("Date/Time");

            base.groups = {
                current: {
                    value: 0,
                    color: 'steelblue',
                    data: d3.range(base.limit).map(function () {
                        return 0
                    })
                }
            }

            base.axis = base.svg.append('g')
                .attr('class', 'xAxis')
                .attr('transform', 'translate(0,' + base.height + ')')
                .call(base.x.axis = d3.svg.axis().scale(base.x).orient('bottom'));           

            base.ty = function (d) {
                return "translate(0," + base.y(d) + ")";
            };
            base.fy = base.y.tickFormat(10);

            base.yAxisGroup = base.svg.append("g");

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
                .attr("stroke", "#C0C0C0")
                .attr("x1", 0)
                .attr("x2", base.width);

            base.gy.exit().remove();  

            base.paths = base.svg.append('g');

            for (var name in base.groups) {
                var group = base.groups[name];
                group.path = base.paths.append('path')
                    .data([group.data])
                    .attr('class', name + ' group')
                    .style('stroke', group.color)
            }

            base.yAxis = d3.select('#liveTrendYAxis')
               .append("svg")
                .attr("id", "yAxisSVG")
               .attr('width', 200)
               .attr('height', base.height + 60)
               .style('padding-top', "20px")
                    .append("g")
                    .attr("class", "yAxis")
                    .attr("stroke-width", 2)
                    .attr('transform', 'translate(63, 0)')
                    .call(d3.svg.axis().scale(base.y).orient('left').ticks(15))
                    .append("text")
                        .attr("fill", "#000")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 6)
                        .attr("dy", "0.71em")
                        .attr("text-anchor", "end");

            d3.select("#labelYTrend").remove();
            d3.select('#yAxisSVG').append("text")
                .attr("text-anchor", "middle")
                .attr("id", 'labelYTrend')
                .attr("class", 'axisTitle')
                .attr("transform", "translate(10," + (base.height / 2) + ")rotate(-90)")
                .text("Heart Rate (bpm)");
        }

        LiveHRChart.prototype.updateChart = function (data) {
            var base = this;
            $.each(data, function (i, d) {
                if (base.trendData.length == 0) {
                    console.log("Live Chart: " + d.DateTime);
                    base.trendData.push(d);
                }
                if (new Date(d.DateTime) > new Date(base.trendData[base.trendData.length - 1].DateTime)) {
                    console.log("Live Chart: " + d.DateTime);
                    base.trendData.push(d);
                }
                
            });
            base.tick(base);
            //base.trendData.push.apply(base.trendData, data);
            console.log("Trend Data updated")
        }

        //LiveHRChart.prototype.timer = function () {
        //    var base = this;
        //    base.liveHRTimer = setInterval(function () {
        //        console.log("Live HR Timer Tick");
        //        base.tick(base);
        //    }, 1500);
        //    console.log("Timer Started");
        //}
        
        LiveHRChart.prototype.tick = function () {
            var base = this;
            if (base.trendData.length > 0) {
                base.time = base.time + base.duration;
                var group = base.groups["current"];
                group.data.push(parseInt(base.trendData[0].Value));
                group.path.attr('d', base.line);

                // Shift domain
                base.x.domain([base.time - (base.limit - 2) * base.duration, base.time - base.duration]);

                // Slide x-axis left
                base.axis.transition()
                    .duration(base.duration)
                    .ease('linear')
                    .call(base.x.axis);

                $.each(d3.selectAll(".xAxis text")[0], function (i, d) {
                    if (d.innerHTML.substr(0, 1) != ":")
                            d.innerHTML = base.parseTime(d.__data__);
                    });

                //base.axis.selectAll("g").text(function (d) {
                //    return base.parseTime(d);
                //});

                // Slide paths left
                base.paths.attr('transform', null)
                    .transition()
                    .duration(base.duration)
                    .ease('linear')
                    .attr('transform', 'translate(' + base.x(base.time - (base.limit - 1) * base.duration) + ')')
                    .each('end', function () { base.tick(base); });

                // Remove oldest data point from each group
                for (var name in base.groups) {
                    var group = base.groups[name]
                    group.data.shift();
                }

                base.trendData.shift();
            }
        }
        return LiveHRChart;
    })();

    return liveHRChartModule;
}(liveHRChartModule || {}));