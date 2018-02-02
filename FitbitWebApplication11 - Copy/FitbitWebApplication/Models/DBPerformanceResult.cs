using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FitbitWebApplication.Models
{
    public class DBPerformanceResult
    {
        public DBPerformanceResult()
        {

        }

        public DBPerformanceResult(double timeDiff, DateTime sTime, int m, int round)
        {
            timeDifference = timeDiff;
            startTime = sTime;
            millisecond = m;
            roundNumber = round;
        }

        public double timeDifference { get; set; }

        public DateTime startTime { get; set; }

        public int millisecond { get; set; }

        public int roundNumber { get; set; }
    }
}