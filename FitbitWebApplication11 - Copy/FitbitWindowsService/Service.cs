using Fitbit.Api.Portable;
using Fitbit.Api.Portable.OAuth2;
using Fitbit.Models;
using FitbitWindowsService.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Linq;
using System.Net.Mail;
using System.ServiceProcess;

namespace FitbitWindowsService
{
    public partial class Service : ServiceBase
    {
        private System.Diagnostics.EventLog eventLog1;

        public Service()
        {
            InitializeComponent();
            if (!Environment.UserInteractive)
            {
                eventLog1 = new System.Diagnostics.EventLog();
                if (!System.Diagnostics.EventLog.SourceExists("FitbitWindowsService"))
                {
                    System.Diagnostics.EventLog.CreateEventSource(
                        "FitbitWindowsService", "FitbitWindowsServiceLog");
                }
                eventLog1.Source = "FitbitWindowsService";
                eventLog1.Log = "FitbitWindowsServiceLog";
            }
        }

        internal void Start() => this.OnStart(null);

        DateTime lastDateTime = DateTime.Now + new TimeSpan(0, 0, 0);

        DateTime lastDateFound;

        DateTime lastHighThreshold;

        int threshold = 45;

        int occurance = 0;

        TimeSeriesDataList results;

        protected override void OnStart(string[] args)
        {
            //List<SyncUser> users = GetUsersToSync();
            //foreach (var user in users)
            //{
            //    AnalyseThreshold(user);
            //}

            if (!Environment.UserInteractive)
            {
                eventLog1.WriteEntry("In OnStart");
            }
            else
            {
                Console.WriteLine("In OnStart");
            }
            // Set up a timer to trigger every minute.  
            System.Timers.Timer timer = new System.Timers.Timer();
            timer.Interval = 30000; // 30 seconds
            timer.Elapsed += new System.Timers.ElapsedEventHandler(this.OnTimer);
            timer.Start();

            System.Timers.Timer test24HrTimer = new System.Timers.Timer();
            test24HrTimer.Interval = (1000 * 60 * 60 * 24);
            //test24HrTimer.Interval = 30000; // 30 seconds
            test24HrTimer.Elapsed += new System.Timers.ElapsedEventHandler(this.OnTest24HrTimer);
            test24HrTimer.Start();

            System.Timers.Timer test4HrTimer = new System.Timers.Timer();
            test4HrTimer.Interval = (1000 * 60 * 60 * 4);
            //test4HrTimer.Interval = 30000; // 30 seconds
            test4HrTimer.Elapsed += new System.Timers.ElapsedEventHandler(this.OnTest4HrTimer);
            test4HrTimer.Start();

            System.Timers.Timer test1HrTimer = new System.Timers.Timer();
            //test1HrTimer.Interval = (1000 * 60 * 60); // 1 hour
            test1HrTimer.Interval = 60000; // 60 seconds
            test1HrTimer.Elapsed += new System.Timers.ElapsedEventHandler(this.OnTest1HrTimer);
            test1HrTimer.Start();
        }

        protected override void OnStop()
        {
            // TODO: Add code here to perform any tear-down necessary to stop your service.
        }

        public void OnTimer(object sender, System.Timers.ElapsedEventArgs args)
        {
            if (!Environment.UserInteractive)
            {
                eventLog1.WriteEntry("In OnTimer");
            }
            else
            {
                Console.WriteLine("In OnTimer");
            }            
            List<SyncUser> users = GetUsersToSync();            
            foreach (var user in users)
            {
                SyncFitbitDataAutomatically(user);
                CommitHeartRates(user);
                //AnalyseThreshold(user);
            }
        }

