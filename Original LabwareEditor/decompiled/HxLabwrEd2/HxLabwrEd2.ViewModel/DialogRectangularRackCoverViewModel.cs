using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.DialogWindows;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class DialogRectangularRackCoverViewModel : DialogViewModelBase
{
	private RectangularRack rectangularRackPartialDuplicate;

	private RectangularRack loadedRectangularRack;

	public RectangularRack RectangularRackPartialDuplicate
	{
		get
		{
			return rectangularRackPartialDuplicate;
		}
		set
		{
			((ObservableObject)this).Set<RectangularRack>((Expression<Func<RectangularRack>>)(() => RectangularRackPartialDuplicate), ref rectangularRackPartialDuplicate, value);
		}
	}

	public RelayCommand BrowseBitmap { get; }

	public RelayCommand BrowseModel { get; }

	public DialogRectangularRackCoverViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		//IL_0044: Unknown result type (might be due to invalid IL or missing references)
		//IL_004e: Expected O, but got Unknown
		//IL_005c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0066: Expected O, but got Unknown
		base.CancelCloseButton = new RelayCommand((Action)ExecuteCancelCloseButton, false);
		base.SaveButton = new RelayCommand((Action)ExecuteSaveButton, false);
		BrowseBitmap = new RelayCommand((Action)ExecuteBrowseBitmap, false);
		BrowseModel = new RelayCommand((Action)ExecuteBrowseModel, false);
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"DialogRackCoverSetup", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			SetupLoadedLabware(msg.Content);
		}, false);
	}

	~DialogRectangularRackCoverViewModel()
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
		RectangularRackPartialDuplicate.Cover = new Cover(loadedRectangularRack.Cover);
		RectangularRackPartialDuplicate.ReadOnly = loadedRectangularRack.ReadOnly;
		RectangularRackPartialDuplicate.DataChanged = false;
	}

	private void ExecuteCancelCloseButton()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: false);
		InvokeRequestCloseDialog(e);
		loadedRectangularRack = null;
		rectangularRackPartialDuplicate = null;
	}

	private void ExecuteSaveButton()
	{
		if (rectangularRackPartialDuplicate.Cover.RackBaseToCoverBase != loadedRectangularRack.Cover.RackBaseToCoverBase)
		{
			rectangularRackPartialDuplicate.Cover.Thickness = Math.Round(rectangularRackPartialDuplicate.Cover.Dimensions.Z - (loadedRectangularRack.Dimensions.Z - rectangularRackPartialDuplicate.Cover.RackBaseToCoverBase), 2, MidpointRounding.AwayFromZero);
		}
		if (rectangularRackPartialDuplicate.Cover.OverriddenExtent.X == loadedRectangularRack.Dimensions.X && rectangularRackPartialDuplicate.Cover.OverriddenExtent.Y == loadedRectangularRack.Dimensions.Y)
		{
			rectangularRackPartialDuplicate.Cover.OverrideExtent = false;
		}
		if (!rectangularRackPartialDuplicate.Cover.OverrideExtent)
		{
			rectangularRackPartialDuplicate.Cover.OverriddenExtent.X = loadedRectangularRack.Dimensions.X;
			rectangularRackPartialDuplicate.Cover.OverriddenExtent.Y = loadedRectangularRack.Dimensions.Y;
		}
		loadedRectangularRack.Cover = rectangularRackPartialDuplicate.Cover;
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
		loadedRectangularRack = null;
		rectangularRackPartialDuplicate = null;
	}

	private void ExecuteBrowseBitmap()
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.Filter = "Bitmap|*.bmp";
		openFileDialog.InitialDirectory = HxRegHelper.LabwarePath;
		if (openFileDialog.ShowDialog() == true)
		{
			RectangularRackPartialDuplicate.Cover.Bitmap = openFileDialog.FileName;
		}
		openFileDialog = null;
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"RackCoverBitmapScroll");
	}

	private void ExecuteBrowseModel()
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.Filter = "3D Model (*.x, *.hxx, *.gltf)|*.x;*.hxx;*.gltf";
		openFileDialog.InitialDirectory = HxRegHelper.LabwarePath;
		if (openFileDialog.ShowDialog() == true)
		{
			RectangularRackPartialDuplicate.Cover.Model = openFileDialog.FileName;
		}
		openFileDialog = null;
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"RackCoverModelScroll");
	}
}
