using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.ViewModel;

namespace HxLabwrEd2.StaticHelpers;

internal static class FilteringEditLabwareHelper
{
	public static bool IsEditingLabwareForFiltering { get; set; }

	public static void Start(string labwareFilePath)
	{
		LoadLabwareHelper.LoadLabware(labwareFilePath);
		IsEditingLabwareForFiltering = true;
	}

	public static void Finish()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CategoryFilterManagerViewModel>()), (object)"Navigation");
		IsEditingLabwareForFiltering = false;
	}
}
