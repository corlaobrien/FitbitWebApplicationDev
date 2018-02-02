using System;

namespace FitbitWebApplication.Models
{
    public class DBPerformanceFile
    {
        public DBPerformanceFile(string name, string path, DateTime creation)
        {
            FileName = name;
            FilePath = path;
            CreationDate = creation;
        }

        public string FileName { get; set; }

        public string FilePath { get; set; }

        public DateTime CreationDate { get; set; }

        public string TimeTaken { get; set; }
    }
}