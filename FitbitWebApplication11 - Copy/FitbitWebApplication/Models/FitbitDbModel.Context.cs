﻿//------------------------------------------------------------------------------
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
    
        public virtual DbSet<Annotation> Annotations { get; set; }
        public virtual DbSet<TempTable> TempTables { get; set; }
        public virtual DbSet<User> Users { get; set; }
        public virtual DbSet<SuperUser> SuperUsers { get; set; }
        public virtual DbSet<SuperUser_User> SuperUser_User { get; set; }
        public virtual DbSet<SuperUserUserType> SuperUserUserTypes { get; set; }
    
        public virtual int spRemoveSuperUserToUserRelationship(Nullable<int> userId, Nullable<int> superUserId)
        {
            var userIdParameter = userId.HasValue ?
                new ObjectParameter("userId", userId) :
                new ObjectParameter("userId", typeof(int));
    
            var superUserIdParameter = superUserId.HasValue ?
                new ObjectParameter("superUserId", superUserId) :
                new ObjectParameter("superUserId", typeof(int));
    
            return ((IObjectContextAdapter)this).ObjectContext.ExecuteFunction("spRemoveSuperUserToUserRelationship", userIdParameter, superUserIdParameter);
        }
    }
}
