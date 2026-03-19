using System;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Markup;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.View;

public class DialogTemplateSitesView : UserControl, IComponentConnector, IStyleConnector
{
	private object compareToRowItem;

	private bool listenForContainerCreation;

	private int radioButtonFireCounter;

	internal Button ButtonCancel;

	internal Button ButtonOK;

	internal Button ButtonClose;

	internal DataGrid SitesGrid;

	private bool _contentLoaded;

	public DialogTemplateSitesView()
	{
		InitializeComponent();
		Messenger.Default.Register<GenericMessage<object>>((object)this, (object)"AddSiteUI", (Action<GenericMessage<object>>)delegate(GenericMessage<object> msg)
		{
			SetListen(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RefreshSitesGrid", (Action<NotificationMessage>)delegate
		{
			RefreshSitesGrid();
		}, false);
		SitesGrid.ItemContainerGenerator.StatusChanged += ItemContainerGeneratorStatusChanged;
		base.Loaded += DialogTemplateSitesViewLoaded;
	}

	private void ItemContainerGeneratorStatusChanged(object sender, EventArgs e)
	{
		if (!listenForContainerCreation || SitesGrid.ItemContainerGenerator.Status != GeneratorStatus.ContainersGenerated)
		{
			return;
		}
		IEnumerable<FrameworkElement> enumerable = from object item in SitesGrid.Items
			select (FrameworkElement)SitesGrid.ItemContainerGenerator.ContainerFromItem(item);
		if (enumerable == null)
		{
			return;
		}
		foreach (FrameworkElement item in enumerable)
		{
			item.Loaded += ContainerLoaded;
		}
	}

	private void ContainerLoaded(object sender, RoutedEventArgs e)
	{
		FrameworkElement obj = (FrameworkElement)sender;
		obj.Loaded -= ContainerLoaded;
		DataGridRow dataGridRow = (DataGridRow)obj;
		if (listenForContainerCreation && dataGridRow.Item == compareToRowItem)
		{
			listenForContainerCreation = false;
			SetFocusAndBeginEdit(dataGridRow);
		}
	}

	private void SetFocusAndBeginEdit(DataGridRow row)
	{
		SitesGrid.SelectedIndex = row.GetIndex();
		DataGridHelper.GetCell(row.GetIndex(), 0, SitesGrid).Focus();
		SitesGrid.BeginEdit();
	}

	private void DialogTemplateSitesViewLoaded(object sender, RoutedEventArgs e)
	{
		Window.GetWindow(this).Closing += DialogTemplateSitesViewClosing;
	}

	private void DialogTemplateSitesViewClosing(object sender, CancelEventArgs e)
	{
		Messenger.Default.Unregister<GenericMessage<object>>((object)this, (object)"AddSiteUI");
		Messenger.Default.Unregister<NotificationMessage>((object)this, (object)"RefreshSitesGrid");
	}

	private void SitesGrid_SelectedCellsChanged(object sender, SelectedCellsChangedEventArgs e)
	{
		SitesGrid.CommitEdit(DataGridEditingUnit.Row, exitEditingMode: true);
	}

	private void SetListen(object obj)
	{
		listenForContainerCreation = true;
		compareToRowItem = obj;
	}

	private void RefreshSitesGrid()
	{
		if (!((IEditableCollectionView)SitesGrid.Items).IsEditingItem)
		{
			SitesGrid.Items.Refresh();
		}
	}

	private void SitesGrid_QueryContinueDrag(object sender, QueryContinueDragEventArgs e)
	{
		if (((IEditableCollectionView)SitesGrid.Items).IsEditingItem)
		{
			e.Action = DragAction.Cancel;
			e.Handled = true;
		}
	}

	private void RadioButton_Checked(object sender, RoutedEventArgs e)
	{
		radioButtonFireCounter++;
		if (radioButtonFireCounter > 1)
		{
			SitesGrid.CommitEdit(DataGridEditingUnit.Row, exitEditingMode: true);
		}
	}

	private void SitesGrid_BeginningEdit(object sender, DataGridBeginningEditEventArgs e)
	{
		radioButtonFireCounter = 0;
	}

	private void SitesGrid_MouseUp(object sender, MouseButtonEventArgs e)
	{
		if (e.OriginalSource is ScrollViewer)
		{
			SitesGrid.CommitEdit(DataGridEditingUnit.Row, exitEditingMode: true);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/dialogtemplatesitesview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
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
			ButtonCancel = (Button)target;
			break;
		case 2:
			ButtonOK = (Button)target;
			break;
		case 3:
			ButtonClose = (Button)target;
			break;
		case 4:
			SitesGrid = (DataGrid)target;
			SitesGrid.QueryContinueDrag += SitesGrid_QueryContinueDrag;
			SitesGrid.BeginningEdit += SitesGrid_BeginningEdit;
			SitesGrid.SelectedCellsChanged += SitesGrid_SelectedCellsChanged;
			SitesGrid.MouseUp += SitesGrid_MouseUp;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IStyleConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 5:
			((RadioButton)target).Checked += RadioButton_Checked;
			break;
		case 6:
			((RadioButton)target).Checked += RadioButton_Checked;
			break;
		}
	}
}
