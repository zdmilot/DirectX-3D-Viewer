using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Markup;
using GalaSoft.MvvmLight.Messaging;
using MahApps.Metro.Controls;

namespace HxLabwrEd2.View;

public class DialogRackContainersView : UserControl, IComponentConnector
{
	internal DialogRackContainersView RackContainerView;

	internal Button ButtonCancel;

	internal Button ButtonOK;

	internal Button ButtonClose;

	internal DataGrid ContainerGrid;

	internal TextBlock TxtBlockSingleFilePath;

	internal TextBox ContainerPathTextBox;

	internal TextBlock TxtBlockSingleOffsetZUnit;

	internal TextBlock TxtBlockSingleOffsetX;

	internal NumericUpDown SingleContainerOffsetXdoubleUpDown;

	internal TextBlock TxtBlockSingleOffsetXUnit;

	internal TextBlock TxtBlockSingleOffsetY;

	internal NumericUpDown SingleContainerOffsetYdoubleUpDown;

	internal TextBlock TxtBlockSingleOffsetYUnit;

	private bool _contentLoaded;

	public DialogRackContainersView()
	{
		InitializeComponent();
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"MultiSelectRackWellPathScroll", (Action<NotificationMessage>)delegate
		{
			ContainerPathScroll();
		}, false);
	}

	private void ContainerGrid_SelectedCellsChanged(object sender, SelectedCellsChangedEventArgs e)
	{
		ContainerGrid.CommitEdit(DataGridEditingUnit.Row, exitEditingMode: true);
	}

	private void ContainerGrid_MouseUp(object sender, MouseButtonEventArgs e)
	{
		if (e.OriginalSource is ScrollViewer)
		{
			ContainerGrid.CommitEdit(DataGridEditingUnit.Row, exitEditingMode: true);
		}
	}

	private void ContainerPathScroll()
	{
		ContainerPathTextBox.ScrollToHorizontalOffset(double.PositiveInfinity);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/dialograckcontainersview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		//IL_00ea: Unknown result type (might be due to invalid IL or missing references)
		//IL_00f4: Expected O, but got Unknown
		//IL_0111: Unknown result type (might be due to invalid IL or missing references)
		//IL_011b: Expected O, but got Unknown
		switch (connectionId)
		{
		case 1:
			RackContainerView = (DialogRackContainersView)target;
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
			ContainerGrid = (DataGrid)target;
			ContainerGrid.SelectedCellsChanged += ContainerGrid_SelectedCellsChanged;
			ContainerGrid.MouseUp += ContainerGrid_MouseUp;
			break;
		case 6:
			TxtBlockSingleFilePath = (TextBlock)target;
			break;
		case 7:
			ContainerPathTextBox = (TextBox)target;
			break;
		case 8:
			TxtBlockSingleOffsetZUnit = (TextBlock)target;
			break;
		case 9:
			TxtBlockSingleOffsetX = (TextBlock)target;
			break;
		case 10:
			SingleContainerOffsetXdoubleUpDown = (NumericUpDown)target;
			break;
		case 11:
			TxtBlockSingleOffsetXUnit = (TextBlock)target;
			break;
		case 12:
			TxtBlockSingleOffsetY = (TextBlock)target;
			break;
		case 13:
			SingleContainerOffsetYdoubleUpDown = (NumericUpDown)target;
			break;
		case 14:
			TxtBlockSingleOffsetYUnit = (TextBlock)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
