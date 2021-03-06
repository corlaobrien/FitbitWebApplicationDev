﻿//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace FitbitWindowsService.Models
{
    using System;
    using System.Data.Entity;
    using System.Data.Entity.Infrastructure;
    using System.Data.Entity.Core.Objects;
    using System.Linq;
    
    public partial class CloudFitbitDbEntities : DbContext
    {
        public CloudFitbitDbEntities()
            : base("name=CloudFitbitDbEntities")
        {
        }
    
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            throw new UnintentionalCodeFirstException();
        }
    
        public virtual DbSet<TempTable> TempTables { get; set; }
        public virtual DbSet<Pull> Pulls { get; set; }
        public virtual DbSet<User> Users { get; set; }
        public virtual DbSet<DataIntegrityTest> DataIntegrityTests { get; set; }
    
        public virtual int HourlyUpdate(Nullable<int> userId, Nullable<int> hour)
        {
            var userIdParameter = userId.HasValue ?
                new ObjectParameter("userId", userId) :
                new ObjectParameter("userId", typeof(int));
    
            var hourParameter = hour.HasValue ?
                new ObjectParameter("hour", hour) :
                new ObjectParameter("hour", typeof(int));
    
            return ((IObjectContextAdapter)this).ObjectContext.ExecuteFunction("HourlyUpdate", userIdParameter, hourParameter);
        }
    }
}
