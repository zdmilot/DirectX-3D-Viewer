using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Markup;

namespace HxLabwrEd2.View;

public class DialogCircularRackSegmentsView : UserControl, IComponentConnector
{
	internal Button ButtonCancel;

	internal Button ButtonOK;

	internal Button ButtonClose;

	internal DataGrid SegmentsGrid;

	private bool _contentLoaded;

	public DialogCircularRackSegmentsView()
	{
		InitializeComponent();
	}

	private void SegmentsGrid_MouseUp(object sender, MouseButtonEventArgs e)
	{
		if (e.OriginalSource is ScrollViewer)
		{
			SegmentsGrid.CommitEdit(DataGridEditingUnit.Row, exitEditingMode: true);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/dialogcircularracksegmentsview.xaml", UriKind.Relative);
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
			SegmentsGrid = (DataGrid)target;
			SegmentsGrid.MouseUp += SegmentsGrid_MouseUp;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
