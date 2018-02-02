using System;

namespace FitbitWindowsService.Models
{
    public class SyncUser
    {

        public int id { get; set; }

        public string Username { get; set; }

        public DateTimeOffset LastSyncTime { get; set; }

        public string AccessToken { get; set; }

        public string TokenType { get; set; }

        public string RefreshToken { get; set; }

    }
}
