var movingAverageModule = (function (movingAverageModule) {
    
    movingAverageModule.movingAverageViewModel = {
        movingAverageInitialise: function () {
            $.ajax({
                type: "POST",
                url: "GetMovingAverageTrendData",
                dataType: "json",
                contentType: 'application/json;charset=utf-8',
                data: JSON.stringify({
                    user: ["orla.t.obrien@mycit.ie"],
                    dateStart: new Date(moment().subtract(13, 'days').startOf('day').toString()),
                    dateEnd: new Date(moment().subtract(13, 'days').endOf('day').toString())
                }),
                success: function (data) {
                    thresholdChart = new thresholdHeartRateChartModule.ThresholdHRChart(data);
                },
                error: function (data) {
                    console.log(data);
                }
            });
        }

    };

    var init = movingAverageModule.init;
    movingAverageModule.init = function () {
        //ko.applyBindings(movingAverageModule.movingAverageViewModel, document.getElementById("pageContainer"));

        movingAverageModule.movingAverageViewModel.movingAverageInitialise();

        if (init) {
            init.apply(this, arguments);
        }
    };

    return movingAverageModule;
}(movingAverageModule || {}));