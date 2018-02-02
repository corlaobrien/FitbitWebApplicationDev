using Fitbit.Api.Portable;
using Fitbit.Api.Portable.OAuth2;
using Fitbit.Models;
using FitbitWebApplication.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;

namespace FitbitWebApplication
{
    public class Service
    {

        bool _ran = false; //initial setting at start up

        internal void Start() => this.OnStart(null);

        protected void OnStart(string[] args)
        {
            // Set up a timer to trigger every minute.  
            System.Timers.Timer timer = new System.Timers.Timer();
            timer.Interval = 30000; // 30 seconds  
            //timer.Interval = 3600000000000; // 1 hour
            timer.Elapsed += new System.Timers.ElapsedEventHandler(this.OnTimer);
            timer.Start();
        }

        protected void OnStop()
        {
            // TODO: Add code here to perform any tear-down necessary to stop your service.
        }

        public void OnTimer(object sender, System.Timers.ElapsedEventArgs args)
        {
            Console.WriteLine("OnTimer Start");

            using (var context = new CloudFitbitDbEntities())
            {
                //try
                //{
                //    if (DateTime.Now.Hour == 21 && _ran == false)
                //    {
                //        _ran = true;
                //        List<SyncUser> users = GetUsersToSync();
                //        SyncFitbitDataAutomatically(users);
                //    }

                //    if (DateTime.Now.Hour != 21 && _ran == true)
                //    {
                //        _ran = false;
                //    }

                //    context.Database.Connection.Open();
                //    context.Pulls.Add(new Pull()
                //    {
                //        DateTime = DateTime.Now,
                //        Success = _ran
                //    });
                //    context.SaveChanges();
                //    context.Database.Connection.Close();
                //}
                //catch (Exception e)
                //{
                //    context.Pulls.Add(new Pull()
                //    {
                //        DateTime = DateTime.Now,
                //        Success = false
                //    });
                //    context.SaveChanges();
                //    context.Database.Connection.Close();
                //}
            }
            Console.WriteLine("OnTimer End");

        }

        public List<SyncUser> GetUsersToSync()
        {
            Console.WriteLine("GetUsersToSync Start");
            List<SyncUser> usersList = new List<SyncUser>();
            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();

                    var users = context.Users.Where(t => t.UserName != null).ToList(); //.Where(t => t.UserName != null && t.AutoSync == true)

                    foreach (var user in users)
                    {
                        //var lastUpdated = context.TempTables.Where(t => t.UserID == user.id).OrderByDescending(t => t.DateTime).Select(t => t.DateTime).FirstOrDefault();
                        //if (lastUpdated < DateTime.Now.AddDays(-30))
                        //{
                        //    lastUpdated = DateTime.Now.AddDays(-30);
                        //}
                        usersList.Add(new SyncUser { id = user.id, Username = user.UserName, AccessToken = user.AccessToken, TokenType = user.TokenType, RefreshToken = user.RefreshToken });
                    }

                    context.Database.Connection.Close();
                }
                catch (Exception e)
                {
                    throw e;
                }
            }
            Console.WriteLine("GetUsersToSync End");
            return usersList;
        }

        //Final step. Take this authorization information and use it in the app
        public async void SyncFitbitDataAutomatically(List<SyncUser> users)
        {
            Console.WriteLine("SyncFitbitDataAutomatically Start");
            foreach (var user in users)
            {
                OAuth2AccessToken accessToken = new OAuth2AccessToken { Token = user.AccessToken, TokenType = user.TokenType, RefreshToken = user.RefreshToken };
                var appCredentials = new FitbitAppCredentials()
                {
                    ClientId = ConfigurationManager.AppSettings["FitbitClientId"],
                    ClientSecret = ConfigurationManager.AppSettings["FitbitClientSecret"]
                };
                FitbitClient fitbitClient = new FitbitClient(appCredentials, accessToken);

                TimeSeriesDataList results;
                results = await fitbitClient.GetHeartRateTimeSeriesAsyncBySec(TimeSeriesResourceType.Steps, DateTime.Now, DateTime.Now); //DateTime.Now.AddDays(-1)
                CommitHeartRates(results, user);

                //UserProfile userProfile = await fitbitClient.GetUserProfileAsync();

                //int DayInterval = 1;
                //TimeSeriesDataList results;

                //if (user.LastSyncTime.Date != DateTime.Today)
                //{
                //    results = await fitbitClient.GetHeartRateTimeSeriesAsyncBySec(TimeSeriesResourceType.Steps, DateTime.UtcNow, user.LastSyncTime.UtcDateTime.AddDays(DayInterval));
                //    CommitHeartRates(results, user);
                //}
                //else
                //{
                //    while (user.LastSyncTime.UtcDateTime <= DateTime.UtcNow)
                //    {
                //        results = await fitbitClient.GetHeartRateTimeSeriesAsyncBySec(TimeSeriesResourceType.Steps, user.LastSyncTime.UtcDateTime, user.LastSyncTime.UtcDateTime.AddDays(DayInterval));
                //        CommitHeartRates(results, user);
                //    }
                //}
            }
            Console.WriteLine("SyncFitbitDataAutomatically End");
        }

        public string CommitHeartRates(TimeSeriesDataList results, SyncUser user)
        {
            Console.WriteLine("CommitHeartRates Start");

            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();
                    //var userId = context.MembershipUsers.Where(m => m.UserName == userProfile.EncodedId).Select(m => m.id).FirstOrDefault();

                    foreach (var item in results.DataList)
                    {
                        if (context.TempTables.Where(t => t.DateTime == item.DateTime && t.UserID == user.id).Count() == 0)
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
                    context.Database.Connection.Close();
                    Console.WriteLine("CommitHeartRates End");
                    return "Success";
                }
                catch (Exception e)
                {
                    //context.Pulls.Add(new Pull()
                    //{
                    //    DateTime = DateTime.Now,
                    //    Success = false
                    //});
                    context.Database.Connection.Close();
                    Console.WriteLine("CommitHeartRates End");
                    return "Failure";
                    //throw e;
                }
            }
        }
    }
}