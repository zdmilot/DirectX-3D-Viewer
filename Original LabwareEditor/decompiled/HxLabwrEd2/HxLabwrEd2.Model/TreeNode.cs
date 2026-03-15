using System;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Linq.Expressions;
using System.Windows.Data;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public abstract class TreeNode : ObservableObject
{
	private string _viewName;

	private ObservableCollection<TreeNode> _children;

	private bool? _isFiltered;

	private bool _isSelected;

	private bool _isExpanded;

	private bool _isBeingEdited;

	private string _icon;

	public bool ChildrenAllowed { get; }

	public bool DragDropAllowed { get; }

	public bool FilteringAllowed { get; set; }

	public TreeNode Parent { get; private set; }

	public ICollectionView ChildrenDefaultCollectionViewSource { get; set; }

	public string ViewName
	{
		get
		{
			return _viewName;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => ViewName), ref _viewName, value);
		}
	}

	public ObservableCollection<TreeNode> Children
	{
		get
		{
			return _children;
		}
		set
		{
			if (!ChildrenAllowed)
			{
				throw new Exception(((object)this).GetType().Name + " objects cannot have children!");
			}
			if (Children != null && Children != value)
			{
				Children.CollectionChanged -= Children_CollectionChanged;
				ChildrenDefaultCollectionViewSource = null;
			}
			if (((ObservableObject)this).Set<ObservableCollection<TreeNode>>((Expression<Func<ObservableCollection<TreeNode>>>)(() => Children), ref _children, value) && value != null)
			{
				Children.CollectionChanged += Children_CollectionChanged;
				ChildrenDefaultCollectionViewSource = CollectionViewSource.GetDefaultView(_children);
			}
		}
	}

	public bool? IsFiltered
	{
		get
		{
			return _isFiltered;
		}
		set
		{
			((ObservableObject)this).Set<bool?>((Expression<Func<bool?>>)(() => IsFiltered), ref _isFiltered, value);
		}
	}

	public bool IsSelected
	{
		get
		{
			return _isSelected;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => IsSelected), ref _isSelected, value);
		}
	}

	public bool IsExpanded
	{
		get
		{
			return _isExpanded;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => IsExpanded), ref _isExpanded, value);
		}
	}

	public bool IsBeingEdited
	{
		get
		{
			return _isBeingEdited;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => IsBeingEdited), ref _isBeingEdited, value);
		}
	}

	public string Icon
	{
		get
		{
			return _icon;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Icon), ref _icon, value);
		}
	}

	private void Children_CollectionChanged(object sender, NotifyCollectionChangedEventArgs e)
	{
		if (e.Action == NotifyCollectionChangedAction.Add && e.NewItems != null)
		{
			foreach (TreeNode newItem in e.NewItems)
			{
				newItem.Parent = this;
				if (newItem is CategoryNode && this is CategoryNode)
				{
					(newItem as CategoryNode).ParentCategoryId = (this as CategoryNode).Id;
				}
			}
			((ObservableObject)this).RaisePropertyChanged("Children.Add");
		}
		else
		{
			if (e.Action != NotifyCollectionChangedAction.Remove || e.OldItems == null)
			{
				return;
			}
			foreach (TreeNode oldItem in e.OldItems)
			{
				oldItem.Parent = null;
				if (oldItem is CategoryNode)
				{
					(oldItem as CategoryNode).ParentCategoryId = 0;
				}
			}
			((ObservableObject)this).RaisePropertyChanged("Children.Remove");
		}
	}

	public TreeNode(bool childrenAllowed = false, bool dragDropAllowed = false, bool filteringAllowed = false, string icon = "")
	{
		ChildrenAllowed = childrenAllowed;
		DragDropAllowed = dragDropAllowed;
		FilteringAllowed = filteringAllowed;
		Icon = icon;
		IsFiltered = true;
		if (ChildrenAllowed)
		{
			Children = new ObservableCollection<TreeNode>();
		}
	}
}
