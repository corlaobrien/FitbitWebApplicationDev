using FitbitWebApplication.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Hosting;
using System.Web.Mvc;

namespace FitbitWebApplication.Controllers
{
    public class DBPerformanceController : Controller
    {
        string user = "orla.t.obrien@mycit.ie";
        DateTime datestart = new DateTime(2017, 4, 25, 1, 0, 0);
        DateTime dateend = new DateTime(2017, 4, 25, 1, 10, 59);
        List<DBPerformanceResult> performance = new List<DBPerformanceResult>();

        // GET: DBPerformance
        public ActionResult Index()
        {
            return View();
        }

        public string GetFiles()
        {
            DirectoryInfo performanceFilesDirectory = null;
            FileInfo[] files = null;

            List<DBPerformanceFile> returnFiles;

            try
            {
                string performanceFilesPath = HostingEnvironment.ApplicationPhysicalPath + "/Content/PerformanceResults";
                performanceFilesDirectory = new DirectoryInfo(performanceFilesPath);
                files = performanceFilesDirectory.GetFiles();

                returnFiles = files.Where(f => f.Extension == ".xlsx" || f.Extension == ".csv")
                  .OrderBy(f => f.Name)
                  .Select(f => new DBPerformanceFile(f.Name, f.FullName, f.CreationTimeUtc))
                  .ToList();
            }
            catch (IOException exp)
            {
                throw exp;
            }

            return JsonConvert.SerializeObject(returnFiles);
        }

        public async Task<string> RunPerformanceTest(int numberOfCalls, int numberofRounds, int wait, string dbInstance)
        {
            try
            {
                DBPerformanceResult timediff = new DBPerformanceResult();

                for (var j = 1; j <= numberofRounds; j++)
                {
                    var task = Parallel.For(0, numberOfCalls, i =>
                    {
                        GetTrendData(i, j, dbInstance);
                    });

                    while (!task.IsCompleted)
                    {
                        await Task.Delay(25);
                    };
                    while (task.IsCompleted)
                    {
                        await Task.Delay(wait * 1000);
                        break;
                    }
                }


                // create csv with results
                string filePath = HostingEnvironment.ApplicationPhysicalPath + "Content\\PerformanceResults\\" + DateTime.Now.ToString("dd-MM-yyyy--HH-mm-ss") + ".csv";

                StringBuilder sb = new StringBuilder();
                sb.AppendLine("Round,Date,Time,Milliseconds,ResponseTime(secs),InstanceType");
                for (int i = 0; i < performance.Count(); i++)
                {
                    sb.AppendLine(performance[i].roundNumber + "," + performance[i].startTime.ToString("dd/MM/yyyy") + "," + performance[i].startTime.ToString("HH:mm:ss") + "," 
                        + performance[i].millisecond + "," + performance[i].timeDifference + "," + dbInstance);
                }

                System.IO.File.WriteAllText(filePath, sb.ToString());

                return JsonConvert.SerializeObject("Success");
            }
            catch(Exception e)
            {
                throw e;
            }     
        }

        public void GetTrendData(int i, int round, string dbInstance)
        {
            if (dbInstance == "Micro")
            {
                using (var context = new CloudFitbitDbEntities())
                {
                    try
                    {
                        context.Database.Connection.Open();
                        var userId = context.Users.Where(m => user == m.Email).Select(m => m.id).FirstOrDefault();
                        DateTime requestStart = DateTime.Now;
                        var result = context.TempTables.Where(t => userId == t.UserID && (t.DateTime >= datestart && t.DateTime <= dateend)).ToList();
                        DateTime requestEnd = DateTime.Now;

                        DBPerformanceResult timediff = new DBPerformanceResult((requestEnd - requestStart).TotalSeconds, requestStart, requestStart.Millisecond, round);
                        performance.Add(timediff);
                        context.Database.Connection.Close();
                    }
                    catch (Exception e)
                    {
                        throw e;
                        context.Database.Connection.Close();
                    }
                }
            }
            else if (dbInstance == "Small")
            {
                using (var context = new CloudFitbitDbEntitiesSmall())
                {
                    try
                    {
                        context.Database.Connection.Open();
                        var userId = context.Users.Where(m => user == m.Email).Select(m => m.id).FirstOrDefault();
                        DateTime requestStart = DateTime.Now;
                        var result = context.TempTables.Where(t => userId == t.UserID && (t.DateTime >= datestart && t.DateTime <= dateend)).ToList();
                        DateTime requestEnd = DateTime.Now;

                        DBPerformanceResult timediff = new DBPerformanceResult((requestEnd - requestStart).TotalSeconds, requestStart, requestStart.Millisecond, round);
                        performance.Add(timediff);
                        context.Database.Connection.Close();
                    }
                    catch (Exception e)
                    {
                        throw e;
                        context.Database.Connection.Close();
                    }
                }
            }
            else if (dbInstance == "Medium")
            {
                using (var context = new CloudFitbitDbEntitiesMedium())
                {
                    try
                    {
                        context.Database.Connection.Open();
                        var userId = context.Users.Where(m => user == m.Email).Select(m => m.id).FirstOrDefault();
                        DateTime requestStart = DateTime.Now;
                        var result = context.TempTables.Where(t => userId == t.UserID && (t.DateTime >= datestart && t.DateTime <= dateend)).ToList();
                        DateTime requestEnd = DateTime.Now;

                        DBPerformanceResult timediff = new DBPerformanceResult((requestEnd - requestStart).TotalSeconds, requestStart, requestStart.Millisecond, round);
                        performance.Add(timediff);
                        context.Database.Connection.Close();
                    }
                    catch (Exception e)
                    {
                        throw e;
                        context.Database.Connection.Close();
                    }
                }
            }
        }

        public virtual FileResult OpenFile()
        {
            try
            {
                var bin = (byte[])System.Web.HttpContext.Current.Cache["CSVFileBytes"];
                var name = (string)System.Web.HttpContext.Current.Cache["CSVFileName"];
                return this.File(bin, "text/csv", name);
            }
            catch (IOException exp)
            {
                throw exp;
            }
        }

        public void PrepareFile(string filePath, string fileName)
        {
            try
            {
                byte[] bytes = System.IO.File.ReadAllBytes(filePath);
                System.Web.HttpContext.Current.Cache["CSVFileBytes"] = bytes;
                System.Web.HttpContext.Current.Cache["CSVFileName"] = fileName;
            }
            catch (IOException exp)
            {
                throw exp;
            }
        }

    }
}