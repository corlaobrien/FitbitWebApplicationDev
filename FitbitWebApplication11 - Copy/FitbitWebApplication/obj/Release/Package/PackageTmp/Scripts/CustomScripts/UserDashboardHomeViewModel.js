var userDashboardModule = (function (userDashboardModule) {

    var liveChart = null;
    var liveTimer;
    var spinner = new LoadingSpinnerModule();
    var userDropdown;
    var barChart = null;

    userDashboardModule.userDashboardHomeViewModel = {
        //barChart: ko.observable(null),
        userAnnotations: ko.observableArray([]),
        averageSessions: ko.observable(),
        averageDuration: ko.observable(),
        ageStart: ko.observable(0),
        ageEnd: ko.observable(110),
        genderFilter: ko.observable("All"),
        occupationFilter: ko.observable("All"),
        userEmailAddresses: ko.observableArray([]),
        selectedUser: ko.observable(),
        dateStart: ko.observable(new Date(moment().subtract(7, 'days').startOf('day').toString())),
        dateEnd: ko.observable(new Date(moment().subtract(1, 'days').endOf('day').toString())),
        liveHRChart: ko.observable(),
        showingLiveChart: ko.observable(false),
        liveData: ko.observableArray(),
        dateRangeSelected: ko.observable(),
        selectedChart: ko.observable("LiveChart"),
        thresholdAnalysis: ko.observable("Off"),
        annotationDescription: ko.observable(""),
        hrThreshold: ko.observable(100),
        tag: ko.observableArray([]),
        selectedTags: ko.observableArray(["CardiovascularExercise"]),
        comparisons: ko.observableArray([{ value: "sessions", text: "# of Workouts" }, { value: "duration", text: "Duration of Workouts" }]),
        selectedComparison: ko.observable("workouts"),
        ageGroups: ko.observableArray([{ value: "0,18", text: "< 18" }, { value: "18,25", text: "18-25" }, { value: "26,35", text: "26-35" }, { value: "36,45", text: "36-45" }, { value: "46,55", text: "46-55" },
            { value: "56,65", text: "56-65" }, { value: "66,75", text: "66-75" }, { value: "76,85", text: "76-85" }, { value: "86, 150", text: "86+" }]),
        selectedAgeGroup: ko.observable(),
        dashboardInitialise: function () {

            $("#dashboardContainer").css("visibility", "visible");
            $("#heartRateContainer").css("visibility", "collapse");

            //d3.csv("../Controllers/data3.csv", function (error, data) {
            //    data.forEach(function (d) {
            //        d.session = d.session;
            //        d.population = parseInt(d.population);
            //    });
            //    pieChart = new pieChartModule.PieChart(data);
            //});

            userDashboardModule.userDashboardHomeViewModel.getAnnotations();
        },
        getAnnotations: function () {
            userDashboardModule.userDashboardHomeViewModel.userAnnotations([]);
            $.ajax({
                type: "POST",
                url: "GetAnnotations",
                dataType: "json",
                contentType: 'application/json;charset=utf-8',
                data: JSON.stringify({
                    dateStart: userDashboardModule.userDashboardHomeViewModel.dateStart(),
                    dateEnd: userDashboardModule.userDashboardHomeViewModel.dateEnd(),
                    ageStart: userDashboardModule.userDashboardHomeViewModel.ageStart(),
                    ageEnd: userDashboardModule.userDashboardHomeViewModel.ageEnd(),
                    gender: userDashboardModule.userDashboardHomeViewModel.genderFilter(),
                    occupation: userDashboardModule.userDashboardHomeViewModel.occupationFilter()
                }),
                success: function (data) {
                    $.each(data.currentUserAnnotation, function (i, d) {
                        var diff = Math.abs(new Date(d.DateTimeEnd) - new Date(d.DateTimeStart));
                        var minutes = Math.floor((diff / 1000) / 60);
                        userDashboardModule.userDashboardHomeViewModel.userAnnotations.push({
                            id: i + 1,
                            startDateFormat: moment(d.DateTimeStart).format('DD/MMM/YYYY HH:mm'),
                            startDate: d.DateTimeStart,
                            endDate: d.DateTimeEnd,
                            duration: minutes,
                            description: d.Description
                        });
                    });
                    userDashboardModule.userDashboardHomeViewModel.averageSessions(data.averageSessions);
                    userDashboardModule.userDashboardHomeViewModel.averageDuration(data.averageDuration);
                    userDashboardModule.userDashboardHomeViewModel.selectedUser(data.UserDetails);

                    if (barChart == null) {
                        barChart = new barChartModule.BarChart([{ user: "You", sessions: data.currentUserAnnotation.length, duration: data.averageDurationUser }, { user: "Others", sessions: data.averageSessions, duration: data.averageDurationOthers }]);
                        //userDashboardModule.userDashboardHomeViewModel.barChart(barChart);
                    }
                    else {
                        barChart.setBarData([{ user: "You", sessions: data.currentUserAnnotation.length, duration: data.averageDurationUser }, { user: "Others", sessions: data.averageSessions, duration: data.averageDurationOthers }]);
                        barChart.update();
                    }
                },
                error: function (data) {
                    console.log(data);
                }
            });
        },
        calculateAge: function(dob) {
            var ageDifMs = Date.now() - new Date(dob).getTime();
            var ageDate = new Date(ageDifMs); // miliseconds from epoch
            return Math.abs(ageDate.getUTCFullYear() - 1970);
        },
        capitaliseFirstLetter: function (word) {
            return word.charAt(0).toUpperCase() + word.substr(1);
        },
        backToDashboard: function() {
            $("#dashboardContainer").css("visibility", "visible");
            $("#heartRateContainer").css("visibility", "collapse");
            $("#thresholdTrend").html("");
            $("#trend").html("");
            $("#liveTrendYAxis").html("");
            $("#liveTrend").html("");
            $("#multiLineTrend").html("");
            userDashboardModule.userDashboardHomeViewModel.getAnnotations();
        },
        goToAnnotation: function (data) {
            spinner.showSpinner();
            userDashboardModule.userDashboardHomeViewModel.dateStart(moment(data.startDate).startOf('day'));
            userDashboardModule.userDashboardHomeViewModel.dateEnd(moment(data.endDate).endOf('day'));
            $.ajax({
                type: "POST",
                url: "GetTrendData",
                dataType: "json",
                contentType: 'application/json;charset=utf-8',
                data: JSON.stringify({
                    user: [],
                    dateStart: userDashboardModule.userDashboardHomeViewModel.dateStart(),
                    dateEnd: userDashboardModule.userDashboardHomeViewModel.dateEnd()
                }),
                success: function (data) {
                    userDashboardModule.userDashboardHomeViewModel.chartViewInitialise();
                    hrChart = new heartRateChartModule.HRChart(data.result, data.annotation);
                    spinner.destroySpinner();
                },
                error: function (data) {
                    console.log(data);
                    spinner.destroySpinner();
                }
            });
            
        },
        chartViewInitialise: function () {
            userDashboardModule.userDashboardHomeViewModel.selectedChart("TrendChart");
            $("#dashboardContainer").css("visibility", "collapse");
            $("#heartRateContainer").css("visibility", "visible");

            userDashboardModule.userDashboardHomeViewModel.switchChart();

            $('#daterange span').html(moment(userDashboardModule.userDashboardHomeViewModel.dateStart()).format('D MMMM YYYY') + ' - ' + moment(userDashboardModule.userDashboardHomeViewModel.dateEnd()).format('D MMMM YYYY'));
            userDashboardModule.userDashboardHomeViewModel.dateRangeSelected(moment(userDashboardModule.userDashboardHomeViewModel.dateStart()).format('D MMMM YYYY') + ' - ' + moment(userDashboardModule.userDashboardHomeViewModel.dateEnd()).format('D MMMM YYYY'));


            $("#daterange").daterangepicker(
                {
                    startDate: moment().subtract(7, 'days').startOf('day'),
                    endDate: moment().subtract(1, 'days').endOf('day'),
                    minDate: moment().subtract(1, 'years'),
                    maxDate: moment(),
                    dateLimit: { days: 180 },
                    showDropdowns: true,
                    showWeekNumbers: true,
                    timePicker: true,
                    timePickerIncrement: 1,
                    timePicker12Hour: true,
                    ranges: {
                        'Live': [moment().startOf('day'), moment().endOf('day')]
                    },
                    opens: 'right',
                    buttonClasses: ['btn btn-default'],
                    applyClass: 'btn-small btn-primary',
                    cancelClass: 'btn-small',
                    format: 'DD/MM/YYYY',
                    separator: ' to ',
                    locale: {
                        applyLabel: 'Submit',
                        fromLabel: 'From',
                        toLabel: 'To',
                        customRangeLabel: "Custom Range",
                        daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
                        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                        firstDay: 1
                    }
                }
            );
        },
        startTimer: function () {
            liveTimer = setInterval(function () {
                console.log("Timer Tick");
                if (userDashboardModule.userDashboardHomeViewModel.showingLiveChart()) {
                    userDashboardModule.userDashboardHomeViewModel.getLiveHRData();
                }
                else {
                    clearInterval(liveTimer);
                }
            }, 28000);
            console.log("Timer Started");
        },
        updateLiveChart: function () {
            if (userDashboardModule.userDashboardHomeViewModel.showingLiveChart()) {
                if (liveChart != null && userDashboardModule.userDashboardHomeViewModel.liveData().length > 0) {
                    liveChart.updateChart(userDashboardModule.userDashboardHomeViewModel.liveData());
                }
                else if (liveChart == null && userDashboardModule.userDashboardHomeViewModel.liveData().length > 0)
                    userDashboardModule.userDashboardHomeViewModel.switchChart();
                    liveChart = new liveHRChartModule.LiveHRChart(userDashboardModule.userDashboardHomeViewModel.liveData());
            }
        },
        getLiveHRData: function () {
            // Add back in
            //$.ajax({
            //    type: "POST",
            //    url: "GetLiveTrendData",
            //    dataType: "json",
            //    contentType: 'application/json;charset=utf-8',
            //    data: JSON.stringify({
            //        user: userDashboardModule.userDashboardHomeViewModel.selectedUser().emailAddress
            //    }),
            //    success: function (data) {
            //        var trendData = data.DataList.sort(function (a, b) {
            //            return new Date(a.DateTime) - new Date(b.DateTime);
            //        });

            //        $.each(trendData, function (i, d) {
            //            if (new Date() - new Date(d.DateTime) < 600000) {
            //                if (userDashboardModule.userDashboardHomeViewModel.liveData().length == 0) {
            //                    userDashboardModule.userDashboardHomeViewModel.liveData().push(d);
            //                }
            //                else {
            //                    if (new Date(d.DateTime) > new Date(userDashboardModule.userDashboardHomeViewModel.liveData()[userDashboardModule.userDashboardHomeViewModel.liveData().length - 1].DateTime)) {
            //                        console.log(d.DateTime);
            //                        userDashboardModule.userDashboardHomeViewModel.liveData().push(d);
            //                    }
            //                }
            //            }
            //        });
            //        userDashboardModule.userDashboardHomeViewModel.updateLiveChart();
            //    },
            //    error: function (data) {
            //        console.log(data);
            //    }
            //});
            //CSV
            d3.csv("../Controllers/data2.csv", function (error, data) {
                data.forEach(function (d) {
                    d.DateTime = d.DateTime;
                    d.Name = d.Name;
                    d.Value = d.Value;
                    d.UserID = d.UserID;

                    userDashboardModule.userDashboardHomeViewModel.liveData().push(d);
                });
                //userDashboardModule.userDashboardHomeViewModel.liveData().push.apply(userDashboardModule.userDashboardHomeViewModel.liveData(), data);
                userDashboardModule.userDashboardHomeViewModel.updateLiveChart();
            });
        },
        drawTrendChart: function (trendData) {
            $.ajax({
                type: "POST",
                url: "GetTrendData",
                dataType: "json",
                contentType: 'application/json;charset=utf-8',
                data: JSON.stringify({
                    user: $("#userDropdown").val(),
                    dateStart: userDashboardModule.userDashboardHomeViewModel.dateStart(),
                    dateEnd: userDashboardModule.userDashboardHomeViewModel.dateEnd()
                }),
                success: function (data) {
                    if (userDashboardModule.userDashboardHomeViewModel.selectedChart() == "TrendChart") {
                        hrChart = new heartRateChartModule.HRChart(data.result, data.annotation);
                    }                    
                },
                error: function (data) {
                    console.log(data);
                }
            });
        },
        switchThresholdGraph: function () {
            var url;
            if (userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis() == 'On') {
                url = "GetTrendData";
                userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis('Off');
                userDashboardModule.userDashboardHomeViewModel.selectedChart("TrendChart");
                userDashboardModule.userDashboardHomeViewModel.drawTrendChart();
                userDashboardModule.userDashboardHomeViewModel.switchChart();
            }
            else if (userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis() == 'Off') {
                url = "GetMovingAverageTrendData";
                userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis('On');
                userDashboardModule.userDashboardHomeViewModel.selectedChart("ThresholdChart");
                userDashboardModule.userDashboardHomeViewModel.switchChart();

                $.ajax({
                    type: "POST",
                    url: url,
                    dataType: "json",
                    contentType: 'application/json;charset=utf-8',
                    data: JSON.stringify({
                        user: $("#userDropdown").val(),
                        threshold: userDashboardModule.userDashboardHomeViewModel.hrThreshold(),
                        dateStart: userDashboardModule.userDashboardHomeViewModel.dateStart(),
                        dateEnd: userDashboardModule.userDashboardHomeViewModel.dateEnd()
                    }),
                    success: function (data) {
                        thresholdChart = new thresholdHeartRateChartModule.ThresholdHRChart(data);
                    },
                    error: function (data) {
                        console.log(data);
                    }
                });
            }   
        },
        switchChart: function () {
            spinner.showSpinner();
            $("#thresholdTrend").html("");
            $("#trend").html("");
            $("#liveTrendYAxis").html("");
            $("#liveTrend").html("");
            $("#yAxisSVG").remove();
            $("#multiLineTrend").html("");
            d3.select("#multiLineLegend .legend").remove();

            switch (userDashboardModule.userDashboardHomeViewModel.selectedChart()) {
                case "LiveChart":
                    $("#trend").css("visibility", "hidden");
                    $("#thresholdTrend").css("visibility", "hidden");
                    $("#multiLineTrend").css("visibility", "hidden");
                    $("#multiLineLegend").css("visibility", "hidden");
                    $("#liveTrendYAxis").css("visibility", "");
                    $("#liveTrend").css("visibility", "");
                    userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis("Off");
                    userDashboardModule.userDashboardHomeViewModel.showingLiveChart(true);
                    break;

                case "ThresholdChart":
                    $("#trend").css("visibility", "hidden");
                    $("#liveTrendYAxis").css("visibility", "hidden");
                    $("#liveTrend").css("visibility", "hidden");
                    $("#thresholdTrend").css("visibility", "");
                    $("#multiLineTrend").css("visibility", "hidden");
                    $("#multiLineLegend").css("visibility", "hidden");
                    userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis("On");
                    userDashboardModule.userDashboardHomeViewModel.showingLiveChart(false);
                    break;

                case "TrendChart":
                    $("#trend").css("visibility", "");
                    $("#liveTrendYAxis").css("visibility", "hidden");
                    $("#liveTrend").css("visibility", "hidden");
                    $("#thresholdTrend").css("visibility", "hidden");
                    $("#multiLineTrend").css("visibility", "hidden");
                    $("#multiLineLegend").css("visibility", "hidden");
                    userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis("Off");
                    userDashboardModule.userDashboardHomeViewModel.showingLiveChart(false);
                    break;

                    //case "MultiLineTrendChart":                    
                    //    $("#trend").css("visibility", "");
                    //    $("#liveTrendYAxis").css("visibility", "hidden");
                    //    $("#liveTrend").css("visibility", "hidden");
                    //    $("#thresholdTrend").css("visibility", "hidden");
                    //    $("#multiLineTrend").css("visibility", "");
                    //    $("#multiLineLegend").css("visibility", "");
                    //    userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis("Off");
                    //    userDashboardModule.userDashboardHomeViewModel.showingLiveChart(false);
                    //    break;

            }
            spinner.destroySpinner();
        },
        saveAnnotation: function() {
            $("#saveAnnotation").modal("show");

        },
        confirmSaveAnnotation: function () {
            $.ajax({
                type: "POST",
                url: "SaveAnnotation",
                dataType: "json",
                contentType: 'application/json;charset=utf-8',
                data: JSON.stringify({                    
                    startDateTime: base.annotation[0],
                    endDateTime: base.annotation[1],
                    userId: base.selectedPoint.UserID,
                    description: userDashboardModule.userDashboardHomeViewModel.annotationDescription()
                }),
                success: function (data) {
                    $("#saveAnnotation").modal("hide");

                    hrChart.updateAnnotation(data);
                    
                },
                error: function (data) {
                    console.log("Failed");
                }
            });
        },
        openUserFilter: function () {
            $("#usersFilter").modal("show");
        },
        filterUsers: function() {
            userDashboardModule.userDashboardHomeViewModel.getAnnotations();
            $("#usersFilter").modal("hide");
        },
        saveSettings: function () {
            if (userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis() == 'On'){

                $.ajax({
                    type: "POST",
                    url: "GetMovingAverageTrendData",
                    dataType: "json",
                    contentType: 'application/json;charset=utf-8',
                    data: JSON.stringify({
                        user: $("#userDropdown").val(),
                        threshold: userDashboardModule.userDashboardHomeViewModel.hrThreshold(),
                        dateStart: userDashboardModule.userDashboardHomeViewModel.dateStart(),
                        dateEnd: userDashboardModule.userDashboardHomeViewModel.dateEnd()
                    }),
                    success: function (data) {
                            userDashboardModule.userDashboardHomeViewModel.selectedChart("ThresholdChart");
                            userDashboardModule.userDashboardHomeViewModel.switchChart();
                            thresholdChart = new thresholdHeartRateChartModule.ThresholdHRChart(data);
                            $("#chartSettings").modal("hide");
                    },
                    error: function (data) {
                        console.log(data);
                    }
                });
            }        
        },
        openHRGraphSettings: function () {
            $("#hrGraphSettings").modal("show");
        },
        saveHRGraphSettings: function () {
            spinner.showSpinner();
            $('#daterange span').html($("#daterange").data('daterangepicker').startDate.format('D MMMM YYYY') + ' - ' + $("#daterange").data('daterangepicker').endDate.format('D MMMM YYYY'));
            userDashboardModule.userDashboardHomeViewModel.dateRangeSelected($("#daterange").data('daterangepicker').startDate.format('D MMMM YYYY HH:mm') + ' - ' + $("#daterange").data('daterangepicker').endDate.format('D MMMM YYYY HH:mm'));
            userDashboardModule.userDashboardHomeViewModel.dateStart(new Date($("#daterange").data('daterangepicker').startDate.toString()));
            userDashboardModule.userDashboardHomeViewModel.dateEnd(new Date($("#daterange").data('daterangepicker').endDate.toString()));

            if ($("#daterange").data('daterangepicker').chosenLabel == "Live") {
                userDashboardModule.userDashboardHomeViewModel.selectedChart("LiveChart");
                userDashboardModule.userDashboardHomeViewModel.switchChart();
                userDashboardModule.userDashboardHomeViewModel.getLiveHRData();
                userDashboardModule.userDashboardHomeViewModel.startTimer();
            }
            else {
                if (userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis() == 'On') {
                    url = "GetMovingAverageTrendData";
                    data = JSON.stringify({
                        user: userDashboardModule.userDashboardHomeViewModel.selectedUser().Email,
                        threshold: userDashboardModule.userDashboardHomeViewModel.hrThreshold(),
                        dateStart: userDashboardModule.userDashboardHomeViewModel.dateStart(),
                        dateEnd: userDashboardModule.userDashboardHomeViewModel.dateEnd()
                    });
                }
                else {
                    url = "GetTrendData";
                    data = JSON.stringify({
                        user: userDashboardModule.userDashboardHomeViewModel.selectedUser().Email,
                        dateStart: userDashboardModule.userDashboardHomeViewModel.dateStart(),
                        dateEnd: userDashboardModule.userDashboardHomeViewModel.dateEnd()
                    });
                }

                $.ajax({
                    type: "POST",
                    url: url,
                    dataType: "json",
                    contentType: 'application/json;charset=utf-8',
                    data: data,
                    success: function (data) {
                        if (userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis() == 'On') {
                            userDashboardModule.userDashboardHomeViewModel.selectedChart("ThresholdChart");
                            userDashboardModule.userDashboardHomeViewModel.switchChart();
                            thresholdChart = new thresholdHeartRateChartModule.ThresholdHRChart(data);
                        }
                        else if (userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis() == 'Off') {
                            userDashboardModule.userDashboardHomeViewModel.selectedChart("TrendChart");
                            userDashboardModule.userDashboardHomeViewModel.switchChart();
                            hrChart = new heartRateChartModule.HRChart(data.result, data.annotation);
                        }
                        spinner.destroySpinner();
                    },
                    error: function (data) {
                        console.log(data);
                        spinner.destroySpinner();
                    }
                });
            }
            $("#hrGraphSettings").modal("hide");
        },
    };

    var init = userDashboardModule.init;
    userDashboardModule.init = function () {
        ko.applyBindings(userDashboardModule.userDashboardHomeViewModel, document.getElementById("pageContainer"));

        userDashboardModule.userDashboardHomeViewModel.selectedComparison.subscribe(function () {
            barChart.update();
        });

        userDashboardModule.userDashboardHomeViewModel.dashboardInitialise();

        $('button[name="daterange"]').on('hide.daterangepicker', function (ev, picker) {
            $('#daterange span').html(picker.startDate.format('D MMMM YYYY') + ' - ' + picker.endDate.format('D MMMM YYYY'));
            userDashboardModule.userDashboardHomeViewModel.dateRangeSelected(picker.startDate.format('D MMMM YYYY') + ' - ' + picker.endDate.format('D MMMM YYYY'));
            userDashboardModule.userDashboardHomeViewModel.dateStart(new Date(picker.startDate.toString()));
            userDashboardModule.userDashboardHomeViewModel.dateEnd(new Date(picker.endDate.toString()));

            $('button[name="daterange"]').daterangepicker(
                       {
                           startDate: userDashboardModule.userDashboardHomeViewModel.dateStart(),
                           endDate: userDashboardModule.userDashboardHomeViewModel.dateEnd(),
                           minDate: moment().subtract(1, 'years'),
                           maxDate: moment(),
                           dateLimit: { days: 180 },
                           showDropdowns: true,
                           showWeekNumbers: true,
                           timePicker: true,
                           timePickerIncrement: 1,
                           timePicker12Hour: true,
                           ranges: {
                               'Today': [moment(), moment()]
                           },
                           opens: 'right',
                           buttonClasses: ['btn btn-default'],
                           applyClass: 'btn-small btn-primary',
                           cancelClass: 'btn-small',
                           format: 'DD/MM/YYYY',
                           separator: ' to ',
                           locale: {
                               applyLabel: 'Submit',
                               fromLabel: 'From',
                               toLabel: 'To',
                               customRangeLabel: userDashboardModule.userDashboardHomeViewModel.dateRangeSelected(),
                               daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
                               monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                               firstDay: 1
                           }
                       }
                    );

            if (picker.startDate.toString() == moment().toString() && picker.endDate.toString() == moment().toString()) {
                userDashboardModule.userDashboardHomeViewModel.selectedChart("LiveChart");
                userDashboardModule.userDashboardHomeViewModel.switchChart();
                userDashboardModule.userDashboardHomeViewModel.getLiveHRData();
                userDashboardModule.userDashboardHomeViewModel.startTimer();
            }
            else {
                if (userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis() == 'On') {
                    url = "GetMovingAverageTrendData";
                    data = JSON.stringify({
                        user: $("#userDropdown").val(),
                        threshold: userDashboardModule.userDashboardHomeViewModel.hrThreshold(),
                        dateStart: userDashboardModule.userDashboardHomeViewModel.dateStart(),
                        dateEnd: userDashboardModule.userDashboardHomeViewModel.dateEnd()
                    });
                }
                else {
                    url = "GetTrendData";
                    data = JSON.stringify({
                        user: $("#userDropdown").val(),
                        dateStart: userDashboardModule.userDashboardHomeViewModel.dateStart(),
                        dateEnd: userDashboardModule.userDashboardHomeViewModel.dateEnd()
                    });
                }

                $.ajax({
                    type: "POST",
                    url: url,
                    dataType: "json",
                    contentType: 'application/json;charset=utf-8',
                    data: data,
                    success: function (data) {
                        if (userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis() == 'On') {
                            userDashboardModule.userDashboardHomeViewModel.selectedChart("ThresholdChart");
                            userDashboardModule.userDashboardHomeViewModel.switchChart();
                            thresholdChart = new thresholdHeartRateChartModule.ThresholdHRChart(data);
                        }
                        else if (userDashboardModule.userDashboardHomeViewModel.thresholdAnalysis() == 'Off') {
                            userDashboardModule.userDashboardHomeViewModel.selectedChart("TrendChart");
                            userDashboardModule.userDashboardHomeViewModel.switchChart();
                            hrChart = new heartRateChartModule.HRChart(data.result, data.annotation);
                        }                        
                    },
                    error: function (data) {
                        console.log(data);
                    }
                });
            }
        });
        $('button[name="daterange"]').css("font-size", "14px");

        $("#tagsSelection").select2({
            maximumSelectionLength: 1
        });

        $("#tagSource").select2({
        });

        $('#dataStream').css("font-size", "14px");

        $('#saveAnnotation').on('hidden.bs.modal', function () {
            userDashboardModule.userDashboardHomeViewModel.annotationDescription("");
        });
        if (init) {
            init.apply(this, arguments);
        }
    };

    return userDashboardModule;
}(userDashboardModule || {}));