using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.DialogWindows;
using HxLabwrEd2.Model;
using HxLabwrEd2.ViewModel;
using Microsoft.Win32;

namespace HxLabwrEd2.StaticHelpers;

public static class DialogWindowHelper
{
	private static DialogService dialogService;

	private static OpenFileDialog openFileDialog;

	public static bool? ShowDialogWithProportionalDimensions(string dialogTitle, ViewModelBase viewModel, object setupData, double proportionToParentWidth, double proportionToParentHeight)
	{
		dialogService = new DialogService();
		RequestDialog(viewModel, setupData);
		bool? result = dialogService.ShowDialogWithProportionalDimensions(dialogTitle, viewModel, proportionToParentWidth, proportionToParentHeight);
		dialogService = null;
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnshadowApplication");
		return result;
	}

	public static bool? ShowDialogWithAbsoluteDimensions(string dialogTitle, ViewModelBase viewModel, object setupData, int width, int height)
	{
		dialogService = new DialogService();
		RequestDialog(viewModel, setupData);
		bool? result = dialogService.ShowDialogWithAbsoluteDimensions(dialogTitle, viewModel, width, height);
		dialogService = null;
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnshadowApplication");
		return result;
	}

	public static bool? ShowOpenFileDialog(OpenFileDialog dialog)
	{
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ShadowApplication");
		openFileDialog = dialog;
		bool? result = dialog.ShowDialog();
		openFileDialog = null;
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnshadowApplication");
		return result;
	}

	public static bool IsDialogDisplayed()
	{
		if (openFileDialog != null || dialogService != null)
		{
			return true;
		}
		return false;
	}

	private static void RequestDialog(ViewModelBase viewModel, object setupData)
	{
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ShadowApplication");
		if (viewModel is DialogCategoriesViewModel)
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>(setupData as Labware), (object)"DialogCategoriesSetup");
		}
		else if (viewModel is DialogContainerSegmentsViewModel)
		{
			Messenger.Default.Send<GenericMessage<Container>>(new GenericMessage<Container>(setupData as Container), (object)"DialogContainerSegmentsSetup");
		}
		else if (viewModel is DialogPropertiesViewModel)
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>(setupData as Labware), (object)"DialogPropertiesSetup");
		}
		else if (viewModel is DialogRackContainersViewModel)
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>(setupData as Labware), (object)"DialogRackContainersSetup");
		}
		else if (viewModel is DialogRectangularRackCoverViewModel)
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>(setupData as Labware), (object)"DialogRackCoverSetup");
		}
		else if (viewModel is DialogRackGripSegmentsViewModel)
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>(setupData as Labware), (object)"DialogRackGripSegmentsSetup");
		}
		else if (viewModel is DialogRackIrregularPatternViewModel)
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>(setupData as Labware), (object)"DialogRackIrregularPatternSetup");
		}
		else if (viewModel is DialogRackRegularPatternViewModel)
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>(setupData as Labware), (object)"DialogRackRegularPatternSetup");
		}
		else if (viewModel is DialogCircularRackSettingsViewModel)
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>(setupData as Labware), (object)"DialogCircularRackSettingsSetup");
		}
		else if (viewModel is DialogCircularRackSegmentsViewModel)
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>(setupData as Labware), (object)"DialogCircularRackSegmentsSetup");
		}
		else if (viewModel is DialogSimpleWarningViewModel)
		{
			((DialogSimpleWarningViewModel)(object)viewModel).WarningText = setupData as string;
		}
		else if (viewModel is DialogTemplateSitesViewModel)
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>(setupData as Labware), (object)"DialogTemplateSitesSetup");
		}
		else if (viewModel is DialogUnsavedChangesViewModel)
		{
			((DialogUnsavedChangesViewModel)(object)viewModel).DialogTextOption = (UnsavedChangesDialogExitText)setupData;
		}
		else if (viewModel is DialogFilterNamingViewModel)
		{
			Messenger.Default.Send<GenericMessage<object>>(new GenericMessage<object>(setupData), (object)"DialogFilterNamingSetup");
		}
	}
}
