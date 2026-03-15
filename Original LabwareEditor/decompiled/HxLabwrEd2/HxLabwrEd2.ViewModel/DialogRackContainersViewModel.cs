using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq.Expressions;
using System.Windows.Data;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.DialogWindows;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class DialogRackContainersViewModel : DialogViewModelBase
{
	private Rack rackPartialDuplicate;

	private Rack loadedRack;

	private RackWell selectedRackWell;

	private CollectionViewSource rackWellCollectionViewSource;

	private RackWell multiSelectRackWell;

	private bool updatingSelected;

	private IList selectedRackWells;

	private string selectedWellLabels;

	private static string noWellSelection = "No well(s) selected!";

	public CollectionViewSource RackWellCollectionViewSource
	{
		get
		{
			return rackWellCollectionViewSource;
		}
		set
		{
			((ObservableObject)this).Set<CollectionViewSource>((Expression<Func<CollectionViewSource>>)(() => RackWellCollectionViewSource), ref rackWellCollectionViewSource, value);
		}
	}

	public Rack RackPartialDuplicate
	{
		get
		{
			return rackPartialDuplicate;
		}
		set
		{
			((ObservableObject)this).Set<Rack>((Expression<Func<Rack>>)(() => RackPartialDuplicate), ref rackPartialDuplicate, value);
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
			if (selectedRackWell != null)
			{
				((ObservableObject)selectedRackWell).PropertyChanged -= SelectedRackWellPropertyChanged;
			}
			((ObservableObject)this).Set<RackWell>((Expression<Func<RackWell>>)(() => SelectedRackWell), ref selectedRackWell, value);
			if (selectedRackWell != null)
			{
				((ObservableObject)selectedRackWell).PropertyChanged += SelectedRackWellPropertyChanged;
			}
		}
	}

	public RackWell MultiSelectRackWell
	{
		get
		{
			return multiSelectRackWell;
		}
		set
		{
			if (multiSelectRackWell != null)
			{
				((ObservableObject)multiSelectRackWell).PropertyChanged -= MultiSelectRackWellPropertyChanged;
			}
			((ObservableObject)this).Set<RackWell>((Expression<Func<RackWell>>)(() => MultiSelectRackWell), ref multiSelectRackWell, value);
			if (multiSelectRackWell != null)
			{
				((ObservableObject)multiSelectRackWell).PropertyChanged += MultiSelectRackWellPropertyChanged;
			}
		}
	}

	public string SelectedWellLabels
	{
		get
		{
			return selectedWellLabels;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => SelectedWellLabels), ref selectedWellLabels, value);
		}
	}

	public RelayCommand<object> UpdateSelected { get; }

	public RelayCommand FilePath { get; }

	public RelayCommand ApplyToSelected { get; }

	public DialogRackContainersViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		//IL_0079: Unknown result type (might be due to invalid IL or missing references)
		//IL_0083: Expected O, but got Unknown
		//IL_0091: Unknown result type (might be due to invalid IL or missing references)
		//IL_009b: Expected O, but got Unknown
		base.CancelCloseButton = new RelayCommand((Action)ExecuteCancelCloseButton, false);
		base.SaveButton = new RelayCommand((Action)ExecuteSaveButton, false);
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"DialogRackContainersSetup", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			SetupLoadedLabware(msg.Content);
		}, false);
		UpdateSelected = new RelayCommand<object>((Action<object>)ExecuteUpdateSelected, false);
		FilePath = new RelayCommand((Action)ExecuteFilePath, false);
		ApplyToSelected = new RelayCommand((Action)ExecuteApplyToSelected, false);
		MultiSelectRackWell = new RackWell();
		SelectedWellLabels = noWellSelection;
	}

	~DialogRackContainersViewModel()
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
		loadedRack = (Rack)loadedLabware;
		RackPartialDuplicate = new Rack
		{
			ReadOnly = loadedRack.ReadOnly
		};
		foreach (RackWell rackWell in loadedRack.RackWells)
		{
			RackPartialDuplicate.RackWells.Add(new RackWell(rackWell));
		}
		RackPartialDuplicate.DataChanged = false;
		RackWellCollectionViewSource = new CollectionViewSource
		{
			Source = RackPartialDuplicate.RackWells
		};
		rackWellCollectionViewSource.SortDescriptions.Add(new SortDescription("Label", ListSortDirection.Ascending));
		((ListCollectionView)RackWellCollectionViewSource.View).CustomSort = new RackWellLabelSorter();
	}

	private void SelectedRackWellPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "ContainerFilePath" && !updatingSelected)
		{
			RackHelper.UpdateSingleRackWellContainerRelativePath(selectedRackWell, loadedRack.LabwareFileFullPath);
		}
	}

	private void MultiSelectRackWellPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "ContainerFilePath")
		{
			RackHelper.UpdateSingleRackWellContainerRelativePath(multiSelectRackWell, loadedRack.LabwareFileFullPath);
		}
	}

	private void ExecuteUpdateSelected(object dataGridSelectedRackWells)
	{
		if (updatingSelected)
		{
			return;
		}
		selectedRackWells = new List<RackWell>();
		List<string> list = new List<string>();
		foreach (RackWell item in dataGridSelectedRackWells as IList)
		{
			selectedRackWells.Add(item);
			list.Add(item.Label);
		}
		list.Sort(new MultiSelectionSorter());
		SelectedWellLabels = "Selected well(s): " + string.Join(", ", list);
		ApplyToSelected.RaiseCanExecuteChanged();
	}

	private void ExecuteApplyToSelected()
	{
		if (selectedRackWell == null || selectedRackWells == null || selectedRackWells.Count <= 0)
		{
			return;
		}
		updatingSelected = true;
		foreach (RackWell selectedRackWell in selectedRackWells)
		{
			selectedRackWell.ContainerFilePath = multiSelectRackWell.ContainerFilePath;
			selectedRackWell.ContainerRelativeFilePath = multiSelectRackWell.ContainerRelativeFilePath;
			selectedRackWell.ContainerOffsets.X = multiSelectRackWell.ContainerOffsets.X;
			selectedRackWell.ContainerOffsets.Y = multiSelectRackWell.ContainerOffsets.Y;
			selectedRackWell.ContainerOffsets.Z = multiSelectRackWell.ContainerOffsets.Z;
		}
		SelectedRackWell = rackPartialDuplicate.RackWells[0];
		SelectedRackWell = null;
		updatingSelected = false;
		SelectedWellLabels = noWellSelection;
		ApplyToSelected.RaiseCanExecuteChanged();
	}

	private void ExecuteFilePath()
	{
		DragDropFileLoadHelper.OpenFileDlgReference = new OpenFileDialog
		{
			Filter = "Container|*.ctr",
			InitialDirectory = HxRegHelper.LabwarePath
		};
		bool? flag = DragDropFileLoadHelper.OpenFileDlgReference.ShowDialog();
		string fileName = DragDropFileLoadHelper.OpenFileDlgReference.FileName;
		DragDropFileLoadHelper.OpenFileDlgReference = null;
		if (flag == true)
		{
			multiSelectRackWell.ContainerFilePath = fileName;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"MultiSelectRackWellPathScroll");
			RackHelper.UpdateSingleRackWellContainerRelativePath(multiSelectRackWell, loadedRack.LabwareFileFullPath);
		}
	}

	private void ExecuteCancelCloseButton()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: false);
		InvokeRequestCloseDialog(e);
		CleanupReferences();
	}

	private void ExecuteSaveButton()
	{
		loadedRack.RackWells = new TrulyObservableCollection<RackWell>();
		foreach (RackWell rackWell in RackPartialDuplicate.RackWells)
		{
			loadedRack.RackWells.Add(rackWell);
		}
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
		CleanupReferences();
	}

	private void CleanupReferences()
	{
		loadedRack = null;
		RackPartialDuplicate = null;
		SelectedRackWell = null;
		MultiSelectRackWell = new RackWell();
		selectedWellLabels = noWellSelection;
	}
}
