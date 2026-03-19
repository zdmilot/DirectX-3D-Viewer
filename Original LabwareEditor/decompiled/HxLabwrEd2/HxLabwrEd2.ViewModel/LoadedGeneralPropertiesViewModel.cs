using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class LoadedGeneralPropertiesViewModel : ViewModelBase
{
	private Labware _loadedLabware;

	public Labware LoadedLabware
	{
		get
		{
			return _loadedLabware;
		}
		set
		{
			((ObservableObject)this).Set<Labware>((Expression<Func<Labware>>)(() => LoadedLabware), ref _loadedLabware, value);
		}
	}

	public RelayCommand BrowseImage { get; }

	public RelayCommand BrowseBitmap { get; }

	public RelayCommand BrowseModel { get; }

	public LoadedGeneralPropertiesViewModel()
	{
		//IL_004e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0058: Expected O, but got Unknown
		//IL_0066: Unknown result type (might be due to invalid IL or missing references)
		//IL_0070: Expected O, but got Unknown
		//IL_007e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0088: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"LoadGeneralProperties", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			LoadedLabware = msg.Content;
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"UnloadGeneralProperties", (Action<NotificationMessage>)delegate
		{
			ResetReferences();
		}, false);
		BrowseImage = new RelayCommand((Action)ExecuteBrowseImage, false);
		BrowseBitmap = new RelayCommand((Action)ExecuteBrowseBitmap, false);
		BrowseModel = new RelayCommand((Action)ExecuteBrowseModel, false);
	}

	~LoadedGeneralPropertiesViewModel()
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

	private void ResetReferences()
	{
		LoadedLabware = null;
	}

	private void ExecuteBrowseImage()
	{
		DragDropFileLoadHelper.OpenFileDlgReference = new OpenFileDialog
		{
			Filter = "Image|*.png",
			InitialDirectory = HxRegHelper.LabwarePath
		};
		bool? flag = DragDropFileLoadHelper.OpenFileDlgReference.ShowDialog();
		string fileName = DragDropFileLoadHelper.OpenFileDlgReference.FileName;
		DragDropFileLoadHelper.OpenFileDlgReference = null;
		if (flag == true)
		{
			LoadedLabware.Image = fileName;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"GeneralPropertiesPictureScroll");
		}
	}

	private void ExecuteBrowseBitmap()
	{
		DragDropFileLoadHelper.OpenFileDlgReference = new OpenFileDialog
		{
			Filter = "Bitmap|*.bmp",
			InitialDirectory = HxRegHelper.LabwarePath
		};
		bool? flag = DragDropFileLoadHelper.OpenFileDlgReference.ShowDialog();
		string fileName = DragDropFileLoadHelper.OpenFileDlgReference.FileName;
		DragDropFileLoadHelper.OpenFileDlgReference = null;
		if (flag == true)
		{
			LoadedLabware.Bitmap = fileName;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"GeneralPropertiesBitmapScroll");
		}
	}

	private void ExecuteBrowseModel()
	{
		DragDropFileLoadHelper.OpenFileDlgReference = new OpenFileDialog
		{
			Filter = "3D Model (*.x, *.hxx, *.gltf)|*.x;*.hxx;*.gltf",
			InitialDirectory = HxRegHelper.LabwarePath
		};
		bool? flag = DragDropFileLoadHelper.OpenFileDlgReference.ShowDialog();
		string fileName = DragDropFileLoadHelper.OpenFileDlgReference.FileName;
		DragDropFileLoadHelper.OpenFileDlgReference = null;
		if (flag == true)
		{
			LoadedLabware.Model = fileName;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"GeneralPropertiesModelScroll");
		}
	}
}
