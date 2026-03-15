using System;
using System.Collections.Specialized;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.DialogWindows;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.ViewModel;

public class DialogRackGripSegmentsViewModel : DialogViewModelBase
{
	private RectangularRack loadedRectangularRack;

	private bool areListsDirty;

	private bool isReadOnly;

	private TrulyObservableCollection<GripSegment> gripSegmentsXUI;

	private TrulyObservableCollection<GripSegment> gripSegmentsYUI;

	public TrulyObservableCollection<GripSegment> GripSegmentsXUI
	{
		get
		{
			return gripSegmentsXUI;
		}
		set
		{
			if (gripSegmentsXUI != null)
			{
				gripSegmentsXUI.CollectionChanged -= ContainerSegmentsUICollectionChanged;
			}
			((ObservableObject)this).Set<TrulyObservableCollection<GripSegment>>((Expression<Func<TrulyObservableCollection<GripSegment>>>)(() => GripSegmentsXUI), ref gripSegmentsXUI, value);
			if (gripSegmentsXUI != null)
			{
				gripSegmentsXUI.CollectionChanged += ContainerSegmentsUICollectionChanged;
			}
		}
	}

	public TrulyObservableCollection<GripSegment> GripSegmentsYUI
	{
		get
		{
			return gripSegmentsYUI;
		}
		set
		{
			if (gripSegmentsYUI != null)
			{
				gripSegmentsYUI.CollectionChanged -= ContainerSegmentsUICollectionChanged;
			}
			((ObservableObject)this).Set<TrulyObservableCollection<GripSegment>>((Expression<Func<TrulyObservableCollection<GripSegment>>>)(() => GripSegmentsYUI), ref gripSegmentsYUI, value);
			if (gripSegmentsYUI != null)
			{
				gripSegmentsYUI.CollectionChanged += ContainerSegmentsUICollectionChanged;
			}
		}
	}

	public bool AreListsDirty
	{
		get
		{
			return areListsDirty;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => AreListsDirty), ref areListsDirty, value);
		}
	}

	public bool IsReadOnly
	{
		get
		{
			return isReadOnly;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => IsReadOnly), ref isReadOnly, value);
		}
	}

	public RelayCommand AddGripSegmentX { get; }

	public RelayCommand AddGripSegmentY { get; }

	public RelayCommand<GripSegment> DeleteGripSegment { get; }

	public DialogRackGripSegmentsViewModel()
	{
		//IL_0031: Unknown result type (might be due to invalid IL or missing references)
		//IL_003b: Expected O, but got Unknown
		//IL_0049: Unknown result type (might be due to invalid IL or missing references)
		//IL_0053: Expected O, but got Unknown
		//IL_0061: Unknown result type (might be due to invalid IL or missing references)
		//IL_006b: Expected O, but got Unknown
		//IL_0079: Unknown result type (might be due to invalid IL or missing references)
		//IL_0083: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"DialogRackGripSegmentsSetup", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			SetupLoadedLabware(msg.Content);
		}, false);
		base.CancelCloseButton = new RelayCommand((Action)ExecuteCancelCloseButton, false);
		base.SaveButton = new RelayCommand((Action)ExecuteSaveButton, false);
		AddGripSegmentX = new RelayCommand((Action)ExecuteAddGripSegmentX, false);
		AddGripSegmentY = new RelayCommand((Action)ExecuteAddGripSegmentY, false);
		DeleteGripSegment = new RelayCommand<GripSegment>((Action<GripSegment>)delegate(GripSegment gripSegment)
		{
			ExecuteDeleteGripSegment(gripSegment);
		}, false);
	}

	~DialogRackGripSegmentsViewModel()
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
		GripSegmentsXUI = new TrulyObservableCollection<GripSegment>();
		GripSegmentsYUI = new TrulyObservableCollection<GripSegment>();
		if (loadedLabware is RectangularRack)
		{
			loadedRectangularRack = loadedLabware as RectangularRack;
			foreach (GripSegment item in loadedRectangularRack.GripSegmentsX)
			{
				GripSegmentsXUI.Add(new GripSegment(item));
			}
			foreach (GripSegment item2 in loadedRectangularRack.GripSegmentsY)
			{
				GripSegmentsYUI.Add(new GripSegment(item2));
			}
			IsReadOnly = loadedRectangularRack.ReadOnly;
		}
		AreListsDirty = false;
	}

	private void ExecuteCancelCloseButton()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: false);
		InvokeRequestCloseDialog(e);
		CleanupReferences();
	}

	private void ExecuteSaveButton()
	{
		if (loadedRectangularRack != null)
		{
			loadedRectangularRack.GripSegmentsX = new TrulyObservableCollection<GripSegment>();
			loadedRectangularRack.GripSegmentsY = new TrulyObservableCollection<GripSegment>();
			foreach (GripSegment item in gripSegmentsXUI)
			{
				loadedRectangularRack.GripSegmentsX.Add(item);
			}
			foreach (GripSegment item2 in gripSegmentsYUI)
			{
				loadedRectangularRack.GripSegmentsY.Add(item2);
			}
		}
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
		CleanupReferences();
	}

	private void ContainerSegmentsUICollectionChanged(object sender, NotifyCollectionChangedEventArgs e)
	{
		AreListsDirty = true;
		base.SaveButton.RaiseCanExecuteChanged();
		((ObservableObject)this).RaisePropertyChanged((string)null);
	}

	private void ExecuteAddGripSegmentX()
	{
		GripSegmentsXUI.Add(new GripSegment());
	}

	private void ExecuteAddGripSegmentY()
	{
		GripSegmentsYUI.Add(new GripSegment());
	}

	private void ExecuteDeleteGripSegment(GripSegment segment)
	{
		if (gripSegmentsXUI.Contains(segment))
		{
			GripSegmentsXUI.Remove(segment);
		}
		else
		{
			GripSegmentsYUI.Remove(segment);
		}
		base.SaveButton.RaiseCanExecuteChanged();
	}

	private void CleanupReferences()
	{
		loadedRectangularRack = null;
		GripSegmentsXUI = null;
		GripSegmentsYUI = null;
	}
}
