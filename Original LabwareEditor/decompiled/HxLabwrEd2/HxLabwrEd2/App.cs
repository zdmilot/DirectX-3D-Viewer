using System;
using System.CodeDom.Compiler;
using System.Diagnostics;
using System.Windows;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2;

public class App : Application
{
	private bool _contentLoaded;

	private void Application_Startup(object sender, StartupEventArgs e)
	{
		CommandLineArgumentHelper.CheckCommandLineParameters(sender, e);
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			base.Startup += Application_Startup;
			base.StartupUri = new Uri("View/ApplicationView.xaml", UriKind.Relative);
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/app.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	[STAThread]
	public static void Main()
	{
		App app = new App();
		app.InitializeComponent();
		app.Run();
	}
}
