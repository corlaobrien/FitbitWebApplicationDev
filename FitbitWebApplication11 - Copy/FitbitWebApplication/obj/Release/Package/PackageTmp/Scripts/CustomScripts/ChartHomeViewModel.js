var dashboardModule = (function (dashboardModule) {

    var liveChart = null;
    var liveTimer;
    var spinner = new LoadingSpinnerModule();

    var dashboardHomeViewModel = {
        //users: ko.observableArray([]),
        selectedUsers: ko.observableArray([]),
        dateStart: ko.observable(new Date(moment().subtract(7, 'days').startOf('day').toString())),
        dateEnd: ko.observable(new Date(moment().subtract(1, 'days').endOf('day').toString())),
        liveHRChart: ko.observable(),
        showingLiveChart: ko.observable(false),
        liveData: ko.observableArray(),
        dateRangeSelected: ko.observable(),
        chartViewinitialise: function () {
            $.ajax({
                type: "POST",
                url: "GetUsers",
                dataType: "json",
                contentType: 'application/json;charset=utf-8',
                success: function (emailAddress) {
                    dashboardModule.dashboardHomeViewModel.users.push(emailAddress);

                    var userDropdown = $('#userDropdown');
                    userDropdown.multiselect('select', dashboardModule.dashboardHomeViewModel.selectedUsers());
                    userDropdown.multiselect('rebuild');


                    $('button[name="daterange"]').daterangepicker(
                       {
                           startDate: moment().subtract(7, 'days'),
                           endDate: moment(),
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
                           opens: 'left',
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

                    $('input[name="daterange"]').css("font-size", "14px");
                },
                error: function (data) {
                    console.log(data);
                }
            });
        },        
        startTimer: function() {
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
            console.log("Updating");
            $("#trend").html("");
            if (dashboardModule.dashboardHomeViewModel.showingLiveChart()) {
                if (liveChart != null && dashboardModule.dashboardHomeViewModel.liveData().length > 0) {
                    liveChart.updateChart(dashboardModule.dashboardHomeViewModel.liveData());
                }
                else if (liveChart == null && dashboardModule.dashboardHomeViewModel.liveData().length > 0)
                    liveChart = new liveHRdashboardModule.LiveHRChart(dashboardModule.dashboardHomeViewModel.liveData());
            }
        },
        getLiveHRData: function() {
            $("#trend").css("visibility", "hidden");
            $("#thresholdTrend").css("visibility", "hidden");
            $("#liveTrend").css("visibility", "");

            d3.csv("../Controllers/data2.csv", function (error, data) {
                data.forEach(function (d) {
                    d.DateTime = d.DateTime;
                    d.Name = d.Name;
                    d.Value = d.Value;
                    d.UserID = d.UserID;
                });
                dashboardModule.dashboardHomeViewModel.liveData().push.apply(dashboardModule.dashboardHomeViewModel.liveData(), data);
                dashboardModule.dashboardHomeViewModel.updateLiveChart();
            });
        },
        drawChart: function (trendData) {
            $("#trend").html("");
            $("#liveTrend").css("visibility", "hidden");
            $("#thresholdTrend").css("visibility", "hidden");
            hrChart = new heartRatedashboardModule.HRChart(trendData);
                                 
        },
        drawLiveChart: function (trendData) {

        },
        openThresholdGraph: function () {
            //$("#trend").html("");
            $("#trend").css("visibility", "hidden");
            $("#liveTrend").css("visibility", "hidden");
            $("#thresholdTrend").css("visibility", "");

            d3.csv("../Controllers/data.csv", function (error, data) {
                data.forEach(function (d) {
                    d.DateTime = d.DateTime;
                    d.Name = d.Name;
                    d.Value = d.Value;
                    d.UserID = d.UserID;
                });
                thresholdChart = new thresholdHeartRatedashboardModule.ThresholdHRChart(data);
            });
        },

    };

    //dashboardModule.dashboardHomeViewModel = $.extend(dashboardModule.dashboardHomeViewModel, dashboardHomeViewModel);
    
    var init = dashboardModule.init;
    dashboardModule.init = function () {
        //

        dashboardModule.dashboardHomeViewModel.initialise();

        dashboardModule.dashboardHomeViewModel.liveData.subscribe(function () {
            dashboardModule.dashboardHomeViewModel.updateLiveChart();
        });

        $('button[name="daterange"]').on('hide.daterangepicker', function (ev, picker) {
            $('#daterange span').html(picker.startDate.format('D MMMM YYYY') + ' - ' + picker.endDate.format('D MMMM YYYY'));
            dashboardModule.dashboardHomeViewModel.dateRangeSelected(picker.startDate.format('D MMMM YYYY') + ' - ' + picker.endDate.format('D MMMM YYYY'));

            dashboardModule.dashboardHomeViewModel.dateStart(new Date(picker.startDate.startOf('day').toString()));
            dashboardModule.dashboardHomeViewModel.dateEnd(new Date(picker.endDate.endOf('day').toString()));

            if (picker.startDate.toString() == moment().startOf('day').toString() && picker.endDate.toString() == moment().endOf('day').toString()) {
                d3.select("svg").html("");
                dashboardModule.dashboardHomeViewModel.showingLiveChart(true);
                dashboardModule.dashboardHomeViewModel.getLiveHRData();
                //dashboardModule.dashboardHomeViewModel.startTimer();
                console.log("Start");
            }
            else {
                d3.csv("../Controllers/data.csv", function (error, data) {
                    data.forEach(function (d) {
                        d.DateTime = d.DateTime;
                        d.Name = d.Name;
                        d.Value = d.Value;
                        d.UserID = d.UserID;
                    });
                    dashboardModule.dashboardHomeViewModel.drawChart(data);
                });
            }
        });

        $('#userDropdown').multiselect({
            buttonClass: ' btn btn-default btn-xs',
            numberDisplayed: 3,
            maxHeight: 300,
            nonSelectedText: 'None Selected',
            allSelectedText: 'All Selected',
            includeSelectAllOption: true,
            disableIfEmpty: false,
            enableCaseInsensitiveFiltering: true,
            onDropdownShow: function () {
            },
            onDropdownHidden: function (e) {
                d3.csv("../Controllers/data.csv", function (error, data) {
                    data.forEach(function (d) {
                        var dateTime = new Date(d.DateTime);
                        var hours = parseInt(dateTime.getHours()) < 10 ? "0" + dateTime.getHours() : dateTime.getHours();
                        var minutes = parseInt(dateTime.getMinutes()) < 10 ? "0" + dateTime.getMinutes() : dateTime.getMinutes();
                        var seconds = parseInt(dateTime.getSeconds()) < 10 ? "0" + dateTime.getSeconds() : dateTime.getSeconds();
                        var months = parseInt(dateTime.getMonth() + 1) < 10 ? "0" + parseInt(dateTime.getMonth() + 1) : parseInt(dateTime.getMonth() + 1);
                        var dates = parseInt(dateTime.getDate()) < 10 ? "0" + dateTime.getDate() : dateTime.getDate();
                        d.DateTime = (dateTime.getFullYear() + '-' + months + '-' + dates + ' ' + hours + ':' + minutes + ':' + seconds);
                        d.Name = d.Name;
                        d.Value = d.Value;
                        d.UserID = d.UserID;
                    });
                    dashboardModule.dashboardHomeViewModel.drawChart(data);

                });

            },
            buttonText: function (options, select) {
                if (options.length === 0) {
                    return '<b>Users</b> <br /><text>' + this.nonSelectedText + "&nbsp</text><span class='caret'></span>";
                }
                if (options.length === 1) {
                    return '<b>Users</b> <br /><text>' + options[0].innerHTML + "&nbsp</text><span class='caret'></span>";
                }
                else if (options.length > 1) {
                    return '<b>Users</b> <br /><text>' + options.length + ' ' + this.nSelectedText + "&nbsp</text><span class='caret'></span>";
                }
            }
        });

        if (init) {
            init.apply(this, arguments);
        }
    };    

    return dashboardModule;
}(dashboardModule || {}));