using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class StarFlexCarrierPropertiesViewModel : ViewModelBase
{
	private StarCarrier starCarrier;

	public StarCarrier StarCarrier
	{
		get
		{
			return starCarrier;
		}
		private set
		{
			((ObservableObject)this).Set<StarCarrier>((Expression<Func<StarCarrier>>)(() => StarCarrier), ref starCarrier, value);
		}
	}

	public RelayCommand BrowseImage { get; }

	public RelayCommand BrowseBitmap { get; }

	public StarFlexCarrierPropertiesViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		BrowseImage = new RelayCommand((Action)ExecuteBrowseImage, false);
		BrowseBitmap = new RelayCommand((Action)ExecuteBrowseBitmap, false);
		Messenger.Default.Register<FlexCarrierMessage>((object)this, (object)"SetStarFlexCarrierReferences", (Action<FlexCarrierMessage>)SetFlexCarrierReferences, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"ResetStarFlexCarrierReferences", (Action<NotificationMessage>)delegate
		{
			ResetFlexCarrierReferences();
		}, false);
	}

	~StarFlexCarrierPropertiesViewModel()
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
			starCarrier.Image = openFileDialog.FileName;
		}
		openFileDialog = null;
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"StarFlexPictureScroll");
	}

	private void ExecuteBrowseBitmap()
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.Filter = "Bitmap|*.bmp";
		openFileDialog.InitialDirectory = HxRegHelper.LabwarePath;
		if (openFileDialog.ShowDialog() == true)
		{
			starCarrier.Bitmap = openFileDialog.FileName;
		}
		openFileDialog = null;
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"StarFlexBitmapScroll");
	}

	private void SetFlexCarrierReferences(FlexCarrierMessage msg)
	{
		StarCarrier = msg.Carrier as StarCarrier;
	}

	private void ResetFlexCarrierReferences()
	{
		starCarrier = null;
	}
}
