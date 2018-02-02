var DBPerformanceModule = (function (DBPerformanceModule) {

    var spinner = new LoadingSpinnerModule();

    DBPerformanceModule.DBPerformanceViewModel = {
        noOfCalls: ko.observable(),
        noOfRounds: ko.observable(),
        wait: ko.observable(),
        dbInstance: ko.observable("Micro"),
        files: ko.observableArray(),
        getFiles: function () {
            $.ajax({
                type: "POST",
                url: "GetFiles",
                dataType: "json",
                contentType: 'application/json;charset=utf-8',                
                success: function (data) {
                    DBPerformanceModule.DBPerformanceViewModel.files([]);
                    $.each(data, function (i, v) {
                        DBPerformanceModule.DBPerformanceViewModel.files.push(v);
                    })
                },
                error: function (data) {
                    console.log(data);
                }
            });
        },
        runPerformanceTest: function () {
            spinner.showSpinner();
            $.ajax({
                type: "POST",
                url: "RunPerformanceTest",
                dataType: "json",
                async: false,
                contentType: 'application/json;charset=utf-8',
                data: JSON.stringify({
                    numberOfCalls: DBPerformanceModule.DBPerformanceViewModel.noOfCalls(),
                    numberOfRounds: DBPerformanceModule.DBPerformanceViewModel.noOfRounds(),
                    wait: DBPerformanceModule.DBPerformanceViewModel.wait(),
                    dbInstance: DBPerformanceModule.DBPerformanceViewModel.dbInstance()
                }),
                success: function (data) {
                    DBPerformanceModule.DBPerformanceViewModel.getFiles();
                    DBPerformanceModule.DBPerformanceViewModel.noOfCalls(null);
                    DBPerformanceModule.DBPerformanceViewModel.noOfRounds(null);
                    DBPerformanceModule.DBPerformanceViewModel.wait(null);
                    spinner.destroySpinner();
                },
                error: function (data) {
                    console.log(data);
                    spinner.destroySpinner();
                }
            });
        },
        prepareFile: function (filePath, fileName) {
            $.ajax({
                type: "POST",
                url: "PrepareFile",
                dataType: "json",
                async: false,
                contentType: 'application/json;charset=utf-8',
                data: JSON.stringify({
                    filePath: filePath,
                    fileName: fileName
                }),
                success: function (data) {
                    
                },
                error: function (data) {
                    console.log(data);
                }
            });
            window.open("OpenFile");
        }
    };

    var init = DBPerformanceModule.init;
    DBPerformanceModule.init = function () {
        ko.applyBindings(DBPerformanceModule.DBPerformanceViewModel, document.getElementById("dbPerformanceContainer"));
        DBPerformanceModule.DBPerformanceViewModel.getFiles();
        
        if (init) {
            init.apply(this, arguments);
        }
    };

    return DBPerformanceModule;
}(DBPerformanceModule || {}));