        public void OnTest1HrTimer(object sender, System.Timers.ElapsedEventArgs args)
        {
            if (DateTime.Now.Minute == 02)
            {
                using (var context = new CloudFitbitDbEntities())
                {
                    try
                    {
                        context.Database.Connection.Open();

                        var users = context.Users.Where(u => u.UserType == 2 && u.id != 35).ToList();

                        foreach (var user in users)
                        {
                            SqlParameter param1 = new SqlParameter("@userId", user.id);
                            SqlParameter param2 = new SqlParameter("@hour", DateTime.Now.Hour - 1);
                            context.Database.ExecuteSqlCommand("HourlyUpdate @userId, @hour", param1, param2);
                        }

                        context.Database.Connection.Close();
                    }
                    catch (Exception e)
                    {
                        context.Database.Connection.Close();
                    }
                }
            }
        }

        public void OnTest24HrTimer(object sender, System.Timers.ElapsedEventArgs args)
        {
            if (!Environment.UserInteractive)
            {
                eventLog1.WriteEntry("In OnTest24HrTimer");
            }
            else
            {
                Console.WriteLine("In OnTest24HrTimer");
            }

            DateTime dtStart = DateTime.Today.AddDays(-1);
            TimeSpan tsStart = new TimeSpan(0, 0, 0);
            dtStart = dtStart + tsStart;
            DateTime dtEnd = DateTime.Today.AddDays(-1);
            TimeSpan tsEnd = new TimeSpan(23, 59, 59);
            dtEnd = dtEnd + tsEnd;
            if (DateTime.Now.Hour == 3)
            {
                List<SyncUser> users = GetUsersToSync();
                foreach (var user in users)
                {
                    RunDataIntegrityTest(user, dtStart, dtEnd);
                }
            }
        }

        public void OnTest4HrTimer(object sender, System.Timers.ElapsedEventArgs args)
        {
            if (!Environment.UserInteractive)
            {
                eventLog1.WriteEntry("In OnTest4HrTimer");
            }
            else
            {
                Console.WriteLine("In OnTest4HrTimer");
            }
            DateTime dtStart = new DateTime(); DateTime dtEnd = new DateTime();
            if (DateTime.Now.ToUniversalTime().Hour == 4 || DateTime.Now.ToUniversalTime().Hour == 8 || DateTime.Now.ToUniversalTime().Hour == 12
                || DateTime.Now.ToUniversalTime().Hour == 16 || DateTime.Now.ToUniversalTime().Hour == 20)
            {
                dtStart = DateTime.Today.ToUniversalTime();
                TimeSpan tsStart = new TimeSpan(DateTime.Now.ToUniversalTime().Hour - 4, 0, 0);
                dtStart = dtStart + tsStart;
                dtEnd = DateTime.Today.ToUniversalTime();
                TimeSpan tsEnd = new TimeSpan(DateTime.Now.ToUniversalTime().Hour - 1, 59, 59);
                dtEnd = dtEnd + tsEnd;                
            }
            if (DateTime.Now.ToUniversalTime().Hour == 0)
            {
                dtStart = DateTime.Today.ToUniversalTime().AddDays(-1);
                TimeSpan tsStart = new TimeSpan(20, 0, 0);
                dtStart = dtStart + tsStart;
                dtEnd = DateTime.Today.ToUniversalTime().AddDays(-1);
                TimeSpan tsEnd = new TimeSpan(23, 59, 59);
                dtEnd = dtEnd + tsEnd;
            }

            List<SyncUser> users = GetUsersToSync();
            foreach (var user in users)
            {
                RunDataIntegrityTest(user, dtStart, dtEnd);
            }
        }

