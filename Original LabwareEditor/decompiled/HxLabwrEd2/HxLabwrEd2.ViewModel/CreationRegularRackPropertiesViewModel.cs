using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class CreationRegularRackPropertiesViewModel : ViewModelBase
{
	private RectangularRack rectangularRack;

	public RectangularRack RectangularRack
	{
		get
		{
			return rectangularRack;
		}
		set
		{
			((ObservableObject)this).Set<RectangularRack>((Expression<Func<RectangularRack>>)(() => RectangularRack), ref rectangularRack, value);
		}
	}

	public RelayCommand LaunchGripSegmentsDialog { get; }

	public RelayCommand LaunchCoverDialog { get; }

	public RelayCommand LaunchRegularPatternDialog { get; }

	public CreationRegularRackPropertiesViewModel()
	{
		//IL_004e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0058: Expected O, but got Unknown
		//IL_0066: Unknown result type (might be due to invalid IL or missing references)
		//IL_0070: Expected O, but got Unknown
		//IL_007e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0088: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<RectangularRack>>((object)this, (object)"DisplayThisRegularRectangularRack", (Action<GenericMessage<RectangularRack>>)delegate(GenericMessage<RectangularRack> msg)
		{
			LoadRack(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"UnloadThisRegularRectangularRack", (Action<NotificationMessage>)delegate
		{
			ResetReferences();
		}, false);
		LaunchGripSegmentsDialog = new RelayCommand((Action)ExecuteLaunchGripSegmentsDialog, false);
		LaunchCoverDialog = new RelayCommand((Action)ExecuteLaunchCoverDialog, false);
		LaunchRegularPatternDialog = new RelayCommand((Action)ExecuteLaunchRegularPatternDialog, false);
	}

	~CreationRegularRackPropertiesViewModel()
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

	private void LoadRack(RectangularRack rectangularRack)
	{
		RectangularRack = rectangularRack;
	}

	private void ResetReferences()
	{
		RectangularRack = null;
	}

	private void ExecuteLaunchGripSegmentsDialog()
	{
		DialogWindowHelper.ShowDialogWithProportionalDimensions("Grip Segments", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogRackGripSegmentsViewModel>(), rectangularRack, 0.75, 0.95);
	}

	private void ExecuteLaunchCoverDialog()
	{
		DialogWindowHelper.ShowDialogWithProportionalDimensions("Cover", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogRectangularRackCoverViewModel>(), rectangularRack, 0.45, 0.9);
	}

	private void ExecuteLaunchRegularPatternDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Regular Pattern", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogRackRegularPatternViewModel>(), rectangularRack, 0.97, 0.7);
		if (flag.HasValue && flag == true)
		{
			rectangularRack.RegenerateRackWells();
			rectangularRack.TriggerRedraw();
		}
	}
}
