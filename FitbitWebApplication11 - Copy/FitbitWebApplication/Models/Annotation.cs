//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace FitbitWebApplication.Models
{
    using System;
    using System.Collections.Generic;
    
    public partial class Annotation
    {
        public long ID { get; set; }
        public System.DateTimeOffset DateTimeStart { get; set; }
        public System.DateTimeOffset DateTimeEnd { get; set; }
        public int UserId { get; set; }
        public string Description { get; set; }
        public string Tags { get; set; }
    }
}