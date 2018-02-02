//-----------------------------------------------------------------------
// <copyright file="ProjectInstaller.cs" company="EMC Corporation">
//     Copyright (c) EMC Corporation. All rights reserved.
// </copyright>
//-----------------------------------------------------------------------

namespace FitbitWindowsService
{
    using System.ComponentModel;

    /// <summary>
    /// Install Boot Content Agent
    /// </summary>
    [RunInstaller(true)]
    public partial class ProjectInstaller : System.Configuration.Install.Installer
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ProjectInstaller" /> class
        /// </summary>
        public ProjectInstaller()
        {
            this.InitializeComponent();
        }
    }
}