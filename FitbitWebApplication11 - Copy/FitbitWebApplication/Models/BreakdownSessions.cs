namespace FitbitWebApplication.Models
{
    public class BreakdownSessions
    {
        public BreakdownSessions(string key, int count)
        {
            BreakdownKey = key;
            BreakdownPopulation = count;
        }

        public string BreakdownKey { get; set; }

        public int BreakdownPopulation { get; set; }
    }
}