using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;

namespace HxLabwrEd2.View;

public class DialogCircularRackSettingsView : UserControl, IComponentConnector
{
	internal Button ButtonCancel;

	internal Button ButtonOK;

	internal Button ButtonClose;

	internal Image CircularRackImage;

	private bool _contentLoaded;

	public DialogCircularRackSettingsView()
	{
		InitializeComponent();
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/dialogcircularracksettingsview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			ButtonCancel = (Button)target;
			break;
		case 2:
			ButtonOK = (Button)target;
			break;
		case 3:
			ButtonClose = (Button)target;
			break;
		case 4:
			CircularRackImage = (Image)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
