using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.CommandWpf;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public abstract class CreationViewModelBase : ViewModelBase
{
	protected const string ContinueText = "Continue";

	protected const string SaveText = "Save";

	protected ViewModelBase labware2DViewDisplayVM;

	protected ViewModelBase subVM;

	protected string rightButtonContent;

	protected string subVMTitleBarContent;

	protected bool canContinue;

	protected bool showContinueTip;

	protected bool saveAllowed;

	protected bool showSecurityTip;

	protected bool lockVisuals;

	public ViewModelBase Labware2DViewDisplayVM
	{
		get
		{
			return labware2DViewDisplayVM;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => Labware2DViewDisplayVM), ref labware2DViewDisplayVM, value);
		}
	}

	public ViewModelBase SubVM
	{
		get
		{
			return subVM;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => SubVM), ref subVM, value);
		}
	}

	public string RightButtonContent
	{
		get
		{
			return rightButtonContent;
		}
		set
		{
			if (((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => RightButtonContent), ref rightButtonContent, value))
			{
				UpdateShowSecurityTip();
			}
		}
	}

	public string SubVMTitleBarContent
	{
		get
		{
			return subVMTitleBarContent;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => SubVMTitleBarContent), ref subVMTitleBarContent, value);
		}
	}

	public bool ShowContinueTip
	{
		get
		{
			return showContinueTip;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ShowContinueTip), ref showContinueTip, value);
		}
	}

	public bool SaveAllowed
	{
		get
		{
			return saveAllowed;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => SaveAllowed), ref saveAllowed, value);
			RelayCommand rightButtonCommand = RightButtonCommand;
			if (rightButtonCommand != null)
			{
				rightButtonCommand.RaiseCanExecuteChanged();
			}
		}
	}

	public bool ShowSecurityTip
	{
		get
		{
			return showSecurityTip;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ShowSecurityTip), ref showSecurityTip, value);
		}
	}

	public bool LockVisuals
	{
		get
		{
			return lockVisuals;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => LockVisuals), ref lockVisuals, value);
		}
	}

	public RelayCommand LeftButtonCommand { get; protected set; }

	public RelayCommand RightButtonCommand { get; protected set; }

	public RelayCommand GenerateVisuals { get; protected set; }

	public RelayCommand CleanUpVisuals { get; protected set; }

	public virtual void UpdateShowSecurityTip()
	{
		if (HxRegHelper.FunctionProtection)
		{
			if (RightButtonContent == "Save" && (HxSecurityComHelper.CurrentAccessRight == AccessRight.Operator || HxSecurityComHelper.CurrentAccessRight == AccessRight.Operator2))
			{
				ShowSecurityTip = true;
			}
			else
			{
				ShowSecurityTip = false;
			}
		}
		else
		{
			ShowSecurityTip = false;
		}
	}

	public virtual void SubscribeToAllNeededPropertyChangedEvents()
	{
	}

	public virtual void UnsubscribeToAllNeededPropertyChangedEvents()
	{
	}
}
