using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.ViewModel;

namespace HxLabwrEd2.StaticHelpers;

internal static class RackNewContainerHelper
{
	private static ViewModelBase rackViewModel;

	public static bool IsCreatingContainerForRack
	{
		get
		{
			if (rackViewModel == null)
			{
				return false;
			}
			return true;
		}
	}

	public static void Start()
	{
		rackViewModel = SimpleIoc.Default.GetInstance<ApplicationViewModel>().DisplayedViewModel;
		if (rackViewModel is LoadedViewModelBase)
		{
			(rackViewModel as LoadedViewModelBase).LockVisuals = true;
		}
		else if (rackViewModel is CreationViewModelBase)
		{
			(rackViewModel as CreationViewModelBase).LockVisuals = true;
		}
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationContainerViewModel>()), (object)"Navigation");
		Messenger.Default.Send<GenericMessage<Container>>(new GenericMessage<Container>(new Container()), (object)"CreateContainer");
	}

	public static void Exit()
	{
		if (rackViewModel is LoadedViewModelBase)
		{
			(rackViewModel as LoadedViewModelBase).LockVisuals = false;
		}
		else if (rackViewModel is CreationViewModelBase)
		{
			(rackViewModel as CreationViewModelBase).LockVisuals = false;
		}
		NavigateToRackViewModel();
		rackViewModel = null;
	}

	public static void Finish(string createdContainerPath)
	{
		GenericMessage<string> val = new GenericMessage<string>(createdContainerPath);
		if (rackViewModel is LoadedRectangularRackViewModel)
		{
			Messenger.Default.Send<GenericMessage<string>>(val, (object)"NewContainerLoadedRectangularRack");
		}
		else if (rackViewModel is LoadedCircularRackViewModel)
		{
			Messenger.Default.Send<GenericMessage<string>>(val, (object)"NewContainerLoadedCircularRack");
		}
		else if (rackViewModel is CreationMicrotiterPlateViewModel)
		{
			Messenger.Default.Send<GenericMessage<string>>(val, (object)"NewContainerCreationMicrotiterPlate");
		}
		else if (rackViewModel is CreationRegularRackViewModel)
		{
			Messenger.Default.Send<GenericMessage<string>>(val, (object)"NewContainerCreationRegularRack");
		}
		else if (rackViewModel is CreationIrregularRackViewModel)
		{
			Messenger.Default.Send<GenericMessage<string>>(val, (object)"NewContainerCreationIrregularRack");
		}
		else if (rackViewModel is CreationCircularRackViewModel)
		{
			Messenger.Default.Send<GenericMessage<string>>(val, (object)"NewContainerCreationCicularRack");
		}
		if (rackViewModel is LoadedViewModelBase)
		{
			(rackViewModel as LoadedViewModelBase).LockVisuals = false;
		}
		if (rackViewModel is CreationViewModelBase)
		{
			(rackViewModel as CreationViewModelBase).LockVisuals = false;
		}
		NavigateToRackViewModel();
		rackViewModel = null;
	}

	private static void NavigateToRackViewModel()
	{
		if (rackViewModel is LoadedCircularRackViewModel)
		{
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedCircularRackViewModel>()), (object)"Navigation");
		}
		else if (rackViewModel is LoadedRectangularRackViewModel)
		{
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedRectangularRackViewModel>()), (object)"Navigation");
		}
		else if (rackViewModel is CreationMicrotiterPlateViewModel)
		{
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationMicrotiterPlateViewModel>()), (object)"Navigation");
		}
		else if (rackViewModel is CreationRegularRackViewModel)
		{
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationRegularRackViewModel>()), (object)"Navigation");
		}
		else if (rackViewModel is CreationIrregularRackViewModel)
		{
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationIrregularRackViewModel>()), (object)"Navigation");
		}
		else if (rackViewModel is CreationCircularRackViewModel)
		{
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationCircularRackViewModel>()), (object)"Navigation");
		}
	}
}
