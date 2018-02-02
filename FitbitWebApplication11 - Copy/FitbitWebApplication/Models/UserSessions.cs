using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FitbitWebApplication.Models
{
    public class UserSessions
    {
        public UserSessions()
        {
            ZeroUserSessions = new List<int>();
            OneUserSession = new List<int>();
            TwoUserSessions = new List<int>();
            ThreeUserSessions = new List<int>();
            FourUserSessions = new List<int>();
            MoreThanFourUserSessions = new List<int>();
        }

        public List<int> ZeroUserSessions { get; set; }

        public List<int> OneUserSession { get; set; }

        public List<int> TwoUserSessions { get; set; }

        public List<int> ThreeUserSessions { get; set; }

        public List<int> FourUserSessions { get; set; }

        public List<int> MoreThanFourUserSessions { get; set; }
    }
}