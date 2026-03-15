using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Threading;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using GongSolutions.Wpf.DragDrop;
using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class CategoryFilterManagerViewModel : ViewModelBase, IDropTarget
{
	private bool _useTestData;

	private bool _readOnly;

	private bool _filteringEnabled;

	private bool _updatingFiltering;

	private bool _loading;

	private string _displayTreeSearchFilterTerm = string.Empty;

	private TitleNode _categorizedTitleNode;

	private TitleNode _uncategorizedTitleNode;

	private ObservableCollection<TreeNode> _categoryLabwareTreeData;

	private List<TreeNode> _changeSubscribedNodes;

	private TreeNode _selectedTreeNode;

	private LabwareNode _selectedLabwareNode;

	private TreeNode _previousSelectedNode;

	private bool _categoriesDirty;

	private bool _filterDirty;

	private string _savedCategoryName;

	private bool _categoryDeleted;

	private bool _doubleClicked;

	private bool _waitingOnDoubleClick;

	private Dictionary<string, List<LabwareNode>> _labwareTreeNodeDictionary;

	private Dictionary<int, CategoryNode> _categoryTreeNodeDictionary;

	private List<LabwareIndexData> _indexFileData;

	private Dictionary<string, List<LabwareIndexData>> _filterData;

	private ObservableCollection<string> _availableFilters;

	private string _selectedFilter;

	private string _configFileCurrentFilterName;

	public ObservableCollection<TreeNode> CategoryLabwareTreeData
	{
		get
		{
			return _categoryLabwareTreeData;
		}
		set
		{
			((ObservableObject)this).Set<ObservableCollection<TreeNode>>((Expression<Func<ObservableCollection<TreeNode>>>)(() => CategoryLabwareTreeData), ref _categoryLabwareTreeData, value);
		}
	}

	public bool ReadOnly
	{
		get
		{
			return _readOnly;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ReadOnly), ref _readOnly, value);
		}
	}

	public bool FilteringEnabled
	{
		get
		{
			return _filteringEnabled;
		}
		set
		{
			if (((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => FilteringEnabled), ref _filteringEnabled, value) && !_loading)
			{
				ApplySelectedFilterToTree();
				ConfigFileWriter.WriteLabwareFilterConfigFile(_filteringEnabled, _selectedFilter);
				RefreshIndexFile(replaceFilterFileOnly: true);
			}
		}
	}

	public TreeNode SelectedTreeNode
	{
		get
		{
			return _selectedTreeNode;
		}
		set
		{
			if (((ObservableObject)this).Set<TreeNode>((Expression<Func<TreeNode>>)(() => SelectedTreeNode), ref _selectedTreeNode, value))
			{
				CategoryDeleteButton.RaiseCanExecuteChanged();
				_doubleClicked = false;
				if (_selectedTreeNode != null && _selectedTreeNode is LabwareNode)
				{
					SelectedLabwareNode = _selectedTreeNode as LabwareNode;
				}
				else
				{
					SelectedLabwareNode = null;
				}
			}
		}
	}

	public LabwareNode SelectedLabwareNode
	{
		get
		{
			return _selectedLabwareNode;
		}
		set
		{
			((ObservableObject)this).Set<LabwareNode>((Expression<Func<LabwareNode>>)(() => SelectedLabwareNode), ref _selectedLabwareNode, value);
		}
	}

	public ICollectionView MainTreeDefaultCollectionViewSource { get; set; }

	public string DisplayTreeSearchFilterTerm
	{
		get
		{
			return _displayTreeSearchFilterTerm;
		}
		set
		{
			if (((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => DisplayTreeSearchFilterTerm), ref _displayTreeSearchFilterTerm, value) && _categoryLabwareTreeData != null)
			{
				RefreshAllTreeNodesSearchFilters();
				if (string.IsNullOrEmpty(_displayTreeSearchFilterTerm))
				{
					ExecuteTreeCollapseAllNodesButton();
					_categorizedTitleNode.IsExpanded = true;
				}
				else
				{
					ExecuteTreeExpandAllNodesButton();
				}
				UnselectSelectedTreeNode();
			}
		}
	}

	public bool CategoriesDirty
	{
		get
		{
			return _categoriesDirty;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => CategoriesDirty), ref _categoriesDirty, value);
		}
	}

	public Dictionary<int, CategoryNode> CategoryTreeNodeDictionary
	{
		get
		{
			return _categoryTreeNodeDictionary;
		}
		set
		{
			((ObservableObject)this).Set<Dictionary<int, CategoryNode>>((Expression<Func<Dictionary<int, CategoryNode>>>)(() => CategoryTreeNodeDictionary), ref _categoryTreeNodeDictionary, value);
		}
	}

	public bool FilterDirty
	{
		get
		{
			return _filterDirty;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => FilterDirty), ref _filterDirty, value);
		}
	}

	public ObservableCollection<string> AvailableFilters
	{
		get
		{
			return _availableFilters;
		}
		set
		{
			((ObservableObject)this).Set<ObservableCollection<string>>((Expression<Func<ObservableCollection<string>>>)(() => AvailableFilters), ref _availableFilters, value);
		}
	}

	public string SelectedFilter
	{
		get
		{
			return _selectedFilter;
		}
		set
		{
			if (((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => SelectedFilter), ref _selectedFilter, value) && _filteringEnabled && !_loading)
			{
				ApplySelectedFilterToTree();
				ConfigFileWriter.WriteLabwareFilterConfigFile(_filteringEnabled, _selectedFilter);
				RefreshIndexFile(replaceFilterFileOnly: true);
			}
		}
	}

	public bool FileValidation { get; set; }

	public bool OpenedWithCommandLineArgs { get; set; }

	public RelayCommand GenerateVisuals { get; }

	public RelayCommand CleanUpVisuals { get; }

	public RelayCommand FilterNewButton { get; }

	public RelayCommand FilterSaveButton { get; }

	public RelayCommand FilterSaveAsButton { get; }

	public RelayCommand FilterDeleteButton { get; }

	public RelayCommand CategoryNewButton { get; }

	public RelayCommand CategorySaveButton { get; }

	public RelayCommand CategoryDeleteButton { get; }

	public RelayCommand CategoryNewContextMenu { get; }

	public RelayCommand CategoryRenameContextMenu { get; }

	public RelayCommand CategoryDeleteContextMenu { get; }

	public RelayCommand CategoryRenameLeftClick { get; }

	public RelayCommand TreeExpandAllNodesButton { get; }

	public RelayCommand TreeCollapseAllNodesButton { get; }

	public RelayCommand MagicButton { get; }

	public RelayCommand NavToTitlePageVM { get; }

	public RelayCommand ClearDisplayTreeFilterButton { get; }

	public RelayCommand<object> SubmitCategoryRename { get; }

	public RelayCommand<object> CancelCategoryRename { get; }

	public RelayCommand SaveSelectedTreeNode { get; }

	public RelayCommand DoubleClick { get; }

	public RelayCommand<object> TreeNodeFilterCheckBoxClick { get; }

	public RelayCommand OpenLabwareFileDirectory { get; }

	public RelayCommand EditLabwareButton { get; }

	[DllImport("user32.dll")]
	public static extern uint GetDoubleClickTime();

	public CategoryFilterManagerViewModel()
	{
		//IL_001f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0029: Expected O, but got Unknown
		//IL_0037: Unknown result type (might be due to invalid IL or missing references)
		//IL_0041: Expected O, but got Unknown
		//IL_004f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0059: Expected O, but got Unknown
		//IL_0067: Unknown result type (might be due to invalid IL or missing references)
		//IL_0071: Expected O, but got Unknown
		//IL_007f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0089: Expected O, but got Unknown
		//IL_0097: Unknown result type (might be due to invalid IL or missing references)
		//IL_00a1: Expected O, but got Unknown
		//IL_00af: Unknown result type (might be due to invalid IL or missing references)
		//IL_00b9: Expected O, but got Unknown
		//IL_00c7: Unknown result type (might be due to invalid IL or missing references)
		//IL_00d1: Expected O, but got Unknown
		//IL_00eb: Unknown result type (might be due to invalid IL or missing references)
		//IL_00f5: Expected O, but got Unknown
		//IL_0103: Unknown result type (might be due to invalid IL or missing references)
		//IL_010d: Expected O, but got Unknown
		//IL_011b: Unknown result type (might be due to invalid IL or missing references)
		//IL_0125: Expected O, but got Unknown
		//IL_0133: Unknown result type (might be due to invalid IL or missing references)
		//IL_013d: Expected O, but got Unknown
		//IL_014b: Unknown result type (might be due to invalid IL or missing references)
		//IL_0155: Expected O, but got Unknown
		//IL_0193: Unknown result type (might be due to invalid IL or missing references)
		//IL_019d: Expected O, but got Unknown
		//IL_01ab: Unknown result type (might be due to invalid IL or missing references)
		//IL_01b5: Expected O, but got Unknown
		//IL_01c3: Unknown result type (might be due to invalid IL or missing references)
		//IL_01cd: Expected O, but got Unknown
		//IL_01db: Unknown result type (might be due to invalid IL or missing references)
		//IL_01e5: Expected O, but got Unknown
		//IL_01f3: Unknown result type (might be due to invalid IL or missing references)
		//IL_01fd: Expected O, but got Unknown
		//IL_020b: Unknown result type (might be due to invalid IL or missing references)
		//IL_0215: Expected O, but got Unknown
		//IL_0223: Unknown result type (might be due to invalid IL or missing references)
		//IL_022d: Expected O, but got Unknown
		//IL_0253: Unknown result type (might be due to invalid IL or missing references)
		//IL_025d: Expected O, but got Unknown
		//IL_026b: Unknown result type (might be due to invalid IL or missing references)
		//IL_0275: Expected O, but got Unknown
		GenerateVisuals = new RelayCommand((Action)ExecuteGenerateVisuals, false);
		CleanUpVisuals = new RelayCommand((Action)ExecuteCleanUpVisuals, false);
		MagicButton = new RelayCommand((Action)ExecuteMagicButton, false);
		TreeExpandAllNodesButton = new RelayCommand((Action)ExecuteTreeExpandAllNodesButton, false);
		TreeCollapseAllNodesButton = new RelayCommand((Action)ExecuteTreeCollapseAllNodesButton, false);
		ClearDisplayTreeFilterButton = new RelayCommand((Action)ExecuteClearDisplayTreeFilterButton, false);
		CategoryNewButton = new RelayCommand((Action)ExecuteCategoryNewButton, false);
		CategorySaveButton = new RelayCommand((Action)ExecuteCategorySaveButton, false);
		CategoryDeleteButton = new RelayCommand((Action)ExecuteCategoryDeleteButton, (Func<bool>)CanExecuteCategoryDeleteButton, false);
		CategoryNewContextMenu = new RelayCommand((Action)ExecuteCategoryNewContextMenu, false);
		CategoryRenameContextMenu = new RelayCommand((Action)ExecuteCategoryRenameContextMenu, false);
		CategoryDeleteContextMenu = new RelayCommand((Action)ExecuteCategoryDeleteContextMenu, false);
		CategoryRenameLeftClick = new RelayCommand((Action)ExecuteCategoryRenameLeftClick, false);
		SubmitCategoryRename = new RelayCommand<object>((Action<object>)ExecuteSubmitCategoryRename, false);
		CancelCategoryRename = new RelayCommand<object>((Action<object>)ExecuteCancelCategoryRename, false);
		NavToTitlePageVM = new RelayCommand((Action)ExecuteNavToTitlePageVM, false);
		SaveSelectedTreeNode = new RelayCommand((Action)ExecuteSaveSelectedTreeNode, false);
		DoubleClick = new RelayCommand((Action)ExecuteDoubleClick, false);
		FilterNewButton = new RelayCommand((Action)ExecuteFilterNewButton, false);
		FilterSaveButton = new RelayCommand((Action)ExecuteFilterSaveButton, false);
		FilterSaveAsButton = new RelayCommand((Action)ExecuteFilterSaveAsButton, false);
		FilterDeleteButton = new RelayCommand((Action)ExecuteFilterDeleteButton, false);
		TreeNodeFilterCheckBoxClick = new RelayCommand<object>((Action<object>)ExecuteTreeNodeFilterCheckBoxClick, false);
		OpenLabwareFileDirectory = new RelayCommand((Action)ExecuteOpenLabwareFileDirectory, false);
		EditLabwareButton = new RelayCommand((Action)ExecuteEditLabwareButton, false);
		Messenger.Default.Register<GenericMessage<string>>((object)this, (object)"DialogFilterNamingSetupNew", (Action<GenericMessage<string>>)delegate(GenericMessage<string> msg)
		{
			AddNewFilter(msg.Content);
		}, false);
		Messenger.Default.Register<GenericMessage<string>>((object)this, (object)"DialogFilterNamingSetupSaveAs", (Action<GenericMessage<string>>)delegate(GenericMessage<string> msg)
		{
			SaveFilterAs(msg.Content);
		}, false);
		FileValidation = HxRegHelper.FileValidation;
		OpenedWithCommandLineArgs = CommandLineArgumentHelper.CategoryFilterManager;
		ReadOnly = false;
		FilteringEnabled = false;
		_categorizedTitleNode = new TitleNode(TitleNode.CategoryLabwareTitleNodeName);
		_uncategorizedTitleNode = new TitleNode(TitleNode.UncategorizedLabwareTitleNodeName);
		_changeSubscribedNodes = new List<TreeNode>();
		ResetAllFlags();
	}

	~CategoryFilterManagerViewModel()
	{
		try
		{
			Messenger.Default.Unregister((object)this);
		}
		finally
		{
			((object)this).Finalize();
		}
	}

	private void TreeNodePropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (_loading)
		{
			return;
		}
		if (sender is LabwareNode && e.PropertyName == "IsFiltered")
		{
			FilterDirty = true;
		}
		if (!_updatingFiltering)
		{
			if (e.PropertyName == "IsFiltered")
			{
				_updatingFiltering = true;
				TunnelFilteringUpdates(sender as TreeNode);
				BubbleFilteringUpdates((sender as TreeNode).Parent);
				_updatingFiltering = false;
			}
			if (e.PropertyName == "Children.Remove" || e.PropertyName == "Children.Add")
			{
				_updatingFiltering = true;
				BubbleFilteringUpdates(sender as TreeNode);
				_updatingFiltering = false;
			}
		}
		if (e.PropertyName == "IsSelected")
		{
			if ((sender as TreeNode).IsSelected)
			{
				SelectedTreeNode = sender as TreeNode;
			}
			else
			{
				SelectedTreeNode = null;
			}
		}
	}

	public void DragOver(IDropInfo dropInfo)
	{
		//IL_005a: Unknown result type (might be due to invalid IL or missing references)
		//IL_0060: Invalid comparison between Unknown and I4
		//IL_0063: Unknown result type (might be due to invalid IL or missing references)
		//IL_0069: Invalid comparison between Unknown and I4
		//IL_0079: Unknown result type (might be due to invalid IL or missing references)
		//IL_007f: Invalid comparison between Unknown and I4
		//IL_0082: Unknown result type (might be due to invalid IL or missing references)
		//IL_0088: Invalid comparison between Unknown and I4
		//IL_008b: Unknown result type (might be due to invalid IL or missing references)
		//IL_0091: Invalid comparison between Unknown and I4
		//IL_0094: Unknown result type (might be due to invalid IL or missing references)
		TreeNode treeNode = dropInfo.Data as TreeNode;
		TreeNode treeNode2 = dropInfo.TargetItem as TreeNode;
		if (treeNode.DragDropAllowed && !(treeNode2 is TitleNode))
		{
			if (treeNode2 is LabwareNode)
			{
				LabwareNode obj = treeNode2 as LabwareNode;
				if (obj == null || obj.CategoryId != 0)
				{
					goto IL_0051;
				}
			}
			if (!TargetIsRelativeOfDragged(treeNode, treeNode2))
			{
				if ((int)dropInfo.InsertPosition == 2 || (int)dropInfo.InsertPosition == 1)
				{
					dropInfo.DropTargetAdorner = DropTargetAdorners.Insert;
				}
				else if ((int)dropInfo.InsertPosition == 6 || (int)dropInfo.InsertPosition == 5 || (int)dropInfo.InsertPosition == 4 || (int)dropInfo.InsertPosition == 0)
				{
					dropInfo.DropTargetAdorner = DropTargetAdorners.Highlight;
				}
				dropInfo.Effects = DragDropEffects.Move;
				return;
			}
		}
		goto IL_0051;
		IL_0051:
		dropInfo.Effects = DragDropEffects.None;
	}

	public void Drop(IDropInfo dropInfo)
	{
		//IL_0058: Unknown result type (might be due to invalid IL or missing references)
		//IL_005e: Invalid comparison between Unknown and I4
		//IL_0087: Unknown result type (might be due to invalid IL or missing references)
		//IL_008d: Invalid comparison between Unknown and I4
		TreeNode treeNode = dropInfo.Data as TreeNode;
		TreeNode treeNode2 = dropInfo.TargetItem as TreeNode;
		UnselectSelectedTreeNode();
		treeNode.Parent.Children.Remove(treeNode);
		if (treeNode2 is LabwareNode)
		{
			treeNode2.Parent.Children.Insert(FindFirstChildCategoryNodeIndex(treeNode2.Parent), treeNode);
		}
		else if ((int)dropInfo.InsertPosition == 2)
		{
			treeNode2.Parent.Children.Insert(treeNode2.Parent.Children.IndexOf(treeNode2) + 1, treeNode);
		}
		else if ((int)dropInfo.InsertPosition == 1)
		{
			treeNode2.Parent.Children.Insert(treeNode2.Parent.Children.IndexOf(treeNode2), treeNode);
		}
		else
		{
			treeNode2.Children.Insert(FindFirstChildCategoryNodeIndex(treeNode2), treeNode);
		}
		CategoriesDirty = true;
	}

	private void ExecuteFilterNewButton()
	{
		DialogWindowHelper.ShowDialogWithProportionalDimensions("New Labware Filter", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogFilterNamingViewModel>(), new List<object>
		{
			DialogFilterNamingMode.New,
			_selectedFilter,
			_availableFilters
		}, 0.4, 0.22);
	}

	private void AddNewFilter(string filterName, bool saveAs = false)
	{
		if (saveAs)
		{
			if (_filterData.ContainsKey(filterName))
			{
				_filterData.Remove(filterName);
			}
			SaveTreeToFilterData(filterName);
		}
		else
		{
			_filterData.Add(filterName, MakeFilterDataForNewFilter());
		}
		if (!_availableFilters.Contains(filterName))
		{
			List<string> list = new List<string>(_availableFilters);
			list.Add(filterName);
			list.Sort();
			int index = list.IndexOf(filterName);
			AvailableFilters.Insert(index, filterName);
		}
		if (FilterIndexFileHelper.SaveFilterDataToFile(filterName, _filterData[filterName]))
		{
			SelectedFilter = filterName;
			UnselectSelectedTreeNode();
		}
		else
		{
			_filterData.Remove(filterName);
			AvailableFilters.Remove(filterName);
		}
	}

	private void SaveFilterAs(string newFilterName)
	{
		AddNewFilter(newFilterName, saveAs: true);
	}

	private void ExecuteFilterSaveButton()
	{
		if (!CheckAndWarnForCategoryChanges())
		{
			return;
		}
		SaveTreeToFilterData(_selectedFilter);
		if (_filterData[_selectedFilter].Count != 0)
		{
			if (FilterIndexFileHelper.SaveFilterAndReplaceIndexFile(_selectedFilter, _filterData[_selectedFilter]))
			{
				FilterDirty = false;
				ApplySelectedFilterToTree();
			}
		}
		else
		{
			DialogWindowHelper.ShowDialogWithProportionalDimensions("Warning!", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), "No Labware selected, unable to save Filter!", 0.3, 0.2);
		}
	}

	private bool CheckAndWarnForCategoryChanges()
	{
		if (_categoriesDirty)
		{
			if (UnsavedDataWarning("Filter changes cannot be saved with outstanding Category chagnes. Save Category changes and Filter changes?"))
			{
				return DoExecuteCategorySaveButton();
			}
			return false;
		}
		return true;
	}

	private void ExecuteFilterSaveAsButton()
	{
		if (CheckAndWarnForCategoryChanges())
		{
			DialogWindowHelper.ShowDialogWithProportionalDimensions("Save '" + _selectedFilter + "' Labware Filter As", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogFilterNamingViewModel>(), new List<object>
			{
				DialogFilterNamingMode.SaveAs,
				_selectedFilter,
				_availableFilters
			}, 0.45, 0.22);
		}
	}

	private void ExecuteFilterDeleteButton()
	{
		string selectedFilter = _selectedFilter;
		if (FilterIndexFileHelper.DeleteFilterFile(selectedFilter))
		{
			SelectedFilter = "Default";
			AvailableFilters.Remove(selectedFilter);
			_filterData.Remove(selectedFilter);
			FilterDirty = false;
		}
	}

	private void ExecuteTreeNodeFilterCheckBoxClick(object obj)
	{
		if (_selectedTreeNode != obj as TreeNode)
		{
			UnselectSelectedTreeNode();
			(obj as TreeNode).IsSelected = true;
		}
	}

	private void ExecuteOpenLabwareFileDirectory()
	{
		//IL_0029: Unknown result type (might be due to invalid IL or missing references)
		//IL_0038: Expected O, but got Unknown
		if (_selectedLabwareNode != null)
		{
			if (!File.Exists(_selectedLabwareNode.LabwareNodeData.FilePath))
			{
				Messenger.Default.Send<NotificationMessage>(new NotificationMessage("Could not find file on disk!"), (object)"DisplayNotification");
			}
			else
			{
				Process.Start("explorer.exe", $"/select,\"{_selectedLabwareNode.LabwareNodeData.FilePath}\"");
			}
		}
	}

	private void ExecuteEditLabwareButton()
	{
		FilteringEditLabwareHelper.Start((_selectedTreeNode as LabwareNode).LabwareNodeData.FilePath);
	}

	private void ExecuteGenerateVisuals()
	{
		DoExecuteVisuals(uiGeneratingVisuals: true);
	}

	private void DoExecuteVisuals(bool uiGeneratingVisuals = false)
	{
		if (_useTestData)
		{
			LoadRandomTestData();
		}
		else
		{
			LoadDataFromDisk();
		}
		SubscribeToAllTreeNodeChanges();
		SetDisplayTreeSearchFilter();
		ApplySelectedFilterToTree(uiGeneratingVisuals);
		RefreshIndexFile(replaceFilterFileOnly: true);
		ResetAllFlags();
	}

	private void ExecuteCleanUpVisuals()
	{
		UnselectSelectedTreeNode();
		DisplayTreeSearchFilterTerm = "";
		UnsubscribeFromAllTreeNodeChanges();
		ClearLoadedData();
	}

	private bool CanExecuteCategoryDeleteButton()
	{
		if (_selectedTreeNode != null && _selectedTreeNode is CategoryNode)
		{
			return true;
		}
		return false;
	}

	private void ExecuteMagicButton()
	{
		if (UnsavedDataWarning("Unsaved changes will be lost. Are you sure you want to reload data from disk?"))
		{
			UnselectSelectedTreeNode();
			UnsubscribeFromAllTreeNodeChanges();
			ClearLoadedData();
			DoExecuteVisuals();
		}
	}

	private void ExecuteTreeExpandAllNodesButton()
	{
		ExpandRecursive(_uncategorizedTitleNode);
		ExpandRecursive(_categorizedTitleNode);
		UnselectSelectedTreeNode();
	}

	private void ExecuteTreeCollapseAllNodesButton()
	{
		CollapseRecursive(_uncategorizedTitleNode);
		CollapseRecursive(_categorizedTitleNode);
		_categorizedTitleNode.IsExpanded = true;
		UnselectSelectedTreeNode();
	}

	private void ExecuteClearDisplayTreeFilterButton()
	{
		DisplayTreeSearchFilterTerm = "";
	}

	private void ExecuteCategoryNewContextMenu()
	{
		CategoryNode categoryNode = new CategoryNode("New Category", CategoryNodeData.GetAndIncrementNextAvailableCategoryId());
		SubscribeToTreeNodeChanges(categoryNode);
		if (_selectedTreeNode != null)
		{
			_selectedTreeNode.IsExpanded = true;
			if (_selectedTreeNode is TitleNode)
			{
				_categorizedTitleNode.Children.Insert(0, categoryNode);
			}
			else if (_selectedTreeNode is CategoryNode)
			{
				_selectedTreeNode.Children.Insert(FindFirstChildCategoryNodeIndex(_selectedTreeNode), categoryNode);
			}
			else
			{
				_selectedTreeNode.Parent.Children.Insert(FindFirstChildCategoryNodeIndex(_selectedTreeNode.Parent), categoryNode);
			}
		}
		else
		{
			_categorizedTitleNode.Children.Insert(0, categoryNode);
		}
		UnselectSelectedTreeNode();
		categoryNode.IsSelected = true;
		SetDisplayTreeSearchFilter(_selectedTreeNode);
		CategoriesDirty = true;
		Application.Current.Dispatcher.BeginInvoke((Action)delegate
		{
			ExecuteCategoryRenameContextMenu();
		}, DispatcherPriority.Render);
	}

	private void ExecuteNavToTitlePageVM()
	{
		if (OpenedWithCommandLineArgs)
		{
			Application.Current.MainWindow.Close();
		}
		else if (UnsavedDataWarning())
		{
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<TitlePageViewModel>()), (object)"Navigation");
		}
	}

	private void ExecuteCategoryRenameContextMenu()
	{
		if (_selectedTreeNode != null)
		{
			_savedCategoryName = _selectedTreeNode.ViewName;
			_selectedTreeNode.IsBeingEdited = true;
		}
	}

	private void ExecuteCategoryDeleteContextMenu()
	{
		DeleteSelectedCategory();
	}

	private void ExecuteCategoryRenameLeftClick()
	{
		if (_selectedTreeNode != _previousSelectedNode || _selectedTreeNode == null || _selectedTreeNode.IsBeingEdited || !(_selectedTreeNode is CategoryNode) || _waitingOnDoubleClick)
		{
			return;
		}
		_waitingOnDoubleClick = true;
		Task.Run(async delegate
		{
			TreeNode taskSavedNode = _selectedTreeNode;
			await Task.Delay((int)GetDoubleClickTime());
			if (!_doubleClicked && _selectedTreeNode == taskSavedNode)
			{
				_savedCategoryName = _selectedTreeNode.ViewName;
				_selectedTreeNode.IsBeingEdited = true;
			}
			_doubleClicked = false;
			_waitingOnDoubleClick = false;
		});
	}

	private void ExecuteDoubleClick()
	{
		_doubleClicked = true;
	}

	private void ExecuteSaveSelectedTreeNode()
	{
		_previousSelectedNode = _selectedTreeNode;
	}

	private void ExecuteSubmitCategoryRename(object textBox)
	{
		if (!_selectedTreeNode.IsBeingEdited)
		{
			return;
		}
		if (System.Windows.Controls.Validation.GetHasError(textBox as TextBox))
		{
			_selectedTreeNode.ViewName = _savedCategoryName;
			BindingOperations.GetBindingExpressionBase((DependencyObject)textBox, TextBox.TextProperty).UpdateTarget();
			_selectedTreeNode.IsBeingEdited = false;
			return;
		}
		_selectedTreeNode.IsBeingEdited = false;
		Application.Current.Dispatcher.BeginInvoke((Action)delegate
		{
			RefreshAllTreeNodesSearchFilters();
		}, DispatcherPriority.Background);
		if (_savedCategoryName != _selectedTreeNode.ViewName)
		{
			CategoriesDirty = true;
		}
	}

	private void ExecuteCancelCategoryRename(object textBox)
	{
		if (_selectedTreeNode != null && _selectedTreeNode.IsBeingEdited)
		{
			_selectedTreeNode.ViewName = _savedCategoryName;
			if (System.Windows.Controls.Validation.GetHasError(textBox as TextBox))
			{
				BindingOperations.GetBindingExpressionBase((DependencyObject)textBox, TextBox.TextProperty).UpdateTarget();
			}
			_selectedTreeNode.IsBeingEdited = false;
		}
	}

	private void ExecuteCategoryNewButton()
	{
		CategoryNode categoryNode = new CategoryNode("New Category", CategoryNodeData.GetAndIncrementNextAvailableCategoryId());
		SubscribeToTreeNodeChanges(categoryNode);
		_categorizedTitleNode.Children.Insert(0, categoryNode);
		UnselectSelectedTreeNode();
		categoryNode.IsSelected = true;
		SetDisplayTreeSearchFilter(_selectedTreeNode);
		CategoriesDirty = true;
		Application.Current.Dispatcher.BeginInvoke((Action)delegate
		{
			ExecuteCategoryRenameContextMenu();
		}, DispatcherPriority.Render);
	}

	private void ExecuteCategorySaveButton()
	{
		DoExecuteCategorySaveButton();
	}

	private bool DoExecuteCategorySaveButton()
	{
		if (_categoryDeleted && DialogWindowHelper.ShowDialogWithProportionalDimensions("Confirmation", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogCategoryDeletionSaveViewModel>(), UnsavedChangesDialogExitText.PageExit, 0.4, 0.22) == false)
		{
			return false;
		}
		List<CategoryNode> orderedCategoryNodeList = GetOrderedCategoryNodeList();
		if (ConfigFileWriter.WriteCategoryFile(CategoryNodeData.NextAvailableCategoryId, CategoryNodeData.VectorGuid, orderedCategoryNodeList))
		{
			_categoryDeleted = false;
			CategoriesDirty = false;
		}
		return true;
	}

	private List<CategoryNode> GetOrderedCategoryNodeList(TreeNode treeNodeToCheck = null)
	{
		treeNodeToCheck = ((treeNodeToCheck == null) ? _categorizedTitleNode : treeNodeToCheck);
		List<CategoryNode> list = new List<CategoryNode>();
		foreach (TreeNode child in treeNodeToCheck.Children)
		{
			if (child is CategoryNode)
			{
				list.Add((CategoryNode)child);
				if (child.Children != null && child.Children.Count > 0)
				{
					list.AddRange(GetOrderedCategoryNodeList(child));
				}
			}
		}
		return list;
	}

	private void ExecuteCategoryDeleteButton()
	{
		DeleteSelectedCategory();
	}

	private bool UnsavedDataWarning(string message = "")
	{
		bool? flag = true;
		if (_filterDirty || _categoriesDirty)
		{
			if (string.IsNullOrEmpty(message))
			{
				flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Confirmation", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogUnsavedChangesViewModel>(), UnsavedChangesDialogExitText.PageExit, 0.4, 0.2);
			}
			else
			{
				DialogUnsavedChangesViewModel instance = SimpleIoc.Default.GetInstance<DialogUnsavedChangesViewModel>();
				instance.GenericText = message;
				flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Unsaved Category changes", (ViewModelBase)(object)instance, UnsavedChangesDialogExitText.Generic, 0.5, 0.2);
			}
		}
		return flag == true;
	}

	private void DeleteSelectedCategory()
	{
		SimpleIoc.Default.GetInstance<DialogCategoryDeletionViewModel>().CategoryName = _selectedTreeNode.ViewName;
		if (DialogWindowHelper.ShowDialogWithProportionalDimensions("Confirmation", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogCategoryDeletionViewModel>(), UnsavedChangesDialogExitText.PageExit, 0.6, 0.2) != false)
		{
			DeleteSelectedCategoryRecursive(_selectedTreeNode);
			RefreshAllTreeNodesSearchFilters();
			CategoriesDirty = true;
			_categoryDeleted = true;
		}
	}

	private void DeleteSelectedCategoryRecursive(TreeNode treeNode)
	{
		_selectedTreeNode.Parent.Children.Remove(_selectedTreeNode);
		List<TreeNode> list = FlattenTreeFromRoot(treeNode);
		List<LabwareNode> list2 = new List<LabwareNode>();
		foreach (TreeNode item in list)
		{
			UnsubscribeFromTreeNodeChangesRecursive(item);
			if (item.Children != null)
			{
				item.Children.Clear();
			}
			if (item is CategoryNode)
			{
				_categoryTreeNodeDictionary.Remove((item as CategoryNode).Id);
				continue;
			}
			LabwareNode labwareNode = item as LabwareNode;
			List<LabwareNode> list3 = _labwareTreeNodeDictionary[labwareNode.LabwareNodeData.FilePathVectorRelative];
			list3.Remove(labwareNode);
			LabwareNodeData labwareNodeData = labwareNode.LabwareNodeData;
			labwareNodeData.CategoryIds.Remove(labwareNode.CategoryId);
			if (list3.Count == 0)
			{
				LabwareNode labwareNode2 = new LabwareNode(labwareNodeData);
				labwareNode2.Icon = labwareNode.Icon;
				list3.Add(labwareNode2);
				labwareNode2.FilteringAllowed = false;
				list2.Add(labwareNode2);
			}
		}
		if (list2.Count <= 0)
		{
			return;
		}
		List<string> list4 = new List<string>(_uncategorizedTitleNode.Children.Select((TreeNode s) => s.ViewName).ToList());
		foreach (LabwareNode item2 in list2)
		{
			list4.Add(item2.ViewName);
			list4 = list4.OrderBy((string s) => s, StringComparer.InvariantCultureIgnoreCase).ToList();
			int index = list4.IndexOf(item2.ViewName);
			_uncategorizedTitleNode.Children.Insert(index, item2);
			SubscribeToTreeNodeChanges(item2);
		}
	}

	private List<TreeNode> FlattenTreeFromRoot(TreeNode rootNode)
	{
		List<TreeNode> list = new List<TreeNode>();
		Queue<TreeNode> queue = new Queue<TreeNode>();
		list.Add(rootNode);
		queue.Enqueue(rootNode);
		while (queue.Count > 0)
		{
			TreeNode treeNode = queue.Dequeue();
			if (treeNode.Children == null || treeNode.Children.Count <= 0)
			{
				continue;
			}
			foreach (TreeNode child in treeNode.Children)
			{
				list.Add(child);
				queue.Enqueue(child);
			}
		}
		return list;
	}

	private bool TargetIsRelativeOfDragged(TreeNode draggedNode, TreeNode targetNode)
	{
		TreeNode treeNode = ((targetNode is LabwareNode) ? targetNode.Parent : targetNode);
		while (treeNode is CategoryNode)
		{
			if (treeNode == draggedNode)
			{
				return true;
			}
			treeNode = treeNode.Parent;
		}
		return false;
	}

	private int FindFirstChildCategoryNodeIndex(TreeNode treeNode)
	{
		for (int num = treeNode.Children.Count - 1; num > 0; num--)
		{
			if (treeNode.Children[num] is LabwareNode)
			{
				return num + 1;
			}
		}
		return 0;
	}

	private void ClearLoadedData()
	{
		_loading = true;
		if (_categorizedTitleNode != null && _categorizedTitleNode.Children.Count > 0)
		{
			_categorizedTitleNode.Children.Clear();
		}
		if (_uncategorizedTitleNode != null && _uncategorizedTitleNode.Children.Count > 0)
		{
			_uncategorizedTitleNode.Children.Clear();
		}
		ResetAllFlags();
		_loading = false;
	}

	private void LoadRandomTestData()
	{
		_loading = true;
		int num = 10;
		int num2 = 33;
		int maxValue = Math.Min(num, 4);
		Random random = new Random();
		Dictionary<string, LabwareNodeData> dictionary = new Dictionary<string, LabwareNodeData>();
		for (int i = 1; i <= num2; i++)
		{
			LabwareNodeData labwareNodeData = new LabwareNodeData();
			labwareNodeData.ViewName = $"Labware {i}";
			if (random.NextDouble() <= 0.6)
			{
				int num3 = random.Next(1, maxValue);
				for (int j = 0; j < num3; j++)
				{
					int item = random.Next(1, num);
					if (!labwareNodeData.CategoryIds.Contains(item))
					{
						labwareNodeData.CategoryIds.Add(item);
					}
				}
			}
			dictionary.Add(labwareNodeData.ViewName, labwareNodeData);
		}
		Dictionary<int, CategoryNodeData> dictionary2 = new Dictionary<int, CategoryNodeData>();
		for (int k = 1; k <= num; k++)
		{
			dictionary2.Add(k, new CategoryNodeData(k, $"Category {k}"));
		}
		Action<TreeNode, TreeNode> randomlyInsertCategory = null;
		randomlyInsertCategory = delegate(TreeNode rootNode, TreeNode nodeToInsert)
		{
			if (rootNode.Children.Count == 0 || random.NextDouble() <= 0.3)
			{
				rootNode.Children.Add(nodeToInsert);
			}
			else
			{
				List<TreeNode> list = new List<TreeNode>();
				foreach (TreeNode child in rootNode.Children)
				{
					if (child is CategoryNode)
					{
						list.Add(child);
					}
				}
				if (list.Count == 0)
				{
					rootNode.Children.Add(nodeToInsert);
				}
				else
				{
					int index = random.Next(0, list.Count);
					randomlyInsertCategory(list[index], nodeToInsert);
				}
			}
		};
		Dictionary<int, TreeNode> dictionary3 = new Dictionary<int, TreeNode>();
		foreach (KeyValuePair<int, CategoryNodeData> item3 in dictionary2)
		{
			CategoryNode categoryNode = new CategoryNode(item3.Value.ViewName, item3.Key);
			dictionary3.Add(categoryNode.Id, categoryNode);
		}
		foreach (KeyValuePair<string, LabwareNodeData> item4 in dictionary)
		{
			if (item4.Value.CategoryIds.Count > 0)
			{
				foreach (int categoryId in item4.Value.CategoryIds)
				{
					LabwareNode item2 = new LabwareNode(item4.Key, categoryId);
					dictionary3[categoryId].Children.Add(item2);
				}
			}
			else
			{
				_uncategorizedTitleNode.Children.Add(new LabwareNode(item4.Key));
			}
		}
		DisableFilteringForUncategorizedLabwareNodes();
		foreach (KeyValuePair<int, TreeNode> item5 in dictionary3)
		{
			randomlyInsertCategory(_categorizedTitleNode, item5.Value);
		}
		CategoryLabwareTreeData = new ObservableCollection<TreeNode> { _categorizedTitleNode, _uncategorizedTitleNode };
		_uncategorizedTitleNode.IsExpanded = true;
		_categorizedTitleNode.IsExpanded = true;
		_loading = false;
	}

	private void LoadDataFromDisk()
	{
		_loading = true;
		ShadowWhileLoading();
		List<CategoryNodeData> list = ConfigFileReader.ReadCategoryFile(HxRegHelper.LabwarePath + "\\category.dat");
		List<LabwareNodeData> list2 = ConfigFileReader.ReadAllLabwareNodeData(HxRegHelper.LabwarePath);
		_indexFileData = FilterIndexFileHelper.ConvertNodeDataToIndexData(list2);
		list2 = list2.OrderBy((LabwareNodeData s) => s.ViewName, StringComparer.InvariantCultureIgnoreCase).ToList();
		CategoryTreeNodeDictionary = new Dictionary<int, CategoryNode>();
		foreach (CategoryNodeData item in list)
		{
			_categoryTreeNodeDictionary.Add(item.Id, new CategoryNode(item));
		}
		foreach (LabwareNodeData item2 in list2)
		{
			if (item2.CategoryIds.Count <= 0)
			{
				continue;
			}
			List<int> list3 = new List<int>();
			foreach (int categoryId in item2.CategoryIds)
			{
				if (!_categoryTreeNodeDictionary.ContainsKey(categoryId))
				{
					list3.Add(categoryId);
				}
			}
			if (item2.CategoryIds.Count == list3.Count)
			{
				item2.CategoryIds.Clear();
			}
			else
			{
				if (list3.Count <= 0)
				{
					continue;
				}
				foreach (int item3 in list3)
				{
					item2.CategoryIds.Remove(item3);
				}
			}
		}
		_labwareTreeNodeDictionary = new Dictionary<string, List<LabwareNode>>();
		foreach (LabwareNodeData item4 in list2)
		{
			if (!_labwareTreeNodeDictionary.ContainsKey(item4.FilePathVectorRelative))
			{
				_labwareTreeNodeDictionary.Add(item4.FilePathVectorRelative, new List<LabwareNode>());
			}
			string labwareIcon = GetLabwareIcon(item4.FilePathVectorRelative);
			if (item4.CategoryIds.Count > 0)
			{
				foreach (int categoryId2 in item4.CategoryIds)
				{
					LabwareNode labwareNode = new LabwareNode(item4, categoryId2);
					labwareNode.Icon = labwareIcon;
					_labwareTreeNodeDictionary[item4.FilePathVectorRelative].Add(labwareNode);
				}
			}
			else
			{
				LabwareNode labwareNode2 = new LabwareNode(item4);
				labwareNode2.Icon = labwareIcon;
				_labwareTreeNodeDictionary[item4.FilePathVectorRelative].Add(labwareNode2);
			}
		}
		foreach (KeyValuePair<string, List<LabwareNode>> item5 in _labwareTreeNodeDictionary)
		{
			foreach (LabwareNode item6 in item5.Value)
			{
				if (item6.CategoryId == 0)
				{
					_uncategorizedTitleNode.Children.Add(item6);
				}
				else
				{
					_categoryTreeNodeDictionary[item6.CategoryId].Children.Add(item6);
				}
			}
		}
		DisableFilteringForUncategorizedLabwareNodes();
		foreach (KeyValuePair<int, CategoryNode> item7 in _categoryTreeNodeDictionary)
		{
			if (item7.Value.ParentCategoryId != 0 && _categoryTreeNodeDictionary.ContainsKey(item7.Value.ParentCategoryId))
			{
				_categoryTreeNodeDictionary[item7.Value.ParentCategoryId].Children.Add(item7.Value);
			}
			else
			{
				_categorizedTitleNode.Children.Add(item7.Value);
			}
		}
		CategoryLabwareTreeData = new ObservableCollection<TreeNode> { _categorizedTitleNode, _uncategorizedTitleNode };
		_categorizedTitleNode.IsExpanded = true;
		_uncategorizedTitleNode.IsExpanded = false;
		FilteringEnabled = ConfigFileReader.ReadLabwareFilterConfig(out _configFileCurrentFilterName);
		_filterData = ConfigFileReader.ReadAllLabwareFilters();
		if (!_filterData.ContainsKey("Default"))
		{
			_filterData.Add("Default", new List<LabwareIndexData>());
			foreach (KeyValuePair<string, List<LabwareNode>> item8 in _labwareTreeNodeDictionary)
			{
				foreach (LabwareNode item9 in item8.Value)
				{
					_filterData["Default"].Add(new LabwareIndexData(item9.CategoryId, item9.LabwareNodeData.ViewName, item9.LabwareNodeData.Description, Path.GetFileName(item9.LabwareNodeData.FilePath), item9.LabwareNodeData.FilePathVectorRelative));
				}
			}
		}
		AvailableFilters = new ObservableCollection<string>((from s in _filterData
			select s.Key into x
			orderby x
			select x).ToList());
		_loading = false;
	}

	private void ApplySelectedFilterToTree(bool uiGeneratingVisuals = false)
	{
		if (uiGeneratingVisuals)
		{
			if (AvailableFilters.Contains(_configFileCurrentFilterName))
			{
				SelectedFilter = _configFileCurrentFilterName;
			}
			else
			{
				SelectedFilter = "Default";
			}
		}
		if (!_filteringEnabled)
		{
			return;
		}
		ApplyFilterToAllNodes(filter: false);
		foreach (LabwareIndexData filterData in _filterData[_selectedFilter])
		{
			if (_labwareTreeNodeDictionary.ContainsKey(filterData.FilePathVectorRelative))
			{
				LabwareNode labwareNode = _labwareTreeNodeDictionary[filterData.FilePathVectorRelative].Find((LabwareNode searchedNode) => searchedNode.CategoryId == filterData.CategoryId);
				if (labwareNode != null)
				{
					labwareNode.IsFiltered = true;
				}
			}
		}
		FilterDirty = false;
	}

	private void SaveTreeToFilterData(string filterName = null)
	{
		if (string.IsNullOrEmpty(filterName))
		{
			filterName = _selectedFilter;
		}
		List<LabwareIndexData> list;
		if (_filterData.ContainsKey(filterName))
		{
			_filterData[_selectedFilter].Clear();
			list = _filterData[filterName];
		}
		else
		{
			_filterData.Add(filterName, new List<LabwareIndexData>());
			list = _filterData[filterName];
		}
		foreach (KeyValuePair<string, List<LabwareNode>> item in _labwareTreeNodeDictionary)
		{
			foreach (LabwareNode item2 in item.Value)
			{
				if (item2.CategoryId != 0 && item2.IsFiltered == true)
				{
					list.Add(new LabwareIndexData(item2.CategoryId, item2.LabwareNodeData.ViewName, item2.LabwareNodeData.Description, Path.GetFileName(item2.LabwareNodeData.FilePath), item2.LabwareNodeData.FilePathVectorRelative));
				}
			}
		}
	}

	private List<LabwareIndexData> MakeFilterDataForNewFilter()
	{
		List<LabwareIndexData> list = new List<LabwareIndexData>();
		foreach (KeyValuePair<string, List<LabwareNode>> item in _labwareTreeNodeDictionary)
		{
			foreach (LabwareNode item2 in item.Value)
			{
				if (item2.CategoryId != 0)
				{
					list.Add(new LabwareIndexData(item2.CategoryId, item2.LabwareNodeData.ViewName, item2.LabwareNodeData.Description, Path.GetFileName(item2.LabwareNodeData.FilePath), item2.LabwareNodeData.FilePathVectorRelative));
				}
			}
		}
		return list;
	}

	private void ApplyFilterToAllNodes(bool filter)
	{
		foreach (TreeNode child in _categorizedTitleNode.Children)
		{
			child.IsFiltered = filter;
		}
	}

	private void DisableFilteringForUncategorizedLabwareNodes()
	{
		if (_uncategorizedTitleNode == null || _uncategorizedTitleNode.Children == null)
		{
			return;
		}
		foreach (TreeNode child in _uncategorizedTitleNode.Children)
		{
			child.FilteringAllowed = false;
		}
	}

	private void ExpandRecursive(TreeNode treeNode)
	{
		treeNode.IsExpanded = true;
		if (treeNode.Children == null)
		{
			return;
		}
		foreach (TreeNode child in treeNode.Children)
		{
			ExpandRecursive(child);
		}
	}

	private void CollapseRecursive(TreeNode treeNode)
	{
		treeNode.IsExpanded = false;
		if (treeNode.Children == null)
		{
			return;
		}
		foreach (TreeNode child in treeNode.Children)
		{
			CollapseRecursive(child);
		}
	}

	private void SubscribeToAllTreeNodeChanges()
	{
		if (_categoryLabwareTreeData == null)
		{
			return;
		}
		foreach (TreeNode categoryLabwareTreeDatum in _categoryLabwareTreeData)
		{
			SubscribeToTreeNodeChangesRecursive(categoryLabwareTreeDatum);
		}
	}

	private void SubscribeToTreeNodeChangesRecursive(TreeNode treeNode)
	{
		if (treeNode == null)
		{
			return;
		}
		((ObservableObject)treeNode).PropertyChanged += TreeNodePropertyChanged;
		_changeSubscribedNodes.Add(treeNode);
		if (treeNode.Children == null)
		{
			return;
		}
		foreach (TreeNode child in treeNode.Children)
		{
			SubscribeToTreeNodeChangesRecursive(child);
		}
	}

	private void SubscribeToTreeNodeChanges(TreeNode treeNode)
	{
		if (treeNode != null)
		{
			((ObservableObject)treeNode).PropertyChanged += TreeNodePropertyChanged;
			_changeSubscribedNodes.Add(treeNode);
		}
	}

	private void UnsubscribeFromTreeNodeChangesRecursive(TreeNode treeNode)
	{
		if (treeNode == null || !_changeSubscribedNodes.Contains(treeNode))
		{
			return;
		}
		((ObservableObject)treeNode).PropertyChanged -= TreeNodePropertyChanged;
		_changeSubscribedNodes.Remove(treeNode);
		if (treeNode.Children == null)
		{
			return;
		}
		foreach (TreeNode child in treeNode.Children)
		{
			UnsubscribeFromTreeNodeChangesRecursive(child);
		}
	}

	private void UnsubscribeFromAllTreeNodeChanges()
	{
		if (_changeSubscribedNodes == null)
		{
			return;
		}
		foreach (TreeNode changeSubscribedNode in _changeSubscribedNodes)
		{
			((ObservableObject)changeSubscribedNode).PropertyChanged -= TreeNodePropertyChanged;
		}
		_changeSubscribedNodes.Clear();
	}

	private void ResetAllFlags()
	{
		CategoriesDirty = false;
		FilterDirty = false;
		_categoryDeleted = false;
		_updatingFiltering = false;
	}

	private void TunnelFilteringUpdates(TreeNode treeNode)
	{
		if (treeNode.Children == null)
		{
			return;
		}
		foreach (TreeNode child in treeNode.Children)
		{
			child.IsFiltered = treeNode.IsFiltered;
			TunnelFilteringUpdates(child);
		}
	}

	private void BubbleFilteringUpdates(TreeNode parentTreeNode)
	{
		if (parentTreeNode is CategoryNode)
		{
			bool num = AllChildrenFiltered(parentTreeNode);
			bool flag = AllChildrenNotFiltered(parentTreeNode);
			if (num)
			{
				parentTreeNode.IsFiltered = true;
			}
			else if (flag)
			{
				parentTreeNode.IsFiltered = false;
			}
			else
			{
				parentTreeNode.IsFiltered = null;
			}
			BubbleFilteringUpdates(parentTreeNode.Parent);
		}
	}

	private bool AllChildrenFiltered(TreeNode treeNode)
	{
		foreach (TreeNode child in treeNode.Children)
		{
			if (child.IsFiltered == false || !child.IsFiltered.HasValue)
			{
				return false;
			}
		}
		return true;
	}

	private bool AllChildrenNotFiltered(TreeNode treeNode)
	{
		foreach (TreeNode child in treeNode.Children)
		{
			if (child.IsFiltered == true || !child.IsFiltered.HasValue)
			{
				return false;
			}
		}
		return true;
	}

	private void SetDisplayTreeSearchFilter()
	{
		if (_categoryLabwareTreeData != null)
		{
			CollectionViewSource.GetDefaultView(_categoryLabwareTreeData).Filter = TreeNodeSearchFilterRecursive;
			SetDisplayTreeSearchFilterRecursive(_categoryLabwareTreeData);
		}
	}

	private void SetDisplayTreeSearchFilter(TreeNode treeNode)
	{
		if (treeNode != null && treeNode.Children != null)
		{
			treeNode.ChildrenDefaultCollectionViewSource.Filter = TreeNodeSearchFilterRecursive;
		}
	}

	private void SetDisplayTreeSearchFilterRecursive(ObservableCollection<TreeNode> treeNodes)
	{
		foreach (TreeNode treeNode in treeNodes)
		{
			if (treeNode.Children != null)
			{
				treeNode.ChildrenDefaultCollectionViewSource.Filter = TreeNodeSearchFilterRecursive;
				SetDisplayTreeSearchFilterRecursive(treeNode.Children);
			}
		}
	}

	private void UnselectSelectedTreeNode()
	{
		if (_selectedTreeNode != null)
		{
			_selectedTreeNode.IsSelected = false;
			SelectedTreeNode = null;
		}
	}

	private bool TreeNodeSearchFilterRecursive(object obj)
	{
		if (obj == null || !(obj is TreeNode))
		{
			return false;
		}
		TreeNode treeNode = obj as TreeNode;
		if (treeNode.ViewName.IndexOf(_displayTreeSearchFilterTerm, StringComparison.InvariantCultureIgnoreCase) >= 0)
		{
			return true;
		}
		if (treeNode.Children != null)
		{
			foreach (TreeNode child in treeNode.Children)
			{
				if (TreeNodeSearchFilterRecursive(child))
				{
					return true;
				}
			}
		}
		return false;
	}

	private void RefreshAllTreeNodesSearchFilters()
	{
		CollectionViewSource.GetDefaultView(_categoryLabwareTreeData).Refresh();
		RefreshAllTreeNodesSearchFiltersRecursive(_categoryLabwareTreeData);
	}

	private void RefreshAllTreeNodesSearchFiltersRecursive(ObservableCollection<TreeNode> treeNodes)
	{
		foreach (TreeNode treeNode in treeNodes)
		{
			if (treeNode.ChildrenDefaultCollectionViewSource != null)
			{
				treeNode.ChildrenDefaultCollectionViewSource.Refresh();
			}
			if (treeNode.Children != null)
			{
				RefreshAllTreeNodesSearchFiltersRecursive(treeNode.Children);
			}
		}
	}

	private bool RefreshIndexFile(bool replaceFilterFileOnly = false)
	{
		if (_filteringEnabled)
		{
			if (replaceFilterFileOnly)
			{
				return FilterIndexFileHelper.ReplaceIndexFileWithFilterFile(_selectedFilter);
			}
			return FilterIndexFileHelper.SaveFilterAndReplaceIndexFile(_selectedFilter, _filterData[_selectedFilter]);
		}
		return FilterIndexFileHelper.GenerateLabwareIndexFile(_indexFileData);
	}

	private void ShadowWhileLoading()
	{
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ShadowLoadingApplication");
		Application.Current.Dispatcher.BeginInvoke((Action)delegate
		{
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnshadowApplication");
		}, DispatcherPriority.Background, null);
	}

	private string GetLabwareIcon(string labwareFilePath)
	{
		if (string.IsNullOrEmpty(labwareFilePath))
		{
			return null;
		}
		string extension = Path.GetExtension(labwareFilePath);
		if (string.IsNullOrEmpty(extension))
		{
			return null;
		}
		return extension switch
		{
			".tml" => "/Images/Labware_tml.ico", 
			".rck" => "/Images/Labware_rck.ico", 
			".crk" => "/Images/Labware_crk.ico", 
			".ctr" => "/Images/Labware_ctr.ico", 
			_ => null, 
		};
	}
}