        public async void RunDataIntegrityTest(SyncUser user, DateTime dtStart, DateTime dtEnd)
        {
            if (!Environment.UserInteractive)
            {
                eventLog1.WriteEntry("In RunDataIntegrityTest");
            }
            else
            {
                Console.WriteLine("In RunDataIntegrityTest");
            }
            try
            {                
                OAuth2AccessToken accessToken = new OAuth2AccessToken { Token = user.AccessToken, TokenType = user.TokenType, RefreshToken = user.RefreshToken };
                var appCredentials = new FitbitAppCredentials()
                {
                    ClientId = ConfigurationManager.AppSettings["FitbitClientId"],
                    ClientSecret = ConfigurationManager.AppSettings["FitbitClientSecret"]
                };
                FitbitClient fitbitClient = new FitbitClient(appCredentials, accessToken);

                results = await fitbitClient.GetHeartRateTimeSeriesAsync(TimeSeriesResourceType.Steps, dtStart, dtStart);             

                using (var context = new CloudFitbitDbEntities())
                {
                    try
                    {
                        context.Database.Connection.Open();

                        //.Select(row => new OM_Vendor{ Id=row.Id, Name=row.Name, ApiUrl=row.ApiUrl})

                        var fitbitResults = results.DataList.Where(t => t.DateTime >= dtStart && t.DateTime <= dtEnd).Select(t => new TempTable { DateTime = t.DateTime.ToLocalTime(), Value = t.Value })
                            .OrderByDescending(t => t.DateTime).ToList();

                        var committed = context.TempTables.Where(t => t.UserID == user.id && t.DateTime >= dtStart && t.DateTime <= dtEnd).OrderByDescending(t => t.DateTime).ToList();

                        committed = committed
                          .Select(t => new TempTable { DateTime = t.DateTime.ToLocalTime(), Value = t.Value })
                          .ToList();

                        if (fitbitResults.Count() == committed.Count())
                        {
                            var same = true;
                            for (var i = 0; i < fitbitResults.Count(); i++)
                            {
                                if (!CompareTempTables(fitbitResults[i], committed[i]))
                                {
                                    same = false;
                                    break;
                                }
                            }

                            if (same == true)
                            {

                                context.DataIntegrityTests.Add(new DataIntegrityTest()
                                {
                                    DateTime = DateTime.Now,
                                    Result = true
                                });
                            }
                            else
                            {
                                context.DataIntegrityTests.Add(new DataIntegrityTest()
                                {
                                    DateTime = DateTime.Now,
                                    Result = false
                                });
                            }
                        }
                        else
                        {
                            context.DataIntegrityTests.Add(new DataIntegrityTest()
                            {
                                DateTime = DateTime.Now,
                                Result = false
                            });
                        }
                        context.SaveChanges();
                        context.Database.Connection.Close();
                    }
                    catch (Exception e)
                    {
                        throw e;
                    }
                }
            }
            catch (Exception e)
            {
                if (!Environment.UserInteractive)
                {
                    eventLog1.WriteEntry("RunDataIntegrityTest Error: " + e);
                }
                else
                {
                    Console.WriteLine("RunDataIntegrityTest Error: " + e);
                }
            }
        }

        //private TempTable ConvertToTempTable(TimeSeriesDataList.Data timeSeries = null, TempTable tempTable = null)
        //{
        //    if (timeSeries != null) { 
        //        return new TempTable()
        //        {
        //            DateTime = timeSeries.DateTime,
        //            Value = timeSeries.Value
        //        };
        //    }
        //    else if (tempTable != null)
        //    {
        //        return new TempTable()
        //        {
        //            DateTime = tempTable.DateTime,
        //            Value = tempTable.Value
        //        };
        //    }
        //    return new TempTable();
        //}

        private bool CompareTempTables(TempTable item1, TempTable item2)
        {
            return (item1.DateTime == item2.DateTime && item1.Value == item2.Value);
        }

