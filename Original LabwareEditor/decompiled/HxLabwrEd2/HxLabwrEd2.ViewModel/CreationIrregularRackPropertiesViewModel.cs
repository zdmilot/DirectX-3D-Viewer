using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class CreationIrregularRackPropertiesViewModel : ViewModelBase
{
	private RectangularRack rectangularRack;

	private string settingsButtonContent;

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

	public string SettingsButtonContent
	{
		get
		{
			return settingsButtonContent;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => SettingsButtonContent), ref settingsButtonContent, value);
		}
	}

	public RelayCommand LaunchGripSegmentsDialog { get; }

	public RelayCommand LaunchCoverDialog { get; }

	public RelayCommand LaunchIrregularPatternDialog { get; }

	public CreationIrregularRackPropertiesViewModel()
	{
		//IL_006b: Unknown result type (might be due to invalid IL or missing references)
		//IL_0075: Expected O, but got Unknown
		//IL_0083: Unknown result type (might be due to invalid IL or missing references)
		//IL_008d: Expected O, but got Unknown
		//IL_009b: Unknown result type (might be due to invalid IL or missing references)
		//IL_00a5: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<RectangularRack>>((object)this, (object)"DisplayThisIrregularRectangularRack", (Action<GenericMessage<RectangularRack>>)delegate(GenericMessage<RectangularRack> msg)
		{
			LoadRack(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"UnloadThisIrregularRectangularRack", (Action<NotificationMessage>)delegate
		{
			ResetReferences();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RedrawIrregularRectangularRack", (Action<NotificationMessage>)delegate
		{
			RectangularRack?.TriggerRedraw();
		}, false);
		LaunchGripSegmentsDialog = new RelayCommand((Action)ExecuteLaunchGripSegmentsDialog, false);
		LaunchCoverDialog = new RelayCommand((Action)ExecuteLaunchCoverDialog, false);
		LaunchIrregularPatternDialog = new RelayCommand((Action)ExecuteLaunchIrregularPatternDialog, false);
	}

	~CreationIrregularRackPropertiesViewModel()
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
		SettingsButtonContent = "Add Wells";
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

	private void ExecuteLaunchIrregularPatternDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Irregular Pattern", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogRackIrregularPatternViewModel>(), rectangularRack, 0.35, 0.9);
		if (flag.HasValue && flag == true)
		{
			if (rectangularRack.RackWells.Count > 0)
			{
				SettingsButtonContent = "Edit Well Settings";
			}
			else
			{
				SettingsButtonContent = "Add Wells";
			}
			rectangularRack.TriggerRedraw();
		}
	}
}
