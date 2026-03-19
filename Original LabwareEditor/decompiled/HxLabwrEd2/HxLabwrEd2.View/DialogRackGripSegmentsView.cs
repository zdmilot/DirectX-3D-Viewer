using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;

namespace HxLabwrEd2.View;

public class DialogRackGripSegmentsView : UserControl, IComponentConnector
{
	internal DialogRackGripSegmentsView RackGripSegmentsView;

	internal Button ButtonCancel;

	internal Button ButtonOK;

	internal Button ButtonClose;

	internal ListBox GripSegmentsX;

	internal ListBox GripSegmentsY;

	private bool _contentLoaded;

	public DialogRackGripSegmentsView()
	{
		InitializeComponent();
	}

	private void GripSegmentsX_Error(object sender, ValidationErrorEventArgs e)
	{
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/dialograckgripsegmentsview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[EditorBrowsable(EditorBrowsableState.Never)]
	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			RackGripSegmentsView = (DialogRackGripSegmentsView)target;
			break;
		case 2:
			ButtonCancel = (Button)target;
			break;
		case 3:
			ButtonOK = (Button)target;
			break;
		case 4:
			ButtonClose = (Button)target;
			break;
		case 5:
			GripSegmentsX = (ListBox)target;
			break;
		case 6:
			GripSegmentsY = (ListBox)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