        public List<SyncUser> GetUsersToSync()
        {
            if (!Environment.UserInteractive)
            {
                eventLog1.WriteEntry("In GetUsersToSync");
            }
            else
            {
                Console.WriteLine("In GetUsersToSync");
            }
            List<SyncUser> usersList = new List<SyncUser>();
            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();

                    var users = context.Users.Where(t => t.Email == "orla.t.obrien@mycit.ie").ToList(); //.Where(t => t.UserName != null && t.AutoSync == true)

                    foreach (var user in users)
                    {
                        usersList.Add(new SyncUser { id = user.id, Username = user.UserName, AccessToken = user.AccessToken, TokenType = user.TokenType, RefreshToken = user.RefreshToken });
                    }

                    context.Database.Connection.Close();
                }
                catch (Exception e)
                {
                    throw e;
                }
            }
            return usersList;
        }

        //Final step. Take this authorization information and use it in the app
        public async void SyncFitbitDataAutomatically(SyncUser user)
        {
            if (!Environment.UserInteractive)
            {
                eventLog1.WriteEntry("In SyncFitbitDataAutomatically");
            }
            else
            {
                Console.WriteLine("In SyncFitbitDataAutomatically");
            }
            try
            {                
                OAuth2AccessToken accessToken = new OAuth2AccessToken { Token = user.AccessToken, TokenType = user.TokenType, RefreshToken = user.RefreshToken };
                var appCredentials = new FitbitAppCredentials()
                {
                    ClientId = ConfigurationManager.AppSettings["FitbitClientId"],
                    ClientSecret = ConfigurationManager.AppSettings["FitbitClientSecret"]
                };
                FitbitClient fitbitClient = new FitbitClient(appCredentials, accessToken);

                //var newAccessToken = fitbitClient.RefreshOAuth2TokenAsync();

                //user.AccessToken = newAccessToken.Result.Token;
                //user.TokenType = newAccessToken.Result.TokenType;
                //user.RefreshToken = newAccessToken.Result.RefreshToken;

                //using (var context = new CloudFitbitDbEntities())
                //{
                //    try
                //    {
                //        context.Database.Connection.Open();

                //        var selectedUser = context.Users.Where(t => t.id == user.id).FirstOrDefault(); //.Where(t => t.UserName != null && t.AutoSync == true)

                //        selectedUser.AccessToken = newAccessToken.Result.Token;
                //        selectedUser.TokenType = newAccessToken.Result.TokenType;
                //        selectedUser.RefreshToken = newAccessToken.Result.RefreshToken;

                //        context.SaveChanges();

                //        context.Database.Connection.Close();
                //    }
                //    catch (Exception e)
                //    {
                //        throw e;
                //    }
                //}

                results = await fitbitClient.GetHeartRateTimeSeriesAsync(TimeSeriesResourceType.Steps, DateTime.Today, DateTime.Today);
            }
            catch (Exception e)
            {
                if (!Environment.UserInteractive)
                {
                    eventLog1.WriteEntry("SyncFitbitDataAutomatically Error: " + e);
                }
                else
                {
                    Console.WriteLine("SyncFitbitDataAutomatically Error: " + e);
                }
            }        
        }

        public void AnalyseThreshold(SyncUser user)
        {
            if (!Environment.UserInteractive)
            {
                eventLog1.WriteEntry("In AnalyseThreshold");
            }
            else
            {
                Console.WriteLine("In AnalyseThreshold");
            }
            //List<TempTable> result = new List<TempTable>();
            DateTime dtStart = DateTime.Today;
            TimeSpan tsStart = new TimeSpan(0, 0, 0);
            dtStart = dtStart + tsStart;
            DateTime dtEnd = new DateTime(2017, 3, 24);
            TimeSpan tsEnd = new TimeSpan(23, 59, 59);
            dtEnd = dtEnd + tsEnd;
            //using (var context = new CloudFitbitDbEntities())
            //{
            //    try
            //    {
            //        context.Database.Connection.Open();

            //        result = context.TempTables.Where(t => user.id == t.UserID && (t.DateTime >= dtStart && t.DateTime <= dtEnd)).OrderBy(t => t.DateTime).ToList();

            //        context.Database.Connection.Close();
            //    }
            //    catch (Exception e)
            //    {
            //        throw e;
            //    }
            //}


            int period = 1;

            var cardio = new List<TempTable>();
            var resultList = new List<TempTable>();

            Stopwatch sw = new Stopwatch();
            sw.Start();

            while(true)
            {            
                if (results != null)
                {
                    for (int i = 0; i < results.DataList.Count(); i++)
                    {
                        if (i >= period - 1)
                        {
                            double total = 0;
                            for (int x = i; x > (i - period); x--)
                                total += double.Parse(results.DataList[i].Value);
                            double average = total / period;
                            cardio.Add(new TempTable() { DateTime = results.DataList[i].DateTime, Name = "HR", Value = results.DataList[i].Value, UserID = user.id });
                        }
                    }
                    MailMessage mail = new MailMessage();

                    //Setting From , To and CC
                    mail.From = new MailAddress("bpmalertservice@gmail.com", "MyWeb Site");
                    mail.To.Add(new MailAddress("corlaobrien@gmail.com"));
                    mail.Subject = "bpm Notification - High Heart Rate";
                    mail.SubjectEncoding = System.Text.Encoding.UTF8;
                    mail.BodyEncoding = System.Text.Encoding.UTF8;

                    SmtpClient client = new SmtpClient();
                    client.Credentials = new System.Net.NetworkCredential("bpmalertservice@gmail.com", "3617520Ypa64Cr");
                    client.Port = 587;
                    client.Host = "smtp.gmail.com";
                    client.EnableSsl = true;

                    var counter = 0;
                    //DateTime lastDateTime = dtStart;
                    foreach (var average in cardio)
                    {
                        Console.WriteLine(average.DateTime.UtcDateTime);
                        if (average.DateTime.UtcDateTime > lastDateFound) { 
                            if (double.Parse(average.Value) > threshold)
                            {
                                var minutes = (lastDateTime - average.DateTime).TotalMinutes;
                                Console.WriteLine(minutes);

                                if (minutes <= 1)
                                {
                                    if (lastDateTime != average.DateTime.UtcDateTime)
                                    {
                                        lastDateTime = average.DateTime.UtcDateTime;
                                        lastHighThreshold = average.DateTime.UtcDateTime;
                                        occurance = occurance + 1;
                                        Console.WriteLine("Occurance " + occurance);
                                    }
                                }
                                else
                                {
                                    if ((lastHighThreshold - average.DateTime).TotalMinutes > 1)
                                    {
                                        occurance = 0;
                                    }
                                }

                                resultList.Add(average);
                            }

                            if (occurance > 15)
                            {
                                mail.Body = user.id + "'s Heart Rate has been above 100bpm for the last " + occurance + " minutes";
                                client.Send(mail);
                                occurance++;
                            }

                            if (counter == cardio.Count() - 1)
                            {
                                lastDateFound = average.DateTime.UtcDateTime;
                            }
                            counter++;
                        }
                    }
                    break;
                }
                else
                {
                    if (sw.ElapsedMilliseconds > 5000)
                        break;
                }
            }
        }

        public string CommitHeartRates(SyncUser user)
        {
            if (!Environment.UserInteractive)
            {
                eventLog1.WriteEntry("In CommitHeartRates - user: " + user.id);
            }
            else
            {
                Console.WriteLine("In CommitHeartRates - user: " + user.id);
            }
            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();
                    if (results != null)
                    {
                        var lastDateTime = context.TempTables.OrderByDescending(t => t.DateTime).Where(t => t.UserID == user.id).Select(t => t.DateTime).FirstOrDefault();                    
                        foreach (var item in results.DataList)
                        {
                            if (item.DateTime > lastDateTime)
                            {
                                context.TempTables.Add(new TempTable()
                                {
                                    DateTime = item.DateTime,
                                    Name = "HR",
                                    Value = item.Value,
                                    UserID = user.id
                                });
                                context.SaveChanges();
                            }
                        }

                        //context.Pulls.Add(new Pull()
                        //{
                        //    DateTime = DateTime.Now,
                        //    Success = true
                        //});
                        context.SaveChanges();
                    }
                    context.Database.Connection.Close();
                    return "Success";
                }
                catch (Exception e)
                {
                    if (!Environment.UserInteractive)
                    {
                        eventLog1.WriteEntry("CommitHeartRates Exception: " + e);
                    }
                    else
                    {
                        Console.WriteLine("CommitHeartRates Exception: " + e);
                    }
                    context.Pulls.Add(new Pull()
                    {
                        DateTime = DateTime.Now,
                        Success = false
                    });
                    context.Database.Connection.Close();
                    return "Failure";
                }
            }
        }
    }
}
