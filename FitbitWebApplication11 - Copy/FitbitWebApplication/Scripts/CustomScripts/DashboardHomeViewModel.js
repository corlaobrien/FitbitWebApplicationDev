var dashboardModule = (function (dashboardModule) {

    var liveChart = null;
    var liveTimer;
    var spinner = new LoadingSpinnerModule();
    var userDropdown;
    var pieChart = null;
    var barChart = null;
    var bubbleChart = null;

    dashboardModule.dashboardHomeViewModel = {
        initialLoad: ko.observable(false),
        physicianID: ko.observable(),
        users: ko.observableArray([]),
        usersFiltered: ko.observableArray([]),
        ageStart: ko.observable(0),
        ageEnd: ko.observable(130),
        genderFilter: ko.observable("None"),
        occupationFilter: ko.observable("None"),
        userEmailAddresses: ko.observableArray([]),
        selectedUser: ko.observable(),
        dateStart: ko.observable(new Date(moment().subtract(7, 'days').startOf('day').toString())),
        dateEnd: ko.observable(new Date(moment().subtract(1, 'days').endOf('day').toString())),
        liveHRChart: ko.observable(),
        showingLiveChart: ko.observable(false),
        liveData: ko.observableArray(),
        dateRangeSelected: ko.observable(moment().subtract(7, 'days').startOf('day').format('D MMMM YYYY HH:mm') + ' - ' + moment().subtract(1, 'days').endOf('day').format('D MMMM YYYY HH:mm')),
        selectedChart: ko.observable("LiveChart"),
        thresholdAnalysis: ko.observable("Off"),
        annotationDescription: ko.observable(""),
        hrThreshold: ko.observable(100),
        emailAddressToAdd: ko.observable(""),
        userType: ko.observable(),
        selectedChartType: ko.observable("summary"),
        breakdownXAxis: ko.observable("gender"),
        thresholdOperation: ko.observable(),
        thresholdValue: ko.observable(""),
        dashboardStatisticsHeading: ko.observable(),
        tag: ko.observableArray([]),
        selectedTags: ko.observableArray(["CardiovascularExercise"]),
        populationUsers: ko.observable(),
        numberofSessions: ko.observable("All"),
        dashboardInitialise: function () {
            spinner.showSpinner();
            dashboardModule.dashboardHomeViewModel.initialLoad(true);

            $("#dashboardContainer").css("visibility", "visible");
            $("#heartRateContainer").css("visibility", "collapse");
                        
            $.ajax({
                type: "POST",
                url: "GetUsers",
                dataType: "json",
                data: JSON.stringify({
                    dateStart: dashboardModule.dashboardHomeViewModel.dateStart(),
                    dateEnd: dashboardModule.dashboardHomeViewModel.dateEnd(),
                    ageStart: dashboardModule.dashboardHomeViewModel.ageStart(),
                    ageEnd: dashboardModule.dashboardHomeViewModel.ageEnd(),
                    gender: dashboardModule.dashboardHomeViewModel.genderFilter(),
                    occupation: dashboardModule.dashboardHomeViewModel.occupationFilter(),
                    chartType: dashboardModule.dashboardHomeViewModel.selectedChartType(),
                    breakdownX: dashboardModule.dashboardHomeViewModel.breakdownXAxis(),
                    selectedTags: $("#tagSource").val()
                }),
                contentType: 'application/json;charset=utf-8',
                success: function (data) {
                    dashboardModule.dashboardHomeViewModel.populationUsers(data.userSessions);
                    if (data.users.length > 0) {
                        dashboardModule.dashboardHomeViewModel.physicianID(data.users[0].m.SuperUserId);

                        $.ajax({
                            type: "POST",
                            url: "GetUserType",
                            dataType: "json",
                            async: false,
                            data: JSON.stringify({
                                superUserId: dashboardModule.dashboardHomeViewModel.physicianID()
                            }),
                            contentType: 'application/json;charset=utf-8',
                            success: function (userType) {
                                dashboardModule.dashboardHomeViewModel.userType(userType);
                            },
                            error: function (userType) {
                                dashboardModule.dashboardHomeViewModel.userType("User");
                            }
                        });


                        var userData = data.users.sort(function (a, b) {
                            if ((a.t.Email).toLowerCase() < (b.t.Email).toLowerCase()) return -1;
                            if ((a.t.Email).toLowerCase() > (b.t.Email).toLowerCase()) return 1;
                            return 0;
                        });
                    }

                    $.each(userData, function (i, d) {
                        dashboardModule.dashboardHomeViewModel.usersFiltered.push({
                            userId: d.t.id, firstName: d.t.FirstName, surname: d.t.Surname, emailAddress: d.t.Email,
                            age: dashboardModule.dashboardHomeViewModel.calculateAge(d.t.DOB), gender: dashboardModule.dashboardHomeViewModel.capitaliseFirstLetter(d.t.Gender),
                            occupationType: dashboardModule.dashboardHomeViewModel.capitaliseFirstLetter(d.t.OccupationType), status: ko.observable({ status: 'unknown', rank: 0, color: "gray" })
                        });
                        dashboardModule.dashboardHomeViewModel.users.push({
                            userId: d.t.id, firstName: d.t.FirstName, surname: d.t.Surname, emailAddress: d.t.Email,
                            age: dashboardModule.dashboardHomeViewModel.calculateAge(d.t.DOB), gender: dashboardModule.dashboardHomeViewModel.capitaliseFirstLetter(d.t.Gender),
                            occupationType: dashboardModule.dashboardHomeViewModel.capitaliseFirstLetter(d.t.OccupationType), status: ko.observable({ status: 'unknown', rank: 0, color: "gray" })
                        });
                        dashboardModule.dashboardHomeViewModel.userEmailAddresses.push(d.t.Email);
                    });

                    pieChart = new pieChartModule.PieChart(data.sessions);
                    
                    $('button[name="dateRangeHomePage"]').daterangepicker(
                       {
                           startDate: moment().subtract(7, 'days').startOf('day'),
                           endDate: moment().subtract(1, 'days').endOf('day'),
                           minDate: moment().subtract(1, 'years'),
                           maxDate: moment(),
                           id: "dateRangeHomePage", 
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
                               customRangeLabel: dashboardModule.dashboardHomeViewModel.dateRangeSelected(),
                               daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
                               monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                               firstDay: 1
                           }
                       }
                    );

                    dashboardModule.dashboardHomeViewModel.dashboardStatisticsHeading("Summary of sessions for all " + dashboardModule.dashboardHomeViewModel.userType() + "s (" +
                        dashboardModule.dashboardHomeViewModel.dateRangeSelected() + ") - Sessions (# of " + dashboardModule.dashboardHomeViewModel.userType() + "s)");

                    dashboardModule.dashboardHomeViewModel.initialLoad(false);
                    spinner.destroySpinner();
                },
                error: function (data) {
                    console.log(data);
                    dashboardModule.dashboardHomeViewModel.initialLoad(false);
                    spinner.destroySpinner();
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
        openUsersFilter: function () {
            $("#usersFilter").modal("show");
        },
        filterUsers: function () {
            spinner.showSpinner();
            dashboardModule.dashboardHomeViewModel.usersFiltered(dashboardModule.dashboardHomeViewModel.users().filter(function (d, i) {
                //var age = dashboardModule.dashboardHomeViewModel.calculateAge(d.age);
                if (d.age > parseInt(dashboardModule.dashboardHomeViewModel.ageStart()) && d.age < parseInt(dashboardModule.dashboardHomeViewModel.ageEnd())
                    && (dashboardModule.dashboardHomeViewModel.genderFilter() == "None" || d.gender == dashboardModule.dashboardHomeViewModel.genderFilter())
                    && (dashboardModule.dashboardHomeViewModel.occupationFilter() == "None" || d.occupationType == dashboardModule.dashboardHomeViewModel.occupationFilter()))
                {
                    return d;
                }
            }));
            if (dashboardModule.dashboardHomeViewModel.thresholdValue() != "") {
                var userIds = [];
                $.each(dashboardModule.dashboardHomeViewModel.usersFiltered(), function (i, v) {
                    userIds.push(v.userId);
                });
                $.ajax({
                    type: "POST",
                    url: "AnalyseUsers",
                    dataType: "json",
                    data: JSON.stringify({
                        userIds: userIds,
                        thresholdValue: dashboardModule.dashboardHomeViewModel.thresholdValue(),
                    }),
                    contentType: 'application/json;charset=utf-8',
                    success: function (data) {

                        //var myArray = [{ status: "good", rank: 1, color: "green" }, { status: "bad", rank: 2, color: "orange" }, { status: "dead", rank: 3, color: "red" }, { status: 'unknown', rank: 0, color: "gray" }];

                        $.each(data, function (i, v) {
                            $.each(dashboardModule.dashboardHomeViewModel.usersFiltered(), function (index, value) {
                                if (v.userId == value.userId) {
                                    if (v.status == "unknown")
                                        value.status({ status: "unknown", rank: 0, color: "gray" })
                                    else if (v.status == "dead")
                                        value.status({ status: "dead", rank: 3, color: "red" });
                                    else if (v.status == "bad")
                                        value.status({ status: "bad", rank: 2, color: "orange" });
                                    else if (v.status == "good")
                                        value.status({ status: "good", rank: 1, color: "green" });                                    
                                }
                            });
                        });
                        dashboardModule.dashboardHomeViewModel.usersFiltered.sort(function (a, b) {
                            if (a.status().rank < b.status().rank) return 1;
                            if (a.status().rank > b.status().rank) return -1;
                            return 0;
                        });
                        if (dashboardModule.dashboardHomeViewModel.numberofSessions() != "All")
                            dashboardModule.dashboardHomeViewModel.filterFromPieChart({ Session: $("#numberSessions").val() });

                        dashboardModule.dashboardHomeViewModel.usersFiltered.valueHasMutated();

                        dashboardModule.dashboardHomeViewModel.applyChartSettings();
                        $("#usersFilter").modal("hide");
                        spinner.destroySpinner();
                    },
                    error: function (data) {
                        console.log(data);
                        spinner.destroySpinner();
                    }
                });                
            }
            else {
                if (dashboardModule.dashboardHomeViewModel.numberofSessions() != "All")
                    dashboardModule.dashboardHomeViewModel.filterFromPieChart({ Session: $("#numberSessions").val() });

                dashboardModule.dashboardHomeViewModel.applyChartSettings();
                $("#usersFilter").modal("hide");
                spinner.destroySpinner();
            }
        },
        openUserSettings: function() {
            $("#userSettings").modal("show");
        },
        removeUser: function (data) {
            spinner.showSpinner();
            $.ajax({
                type: "POST",
                url: "RemoveUser",
                dataType: "json",
                data: JSON.stringify({
                    userId: data.userId,
                    superUserId: dashboardModule.dashboardHomeViewModel.physicianID()
                }),
                contentType: 'application/json;charset=utf-8',
                success: function (success) {
                    $.each(dashboardModule.dashboardHomeViewModel.usersFiltered(), function (i, d) {
                        if (d.emailAddress == data.emailAddress) {
                            dashboardModule.dashboardHomeViewModel.usersFiltered().splice(i, 1);
                            return false;
                        }
                    });
                    $.each(dashboardModule.dashboardHomeViewModel.users(), function (i, d) {
                        if (d.emailAddress == data.emailAddress) {
                            dashboardModule.dashboardHomeViewModel.users().splice(i, 1);
                            return false;
                        }
                    });
                    dashboardModule.dashboardHomeViewModel.usersFiltered.valueHasMutated();
                    dashboardModule.dashboardHomeViewModel.users.valueHasMutated();
                    spinner.destroySpinner();
                },
                error: function (data) {
                    console.log(data);
                    spinner.destroySpinner();
                }
            });            
        },
        addUser: function () {
            $("#addUser").modal("show");
        },
        saveUserSettings: function () {
            spinner.showSpinner();
            $.ajax({
                type: "POST",
                url: "FindUser",
                dataType: "json",
                data: JSON.stringify({
                    emailAddress: dashboardModule.dashboardHomeViewModel.emailAddressToAdd(),
                    superUserId: dashboardModule.dashboardHomeViewModel.physicianID()
                }),
                contentType: 'application/json;charset=utf-8',
                success: function (success) {
                    if (success == "not_found") {
                        
                    }
                    else {
                        dashboardModule.dashboardHomeViewModel.usersFiltered.push({
                            userId: success.id, firstName: success.FirstName, surname: success.Surname, emailAddress: success.Email,
                            age: dashboardModule.dashboardHomeViewModel.calculateAge(success.DOB), gender: dashboardModule.dashboardHomeViewModel.capitaliseFirstLetter(success.Gender),
                            occupationType: dashboardModule.dashboardHomeViewModel.capitaliseFirstLetter(success.OccupationType), status: ko.observable({ status: 'unknown', rank: 0, color: "gray" })
                        });

                        dashboardModule.dashboardHomeViewModel.users.push({
                            userId: success.id, firstName: success.FirstName, surname: success.Surname, emailAddress: success.Email,
                            age: dashboardModule.dashboardHomeViewModel.calculateAge(success.DOB), gender: dashboardModule.dashboardHomeViewModel.capitaliseFirstLetter(success.Gender),
                            occupationType: dashboardModule.dashboardHomeViewModel.capitaliseFirstLetter(success.OccupationType), status: ko.observable({ status: 'unknown', rank: 0, color: "gray" })
                        });

                        dashboardModule.dashboardHomeViewModel.usersFiltered.sort(function (a, b) {
                            if ((a.emailAddress).toLowerCase() < (b.emailAddress).toLowerCase()) return -1;
                            if ((a.emailAddress).toLowerCase() > (b.emailAddress).toLowerCase()) return 1;
                            return 0;
                        });

                        dashboardModule.dashboardHomeViewModel.users.sort(function (a, b) {
                            if ((a.emailAddress).toLowerCase() < (b.emailAddress).toLowerCase()) return -1;
                            if ((a.emailAddress).toLowerCase() > (b.emailAddress).toLowerCase()) return 1;
                            return 0;
                        });

                        dashboardModule.dashboardHomeViewModel.usersFiltered.valueHasMutated();
                        dashboardModule.dashboardHomeViewModel.users.valueHasMutated();
                    }
                    $("#addUser").modal("hide");
                    spinner.destroySpinner();
                },
                error: function (data) {
                    console.log(data);
                    spinner.destroySpinner();
                }
            });
        },
        backToDashboard: function () {
            spinner.showSpinner();
            $("#dashboardContainer").css("visibility", "visible");
            $("#dashboardContainer").css("overflow", "visible");
            $("#heartRateContainer").css("visibility", "collapse");
            $("#thresholdTrend").html("");
            $("#trend").html("");
            $("#liveTrendYAxis").html("");
            $("#liveTrend").html("");
            $("#multiLineTrend").html("");
            dashboardModule.dashboardHomeViewModel.applyChartSettings();
        },
        goToUser: function (data) {
            spinner.showSpinner();
            dashboardModule.dashboardHomeViewModel.selectedUser(data);
            dashboardModule.dashboardHomeViewModel.chartViewInitialise();
            spinner.destroySpinner();
        },
        chartViewInitialise: function () {
            spinner.showSpinner();
            dashboardModule.dashboardHomeViewModel.selectedChart("LiveChart");
            $("#dashboardContainer").css("visibility", "collapse");
            $("#dashboardContainer").css("overflow", "hidden");
            $("#heartRateContainer").css("visibility", "visible");

            dashboardModule.dashboardHomeViewModel.switchChart();

            dashboardModule.dashboardHomeViewModel.dateStart(new Date(moment().startOf('day').toString()));
            dashboardModule.dashboardHomeViewModel.dateEnd(new Date(moment().endOf('day').toString()));

            $('#daterange span').html(moment().startOf('day').format('D MMMM YYYY') + ' - ' + moment().endOf('day').format('D MMMM YYYY'));
            dashboardModule.dashboardHomeViewModel.dateRangeSelected(moment().startOf('day').format('D MMMM YYYY HH:mm') + ' - ' + moment().endOf('day').format('D MMMM YYYY HH:mm'));

            //$('#daterange span').html(moment().subtract(7, 'days').startOf('day').format('D MMMM YYYY') + ' - ' + moment().subtract(1, 'days').endOf('day').format('D MMMM YYYY'));
            //dashboardModule.dashboardHomeViewModel.dateRangeSelected(moment().subtract(7, 'days').startOf('day').format('D MMMM YYYY') + ' - ' + moment().subtract(1, 'days').endOf('day').format('D MMMM YYYY'));

            //CSV
            d3.csv("../Controllers/data2.csv", function (error, data) {
                data.forEach(function (d) {
                    d.DateTime = d.DateTime;
                    d.Name = d.Name;
                    d.Value = d.Value;
                    d.UserID = d.UserID;

                    dashboardModule.dashboardHomeViewModel.liveData().push(d);
                });
                //dashboardModule.dashboardHomeViewModel.liveData().push.apply(dashboardModule.dashboardHomeViewModel.liveData(), data);
                dashboardModule.dashboardHomeViewModel.updateLiveChart();
            });

            // ADD BACK IN
            //$.ajax({
            //    type: "POST",
            //    url: "GetLiveTrendData",
            //    dataType: "json",
            //    contentType: 'application/json;charset=utf-8',
            //    data: JSON.stringify({
            //        user: $("#userDropdown").val()
            //    }),
            //    success: function (data) {
            //        dashboardModule.dashboardHomeViewModel.showingLiveChart(true);

            //        var trendData = data.DataList.sort(function (a, b) {
            //            return new Date(a.DateTime) - new Date(b.DateTime);
            //        });

            //        $.each(trendData, function (i, d) {
            //            if (new Date() - new Date(d.DateTime) < 600000) {
            //                if (dashboardModule.dashboardHomeViewModel.liveData().length == 0) {
            //                    dashboardModule.dashboardHomeViewModel.liveData().push(d);
            //                }
            //                else {
            //                    if (new Date(d.DateTime) > new Date(dashboardModule.dashboardHomeViewModel.liveData()[dashboardModule.dashboardHomeViewModel.liveData().length - 1].DateTime)) {
            //                        console.log(d.DateTime);
            //                        dashboardModule.dashboardHomeViewModel.liveData().push(d);
            //                    }
            //                }
            //            }
            //        });

            //        dashboardModule.dashboardHomeViewModel.updateLiveChart();
            //    },
            //    error: function (data) {
            //        console.log(data);
            //    }
            //});

            $('#userDropdown').multiselect({
                buttonClass: 'btn btn-xs btn-default pull-right users',
                numberDisplayed: 3,
                maxHeight: 300,
                nonSelectedText: 'None Selected',
                allSelectedText: 'All Selected',
                includeSelectAllOption: true,
                disableIfEmpty: false,
                enableCaseInsensitiveFiltering: true,
                templates: {
                    ul: '<ul class="multiselect-container dropdown-menu pull-right"></ul>'
                },
                onDropdownShow: function () {
                },
                onDropdownHidden: function (e) {
                    
                    if (dashboardModule.dashboardHomeViewModel.thresholdAnalysis() == 'Off')
                        dashboardModule.dashboardHomeViewModel.selectedChart("TrendChart");
                    else if (dashboardModule.dashboardHomeViewModel.thresholdAnalysis() == 'On')
                        dashboardModule.dashboardHomeViewModel.selectedChart("ThresholdChart");


                    switch (dashboardModule.dashboardHomeViewModel.selectedChart()) {
                        case "LiveChart":
                            dashboardModule.dashboardHomeViewModel.switchChart("LiveChart");
                            $.ajax({
                                type: "POST",
                                url: "GetLiveTrendData",
                                dataType: "json",
                                contentType: 'application/json;charset=utf-8',
                                data: JSON.stringify({
                                    user: dashboardModule.dashboardHomeViewModel.selectedUser().emailAddress
                                }),
                                success: function (data) {
                                    dashboardModule.dashboardHomeViewModel.showingLiveChart(true);

                                    var trendData = data.DataList.sort(function (a, b) {
                                        return new Date(a.DateTime) - new Date(b.DateTime);
                                    });

                                    $.each(trendData, function (i, d) {
                                        if (new Date() - new Date(d.DateTime) < 600000) {
                                            if (dashboardModule.dashboardHomeViewModel.liveData().length == 0) {
                                                dashboardModule.dashboardHomeViewModel.liveData().push(d);
                                            }
                                            else {
                                                if (new Date(d.DateTime) > new Date(dashboardModule.dashboardHomeViewModel.liveData()[dashboardModule.dashboardHomeViewModel.liveData().length - 1].DateTime)) {
                                                    console.log(d.DateTime);
                                                    dashboardModule.dashboardHomeViewModel.liveData().push(d);
                                                }
                                            }
                                        }
                                    });

                                    dashboardModule.dashboardHomeViewModel.updateLiveChart();
                                },
                                error: function (data) {
                                    console.log(data);
                                }
                            });
                            break;

                        case "ThresholdChart":
                            dashboardModule.dashboardHomeViewModel.switchChart("ThresholdChart");
                            $.ajax({
                                type: "POST",
                                url: "GetMovingAverageTrendData",
                                dataType: "json",
                                contentType: 'application/json;charset=utf-8',
                                data: JSON.stringify({
                                    user: dashboardModule.dashboardHomeViewModel.selectedUser().emailAddress,
                                    threshold: dashboardModule.dashboardHomeViewModel.hrThreshold(),
                                    dateStart: dashboardModule.dashboardHomeViewModel.dateStart(),
                                    dateEnd: dashboardModule.dashboardHomeViewModel.dateEnd()
                                }),
                                success: function (data) {
                                    thresholdChart = new thresholdHeartRateChartModule.ThresholdHRChart(data);
                                },
                                error: function (data) {
                                    console.log(data);
                                }
                            });
                            break;

                        case "TrendChart":
                            dashboardModule.dashboardHomeViewModel.switchChart("TrendChart");
                            $.ajax({
                                type: "POST",
                                url: "GetTrendData",
                                dataType: "json",
                                contentType: 'application/json;charset=utf-8',
                                data: JSON.stringify({
                                    user: dashboardModule.dashboardHomeViewModel.selectedUser().emailAddress,
                                    dateStart: dashboardModule.dashboardHomeViewModel.dateStart(),
                                    dateEnd: dashboardModule.dashboardHomeViewModel.dateEnd()
                                }),
                                success: function (data) {
                                    hrChart = new heartRateChartModule.HRChart(data);
                                },
                                error: function (data) {
                                    console.log(data);
                                }
                            });
                            break;

                        //case "MultiLineTrendChart":
                        //    dashboardModule.dashboardHomeViewModel.switchChart("MultiLineTrendChart");
                        //    $.ajax({
                        //        type: "POST",
                        //        url: "GetMultiTrendData",
                        //        dataType: "json",
                        //        contentType: 'application/json;charset=utf-8',
                        //        data: JSON.stringify({
                        //            user: dashboardModule.dashboardHomeViewModel.selectedUser().emailAddress,
                        //            dateStart: dashboardModule.dashboardHomeViewModel.dateStart(),
                        //            dateEnd: dashboardModule.dashboardHomeViewModel.dateEnd()
                        //        }),
                        //        success: function (data) {
                        //            var trendData = data.sort(function (a, b) {
                        //                return new Date(a.DateTime) - new Date(b.DateTime);
                        //            });
                        //            multiLineHRChart = new multiLineHeartRateChartModule.multiLineHRChart(trendData);
                        //        },
                        //        error: function (data) {
                        //            console.log(data);
                        //        }
                        //    });
                        //    break;
                    }
                },
                buttonText: function (options, select) {
                    return dashboardModule.dashboardHomeViewModel.userType() + "s";
                }
            });

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
                       },
                    function (start, end) {
                        //$('.ranges ul li.active').html(moment().startOf('day').format('D MMMM YYYY') + ' - ' + moment().endOf('day').format('D MMMM YYYY'));
                        dashboardModule.dashboardHomeViewModel.dateRangeSelected($("#daterange").data('daterangepicker').startDate.format('D MMMM YYYY HH:mm') + ' - ' + $("#daterange").data('daterangepicker').endDate.format('D MMMM YYYY HH:mm'));
                        dashboardModule.dashboardHomeViewModel.dateRangeSelected.valueHasMutated();
                        if ($("#daterange").data('daterangepicker').chosenLabel != "Live") {
                            dashboardModule.dashboardHomeViewModel.showingLiveChart(false);
                        }
                        else {
                            dashboardModule.dashboardHomeViewModel.showingLiveChart(true);
                            dashboardModule.dashboardHomeViewModel.thresholdAnalysis('Off');
                        }
                    });

                    //$('input[name="daterange"]').css("font-size", "14px");
            //    },
            //    error: function (data) {
            //        console.log(data);
            //    }
            //}); 
                    spinner.destroySpinner();
        },
        startTimer: function () {
            liveTimer = setInterval(function () {
                console.log("Timer Tick");
                if (dashboardModule.dashboardHomeViewModel.showingLiveChart()) {
                    dashboardModule.dashboardHomeViewModel.getLiveHRData();
                }
                else {
                    clearInterval(liveTimer);
                }
            }, 28000);
            console.log("Timer Started");
        },
        updateLiveChart: function () {
            if (dashboardModule.dashboardHomeViewModel.showingLiveChart()) {
                if (liveChart != null && dashboardModule.dashboardHomeViewModel.liveData().length > 0) {
                    liveChart.updateChart(dashboardModule.dashboardHomeViewModel.liveData());
                }
                else if (liveChart == null && dashboardModule.dashboardHomeViewModel.liveData().length > 0)
                    dashboardModule.dashboardHomeViewModel.switchChart();
                    liveChart = new liveHRChartModule.LiveHRChart(dashboardModule.dashboardHomeViewModel.liveData());
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
            //        user: dashboardModule.dashboardHomeViewModel.selectedUser().emailAddress
            //    }),
            //    success: function (data) {
            //        var trendData = data.DataList.sort(function (a, b) {
            //            return new Date(a.DateTime) - new Date(b.DateTime);
            //        });

            //        $.each(trendData, function (i, d) {
            //            if (new Date() - new Date(d.DateTime) < 600000) {
            //                if (dashboardModule.dashboardHomeViewModel.liveData().length == 0) {
            //                    dashboardModule.dashboardHomeViewModel.liveData().push(d);
            //                }
            //                else {
            //                    if (new Date(d.DateTime) > new Date(dashboardModule.dashboardHomeViewModel.liveData()[dashboardModule.dashboardHomeViewModel.liveData().length - 1].DateTime)) {
            //                        console.log(d.DateTime);
            //                        dashboardModule.dashboardHomeViewModel.liveData().push(d);
            //                    }
            //                }
            //            }
            //        });
            //        dashboardModule.dashboardHomeViewModel.updateLiveChart();
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

                    dashboardModule.dashboardHomeViewModel.liveData().push(d);
                });
                //dashboardModule.dashboardHomeViewModel.liveData().push.apply(dashboardModule.dashboardHomeViewModel.liveData(), data);
                dashboardModule.dashboardHomeViewModel.updateLiveChart();
            });
        },
        drawTrendChart: function (trendData) {
            spinner.showSpinner();
            $.ajax({
                type: "POST",
                url: "GetTrendData",
                dataType: "json",
                contentType: 'application/json;charset=utf-8',
                data: JSON.stringify({
                    user: dashboardModule.dashboardHomeViewModel.selectedUser().emailAddress,
                    dateStart: dashboardModule.dashboardHomeViewModel.dateStart(),
                    dateEnd: dashboardModule.dashboardHomeViewModel.dateEnd()
                }),
                success: function (data) {
                    if (dashboardModule.dashboardHomeViewModel.selectedChart() == "TrendChart") {
                        hrChart = new heartRateChartModule.HRChart(data);
                    }
                    spinner.destroySpinner();
                },
                error: function (data) {
                    console.log(data);
                    spinner.destroySpinner();
                }
            });
        },
        switchThresholdGraph: function () {
            if (dashboardModule.dashboardHomeViewModel.thresholdAnalysis() == 'On') {
                dashboardModule.dashboardHomeViewModel.thresholdAnalysis('Off');
            }
            else if (dashboardModule.dashboardHomeViewModel.thresholdAnalysis() == 'Off') {
                dashboardModule.dashboardHomeViewModel.thresholdAnalysis('On');
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

            switch (dashboardModule.dashboardHomeViewModel.selectedChart()) {
                case "LiveChart":
                    $("#trend").css("visibility", "hidden");
                    $("#thresholdTrend").css("visibility", "hidden");
                    $("#multiLineTrend").css("visibility", "hidden");
                    $("#multiLineLegend").css("visibility", "hidden");
                    $("#liveTrendYAxis").css("visibility", "");
                    $("#liveTrend").css("visibility", "");
                    dashboardModule.dashboardHomeViewModel.thresholdAnalysis("Off");
                    dashboardModule.dashboardHomeViewModel.showingLiveChart(true);
                    break;

                case "ThresholdChart":
                    $("#trend").css("visibility", "hidden");
                    $("#liveTrendYAxis").css("visibility", "hidden");
                    $("#liveTrend").css("visibility", "hidden");                    
                    $("#thresholdTrend").css("visibility", "");
                    $("#multiLineTrend").css("visibility", "hidden");
                    $("#multiLineLegend").css("visibility", "hidden");
                    dashboardModule.dashboardHomeViewModel.thresholdAnalysis("On");
                    dashboardModule.dashboardHomeViewModel.showingLiveChart(false);
                    break;

                case "TrendChart":
                    $("#trend").css("visibility", "");
                    $("#liveTrendYAxis").css("visibility", "hidden");
                    $("#liveTrend").css("visibility", "hidden");
                    $("#thresholdTrend").css("visibility", "hidden");
                    $("#multiLineTrend").css("visibility", "hidden");
                    $("#multiLineLegend").css("visibility", "hidden");
                    dashboardModule.dashboardHomeViewModel.thresholdAnalysis("Off");
                    dashboardModule.dashboardHomeViewModel.showingLiveChart(false);                    
                    break;

                //case "MultiLineTrendChart":                    
                //    $("#trend").css("visibility", "");
                //    $("#liveTrendYAxis").css("visibility", "hidden");
                //    $("#liveTrend").css("visibility", "hidden");
                //    $("#thresholdTrend").css("visibility", "hidden");
                //    $("#multiLineTrend").css("visibility", "");
                //    $("#multiLineLegend").css("visibility", "");
                //    dashboardModule.dashboardHomeViewModel.thresholdAnalysis("Off");
                //    dashboardModule.dashboardHomeViewModel.showingLiveChart(false);
                //    break;

            }
            spinner.destroySpinner();
        },
        saveAnnotation: function() {
            $("#saveAnnotation").modal("show");
        },
        confirmSaveAnnotation: function () {
            spinner.showSpinner();
            $.ajax({
                type: "POST",
                url: "SaveAnnotation",
                dataType: "json",
                contentType: 'application/json;charset=utf-8',
                data: JSON.stringify({                    
                    startDateTime: base.annotation[0],
                    endDateTime: base.annotation[1],
                    userId: base.selectedPoint.UserID,
                    description: dashboardModule.dashboardHomeViewModel.annotationDescription(),
                    tags: dashboardModule.dashboardHomeViewModel.tag()
                }),
                success: function (data) {
                    $("#saveAnnotation").modal("hide");

                    hrChart.updateAnnotation(data);
                    spinner.destroySpinner();
                },
                error: function (data) {
                    console.log("Failed");
                    spinner.destroySpinner();
                }
            });
        },        
        updateUserType: function () {
            spinner.showSpinner();
            $.ajax({
                type: "POST",
                url: "UpdateUserType",
                dataType: "json",
                contentType: 'application/json;charset=utf-8',
                data: JSON.stringify({
                    superUserId: dashboardModule.dashboardHomeViewModel.physicianID(),
                    userType: dashboardModule.dashboardHomeViewModel.userType()
                }),
                success: function (data) {
                    spinner.destroySpinner();
                },
                error: function (data) {
                    console.log(data);
                    spinner.destroySpinner();
                }
            });
        },
        openChartSettings: function () {
            $("#physicianHomePageChartSettings").modal("show");
        },
        applyChartSettings: function () {
            spinner.showSpinner();
            $.ajax({
                type: "POST",
                url: "GetUsers",
                dataType: "json",
                data: JSON.stringify({
                    dateStart: dashboardModule.dashboardHomeViewModel.dateStart(),
                    dateEnd: dashboardModule.dashboardHomeViewModel.dateEnd(),
                    ageStart: dashboardModule.dashboardHomeViewModel.ageStart(),
                    ageEnd: dashboardModule.dashboardHomeViewModel.ageEnd(),
                    gender: dashboardModule.dashboardHomeViewModel.genderFilter(),
                    occupation: dashboardModule.dashboardHomeViewModel.occupationFilter(),
                    chartType: dashboardModule.dashboardHomeViewModel.selectedChartType(),
                    breakdownX: dashboardModule.dashboardHomeViewModel.breakdownXAxis(),
                    selectedTags: $("#tagSource").val()
                }),
                contentType: 'application/json;charset=utf-8',
                success: function (data) {
                    dashboardModule.dashboardHomeViewModel.populationUsers(data.userSessions);
                    if (dashboardModule.dashboardHomeViewModel.selectedChartType() == "summary") {
                        if (pieChart == null) {
                            dashboardModule.dashboardHomeViewModel.dashboardStatisticsHeading("Summary of sessions for all " + dashboardModule.dashboardHomeViewModel.userType() + "s (" +
                                dashboardModule.dashboardHomeViewModel.dateRangeSelected() + ") - Sessions (# of " + dashboardModule.dashboardHomeViewModel.userType() + "s)");
                            $("#pieChart svg").remove();
                            pieChart = new pieChartModule.PieChart(data.sessions);
                            barChart = null;
                            bubbleChart = null;
                        }
                        else {
                            //pieChart.setPieData(data.sessions);
                            //pieChart.update();
                            $("#pieChart svg").remove();
                            pieChart = null;
                            barChart = null;
                            bubbleChart = null;
                            pieChart = new pieChartModule.PieChart(data.sessions);
                        }
                    }
                    else if (dashboardModule.dashboardHomeViewModel.selectedChartType() == "breakdown") {                        
                        if (barChart == null) {                            
                            $("#pieChart svg").remove();
                            barChart = new breakdownBarChartModule.BreakdownBarChart(data.sessions, dashboardModule.dashboardHomeViewModel.breakdownXAxis());
                            pieChart = null;
                            bubbleChart = null;
                        }
                        else {
                            barChart.setBarData(data.sessions, dashboardModule.dashboardHomeViewModel.breakdownXAxis());
                            barChart.update();
                        }
                        var breakdownString = dashboardModule.dashboardHomeViewModel.capitaliseFirstLetter(dashboardModule.dashboardHomeViewModel.breakdownXAxis());
                        if (breakdownString == "OccupationType")
                            breakdownString = "Occupation Type";
                        dashboardModule.dashboardHomeViewModel.dashboardStatisticsHeading(breakdownString + " Breakdown of " + dashboardModule.dashboardHomeViewModel.userType() + "s (" +
                            dashboardModule.dashboardHomeViewModel.dateRangeSelected() + ")");
                    }
                    else if (dashboardModule.dashboardHomeViewModel.selectedChartType() == "multidimension") {
                        if (bubbleChart == null) {
                            dashboardModule.dashboardHomeViewModel.dashboardStatisticsHeading("Multi-dimension Breakdown of " + dashboardModule.dashboardHomeViewModel.userType() + "s (" +
                                dashboardModule.dashboardHomeViewModel.dateRangeSelected() + ")");
                            $("#pieChart svg").remove();
                            bubbleChart = new bubbleChartModule.BubbleChart("#pieChart", data, ["male", "female"], "", "ageGroup", "gender", "occupationType", "occupationType", false);
                            pieChart = null;
                            barChart = null;
                            //[">25", "26-40", "41-55", "56-70", "71-85", "86+"]
                        }
                        else {
                            //barChart.setBarData(data.sessions, dashboardModule.dashboardHomeViewModel.breakdownXAxis());
                            bubbleChart.update(data);
                        }
                    }
                    spinner.destroySpinner();
                },
                error: function (data) {
                    console.log(data);
                    dashboardModule.dashboardHomeViewModel.initialLoad(false);
                    spinner.destroySpinner();
                }
            });
            $("#physicianHomePageChartSettings").modal("hide");
        },
        openHRGraphSettings: function () {
            $("#hrGraphSettings").modal("show");
        },
        saveHRGraphSettings: function () {
            spinner.showSpinner();
            $('#daterange span').html($("#daterange").data('daterangepicker').startDate.format('D MMMM YYYY') + ' - ' + $("#daterange").data('daterangepicker').endDate.format('D MMMM YYYY'));
            dashboardModule.dashboardHomeViewModel.dateRangeSelected($("#daterange").data('daterangepicker').startDate.format('D MMMM YYYY HH:mm') + ' - ' + $("#daterange").data('daterangepicker').endDate.format('D MMMM YYYY HH:mm'));
            dashboardModule.dashboardHomeViewModel.dateStart(new Date($("#daterange").data('daterangepicker').startDate.toString()));
            dashboardModule.dashboardHomeViewModel.dateEnd(new Date($("#daterange").data('daterangepicker').endDate.toString()));

            if ($("#daterange").data('daterangepicker').chosenLabel == "Live") {
                dashboardModule.dashboardHomeViewModel.selectedChart("LiveChart");
                dashboardModule.dashboardHomeViewModel.switchChart();
                dashboardModule.dashboardHomeViewModel.getLiveHRData();
                dashboardModule.dashboardHomeViewModel.startTimer();
            }
            else {
                if (dashboardModule.dashboardHomeViewModel.thresholdAnalysis() == 'On') {
                    url = "GetMovingAverageTrendData";
                    data = JSON.stringify({
                        user: dashboardModule.dashboardHomeViewModel.selectedUser().emailAddress,
                        threshold: dashboardModule.dashboardHomeViewModel.hrThreshold(),
                        dateStart: dashboardModule.dashboardHomeViewModel.dateStart(),
                        dateEnd: dashboardModule.dashboardHomeViewModel.dateEnd()
                    });
                }
                else {
                    url = "GetTrendData";
                    data = JSON.stringify({
                        user: dashboardModule.dashboardHomeViewModel.selectedUser().emailAddress,
                        dateStart: dashboardModule.dashboardHomeViewModel.dateStart(),
                        dateEnd: dashboardModule.dashboardHomeViewModel.dateEnd()
                    });
                }

                $.ajax({
                    type: "POST",
                    url: url,
                    dataType: "json",
                    contentType: 'application/json;charset=utf-8',
                    data: data,
                    success: function (data) {
                        if (dashboardModule.dashboardHomeViewModel.thresholdAnalysis() == 'On') {
                            dashboardModule.dashboardHomeViewModel.selectedChart("ThresholdChart");
                            dashboardModule.dashboardHomeViewModel.switchChart();
                            thresholdChart = new thresholdHeartRateChartModule.ThresholdHRChart(data);
                        }
                        else if (dashboardModule.dashboardHomeViewModel.thresholdAnalysis() == 'Off') {
                            dashboardModule.dashboardHomeViewModel.selectedChart("TrendChart");
                            dashboardModule.dashboardHomeViewModel.switchChart();
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
        //openThresholdSettings: function () {
        //    $("#thresholdSettings").modal("show");
        //},
        //applyThresholdAnalysis: function () {
        //    var myArray = [{ status: "good", rank: 1, color: "green" }, { status: "bad", rank: 2, color: "orange" }, { status: "dead", rank: 3, color: "red" }];
        //    $.each(dashboardModule.dashboardHomeViewModel.usersFiltered(), function (index, value) {
        //        var rand = myArray[Math.floor(Math.random() * myArray.length)];
        //        value.status(rand);
        //    });
        //    dashboardModule.dashboardHomeViewModel.usersFiltered.sort(function (a, b) {
        //        if (a.status().rank < b.status().rank) return 1;
        //        if (a.status().rank > b.status().rank) return -1;
        //        return 0;
        //    });
        //    dashboardModule.dashboardHomeViewModel.usersFiltered.valueHasMutated();
        //},
        filterFromPieChart: function (data) {
            spinner.showSpinner();
            var userIds = [];

            if (data.Session == "0") {
                dashboardModule.dashboardHomeViewModel.numberofSessions("0");
                userIds = dashboardModule.dashboardHomeViewModel.populationUsers().OneUserSession;
                Array.prototype.push.apply(userIds, dashboardModule.dashboardHomeViewModel.populationUsers().TwoUserSessions);
                Array.prototype.push.apply(userIds, dashboardModule.dashboardHomeViewModel.populationUsers().ThreeUserSessions);
                Array.prototype.push.apply(userIds, dashboardModule.dashboardHomeViewModel.populationUsers().FourUserSessions);
                Array.prototype.push.apply(userIds, dashboardModule.dashboardHomeViewModel.populationUsers().MoreThanFourUserSessions);

                $.ajax({
                    type: "POST",
                    url: "FilterFromPieChart",
                    dataType: "json",
                    contentType: 'application/json;charset=utf-8',
                    data: JSON.stringify({
                        dateStart: dashboardModule.dashboardHomeViewModel.dateStart(),
                        dateEnd: dashboardModule.dashboardHomeViewModel.dateEnd(),
                        ageStart: dashboardModule.dashboardHomeViewModel.ageStart(),
                        ageEnd: dashboardModule.dashboardHomeViewModel.ageEnd(),
                        gender: dashboardModule.dashboardHomeViewModel.genderFilter(),
                        occupation: dashboardModule.dashboardHomeViewModel.occupationFilter(),
                        chartType: dashboardModule.dashboardHomeViewModel.selectedChartType(),
                        breakdownX: dashboardModule.dashboardHomeViewModel.breakdownXAxis(),
                        selectedTags: $("#tagSource").val(),
                        userIds: userIds
                    }),
                    success: function (data) {
                        userIds = [];
                        userIds = data;

                        dashboardModule.dashboardHomeViewModel.usersFiltered(dashboardModule.dashboardHomeViewModel.users().filter(function (item) {
                            return userIds.indexOf(item.userId) > -1;
                        }).map(function (d) {
                            return d;
                        }));
                        spinner.destroySpinner();
                    },
                    error: function (data) {
                        console.log(data);
                        spinner.destroySpinner();
                    }
                });
            }
            else if (data.Session == "1") {
                dashboardModule.dashboardHomeViewModel.numberofSessions("1");
                userIds = dashboardModule.dashboardHomeViewModel.populationUsers().OneUserSession;
            }
            else if (data.Session == "2") {
                dashboardModule.dashboardHomeViewModel.numberofSessions("2");
                userIds = dashboardModule.dashboardHomeViewModel.populationUsers().TwoUserSessions;
            }
            else if (data.Session == "3") {
                dashboardModule.dashboardHomeViewModel.numberofSessions("3");
                userIds = dashboardModule.dashboardHomeViewModel.populationUsers().ThreeUserSessions;
            }
            else if (data.Session == "4") {
                dashboardModule.dashboardHomeViewModel.numberofSessions("4");
                userIds = dashboardModule.dashboardHomeViewModel.populationUsers().FourUserSessions;
            }
            else if (data.Session == ">4") {
                dashboardModule.dashboardHomeViewModel.numberofSessions("> 4");
                userIds = dashboardModule.dashboardHomeViewModel.populationUsers().MoreThanFourUserSessions;
            }

            if (data.Session != "0") {
                spinner.destroySpinner();
                dashboardModule.dashboardHomeViewModel.usersFiltered(dashboardModule.dashboardHomeViewModel.users().filter(function (item) {
                    return userIds.indexOf(item.userId) > -1;
                }).map(function (d) {
                    return d;
                }));
            }
        }
    };

    var init = dashboardModule.init;
    dashboardModule.init = function () {
        ko.applyBindings(dashboardModule.dashboardHomeViewModel, document.getElementById("pageContainer"));

        dashboardModule.dashboardHomeViewModel.userType.subscribe(function () {
            if (dashboardModule.dashboardHomeViewModel.initialLoad() == false)
                dashboardModule.dashboardHomeViewModel.updateUserType();
        });

        dashboardModule.dashboardHomeViewModel.dashboardInitialise();

        $("#tagsSelection").select2({
            maximumSelectionLength: 1
        });

        $("#tagSource").select2({
        });

        $('button[name="dateRangeHomePage"]').on('hide.daterangepicker', function (ev, picker) {
            $('#daterange span').html(picker.startDate.format('D MMMM YYYY') + ' - ' + picker.endDate.format('D MMMM YYYY'));
            dashboardModule.dashboardHomeViewModel.dateRangeSelected(picker.startDate.format('D MMMM YYYY HH:mm') + ' - ' + picker.endDate.format('D MMMM YYYY HH:mm'));
            dashboardModule.dashboardHomeViewModel.dateStart(new Date(picker.startDate.toString()));
            dashboardModule.dashboardHomeViewModel.dateEnd(new Date(picker.endDate.toString()));
        });
        
        $('#dataStream').css("font-size", "14px");

        $('#saveAnnotation').on('hidden.bs.modal', function () {
            dashboardModule.dashboardHomeViewModel.annotationDescription("");
        });

        if (init) {
            init.apply(this, arguments);
        }
    };

    return dashboardModule;
}(dashboardModule || {}));