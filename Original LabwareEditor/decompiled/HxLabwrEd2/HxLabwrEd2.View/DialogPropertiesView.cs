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

public class DialogPropertiesView : UserControl, IComponentConnector
{
	private object compareToRowItem;

	private bool listenForContainerCreation;

	internal DialogPropertiesView PropertiesView;

	internal Button ButtonCancel;

	internal Button ButtonSave;

	internal Button ButtonClose;

	internal DataGrid PropertiesGrid;

	private bool _contentLoaded;

	public DialogPropertiesView()
	{
		InitializeComponent();
		Messenger.Default.Register<GenericMessage<object>>((object)this, (object)"AddPropertyUI", (Action<GenericMessage<object>>)delegate(GenericMessage<object> msg)
		{
			SetListen(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RefreshPropertiesGrid", (Action<NotificationMessage>)delegate
		{
			RefreshPropertiesGrid();
		}, false);
		PropertiesGrid.ItemContainerGenerator.StatusChanged += ItemContainerGeneratorStatusChanged;
		base.Loaded += DialogPropertiesViewLoaded;
	}

	private void DialogPropertiesViewLoaded(object sender, RoutedEventArgs e)
	{
		Window.GetWindow(this).Closing += DialogPropertiesViewClosing;
	}

	private void DialogPropertiesViewClosing(object sender, CancelEventArgs e)
	{
		Messenger.Default.Unregister<GenericMessage<object>>((object)this, (object)"AddPropertyUI");
	}

	private void ItemContainerGeneratorStatusChanged(object sender, EventArgs e)
	{
		if (!listenForContainerCreation || PropertiesGrid.ItemContainerGenerator.Status != GeneratorStatus.ContainersGenerated)
		{
			return;
		}
		IEnumerable<FrameworkElement> enumerable = from object item in PropertiesGrid.Items
			select (FrameworkElement)PropertiesGrid.ItemContainerGenerator.ContainerFromItem(item);
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

	private void SetListen(object obj)
	{
		listenForContainerCreation = true;
		compareToRowItem = obj;
	}

	private void SetFocusAndBeginEdit(DataGridRow row)
	{
		PropertiesGrid.SelectedIndex = row.GetIndex();
		DataGridHelper.GetCell(row.GetIndex(), 0, PropertiesGrid).Focus();
		PropertiesGrid.BeginEdit();
	}

	private void PropertiesGrid_SelectedCellsChanged(object sender, SelectedCellsChangedEventArgs e)
	{
		PropertiesGrid.CommitEdit(DataGridEditingUnit.Cell, exitEditingMode: true);
	}

	private void RefreshPropertiesGrid()
	{
		if (!((IEditableCollectionView)PropertiesGrid.Items).IsEditingItem)
		{
			PropertiesGrid.Items.Refresh();
		}
	}

	private void PropertiesGrid_MouseUp(object sender, MouseButtonEventArgs e)
	{
		if (e.OriginalSource is ScrollViewer)
		{
			PropertiesGrid.CommitEdit(DataGridEditingUnit.Row, exitEditingMode: true);
		}
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/dialogpropertiesview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	internal Delegate _CreateDelegate(Type delegateType, string handler)
	{
		return Delegate.CreateDelegate(delegateType, this, handler);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			PropertiesView = (DialogPropertiesView)target;
			break;
		case 2:
			ButtonCancel = (Button)target;
			break;
		case 3:
			ButtonSave = (Button)target;
			break;
		case 4:
			ButtonClose = (Button)target;
			break;
		case 5:
			PropertiesGrid = (DataGrid)target;
			PropertiesGrid.SelectedCellsChanged += PropertiesGrid_SelectedCellsChanged;
			PropertiesGrid.MouseUp += PropertiesGrid_MouseUp;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
