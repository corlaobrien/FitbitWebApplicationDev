using System.Net;
using System.Web.Mvc;

namespace FitbitWebApplication.Controllers
{
    public class ServiceController : Controller
    {

        //[RequireHttps(RequireSecure = true)]
        public HttpStatusCode ReceiveSubscription(string verify)
        {
            if (verify == "13fbc702522b6085b5c0f780a12aed34904a886b951df8cf0af3a53ab0e1e4a4")
            {
                return HttpStatusCode.NoContent;
            }
            else
            {
                return HttpStatusCode.NotFound;
            }
        }
    }
}