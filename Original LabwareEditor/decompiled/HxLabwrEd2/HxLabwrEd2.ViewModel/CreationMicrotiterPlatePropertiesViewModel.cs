using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class CreationMicrotiterPlatePropertiesViewModel : ViewModelBase
{
	private RectangularRack rectangularRack;

	private string gripButtonText;

	private string coverButtonText;

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

	public string GripButtonText
	{
		get
		{
			return gripButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => GripButtonText), ref gripButtonText, value);
		}
	}

	public string CoverButtonText
	{
		get
		{
			return coverButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => CoverButtonText), ref coverButtonText, value);
		}
	}

	public RelayCommand LaunchGripSegmentsDialog { get; }

	public RelayCommand LaunchCoverDialog { get; }

	public RelayCommand FilePath { get; }

	public RelayCommand NewContainer { get; }

	public CreationMicrotiterPlatePropertiesViewModel()
	{
		//IL_004e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0058: Expected O, but got Unknown
		//IL_0066: Unknown result type (might be due to invalid IL or missing references)
		//IL_0070: Expected O, but got Unknown
		//IL_007e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0088: Expected O, but got Unknown
		//IL_0096: Unknown result type (might be due to invalid IL or missing references)
		//IL_00a0: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<RectangularRack>>((object)this, (object)"DisplayThisMicrotiterPlate", (Action<GenericMessage<RectangularRack>>)delegate(GenericMessage<RectangularRack> msg)
		{
			LoadRack(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"UnloadThisMicrotiterPlate", (Action<NotificationMessage>)delegate
		{
			ResetReferences();
		}, false);
		LaunchGripSegmentsDialog = new RelayCommand((Action)ExecuteLaunchGripSegmentsDialog, false);
		LaunchCoverDialog = new RelayCommand((Action)ExecuteLaunchCoverDialog, false);
		FilePath = new RelayCommand((Action)ExecuteFilePath, false);
		NewContainer = new RelayCommand((Action)ExecuteNewContainer, false);
	}

	~CreationMicrotiterPlatePropertiesViewModel()
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
		GripButtonText = "Edit Grip Segments";
		CoverButtonText = "Edit Cover";
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

	private void ExecuteFilePath()
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.Filter = "Container|*.ctr";
		openFileDialog.InitialDirectory = HxRegHelper.LabwarePath;
		if (openFileDialog.ShowDialog() == true)
		{
			RectangularRack.SingleRepeatingContainer.FilePath = openFileDialog.FileName;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"MicrotiterPlateContainerPathScroll");
		}
	}

	private void ExecuteNewContainer()
	{
		RackNewContainerHelper.Start();
	}
}
