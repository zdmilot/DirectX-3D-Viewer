using System;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Linq.Expressions;
using System.Windows;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using GongSolutions.Wpf.DragDrop;
using HxLabwrEd2.DialogWindows;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.ViewModel;

public class DialogRackIrregularPatternViewModel : DialogViewModelBase, IDropTarget
{
	private RectangularRack rectangularRackPartialDuplicate;

	private RectangularRack loadedRectangularRack;

	private RackWell selectedRackWell;

	public RectangularRack RectangularRackPartialDuplicate
	{
		get
		{
			return rectangularRackPartialDuplicate;
		}
		set
		{
			if (rectangularRackPartialDuplicate != null)
			{
				((ObservableObject)rectangularRackPartialDuplicate).PropertyChanged -= RectangularRackPartialDuplicate_PropertyChanged;
				if (rectangularRackPartialDuplicate.RackWells != null)
				{
					rectangularRackPartialDuplicate.RackWells.CollectionChanged -= RackWells_CollectionChanged;
				}
			}
			((ObservableObject)this).Set<RectangularRack>((Expression<Func<RectangularRack>>)(() => RectangularRackPartialDuplicate), ref rectangularRackPartialDuplicate, value);
			if (rectangularRackPartialDuplicate != null)
			{
				((ObservableObject)rectangularRackPartialDuplicate).PropertyChanged += RectangularRackPartialDuplicate_PropertyChanged;
				if (rectangularRackPartialDuplicate.RackWells != null)
				{
					rectangularRackPartialDuplicate.RackWells.CollectionChanged += RackWells_CollectionChanged;
				}
			}
		}
	}

	public RackWell SelectedRackWell
	{
		get
		{
			return selectedRackWell;
		}
		set
		{
			((ObservableObject)this).Set<RackWell>((Expression<Func<RackWell>>)(() => SelectedRackWell), ref selectedRackWell, value);
		}
	}

	public RelayCommand AddWell { get; }

	public RelayCommand RemoveWell { get; }

	public DialogRackIrregularPatternViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_0038: Unknown result type (might be due to invalid IL or missing references)
		//IL_0042: Expected O, but got Unknown
		//IL_006d: Unknown result type (might be due to invalid IL or missing references)
		//IL_0077: Expected O, but got Unknown
		//IL_0085: Unknown result type (might be due to invalid IL or missing references)
		//IL_008f: Expected O, but got Unknown
		base.CancelCloseButton = new RelayCommand((Action)ExecuteCancelCloseButton, false);
		base.SaveButton = new RelayCommand((Action)ExecuteSaveButton, (Func<bool>)CanExecuteSaveButton, false);
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"DialogRackIrregularPatternSetup", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			SetupLoadedLabware(msg.Content);
		}, false);
		AddWell = new RelayCommand((Action)ExecuteAddWell, false);
		RemoveWell = new RelayCommand((Action)ExecuteRemoveWell, false);
	}

	~DialogRackIrregularPatternViewModel()
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

	private void SetupLoadedLabware(Labware loadedLabware)
	{
		loadedRectangularRack = loadedLabware as RectangularRack;
		RectangularRackPartialDuplicate = new RectangularRack();
		RectangularRackPartialDuplicate.ReadOnly = loadedRectangularRack.ReadOnly;
		RectangularRackPartialDuplicate.IrregularRackBoundaryOffsets = new Offsets(loadedRectangularRack.IrregularRackBoundaryOffsets);
		foreach (RackWell rackWell in loadedRectangularRack.RackWells)
		{
			RectangularRackPartialDuplicate.RackWells.Add(new RackWell(rackWell));
		}
		if (RectangularRackPartialDuplicate.RackWells.Count > 0)
		{
			SelectedRackWell = RectangularRackPartialDuplicate.RackWells[0];
		}
		RectangularRackPartialDuplicate.DataChanged = false;
	}

	private void ExecuteAddWell()
	{
		RackWell item = new RackWell(RackWell.FindNextDefaultLabel(RectangularRackPartialDuplicate.RackWells));
		RectangularRackPartialDuplicate.RackWells.Add(item);
		SelectedRackWell = item;
		base.SaveButton.RaiseCanExecuteChanged();
	}

	private void ExecuteRemoveWell()
	{
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_003b: Expected O, but got Unknown
		RectangularRackPartialDuplicate.RackWells.Remove(SelectedRackWell);
		base.SaveButton.RaiseCanExecuteChanged();
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"RefreshWellGrid");
	}

	public void Drop(IDropInfo dropInfo)
	{
		RackWell rackWell = dropInfo.Data as RackWell;
		int num = rectangularRackPartialDuplicate.RackWells.IndexOf(rackWell);
		if (dropInfo.InsertIndex == num || dropInfo.InsertIndex - 1 == num)
		{
			return;
		}
		if (dropInfo.InsertIndex > num)
		{
			rectangularRackPartialDuplicate.RackWells.Move(num, dropInfo.InsertIndex - 1);
			if (rectangularRackPartialDuplicate.RackWells[0].CenterX != 0.0)
			{
				rectangularRackPartialDuplicate.RackWells[0].CenterX = 0.0;
			}
			if (rectangularRackPartialDuplicate.RackWells[0].CenterY != 0.0)
			{
				rectangularRackPartialDuplicate.RackWells[0].CenterY = 0.0;
			}
		}
		else
		{
			rectangularRackPartialDuplicate.RackWells.Move(num, dropInfo.InsertIndex);
			if (dropInfo.InsertIndex == 0)
			{
				rackWell.CenterX = 0.0;
				rackWell.CenterY = 0.0;
			}
		}
	}

	public void DragOver(IDropInfo dropInfo)
	{
		dropInfo.Effects = DragDropEffects.Move;
		dropInfo.DropTargetAdorner = DropTargetAdorners.Insert;
	}

	private void ExecuteCancelCloseButton()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: false);
		InvokeRequestCloseDialog(e);
		CleanupReferences();
	}

	private bool CanExecuteSaveButton()
	{
		if (rectangularRackPartialDuplicate != null && rectangularRackPartialDuplicate.DataChanged && rectangularRackPartialDuplicate.RackWells != null && rectangularRackPartialDuplicate.RackWells.Count > 0)
		{
			return true;
		}
		return false;
	}

	private void RectangularRackPartialDuplicate_PropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		base.SaveButton.RaiseCanExecuteChanged();
	}

	private void RackWells_CollectionChanged(object sender, NotifyCollectionChangedEventArgs e)
	{
		if (e.Action == NotifyCollectionChangedAction.Remove && rectangularRackPartialDuplicate.RackWells.Count > 0)
		{
			if (rectangularRackPartialDuplicate.RackWells[0].CenterX != 0.0)
			{
				rectangularRackPartialDuplicate.RackWells[0].CenterX = 0.0;
			}
			if (rectangularRackPartialDuplicate.RackWells[0].CenterY != 0.0)
			{
				rectangularRackPartialDuplicate.RackWells[0].CenterY = 0.0;
			}
		}
		base.SaveButton.RaiseCanExecuteChanged();
	}

	private void ExecuteSaveButton()
	{
		loadedRectangularRack.RackWells = new TrulyObservableCollection<RackWell>();
		foreach (RackWell rackWell in RectangularRackPartialDuplicate.RackWells)
		{
			loadedRectangularRack.RackWells.Add(rackWell);
		}
		loadedRectangularRack.IrregularRackBoundaryOffsets = new Offsets(RectangularRackPartialDuplicate.IrregularRackBoundaryOffsets);
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
		CleanupReferences();
	}

	private void CleanupReferences()
	{
		loadedRectangularRack = null;
		RectangularRackPartialDuplicate = null;
	}
}
