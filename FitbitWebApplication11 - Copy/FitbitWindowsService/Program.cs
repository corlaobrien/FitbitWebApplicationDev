

namespace FitbitWindowsService
{
    using System;
    using System.ServiceProcess;

    static class Program
    {
        static void Main()
        {
            if (Environment.UserInteractive)
            {
                using (var service = new Service())
                {
                    Console.WriteLine("Starting the service...");
                    service.Start();
                    Console.WriteLine("The service is started. Press any key to exit.");
                    Console.Read();
                    service.Stop();
                }
            }
            else
            {
                ServiceBase[] ServicesToRun;
                ServicesToRun = new ServiceBase[]
                {
                new Service()
                };
                ServiceBase.Run(ServicesToRun);
            }
        }
    }    
}
