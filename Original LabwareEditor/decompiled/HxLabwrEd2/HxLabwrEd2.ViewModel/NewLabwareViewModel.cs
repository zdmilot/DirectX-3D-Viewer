using System;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.CommandWpf;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class NewLabwareViewModel : ViewModelBase
{
	public RelayCommand NavToTitlePageVM { get; }

	public RelayCommand NavToNimbusCarrierTypeVM { get; }

	public RelayCommand NavToStarCarrierTypeVM { get; }

	public RelayCommand NavToContainerCreationVM { get; }

	public RelayCommand NavToMicrotiterPlateCreationVM { get; }

	public RelayCommand NavToRegularRectangularRackCreationVM { get; }

	public RelayCommand NavToIrregularRectangularRackCreationVM { get; }

	public RelayCommand NavToCustomTemplateCreationVM { get; }

	public RelayCommand NavToCircularRackCreationVM { get; }

	public bool StarInstrumentPresent { get; }

	public bool NimbusInstrumentPresent { get; }

	public NewLabwareViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		//IL_0044: Unknown result type (might be due to invalid IL or missing references)
		//IL_004e: Expected O, but got Unknown
		//IL_005c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0066: Expected O, but got Unknown
		//IL_0074: Unknown result type (might be due to invalid IL or missing references)
		//IL_007e: Expected O, but got Unknown
		//IL_008c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0096: Expected O, but got Unknown
		//IL_00a4: Unknown result type (might be due to invalid IL or missing references)
		//IL_00ae: Expected O, but got Unknown
		//IL_00bc: Unknown result type (might be due to invalid IL or missing references)
		//IL_00c6: Expected O, but got Unknown
		//IL_00d4: Unknown result type (might be due to invalid IL or missing references)
		//IL_00de: Expected O, but got Unknown
		NavToTitlePageVM = new RelayCommand((Action)ExecuteNavToTitlePageVM, false);
		NavToNimbusCarrierTypeVM = new RelayCommand((Action)ExecuteNavToNimbusCarrierTypeVM, false);
		NavToStarCarrierTypeVM = new RelayCommand((Action)ExecuteNavToStarCarrierTypeVM, false);
		NavToContainerCreationVM = new RelayCommand((Action)ExecuteNavToContainerCreationVM, false);
		NavToMicrotiterPlateCreationVM = new RelayCommand((Action)ExecuteNavToMicrotiterPlateCreationVM, false);
		NavToRegularRectangularRackCreationVM = new RelayCommand((Action)ExecuteNavToRegularRectangularRackCreationVM, false);
		NavToIrregularRectangularRackCreationVM = new RelayCommand((Action)ExecuteNavToIrregularRectangularRackCreationVM, false);
		NavToCustomTemplateCreationVM = new RelayCommand((Action)ExecuteNavToCustomTemplateCreationVM, false);
		NavToCircularRackCreationVM = new RelayCommand((Action)ExecuteNavToCircularRackCreationVM, false);
		StarInstrumentPresent = HxRegHelper.StarInstrumentPresent;
		NimbusInstrumentPresent = HxRegHelper.NimbusInstrumentPresent;
	}

	private void ExecuteNavToTitlePageVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<TitlePageViewModel>()), (object)"Navigation");
	}

	private void ExecuteNavToNimbusCarrierTypeVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<NimbusCarrierTypeViewModel>()), (object)"Navigation");
	}

	private void ExecuteNavToStarCarrierTypeVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<StarCarrierTypeViewModel>()), (object)"Navigation");
	}

	private void ExecuteNavToContainerCreationVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationContainerViewModel>()), (object)"Navigation");
		Messenger.Default.Send<GenericMessage<Container>>(new GenericMessage<Container>(new Container()), (object)"CreateContainer");
	}

	private void ExecuteNavToMicrotiterPlateCreationVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationMicrotiterPlateViewModel>()), (object)"Navigation");
		Messenger.Default.Send<GenericMessage<RectangularRack>>(new GenericMessage<RectangularRack>(NewLabwareWithDefaultsHelper.MicrotiterPlate()), (object)"CreateMicrotiterPlate");
	}

	private void ExecuteNavToRegularRectangularRackCreationVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationRegularRackViewModel>()), (object)"Navigation");
		Messenger.Default.Send<GenericMessage<RectangularRack>>(new GenericMessage<RectangularRack>(NewLabwareWithDefaultsHelper.RegularRectangularRack()), (object)"CreateRegularRectangularRack");
	}

	private void ExecuteNavToIrregularRectangularRackCreationVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationIrregularRackViewModel>()), (object)"Navigation");
		Messenger.Default.Send<GenericMessage<RectangularRack>>(new GenericMessage<RectangularRack>(NewLabwareWithDefaultsHelper.IrregularRectangularRack()), (object)"CreateIrregularRectangularRack");
	}

	private void ExecuteNavToCustomTemplateCreationVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationTemplateCustomViewModel>()), (object)"Navigation");
		Messenger.Default.Send<GenericMessage<Template>>(new GenericMessage<Template>(NewLabwareWithDefaultsHelper.CustomTemplate()), (object)"CreateCustomTemplate");
	}

	private static void ExecuteNavToCircularRackCreationVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationCircularRackViewModel>()), (object)"Navigation");
		Messenger.Default.Send<GenericMessage<CircularRack>>(new GenericMessage<CircularRack>(NewLabwareWithDefaultsHelper.CircularRack()), (object)"CreateCircularRack");
	}
}
