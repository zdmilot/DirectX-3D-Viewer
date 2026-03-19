using System;
using System.CodeDom.Compiler;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Diagnostics;
using System.Reflection;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Threading;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.View;

public class DialogRackIrregularPatternView : UserControl, IComponentConnector
{
	private bool itemAdded;

	private TrulyObservableCollection<RackWell> savedItemSource;

	internal DialogRackIrregularPatternView RackIrregularPatternView;

	internal Button ButtonCancel;

	internal Button ButtonOK;

	internal Button ButtonClose;

	internal DataGrid WellGrid;

	private bool _contentLoaded;

	public DialogRackIrregularPatternView()
	{
		InitializeComponent();
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RefreshWellGrid", (Action<NotificationMessage>)delegate
		{
			RefreshWellGrid();
		}, false);
	}

	private void WellGrid_BeginningEdit(object sender, DataGridBeginningEditEventArgs e)
	{
		if (WellGrid.SelectedIndex == 0)
		{
			DataGridColumn column = e.Column;
			if (column.DisplayIndex == 1 || column.DisplayIndex == 2)
			{
				e.Cancel = true;
			}
		}
	}

	private void WellGrid_SelectionChanged(object sender, SelectionChangedEventArgs e)
	{
		if (WellGrid.SelectedItem == null)
		{
			return;
		}
		WellGrid.ScrollIntoView(WellGrid.SelectedItem);
		if (itemAdded)
		{
			itemAdded = false;
			WellGrid.CurrentCell = new DataGridCellInfo(WellGrid.SelectedItem, WellGrid.Columns[0]);
			Application.Current.Dispatcher.BeginInvoke((Action)delegate
			{
				WellGrid.BeginEdit();
			}, DispatcherPriority.Background, null);
		}
	}

	private void WellGrid_TargetUpdated(object sender, DataTransferEventArgs e)
	{
		if (WellGrid.ItemsSource != null)
		{
			savedItemSource = WellGrid.ItemsSource as TrulyObservableCollection<RackWell>;
			savedItemSource.CollectionChanged += SavedItemSource_CollectionChanged;
		}
		else if (savedItemSource != null)
		{
			savedItemSource.CollectionChanged -= SavedItemSource_CollectionChanged;
			savedItemSource = null;
		}
	}

	private void SavedItemSource_CollectionChanged(object sender, NotifyCollectionChangedEventArgs e)
	{
		if (e.Action == NotifyCollectionChangedAction.Add)
		{
			itemAdded = true;
		}
		else if (e.Action == NotifyCollectionChangedAction.Move)
		{
			PropertyInfo property = WellGrid.GetType().BaseType.GetProperty("IsEditingRowItem", BindingFlags.Instance | BindingFlags.NonPublic);
			if (property != null)
			{
				property.SetValue(WellGrid, false, null);
			}
			WellGrid.CancelEdit();
		}
	}

	private void WellGrid_SelectedCellsChanged(object sender, SelectedCellsChangedEventArgs e)
	{
		WellGrid.CommitEdit(DataGridEditingUnit.Cell, exitEditingMode: true);
	}

	private void RefreshWellGrid()
	{
		if (!((IEditableCollectionView)WellGrid.Items).IsEditingItem)
		{
			WellGrid.Items.Refresh();
		}
	}

	private void WellGrid_QueryContinueDrag(object sender, QueryContinueDragEventArgs e)
	{
		if (((IEditableCollectionView)WellGrid.Items).IsEditingItem)
		{
			e.Action = DragAction.Cancel;
			e.Handled = true;
		}
	}

	private void WellGrid_MouseUp(object sender, MouseButtonEventArgs e)
	{
		if (e.OriginalSource is ScrollViewer)
		{
			WellGrid.CommitEdit(DataGridEditingUnit.Row, exitEditingMode: true);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/dialograckirregularpatternview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	internal Delegate _CreateDelegate(Type delegateType, string handler)
	{
		return Delegate.CreateDelegate(delegateType, this, handler);
	}

	[EditorBrowsable(EditorBrowsableState.Never)]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			RackIrregularPatternView = (DialogRackIrregularPatternView)target;
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
			WellGrid = (DataGrid)target;
			WellGrid.QueryContinueDrag += WellGrid_QueryContinueDrag;
			WellGrid.BeginningEdit += WellGrid_BeginningEdit;
			WellGrid.SelectionChanged += WellGrid_SelectionChanged;
			WellGrid.TargetUpdated += WellGrid_TargetUpdated;
			WellGrid.SelectedCellsChanged += WellGrid_SelectedCellsChanged;
			WellGrid.MouseUp += WellGrid_MouseUp;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
