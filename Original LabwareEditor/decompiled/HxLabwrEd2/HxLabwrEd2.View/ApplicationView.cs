using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Markup;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Ioc;
using Hamilton.Resources.Controls;
using HxLabwrEd2.StaticHelpers;
using HxLabwrEd2.ViewModel;

namespace HxLabwrEd2.View;

public class ApplicationView : HamiltonWindow, IComponentConnector
{
	private bool _contentLoaded;

	public ApplicationView()
	{
		InitializeComponent();
	}

	private void HamiltonWindow_Closing(object sender, CancelEventArgs e)
	{
		if (UnsavedDataHelper.UnsavedDataPresent() && DialogWindowHelper.ShowDialogWithProportionalDimensions("Confirmation", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogUnsavedChangesViewModel>(), UnsavedChangesDialogExitText.AppExit, 0.4, 0.2) == false)
		{
			e.Cancel = true;
		}
		else
		{
			ViewModelLocator.Cleanup();
		}
	}

	private void HamiltonWindow_ContentRendered(object sender, EventArgs e)
	{
		WindowShadowHelper.MainWindowRendered = true;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/applicationview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		if (connectionId == 1)
		{
			((Window)(object)(ApplicationView)target).ContentRendered += HamiltonWindow_ContentRendered;
			((Window)(object)(ApplicationView)target).Closing += HamiltonWindow_Closing;
		}
		else
		{
			_contentLoaded = true;
		}
	}
}
