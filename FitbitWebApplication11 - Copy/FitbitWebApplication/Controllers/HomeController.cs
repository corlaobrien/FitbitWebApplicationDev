using Fitbit.Api.Portable;
using Fitbit.Api.Portable.OAuth2;
using Fitbit.Models;
using FitbitWebApplication.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace FitbitWebApplication.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return RedirectToAction("Login", "Account");            
        }

        public ActionResult Physician()
        {
            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    if (HttpContext.User.Identity.Name != string.Empty)
                    {
                        context.Database.Connection.Open();
                        var userType = context.Users.Where(m => m.Email == HttpContext.User.Identity.Name).Select(m => m.UserType).FirstOrDefault();
                        context.Database.Connection.Close();

                        if (userType == 1)
                        {
                            ViewBag.Message = "Your internal Physician Portal.";
                            return View();
                        }
                        else
                        {
                            // redirect to user home page
                            return RedirectToAction("User", "Home");
                        }                        
                    }
                    else
                    {
                        return RedirectToAction("Login", "Account");
                    }

                }
                catch (Exception e)
                {
                    context.Database.Connection.Close();
                    return RedirectToAction("Login", "Account");
                }
            }           
        }

        public ActionResult User()
        {
            User user = (User)TempData["myObj"];

            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    if (user != null || HttpContext.User.Identity.Name != string.Empty)
                    {
                        context.Database.Connection.Open();
                        var userType = context.Users.Where(m => m.Email == HttpContext.User.Identity.Name).Select(m => m.UserType).FirstOrDefault();
                        context.Database.Connection.Close();

                        if (userType == 1)
                        {
                            // redirect to physician home page
                            return RedirectToAction("Physician", "Home");
                        }
                        else
                        {                            
                            return View(user);
                        }
                    }
                    else
                    {
                        return RedirectToAction("Login", "Account");
                    }

                }
                catch (Exception e)
                {
                    context.Database.Connection.Close();
                    return RedirectToAction("Login", "Account");
                }
            }
        }

        public ActionResult HeartRateChart()
        {
            ViewBag.Message = "Heart Rate Chart.";

            return View();
        }

        public ActionResult Dashboard()
        {
            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    if (HttpContext.User.Identity.Name != string.Empty)
                    {
                        context.Database.Connection.Open();
                        var userType = context.Users.Where(m => m.Email == HttpContext.User.Identity.Name).Select(m => m.UserType).FirstOrDefault();
                        context.Database.Connection.Close();

                        if (userType == 1)
                        {
                            ViewBag.Message = "Dashboard";
                            return View();
                        }
                        else
                        {
                            // redirect to user home page
                            return RedirectToAction("User", "Home");
                        }
                    }
                    else
                    {
                        return RedirectToAction("Login", "Account");
                    }

                }
                catch (Exception e)
                {
                    context.Database.Connection.Close();
                    return RedirectToAction("Login", "Account");
                }
            }

        }

        public ActionResult UserDashboard()
        {
            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    if (HttpContext.User.Identity.Name != string.Empty)
                    {
                        context.Database.Connection.Open();
                        var userType = context.Users.Where(m => m.Email == HttpContext.User.Identity.Name).Select(m => m.UserType).FirstOrDefault();
                        context.Database.Connection.Close();

                        if (userType == 1)
                        {
                            // redirect to physician home page
                            return RedirectToAction("Physician", "Home");
                        }
                        else
                        {
                            ViewBag.Message = "User Dashboard";
                            return View();
                        }
                    }
                    else
                    {
                        return RedirectToAction("Login", "Account");
                    }

                }
                catch (Exception e)
                {
                    context.Database.Connection.Close();
                    return RedirectToAction("Login", "Account");
                }
            }
        }

        public ActionResult MovingAverage()
        {
            ViewBag.Message = "Moving Average";

            return View();
        }

        public ActionResult DataStream()
        {
            if (HttpContext.User.Identity.Name != string.Empty)
            {
                ViewBag.Message = "Data Stream";
                return View();
            }
            else
            {
                return RedirectToAction("Login", "Account");
            }
        }

        public ActionResult Analysis()
        {
            if (HttpContext.User.Identity.Name != string.Empty)
            {
                ViewBag.Message = "Analysis";
                return View();
            }
            else
            {
                return RedirectToAction("Login", "Account");
            }            
        }

        //
        // GET: /FitbitAuth/
        // Setup - prepare the user redirect to Fitbit.com to prompt them to authorize this app.
        public ActionResult Authorize()
        {
            var appCredentials = new FitbitAppCredentials()
            {
                ClientId = ConfigurationManager.AppSettings["FitbitClientId"],
                ClientSecret = ConfigurationManager.AppSettings["FitbitClientSecret"]
            };

            var clientCallback = ConfigurationManager.AppSettings["FitbitClientCallback"];
            //make sure you've set these up in Web.Config under <appSettings>:

            Session["AppCredentials"] = appCredentials;

            //Provide the App Credentials. You get those by registering your app at dev.fitbit.com
            //Configure Fitbit authenticaiton request to perform a callback to this constructor's Callback method
            // dev
            var authenticator = new OAuth2Helper(appCredentials, Request.Url.GetLeftPart(UriPartial.Authority) + clientCallback);
            // production
            //var authenticator = new OAuth2Helper(appCredentials, Request.Url.GetLeftPart(UriPartial.Authority) + "/FitbitWebApplicationDev/Home/CallBack/");
            string[] scopes = new string[] { "activity", "nutrition", "heartrate", "location", "nutrition", "profile", "settings", "sleep", "social", "weight" };

            string authUrl = authenticator.GenerateAuthUrl(scopes, null);

            ConfigurationManager.AppSettings.Set("AuthKey", authUrl);            

            return Redirect(authUrl);
        }

        //Final step. Take this authorization information and use it in the app
        public async Task<ActionResult> CallBack()
        {
            FitbitAppCredentials appCredentials = (FitbitAppCredentials)Session["AppCredentials"];

            var clientCallback = ConfigurationManager.AppSettings["FitbitClientCallback"];

            // dev
            var authenticator = new OAuth2Helper(appCredentials, Request.Url.GetLeftPart(UriPartial.Authority) + clientCallback);
            // production
            //var authenticator = new OAuth2Helper(appCredentials, Request.Url.GetLeftPart(UriPartial.Authority) + "/FitbitWebApplicationDev/Home/CallBack/");

            string code = Request.Params["code"];

            OAuth2AccessToken accessToken = await authenticator.ExchangeAuthCodeForAccessTokenAsync(code);

            //Store credentials in FitbitClient. The client in its default implementation manages the Refresh process
            var fitbitClient = GetFitbitClient(accessToken);
            //ViewBag.AccessToken = accessToken;

            UserProfile userProfile = await fitbitClient.GetUserProfileAsync();

            User user = new User();

            using (var db = new CloudFitbitDbEntities())
            {
                try
                {
                    db.Database.Connection.Open();
                    user = db.Users.Where(m => m.Email == HttpContext.User.Identity.Name).FirstOrDefault();

                    user.UserName = userProfile.EncodedId;
                    user.AccessToken = accessToken.Token;
                    user.TokenType = accessToken.TokenType;
                    user.RefreshToken = accessToken.RefreshToken;
                    db.SaveChanges();
                    db.Database.Connection.Close();

                    TimeSeriesDataList results = await fitbitClient.GetHeartRateTimeSeriesAsync(TimeSeriesResourceType.Steps, new DateTime(2017, 3, 20, 0, 0 , 0), new DateTime(2017, 3, 20, 0, 0, 0));
                }
                catch (Exception e)
                {

                }
            }

            //for (int i = 30; i > 0; i--)
            //{
            //    TimeSeriesDataList results = await fitbitClient.GetHeartRateTimeSeriesAsync(TimeSeriesResourceType.Steps, DateTime.UtcNow.AddDays(-i), DateTime.UtcNow.AddDays(-(i - 1)));

            //    using (var context = new CloudFitbitDbEntities1())
            //    {
            //        try
            //        {
            //            context.Database.Connection.Open();
            //            //var userId = context.MembershipUsers.Where(m => m.UserName == userProfile.EncodedId).Select(m => m.id).FirstOrDefault();

            //            //foreach (var item in results.DataList)
            //            //{
            //            //    if (context.TempTables.Where(t => t.DateTime == item.DateTime && t.UserID == userId).Count() == 0)
            //            //    {
            //            //        context.TempTables.Add(new TempTable()
            //            //        {
            //            //            DateTime = item.DateTime,
            //            //            Name = "HR",
            //            //            Value = item.Value,
            //            //            UserID = userId
            //            //        });
            //            //        context.SaveChanges();
            //            //    }
            //            //}

            //            var list = from item in results.DataList
            //                       select new TempTable
            //                       {
            //                           DateTime = item.DateTime,
            //                           Name = "HR",
            //                           Value = item.Value,
            //                           UserID = membershipUser.id
            //                       };

            //            context.TempTables.AddRange(list);
            //            context.SaveChanges();

            //            //var user = context.MembershipUsers.Where(m => m.id == userId).FirstOrDefault();
            //            //membershipUser.AutoSync = true;
            //            //context.SaveChanges();
            //            //context.Database.Connection.Close();
            //        }
            //        catch (Exception e)
            //        {
            //            throw e;
            //        }
            //    }
            //}

            //using (var db = new CloudFitbitDbEntities())
            //{
            //    try
            //    {
            //        db.Database.Connection.Open();
            //        membershipUser.AutoSync = true;
            //        db.SaveChanges();
            //        db.Database.Connection.Close();
                    
            //    }
            //    catch (Exception e)
            //    {

            //    }
            //}

            TempData["myObj"] = user;
            return RedirectToAction("User", "Home");
        }


        public async Task<string> GetMovingAverageTrendData(string user, int threshold, string dateStart, string dateEnd)
        {
            DateTime dtStart = DateTime.Parse(dateStart).ToLocalTime();
            DateTime dtEnd = DateTime.Parse(dateEnd).ToLocalTime();

            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();
                    var userId = context.Users.Where(m => user == m.Email).Select(m => m.id).FirstOrDefault();
                    var result = context.TempTables.Where(t => userId == t.UserID && (t.DateTime >= dtStart && t.DateTime <= dtEnd)).OrderBy(t => t.DateTime).ToList();
                    foreach (TempTable item in result)
                    {
                        item.DateTime = item.DateTime.ToLocalTime();
                    }
                    context.Database.Connection.Close();                    

                    int period = 1;

                    //var list = new SortedList<DateTime, double>();
                    //var resultList = new SortedList<DateTime, double>();

                    var cardio = new List<TempTable>();
                    var resultList = new List<TempTable>();

                    ////add to list to work with function
                    //foreach (var item in result)
                    //{
                    //    list.Add(item.DateTime.DateTime, double.Parse(item.Value));    
                    //}

                    // gets average of 15 minutes with 1 minute intervals
                    for (int i = 0; i < result.Count(); i++)
                    {
                        if (i >= period - 1)
                        {
                            double total = 0;
                            for (int x = i; x > (i - period); x--)
                                total += double.Parse(result[i].Value);
                            double average = total / period;
                            cardio.Add(result[i]);
                        }
                    }

                    foreach(var average in cardio)
                    {
                        if(double.Parse(average.Value) > threshold)
                        {
                            average.DateTime = average.DateTime.ToLocalTime();
                            resultList.Add(average);
                        }
                    }


                    //            public SortedList<DateTime, double> MovingAverage(SortedList<DateTime, double> series, int period)
                    //{
                    //    var result = new SortedList<DateTime, double>();

                    //    for (int i = 0; i < series.Count(); i++)
                    //    {
                    //        if (i >= period - 1)
                    //        {
                    //            double total = 0;
                    //            for (int x = i; x > (i - period); x--)
                    //                total += series.Values[x];
                    //            double average = total / period;
                    //            result.Add(series.Keys[i], average);
                    //        }

                    //    }
                    //    return result;
                    //}

                    return JsonConvert.SerializeObject(new { result, resultList});
                }
                catch (Exception e)
                {
                    throw e;
                }
            }
        }

        public async Task<string> GetTrendData(string[] user, string dateStart, string dateEnd)
        {
            DateTime dtStart = DateTime.Parse(dateStart).ToLocalTime();
            DateTime dtEnd = DateTime.Parse(dateEnd).ToLocalTime();

            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();
                    var userId = 0;
                    if (user != null)
                    {
                        userId = context.Users.Where(m => user.Contains(m.Email)).Select(m => m.id).FirstOrDefault();
                    }
                    else
                    {
                        userId = context.Users.Where(m => m.Email == HttpContext.User.Identity.Name).Select(m => m.id).FirstOrDefault();
                    }
                    var result = context.TempTables.Where(t => userId == t.UserID && (t.DateTime >= dtStart && t.DateTime <= dtEnd)).ToList();

                    foreach (TempTable item in result)
                    {
                        item.DateTime = item.DateTime.ToLocalTime();
                    }

                    var annotation = context.Annotations.Where(t => userId == t.UserId && (t.DateTimeStart >= dtStart && t.DateTimeEnd <= dtEnd)).ToList();
                    context.Database.Connection.Close();

                    return JsonConvert.SerializeObject(new { result, annotation });
                }
                catch (Exception e)
                {
                    throw e;
                }
            }
        }

        public async Task<string> GetAnnotations(string dateStart, string dateEnd, int ageStart, int ageEnd, string gender, string occupation)
        {
            DateTime dtStart = DateTime.Parse(dateStart);
            DateTime dtEnd = DateTime.Parse(dateEnd);

            DateTime aStart = DateTime.Today.AddYears(-ageEnd);
            DateTime aEnd = DateTime.Today.AddYears(-(ageStart + 1)).AddDays(1);

            List<string> genderList = new List<string>();
            switch (gender)
            {
                case "All":
                    genderList.Add("male");
                    genderList.Add("female");
                    break;
                case "Male":
                    genderList.Add("male");                    
                    break;
                case "Female":
                    genderList.Add("female");
                    break;
            }

            List<string> occupationList = new List<string>();
            switch (occupation)
            {
                case "All":
                    occupationList.Add("active");
                    occupationList.Add("sedentary");
                    break;
                case "Active":
                    occupationList.Add("active");
                    break;
                case "Sedentary":
                    occupationList.Add("sedentary");
                    break;
            }

            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();
                    var userId = context.Users.Where(m => m.Email == HttpContext.User.Identity.Name).Select(m => m.id).FirstOrDefault();
                    var UserDetails = context.Users.Where(m => m.Email == HttpContext.User.Identity.Name).FirstOrDefault();
                    var currentUserAnnotation = context.Annotations.Where(t => userId == t.UserId).ToList(); //&& (t.DateTimeStart >= dtStart && t.DateTimeEnd <= dtEnd)
                    List<int> users = context.Users.Where(u => u.DOB > aStart && u.DOB < aEnd && genderList.Contains(u.Gender) && occupationList.Contains(u.OccupationType)).Select(u => u.id).ToList();
                    var otherUserAnnotation = context.Annotations.Where(t => users.Contains(t.UserId)).GroupBy(t => t.UserId).Select(grp => grp.ToList()).ToList();                    

                    // No. of Sessions
                    List<int> allSession = new List<int>();
                    List<int> allDuration = new List<int>();
                    foreach(var user in otherUserAnnotation)
                    {
                        List<int> duration = new List<int>();
                        // Duration of Sessions
                        foreach (var session in user)
                        {                            
                            TimeSpan timeDiff = session.DateTimeEnd - session.DateTimeStart;
                            var minutes = timeDiff.Minutes;

                            duration.Add(minutes);
                        }
                        allDuration.Add(duration.Sum() / duration.Count);

                        // No of Sessions
                        allSession.Add(user.Count);
                    }
                    float averageSessions;
                    float averageDurationOthers;
                    if (otherUserAnnotation.Count > 0) {
                        averageSessions = allSession.Sum() / otherUserAnnotation.Count;
                        averageDurationOthers = allDuration.Sum() / otherUserAnnotation.Count;
                    }
                    else
                    {
                        averageSessions = 0;
                        averageDurationOthers = 0;
                    }

                    List<int> allUserDuration = new List<int>();
                    float averageDurationUser;
                    if (currentUserAnnotation.Count > 0)
                    {
                        foreach (var session in currentUserAnnotation)
                        {
                            TimeSpan timeDiff = session.DateTimeEnd - session.DateTimeStart;
                            var minutes = timeDiff.Minutes;
                            allUserDuration.Add(minutes);
                        }
                        averageDurationUser = allUserDuration.Sum() / currentUserAnnotation.Count;
                    }
                    else
                    {
                        averageDurationUser = 0;
                    }

                    context.Database.Connection.Close();

                    return JsonConvert.SerializeObject(new {UserDetails, currentUserAnnotation, otherUserAnnotation, averageSessions, averageDurationOthers, averageDurationUser });
                }
                catch (Exception e)
                {
                    throw e;
                }
            }
        }

        public async Task<string> GetMultiTrendData(string[] user, string dateStart, string dateEnd)
        {
            DateTime dtStart = DateTime.Parse(dateStart);
            DateTime dtEnd = DateTime.Parse(dateEnd);

            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();
                    List<int> userId = context.Users.Where(m => user.Contains(m.Email)).Select(m => m.id).ToList();
                    //var result = context.TempTables.Join().Where(t => userId.Contains(t.UserID) && (t.DateTime >= dtStart && t.DateTime <= dtEnd)).ToList();


                    var result = context.TempTables
                       .Join(context.Users,
                          t => t.UserID,
                          m => m.id,
                          //(t, m) => new { TempTable = t, MembershipUser = m })
                          (t, m) => new { ID = t.ID, DateTime = t.DateTime, Name = t.Name, Value = t.Value, UserID = t.UserID, FirstName = m.FirstName, Surname = m.Surname })
                          .Where(tm => userId.Contains(tm.UserID) && (tm.DateTime >= dtStart && tm.DateTime <= dtEnd))
                          //.Select(new { ID: tm. })
                          .ToList();

                    context.Database.Connection.Close();

                    return JsonConvert.SerializeObject(result);
                }
                catch (Exception e)
                {
                    throw e;
                }
            }
        }

        public string GetUsers(string dateStart, string dateEnd, int ageStart, int ageEnd, string gender, string occupation, string chartType, string breakdownX, List<string> selectedTags)
        {
            DateTime dtStart = DateTime.Parse(dateStart);
            DateTime dtEnd = DateTime.Parse(dateEnd);

            DateTime aStart = DateTime.Today.AddYears(-ageEnd);
            DateTime aEnd = DateTime.Today.AddYears(-(ageStart + 1)).AddDays(1);

            List<string> genderList = new List<string>();
            switch (gender)
            {
                case "None":
                    genderList.Add("male");
                    genderList.Add("female");
                    break;
                case "Male":
                    genderList.Add("male");
                    break;
                case "Female":
                    genderList.Add("female");
                    break;
            }

            List<string> occupationList = new List<string>();
            switch (occupation)
            {
                case "None":
                    occupationList.Add("active");
                    occupationList.Add("sedentary");
                    break;
                case "Active":
                    occupationList.Add("active");
                    break;
                case "Sedentary":
                    occupationList.Add("sedentary");
                    break;
            }

            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();
                    //get super user id of logged in user                   
                    var superUserId = context.Users.Where(m => m.Email == HttpContext.User.Identity.Name)
                        .Select(m => m.id).FirstOrDefault();

                    //filter users
                    var users = context.Users
                        .Join(context.SuperUser_User,
                            t => t.id,
                            m => m.UserId,
                            (t, m) => new { t, m })
                            .Where(tm => superUserId == tm.m.SuperUserId // relationship between SU and U
                            && tm.t.DOB > aStart && tm.t.DOB < aEnd // filter age
                            && genderList.Contains(tm.t.Gender) // filter gender
                            && occupationList.Contains(tm.t.OccupationType)) //filter occupation type
                            .ToList();

                    List<int> userIds = new List<int>();
                    foreach (var user in users)
                    {
                        userIds.Add(user.t.id);
                    }          

                    if (chartType == "summary") {
                        var userAnnotations = context.Annotations.Where(a => userIds.Contains(a.UserId) && a.DateTimeStart > dtStart && a.DateTimeEnd < dtEnd && selectedTags.Contains(a.Tags))
                            .GroupBy(t => t.UserId).Select(grp => grp.ToList()).ToList();                        

                        UserSessionCount userCountSession = new UserSessionCount();
                        UserSessions userSessions = new UserSessions();
                        foreach (var annotation in userAnnotations)
                        {

                            switch (annotation.Count)
                            {
                                case 0:
                                    userCountSession.ZeroSessions++;
                                    userSessions.ZeroUserSessions.Add(annotation[0].UserId);
                                    break;
                                case 1:
                                    userCountSession.OneSession++;
                                    userSessions.OneUserSession.Add(annotation[0].UserId);
                                    break;
                                case 2:
                                    userCountSession.TwoSessions++;
                                    userSessions.TwoUserSessions.Add(annotation[0].UserId);
                                    break;
                                case 3:
                                    userCountSession.ThreeSessions++;
                                    userSessions.ThreeUserSessions.Add(annotation[0].UserId);
                                    break;
                                case 4:
                                    userCountSession.FourSessions++;
                                    userSessions.FourUserSessions.Add(annotation[0].UserId);
                                    break;
                                default:
                                    userCountSession.MoreThanFourSessions++;
                                    userSessions.MoreThanFourUserSessions.Add(annotation[0].UserId);
                                    break;
                            }
                        }

                        if (userAnnotations.Count < userIds.Count)
                        {
                            userCountSession.ZeroSessions = (userIds.Count - userAnnotations.Count);
                        }
                        List<PopulationSessions> sessions = new List<PopulationSessions>();
                        sessions.Add(new PopulationSessions { Session = "0", Population = userCountSession.ZeroSessions });
                        sessions.Add(new PopulationSessions { Session = "1", Population = userCountSession.OneSession });
                        sessions.Add(new PopulationSessions { Session = "2", Population = userCountSession.TwoSessions });
                        sessions.Add(new PopulationSessions { Session = "3", Population = userCountSession.ThreeSessions });
                        sessions.Add(new PopulationSessions { Session = "4", Population = userCountSession.FourSessions });
                        sessions.Add(new PopulationSessions { Session = ">4", Population = userCountSession.MoreThanFourSessions });

                        context.Database.Connection.Close();
                        return JsonConvert.SerializeObject(new { users, sessions, userAnnotations, userSessions });
                    }
                    else if (chartType == "breakdown")
                    {
                        List<BreakdownSessions> sessions = new List<BreakdownSessions>();

                        var annotations = context.Users
                        .Join(context.Annotations,
                            t => t.id,
                            a => a.UserId,
                            (t, a) => new { t, a })
                            .Where(ta => userIds.Contains(ta.a.UserId) && ta.a.DateTimeStart > dtStart && ta.a.DateTimeEnd < dtEnd && selectedTags.Contains(ta.a.Tags))
                            .ToList();

                        switch (breakdownX)
                        {
                            case "gender":
                                var femaleUsers = users.Where(tm => tm.t.Gender == "female").Count();
                                var maleUsers = users.Where(tm => tm.t.Gender == "male").Count();

                                var maleCount = 0;
                                var femaleCount = 0;

                                foreach(var a in annotations)
                                {
                                    if (a.t.Gender == "male")
                                    {
                                        maleCount++;
                                    }
                                    if (a.t.Gender == "female")
                                    {
                                        femaleCount++;
                                    }
                                }

                                if (maleCount == 0 || maleUsers == 0)
                                {
                                    sessions.Add(new BreakdownSessions("male", 0));
                                }
                                else
                                {
                                    sessions.Add(new BreakdownSessions("male", maleCount));
                                }

                                if (femaleCount == 0 || femaleUsers == 0)
                                {
                                    sessions.Add(new BreakdownSessions("female", 0));
                                }
                                else
                                {
                                    sessions.Add(new BreakdownSessions("female", femaleCount));
                                }                             
                                break;
                            case "occupationType":
                                var activeUsers = users.Where(tm => tm.t.OccupationType == "active").Count();
                                var sedentaryUsers = users.Where(tm => tm.t.OccupationType == "sedentary").Count();

                                var activeCount = 0;
                                var sedentaryCount = 0;

                                foreach (var a in annotations)
                                {
                                    if (a.t.OccupationType == "active")
                                    {
                                        activeCount++;
                                    }
                                    if (a.t.OccupationType == "sedentary")
                                    {
                                        sedentaryCount++;
                                    }
                                }

                                if (activeCount == 0 || activeUsers == 0)
                                {
                                    sessions.Add(new BreakdownSessions("active", 0));
                                }
                                else
                                {
                                    sessions.Add(new BreakdownSessions("active", activeCount));
                                }

                                if (sedentaryCount == 0 || sedentaryUsers == 0)
                                {
                                    sessions.Add(new BreakdownSessions("sedentary", 0));
                                }
                                else
                                {
                                    sessions.Add(new BreakdownSessions("sedentary", sedentaryCount));
                                }
                                break;
                            case "age":
                                var Users025 = users.Where(tm => CalculateAge(tm.t.DOB.Value) < 25).Count();
                                var Users2640 = users.Where(tm => CalculateAge(tm.t.DOB.Value) > 25 && CalculateAge(tm.t.DOB.Value) <= 40).Count();
                                var Users4155 = users.Where(tm => CalculateAge(tm.t.DOB.Value) > 41 && CalculateAge(tm.t.DOB.Value) <= 55).Count();
                                var Users5670 = users.Where(tm => CalculateAge(tm.t.DOB.Value) > 56 && CalculateAge(tm.t.DOB.Value) <= 70).Count();
                                var Users7185 = users.Where(tm => CalculateAge(tm.t.DOB.Value) > 71 && CalculateAge(tm.t.DOB.Value) <= 85).Count();
                                var Users86 = users.Where(tm => CalculateAge(tm.t.DOB.Value) >= 86).Count();

                                var Count025 = 0;
                                var Count2640 = 0;
                                var Count4155 = 0;
                                var Count5670 = 0;
                                var Count7185 = 0;
                                var Count86 = 0;


                                foreach (var a in annotations)
                                {
                                    if (CalculateAge(a.t.DOB.Value) < 25)
                                    {
                                        Count025++;
                                    }
                                    if (CalculateAge(a.t.DOB.Value) > 25 && CalculateAge(a.t.DOB.Value) <= 40 )
                                    {
                                        Count2640++;
                                    }
                                    if (CalculateAge(a.t.DOB.Value) > 41 && CalculateAge(a.t.DOB.Value) <= 55)
                                    {
                                        Count4155++;
                                    }
                                    if (CalculateAge(a.t.DOB.Value) > 56 && CalculateAge(a.t.DOB.Value) <= 70)
                                    {
                                        Count5670++;
                                    }
                                    if (CalculateAge(a.t.DOB.Value) > 71 && CalculateAge(a.t.DOB.Value) <= 85)
                                    {
                                        Count7185++;
                                    }
                                    if (CalculateAge(a.t.DOB.Value) >= 86)
                                    {
                                        Count86++;
                                    }
                                }

                                if (Count025 == 0 || Users025 == 0)
                                {
                                    sessions.Add(new BreakdownSessions("0-25", 0));
                                }
                                else
                                {
                                    sessions.Add(new BreakdownSessions("0-25", Count025));
                                }

                                if (Count2640 == 0 || Users2640 == 0)
                                {
                                    sessions.Add(new BreakdownSessions("26-40", 0));
                                }
                                else
                                {
                                    sessions.Add(new BreakdownSessions("26-40", Count2640));
                                }

                                if (Count4155 == 0 || Users4155 == 0)
                                {
                                    sessions.Add(new BreakdownSessions("41-55", 0));
                                }
                                else
                                {
                                    sessions.Add(new BreakdownSessions("41-55", Count4155));
                                }

                                if (Count5670 == 0 || Users5670 == 0)
                                {
                                    sessions.Add(new BreakdownSessions("56-70", 0));
                                }
                                else
                                {
                                    sessions.Add(new BreakdownSessions("56-70", Count5670));
                                }

                                if (Count7185 == 0 || Users7185 == 0)
                                {
                                    sessions.Add(new BreakdownSessions("71-85", 0));
                                }
                                else
                                {
                                    sessions.Add(new BreakdownSessions("71-85", Count7185));
                                }

                                if (Count86 == 0 || Users86 == 0)
                                {
                                    sessions.Add(new BreakdownSessions("86+", 0));
                                }
                                else
                                {
                                    sessions.Add(new BreakdownSessions("86+", Count86));
                                }
                                break;
                        }

                        context.Database.Connection.Close();
                        return JsonConvert.SerializeObject(new { users, sessions });
                    }
                    else if (chartType == "multidimension")
                    {
                        List<BubbleUser> sessions = new List<BubbleUser>();
                        foreach (var user in users)
                        {
                            sessions.Add(new BubbleUser { userId = user.t.id, name = user.t.FirstName, email = user.t.Email, age = CalculateAge(user.t.DOB.Value), ageGroup= CalculateAgeGroup(user.t.DOB.Value),
                                gender = user.t.Gender, occupationType = user.t.OccupationType,
                                numberOfSessions = context.Annotations.Where(a => a.UserId == user.t.id && a.DateTimeStart > dtStart && a.DateTimeEnd < dtEnd).Count() });
                        }                  

                        context.Database.Connection.Close();
                        return JsonConvert.SerializeObject(new { users, sessions });
                    }
                    else
                    {
                        context.Database.Connection.Close();
                        return JsonConvert.SerializeObject(new { users, string.Empty });
                    }

                    
                }
                catch (Exception e)
                {
                    throw e;
                }
            }
        }

        public string AnalyseUsers(List<int> userIds, string thresholdValue) /* int superUserId, DateTimeOffset dateStart, DateTimeOffset dateEnd*/
        {
            var dateStart = DateTime.Now.AddMinutes(-70);
            //dateStart = dateStart.ToUniversalTime();
            var threshold = Convert.ToInt32(thresholdValue);
            List<object> userHR = new List<object>();
            using (var context = new CloudFitbitDbEntities())
            {
                foreach (var id in userIds)
                {
                    var result = context.TempTables.Where(t => t.UserID == id && t.DateTime < dateStart).OrderByDescending(t => t.DateTime).Take(5).ToList();
                    
                    if (result.Count() > 5)
                    {
                        userHR.Add(new { userId = id, status = "unknown" });
                    }
                    else
                    {
                        var average = result.Select(t => Convert.ToInt32(t.Value)).Sum() / 5;
                        if (average < threshold)
                        {
                            userHR.Add(new { userId = id, status = "dead" });
                        }
                        else if (average >= threshold && average <= threshold * 1.1)
                        {
                            userHR.Add(new { userId = id, status = "bad" });
                        }
                        else if (average > threshold * 1.1)
                        {
                            userHR.Add(new { userId = id, status = "good" });
                        }
                        else
                        {
                            userHR.Add(new { userId = id, status = "unknown" });
                        }
                    }                    
                }
            }

            return JsonConvert.SerializeObject(userHR);
        }

        public async Task<string> GetLiveTrendData(string[] user)
        {
            using (var context = new CloudFitbitDbEntities())
            {                
                
                //var userId = context.MembershipUsers.Where(m => user.Contains(m.Email)).Select(m => m.id).FirstOrDefault();
                //var results = context.TempTables.Where(t => userId == t.UserID).OrderBy(t => t.DateTime).Take(20);
                //context.Database.Connection.Close();
                //return JsonConvert.SerializeObject(results);

                context.Database.Connection.Open();

                User dbMember = context.Users.Where(t => user.Contains(t.Email)).FirstOrDefault();
                //SyncUser syncUser = new SyncUser { id = dbMember.id, Username = dbMember.UserName, AccessToken = dbMember.AccessToken, TokenType = dbMember.TokenType, RefreshToken = dbMember.RefreshToken };

                OAuth2AccessToken accessToken = new OAuth2AccessToken { Token = dbMember.AccessToken, TokenType = dbMember.TokenType, RefreshToken = dbMember.RefreshToken };
                var appCredentials = new FitbitAppCredentials()
                {
                    ClientId = ConfigurationManager.AppSettings["FitbitClientId"],
                    ClientSecret = ConfigurationManager.AppSettings["FitbitClientSecret"]
                };
                FitbitClient fitbitClient = new FitbitClient(appCredentials, accessToken);
                try
                {
                    TimeSeriesDataList results;
                    results = await fitbitClient.GetHeartRateTimeSeriesAsyncBySec(TimeSeriesResourceType.Steps, DateTime.Now, DateTime.Now); //DateTime.Now.AddDays(-1)
                    ////await CommitHeartRates(results, dbMember);

                    ////var r = lastUpdate < DateTime.Now.AddSeconds(-600);

                    ////foreach (var item in results.DataList)
                    ////{
                    ////    var random = (DateTime.Now - item.DateTime).TotalSeconds < 600;
                    ////    if (random == true)
                    ////    {
                    ////        var x = 5;
                    ////    }
                    ////}

                    //var returnResults = results.DataList.Where(d => (DateTime.Now - d.DateTime).TotalSeconds < 600 && lastUpdate < DateTime.Now.AddSeconds(-600));

                    //if (returnResults.Count() > 0)
                    //{
                    //    lastUpdate = returnResults.Last().DateTime;
                    //}  
                    //else
                    //{
                    //    lastUpdate = DateTime.Now.AddSeconds(-600);
                    //}         

                    //return JsonConvert.SerializeObject(returnResults);



                    //await CommitHeartRates(results, dbMember);

                    //var returnResults = new TimeSeriesDataList();

                    ////var r = lastUpdate < DateTime.Now.AddSeconds(-600);

                    //foreach (var item in results.DataList)
                    //{
                    //    //if (item == results.DataList.Last())
                    //    //{
                    //    //    var x = 5;
                    //    //}

                    //    if ((DateTime.Now - item.DateTime).TotalSeconds < 600 && (lastUpdate - item.DateTime).TotalSeconds < 0)
                    //    {
                    //        returnResults.DataList.Add(item);
                    //    }
                    //}

                    //var returnResults = results.DataList.Where(d => (DateTime.Now - d.DateTime).TotalSeconds < 600 && (lastUpdate - d.DateTime).TotalSeconds < 0);

                    //if (returnResults.Count() > 0)
                    //{
                    //    lastUpdate = returnResults.Last().DateTime;
                    //}
                    //else
                    //{
                    //    lastUpdate = DateTime.Now.AddSeconds(-600);
                    //}

                    return JsonConvert.SerializeObject(results); //


                }
                catch (Exception e)
                {
                    //accessToken = await fitbitClient.RefreshOAuth2TokenAsync();
                    //ViewBag.AccessToken = accessToken;
                    
                    //dbMember.AccessToken = accessToken.Token;
                    //dbMember.TokenType = accessToken.TokenType;
                    //dbMember.RefreshToken = accessToken.RefreshToken;
                    //context.SaveChanges();

                    context.Database.Connection.Close();
                    throw e;
                }
                finally
                {
                    context.Database.Connection.Close();
                }
            }

        }

        public virtual string SaveAnnotation(string startDateTime, string endDateTime, string description, int userId, string tags)
        {
            DateTime dtStart = DateTime.Parse(startDateTime);
            DateTime dtEnd = DateTime.Parse(endDateTime);

            List<Annotation> a = new List<Annotation>();

            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();

                    Annotation annotation = new Annotation()
                    {
                        DateTimeStart = dtStart,
                        DateTimeEnd = dtEnd,
                        UserId = userId,
                        Description = description,
                        Tags = tags
                    };

                    context.Annotations.Add(annotation);

                    context.SaveChanges();
                    context.Database.Connection.Close();
                    a.Add(annotation);
                    return JsonConvert.SerializeObject(a);
                }
                catch (Exception e)
                {
                    context.Database.Connection.Close();
                    return JsonConvert.SerializeObject("failure");
                }
            }
        }

        public virtual string RemoveUser(int userId, int superUserId)
        {
            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();
                    //SuperUser_User item = context.SuperUser_User.Where(s => s.SuperUserId == superUserId && s.UserId == userId).FirstOrDefault();
                    context.spRemoveSuperUserToUserRelationship(userId, superUserId);
                    context.SaveChanges();
                    context.Database.Connection.Close();
                    return JsonConvert.SerializeObject("success");
                }
                catch (Exception e)
                {
                    context.Database.Connection.Close();
                    return JsonConvert.SerializeObject("failure");
                }
            }
        }

        public virtual string FindUser(string emailAddress, int superUserId)
        {
            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();
                    User user = context.Users.Where(m => m.Email.ToLower() == emailAddress.ToLower()).FirstOrDefault();

                    if (user != null)
                    {
                        SuperUser_User su = new SuperUser_User()
                        {
                            SuperUserId = superUserId,
                            UserId = user.id
                        };
                        context.SuperUser_User.Add(su);
                        context.SaveChanges();
                        context.Database.Connection.Close();
                        return JsonConvert.SerializeObject(user);
                    }
                    else
                    {
                        context.Database.Connection.Close();
                        return JsonConvert.SerializeObject("not_found");
                    }                    
                }
                catch (Exception e)
                {
                    context.Database.Connection.Close();
                    return JsonConvert.SerializeObject("failure");
                }
            }
        }

        public virtual string UpdateUserType(int superUserId, string userType)
        {
            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();
                    SuperUserUserType exists = context.SuperUserUserTypes.Where(su => su.SuperUserId == superUserId).FirstOrDefault();

                    if (exists != null)
                    {
                        exists.UserTypes = userType;
                    }
                    else
                    {
                        SuperUserUserType su = new SuperUserUserType()
                        {
                            SuperUserId = superUserId,
                            UserTypes = userType
                        };
                        context.SuperUserUserTypes.Add(su);
                    }
                        
                    context.SaveChanges();
                    context.Database.Connection.Close();
                    return JsonConvert.SerializeObject("success");
                }
                catch (Exception e)
                {
                    context.Database.Connection.Close();
                    return JsonConvert.SerializeObject("failure");
                }
            }
        }

        public virtual string GetUserType(int superUserId)
        {
            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();
                    SuperUserUserType exists = context.SuperUserUserTypes.Where(su => su.SuperUserId == superUserId).FirstOrDefault();
                    context.Database.Connection.Close();

                    if (exists != null)
                    {
                        return JsonConvert.SerializeObject(exists.UserTypes);
                    }
                    else
                    {
                        return JsonConvert.SerializeObject("User");
                    }
                }
                catch (Exception e)
                {
                    context.Database.Connection.Close();
                    return JsonConvert.SerializeObject("User");
                }
            }
        }

        public virtual string FilterFromPieChart(string dateStart, string dateEnd, int ageStart, int ageEnd, string gender, string occupation, string chartType, string breakdownX, List<string> selectedTags, List<int> userIds)
        {
            DateTime dtStart = DateTime.Parse(dateStart);
            DateTime dtEnd = DateTime.Parse(dateEnd);

            DateTime aStart = DateTime.Today.AddYears(-ageEnd);
            DateTime aEnd = DateTime.Today.AddYears(-(ageStart + 1)).AddDays(1);

            List<string> genderList = new List<string>();
            switch (gender)
            {
                case "None":
                    genderList.Add("male");
                    genderList.Add("female");
                    break;
                case "Male":
                    genderList.Add("male");
                    break;
                case "Female":
                    genderList.Add("female");
                    break;
            }

            List<string> occupationList = new List<string>();
            switch (occupation)
            {
                case "None":
                    occupationList.Add("active");
                    occupationList.Add("sedentary");
                    break;
                case "Active":
                    occupationList.Add("active");
                    break;
                case "Sedentary":
                    occupationList.Add("sedentary");
                    break;
            }
            using (var context = new CloudFitbitDbEntities())
            {
                try
                {
                    context.Database.Connection.Open();
                    //get super user id of logged in user                   
                    var superUserId = context.Users.Where(m => m.Email == HttpContext.User.Identity.Name)
                        .Select(m => m.id).FirstOrDefault();

                    //filter users                    
                    var users = context.Users
                        .Join(context.SuperUser_User,
                            t => t.id,
                            m => m.UserId,
                            (t, m) => new { t, m })
                            .Where(tm => superUserId == tm.m.SuperUserId // relationship between SU and U
                            && tm.t.DOB > aStart && tm.t.DOB < aEnd // filter age
                            && !userIds.Contains(tm.t.id) // filter other session users
                            && genderList.Contains(tm.t.Gender) // filter gender
                            && occupationList.Contains(tm.t.OccupationType)) //filter occupation type
                            .ToList();

                    List<int> userIdsToReturn = new List<int>();
                    foreach (var user in users)
                    {
                        userIdsToReturn.Add(user.t.id);
                    }

                    return JsonConvert.SerializeObject(userIdsToReturn);

                }
                catch (Exception e)
                {
                    context.Database.Connection.Close();
                    return "";
                }
            }
        }

        /// <summary>
        /// HttpClient and hence FitbitClient are designed to be long-lived for the duration of the session. This method ensures only one client is created for the duration of the session.
        /// More info at: http://stackoverflow.com/questions/22560971/what-is-the-overhead-of-creating-a-new-httpclient-per-call-in-a-webapi-client
        /// </summary>
        /// <returns></returns>
        private FitbitClient GetFitbitClient(OAuth2AccessToken accessToken = null)
        {
            if (Session["FitbitClient"] == null)
            {
                if (accessToken != null)
                {
                    var appCredentials = (FitbitAppCredentials)Session["AppCredentials"];
                    FitbitClient client = new FitbitClient(appCredentials, accessToken);
                    Session["FitbitClient"] = client;
                    return client;
                }
                else
                {
                    throw new Exception("First time requesting a FitbitClient from the session you must pass the AccessToken.");
                }

            }
            else
            {
                return (FitbitClient)Session["FitbitClient"];
            }
        }

        private int CalculateAge(DateTime DOB)
        {
            DateTime temp = DOB;
            Int32 age = 0;
            while ((temp = temp.AddYears(1)) < DateTime.Today)
                age++;
            return age;
        }

        private string CalculateAgeGroup(DateTime DOB)
        {
            DateTime temp = DOB;
            Int32 age = 0;
            while ((temp = temp.AddYears(1)) < DateTime.Today)
                age++;

            if (age <= 25)
            {
                return "<25";
            }
            else if (age > 26 && age <= 40)
            {
                return "26-40";
            }
            else if (age > 41 && age <= 55)
            {
                return "41-55";
            }
            else if (age > 56 && age <=70)
            {
                return "56-70";
            }
            else if (age > 71 && age <= 85)
            {
                return "71-85";
            }
            else
            {
                return "86+";
            }
        }
    }
}