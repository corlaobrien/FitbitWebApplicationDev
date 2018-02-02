using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FitbitWebApplication.Models
{
    public class BubbleUser
    {
        public int userId { get; set; }
        public string name { get; set; }
        public string email { get; set; }
        public int age { get; set; }
        public string ageGroup { get; set; }
        public string gender { get; set; }
        public string occupationType { get; set; }
        public int numberOfSessions { get; set; }
    }
}