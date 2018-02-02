namespace FitbitWebApplication.Models
{
    public class UserSessionCount
    {
        public UserSessionCount()
        {
            ZeroSessions = 0;
            OneSession = 0;
            TwoSessions = 0;
            ThreeSessions = 0;
            FourSessions = 0;
            MoreThanFourSessions = 0;
        }

        public int ZeroSessions { get; set; }

        public int OneSession {get; set;}

        public int TwoSessions { get; set; }

        public int ThreeSessions { get; set; }

        public int FourSessions { get; set; }

        public int MoreThanFourSessions { get; set; }

    }
}