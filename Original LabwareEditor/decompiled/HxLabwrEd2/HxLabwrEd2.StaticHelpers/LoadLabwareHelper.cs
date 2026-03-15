using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.Model;
using HxLabwrEd2.ViewModel;

namespace HxLabwrEd2.StaticHelpers;

internal static class LoadLabwareHelper
{
	public static void LoadLabware(string labwareFilePath)
	{
		Labware labware = ConfigFileReader.ReadLabwareFromFile(labwareFilePath);
		if (labware != null)
		{
			if (labware is Template)
			{
				Messenger.Default.Send<GenericMessage<Template>>(new GenericMessage<Template>(labware as Template), (object)"LoadThisTemplate");
				Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedTemplateViewModel>()), (object)"Navigation");
			}
			else if (labware is RectangularRack)
			{
				Messenger.Default.Send<GenericMessage<RectangularRack>>(new GenericMessage<RectangularRack>(labware as RectangularRack), (object)"LoadThisRectangularRack");
				Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedRectangularRackViewModel>()), (object)"Navigation");
			}
			else if (labware is Container)
			{
				Messenger.Default.Send<GenericMessage<Container>>(new GenericMessage<Container>(labware as Container), (object)"LoadThisContainer");
				Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedContainerViewModel>()), (object)"Navigation");
			}
			else if (labware is CircularRack)
			{
				Messenger.Default.Send<GenericMessage<CircularRack>>(new GenericMessage<CircularRack>(labware as CircularRack), (object)"LoadThisCircularRack");
				Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedCircularRackViewModel>()), (object)"Navigation");
			}
		}
	}
}
