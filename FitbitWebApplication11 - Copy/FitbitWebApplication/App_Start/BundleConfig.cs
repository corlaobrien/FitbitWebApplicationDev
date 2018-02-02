using System.Web;
using System.Web.Optimization;

namespace FitbitWebApplication
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include(
                        "~/Scripts/jquery.validate*"));

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                      "~/Scripts/bootstrap.js",
                      "~/Scripts/respond.js"));

            bundles.Add(new ScriptBundle("~/bundles/dashboardHomeViewModel").Include(
                      "~/Scripts/moment.js",
                      "~/Scripts/knockoutjs.js",
                      "~/Scripts/d3.js",
                      "~/Scripts/jquery.connections.js",
                      "~/Scripts/bootstrap-multiselect.js",
                      "~/Scripts/daterangepicker.js",
                      "~/Scripts/select2.js",
                      "~/Scripts/LoadingSpinner/iosOverlay.js",
                      "~/Scripts/LoadingSpinner/LoadingSpinnerModule.js",
                      "~/Scripts/LoadingSpinner/prettify.js",
                      "~/Scripts/LoadingSpinner/spin.min.js",
                      "~/Scripts/CustomScripts/LoadingSpinnerModule.js",
                      "~/Scripts/CustomScripts/ThresholdHeartRateChart.js",
                      "~/Scripts/CustomScripts/MultiLineTrendChart.js",
                      "~/Scripts/CustomScripts/HeartRateChart.js",
                      "~/Scripts/CustomScripts/PieChart.js",
                      "~/Scripts/CustomScripts/LiveHeartRateChart.js",
                      "~/Scripts/CustomScripts/BreakdownBarChart.js",
                      "~/Scripts/CustomScripts/BubbleChart.js",
                      "~/Scripts/CustomScripts/DashboardHomeViewModel.js"));

            bundles.Add(new ScriptBundle("~/bundles/userDashboardHomeViewModel").Include(
                      "~/Scripts/moment.js",
                      "~/Scripts/knockoutjs.js",
                      "~/Scripts/d3.js",
                      "~/Scripts/bootstrap-multiselect.js",
                      "~/Scripts/daterangepicker.js",
                      "~/Scripts/select2.js",
                      "~/Scripts/LoadingSpinner/iosOverlay.js",
                      "~/Scripts/LoadingSpinner/LoadingSpinnerModule.js",
                      "~/Scripts/LoadingSpinner/prettify.js",
                      "~/Scripts/LoadingSpinner/spin.min.js",
                      "~/Scripts/CustomScripts/LoadingSpinnerModule.js",
                      "~/Scripts/CustomScripts/ThresholdHeartRateChart.js",
                      "~/Scripts/CustomScripts/HeartRateChart.js",
                      "~/Scripts/CustomScripts/PieChart.js",
                      "~/Scripts/CustomScripts/LiveHeartRateChart.js",
                      "~/Scripts/CustomScripts/BarChart.js",
                      "~/Scripts/CustomScripts/UserDashboardHomeViewModel.js"));

            bundles.Add(new ScriptBundle("~/bundles/movingAverageViewModel").Include(
                      "~/Scripts/moment.js",
                      "~/Scripts/knockoutjs.js",
                      "~/Scripts/d3.js",
                      "~/Scripts/LoadingSpinner/iosOverlay.js",
                      "~/Scripts/LoadingSpinner/LoadingSpinnerModule.js",
                      "~/Scripts/LoadingSpinner/prettify.js",
                      "~/Scripts/LoadingSpinner/spin.min.js",
                      "~/Scripts/CustomScripts/LoadingSpinnerModule.js",
                      "~/Scripts/CustomScripts/ThresholdHeartRateChart.js",
                      "~/Scripts/CustomScripts/MovingAverageViewModel.js"
                ));

            bundles.Add(new ScriptBundle("~/bundles/dbPerformanceViewModel").Include(
                      "~/Scripts/knockoutjs.js",
                      "~/Scripts/LoadingSpinner/iosOverlay.js",
                      "~/Scripts/LoadingSpinner/LoadingSpinnerModule.js",
                      "~/Scripts/LoadingSpinner/prettify.js",
                      "~/Scripts/LoadingSpinner/spin.min.js",
                      "~/Scripts/CustomScripts/DBPerformance.js"
                ));

            bundles.Add(new ScriptBundle("~/bundles/jqueryui").Include(
                 "~/Scripts/jquery-ui.js"
                ));

            bundles.Add(new StyleBundle("~/Content/css/dashboardViewModel").Include(
                      "~/Content/bootstrap.css",
                      "~/Content/bootstrap-multiselect.css",
                      "~/Content/heartRateChart.css",
                      "~/Content/select2.css",
                      "~/Content/font-awesome.css"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                      "~/Content/bootstrap.css",
                      "~/Content/site.css",
                      "~/Content/daterangepicker.css",
                      "~/Content/iosOverlay.css"));

            bundles.Add(new StyleBundle("~/Content/jqueryui").Include(
                      "~/Content/jquery-ui.css"));
        }
    }
}
