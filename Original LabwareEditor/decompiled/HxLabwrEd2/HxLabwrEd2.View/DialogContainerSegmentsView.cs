using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using GalaSoft.MvvmLight.Messaging;

namespace HxLabwrEd2.View;

public class DialogContainerSegmentsView : UserControl, IComponentConnector
{
	internal Button ButtonCancel;

	internal Button ButtonSave;

	internal Button ButtonClose;

	internal ListBox SegmentsList;

	private bool _contentLoaded;

	public DialogContainerSegmentsView()
	{
		InitializeComponent();
	}

	private void SegmentsList_Error(object sender, ValidationErrorEventArgs e)
	{
		Messenger.Default.Send<GenericMessage<ValidationErrorEventArgs>>(new GenericMessage<ValidationErrorEventArgs>(e), (object)"DialogSegmentError");
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/dialogcontainersegmentsview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			ButtonCancel = (Button)target;
			break;
		case 2:
			ButtonSave = (Button)target;
			break;
		case 3:
			ButtonClose = (Button)target;
			break;
		case 4:
			SegmentsList = (ListBox)target;
			SegmentsList.AddHandler(System.Windows.Controls.Validation.ErrorEvent, new EventHandler<ValidationErrorEventArgs>(SegmentsList_Error));
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
