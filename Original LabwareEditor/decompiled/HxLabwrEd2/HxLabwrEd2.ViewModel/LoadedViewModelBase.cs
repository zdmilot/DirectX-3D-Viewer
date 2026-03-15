using System;
using System.Linq.Expressions;
using System.Windows;
using System.Windows.Threading;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using GongSolutions.Wpf.DragDrop;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public abstract class LoadedViewModelBase : ViewModelBase, IDropTarget
{
	protected bool saveAndValidationAllowed;

	protected bool validateButtonVisible;

	protected bool viewHistoryButtonVisible;

	protected bool lockVisuals;

	protected bool displayGroupAndPrivilageWarning;

	public bool SaveAndValidationAllowed
	{
		get
		{
			return saveAndValidationAllowed;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => SaveAndValidationAllowed), ref saveAndValidationAllowed, value);
		}
	}

	public bool ValidateButtonVisible
	{
		get
		{
			return validateButtonVisible;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ValidateButtonVisible), ref validateButtonVisible, value);
		}
	}

	public bool ViewHistoryButtonVisible
	{
		get
		{
			return viewHistoryButtonVisible;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ViewHistoryButtonVisible), ref viewHistoryButtonVisible, value);
		}
	}

	public bool DisplayGroupAndPrivilageWarning
	{
		get
		{
			return displayGroupAndPrivilageWarning;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => DisplayGroupAndPrivilageWarning), ref displayGroupAndPrivilageWarning, value);
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

	public Labware LoadedLabware { get; set; }

	protected bool ViewLoaded { get; set; }

	public RelayCommand GenerateVisuals { get; protected set; }

	public RelayCommand CleanUpVisuals { get; protected set; }

	public RelayCommand NavToTitlePageVM { get; protected set; }

	public RelayCommand SaveAs { get; protected set; }

	public RelayCommand Save { get; protected set; }

	public RelayCommand Validate { get; protected set; }

	public RelayCommand ViewHistory { get; protected set; }

	protected LoadedViewModelBase()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		ViewHistory = new RelayCommand((Action)ExecuteViewHistory, false);
		CleanUpVisuals = new RelayCommand((Action)ExecuteCleanUpVisuals, false);
	}

	protected abstract void CleanVisuals();

	protected void DisplayBoundaryCorrectionWarning()
	{
		Application.Current.Dispatcher.BeginInvoke((Action)delegate
		{
			LoadedLabware.DataChanged = true;
			DialogWindowHelper.ShowDialogWithProportionalDimensions("Missing Boundary Warning", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), "The loaded rack did not define a boundary. A boundary has been added. Adjust/correct any newly-added boundary values as necessary.", 0.4, 0.25);
		}, DispatcherPriority.Background, null);
	}

	protected void ExecuteViewHistory()
	{
		if (LoadedLabware != null && HxRegHelper.UseAuditTrail != AuditTrail.AuditTrailDisabled)
		{
			HxAuditTrailHelper.ShowAuditTrail(LoadedLabware.LabwareFileFullPath);
		}
	}

	protected void ExecuteCleanUpVisuals()
	{
		ViewLoaded = false;
		CleanVisuals();
	}

	public void DragOver(IDropInfo dropInfo)
	{
		if (DragDropFileLoadHelper.OpenFileDlgReference == null)
		{
			DragDropFileLoadHelper.DragOver(dropInfo);
		}
	}

	public void Drop(IDropInfo dropInfo)
	{
		if (DragDropFileLoadHelper.OpenFileDlgReference == null && (dropInfo.Data as DataObject).ContainsFileDropList() && DragDropFileLoadHelper.TryGetFirstValidFileName(dropInfo.Data as DataObject, out var firstValidFileName) && (!LoadedLabware.DataChanged || LoadedLabware.ReadOnly || DialogWindowHelper.ShowDialogWithProportionalDimensions("Confirmation", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogUnsavedChangesViewModel>(), UnsavedChangesDialogExitText.PageExit, 0.4, 0.2) != false))
		{
			Messenger.Default.Send<GenericMessage<string>>(new GenericMessage<string>(firstValidFileName), (object)"LoadDraggedInLabwareFile");
		}
	}
}
