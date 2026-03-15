using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class LoadedContainerGeneralPropertiesViewModel : ViewModelBase
{
	private Container loadedContainer;

	public Container LoadedContainer
	{
		get
		{
			return loadedContainer;
		}
		set
		{
			((ObservableObject)this).Set<Container>((Expression<Func<Container>>)(() => LoadedContainer), ref loadedContainer, value);
		}
	}

	public RelayCommand BrowseModel { get; }

	public LoadedContainerGeneralPropertiesViewModel()
	{
		//IL_004e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0058: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<Container>>((object)this, (object)"DisplayThisContainer", (Action<GenericMessage<Container>>)delegate(GenericMessage<Container> msg)
		{
			LoadContainer(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"UnloadThisContainer", (Action<NotificationMessage>)delegate
		{
			ResetReferences();
		}, false);
		BrowseModel = new RelayCommand((Action)ExecuteBrowseModel, false);
	}

	~LoadedContainerGeneralPropertiesViewModel()
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

	private void LoadContainer(Container loadedContainer)
	{
		LoadedContainer = loadedContainer;
	}

	private void ResetReferences()
	{
		LoadedContainer = null;
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
			loadedContainer.Model = fileName;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ContainerGeneralPropertiesModelScroll");
		}
	}
}
