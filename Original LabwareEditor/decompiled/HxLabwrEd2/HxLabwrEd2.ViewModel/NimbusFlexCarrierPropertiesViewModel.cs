using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class NimbusFlexCarrierPropertiesViewModel : ViewModelBase
{
	private NimbusCarrier nimbusCarrier;

	public NimbusCarrier NimbusCarrier
	{
		get
		{
			return nimbusCarrier;
		}
		private set
		{
			((ObservableObject)this).Set<NimbusCarrier>((Expression<Func<NimbusCarrier>>)(() => NimbusCarrier), ref nimbusCarrier, value);
		}
	}

	public RelayCommand BrowseImage { get; }

	public RelayCommand BrowseBitmap { get; }

	public NimbusFlexCarrierPropertiesViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		BrowseImage = new RelayCommand((Action)ExecuteBrowseImage, false);
		BrowseBitmap = new RelayCommand((Action)ExecuteBrowseBitmap, false);
		Messenger.Default.Register<FlexCarrierMessage>((object)this, (object)"SetNimbusFlexCarrierReferences", (Action<FlexCarrierMessage>)SetFlexCarrierReferences, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"ResetNimbusFlexCarrierReferences", (Action<NotificationMessage>)delegate
		{
			ResetFlexCarrierReferences();
		}, false);
	}

	~NimbusFlexCarrierPropertiesViewModel()
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

	private void ExecuteBrowseImage()
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.Filter = "Image|*.png";
		openFileDialog.InitialDirectory = HxRegHelper.LabwarePath;
		if (openFileDialog.ShowDialog() == true)
		{
			nimbusCarrier.Image = openFileDialog.FileName;
		}
		openFileDialog = null;
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"NimbusFlexPictureScroll");
	}

	private void ExecuteBrowseBitmap()
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.Filter = "Bitmap|*.bmp";
		openFileDialog.InitialDirectory = HxRegHelper.LabwarePath;
		if (openFileDialog.ShowDialog() == true)
		{
			nimbusCarrier.Bitmap = openFileDialog.FileName;
		}
		openFileDialog = null;
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"NimbusFlexBitmapScroll");
	}

	private void SetFlexCarrierReferences(FlexCarrierMessage msg)
	{
		NimbusCarrier = msg.Carrier as NimbusCarrier;
	}

	private void ResetFlexCarrierReferences()
	{
		nimbusCarrier = null;
	}
}
