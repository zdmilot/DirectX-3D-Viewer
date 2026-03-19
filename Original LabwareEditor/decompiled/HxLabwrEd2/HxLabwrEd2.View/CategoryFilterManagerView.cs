using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Threading;

namespace HxLabwrEd2.View;

public class CategoryFilterManagerView : UserControl, IComponentConnector, IStyleConnector
{
	internal CategoryFilterManagerView CategoryFilterManager;

	internal CheckBox FilterCheckBox;

	internal ComboBox FilterComboBox;

	internal Button FilterNew;

	internal Button FilterSave;

	internal Button FilterSaveAs;

	internal Button FilterDelete;

	internal TextBox FilterTermTextBox;

	internal Button CategoryNew;

	internal Button CategorySave;

	internal Button CategoryDelete;

	internal Button TreeExpandAllNodes;

	internal Button TreeCollapseAllNodes;

	internal Button MagicButton;

	internal TreeView ManagerTreeView;

	internal ScrollViewer LabwareScrollViewer;

	internal TextBlock ValidatedTextBlock;

	internal Button EditLabware;

	private bool _contentLoaded;

	public CategoryFilterManagerView()
	{
		InitializeComponent();
	}

	private void TreeView_PreviewMouseRightButtonDown(object sender, MouseButtonEventArgs e)
	{
		TreeViewItem treeViewItem = VisualUpwardsSearch(e.OriginalSource as DependencyObject);
		if (treeViewItem != null)
		{
			treeViewItem.Focus();
			e.Handled = true;
		}
	}

	private static TreeViewItem VisualUpwardsSearch(DependencyObject source)
	{
		while (source != null && !(source is TreeViewItem))
		{
			source = VisualTreeHelper.GetParent(source);
		}
		return source as TreeViewItem;
	}

	private void TextBox_IsVisibleChanged(object sender, DependencyPropertyChangedEventArgs e)
	{
		if ((sender as TextBox).Visibility == Visibility.Visible)
		{
			base.Dispatcher.BeginInvoke((Action)delegate
			{
				(sender as TextBox).SelectAll();
				Keyboard.Focus(sender as TextBox);
			}, DispatcherPriority.Render);
		}
	}

	private void ManagerTreeView_SelectedItemChanged(object sender, RoutedPropertyChangedEventArgs<object> e)
	{
		LabwareScrollViewer.ScrollToTop();
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/categoryfiltermanagerview.xaml", UriKind.Relative);
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
			CategoryFilterManager = (CategoryFilterManagerView)target;
			break;
		case 2:
			FilterCheckBox = (CheckBox)target;
			break;
		case 3:
			FilterComboBox = (ComboBox)target;
			break;
		case 4:
			FilterNew = (Button)target;
			break;
		case 5:
			FilterSave = (Button)target;
			break;
		case 6:
			FilterSaveAs = (Button)target;
			break;
		case 7:
			FilterDelete = (Button)target;
			break;
		case 8:
			FilterTermTextBox = (TextBox)target;
			break;
		case 9:
			CategoryNew = (Button)target;
			break;
		case 10:
			CategorySave = (Button)target;
			break;
		case 11:
			CategoryDelete = (Button)target;
			break;
		case 12:
			TreeExpandAllNodes = (Button)target;
			break;
		case 13:
			TreeCollapseAllNodes = (Button)target;
			break;
		case 14:
			MagicButton = (Button)target;
			break;
		case 15:
			ManagerTreeView = (TreeView)target;
			ManagerTreeView.PreviewMouseRightButtonDown += TreeView_PreviewMouseRightButtonDown;
			ManagerTreeView.SelectedItemChanged += ManagerTreeView_SelectedItemChanged;
			break;
		case 17:
			LabwareScrollViewer = (ScrollViewer)target;
			break;
		case 18:
			ValidatedTextBlock = (TextBlock)target;
			break;
		case 19:
			EditLabware = (Button)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}

	[EditorBrowsable(EditorBrowsableState.Never)]
	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	void IStyleConnector.Connect(int connectionId, object target)
	{
		if (connectionId == 16)
		{
			((TextBox)target).IsVisibleChanged += TextBox_IsVisibleChanged;
		}
	}
}
