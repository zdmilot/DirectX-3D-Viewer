using System;
using System.Linq;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class CreationCircularRackPropertiesViewModel : ViewModelBase
{
	private CircularRack _circularRack;

	public CircularRack CircularRack
	{
		get
		{
			return _circularRack;
		}
		set
		{
			((ObservableObject)this).Set<CircularRack>((Expression<Func<CircularRack>>)(() => CircularRack), ref _circularRack, value);
		}
	}

	public string SegmentButtonText
	{
		get
		{
			if (CircularRack == null || !CircularRack.Segments.Any())
			{
				return "Add Segments";
			}
			return "Edit Segments";
		}
	}

	public RelayCommand LaunchSegmentEditorDialog { get; }

	public RelayCommand LaunchSettingsDialog { get; }

	public CreationCircularRackPropertiesViewModel()
	{
		//IL_004e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0058: Expected O, but got Unknown
		//IL_0066: Unknown result type (might be due to invalid IL or missing references)
		//IL_0070: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<CircularRack>>((object)this, (object)"DisplayThisCircularRack", (Action<GenericMessage<CircularRack>>)delegate(GenericMessage<CircularRack> msg)
		{
			LoadRack(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"UnloadThisCircularRack", (Action<NotificationMessage>)delegate
		{
			ResetReferences();
		}, false);
		LaunchSegmentEditorDialog = new RelayCommand((Action)ExecuteLaunchSegmentEditorDialog, false);
		LaunchSettingsDialog = new RelayCommand((Action)ExecuteLaunchSettingsDialog, false);
	}

	~CreationCircularRackPropertiesViewModel()
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

	private void LoadRack(CircularRack circularRack)
	{
		CircularRack = circularRack;
		CircularRack.Segments.CollectionChanged += delegate
		{
			((ObservableObject)this).RaisePropertyChanged("SegmentButtonText");
		};
	}

	private void ResetReferences()
	{
		CircularRack = null;
	}

	private void ExecuteLaunchSegmentEditorDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Edit Segments", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogCircularRackSegmentsViewModel>(), _circularRack, 0.8, 0.9);
		if (flag.HasValue && flag == true)
		{
			_circularRack.RegenerateRackWells();
			_circularRack.TriggerRedraw();
		}
	}

	private void ExecuteLaunchSettingsDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithAbsoluteDimensions("Circular Pattern", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogCircularRackSettingsViewModel>(), _circularRack, 1100, 500);
		if (flag.HasValue && flag == true)
		{
			_circularRack.RegenerateRackWells();
			_circularRack.TriggerRedraw();
		}
	}
}
